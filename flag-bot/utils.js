const fs = require('fs')
const os = require('os')
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

function removeElementInArray(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
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

module.exports = { createJsonFromMessage, writeJSON, deleteRecentFlagInJSON ,removeElementInArray};