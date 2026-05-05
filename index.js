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
const aiMemory = new Map();

function getMemory(channelId) {
  if (!aiMemory.has(channelId)) aiMemory.set(channelId, []);
  return aiMemory.get(channelId);
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
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
    const cooldown = 2 * 60 * 60 * 1000;

    // ================= COOLDOWN =================
    if (data.cooldowns[guildId]) {
      const expire = data.cooldowns[guildId] + cooldown;

      if (now < expire) {
        const remaining = expire - now;

        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);

        let timeText = "";
        if (h > 0) timeText += `${h} heure${h > 1 ? "s" : ""} `;
        if (m > 0) timeText += `${m} minute${m > 1 ? "s" : ""}`;

        const embed = new EmbedBuilder()
          .setColor(0xff9900)
          .setTitle("⏳ Bump indisponible")
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setDescription(
            `Tu dois attendre avant de pouvoir rebump.\n\n` +
            `⏱️ Temps restant : **${timeText.trim()}**\n\n` +
            `• ${interaction.guild.name}`
          )
          .setImage("https://raw.githubusercontent.com/bp-discord/bp-discord.github.io/refs/heads/main/adminbot/ADMINBOT_20260505_190501_0000(1).png");

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // ================= NEW BUMP =================
    data.cooldowns[guildId] = now;
    data.servers[guildId] = (data.servers[guildId] || 0) + 1;
    save(data);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("✅ Bump effectué")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `Merci à <@${userId}> d'avoir bumpé ce serveur.\n\n` +
        `📊 Total : **${data.servers[guildId]} bumps**\n` +
        `⏳ Prochain bump dans **2 heures**\n\n` +
        `• ${interaction.guild.name}`
      )
      .setImage("https://raw.githubusercontent.com/bp-discord/bp-discord.github.io/refs/heads/main/adminbot/ADMINBOT_20260505_190501_0000(1).png");

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
      content: "🔗 Choisis un salon pour créer une invite",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= /IA =================
  if (interaction.isChatInputCommand() && interaction.commandName === "ia") {

    const menu = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("ia_select_channel")
        .setPlaceholder("🤖 Salon IA")
        .setChannelTypes(ChannelType.GuildText)
    );

    return interaction.reply({
      content: "🤖 Active l’IA dans un salon",
      components: [menu],
      ephemeral: true
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

      desc += invite
        ? `**${i + 1} • [${name}](${invite})** — **${bumps} bumps**\n`
        : `**${i + 1} • ${name}** — **${bumps} bumps**\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Top Bumps")
      .setColor(0xffcc00)
      .setDescription(desc || "Aucun serveur");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("<:PlusBouton:1501339112420933803> Voir plus")
        .setStyle(ButtonStyle.Link)
        .setURL("https://bp-discord.github.io/adminbot/bumps/top")
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // ================= SELECT INVITE =================
  if (interaction.isChannelSelectMenu() && interaction.customId === "select_bump_channel") {

    const channel = interaction.channels.first();
    if (!channel) return interaction.update({ content: "❌ Salon invalide", components: [] });

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

// ================= IA =================
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

  let response = "🤖 Je ne comprends pas.";

  if (text.includes("bonjour")) {
    response = `👋 Salut <@${message.author.id}>`;
  }

  else if (text.includes("c'est quoi")) {
    response = "🤖 Explique-moi mieux.";
  }

  else if (text.includes("code")) {
    response = "💻 Dis-moi ce que tu veux coder.";
  }

  else if (text.includes("quoi")) {
    response = "feur 😏";
  }

  else if (text.includes("il a dit")) {
    const last = memory[memory.length - 2];
    response = last
      ? `🧠 ${last.name} a dit : "${last.content}"`
      : "🤖 Pas assez de contexte.";
  }

  message.reply({ content: response });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);