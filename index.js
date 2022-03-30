import DiscordJS, { Intents } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

//defined constancts that need adjusted for each channel
const MEESAGELIMIT = 25;
const SLOWMODERESETLIMIT = 5;
const SLOWMODERATE = 20;
const COOLDOWNPERIOD = 4000;
const channelID = '958704435117293621';

//defined values, the message queu and the flag
let messageArry = [];
let slowDownActive = false;

const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

//Hello World
client.on('ready', message => {
    console.log(`BOT ready!`);
    client.channels.cache.get(channelID).send('spammyBot Here: Well hello there!');
});

//on messages that come from someone other than the bot
//and its from the monitored channel
//adds message to queu and it queue exceeds maximum value,
//induces slow mode until number of queued messages dips below threshhold
client.on('messageCreate', msg => {
    if (msg.author.username != 'spammyBot' && msg.channelId == channelID) {
        console.log(`Message added to messagequeue`);
        messageArry.push(msg.id);
        if (messageArry.length > MEESAGELIMIT && !slowDownActive) {
            msg.channel.setRateLimitPerUser(SLOWMODERATE, 'SPAMMING RATE LIMIT REACHED');
            client.channels.cache.get(channelID).send('SLOWMODE enabled');
            slowDownActive = true;
        }
    }
});

//interval process through periodically removes old message off queu
//the iteration rate is configurable by the constant at top of file
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
