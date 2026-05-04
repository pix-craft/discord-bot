const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
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
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

// ---------- COMMANDES ----------
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = load();
  const guildId = interaction.guild.id;

  if (!data.servers[guildId]) data.servers[guildId] = 0;

  // ======================
  // 🔼 /bump
  // ======================
  if (interaction.commandName === "bump") {
    const now = Date.now();
    const cd = data.cooldowns[guildId + interaction.user.id] || 0;

    if (now < cd) {
      const timeLeft = Math.ceil((cd - now) / 1000 / 60);
      return interaction.reply(`⏳ Attends encore **${timeLeft} min** avant de rebump !`);
    }

    if (!data.invites[guildId]) {
      return interaction.reply("❌ Tu dois configurer une invite avec `/bump-invite` !");
    }

    data.servers[guildId]++;

    data.cooldowns[guildId + interaction.user.id] = now + 2 * 60 * 60 * 1000;

    save(data);

    return interaction.reply(`🚀 Serveur bumpé ! Total : **${data.servers[guildId]}**`);
  }

  // ======================
  // 🔗 /bump-invite
  // ======================
  if (interaction.commandName === "bump-invite") {
    const invite = interaction.options.getString("url");

    data.invites[guildId] = invite;

    save(data);

    return interaction.reply("🔗 Invite enregistrée pour le top-bump !");
  }

  // ======================
  // 🏆 /top-bump
  // ======================
  if (interaction.commandName === "top-bump") {
    const sorted = Object.entries(data.servers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    let msg = "🏆 **TOP 30 SERVEURS BUMPÉS** 🔥\n\n";

    let i = 1;
    for (const [id, bumps] of sorted) {
      const invite = data.invites[id] || "Aucune invite";
      msg += `**${i}.** 🏷️ <@${id}> — 🚀 ${bumps} bumps → 🔗 ${invite}\n`;
      i++;
    }

    return interaction.reply(msg);
  }

  // ======================
  // ⏰ /rappel-bump
  // ======================
  if (interaction.commandName === "rappel-bump") {
    const message = interaction.options.getString("message");
    const mention = interaction.options.getString("mention");

    data.reminders[guildId] = { message, mention };

    save(data);

    return interaction.reply(`🔔 Rappel configuré : ${message}`);
  }
});

// ---------- LOGIN ----------
client.login(process.env.TOKEN);