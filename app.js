/* D O M  C O N T E N T   L O A D */

document.addEventListener('DOMContentLoaded', function () {
  let map = L.map('map').setView([51.50, -0.09], 13);
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  L.marker([51.5, -0.09]).addTo(map)
  .bindPopup('A pretty CSS popup.<br> Easily customizable.')
  .openPopup();


  /* H A M B U R G E R */

  const hamburger = document.querySelector('.hamburger input#checkbox');
  const overlay = document.querySelector('.overlay');
  const menu = document.querySelector('.menu');
  const descrBtn = document.querySelector('.desc');
  const commentBtn = document.querySelector('.comment');
  const descrText = document.querySelector('.text-description');
  const commentText = document.querySelector('.text-commentaire');
  const arrowDescr = document.querySelector('#arrowDescr');
  const arrowComment = document.querySelector('#arrowComment');
  const smsCard = document.querySelector('.msg-container');
  const logoMsg = document.querySelector('.logo-msg');
  const callCard = document.querySelector('.call-container');
  const webCard = document.querySelector('.web-container');
  const emojiSms = document.querySelector('.emoji-sms');
  const emojiCall = document.querySelector('.emoji-call');
  const emojiWeb = document.querySelector('.emoji-web');

  function toggleMenu() {
    const isChecked = hamburger.checked;
    if (isChecked) {
      overlay.style.width = '100vw';
      menu.style.display = 'flex';
      menu.style.opacity = '1';

      if (!descrText.classList.contains('hidden')) {
        descrText.classList.add('hidden');
        arrowDescr.className = 'bx bxs-down-arrow';
      }

      if (!commentText.classList.contains('hidden')) {
        commentText.classList.add('hidden');
        arrowComment.className = 'bx bxs-down-arrow';
      }
    } else {
      overlay.style.width = '0';
      menu.style.display = 'none';
      menu.style.opacity = '0';
    }
  }

  function toggleDesc() {
    const isCloseDesc = descrText.classList.contains('hidden');
    if (isCloseDesc) {
      descrText.classList.remove('hidden');
      arrowDescr.className = 'bx bxs-up-arrow';
    } else {
      descrText.classList.add('hidden');
      arrowDescr.className = 'bx bxs-down-arrow';
    }
  }

  function toggleComment() {
    const isCloseDesc = commentText.classList.contains('hidden');
    if (isCloseDesc) {
      commentText.classList.remove('hidden');
      arrowComment.className = 'bx bxs-up-arrow';
    } else {
      commentText.classList.add('hidden');
      arrowComment.className = 'bx bxs-down-arrow';
    }
  }

  hamburger.addEventListener('click', toggleMenu);
  descrBtn.addEventListener('click', toggleDesc);
  commentBtn.addEventListener('click', toggleComment);

  /* S H O W   M A P */

  const mapFrame = document.querySelector('.img-frame');
  
  function showMap(){
    setTimeout(() => {
      mapFrame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=2.2831706786809596%2C48.81550339197041%2C2.2968293213190405%2C48.82449660802959&layer=mapnik';
  }, 600);
  }

  /* B U T T O N   A C T I V A T I O N */

  const bigBtn = document.querySelector('.button');
  bigBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    GetLocationApi();
    showMap();
});

/* A N I M A T I O N S */

const start = document.querySelector('.start');
const result = document.querySelector('.result');

