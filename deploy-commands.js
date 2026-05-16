const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("bump")
    .setDescription("Bump le serveur"),

  new SlashCommandBuilder()
    .setName("top-bump")
    .setDescription("Voir le classement des bumps"),

  new SlashCommandBuilder()
    .setName("bump-invite")
    .setDescription("Configurer l'invite du serveur"),

  new SlashCommandBuilder()
    .setName("ia")
    .setDescription("Configurer l'IA"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Voir les statistiques du serveur"),

  new SlashCommandBuilder()
    .setName("config-messages")
    .setDescription("Configurer les messages automatiques"),

  new SlashCommandBuilder()
    .setName("rappel-bump")
    .setDescription("Configurer le rappel bump"),

  new SlashCommandBuilder()
    .setName("op-bump")
    .setDescription("Panel administrateur AdminBot")

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

  try {

    console.log("🔄 Déploiement des commandes...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commandes déployées");

  } catch (err) {
    console.error(err);
  }

})();
