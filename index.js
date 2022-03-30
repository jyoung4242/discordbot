import DiscordJS, { Intents } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const MEESAGELIMIT = 25;
const SLOWMODERESETLIMIT = 5;
const SLOWMODERATE = 20;
const COOLDOWNPERIOD = 4000;
const channelID = '958704435117293621';

let messageArry = [];
let slowDownActive = false;

const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on('ready', message => {
    console.log(`BOT ready!`);
    client.channels.cache.get(channelID).send('spammyBot Here: Well hello there!');
});

client.on('messageCreate', msg => {
    if (msg.author.username != 'spammyBot' && msg.channelId == channelID) {
        console.log(`Message added to messagequeue`);
        messageArry.push(msg);
        if (messageArry.length > MEESAGELIMIT && !slowDownActive) {
            msg.channel.setRateLimitPerUser(SLOWMODERATE, 'SPAMMING RATE LIMIT REACHED');
            client.channels.cache.get(channelID).send('SLOWMODE enabled');
            slowDownActive = true;
        }
    }
});

setInterval(() => {
    if (messageArry.length) {
        messageArry.pop();
        console.log(`removedMessage, current count: ${messageArry.length}`);
        if (messageArry.length <= SLOWMODERESETLIMIT && slowDownActive) {
            client.channels.cache.get(channelID).setRateLimitPerUser(0, 'SLOWDOWN RESET');
            client.channels.cache.get(channelID).send('SLOWMODE disabled');
            slowDownActive = false;
        }
    }
}, COOLDOWNPERIOD);

client.login(process.env.TOKEN);
