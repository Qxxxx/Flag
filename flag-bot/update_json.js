const fs = require('fs')
const utils = require("./utils.js");
var directory = fs.readdirSync('/home/q/flag/data/FLAG绿色夸夸群');
const intent_dic = { "Sport": "运动", "Study": "学习", "Livelonger": "养生", "record": "打卡", "Reject": "否定", "None": "None" }

// for (var dir of directory) {
var path = `/home/q/flag/data/FLAG绿色夸夸群/🎋/flag.json`
fs.readFile(path, async function (err, flags_json) {
    if (err) {
    }
    else {
        var flags = flags_json.toString();

        flags_json = JSON.parse(flags);
        //console.log(flags_json)
        flags = flags_json["flags"]
        console.log(flags.length)
        for (j = 0; j < flags.length; j++) {
            var flag = flags[j]
            console.log(j)
            console.log(flags.length)
            flag_str = flag["flag"]
            flag_str = flag_str.replace(/<br\/>/g, ' ')
            const re = /\s?\d[\.())\（\）、]\s?/
            new_flags = flag_str.split(re);
            new_flags = new_flags.map(el => el.trim());
            new_flags = new_flags.filter(function (el) {
                return el != null && el != '' && el.length>=2;
            });

            //new_flags = flag_str.match(/(?<=\d[\.())\（\）]\s*)/g);
            console.log(new_flags)
            var res = {}
            res["date"] = flag["date"]

            flags_json.flags.splice(flags_json.flags.length - 1, 1)
            for (i = 0; i < new_flags.length; i++) {
                intent = await utils.getPrediction(new_flags[i])
                if (intent) {
                    console.log(intent)
                    res[i] = {
                        "type": intent_dic[intent],
                        "content": new_flags[i]
                    }
                }
            }
            console.log(res)
        }
        flags_json.flags.push(res)
        var str = JSON.stringify(flags_json);
        console.log(str)
        fs.writeFile(path, str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log('Add new flags to flags...')
        })
    }
})
// }
//console.log(files)