import { Infer } from "../core/table";
export declare const UserTable: import("../core/table").Table<{
    id: number;
    name: string;
    email: string;
    isadmin: boolean;
}>;
export type User = Infer<typeof UserTable> & {
    posts?: any[];
};
