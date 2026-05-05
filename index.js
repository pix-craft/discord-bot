const {
  Client,
  GatewayIntentBits,
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

// ===== DATA SAFE =====
function load() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));

    if (!data.servers) data.servers = {};
    if (!data.invites) data.invites = {};
    if (!data.cooldowns) data.cooldowns = {};

    return data;
  } catch {
    return {
      servers: {},
      invites: {},
      cooldowns: {}
    };
  }
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== READY =====
client.once("ready", () => {
  console.log(`✅ AdminBot connecté : ${client.user.tag}`);
});

// ===== COMMANDES =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = load();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  if (!data.servers[guildId]) data.servers[guildId] = 0;

  const now = Date.now();
  const cooldownTime = 2 * 60 * 60 * 1000;

  // ===== /bump =====
  if (interaction.commandName === "bump") {

    if (!data.invites[guildId]) {
      return interaction.reply({
        content: "❌ Tu dois configurer une invite avec /bump-invite avant de bump",
        ephemeral: true
      });
    }

    if (data.cooldowns[userId]) {
      const expiration = data.cooldowns[userId] + cooldownTime;

      if (now < expiration) {
        const remaining = Math.ceil((expiration - now) / 60000);

        return interaction.reply({
          content: `⏳ Tu peux rebump dans ${remaining} minutes`,
          ephemeral: true
        });
      }
    }

    data.cooldowns[userId] = now;
    data.servers[guildId]++;
    save(data);

    const embed = new EmbedBuilder()
      .setTitle("✅ Bump effectué")
      .setDescription(
        `Merci à <@${userId}> d'avoir bumpé le serveur **${interaction.guild.name}**.\n\n` +
        `⏳ Tu pourras bump à nouveau dans **2 heures**.\n\n` +
        `🚀 Ce serveur a maintenant **${data.servers[guildId]} bumps**.`
      )
      .setColor(0x00ff99);

    return interaction.reply({ embeds: [embed] });
  }

  // ===== /bump-invite =====
  if (interaction.commandName === "bump-invite") {
    const url = interaction.options.getString("url");

    data.invites[guildId] = url;
    save(data);

    return interaction.reply("🔗 Invite enregistrée !");
  }

  // ===== /top-bump =====
  if (interaction.commandName === "top-bump") {
    const sorted = Object.entries(data.servers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    let description = "";

    sorted.slice(0, 16).forEach(([id, bumps], i) => {
      const position = i + 1;
      const guildName = client.guilds.cache.get(id)?.name || "Serveur inconnu";

      description += `**${position} • ${guildName}** avec un total de **${bumps} bumps**\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Liste des serveurs avec le plus de bumps")
      .setDescription(description || "Aucun serveur")
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("➕ Voir plus de serveurs")
        .setStyle(ButtonStyle.Link)
        .setURL("https://bp-discord.github.io/adminbot/bumps/top")
    );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  // ===== /ia =====
  if (interaction.commandName === "ia") {
    const message = interaction.options.getString("message");

    if (message.toLowerCase().includes("bonjour")) {
      return interaction.reply("Salut 👋 !");
    }

    if (message.toLowerCase().includes("bump")) {
      return interaction.reply("Tu peux bump toutes les 2 heures 🚀");
    }

    return interaction.reply("🤖 IA en développement...");
  }
});

// ===== START =====
client.login(process.env.TOKEN);