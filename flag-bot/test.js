const str = "1. askdjk asdjkjk jklasd 2.上帝哦看3)是的哦i看，的奥斯卡的了"
//const str = "1.ads2)asd了3）three"
const re = /\s?\d[\.())\（\）]\s?/
res = str.split(re);
var filtered = res.filter(function (el) {
    return el != null && el != '';
});
//res = str.match(/(?<=\d+\.\s*)\w+/g);

console.log(filtered);