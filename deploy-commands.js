const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("bump")
    .setDescription("Bump le serveur"),

  new SlashCommandBuilder()
    .setName("top-bump")
    .setDescription("Affiche le top 30 des serveurs"),

  new SlashCommandBuilder()
    .setName("bump-invite")
    .setDescription("Configure l'invitation du serveur")
    .addStringOption(opt =>
      opt.setName("url")
        .setDescription("Lien d'invitation")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rappel-bump")
    .setDescription("Créer un rappel de bump")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Message du rappel")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("mention")
        .setDescription("@here ou @everyone")
        .setRequired(true)
    ),

  // 🤖 IA
  new SlashCommandBuilder()
    .setName("ia")
    .setDescription("Parler avec AdminBot IA")
    .addStringOption(opt =>
      opt.setName("mode")
        .setDescription("Mode Chat ou Vocal")
        .setRequired(true)
        .addChoices(
          { name: "Chat", value: "chat" },
          { name: "Vocal", value: "vocal" }
        )
    )
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Ton message")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Déploiement AdminBot commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands déployées !");
  } catch (err) {
    console.error(err);
  }
})();