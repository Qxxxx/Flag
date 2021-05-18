const {
  Wechaty,
  config,
} = require('wechaty')

const qrTerm = require('qrcode-terminal')

const utils = require("./utils.js");
const commands = require("./commands.js");
const fs = require('fs')
const bot = new Wechaty({
  name: 'FlagBot',
})

const mkdirp = require('mkdirp');

var recorder = {};

bot
  .on('logout', onLogout)
  .on('login', onLogin)
  .on('scan', onScan)
  .on('error', onError)
  .on('message', onMessage)

bot.start()
  .catch(async e => {
    console.error('Bot start() fail:', e)
    await bot.stop()
    process.exit(-1)
  })

function onScan(qrcode, status) {
  qrTerm.generate(qrcode, {
    small: true
  })

  const qrcodeImageUrl = [
    'https://wechaty.js.org/qrcode/',
    encodeURIComponent(qrcode),
  ].join('')

  console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
}

function onLogin(user) {
  console.log(`${user.name()} login`)
  bot.say('Wechaty login').catch(console.error)
}

function onLogout(user) {
  console.log(`${user.name()} logouted`)
}

function onError(e) {
  console.error('Bot error:', e)
  /*
  if (bot.logonoff()) {
    bot.say('Wechaty error: ' + e.message).catch(console.error)
  }
  */
}


async function onMessage(msg) {
  console.log(msg.text())


  if ((msg.type() == bot.Message.Type.Text) &&
    (/@Flag/i.test(msg.text())) && (!msg.self())
  ) {
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()
    // console.log(`${date_time}, \n Flag from ${talker_name} in ${topic} detected!!!`)
    // msg.say(`${date_time}, \n Flag from ${talker_name} in ${topic} detected!!!`)
    const data = utils.createJsonFromMessage(msg)
    console.log(`${data},  ${!data} `)
    if (data == "") {
      msg.say(`Hello ${talker_name}, empty flag detected!`)
      return
    }
    path = `data/${topic}/${talker_name}/flag.json`
    try {
      utils.writeJSON(data, path)
      msg.say(`Thanks ${talker_name}, flag received.`)
    } catch (err) {
      console.log(err);
    }
    return
  }

  if ((msg.type() == bot.Message.Type.Text) &&
    (/\$myrecentflag/i.test(msg.text())) && (!msg.self())
  ) {
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()
    path = `data/${topic}/${talker_name}/flag.json`
    //flags = readJson(`${path}/flag.json`)
    fs.readFile(path, (err, data) => {
      if (err) {
        msg.say(`${talker_name} has never created flag in ${topic} yet.`)
        return console.log(err);
      }
      let flags = JSON.parse(data);
      if (flags.flags.length == 0) {
        return msg.say(`Currently ${talker_name} has no flag at all.`)
      }
      recent_flag = flags.flags[flags.flags.length - 1]
      console.log(recent_flag);
      msg.say(`${recent_flag["date"]}:\n${recent_flag["flag"]}`)
    });

  }

  if ((msg.type() == bot.Message.Type.Text) &&
    (/\$myallflags/i.test(msg.text())) && (!msg.self())
  ) {
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()
    path = `data/${topic}/${talker_name}/flag.json`
    console.log("all flags");
    //flags = readJson(`${path}/flag.json`)
    fs.readFile(path, (err, data) => {
      if (err) {
        msg.say(`${talker_name} has never created flag in ${topic} yet.`);
        return console.log(err);
      }
      let flags = JSON.parse(data);
      if (flags.flags.length == 0) {
        return msg.say(`Currently ${talker_name} has no flag at all.`)
      }
      flags_str = ""
      flags.flags.forEach(function (flag) {
        //var tableName = table.name;
        flags_str = flags_str + `${flag["date"]}:\n${flag["flag"]}\n\n`
      });
      console.log(flags_str);
      msg.say(flags_str)

    });
  }

  if ((msg.type() == bot.Message.Type.Text) &&
    (/\$deleterecentflag/i.test(msg.text())) && (!msg.self())
  ) {
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()
    path = `data/${topic}/${talker_name}/flag.json`
    //flags = readJson(`${path}/flag.json`)
    utils.deleteRecentFlagInJSON(path)
    msg.say(`The recent flag of ${talker_name} has been removed. Please check again.`)
  }

  if ((msg.type() == bot.Message.Type.Text) &&
    (/\$record/i.test(msg.text()) && (!msg.self()))
  ) {
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()
    json_path = `data/${topic}/${talker_name}/flag.json`
    if (recorder[`${topic}/${talker_name}`]) {
      msg.say(`Hi ${talker_name}, you have already been in recording mode. Please share image/video to record your improvement.`)
      return
    }

    fs.readFile(json_path, (err, data) => {
      if (err) {
        msg.say(`${talker_name} has never created flag in ${topic} yet.`)
        return console.log(err);
      }
      let flags = JSON.parse(data);
      if (flags.flags.length == 0) {
        return msg.say(`Currently ${talker_name} has no flag at all.`)
      }
      recent_flag = flags.flags[flags.flags.length - 1]
      var recent_flag_date = recent_flag["date"]
      console.log(`recent flag log! ${recent_flag_date}`)
      file_path = `data/${topic}/${talker_name}/${recent_flag_date}`
      recorder[`${topic}/${talker_name}`] = `data/${topic}/${talker_name}/${recent_flag_date}`

      console.log(`file_path:  ${recent_flag_date}`)
      mkdirp(file_path, function (err) {
        if (err) return console.log(err);
        //console.log(`${file_path} created.`)
        msg.say(`Good job! Looking forward to ${talker_name}'s process file.`)
      })
    });
  }

  if ((msg.type() == bot.Message.Type.Text) &&
    (/\$endrecord/i.test(msg.text()) && (!msg.self()))
  ) {
    //console.log(`msg.self():  ${msg.self()}`)
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()

    if (recorder[`${topic}/${talker_name}`]) {
      msg.say(`Impressive ,${talker_name}!! Can't wait to see the next step!!`)
      delete recorder[`${topic}/${talker_name}`]
      return
    }
    else {
      msg.say(`Dear ${talker_name}, you haven't start recording yet. Please send $record to record your improvement!`)
    }
  }

  if (((msg.type() == bot.Message.Type.Image) ||
    (msg.type() == bot.Message.Type.Video)) &&
    (!msg.self())) {
    const topic = await msg.room().topic()
    const talker_name = msg.talker().name()
    if (!recorder[`${topic}/${talker_name}`]) {
      return
    }
    path = recorder[`${topic}/${talker_name}`]
    const file = await msg.toFileBox()
    const name = file.name
    console.log('Save file to: ' + name)
    file.toFile(`${path}/${name}`)
    msg.say(`Hello ${talker_name}, file received! You can continue with more files or send $endrecord to finish the record process~`)
  }

}

const welcome = "Please wait... I'm trying to login in..."
console.log(welcome)
