const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("bump")
    .setDescription("Bump le serveur"),

  new SlashCommandBuilder()
    .setName("top-bump")
    .setDescription("Afficher le top 30"),

  new SlashCommandBuilder()
    .setName("bump-invite")
    .setDescription("Configurer l'invite")
    .addStringOption(opt =>
      opt.setName("url")
        .setDescription("Lien Discord")
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
        .setDescription("@everyone / @here")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ia")
    .setDescription("Parler avec AdminBot")
    .addStringOption(opt =>
      opt.setName("mode")
        .setDescription("Chat ou Vocal")
        .setRequired(true)
        .addChoices(
          { name: "Chat", value: "chat" },
          { name: "Vocal", value: "vocal" }
        )
    )
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Message")
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
    console.error(err);
  }
})();