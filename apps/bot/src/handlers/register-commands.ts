import { REST, Routes } from "discord.js";
import { DISCORD_APPLICATION_ID, DISCORD_BOT_TOKEN } from "../config";
import * as missionCommand from "../commands/mission";
import * as statusCommand from "../commands/status";

export const commands = new Map([
  [missionCommand.data.name, missionCommand],
  [statusCommand.data.name, statusCommand],
]);

export async function registerCommands(): Promise<void> {
  const rest = new REST().setToken(DISCORD_BOT_TOKEN);
  const body = [...commands.values()].map((command) => command.data.toJSON());
  await rest.put(Routes.applicationCommands(DISCORD_APPLICATION_ID), { body });
}
