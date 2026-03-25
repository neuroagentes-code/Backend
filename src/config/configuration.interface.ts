export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  apiVersion: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

export interface Config {
  database: DatabaseConfig;
  jwt: JwtConfig;
  app: AppConfig;
  throttle: ThrottleConfig;
  email: EmailConfig;
}
