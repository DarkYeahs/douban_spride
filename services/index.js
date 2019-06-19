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

    this.instance.interceptors.request.use(function (config) {
      // Do something before request is sent
      // console.log(config)
      return config;
    }, function (error) {
      // Do something with request error
      return Promise.reject(error);
    });
  }

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

  getPageContent(link) {

    return this._get(link)
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
}

module.exports = new Services();
