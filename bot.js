import {Client} from 'eris'
import axios from 'axios'
import moment from 'moment-timezone'
import fs from 'fs'

import config from './config.js'
// console.log(config)
const INTERVAL = 15 * 1000

import state from './state.json' assert { type: 'json' }
// let exampleState = { 
//     updatedAt: moment(),
//     candidates: [], // this from 'https://kusama.w3f.community/candidates'
//     subcribers: [
//         {
//             id: 'discordUserId',
//             channel: { id: 123 },
//             targets: [{ stash: '', active: true, valid: true }]
//         }
//     ]
// }
function saveState() {
    fs.writeFileSync('state.json', JSON.stringify(state, null, 4), 'utf8')
}
// Create a Client instance with our bot token.
const bot = new Client(config.bot_token)

// When the bot is connected and ready, log to console.
bot.on('ready', () => {
   console.log('Connected and ready.');
});

const helpText = 'Here is the list of commands I understand:\n'
    + '  `!help` - displays this message\n'
    + '  `!list` - list your subscriptions\n'
    + '  `!format json|pretty` - set your message format\n'
    + '  `!interval [3600]` - get|set message interval (seconds)\n'
    + '  `!sub` <validator stash> - subscribe to alerts\n'
    + '  `!unsub` <validator stash> - unsubscribe from alerts\n'
    // + '   - modules: valid | active | all\n'

function handleMessage (msg) {
    // const cmd = msg.content.substring(0, str.indexOf(' '))
    const parts = msg.content.split(' ')
    const cmd = parts[0] //.substr(PREFIX.length)
    // const module = parts[1]
    // const stash = parts[2]
    // console.debug(`"${cmd}" "${module}" "${stash}"`)
    let stash
    let idx
    switch (cmd) {
        case '!ping':
            bot.createMessage(msg.channel.id, 'Pong!')
            break
        case '!help':
            bot.createMessage(msg.channel.id, helpText)
            break
        case '!list':
            let s = state.subscribers.find(f => f.id === msg.author.id)
            let message = s ? JSON.stringify(s.targets) : 'None' 
            bot.createMessage(msg.channel.id, message)
            break;
        case '!interval':
            idx = state.subscribers.findIndex(s => s.id === msg.author.id)
            if (idx > -1) {
                let interval = parts[1]
                if (interval) {
                    interval = Number(interval) || 1 * 60 * 60 // 1 hour
                    state.subscribers[idx].interval = interval
                    saveState()
                    bot.createMessage(msg.channel.id, `ok, every ${interval} seconds`)
                } else {
                    bot.createMessage(msg.channel.id, `every ${state.subscribers[idx].interval} seconds`)
                }    
            } else {
                bot.createMessage(msg.channel.id, `every 3600 seconds.`)
            }
            break;
        case '!format':
            idx = state.subscribers.findIndex(s => s.id === msg.author.id)
            let format = parts[1]
            state.subscribers[idx].format = (format === 'json') ? 'json' : 'pretty'
            saveState()
            bot.createMessage(msg.channel.id, `you will receive messages in '${state.subscribers[idx].format}' format`)
            break;
        case '!sub':
            // if (!['valid','active','all'].includes(module)) {
            //     bot.createMessage(msg.channel.id, `invalid module '${module||''}'\ntry !sub <module> <stash>`)
            //     return
            // }
            stash = parts[1]
            if (!stash || stash === '') {
                bot.createMessage(msg.channel.id, `invalid stash '${stash||''}'\ntry !sub <stash>`)
                return
            }
            idx = state.subscribers.findIndex(s => s.id === msg.author.id)
            if (idx > -1) {
                let t = state.subscribers[idx].targets.find(f => f.stash === stash)
                if (t) {
                    bot.createMessage(msg.channel.id, `already subscribed to ${stash}`)
                } else {
                    state.subscribers[idx].targets.push({stash: stash})
                    bot.createMessage(msg.channel.id, `subscribed to ${stash}`)
                }
            } else {
                state.subscribers.push({id: msg.author.id, interval: 3600, channel: msg.channel, targets: [{stash: stash}]})
                bot.createMessage(msg.channel.id, `subscribed to ${stash}`)
            }
            saveState()
            break
        case '!unsub':
            // if (!['valid','active','all'].includes(module)) {
            //     bot.createMessage(msg.channel.id, `invalid module '${module||''}'\ntry !unsub <module> <stash>`)
            //     return
            // }
            stash = parts[1]
            if (!stash || stash === '') {
                bot.createMessage(msg.channel.id, `invalid stash '${stash||''}'\ntry !unsub <module> <stash>`)
                return
            }
            idx = state.subscribers.findIndex(f => f.id === msg.author.id)
            if (idx > -1) {
                state.subscribers[idx].targets = state.subscribers[idx].targets.filter(f => f.stash !== stash)
                bot.createMessage(msg.channel.id, `unsubscribed for ${stash}`)   
                saveState()
            } else {
                console.debug('could not find idx')
            }
            break
        default:
            // message.channel.createMessage('Pong!')
            bot.createMessage(msg.channel.id, 'not implemented')
    }
}

// Every time a message is sent anywhere the bot is present, this event will fire
bot.on('messageCreate', async (msg) => {

    const botWasMentioned = msg.mentions.find(
        mentionedUser => mentionedUser.id === bot.user.id,
    )
 
    if (msg.author.id === ""+config.app_id) {
        console.debug('Ignore response from self...')
        return
    } else if (msg.channel.guild && botWasMentioned) {
        await bot.createMessage(msg.channel.id, `@${msg.author.username}, not here... please use DM`)
        return;
    } else {
        console.debug(msg)
    }

    if (msg.content.slice(0, 1) === '!') {
        handleMessage(msg)
    } else {
        const usage = 'try `!help` for a list of commands'
        await bot.createMessage(msg.channel.id, usage)
    }

})

bot.on('disconnect', (err) => {
    console.warn(err);
})

bot.on('error', err => {
    console.warn(err);
});

setInterval(async () => {
    if (!state.updatedAt || moment().diff(state.updatedAt, 'seconds') > 60) {
        console.debug('Updating candidates...')
        try {
            const res = await axios.get('https://kusama.w3f.community/candidates')
            if (res.data) {
                state.candidates = res.data
                state.updatedAt = moment()
                saveState()
            } else {
                console.debug(res)
            }
        } catch (err) {
            console.debug(err)
        }
    }
    console.debug('Checking subscribers: '+ state.subscribers.length)
    let updated = false
    state.subscribers.forEach((sub, idx) => {
        let age = moment().diff(moment(sub.updatedAt), 'seconds')
        console.debug('id:', sub.id, 'age:', age, 'updateAt', sub.updatedAt)
        if (sub.updatedAt === '' || age > sub.interval) {
            sub.targets.forEach( t => {
                const c = state.candidates.find(c => c.stash === t.stash)
                if (c) {
                    let message = sub.format === 'json'
                        ? JSON.stringify({ name: c.name, stash: c.stash, active: c.active, valid: c.valid})
                        : `${c.name} active: ${c.active ? '🔥' : '💀'}  valid: ${c.valid ? '🟢' : '🔴'}`
                    bot.createMessage(sub.channel.id, moment().format('HH:mm:ss: ') + message)
                }
            })
            state.subscribers[idx].updatedAt = moment()
            updated = true
        }
    })
    if (updated) saveState()
}, INTERVAL)

bot.connect();
