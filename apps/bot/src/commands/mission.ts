import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { createMission } from "../api-client";

export const data = new SlashCommandBuilder()
  .setName("mission")
  .setDescription("Gère les missions liées à ce canal")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Lie ce canal à une nouvelle mission")
      .addStringOption((opt) =>
        opt
          .setName("agent")
          .setDescription("Slug de l'agent (.claude/agents/<slug>.md)")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName("titre").setDescription("Titre de la mission").setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.options.getSubcommand() !== "create") return;

  const agentSlug = interaction.options.getString("agent", true);
  const title = interaction.options.getString("titre", true);

  const result = await createMission({
    agentSlug,
    discordChannelId: interaction.channelId,
    title,
  });

  if (!result.ok) {
    await interaction.reply({
      content: `Impossible de créer la mission : ${result.error}`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply(
    `Mission **${result.data.title}** créée sur ce canal, portée par l'agent \`${result.data.agentSlug}\`.`
  );
}
