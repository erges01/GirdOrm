export interface GirdConfig {
    dbPath: string;
    debug?: boolean;
}
export declare function defineConfig(config: GirdConfig): GirdConfig;
