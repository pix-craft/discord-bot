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
    GatewayIntentBits.MessageContent
  ]
});

// ================= DATA =================
const DATA_FILE = "./data.json";

const aiChannels = new Set();

// mémoire IA par salon
const aiMemory = new Map();

function getMemory(channelId) {
  if (!aiMemory.has(channelId)) {
    aiMemory.set(channelId, []);
  }
  return aiMemory.get(channelId);
}

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
        `👤 <@${userId}> a bump **${interaction.guild.name}**\n` +
        `📊 Total : **${data.servers[guildId]} bumps**`
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
      content: "🔗 Sélectionne un salon pour créer une invite",
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
      content: "🤖 Active l’IA dans un salon",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= TOP BUMP =================
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

  // ================= SELECT INVITE =================
  if (interaction.isChannelSelectMenu() && interaction.customId === "select_bump_channel") {

    const channel = interaction.channels.first();
    if (!channel) return interaction.update({ content: "❌ Salon invalide", components: [] });

    try {
      const invite = await channel.createInvite({
        maxAge: 0,
        maxUses: 0
      });

      data.invites[guildId] = invite.url;
      save(data);

      return interaction.update({
        content: `🔗 Invite créée : <#${channel.id}>`,
        components: []
      });

    } catch {
      return interaction.update({
        content: "❌ Erreur création invite",
        components: []
      });
    }
  }

  // ================= SELECT IA =================
  if (interaction.isChannelSelectMenu() && interaction.customId === "ia_select_channel") {

    const channel = interaction.channels.first();
    if (!channel) return interaction.update({ content: "❌ Salon invalide", components: [] });

    aiChannels.add(channel.id);

    return interaction.update({
      content: `🤖 IA activée dans <#${channel.id}>`,
      components: []
    });
  }
});

// ================= IA INTELLIGENTE =================
client.on("messageCreate", async message => {

  if (message.author.bot) return;
  if (!aiChannels.has(message.channel.id)) return;

  const memory = getMemory(message.channel.id);

  memory.push({
    user: message.author.id,
    name: message.author.username,
    content: message.content
  });

  if (memory.length > 15) memory.shift();

  const text = message.content.toLowerCase();

  let response = "";

  // ================= INTELLIGENCE =================

  if (text.includes("bonjour")) {
    response = `👋 Salut <@${message.author.id}> !`;
  }

  else if (text.includes("c'est quoi") || text.includes("c est quoi")) {
    response = "🤖 Donne-moi plus de détails et je t’explique.";
  }

  else if (text.includes("code")) {
    response = "💻 Dis-moi ce que tu veux coder.";
  }

  else if (text.includes("image") || text.includes("photo")) {
    response = "🖼️ Je peux pas analyser les images pour l’instant, mais je peux les décrire si on ajoute une IA vision.";
  }

  else if (text.includes("il a dit") || text.includes("elle a dit")) {
    const last = memory[memory.length - 2];
    response = last
      ? `🧠 ${last.name} a dit : "${last.content}"`
      : "🤖 Pas assez de contexte.";
  }

  else if (text.includes("quoi")) {
    response = "feur 😏";
  }

  else {
    response = `🤖 Je réfléchis... peux-tu reformuler ?`;
  }

  message.reply({
    content: response,
    allowedMentions: { repliedUser: false }
  });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);