'use strict'

class ElectricPowerInfo {
  constructor(jsonp) {
    this.year = jsonp.year;
    this.month = jsonp.month;
    this.day = jsonp.day;
    this.hour = jsonp.hour;
    this.capacity_TenThousandKW = jsonp.capacity; //供給可能最大電力（万kW）
    this.usage_TenThousandKW = jsonp.usage; //この時間帯の消費電力（万kW）
    this.usage_ratio = jsonp.usage / jsonp.capacity;
    this.usage_update_DateUTC = new Date(jsonp.usage_updated + ' UTC');
    this.saving = jsonp.saving;//計画停電ありならtrue
  }
};

function callback_touden(jsonp){
  var touden = new ElectricPowerInfo(jsonp);

  setInnerHtml('time-touden_time', touden.usage_update_DateUTC);

  var canvas = document.getElementById('touden-pie_chart');
  // 円グラフ描画
  electricPowerPieChart(canvas, touden);

  // 凡例 text
  var c = canvas.getContext('2d');

  var font_size = 12;
  var font = font_size + 'px sans-serif';
  c.font = font;
  var text = 'Usage：' + touden.usage_TenThousandKW + '[kW] ' +  Number(touden.usage_ratio * 100).toPrecision(3) + '[%]';
  var w = c.measureText(text);
  fillText(c, text, {x: canvas.width - w.width - 5, y:canvas.height - font_size*2 * 1.2}, '#d33', font, 'left');

  text = 'Capacity：' + touden.capacity_TenThousandKW + '[kW]';
  w = c.measureText(text);
  fillText(c, text, {x: canvas.width - w.width - 5, y:canvas.height - font_size}, '#33d', font, 'left');
}

var yesterday_Date = getYesterday_Date();
var year = yesterday_Date.getFullYear();
var month =  yesterday_Date.getMonth() + 1;
var date = yesterday_Date.getDate();

var script = document.createElement('script');
script.src = 'http://tepco-usage-api.appspot.com/'+ year + '/' + month + '/' + date + '.json?callback=callback_barchart_yesterday';
document.body.appendChild(script);

class ElectricPowerInfoList{
  constructor(electric_power_info_list){
    this.list = [];
    for(var i = 0; i < electric_power_info_list.length; i++){
      var electric_power_info = new ElectricPowerInfo(electric_power_info_list[i]);
      this.list.push(electric_power_info);
    }
  }
};

// コールバック callback_barchart_yesterday
function callback_barchart_yesterday(jsonp) {
  var touden_yesterday_hours = new ElectricPowerInfoList(jsonp);

  var canvas_bar_chart = document.getElementById('touden-bar_chart');

  var stroke_opts = {
    color: 'balck',
    width: 2
  };
  var fill_opts = {
    color: 'rgba(250, 240, 30, 0.9)',
    shadowBlur: 10,
    shadowColor: 'rgba(50, 50, 50, 0.6)'
  }
  barGraph(canvas_bar_chart, touden_yesterday_hours, stroke_opts, fill_opts);

  // Capacity 出力
  var c = canvas_bar_chart.getContext('2d');
  var text = 'Capacity: ' + touden_yesterday_hours.list[0].capacity_TenThousandKW + '[kW]';
  var font_size = Math.floor(canvas_bar_chart.width * 0.025);
  var font = font_size + 'px' + ' sans-serif';
  fillText(c, text, {x: 10, y: font_size + 5}, "#33d", font, 'left');

}

/******************************* 関数 *******************************/
function setInnerHtml(id, inner){
  var ele = document.getElementById(id);
  ele.innerHTML = inner;
  return ele;
}

function electricPowerPieChart(canvas_obj, ElectricPowerInfo) {
  // clear
  var c = canvas_obj.getContext('2d');
  c.clearRect(0, 0, canvas_obj.width, canvas_obj.height);

  var datas = [
    [100, '#33d']
  ];
  var pieChart_opts = {
    center_x: canvas_obj.width / 2,
    center_y: canvas_obj.height / 2,
    r: canvas_obj.width / 3,
    shadowBlur: 10,
    shadowColor: 'rgba(30, 30, 30, 0.9)'
  };
  pieChart(canvas_obj, datas, pieChart_opts);

  var datas = [
    [ElectricPowerInfo.usage_TenThousandKW / ElectricPowerInfo.capacity_TenThousandKW * 100, '#d33']
  ];
  var pieChart_opts = {
    center_x: canvas_obj.width / 2,
    center_y: canvas_obj.height / 2,
    r: canvas_obj.width / 3 * 0.95,
    shadowBlur : 10,
    shadowColor: 'rgba(30, 30, 30, 0.9)'
  };
  pieChart(canvas_obj, datas, pieChart_opts);
}

