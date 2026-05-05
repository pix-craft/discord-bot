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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // 🔥 IMPORTANT pour IA
  ]
});

// ================= DATA =================
const DATA_FILE = "./data.json";

// salons IA actifs
const aiChannels = new Set();

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

// ================= COMMANDES =================
client.on("interactionCreate", async interaction => {

  const data = load();
  const guildId = interaction.guild?.id;
  const userId = interaction.user.id;

  // ================= /BUMP =================
  if (interaction.isChatInputCommand() && interaction.commandName === "bump") {

    if (!data.invites[guildId]) {
      return interaction.reply({
        content: "❌ Configure une invite avec /bump-invite",
        ephemeral: true
      });
    }

    const now = Date.now();
    const cooldownTime = 2 * 60 * 60 * 1000;
    const key = guildId;

    if (data.cooldowns[key]) {
      const expire = data.cooldowns[key] + cooldownTime;

      if (now < expire) {
        const msLeft = expire - now;
        const m = Math.floor(msLeft / 60000);
        const s = Math.floor((msLeft % 60000) / 1000);

        return interaction.reply({
          content: `⏳ Reviens dans **${m}m ${s}s**`,
          ephemeral: true
        });
      }
    }

    data.cooldowns[key] = now;
    data.servers[guildId] = (data.servers[guildId] || 0) + 1;
    save(data);

    const embed = new EmbedBuilder()
      .setTitle("✅ Bump effectué")
      .setDescription(
        `👤 <@${userId}> a bump le serveur **${interaction.guild.name}**\n\n` +
        `📊 Total : **${data.servers[guildId]} bumps**\n` +
        `⏳ Prochain bump dans 2h`
      )
      .setColor(0x00ff99);

    return interaction.reply({ embeds: [embed] });
  }

  // ================= /BUMP-INVITE =================
  if (interaction.isChatInputCommand() && interaction.commandName === "bump-invite") {

    const menu = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("select_bump_channel")
        .setPlaceholder("📢 Choisis un salon")
        .setChannelTypes(ChannelType.GuildText)
    );

    return interaction.reply({
      content: "🔗 Sélectionne un salon pour créer une invite illimitée",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= /IA =================
  if (interaction.isChatInputCommand() && interaction.commandName === "ia") {

    const menu = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("ia_select_channel")
        .setPlaceholder("🤖 Choisis un salon IA")
        .setChannelTypes(ChannelType.GuildText)
    );

    return interaction.reply({
      content: "🤖 Choisis un salon où l’IA doit répondre automatiquement",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= SELECT BUMP INVITE =================
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
      return interaction.update({
        content: "❌ Impossible de créer l'invite",
        components: []
      });
    }
  }

  // ================= SELECT IA CHANNEL =================
  if (interaction.isChannelSelectMenu() && interaction.customId === "ia_select_channel") {

    const channel = interaction.channels.first();
    if (!channel) {
      return interaction.update({
        content: "❌ Salon invalide",
        components: []
      });
    }

    aiChannels.add(channel.id);

    return interaction.update({
      content: `🤖 IA activée dans <#${channel.id}>`,
      components: []
    });
  }

  // ================= /TOP-BUMP =================
  if (interaction.isChatInputCommand() && interaction.commandName === "top-bump") {

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
        .setLabel("➕ Voir plus")
        .setStyle(ButtonStyle.Link)
        .setURL("https://bp-discord.github.io/adminbot/bumps/top")
    );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
});

// ================= IA MESSAGE SYSTEM =================
client.on("messageCreate", async message => {

  if (message.author.bot) return;
  if (!aiChannels.has(message.channel.id)) return;

  const content = message.content.toLowerCase();

  let response = "🤖 Je ne comprends pas.";

  if (content.includes("bonjour")) {
    response = "👋 Salut !";
  }

  if (content.includes("bump")) {
    response = "🚀 Pense à bump toutes les 2 heures !";
  }

  if (content.includes("quoi")) {
    response = "feur 😏";
  }

  message.reply(response);
});

// ================= LOGIN =================
client.login(process.env.TOKEN);