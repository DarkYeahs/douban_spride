const axios = require('axios');
class Services {
  constructor() {
    this.instance = axios.create({
      baseURL: 'https://www.douban.com',
      timeout: 5000,
      headers: {
        Host: 'www.douban.com',
        Referer: 'www.douban.com',
      }
    })

    this.noInstance = axios.create({
      timeout: 5000,
    })

    this.applyID = 'f5gPTu7GVwEuWCuATgTIelEqjSOnojSx'

    this.instance.interceptors.request.use(function (config) {
      // Do something before request is sent
      // console.log(config)
      return config;
    }, function (error) {
      // Do something with request error
      return Promise.reject(error);
    });
  }
  /**
   * 爬取豆瓣讨论帖子列表
   * @param {*} q 搜索地址
   * @param {*} start 页面开始下标
   * @param {*} cat 爬取cat
   * @param {*} sort 排序方式
   */
  getPageListInfo(q, start = 0, cat = 1013, sort = 'time') {
    const params = {
      start,
      q,
      cat,
      sort,
      random: +new Date()
    }

    return this._get('/group/search', { params })
  }
  /**
   * 爬取帖子内容
   * @param {*} link 帖子链接
   */
  getPageContent(link) {

    return this._get(link)
  }

  getAreaList(area, jw) {
    const params = {
      // tag: '小区',
      query: area,
      location: jw,
      output: 'json',
      ak: this.applyID,
      page_size: 10,
      filter: 'distance',
      radius: 3000,
    }
    const url = 'http://api.map.baidu.com/place/v2/search'

    return this.__get(url, params)
  }

  async _get(url, params) {

    const { status, data } = await this.instance
              .get(url, params)
    console.log(params)
    // console.log(status)
      if (status === 200) {
        return data
      }

      throw Error(status)
  }

  async __get(url, params) {
    const { status, data } = await this.noInstance
              .get(url, {params})
    console.log(params, status)
    // console.log(status)
      if (status === 200) {
        return data
      }

      throw Error(status)
  }
}

module.exports = new Services();