function pieChart(canvas_obj, datas, opts){
  var c = canvas_obj.getContext('2d');

  // circle
  var pos1 = 0;
  var pos2;

  for(var i = 0; i < datas.length; i++){
    circle(c, datas[i][0], datas[i][1], opts);
  }

  function circle(context, ratio, color, opts) {
    c.save();
    context.beginPath();
    context.moveTo(opts.center_x, opts.center_y);
    pos2 = pos1 + ratio/100 * 2 * Math.PI;
    //円
    context.arc(opts.center_x, opts.center_y, opts.r, pos1 - 0.5 * Math.PI, pos2 - 0.5 * Math.PI, false);
    context.closePath();
    context.fillStyle = color;
    context.shadowBlur = opts.shadowBlur;
    context.shadowColor = opts.shadowColor;
    context.fill();
    c.restore();

    pos1 = pos2;
  }
}

function getYesterday_Date(){
  var yesterday = new Date();
  var day = yesterday.getDate();
  yesterday.setDate(day - 1);
  return yesterday;
}

function barGraph(canvas_obj, electric_power_info_list, stroke_opts, fill_opts){
  var c = canvas_obj.getContext('2d');

  // データ整形
  var datas = [];
  for (var i = 0; i < electric_power_info_list.list.length; i++){
    datas.push(Math.floor(electric_power_info_list .list[i].usage_TenThousandKW / electric_power_info_list.list[i].capacity_TenThousandKW * canvas_obj.height));
  }

  // 最大値 usageの indexを求める
  var max_idx = datas.indexOf(Math.max.apply(null, datas));

  // bar描画
  var pos = 0;
  var bar_width = Math.floor(canvas_obj.width / datas.length);
  for (var i = 0; i < datas.length; i++){
    var barPos = {
      x: pos,
      y: canvas_obj.height - datas[i],
      w: bar_width
    };

    if(i !== max_idx){
      bar(c, datas[i], barPos, stroke_opts, fill_opts);
    }else{
      //最大値
      var max_fill_opts = {
        color: 'rgba(250, 30, 30, 0.9)',
        shadowBlur: 5,
        shadowColor: 'rgba(50, 50, 50, 0.6)'
      };
      bar(c, datas[i], barPos, stroke_opts, max_fill_opts);
      // 最大 usageをテキスト出力
      var text = Number( electric_power_info_list.list[i].usage_TenThousandKW / electric_power_info_list.list[i].capacity_TenThousandKW  * 100).toPrecision(3) + '[%] '+ electric_power_info_list.list[i].usage_TenThousandKW + '[kW]';
      var font_size = Math.floor(canvas_obj.width * 0.02);
      var font = font_size + 'px' + ' sans-serif';
      fillText(c, text, {x: barPos.x, y: barPos.y - font_size}, '#d33', font, 'center');
    }

    /* hour をテキスト出力*/
    var font = Math.floor(barPos.w / 2) + 'px' + ' sans-serif';
    fillText(c, i, {x: barPos.x + barPos.w / 2, y: canvas_obj.height * 0.95}, "#fafafa", font, 'center');

    pos += bar_width;
  }

  function bar(context, data, barPos, stroke_opts, fill_opts) {
    context.save();
    context.strokeStyle = stroke_opts.color;
    context.lineWidth = stroke_opts.width;
    context.strokeRect(barPos.x, barPos.y, barPos.w, data);
    context.fillStyle = fill_opts.color;
    //shadow
    context.shadowBlur = fill_opts.shadowBlur;
    context.shadowColor = fill_opts.shadowColor;
    context.fillRect(barPos.x, barPos.y, barPos.w, data);
    context.restore();
  }
}

function fillText(context, text, pos, color, font, align) {
  context.save();
  context.fillStyle = color;
  context.font = font;
  context.textAlign = align;
  context.fillText(text, pos.x, pos.y);
  context.restore();
}
