const {
  Wechaty,
  config,
} = require('wechaty')
var exec = require('child_process').exec;
const qrTerm = require('qrcode-terminal')
const request = require('request');
const utils = require("./utils.js");
const commands = require("./commands.js");
const fileBox = require('file-box').FileBox;
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
const intent_dic = { "Sport": "运动", "Study": "学习", "Livelonger": "养生", "record": "打卡", "Reject": "否定", "None": "None" }

async function onMessage(msg) {
  const msg_type = msg.type()
  const room = msg.room()

  if (room) {
    var topic = await room.topic()
  }

  const talker_name = msg.talker().name()
  text = msg.text()
  is_self = msg.self()
  date = msg.date().toDateString()


  if ((msg_type == bot.Message.Type.Text) &&
    (/@Flag/i.test(text)) && (!is_self)
  ) {
    intent_text = text.replace(/@Flag/i, '')
    intent_text = intent_text.replace(/\s/i, '')
    console.log("intent_text:",intent_text)
    if (intent_text=='')
    {
      msg.say("叫爸爸干嘛？")
      return
    }
    intent_text = intent_text.replace(/\s/i, '')
    // intent = await utils.getPrediction(intent_text)
    // console.log("intent_text: ", intent_text)
    // console.log("intent: ", intent)
    if (/打卡/i.test(intent_text)) {
      intent_text = intent_text.replace(/打卡/i, '')
      path = `data/${topic}/${talker_name}/commit.txt`
      fs.appendFile(path, `${date}\n`, err => {
        if (err) {
          console.error(err)
          return
        }
      })
      msg.say(`${talker_name}的${intent_text}打卡已被记录，可以通过 $report 来检查打卡记录。\n\
      并且记录图片和视频功能已经开启，如果需要记录可以继续分享图片或者视频。\n如果不需要也可以通过 @Flag 没图你说寂寞 来结束。`)
      mkdirp(`data/${topic}/${talker_name}/${intent_text}`, function (err) {
        if (err) return console.log(err);
        //console.log(`${file_path} created.`)
        //msg.say(`Good job! Looking forward to ${talker_name}'s process file.`)
      })
      recorder[`${topic}/${talker_name}`] = `data/${topic}/${talker_name}/${intent_text}`
    }
    else if (/没图你说寂寞/i.test(intent_text)) {
      if (recorder[`${topic}/${talker_name}`]) {
        msg.say("可不么，记录结束。")
        delete recorder[`${topic}/${talker_name}`]
        return
      }
    }
    else if (/么了/i.test(intent_text)) {
      if (recorder[`${topic}/${talker_name}`]) {
        msg.say("太优秀了！Bye")
        delete recorder[`${topic}/${talker_name}`]
        return
      }
    }
    else {
      flags = utils.transferTextToFlags(text)
      flag_json = await utils.flagsIntent(flags, date, intent_dic)
      await utils.saveFlagJson(topic, talker_name, flag_json, msg)
      //utils.reportRecentFlag(topic, talker_name, msg);
      msg.say("flag已经收到，可以通过 $recent 来查看是否添加正确。\n如果出现分类错误，之后会添加 $fix 方法来修改分类")
    }
  }

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$recent/i.test(text)) && (!is_self)
  ) {
    utils.reportRecentFlag(topic, talker_name, msg);
  }

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$report/i.test(text)) && (!is_self)
  ) {
    exec(`python3 plot/test.py data/测试用/季启光/commit.txt`, function (error, stdout, stderr) {
      if (stdout.length > 1) {
        console.log('you offer args:', stdout);
      } else {
        console.log('you don\'t offer args');
      }
      if (error) {
        console.info('stderr : ' + stderr);
      }
    });
    var file = fileBox.fromFile("tmp/calendar-heatmap.png")
    msg.say(file)
  }

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$all/i.test(text)) && (!is_self)
  ) {
    utils.reportAllFlags(topic, talker_name, msg);
  }
  if ((msg_type == bot.Message.Type.Text) &&
    (/\$fix/i.test(text)) && (!is_self)
  ) {
    fix_text = text.replace(/\$fix/i, '')
    fix_text = fix_text.replace(/\s/i, '')
    items = fix_text.split("=")
    console.log(items)
    msg.say("有错误需要修改")
  }

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$delete/i.test(text)) && (!is_self)
  ) {
    path = `data/${topic}/${talker_name}/flag.json`
    utils.deleteRecentFlagInJSON(path)
    msg.say(`The recent flag of ${talker_name} has been removed. Please check again.`)
  }

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$help/i.test(text)) && (!is_self)
  ) {
      var help = "Flag-Bot 使用方法如下：\n"
      help += "设定下周Flag方法： 例子：\n@Flag 1. 游戏通关 2. 结婚生子\n\n"
      help += "查看最近的flag： $recent\n\n"
      help += "查看所有的flag： $all\n\n"
      help += "打卡： @Flag xx打卡\n"
      help += "建议加入打卡内容 如 学习打卡 或者 运动打卡，一方便后期处理\n\n"
      help += "删除最近的flag: $delete\n"
      msg.say(help)
  }

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$record/i.test(text) && (!is_self))
  ) {
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

  if ((msg_type == bot.Message.Type.Text) &&
    (/\$endrecord/i.test(text) && (!is_self))
  ) {
    //console.log(`is_self:  ${is_self}`)

    if (recorder[`${topic}/${talker_name}`]) {
      msg.say(`Impressive ,${talker_name}!! Can't wait to see the next step!!`)
      delete recorder[`${topic}/${talker_name}`]
      return
    }
    else {
      msg.say(`Dear ${talker_name}, you haven't start recording yet. Please send $record to record your improvement!`)
    }
  }

  if (((msg_type == bot.Message.Type.Image) ||
    (msg_type == bot.Message.Type.Video)) &&
    (!is_self)) {
    if (!recorder[`${topic}/${talker_name}`]) {
      return
    }
    path = recorder[`${topic}/${talker_name}`]
    const file = await msg.toFileBox()
    const name = file.name
    console.log('Save file to: ' + name)
    file.toFile(`${path}/${name}`)
    msg.say(`Hello ${talker_name}, 图已经收到，还有不？没了的话就 @Flag 么了 来结束`)
  }

}

const welcome = "Please wait... I'm trying to login in..."
console.log(welcome)
