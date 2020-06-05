//app.js
import http from 'utils/httpClient.js'

App({
  onLaunch: function () {
    
  },
  
  globalData: {
    onLogin:false,
  },
  asyncLogin() {

    let loading = this.globalData.onLogin;
    if (!loading) {
        loading = false;
    }

    let that = this;
    let work = () => {
        console.log('set loading 1');
        that.globalData.onLogin = true;
        return new Promise((resolve, reject) => {
            wx.checkSession({
                success: function () {
                    //session_key 未过期，并且在本生命周期一直有效
                    console.log('we keep session');
                    let token = wx.getStorageSync('token');
                    console.log('current token', token);
                    if (!token) {
                        wx.login({
                            success: function (res) {
                                if (res.code) {
                                    //发起网络请求
                                  console.log(" res.code", res.code);   
                                    return http.get("/user/auth", {
                                            code: res.code
                                        }
                                    ).then((data) => {
                                      console.log("/user/auth",data);
                                        if (data.token) {
                                            console.log('resolve for loading', loading);
                                            wx.setStorageSync('token', data.token)
                                            that.globalData.onLogin = false;
                                             resolve(data.token);                                             
                                         
                                        } else {
                                            reject('系统登录失败！')
                                        }
                                    }).catch( e =>{
                                        let msg = e.message;
                                        if(!msg) {
                                            msg = '登录出错';
                                        }
                                        reject(msg);
                                        throw e;
                                    });
                                } else {
                                    reject('系统登录失败')
                                }
                            },
                            fail: function () {
                                console.log('failed login')
                                reject('登录失败')
                            },
                            complete() {
                                that.globalData.onLogin = false;
                            }
                        });
                    } else {
                        console.log('resolve for loading', loading);
                        if (token) {
                            wx.setStorageSync('token', token)
                        }
                        that.globalData.onLogin = false;
                        resolve(token)
                    }

                },
                fail: function () {
                    console.log('we don\'t keep session');
                    // session_key 已经失效，需要重新执行登录流程
                    wx.login({
                        success: function (res) {
                            if (res.code) {
                                //发起网络请求
                                return http.get("/user/auth", {
                                        code: res.code
                                    }
                                ).then((data) => {
                                    console.log(data);
                                    if (data.token) {
                                        console.log('resolve for loading', loading);
                                        wx.setStorageSync('token', data.token)
                                        that.globalData.onLogin = false;
                                        resolve(data.token);
                                    } else {
                                        reject();
                                    }
                                }).catch((e) => {
                                    reject()
                                });
                            } else {
                                reject()
                            }
                        },
                        fail: function () {
                            console.log('failed login')
                            reject();
                        },
                        complete() {
                            that.globalData.onLogin = false;
                        }
                    });
                }
            })
        }).then((res) => {
            that.globalData.onLogin = false;
            console.info('login done');
            return res;
        });
    };

    if (loading) {
        return new Promise((resolve, reject) => {
            let timer = 0;
            timer = setInterval(() => {
                if (!that.globalData.onLogin) {
                    clearInterval(timer);
                    return resolve(work().then((token) => {
                        return token;
                    }));
                } else {
                    console.log('checking status = ', that.globalData.onLogin);
                }
            }, 300);
        });
    } else {
        console.log("direct work now");
        return work().then((token) => {
            console.log("setting token", token);
            if (token) {
                console.log(token);
                wx.setStorageSync('token', token)
            }
            return token;
        });

    }
  },
})