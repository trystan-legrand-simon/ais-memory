import type { Message } from "discord.js";
import { getMissionByChannel, sendMissionMessage } from "../api-client";

// Limite Discord pour le contenu d'un message.
const DISCORD_MESSAGE_LIMIT = 2000;

function truncateForDiscord(text: string): string {
  if (text.length <= DISCORD_MESSAGE_LIMIT) return text;
  const suffix = "\n… (réponse tronquée)";
  return text.slice(0, DISCORD_MESSAGE_LIMIT - suffix.length) + suffix;
}

// Relaie tout message posté dans un canal lié à une mission vers l'agent qui
// la porte, puis poste la réponse complète en un seul message — pas de
// streaming côté Discord (voir docs/superpowers/specs/2026-09-28-discord-integration-design.md).
export async function relayMessage(message: Message): Promise<void> {
  if (message.author.bot) return;

  const mission = await getMissionByChannel(message.channelId);
  if (!mission.ok) return; // Pas de mission sur ce canal — canal Discord ordinaire, on ignore.

  const result = await sendMissionMessage(mission.data.id, message.content);

  if (!result.ok) {
    if (result.status === 409) {
      await message.reply("Une réponse est déjà en cours pour cette mission.");
      return;
    }
    await message.reply(`Erreur : ${result.error}`);
    return;
  }

  await message.reply(truncateForDiscord(result.data.content));
}
