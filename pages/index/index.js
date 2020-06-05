import http from '../../utils/httpClient.js'

const app = getApp()

Page({
  data: {
   
  },
  onLoad: function () {
    console.log('onload')
    http.get('/user/index',{}).then( res => {
      console.log(res)
    })
  },
})
