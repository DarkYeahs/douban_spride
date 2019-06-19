const cheerio = require('cheerio');
const services = require('../services');
const sleep = require('sleep');
const moment = require('moment');

let subjectList = []

class AnalysisData {
  constructor() {
    this.conditionList = [
      // '转租',
      // '单间',
      // '一房一厅',
      // '猫',
      // '女'
    ]
    this.mustConditionList = [
      // '番禺',
      // '泊寓'
      // '市桥',
      // '地铁',
      '租',
      // '女'
      // '主卧',
      // '信业尚誉'
    ]
    this.unconditionList = [
      // '女生',
      // '女性',
      // '姐',
      '已转租',
      '已出租',
      '已租',
      '求租',
      '合租',
      '大石',
      '板桥',
      '南村万博',
      '涌口',
    ]
    this.infoList = []
    this.start = 0
    this.limit = moment().subtract('days', 5).unix() * 1000
    console.log(new Date(this.limit))
  }
  async getListdata (area) {
    this.start = 0
    await this.getItemData(area)
    sleep.msleep(1000);
    let len = this.infoList.length
    let time = 0

    if (len === 0) return []
    while(this.infoList[len - 1].timeStamp > this.limit) {
      this.start += 50

      // if (this.start > 500) break;

      sleep.msleep(2000);
      let getResult = await this.getItemData(area)

      if (getResult === false) {
        time++
        if (time === 3) break;
        sleep.msleep(1000 * time * 2);
        this.start -= 50
      }
      else {
        time = 0
      }
      len = this.infoList.length
    }
    // console.log(this.start)
    this.infoList = this.infoList.filter(a => {
      return a.timeStamp >= this.limit
    })
    return this.infoList
  }

  async getItemData(area) {
    let html
    try {
      html = await services.getPageListInfo(area, this.start)
    }
    catch(e) {
      console.log('error', e.response && e.response.status, this.start)
      return false
    }
    // const html = await services.getPageListInfo(area, this.start)

    const $ = cheerio.load(html);
    const list = $('.olt tr');
    const len = list.length;
    let infoList = []
    // let subjectList = []
    // console.log(html);
    for (let i = 0; i < len; i++) {
      let item = list.eq(i)
      let info = {}
      let subjectEl = item.find('.td-subject a')
      let subject = subjectEl.attr('title')
      subject = subject.replace(/\s+/g, '')
      // subject = subject.replace(/\s+/g, '')
      // console.log(subject)
      let time = new Date(item.find('.td-time').attr('title'))
      let place = item.find('td:last-child a').html()
      if (this.findCondition(subject, time, place)) {
        let replayNum = parseInt(item.find('.td-reply span').html())
        let link = item.find('.td-subject a').attr('href')

        info.subject = subject
        info.time = time
        info.timeStamp = +time
        info.replayNum = replayNum
        info.link = link
        info.place = place
        if (subjectList.indexOf(subject) === -1) {

          console.log(subject, link)
          this.infoList.push(info)
          subjectList.push(subject)
        }
      }
    }
    return true;
  }

  async getItemContent(url) {
    let html = ''
    try {

    }catch(e) {}
    return content
  }

  findCondition(subject, time, place) {
    const conditionList = this.conditionList
    const unconditionList = this.unconditionList
    const mustConditionList = this.mustConditionList
    const len = conditionList.length
    const unlen = unconditionList.length
    const mustlen = mustConditionList.length

    // console.log(place)

    // if (place.indexOf('广州') === -1) return false

    if (unlen === 0 && mustlen === 0 && len === 0) return true

    // if (time < this.limit) return false

    for (let i = 0;i < unlen; i++) {
      const uncondition = unconditionList[i]
      if (subject.indexOf(uncondition) > -1) return false
    }

    for (let i = 0;i < mustlen; i++) {
      const mustCondition = mustConditionList[i]
      if (subject.indexOf(mustCondition) === -1) return false
    }

    if (len === 0) return true

    for (let i = 0;i < len; i++) {
      const condition = conditionList[i]
      if (subject.indexOf(condition) > -1) return true
    }

    return false
  }
}



module.exports = new AnalysisData();
