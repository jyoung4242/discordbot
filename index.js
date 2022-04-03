import DiscordJS, { Intents, MessageAttachment } from 'discord.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import cnv from 'canvas';
import h337 from './heatmap.js';

//Establish Environment vars
dotenv.config();

//setup destination canvas
const myCanvas = cnv.createCanvas(1200, 1200);
const myCtx = myCanvas.getContext('2d');
//myCanvas.style.width = '1200px';
//myCanvas.style.height = '1200px';

//Constants
const channelID = '958704435117293621'; //channel that is monitored, from discord
const mapWidth = 1200;
const mapHeight = 1200;

//Variables
let max = 0;
let botpoints = [];
let heatmapPoints = [];
let points = [
    [38.25, -85.7], //Louisville
    [33.4, -112.07], //Phoenix
    [48.8, 2.3], //Paris
    [35.6, 139], //Tokyo
    [-31.9, 115.8], //Perth
    [-22.9, -43.17], //Rio
    [64.1, -51.7], //Madagascar
    [55.7, 37.6], //Moscow
    [-18.7, 46.8], //Nuuk, Greenland
    [28.6, 77.2], //New Delhi
    [15.5, 32.5], //Khartoum, sudan
];

/*
Setup Discord Bot connection
*/
const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

//Set Default Canvas Background
resetDestCanvasBackground();

//Setup JS-dom for virtual DOM and target Div
export const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p><div id="heatmap" width="1200" height="1200"></div>`, { resources: 'usable' });
const { window } = dom;
const { document } = dom;
const mapDiv = dom.window.document.getElementById('heatmap');
mapDiv.style.width = '1200px';
mapDiv.style.height = '1200px';

//setup heatmap params
var heatmapInstance = h337();
//This creates the canvas element inside the target Div
const hm = heatmapInstance.create({ container: mapDiv });
//reference to the canvas in target Div
const htmap = mapDiv.firstChild;

//Hello World
client.on('ready', message => {
    console.log(`BOT ready!`);
    client.channels.cache.get(channelID).send('spammyBot Here: Well hello there!');
});

/**
 * parsing code event when message sent to bot channel being monitored
 */
client.on('messageCreate', async msg => {
    if (msg.author.username != 'spammyBot' && msg.channelId == channelID) {
        const mssg = msg.content;
        console.log(`message received`, mssg);
        if (mssg.indexOf('!') == 0) {
            console.log(`this is a command prefix`);
            console.log(`Command from ${msg.author.username}`);
            const commandString = mssg.split('!')[1];
            console.log(`Command String`, commandString);
            const commands = commandString.split(',');
            console.log(`commands`, commands);
            if (isCommandValid(commands)) {
                await getCoords(commands);
                console.log(`botpoints`, botpoints);
                const newerImage = await convertPoints(botpoints);
                //console.log(`newerImage: `, newerImage);
                const sfbuff = Buffer.from(newerImage);
                client.channels.cache.get(channelID).send('Map', { files: sfbuff });
            } else {
                client.channels.cache.get(channelID).send('INVALID COMMAND');
            }
        }
    }
});

/**
 * isCommandValid
 * takes command string from message create and returns true/false based on
 * validity of string
 */
function isCommandValid(cmd) {
    const validCommands = ['city-country', 'city-state-US', 'zip'];
    const spot = validCommands.indexOf(cmd[0]);
    if (spot == -1) return false;
    else return true;
}

/**
 * sends qualified cmd array
 * and based on command type (switch statement)
 * executes a different API call
 * and returns the lat, long in an object
 * {x: latitude, y: longitude}
 */
async function getCoords(cmd) {
    switch (cmd[0]) {
        case 'city-country':
            try {
                await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${cmd[1]},${cmd[2]}&limit=1&appid=ae453c36c95a545598d0b017a73c8cc6`).then(resp => {
                    console.log(`response: `, resp.data[0].lat, resp.data[0].lon);
                    client.channels.cache.get(channelID).send(`Found ${cmd[1]},${cmd[2]} at latitude: ${resp.data[0].lat}, longitude: ${resp.data[0].lon},`);
                    botpoints.push({ x: resp.data[0].lat, y: resp.data[0].lon });
                });
            } catch (error) {
                console.log(`ERROR`, error);
            }

            break;
        case 'city-state-US':
            try {
                await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${cmd[1]},${cmd[2]},${cmd[3]}&limit=1&appid=ae453c36c95a545598d0b017a73c8cc6`).then(resp => {
                    console.log(`response: `, resp.data[0].lat, resp.data[0].lon);
                    client.channels.cache.get(channelID).send(`Found ${cmd[1]},${cmd[2]},${cmd[3]} at latitude: ${resp.data[0].lat}, longitude: ${resp.data[0].lon},`);
                    botpoints.push({ x: resp.data[0].lat, y: resp.data[0].lon });
                    console.log(`just pushed to botpoints`, botpoints);
                });
            } catch (error) {
                console.log(`ERROR`, error);
            }

            break;
        case 'zip':
            try {
                await axios.get(`http://api.openweathermap.org/geo/1.0/zip?zip=${cmd[1]},${cmd[2]}&appid=ae453c36c95a545598d0b017a73c8cc6`).then(resp => {
                    console.log(`response: `, resp);
                    console.log(`response: `, resp.data.lat, resp.data.lon);
                    client.channels.cache.get(channelID).send(`Found ${cmd[1]},${cmd[2]} at latitude: ${resp.data.lat}, longitude: ${resp.data.lon},`);
                    botpoints.push({ x: resp.data[0].lat, y: resp.data[0].lon });
                });
            } catch (error) {
                console.log(`ERROR`, error);
            }

            break;
    }
}

/**
 * Clears destination canvas and redraws the background map
 */

function resetDestCanvasBackground() {
    myCtx.clearRect(0, 0, 1200, 1200);
    cnv.loadImage('./merc.jpg')
        .then(image => {
            console.log(`Image Loaded:`, image);
            myCtx.drawImage(image, 0, 0);
        })
        .catch(err => {
            console.log(err.message);
        });
}

/**
 * Takes array of points from messages and iterates
 *  converting lat/long into map x, y in pixels
 *  then calls plotHeatmap on way out
 */
async function convertPoints(points) {
    console.log(`points: `, points);
    for (const point of points) {
        const lat = point.x;
        const long = point.y;
        let x = (long + 180) * (mapWidth / 360);
        const latRad = lat * (Math.PI / 180);
        const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
        let y = mapHeight / 2 - (mapWidth * mercN) / (2 * Math.PI);
        let val = Math.random() * 40 + 60;
        heatmapPoints.push({ x: Math.floor(x), y: Math.floor(y), value: val });
        console.log(`points pushed: `, heatmapPoints);
        max = Math.max(max, val);
    }

    return plotHeatmap();
}

/**
 * this is 'supposed' to send the map imaged from the dest
 * ination canvase to the discord chat
 */

function downloadImage() {
    const newImage = myCanvas.toDataURL();
    const attachment = new client.MessageAttachment(newImage, 'map.png');
    const embed = new client.MessageEmbed().setTitle('New Map: ').attachFiles(attachment).setImage('attachment://map.png');
    client.channels.cache.get(channelID).send({ embed });
    return;
}

/**
 * Takes ste of heatmap points
 * and passes data object
 * to the heatmap instance
 */
function plotHeatmap() {
    var data = {
        max: max,
        data: heatmapPoints,
    };
    hm.setData(data);
    console.log('heatmap object: ', htmap);
    console.log('context object: ', myCtx);
    myCtx.drawImage(htmap, 0, 0);
    return;
}

client.login(process.env.TOKEN);
