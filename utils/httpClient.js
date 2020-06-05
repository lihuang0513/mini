import ext from 'ext.js'
import md5util from "./md5.js"
import { Base64 } from "./base64.js"

let api_url = ext.url
let _module = ext.module

const signParam = (param, app) => {
  if(!param) {
      param = {}
  }

  let App = getApp()
  let token = wx.getStorageSync('token')
  param._time = Math.floor((new Date()).getTime()/1000)

  param.access_token = token
  param = sortObject(param)

  let before_array = []
  for(let i in param) {
      let value = param[i];
      if(typeof(value)==='object') {
          continue;
      }
      if(typeof(value)==='undefined') {
          delete param[i];
          continue;
      }
      param[i] = ""+value;
      before_array.push(i+"="+value);
  }
  let before_sign = before_array.join('');
  before_sign += ext.appSecret
  let sign = md5util.hexMD5(Base64.encode(before_sign));
  param._sign = sign;
  return param
}

const sortObject = obj => {
  var newkey = Object.keys(obj).sort();
  //先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
  var newObj = {};//创建一个新的对象，用于存放排好序的键值对
  for (var i = 0; i < newkey.length; i++) {//遍历newkey数组
      newObj[newkey[i]] = obj[newkey[i]];//向新创建的对象中按照排好的顺序依次增加键值对
  }
  return newObj;//返回排好序的新对象
}

const get = (url, data) => {
  let _url = api_url + _module + url;

  return new Promise((resolve, reject) => {
      wx.request({
          url: _url,
          data: signParam(data),
          headers: {
              'Content-Type': 'application/json'
          },
          success: function (res) {
              if(res.statusCode == 401 || res.data.code == 401) {
                resolve(callLogin().then(function(){
                  console.log("reget");
                  return get(url, data);
                }));
              } else if(res.statusCode == 200) {
                  resolve(res.data)
              } else {
                resolve(res)
              }
          },
          fail: function (res) {
              console.log("===get===请求失败===" + _url)
              console.log(res)
              reject(res)
          }
      })
  })
}

const post = (url, data) => {
  return new Promise((resolve, reject) => {
      let _url = api_url + _module + url;
      
      wx.request({
          url: _url,
          data: signParam(data),
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          success: function (res) {
              if(res.statusCode == 401 || res.data.code == 401) {
                resolve(callLogin().then(function(){
                  console.log("repost");
                  return post(url, data);
                }));
              } else if(res.statusCode == 200) {
                  resolve(res.data)
              } else {
                  resolve(res)
              }
          },
          fail: function (res) {
              console.log("===post===请求失败===" + _url)
              console.log(res)
              reject(res)
          }
      })
})
}

const callLogin = ()=>{
  wx.setStorageSync('token','')
  // console.log(getApp().asyncLogin())
  return getApp().asyncLogin();
}

module.exports = {
  get: get,
  post: post
};