const { Client, GatewayIntentBits } = require("discord.js");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guild.id;

  if (interaction.commandName === "bump") {
    const ref = db.collection("servers").doc(guildId);
    const doc = await ref.get();

    let bumps = doc.exists ? doc.data().bumps + 1 : 1;

    await ref.set({ bumps });

    interaction.reply(`✅ Bump ! Total : ${bumps}`);
  }

  if (interaction.commandName === "top-bumps") {
    const snapshot = await db
      .collection("servers")
      .orderBy("bumps", "desc")
      .limit(30)
      .get();

    let msg = "🏆 Top 30 serveurs :\n\n";

    let i = 1;
    snapshot.forEach(doc => {
      msg += `${i}. ${doc.id} — ${doc.data().bumps}\n`;
      i++;
    });

    interaction.reply(msg);
  }
});

client.login(process.env.TOKEN);
