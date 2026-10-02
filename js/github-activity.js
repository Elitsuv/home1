(function () {
  "use strict";

  const USERNAME = "elitsuv";
  const DEFAULT_LABEL = "Top contributions in:";
  const DEFAULT_CELL_SIZE = 11;
  const GAP = 3;
  const MONTHS = 12;
  const WEEKS_PER_MONTH = 365.25 / 12 / 7;
  const STACK_LIMIT = 3;
  const MIN_LABEL_WEEKS = 3;

  const weeksFor = (m) => Math.max(1, Math.ceil(m * WEEKS_PER_MONTH));

  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  function describeDay(day) {
    const noun = day.count === 1 ? "contribution" : "contributions";
    const dateObj = new Date(`${day.date}T00:00:00`);
    return `${day.count} ${noun} on ${DATE_FORMAT.format(dateObj)}`;
  }

  function getLightCommitGradient(totalCommits, index = 0) {
    const seed = Number(totalCommits) || 217;
    const hue = Math.round(((seed * 137.508) + (index * 68)) % 360);
    const light1 = `hsl(${hue}, 96%, 95%)`;
    const light2 = `hsl(${(hue + 20) % 360}, 85%, 88%)`;
    const light3 = `hsl(${(hue + 35) % 360}, 75%, 82%)`;
    const textTone = `hsl(${hue}, 75%, 26%)`;
    const strokeLight = `#d4d4d8`;
    const strokeDark = `hsl(${hue}, 48%, 52%)`;

    const innerBg = `radial-gradient(circle at 35% 30%, ${light1} 0%, ${light2} 55%, ${light3} 100%)`;
    const borderGradient = `conic-gradient(from 45deg, ${strokeLight} 0%, ${strokeLight} 15%, ${strokeDark} 35%, ${strokeDark} 40%, ${strokeLight} 60%, ${strokeLight} 65%, ${strokeDark} 85%, ${strokeDark} 90%, ${strokeLight} 100%)`;

    const style = `background-image: ${innerBg}, ${borderGradient}; background-origin: padding-box, border-box; background-clip: padding-box, border-box; -webkit-background-clip: padding-box, border-box; border: 1px solid transparent; color: ${textTone}; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);`;
    return { hue, textTone, strokeLight, strokeDark, innerBg, borderGradient, style };
  }

  const CALENDAR_API = "https://github-contributions-api.jogruber.de/v4";
  const EVENTS_API = "https://api.github.com/users";

  async function fetchCalendar(login) {
    try {
      const res = await fetch(`${CALENDAR_API}/${login}?y=last`);
      if (!res.ok) return null;
      const json = await res.json();
      const days = json?.contributions ?? [];
      if (!days.length) return null;

      // columns are weeks, so first day must be Sunday
      const start = days.findIndex(
        (d) => new Date(`${d.date}T00:00:00Z`).getUTCDay() === 0
      );

      return days.slice(start < 0 ? 0 : start).map((d) => ({
        date: d.date,
        count: d.count,
        level: Math.min(4, Math.max(0, d.level))
      }));
    } catch (e) {
      console.warn("GitHub calendar fetch error:", e);
      return null;
    }
  }

  async function fetchRepos(login) {
    try {
      const res = await fetch(`${EVENTS_API}/${login}/events/public?per_page=100`);
      if (!res.ok) throw new Error("Events fetch returned status " + res.status);
      const events = await res.json();
      const counts = new Map();

      for (const event of events) {
        if (event.type !== "PushEvent" || !event.repo) continue;
        const commits = event.payload?.commits?.length ?? 1;
        counts.set(event.repo.name, (counts.get(event.repo.name) ?? 0) + commits);
      }

      const top = [...counts.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, STACK_LIMIT)
        .map(([fullName, count]) => {
          const [owner, name] = fullName.split("/");
          const isOwn = owner.toLowerCase() === login.toLowerCase();
          const isJev = fullName.toLowerCase().includes("jev-ultrafast") || (name && name.toLowerCase().includes("jev-ultrafast"));
          return {
            name: name || fullName,
            fullName,
            count,
            href: isJev ? "https://github.com/browser-use/jev-ultrafast" : `https://github.com/${fullName}`,
            prUrl: isJev ? "https://github.com/browser-use/jev-ultrafast/pull/108" : null,
            logo: isOwn ? null : `https://github.com/${owner}.png?size=64`
          };
        });

      // Always guarantee jev-ultrafast with PR #108 is featured
      if (!top.some(r => r.name.toLowerCase().includes("jev-ultrafast"))) {
        top.splice(1, 0, {
          name: "jev-ultrafast",
          fullName: "browser-use/jev-ultrafast",
          count: 14,
          href: "https://github.com/browser-use/jev-ultrafast",
          prUrl: "https://github.com/browser-use/jev-ultrafast/pull/108",
          logo: "https://github.com/browser-use.png?size=64"
        });
      }

      if (top.length > 0) return top.slice(0, STACK_LIMIT);
    } catch (e) {
      console.warn("GitHub repos events fallback:", e);
    }

    // Suvro (@elitsuv) active projects fallback
    return [
      { name: "aestra", fullName: `${login}/aestra`, count: 18, href: `https://github.com/${login}/aestra`, prUrl: null, logo: null },
      { name: "jev-ultrafast", fullName: `browser-use/jev-ultrafast`, count: 14, href: `https://github.com/browser-use/jev-ultrafast`, prUrl: "https://github.com/browser-use/jev-ultrafast/pull/108", logo: "https://github.com/browser-use.png?size=64" },
      { name: "Cyla", fullName: `${login}/Cyla`, count: 8, href: `https://github.com/${login}/Cyla`, prUrl: null, logo: null }
    ];
  }

  function emptyDays(weeks) {
    const today = new Date();
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (weeks * 7 - 1 - i));
      return {
        date: date.toISOString().slice(0, 10),
        count: 0,
        level: 0
      };
    });
  }

  function toWeeks(contributions) {
    const weeks = [];
    for (let i = 0; i < contributions.length; i += 7) {
      weeks.push(contributions.slice(i, i + 7));
    }
    return weeks;
  }

  function toMonthLabels(weeks) {
    const labels = weeks.map(() => null);
    const monthAt = (index) => weeks[index]?.[0]?.date.slice(5, 7);

    let start = 0;
    for (let i = 1; i <= weeks.length; i++) {
      if (i < weeks.length && monthAt(i) === monthAt(start)) continue;
      if (i - start >= MIN_LABEL_WEEKS) {
        labels[start] = MONTH_NAMES[Number(monthAt(start)) - 1] ?? null;
      }
      start = i;
    }
    return labels;
  }

  // Tooltip singleton
  let tooltipEl = null;

  function getTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "github-activity-tooltip";
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(day, cellEl) {
    const tooltip = getTooltip();
    tooltip.textContent = describeDay(day);
    tooltip.classList.add("is-visible");

    const rect = cellEl.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth || 120;
    const half = tooltipWidth / 2;
    const edge = 8 + half;
    const x = rect.left + rect.width / 2;
    const left = Math.min(Math.max(x, edge), window.innerWidth - edge);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${rect.top}px`;
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.classList.remove("is-visible");
    }
  }

  function renderCard(root) {
    let contributions = emptyDays(weeksFor(MONTHS));
    let cachedWeeks = toWeeks(contributions);
    let repos = [];
    let isOpen = false;
    let totalCommitCount = 217;

    root.innerHTML = `
      <div class="github-activity-card">
        <div class="github-activity-header">
          <p id="gha-title" class="github-activity-title">Contributions in the last year</p>
          <a href="https://github.com/${USERNAME}" target="_blank" rel="noopener noreferrer" class="github-activity-user-link">
            <span>@${USERNAME}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>

        <div id="gha-grid" class="github-activity-grid">
          <div id="gha-months" class="github-activity-months"></div>
          <div id="gha-weeks" class="github-activity-weeks"></div>
        </div>

        <div id="gha-panel" class="github-activity-panel is-closed">
          <div id="gha-panel-header" class="github-activity-panel-header">
            <span class="github-activity-panel-label">${DEFAULT_LABEL}</span>
            <div class="github-activity-panel-right">
              <div id="gha-avatars" class="github-activity-avatar-stack"></div>
              <button type="button" id="gha-chevron-btn" class="github-activity-chevron-btn" aria-label="Toggle top repositories" aria-expanded="false">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="github-activity-chevron-icon">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            </div>
          </div>
          <ul id="gha-repos" class="github-activity-repo-list"></ul>
        </div>
      </div>
    `;

    const titleEl = root.querySelector("#gha-title");
    const gridEl = root.querySelector("#gha-grid");
    const monthsEl = root.querySelector("#gha-months");
    const weeksEl = root.querySelector("#gha-weeks");
    const panelEl = root.querySelector("#gha-panel");
    const panelHeaderEl = root.querySelector("#gha-panel-header");
    const avatarsEl = root.querySelector("#gha-avatars");
    const chevronBtn = root.querySelector("#gha-chevron-btn");
    const reposEl = root.querySelector("#gha-repos");

    function renderGrid() {
      if (!gridEl) return;
      const availableWidth = gridEl.clientWidth || root.clientWidth || 600;
      const columnsFit = Math.max(1, Math.floor((availableWidth + GAP) / (DEFAULT_CELL_SIZE + GAP)));
      const cap = Math.min(cachedWeeks.length, weeksFor(MONTHS));
      const visibleCount = Math.min(cap, columnsFit);
      const visibleWeeks = cachedWeeks.slice(-visibleCount);

      // Render Month Labels
      const labels = toMonthLabels(visibleWeeks);
      monthsEl.innerHTML = labels
        .map((month) => `
          <div class="github-activity-month-col">
            ${month ? `<span class="github-activity-month-label">${month}</span>` : ""}
          </div>
        `)
        .join("");

      // Render Week Columns & Cells with Grey classes
      weeksEl.innerHTML = visibleWeeks
        .map((week, wIdx) => `
          <div class="github-activity-week">
            ${week
              .map((day) => `
                <div class="github-activity-cell"
                     data-date="${day.date}"
                     data-count="${day.count}"
                     style="animation-delay: ${wIdx * 0.008}s;">
                  <div class="github-activity-cell-inner lvl-${day.level}"></div>
                </div>
              `)
              .join("")}
          </div>
        `)
        .join("");

      // Attach tooltip listeners
      weeksEl.querySelectorAll(".github-activity-cell").forEach((cell) => {
        cell.addEventListener("pointerenter", () => {
          const day = {
            date: cell.getAttribute("data-date"),
            count: Number(cell.getAttribute("data-count"))
          };
          showTooltip(day, cell);
        });
      });

      weeksEl.addEventListener("pointerleave", hideTooltip);
    }

    function renderPanel() {
      if (!repos.length) {
        panelEl.style.display = "none";
        return;
      }
      panelEl.style.display = "block";

      avatarsEl.innerHTML = repos
        .slice(0, STACK_LIMIT)
        .map((r, i) => {
          const theme = getLightCommitGradient(totalCommitCount, i);
          return `
            <span class="github-activity-avatar-thumb" style="${theme.style}" title="${r.name}">
              ${r.logo ? `<img src="${r.logo}" alt="${r.name}">` : `<span style="font-weight: 700; color: ${theme.textTone};">${r.name.charAt(0).toUpperCase()}</span>`}
            </span>
          `;
        })
        .join("");

      reposEl.innerHTML = repos
        .map((r, i) => {
          const theme = getLightCommitGradient(totalCommitCount, i);
          return `
            <li>
              <div class="github-activity-repo-item">
                <a href="${r.href}" target="_blank" rel="noreferrer" class="github-activity-repo-main">
                  <span class="github-activity-avatar-thumb" style="${theme.style}">
                    ${r.logo ? `<img src="${r.logo}" alt="${r.name}">` : `<span style="font-weight: 700; color: ${theme.textTone};">${r.name.charAt(0).toUpperCase()}</span>`}
                  </span>
                  <span class="github-activity-repo-name">${r.name}</span>
                </a>
                <div class="github-activity-repo-meta">
                  ${r.prUrl ? `
                    <a href="${r.prUrl}" target="_blank" rel="noreferrer" class="github-activity-pr-badge" title="Open Pull Request #108">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>
                      </svg>
                      <span>PR #108</span>
                    </a>
                  ` : ''}
                  <span class="github-activity-repo-count">${r.count} commits</span>
                </div>
              </div>
            </li>
          `;
        })
        .join("");
    }

    function togglePanel(open) {
      isOpen = open;
      chevronBtn.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        panelEl.classList.remove("is-closed");
        panelEl.classList.add("is-open");
      } else {
        panelEl.classList.remove("is-open");
        panelEl.classList.add("is-closed");
      }
    }

    panelHeaderEl.addEventListener("click", () => togglePanel(!isOpen));

    document.addEventListener("click", (e) => {
      if (isOpen && !panelEl.contains(e.target)) {
        togglePanel(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        togglePanel(false);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      renderGrid();
    });
    resizeObserver.observe(gridEl);

    renderGrid();

    Promise.all([fetchCalendar(USERNAME), fetchRepos(USERNAME)])
      .then(([calData, reposData]) => {
        if (calData && calData.length) {
          contributions = calData;
          cachedWeeks = toWeeks(contributions);

          const total = contributions.reduce((sum, d) => sum + d.count, 0);
          totalCommitCount = total;
          const parsedYear = Number(contributions[contributions.length - 1]?.date.slice(0, 4));
          const displayYear = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();
          titleEl.textContent = `${total} contributions in ${displayYear}`;

          renderGrid();
        }

        if (reposData) {
          repos = reposData;
        }
        renderPanel();
      })
      .catch((err) => {
        console.warn("GitHubActivity init error:", err);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("github-activity-root");
    if (root) {
      renderCard(root);
    }
  });

  window.GitHubActivity = {
    render: renderCard
  };
})();
