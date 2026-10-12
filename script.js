const API_URL =
  "https://tickets.bdz.bg/portal/api/Ticket/GetDepartureTrainInfoList";

const list = document.querySelector("#trains");
const statusText = document.querySelector("#status");
const heading = document.querySelector("#heading");
const panel = document.querySelector("#departure-panel");
const tabs = Array.from(document.querySelectorAll(".station-tab"));
let requestController;


async function loadTrains(station) {
  requestController?.abort();
  requestController = new AbortController();
  const { signal } = requestController;
  statusText.textContent = "Зареждане…";
  list.replaceChildren();

  try {
    const response = await fetch(
      `${API_URL}?stationID=${encodeURIComponent(station.id)}&pageNum=1&pageCount=100`,
      {
        method: "POST",
        signal
      }
    );

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
    if (signal.aborted) {
      return;
    }

    statusText.textContent = `Неуспешно зареждане: ${error.message}`;
  }
}

function selectStation(tab) {
  tabs.forEach(item => {
    const isSelected = item === tab;
    item.setAttribute("aria-selected", String(isSelected));
  });

  const station = {
    id: tab.dataset.stationId,
    name: tab.dataset.stationName
  };
  heading.textContent = `Следващи влакове през ${station.name}`;
  panel.setAttribute("aria-labelledby", tab.id);
  document.title = `Следващи влакове – ${station.name}`;
  loadTrains(station);
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    selectStation(tab);
  });
  tab.addEventListener("keydown", event => {
    let nextIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    event.preventDefault();
    tabs[nextIndex].focus();
    selectStation(tabs[nextIndex]);
  });
});

const initialTab = tabs.find(tab => tab.getAttribute("aria-selected") === "true") || tabs[0];
if (initialTab) {
  selectStation(initialTab);
}