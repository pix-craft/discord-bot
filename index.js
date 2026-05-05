const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "./data.json";

// ================= DATA SAFE =================
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

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ AdminBot connecté : ${client.user.tag}`);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isChannelSelectMenu()) return;

  const data = load();
  const guildId = interaction.guild?.id;
  const userId = interaction.user.id;

  if (!data.servers[guildId]) data.servers[guildId] = 0;

  // ================= /BUMP =================
  if (interaction.commandName === "bump") {

    if (!data.invites[guildId]) {
      return interaction.reply({
        content: "❌ Configure une invite avec /bump-invite",
        ephemeral: true
      });
    }

    const now = Date.now();
    const cooldownTime = 2 * 60 * 60 * 1000; // 2h
    const key = guildId; // 🔥 COOLDOWN PAR SERVEUR

    if (data.cooldowns[key]) {
      const expire = data.cooldowns[key] + cooldownTime;

      if (now < expire) {
        const msLeft = expire - now;

        const minutes = Math.floor(msLeft / 60000);
        const seconds = Math.floor((msLeft % 60000) / 1000);

        return interaction.reply({
          content: `⏳ Ce serveur peut être bump dans **${minutes}m ${seconds}s**`,
          ephemeral: true
        });
      }
    }

    // reset cooldown
    data.cooldowns[key] = now;

    data.servers[guildId]++;
    save(data);

    const embed = new EmbedBuilder()
      .setTitle("✅ Bump effectué")
      .setDescription(
        `👤 Par : <@${userId}>\n` +
        `🏠 Serveur : **${interaction.guild.name}**\n\n` +
        `📊 Total bumps : **${data.servers[guildId]}**\n` +
        `⏳ Prochain bump dans **2 heures**`
      )
      .setColor(0x00ff99);

    return interaction.reply({ embeds: [embed] });
  }

  // ================= /BUMP-INVITE =================
  if (interaction.commandName === "bump-invite") {

    const menu = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("select_bump_channel")
        .setPlaceholder("📢 Choisis un salon pour l'invitation")
        .setChannelTypes(ChannelType.GuildText)
    );

    return interaction.reply({
      content: "🔗 Choisis un salon pour générer une invite illimitée :",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= SELECT MENU =================
  if (interaction.isChannelSelectMenu() && interaction.customId === "select_bump_channel") {

    const channel = interaction.channels.first();

    if (!channel) {
      return interaction.update({
        content: "❌ Salon invalide",
        components: []
      });
    }

    try {
      const invite = await channel.createInvite({
        maxAge: 0,
        maxUses: 0
      });

      data.invites[guildId] = invite.url;
      save(data);

      return interaction.update({
        content: `🔗 Invite créée depuis <#${channel.id}>`,
        components: []
      });

    } catch (err) {
      console.error(err);

      return interaction.update({
        content: "❌ Impossible de créer l'invitation",
        components: []
      });
    }
  }

  // ================= /TOP-BUMP =================
  if (interaction.commandName === "top-bump") {

    const sorted = Object.entries(data.servers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    let desc = "";

    sorted.forEach(([id, bumps], i) => {
      const name = client.guilds.cache.get(id)?.name || "Serveur inconnu";
      const invite = data.invites[id];

      if (invite) {
        desc += `**${i + 1} • [${name}](${invite})** — **${bumps} bumps**\n`;
      } else {
        desc += `**${i + 1} • ${name}** — **${bumps} bumps**\n`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Top serveurs")
      .setDescription(desc || "Aucun serveur")
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

  // ================= /IA =================
  if (interaction.commandName === "ia") {
    const msg = interaction.options.getString("message");

    if (msg.toLowerCase().includes("bonjour")) {
      return interaction.reply("👋 Salut !");
    }

    if (msg.toLowerCase().includes("bump")) {
      return interaction.reply("🚀 Un bump est possible toutes les 2 heures !");
    }

    return interaction.reply("🤖 IA en développement...");
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);