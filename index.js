const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "./data.json";

// DATA SAFE
function load() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));

    if (!data.servers) data.servers = {};
    if (!data.invites) data.invites = {};
    if (!data.cooldowns) data.cooldowns = {};
    if (!data.reminders) data.reminders = {};

    return data;
  } catch {
    return {
      servers: {},
      invites: {},
      cooldowns: {},
      reminders: {}
    };
  }
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

client.once("ready", () => {
  console.log(`✅ AdminBot connecté : ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = load();
  const guildId = interaction.guild.id;

  if (!data.servers[guildId]) data.servers[guildId] = 0;

  // BUMP
  if (interaction.commandName === "bump") {
    data.servers[guildId]++;
    save(data);
    return interaction.reply(`🚀 Bump : ${data.servers[guildId]}`);
  }

  // INVITE
  if (interaction.commandName === "bump-invite") {
    const url = interaction.options.getString("url");
    data.invites[guildId] = url;
    save(data);
    return interaction.reply("🔗 Invite enregistrée !");
  }

  // TOP
  if (interaction.commandName === "top-bump") {
    const sorted = Object.entries(data.servers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    let text = "🏆 Top serveurs :\n\n";

    sorted.forEach(([id, bumps], i) => {
      text += `#${i + 1} → ${bumps} bumps\n`;
    });

    return interaction.reply(text);
  }

  // IA
  if (interaction.commandName === "ia") {
    const msg = interaction.options.getString("message");

    if (msg.toLowerCase().includes("bonjour")) {
      return interaction.reply("Salut 👋 !");
    }

    return interaction.reply("🤖 IA en développement");
  }
});

client.login(process.env.TOKEN);