const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "./data.json";

// ---------- DATA ----------
function load() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---------- READY ----------
client.once("ready", () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
});

// ---------- INTERACTIONS ----------
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = load();
  const guildId = interaction.guild.id;

  if (!data.servers[guildId]) data.servers[guildId] = 0;

  // =====================
  // 🔼 /bump
  // =====================
  if (interaction.commandName === "bump") {
    const key = guildId + interaction.user.id;
    const now = Date.now();

    if (data.cooldowns[key] && now < data.cooldowns[key]) {
      const t = Math.ceil((data.cooldowns[key] - now) / 1000 / 60);
      return interaction.reply(`⏳ Attends **${t} min** avant de rebump`);
    }

    if (!data.invites[guildId]) {
      return interaction.reply("❌ Configure une invite avec `/bump-invite`");
    }

    data.servers[guildId]++;
    data.cooldowns[key] = now + 2 * 60 * 60 * 1000;

    save(data);

    return interaction.reply(`🚀 Bump réussi ! Total : **${data.servers[guildId]}**`);
  }

  // =====================
  // 🔗 /bump-invite
  // =====================
  if (interaction.commandName === "bump-invite") {
    const url = interaction.options.getString("url");

    data.invites[guildId] = url;

    save(data);

    return interaction.reply("🔗 Invite enregistrée !");
  }

  // =====================
  // 🏆 /top-bump
  // =====================
  if (interaction.commandName === "top-bump") {
    const sorted = Object.entries(data.servers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    const embed = new EmbedBuilder()
      .setTitle("🏆 TOP 30 SERVEURS BUMP 🔥")
      .setColor(0x00ff99);

    const rows = [];

    let i = 1;

    for (const [id, bumps] of sorted) {
      const invite = data.invites[id];

      embed.addFields({
        name: `#${i} 🚀 Serveur`,
        value: `🔥 ${bumps} bumps`,
        inline: false
      });

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

  // =====================
  // 🔔 /rappel-bump
  // =====================
  if (interaction.commandName === "rappel-bump") {
    const message = interaction.options.getString("message");
    const mention = interaction.options.getString("mention");

    data.reminders[guildId] = { message, mention };

    save(data);

    return interaction.reply(`🔔 Rappel enregistré : ${message}`);
  }
});

client.login(process.env.TOKEN);