const fs = require('fs')
const os = require('os')
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

var requestPromise = require('request-promise');
var queryString = require('querystring');

// Analyze a string utterance.
async function getPrediction(text, msg) {

    //////////
    // Values to modify.

    // YOUR-APP-ID: The App ID GUID found on the www.luis.ai Application Settings page.
    const LUIS_appId = "669e60e3-6aeb-4a17-80ae-bebd6d0942b6";

    // YOUR-PREDICTION-KEY: Your LUIS authoring key, 32 character value.
    const LUIS_predictionKey = "9ced7a7cc2f74694acc17a3a9bc3f0b7";

    // YOUR-PREDICTION-ENDPOINT: Replace this with your authoring key endpoint.
    // For example, "https://westus.api.cognitive.microsoft.com/"
    const LUIS_endpoint = "https://kjoaisd.cognitiveservices.azure.com/";

    // The utterance you want to use.
    //////////

    // Create query string
    const queryParams = {
        "show-all-intents": true,
        "verbose": true,
        "query": text,
        "subscription-key": LUIS_predictionKey
    }


    // Create the URI for the REST call.
    const URI = `${LUIS_endpoint}luis/prediction/v3.0/apps/${LUIS_appId}/slots/production/predict?${queryString.stringify(queryParams)}`

    // Send the REST call.
    const response = await requestPromise(URI);
    prediction = JSON.parse(response);
    // Display the response from the REST call.
    const topIntent = prediction["prediction"]["topIntent"]
    const score = prediction["prediction"]["intents"][topIntent]["score"]

    console.log(`${topIntent}: ${prediction["prediction"]["intents"][topIntent]}`);
    if (score > 0.1) {
        return topIntent
    }
    else {
        return null
    }


}

function flagToString(flag) {
    var flag_string = `${flag["date"]}\n `
    for (var key in flag) {
        if (key == "date") {
            continue
        }
        flag_i = flag[key]
        flag_string += `${key} 「${flag_i["type"]}」 ${flag_i["content"]}\n `
    }
    return flag_string
}

function reportRecentFlag(topic, talker_name, msg) {
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
        recent_flag_msg = flagToString(recent_flag)
        console.log(recent_flag_msg);
        msg.say(recent_flag_msg)
    });
}

function reportAllFlags(topic, talker_name, msg) {
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
            flags_str = flags_str + flagToString(flag) + "\n"
        });
        console.log(flags_str);
        msg.say(flags_str)

    });
}

function transferTextToFlags(text) {
    text = text.replace(/@Flag/i, '')
    text = text.replace(/<br[\/\\]>/g, ' ')
    //text = text.replace(/\s/g, '')
    const re = /\s?\d[\.())\（\）、]\s?/
    flags = text.split(re);
    flags = flags.map(el => el.trim());
    flags = flags.filter(function (el) {
        return el != null && el != '' && el.length >= 2;
    });
    return flags;
}

function removeElementInArray(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function writeJSON(flag, path) {
    mkdirp(getDirName(path), function (err) {
        if (err) return console.log(err);
        console.log("directory created.")
    })
    fs.readFile(path, function (err, flags_json) {
        if (err) {
            if (err.errno == -2) {
                var obj = {
                    flags: []
                };
                obj.flags.push(flag)
                console.log("after create obj.")
                fs.writeFile(path, JSON.stringify(obj), function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    return console.log('Add new flags to flags_json...')
                })
            }
            else {
                return console.error(err);
            }
        }
        else {
            var flags = flags_json.toString();

            flags = JSON.parse(flags);
            flags.flags.push(flag);
            var str = JSON.stringify(flags);

            fs.writeFile(path, str, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('Add new flags to flags...')
            })
        }
    })
}

function createJsonFromMessage(msg) {
    date = msg.date().toDateString()
    const real_msg = extract_meaningful_part(msg.text())
    console.log("createJsonFromMessage date", date)
    console.log("createJsonFromMessage text", real_msg)
    if (!real_msg.replace(/\s/g, '').length) {
        return ""
    }
    var res = {}
    res["date"] = date
    res["flag"] = real_msg
    return res
}

function extract_meaningful_part(msg_string) {
    const msg_array = msg_string.split("@Flag")
    console.log("msg_array[1] : ", msg_array[1])
    return msg_array[1]
}

function deleteRecentFlagInJSON(path) {
    //先將原本的 json 檔讀出來
    fs.readFile(path, function (err, flags_json) {
        if (err) {
            return console.error(err);
        }
        //將二進制數據轉換為字串符
        var flags = flags_json.toString();
        //將字符串轉換成JSON對象
        flags = JSON.parse(flags);

        //將數據讀出來並刪除指定部分
        flags.flags.splice(flags.flags.length - 1, 1)
        //console.log(user.userInfo);
        //因為寫入文件（json）只認識字符串或二進制數，所以需要將json對象轉換成字符串
        var str = JSON.stringify(flags);

        //最後再將數據寫入
        fs.writeFile(path, str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log('delete user in userInfo...')
        })
    })
}

module.exports = {
    createJsonFromMessage, writeJSON, deleteRecentFlagInJSON,
    removeElementInArray, extract_meaningful_part, getPrediction,
    flagToString, reportRecentFlag, transferTextToFlags,
    reportAllFlags
};