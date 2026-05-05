const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "./data.json";

// ================= DATA =================
function load() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================= COMMANDES =================
const commands = [
  new SlashCommandBuilder().setName("bump").setDescription("Bump le serveur"),

  new SlashCommandBuilder().setName("top-bump").setDescription("Top 30 des serveurs"),

  new SlashCommandBuilder()
    .setName("bump-invite")
    .setDescription("Configurer l'invite")
    .addStringOption(opt =>
      opt.setName("url").setDescription("Lien Discord").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rappel-bump")
    .setDescription("Créer un rappel")
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("mention").setDescription("@everyone / @here").setRequired(true)
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
      opt.setName("message").setDescription("Message").setRequired(true)
    )
].map(c => c.toJSON());

// ================= AUTO SYNC =================
async function syncCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("🔄 Sync commandes...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commandes synchronisées !");
  } catch (err) {
    console.error(err);
  }
}

// ================= IA =================
function generateAIResponse(input) {
  const text = input.toLowerCase();

  if (text.includes("bonjour")) return "Salut 👋 !";
  if (text.includes("bump")) return "Tu peux bump toutes les 2h 🚀";

  return "🤖 Je suis encore en développement...";
}

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ AdminBot connecté : ${client.user.tag}`);

  await syncCommands(); // 🔥 AUTO SYNC ICI
});

// ================= COMMANDES =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = load();
  const guildId = interaction.guild.id;

  if (!data.servers[guildId]) data.servers[guildId] = 0;

  // ===== BUMP =====
  if (interaction.commandName === "bump") {
    data.servers[guildId]++;
    save(data);
    return interaction.reply(`🚀 Bump : ${data.servers[guildId]}`);
  }

  // ===== INVITE =====
  if (interaction.commandName === "bump-invite") {
    const url = interaction.options.getString("url");
    data.invites[guildId] = url;
    save(data);
    return interaction.reply("🔗 Invite enregistrée !");
  }

  // ===== TOP =====
  if (interaction.commandName === "top-bump") {
    const sorted = Object.entries(data.servers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    const embed = new EmbedBuilder().setTitle("🏆 TOP SERVEURS");

    const rows = [];

    let i = 1;
    for (const [id, bumps] of sorted) {
      embed.addFields({
        name: `#${i}`,
        value: `${bumps} bumps`,
        inline: false
      });

      const invite = data.invites[id];
      if (invite) {
        rows.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel(`Rejoindre #${i}`)
              .setStyle(ButtonStyle.Link)
              .setURL(invite)
          )
        );
      }

      i++;
    }

    return interaction.reply({
      embeds: [embed],
      components: rows.slice(0, 5)
    });
  }

  // ===== IA =====
  if (interaction.commandName === "ia") {
    const mode = interaction.options.getString("mode");
    const msg = interaction.options.getString("message");

    if (mode === "chat") {
      return interaction.reply(generateAIResponse(msg));
    }

    return interaction.reply("🔊 Mode vocal bientôt dispo");
  }
});

// ================= START =================
client.login(process.env.TOKEN);