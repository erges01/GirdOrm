import { DBAdapter } from "./adapter";
import "reflect-metadata"; // 👈 CRITICAL: Needed to read relations

export class QueryBuilder {
  private _model: any;
  private _tableName: string;
  private _columns: string[] = []; 
  private _conditions: string[] = [];
  private _params: any[] = [];
  private _joins: string[] = []; 
  private _groupBy: string[] = []; 

  private _adapter?: DBAdapter;
  private _operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" = "SELECT";
  private _data: Record<string, any> = {}; 

  // CHANGED: We now accept the Model Class (e.g., User)
  constructor(model: any, adapter?: DBAdapter) {
    this._model = model;
    this._tableName = model.tableName; // e.g. "users"
    this._adapter = adapter;
    // Default to selecting all from the main table to avoid ambiguous ID errors
    this._columns = [`"${this._tableName}".*`];
  }

  select(...columns: string[]) {
    this._operation = "SELECT";
    if (columns.length > 0 && columns[0] !== "*") {
        this._columns = columns;
    }
    return this;
  }

  // --- THE NEW LOGIC: Reads Metadata ---
  with(relationName: string) {
    // 1. Get relations from the Decorators
    const relations = Reflect.getMetadata("gird:relations", this._model) || [];
    
    // 2. Find the one the user asked for (e.g. "posts")
    const rel = relations.find((r: any) => r.key === relationName);
    
    if (!rel) throw new Error(`Relation '${relationName}' not found on ${this._tableName}`);

    // 3. Get the Related Table Name (Run the function: () => Post)
    const RelatedModel = rel.model();
    const relatedTable = RelatedModel.tableName;

    if (rel.type === "belongsTo") {
        // Post belongsTo User (via authorid)
        // JOIN "users" ON "posts"."authorid" = "users"."id"
        this._joins.push(
            `LEFT JOIN "${relatedTable}" ON "${this._tableName}"."${rel.foreignKey}" = "${relatedTable}"."id"`
        );
        this._columns.push(`to_json("${relatedTable}".*) as "${relationName}"`);
    } 
    else if (rel.type === "hasMany") {
        // User hasMany Posts (via authorid in Post table)
        // JOIN "posts" ON "users"."id" = "posts"."authorid"
        this._joins.push(
            `LEFT JOIN "${relatedTable}" ON "${this._tableName}"."id" = "${relatedTable}"."${rel.foreignKey}"`
        );
        this._columns.push(
            `COALESCE(json_agg("${relatedTable}".*) FILTER (WHERE "${relatedTable}".id IS NOT NULL), '[]') as "${relationName}"`
        );
        this._groupBy.push(`"${this._tableName}".id`);
    }

    return this;
  }

  // --- Prisma-style filters ({ gt: 18 }) ---
  where(conditions: Record<string, any>) {
    Object.entries(conditions).forEach(([key, value]) => {
      // Use quotes for safety: "table"."column"
      const colName = key.includes(".") ? key : `"${this._tableName}"."${key}"`;
      
      // 1. Handle Operators: { age: { gt: 18 } }
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const ops = value as Record<string, any>;
        
        Object.entries(ops).forEach(([op, val]) => {
            this._params.push(val);
            const placeholder = "??"; 
            
            if (op === "gt") this._conditions.push(`${colName} > ${placeholder}`);
            else if (op === "lt") this._conditions.push(`${colName} < ${placeholder}`);
            else if (op === "gte") this._conditions.push(`${colName} >= ${placeholder}`);
            else if (op === "lte") this._conditions.push(`${colName} <= ${placeholder}`);
            else if (op === "contains") this._conditions.push(`${colName} LIKE ${placeholder}`);
        });
      } 
      // 2. Handle Simple Equality: { name: "Tunde" }
      else {
        this._conditions.push(`${colName} = ??`);
        this._params.push(value);
      }
    });
    return this;
  }

  insert(data: Record<string, any>) {
    this._operation = "INSERT";
    this._data = data;
    return this;
  }

  update(data: Record<string, any>) {
    this._operation = "UPDATE";
    this._data = data;
    return this;
  }

  delete() {
    this._operation = "DELETE";
    return this;
  }

  // --- SQL GENERATION ---
  toSQL(): { sql: string; params: any[] } {
    let paramCounter = 0;
    
    // Helper: Generates $1, $2, $3...
    const nextParam = () => {
        paramCounter++;
        return this._adapter ? this._adapter.getPlaceholder(paramCounter - 1) : `$${paramCounter}`;
    };

    // 1. INSERT Logic
    if (this._operation === "INSERT") {
      const keys = Object.keys(this._data);
      const values = Object.values(this._data);
      
      const placeholders = keys.map(() => nextParam()).join(", ");
      const columns = keys.map(k => `"${k}"`).join(", "); 
      
      return {
        sql: `INSERT INTO "${this._tableName}" (${columns}) VALUES (${placeholders}) RETURNING *;`,
        params: values,
      };
    }

    // 2. UPDATE Logic
    if (this._operation === "UPDATE") {
      const keys = Object.keys(this._data);
      const values = Object.values(this._data);
      
      const setClause = keys.map((k) => `"${k}" = ${nextParam()}`).join(", ");
      
      let sql = `UPDATE "${this._tableName}" SET ${setClause}`;
      
      if (this._conditions.length > 0) {
        const whereClause = this._conditions.map(c => c.replace("??", nextParam())).join(" AND ");
        sql += ` WHERE ${whereClause}`;
      }
      
      return { sql: sql + " RETURNING *;", params: [...values, ...this._params] };
    }

    // 3. DELETE Logic
    if (this._operation === "DELETE") {
      let sql = `DELETE FROM "${this._tableName}"`;
      if (this._conditions.length > 0) {
        const whereClause = this._conditions.map(c => c.replace("??", nextParam())).join(" AND ");
        sql += ` WHERE ${whereClause}`;
      }
      return { sql: sql + ";", params: this._params };
    }

    // 4. SELECT Logic
    const selection = this._columns.join(", ");
    let sql = `SELECT ${selection} FROM "${this._tableName}"`;
    
    if (this._joins.length > 0) sql += ` ${this._joins.join(" ")}`;
    
    if (this._conditions.length > 0) {
       const whereClause = this._conditions.map(c => c.replace("??", nextParam())).join(" AND ");
       sql += ` WHERE ${whereClause}`;
    }

    // 5. GROUP BY Logic (Crucial for hasMany)
    if (this._groupBy.length > 0) {
        sql += ` GROUP BY ${this._groupBy.join(", ")}`;
    }
    
    return { sql: sql + ";", params: this._params };
  }
}