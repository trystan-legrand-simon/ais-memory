import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getMissionByChannel } from "../api-client";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Affiche le statut de la mission liée à ce canal");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const result = await getMissionByChannel(interaction.channelId);

  if (!result.ok) {
    if (result.status === 404) {
      await interaction.reply({
        content: "Aucune mission liée à ce canal.",
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      content: `Erreur en récupérant le statut : ${result.error}`,
      ephemeral: true,
    });
    return;
  }

  const mission = result.data;
  const messageWord = mission.messageCount > 1 ? "messages" : "message";
  await interaction.reply(
    `**${mission.title}** — agent \`${mission.agentSlug}\`\n` +
      `${mission.messageCount} ${messageWord} échangé${mission.messageCount > 1 ? "s" : ""}` +
      (mission.busy ? " — réponse en cours…" : "")
  );
}
