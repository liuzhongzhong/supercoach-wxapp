// pages/students/record/record.js
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
const moment = require('../../../vendor/moment/moment.js');
import $ from '../../../common/common.js';
const util = require('../../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: ["待完成(0)", "已完成(0)", "已取消(0)"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    systemInfo: [],
    incompleteList: [], // 待完成
    completeList: [], // 已完成
    cancelledList: [], // 已取消
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    this.setData({
      'student_id': options.student_id,
    });
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2 - 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 获取待完成列表
    this.getRecord();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  /**
   * 切换菜单
   */
  tabClick: function(e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },

  //手指触摸动作开始 记录起点X坐标
  touchStart: function(e) {
    //开始触摸时 重置所有删除
    var tasksList = this.data.tasksList;
    tasksList.forEach(function(v, i) {
      if (v.isTouchMove) //只操作为true的
        v.isTouchMove = false;
    })
    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      tasksList: tasksList
    })
  },
  //滑动事件处理
  touchMove: function(e) {
    var tasksList = this.data.tasksList;
    var that = this,
      index = e.currentTarget.dataset.index, //当前索引
      startX = that.data.startX, //开始X坐标
      startY = that.data.startY, //开始Y坐标
      touchMoveX = e.changedTouches[0].clientX, //滑动变化坐标
      touchMoveY = e.changedTouches[0].clientY, //滑动变化坐标
      //获取滑动角度
      angle = that.angle({
        X: startX,
        Y: startY
      }, {
        X: touchMoveX,
        Y: touchMoveY
      });
    tasksList.forEach(function(v, i) {
      v.isTouchMove = false
      //滑动超过30度角 return
      if (Math.abs(angle) > 30) return;
      if (i == index) {
        if (touchMoveX > startX) //右滑
          v.isTouchMove = false
        else //左滑
          v.isTouchMove = true
      }
    })
    //更新数据
    that.setData({
      tasksList: tasksList
    })
  },

  /**
   * 计算滑动角度
   * @param {Object} start 起点坐标
   * @param {Object} end 终点坐标
   */
  angle: function(start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y
    //返回角度 /Math.atan()返回数字的反正切值
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },

  catchDelete: function(event) {
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    })
  },

  navigateToCourse: function(event) {
    wx.navigateTo({
      url: '../course/course',
    })
  },

  /**
   * 从服务器获取记录
   */
  getRecord: function() {
    var _this = this;
    var tabs = this.data.tabs;
    let timestamp = moment().valueOf();
    wx.showLoading({
      title: '加载中',
    })
    $.get(
      'task/planRecord', {
        'coachid': wx.getStorageSync('coachid'),
        'sign': util.getSign(timestamp), // 签名（coachid + token + timestamp 的 MD5值）
        'timestamp': timestamp, // 时间戳
        'pageNumber': 1, // 第几页
        'pageSize': 1000, // 每页多少条
        'coachStudentId': this.data.student_id,
      },
      function(res) {
        console.log(res.data);
        if (res.data.code == 0) {
          // 获取待完成课表成功
          tabs[0] = '待完成(' + res.data.data.incompleteTask.totalElements + ')';
          tabs[1] = '已完成(' + res.data.data.completeTask.totalElements + ')';
          tabs[2] = '已取消(' + res.data.data.cancelTask.totalElements + ')';
          _this.setData({
            'incompleteList': _this.optimalData(res.data.data.incompleteTask.content),
            'completeList': _this.optimalData(res.data.data.completeTask.content),
            'cancelledList': _this.optimalData(res.data.data.cancelTask.content),
            'tabs': tabs,
          });
        } else {
          wx.showToast({
            title: '上课记录获取失败',
            icon: 'none'
          })
        }
      }
    )
  },

  /**
   * 优化数组
   */
  optimalData: function(completeList) {
    if (!completeList) {
      return [];
    }
    for (var i = 0; i < completeList.length; i++) {
      completeList[i]['courseTime'] = moment.unix(completeList[i]['beginTime']).format('MM月DD日 HH:mm') + '~' + moment.unix(completeList[i]['endTime']).format('HH:mm');
    }
    return completeList;
  }
})