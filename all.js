// ----- 變數 -----
const cityData = [
  { name: '臺北市', value: 'Taipei' },
  { name: '新北市', value: 'NewTaipei' },
  { name: '桃園市', value: 'Taoyuan' },
  { name: '臺中市', value: 'Taichung' },
  { name: '臺南市', value: 'Tainan' },
  { name: '高雄市', value: 'Kaohsiung' },
  { name: '基隆市', value: 'Keelung' },
  { name: '新竹市', value: 'Hsinchu' },
  { name: '新竹縣', value: 'HsinchuCounty' },
  { name: '苗栗縣', value: 'MiaoliCounty' },
  { name: '彰化縣', value: 'ChanghuaCounty' },
  { name: '南投縣', value: 'NantouCounty' },
  { name: '雲林縣', value: 'YunlinCounty' },
  { name: '嘉義縣', value: 'ChiayiCounty' },
  { name: '嘉義市', value: 'Chiayi' },
  { name: '屏東縣', value: 'PingtungCounty' },
  { name: '宜蘭縣', value: 'YilanCounty' },
  { name: '花蓮縣', value: 'HualienCounty' },
  { name: '臺東縣', value: 'TaitungCounty' },
  { name: '金門縣', value: 'KinmenCounty' },
  { name: '澎湖縣', value: 'PenghuCounty' },
  { name: '連江縣', value: 'LienchiangCounty' },
]
let filterObj = {}
let busData = []
let forthData = []
let backData = []
let filterCity = ''

const citySelect = document.querySelector('.filter__select--city')
const busSearch = document.querySelector('.filter__search')
const searchConfirm = document.querySelector('.filter__confirm')
const backRouteList = document.querySelector('.backRouteList')
const forthList = document.querySelector('.routeList__forth')
const backList = document.querySelector('.routeList__back')

// ----- API base -----
const apiBusRequest = axios.create({
  baseURL: 'https://ptx.transportdata.tw/MOTC/v2/Bus',
  headers: GetAuthorizationHeader()
})

const apiEstimateTimeGet = () => apiBusRequest.get(`/EstimatedTimeOfArrival/City/${filterObj['filterCity']}/${filterObj['filterBusName']}?$format=JSON`)

const apiStopRouteGet = () => apiBusRequest.get(`/StopOfRoute/City/${filterObj['filterCity']}/${filterObj['filterBusName']}?$format=JSON`)

// 選擇地區加入 option
function pushCityOption() {
  let option = '<option value="null">請選擇</option>'
  cityData.forEach(item => {
    option += `<option value="${item['value']}">${item['name']}</option>`
  })
  citySelect.innerHTML = option
}
pushCityOption()

// 篩選資料
function filterCitySelect(e) {
  filterObj['filterCity'] = e.target.value
  console.log(filterObj)
}

function filterBusSearch(e) {
  filterObj['filterBusName'] = e.target.value
  console.log(filterObj)
}

async function searchHandler() {
  try {
    // Get 公車預估到站資料
    const apiEstimateTimeRes = await apiEstimateTimeGet()
    const apiEstimateTimeData = apiEstimateTimeRes.data
    console.log('(成功取得預估到站資料)', apiEstimateTimeData)
    await filterBusEstimateTime(apiEstimateTimeData)
    // Get 公車路線站序資料
    const apiStopRouteRes = await apiStopRouteGet()
    const apiStopRouteData = apiStopRouteRes.data
    console.log('(成功取得預估到站資料)', apiStopRouteData)
    await filterBusRoute(apiStopRouteData)
  }
  catch (err) {
    console.error(err)
  }
}

// Get 公車預估到站資料
function filterBusEstimateTime(data) {
  const workBus = data.filter(item => item['PlateNumb'])
  // 篩選去程公車
  const forthBus = workBus.filter(item => !item['Direction'])
  // 篩選返程公車
  const backBus = workBus.filter(item => item['Direction'])
  console.log(('有在跑的公車(some)'), workBus)
  console.log(('去程公車(some)'), forthBus)
  console.log(('返程公車(some)'), backBus)
  // 組出資料格式
  backBus.forEach(item => {
    // 比對 backBus 與 backData(原始空陣列) 有無一樣的 PlateNumb
    const index = backData.map(item => item['plateNumb']).indexOf(item['PlateNumb'])

    if (index === -1) { // 沒找到
      backData.push({
        plateNumb: item['PlateNumb'], // 車牌號碼
        stops: [
          {
            estimateTime: item['EstimateTime'], // 預估到站時間(秒)
            stopUID: item['StopUID'] // 站牌識別代碼
          }
        ]
      })
    } else { // 有找到
      // 在同樣的 index 裡面的 stops 陣列 push 相同資料
      backData[index]['stops'].push({
        estimateTime: item['EstimateTime'], // 預估到站時間(秒)
        stopUID: item['StopUID'] // 站牌識別代碼
      })
    }
  })
  console.log('backData(some)', backData)
  // getBusRoute()
}

// Get 公車路線站序資料
function filterBusRoute(data) {
  const currentRouteData = data.filter(item => item['RouteName']['Zh_tw'] === filterObj['filterBusName'])
  console.log('公車號碼搜尋完全符合RouteID的資料 currentRouteData(every)', currentRouteData)

  // 去程 Direction: 0 (stopOfRouteData 的 index 為偶數 0、2、4...)

  // 返程 Direction: 1 (stopOfRouteData 的 index 為奇數 1、3、5...)
  let backStr = ''
  let busID = ''
  let time = 0
  let timeText = ''

  currentRouteData[1]['Stops'].forEach(item => {
    backData.forEach(backItem => {
      backItem['stops'].forEach(stop => {
        if (stop['stopUID'] === item['StopUID']) {
          // 公車車牌號碼
          busID = backItem['plateNumb']
          // 時間
          time = Math.floor(stop['estimateTime'] / 60)
          // console.log(busID, time)
          // 文字顯示
          if (time === 0) timeText = '進站中'
          else if (time <= 1 && time > 0) timeText = '即將進站'
          else if (!time) timeText = '––'
          else timeText = `${time} 分鐘`
        }
      })
    })
    backStr += `
        <li class="routeList__item">
          <div class="routeList__mainInfo">
            <div class="routeList__timeLeft">${timeText}</div>
            <div class="routeList__stopInfo">${item['StopUID']} / ${item['StopName']['Zh_tw']}</div>
          </div>
          <div class="routeList__busID">${busID}</div>
        </li>
        `
  })
  backRouteList.innerHTML = backStr
}



// (預備功能) 新增去程、新增倒數更新、手動更新、關鍵字選擇

// ----- 監聽 -----
citySelect.addEventListener('change', filterCitySelect, false)
busSearch.addEventListener('blur', filterBusSearch, false)
searchConfirm.addEventListener('click', searchHandler, false)

// API 驗證 (TDX 提供)
function GetAuthorizationHeader() {
  var AppID = '298e24d8dcd5462d94df034984044beb';
  var AppKey = 'u2fa9eTpee-g9HdU2diZCLoFDhY';

  var GMTString = new Date().toGMTString();
  var ShaObj = new jsSHA('SHA-1', 'TEXT');
  ShaObj.setHMACKey(AppKey, 'TEXT');
  ShaObj.update('x-date: ' + GMTString);
  var HMAC = ShaObj.getHMAC('B64');
  var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

  return { 'Authorization': Authorization, 'X-Date': GMTString /*,'Accept-Encoding': 'gzip'*/ }; //如果要將js運行在伺服器，可額外加入 'Accept-Encoding': 'gzip'，要求壓縮以減少網路傳輸資料量
}
