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
let goData = []
let backData = []

const citySelect = document.querySelector('.filter__select--city')
const busSearch = document.querySelector('.filter__search')
const searchConfirm = document.querySelector('.filter__confirm')

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

// Get 公車預估到站資料
function getBusEstimateTime() {
  axios({
    method: 'get',
    url: `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${filterObj['filterCity']}/${filterObj['filterBusName']}?$format=JSON`,
    headers: GetAuthorizationHeader()
  })
    .then(res => {
      console.log('(成功取得預估到站資料)', res.data)
      const data = res.data
      // 篩選有在跑的公車
      const workBus = data.filter(item => item['PlateNumb'])
      const forthBus = workBus.filter(item => item['Direction'])
      const backBus = workBus.filter(item => !item['Direction'])
      console.log(('有在跑的公車'), workBus)
      console.log(('去程公車'), forthBus)
      console.log(('返程公車'), backBus)
      // 
    })
    .catch(err => console.error('(取得預估到站資料失敗)', err))
}

// ----- 監聽 -----
citySelect.addEventListener('change', filterCitySelect, false)
busSearch.addEventListener('blur', filterBusSearch, false)
searchConfirm.addEventListener('click', getBusEstimateTime, false)


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