bigBtn.addEventListener('click', () => {
  bigBtn.classList.add('button-animate');
  start.classList.add('start-animate');
  result.classList.add('result-animate');
  result.classList.remove('hidden');
})

  /* F U N C T I O N S */

  async function GetLocationApi() {
    try {
      // Fetch the token from your backend server
      const tokenResponse = await fetch('http://localhost:3000/api/token');
      if (!tokenResponse.ok) throw new Error('Failed to fetch token');
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Use the token to make the second API call
      const locationResult = await fetch(
        'https://api.orange.com/camara/location-retrieval/orange-lab/v0/retrieve',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device: { phoneNumber: '+33699901032' },
            maxAge: 60,
          }),
        }
      );

      if (!locationResult.ok) throw new Error('Failed to fetch location data');
      const locationData = await locationResult.json();

      console.log(locationData);
      const userLat = locationData.area.center.latitude;
      const userLon = locationData.area.center.longitude;

      const { minLat, minLon, maxLat, maxLon } = calculateBoundingCoordinates(
        userLat,
        userLon,
        500
      );

      console.log(minLat, minLon, maxLat, maxLon);

      const openCellIdResult = await fetch(`https://opencellid.org/cell/getInArea?key=pk.d219afddac4c790d23e6fa6349243bbd&BBOX=${minLat},${minLon},${maxLat},${maxLon}&format=json&limit=1`);

      const openCellIdData = await openCellIdResult.json();
      console.log(openCellIdData);

      // Calculate distance to each antenna and find the closest
      const closestAntenna = findClosestAntenna(userLat, userLon, openCellIdData.cells);

      console.log('Closest Antenna:', closestAntenna);

      SMSColor(closestAntenna.distance);
      CALLColor(closestAntenna.distance);
      WEBColor(closestAntenna.distance);
      ChangeMapLocation(locationData.area.center.latitude,locationData.area.center.longitude);
      SetArea(closestAntenna.lat,closestAntenna.lon,closestAntenna.range);

    } catch (error) {
      console.error('Error:', error);
    }
  }

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function toDegrees(radians) {
    return (radians * 180) / Math.PI;
  }

  function calculateBoundingCoordinates(lat, lon, distance) {
    const R = 6371000; // Earth's radius in meters
    const deltaLat = distance / R;
    const deltaLon = distance / (R * Math.cos(toRadians(lat)));

    const maxLat = lat + toDegrees(deltaLat);
    const minLat = lat - toDegrees(deltaLat);
    const maxLon = lon + toDegrees(deltaLon);
    const minLon = lon - toDegrees(deltaLon);

    return {
      minLat: minLat,
      minLon: minLon,
      maxLon: maxLon,
      maxLat: maxLat,
    };
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  function findClosestAntenna(userLat, userLon, antennas) {
    let closest = null;
    let minDistance = Infinity;

    antennas.forEach((antenna) => {
      const distance = haversine(
        userLat,
        userLon,
        antenna.lat, // Assuming "lat" is the latitude key in the API response
        antenna.lon // Assuming "lon" is the longitude key in the API response
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = {
          distance: minDistance,
          range: antenna.range,
          lat:antenna.lat,
          lon:antenna.lon
        };
      }
    });
    return closest;
  }

  function SMSColor(distance){
    if(distance >= 1000){
      smsCard.style.backgroundColor = '#FC0505'
      logoMsg.src = 'img/logo-msg-red.png'
      emojiSms.src = 'img/emoji-sad.png'
    } else if (distance >= 500){
      smsCard.style.backgroundColor = '#FF6A00'
      logoMsg.src = 'img/logo-msg-orange-orange.png'
      emojiSms.src = 'img/emoji-wait.png'
    } else {
      smsCard.style.backgroundColor = '#50CC51'
      logoMsg.src = 'img/logo-msg-green.png'
      emojiSms.src = 'img/emoji-happy.png'
    }
  }

  function CALLColor(distance){
    if(distance >= 500){
      callCard.style.backgroundColor = '#FC0505'
      emojiCall.src = 'img/emoji-sad.png'
    } else if (distance >= 250){
      callCard.style.backgroundColor = '#FF6A00'
      emojiCall.src = 'img/emoji-wait.png'
    } else {
      callCard.style.backgroundColor = '#50CC51'
      emojiCall.src = 'img/emoji-happy.png'
    }
  }

  function WEBColor(distance){
    if(distance >= 250){
      webCard.style.backgroundColor = '#FC0505'
      emojiWeb.src = 'img/emoji-sad.png'
    } else if (distance >= 125){
      webCard.style.backgroundColor = '#FF6A00'
      emojiWeb.src = 'img/emoji-wait.png'
    } else {
      webCard.style.backgroundColor = '#50CC51'
      emojiWeb.src = 'img/emoji-happy.png'
    }
  }

  function ChangeMapLocation(lat,lon,msg = "YOU")
  {
    map.setView([lat, lon], 13);
    L.marker([lat,lon]).addTo(map)
    .bindPopup(`${msg}`)
    .openPopup();
  }

  let markers = [];

  function SetArea(lat,lon,range)
  {
    markers.forEach(marker => (marker.remove()))
    markers = [];

    let marker = L.marker([lat,lon]).addTo(map)
    .bindPopup(`Antenna`)
    .openPopup();

    // Création d'une zone autour du point
    let circle = L.circle([lat, lon], {
      color: '#f57b42',        // Couleur de la bordure
      fillColor: '#f57b42',   // Couleur de remplissage
      fillOpacity: 0.2,     // Opacité du remplissage
      radius: range           // Rayon en mètres
    }).addTo(map);

    markers.push(marker);
    markers.push(circle);
  }

});
