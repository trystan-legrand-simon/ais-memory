function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

export const DISCORD_BOT_TOKEN = requireEnv("DISCORD_BOT_TOKEN");
export const DISCORD_APPLICATION_ID = requireEnv("DISCORD_APPLICATION_ID");
export const API_BASE = process.env.API_BASE ?? "http://localhost:3000/api/v1";
