const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("bump")
    .setDescription("Bump le serveur"),

  new SlashCommandBuilder()
    .setName("top-bump")
    .setDescription("Affiche le top 30"),

  new SlashCommandBuilder()
    .setName("bump-invite")
    .setDescription("Configure l'invitation")
    .addStringOption(opt =>
      opt.setName("url")
        .setDescription("Lien d'invitation")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rappel-bump")
    .setDescription("Créer un rappel")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Message")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("mention")
        .setDescription("@here ou @everyone")
        .setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Déploiement commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands OK");
  } catch (err) {
    console.error(err);
  }
})();