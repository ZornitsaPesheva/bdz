const API_URL =
  "https://tickets.bdz.bg/portal/api/Ticket/GetDepartureTrainInfoList?stationID=63&pageNum=1&pageCount=100";

const list = document.querySelector("#trains");
const statusText = document.querySelector("#status");

async function loadTrains() {
  try {
    const response = await fetch(API_URL, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const nextTrains = data.trains
      .filter(train => {
        const [hours, minutes] = train.hour.split(":").map(Number);
        return hours * 60 + minutes >= currentMinutes;
      })
      .slice(0, 10);

    statusText.textContent = nextTrains.length
      ? `Обновено в ${now.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit"
        })}`
      : "Няма повече влакове за днес.";

    list.innerHTML = nextTrains
      .map(train => `
        <li>
          <span>
            <span class="time">${train.hour.slice(0, 5)}</span><br>
            ${train.category} ${train.train} → ${train.station}
          </span>
          ${
            train.delay
              ? `<span class="delay">+${train.delay} мин.</span>`
              : ""
          }
        </li>
      `)
      .join("");
  } catch (error) {
    statusText.textContent = `Неуспешно зареждане: ${error.message}`;
  }
}

loadTrains();