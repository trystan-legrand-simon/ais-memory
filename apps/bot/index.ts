import { Client, Events, GatewayIntentBits } from "discord.js";
import { DISCORD_BOT_TOKEN } from "./src/config";
import { commands, registerCommands } from "./src/handlers/register-commands";
import { relayMessage } from "./src/events/message-relay";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot connecté en tant que ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Erreur dans la commande /${interaction.commandName} :`, err);
    const content = "Une erreur est survenue lors de l'exécution de la commande.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  relayMessage(message).catch((err) => {
    console.error("Erreur lors du relais du message vers la mission :", err);
  });
});

await registerCommands();
await client.login(DISCORD_BOT_TOKEN);
