const cheerio = require('cheerio');
const services = require('../services');
const sleep = require('sleep');
const moment = require('moment');

let subjectList = []

class AnalysisData {
  constructor() {
    //  可选关键字列表
    this.conditionList = [
    ]
    //  必须关键字列表
    this.mustConditionList = [
      '租',
    ]
    //  过滤关键字列表
    this.unconditionList = [
      '已转租',
      '已出租',
      '已租',
      '求租',
      '求整租',
      '求转租',
      '合租',
      '大石',
      '板桥',
      '南村万博',
      '涌口',
      '万达广场',
      '天河北',
      '万胜围',
      '天河',
      '锦绣香江',
      '科韵路',
      '白云大道',
      '林和西',
      '5号线',
      '金沙州',
      '汀沙村',
      '科韵路',
      '人和',
      '华景新城',
      '华港花园',
      '客村',
      '美林海岸花园'
    ]
    this.infoList = []
    this.start = 0
    //  爬取帖子的截止时间，当前5天前到今天
    this.limit = moment().subtract(5, 'days').unix() * 1000
    console.log(new Date(this.limit))
  }
  //  爬取豆瓣关键字搜索结果列表
  async getListdata (area, index) {
    if (index === 0) {
      subjectList = []
    }

    this.infoList = []
    this.start = 0

    await this.getItemData(area)
    sleep.msleep(2000);

    let len = this.infoList.length
    let time = 0
    // 如果第一次爬取为空，则直接返回
    if (len === 0) return []
    // 当爬取到的帖子小于限制时间，则结束爬取
    while(this.infoList[len - 1].timeStamp > this.limit) {
      this.start += 50

      sleep.msleep(2000);
      let getResult = await this.getItemData(area)
      // 连续爬取三次失败，则结束该关键字的爬取
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
    //  过滤发帖时间早于限制时间的帖子
    this.infoList = this.infoList.filter(a => {
      return a.timeStamp >= this.limit
    })
    return this.infoList
  }
  /**
   *解析并返回爬取豆瓣的帖子列表
   *
   * @param {*} area  搜索区域
   * @returns Array
   * @memberof AnalysisData
   */
  async getItemData(area) {
    let html
    //  获取爬取结果
    try {
      html = await services.getPageListInfo(area, this.start)
    }
    catch(e) {
      console.log('error', e, e.response && e.response.status, this.start)
      return false
    }
    const $ = cheerio.load(html);
    const list = $('.olt tr');
    const len = list.length;
    let infoList = []
    //  解析数据
    for (let i = 0; i < len; i++) {
      let item = list.eq(i)
      let info = {}
      let subjectEl = item.find('.td-subject a')
      let subject = subjectEl.attr('title')

      let time = new Date(item.find('.td-time').attr('title'))
      let place = item.find('td:last-child a').html()

      place = this.decode(place)
      console.log(place)
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
          this.infoList.push(info)
          subjectList.push(subject)
        }
      }
    }
    return true;
  }
  /**
   *过滤不符合条件的帖子
   *
   * @param {*} subject 帖子主题
   * @param {*} time  帖子时间
   * @param {*} place 帖子发帖讨论组
   * @returns Boolean
   * @memberof AnalysisData
   */
  findCondition(subject, time, place) {
    const conditionList = this.conditionList
    const unconditionList = this.unconditionList
    const mustConditionList = this.mustConditionList
    const len = conditionList.length
    const unlen = unconditionList.length
    const mustlen = mustConditionList.length
    //  判断搜索讨论组是否为带有广州或者番禺关键字，没有则进行过滤
    if (place.indexOf('广州') === -1 && place.indexOf('番禺广场') === -1) return false
    //  判断三个筛选条件是否都为空，为空则返回true
    if (unlen === 0 && mustlen === 0 && len === 0) return true
    //  存在过滤关键字则返回false
    for (let i = 0;i < unlen; i++) {
      const uncondition = unconditionList[i]
      if (subject.indexOf(uncondition) > -1) return false
    }
    //  不存在必须关键字的直接返回false
    for (let i = 0;i < mustlen; i++) {
      const mustCondition = mustConditionList[i]
      if (subject.indexOf(mustCondition) === -1) return false
    }
    //  当可选关键字为空时返回true
    if (len === 0) return true
    //  只要存在任意可选关键字的数据则返回true
    for (let i = 0;i < len; i++) {
      const condition = conditionList[i]
      if (subject.indexOf(condition) > -1) return true
    }
    //  不匹配可选关键字的则返回false
    return false
  }

  async filterUser(list) {
    let userList = []
    let filterList = []
    const len = list.length

    for(let i = 0; i < len; i++) {
      const item = list[i]
      let uid
      try {
        uid = await this.getUserId(item.link)
      }catch(e){console.log(e)}
      sleep.msleep(2000)
      if (userList.indexOf(uid) === -1) {
        filterList.push(item)
        userList.push(uid)
      }
    }

    return filterList
  }

  async getUserId(link) {
    link = link.replace('https://www.douban.com', '')
    let html = ''
    try {
      html = await services.getPageContent(link)
      sleep.msleep(200);
    }
    catch(e) {
      console.log('error', e, e.response && e.response.status, this.start)
      return false
    }

    const $ = cheerio.load(html);
    const el = $('.topic-doc .from a')
    let userLink = el.attr('href')
    let userID = userLink.replace('https://www.douban.com/people/', '').slice(0, -1)
    console.log(userLink, userID)

    return userID
  }

  decode(str) {
    return unescape(str.replace(/&#x/g, '%u').replace(/;/g, ''))
  }
}

module.exports = new AnalysisData();
