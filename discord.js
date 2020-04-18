const Discord = require("discord.js");
const db = require("./db.json").config;
const client = new Discord.Client();
client.login(db.discordToken);

const sendDiscordMessage = (msg) => {
  client.channels.cache
    .find((channel) => channel.name === db.channelToSend)
    .send(`@here ${msg}`);
  console.log(`Sending ${msg}`);
};

exports.sendDiscordMessage = sendDiscordMessage;
