const data = require('./data');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const sleep = require('sleep');
let resultList = []
//  爬取列表
const searchlist = [
  '信业尚誉',
  '东雅园',
  '东豪园',
  '番禺广场',
  '上轩广场',
  '市桥',
  '富华花园',
  '瑞华苑',
  '鸿成花园',
  '来福园',
  '康乐园',
  '鸿禧华庭',
  '东华花园',
  '东怡新区',
  '金海岸花园',
  '融穗澜湾',
  '东秀园',
  '东方白云花园',
  '盛泰花园',
  '东方花园',
  '东怡新地',
  '侨基花园',
  '康裕北苑',
  '北丽园',
]

schedule.scheduleJob('* 45 19 * * *', () => {
  resultList = []
  getList()
})

//  爬取豆瓣帖子列表
async function getList() {
  const len = searchlist.length

  for (let i = 0; i < len; i++) {
    const searchItem = searchlist[i]
    const list = await data.getListdata(searchItem, i)

    resultList = resultList.concat(list)
    //  休眠5s中避免豆瓣启用反爬虫操作
    sleep.msleep(5000)
  }
  //  过滤重复发帖人
  resultList = await data.filterUser(resultList)
  writeFile(resultList)
}

//  发送邮件
const sendEmail = (html) => {
  nodemailer.createTestAccount(() => {
    const transporter = nodemailer.createTransport({
      service: 'qq',
      port: 568,
      secure: false,
      auth: {
        user: '1550343909@qq.com',
        pass: 'apjxuhnuwytcieae'
      }
    });
    const mailOptions = {
      from: '"Yeahs" <1550343909@qq.com>',
      to: '18814099282@163.com, Lpy_9292@163.com',
  //     to: '18814099282@163.com',
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

//  编写邮件内容并发送
function writeFile(list) {
  const template = ejs.compile(fs.readFileSync(path.resolve(__dirname, 'template/index.ejs'), 'utf8'));
  const html = template({list, day: new Date()})
  sendEmail(html)
}
