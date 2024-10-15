// src/routes/test/travelTimeCalculator.js

// ฟังก์ชันแปลงเวลาเป็นวินาที
function timeToSeconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// สร้าง locationDict สำหรับค้นหาสถานี
function createLocationDict(groupedStations) {
  let locationDict = {};
  let prefixes = Object.keys(groupedStations);

  for (let prefix of prefixes) {
    locationDict[prefix] = groupedStations[prefix].map(station => station[1]);
  }
  return locationDict;
}

// จัดกลุ่มสถานีตาม prefix
function groupStationsByPrefix(stations) {
  let groupedStations = {};

  for (let station of stations) {
    const stationId = station['station_id'];
    const stationName = station['station_name'];
    const timeInSeconds = timeToSeconds(station['time_use']);
    const prefix = stationId.split('_')[1]; 

    if (!groupedStations[prefix]) {
      groupedStations[prefix] = [];
    }

    groupedStations[prefix].push([stationId, stationName, timeInSeconds]);
  }

  return groupedStations;
}

// คำนวณเวลาระหว่างสถานีต้นทางและปลายทาง
function findTime(start, end, groupedStations, locationDict) {
  const lstLine = Object.keys(groupedStations);

  for (let prefix of lstLine) {
    if (
      locationDict[prefix].includes(start) &&
      locationDict[prefix].includes(end)
    ) {
      let stations = groupedStations[prefix];
      stations.sort((a, b) => {
        const numA = parseInt(a[0].split('_')[2]);
        const numB = parseInt(b[0].split('_')[2]);
        return numA - numB;
      });

      let startIndex = stations.findIndex(station => station[1] === start);
      let endIndex = stations.findIndex(station => station[1] === end);

      let totalTime = 0;
      if (startIndex < endIndex) {
        for (let j = startIndex + 1; j <= endIndex; j++) {
          totalTime += stations[j][2];
        }
      } else {
        for (let j = startIndex; j >= endIndex; j--) {
          totalTime += stations[j][2];
        }
      }
      return totalTime;
    }
  }
  throw new Error('ไม่พบเส้นทางระหว่างสถานีต้นทางและปลายทาง');
}

// ฟังก์ชันหลักสำหรับคำนวณเวลาเดินทาง
export function calculateTravelTime(stations, start, end, departureTime) {
  let groupedStations = groupStationsByPrefix(stations);
  let locationDict = createLocationDict(groupedStations);

  let dateTime = new Date(departureTime);
  let secondsTA = findTime(start, end, groupedStations, locationDict);
  dateTime.setSeconds(dateTime.getSeconds() + secondsTA);

  return dateTime.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '').slice(0, 16);
}
