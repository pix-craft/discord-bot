const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("bump")
    .setDescription("Bump le serveur"),

  new SlashCommandBuilder()
    .setName("top-bump")
    .setDescription("Affiche le top des serveurs"),

  new SlashCommandBuilder()
    .setName("bump-invite")
    .setDescription("Configurer l'invite du serveur"),

  new SlashCommandBuilder()
    .setName("ia")
    .setDescription("Parler avec AdminBot")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Ton message")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Déploiement des commandes...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commandes déployées !");
  } catch (err) {
    console.error("❌ Erreur deploy :", err);
  }
})();