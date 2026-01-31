export interface GirdConfig {
  dbPath: string;
  debug?: boolean;
}

export function defineConfig(config: GirdConfig) {
  return config;
}