const { REST, Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🧨 Suppression des commandes...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] } // 👈 VIDE TOUT
    );

    console.log("✅ Commandes supprimées !");
  } catch (err) {
    console.error(err);
  }
})();