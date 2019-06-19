const data = require('./data');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
let resultList = []
const searchlist = [
  '信业尚誉',
  '东雅园',
  '东豪园',
  '东怡新区',
  '番禺广场',
  '上轩广场',
  '市桥',
  '富华花园',
  '瑞华苑',
  '鸿成花园',
  '来福园',
  '康乐园',
  '鸿禧华庭'
]

var rule2     = new schedule.RecurrenceRule();
var times2    = [1,3,4,7,21,27,35,36,41,56,59];
rule2.minute  = times2;

// schedule.scheduleJob(rule2, () => {
//   resultList = []
//   getList()
// })


resultList = []
getList()


async function getList() {
  const len = searchlist.length

  for (let i = 0; i < len; i++) {
    const searchItem = searchlist[i]
    const list = await data.getListdata(searchItem, i)
    resultList = resultList.concat(list)
  }

  resultList = await data.filterUser(resultList)
  writeFile(resultList)
}


const sendEmail = (html) => {
  nodemailer.createTestAccount(() => {
    let transporter = nodemailer.createTransport({
      service: 'qq',
      port: 568,
      secure: false,
      auth: {
        user: '1550343909@qq.com',
        pass: 'apjxuhnuwytcieae'
      }
    });
    let mailOptions = {
      from: '"Yeahs" <1550343909@qq.com>',
      to: '18814099282@163.com',
      // to: 'Lpy_9292@163.com',
      subject: '豆瓣租房',
      html: html
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('发送成功----', info.accepted[0],info,  new Date());
    });
  });
}

function writeFile(list) {
// 写入文件内容（如果文件不存在会创建一个文件）
// 写入时会先清空文件
  const template = ejs.compile(fs.readFileSync(path.resolve(__dirname, 'template/index.ejs'), 'utf8'));
  const html = template({list, day: new Date()})
  sendEmail(html)
}
