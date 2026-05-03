const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "./data.json";

// 📥 lire data
function getData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// 📤 sauver data
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

client.on("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guild.id;
  const data = getData();

  if (!data[guildId]) data[guildId] = 0;

  // 🔼 BUMP
  if (interaction.commandName === "bump") {
    data[guildId] += 1;
    saveData(data);

    return interaction.reply(`✅ Bump ! Total : ${data[guildId]}`);
  }

  // 🏆 TOP (simple version)
  if (interaction.commandName === "top-bumps") {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    let msg = "🏆 Top serveurs :\n\n";

    let i = 1;
    for (const [id, bumps] of sorted) {
      msg += `${i}. ${id} — ${bumps} bumps\n`;
      i++;
    }

    return interaction.reply(msg);
  }
});

client.login(process.env.TOKEN);