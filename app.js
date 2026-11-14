
    const SPORTS = {
      tennis: {
        name: "Tennis",
        icon: "T",
        tag: "DSS-model",
        tagClass: "official",
        desc: "KNLTB enkel en dubbel. Lager cijfer = sterker.",
        model: "knltb"
      },
      padel: {
        name: "Padel",
        icon: "P",
        tag: "Indicatie",
        tagClass: "indicative",
        desc: "Padelrating met optionele gamestand.",
        model: "padel"
      },
      tabletennis: {
        name: "Tafeltennis",
        icon: "TT",
        tag: "Puntentabel",
        tagClass: "official",
        desc: "NTTB-achtige puntenberekening. Hoger = sterker.",
        model: "nttb"
      },
      squash: {
        name: "Squash",
        icon: "S",
        tag: "Indicatie",
        tagClass: "indicative",
        desc: "Level-indicatie. Hoger = sterker.",
        model: "elo"
      },
      badminton: {
        name: "Badminton",
        icon: "B",
        tag: "Puntentool",
        tagClass: "helper",
        desc: "Beste scores optellen voor ranglijstinzicht.",
        model: "badminton"
      },
      pickleball: {
        name: "Pickleball",
        icon: "PB",
        tag: "Indicatie",
        tagClass: "indicative",
        desc: "DUPR-achtige indicatie. Hoger = sterker.",
        model: "dupr"
      }
    };

    const DSS_K = 0.275;
    const DSS_Q_SINGLE = 1.824;
    const DSS_Q_DOUBLE = 2.012;
    const STORAGE_KEY = "racket_rating_calculator_history_v3";

    const nttbExpected = [
      { min: 301, max: Infinity, values: [0,0,1,1,1,1] },
      { min: 270, max: 300, values: [1,1,1,2,2,2] },
      { min: 240, max: 269, values: [1,2,3,3,4,4] },
      { min: 210, max: 239, values: [1,2,3,3,4,4] },
      { min: 180, max: 209, values: [2,3,4,5,5,6] },
      { min: 150, max: 179, values: [2,3,4,5,5,6] },
      { min: 120, max: 149, values: [2,4,5,6,7,8] },
      { min: 90, max: 119, values: [3,5,6,8,9,10] },
      { min: 60, max: 89, values: [3,6,8,9,11,12] },
      { min: 30, max: 59, values: [4,7,9,11,12,14] },
      { min: 15, max: 29, values: [4,7,9,11,12,14] },
      { min: 0, max: 14, values: [4,8,10,12,14,16] }
    ];

    const nttbUnexpected = [
      { min: 0, max: 14, values: [4,8,10,12,14,16] },
      { min: 15, max: 29, values: [5,9,11,14,16,18] },
      { min: 30, max: 59, values: [5,10,13,15,18,20] },
      { min: 60, max: 89, values: [7,13,16,20,23,26] },
      { min: 90, max: 119, values: [9,17,21,26,30,34] },
      { min: 120, max: 149, values: [11,21,26,32,37,42] },
      { min: 150, max: 179, values: [13,26,33,39,46,52] },
      { min: 180, max: 209, values: [16,32,40,48,56,64] },
      { min: 210, max: 239, values: [20,39,49,59,68,78] },
      { min: 240, max: 269, values: [23,46,58,69,81,92] },
      { min: 270, max: 299, values: [28,55,69,83,96,110] },
      { min: 300, max: Infinity, values: [32,63,79,95,110,126] }
    ];

    let activeSport = "tennis";
    let matchKind = "single";
    let lastResult = null;

    function init() {
      renderSportList();
      renderCalculator();
      renderHistory();

      document.getElementById("exportHistory").addEventListener("click", exportHistory);
      document.getElementById("clearHistory").addEventListener("click", () => {
        if (confirm("Wil je de opgeslagen berekeningen wissen?")) {
          localStorage.removeItem(STORAGE_KEY);
          renderHistory();
        }
      });
    }

    function renderSportList() {
      const list = document.getElementById("sportList");
      list.innerHTML = '<label for="sport">Sport</label><select id="sport">' + Object.entries(SPORTS).map(([key,s]) => '<option value="'+key+'" '+(key===activeSport?'selected':'')+'>'+s.name+'</option>').join('')+'</select>';
      document.getElementById("sport").addEventListener("change", event => {
        activeSport = event.target.value;
        matchKind = ["tennis", "pickleball"].includes(activeSport) ? "single" : "double";
        lastResult = null;
        renderCalculator();
      });
    }

    function renderCalculator() {
      const s = SPORTS[activeSport];
      const target = document.getElementById("calculator");
      let html = `
        <div class="calc-title-row">
          <div>
            <h2>${s.name}</h2>
            <div class="muted">${s.desc}</div>
          </div>
          <span class="tag ${s.tagClass}">${s.tag}</span>
        </div>
      `;

      if (s.model === "knltb") html += renderTennis();
      if (s.model === "padel") html += renderPadel();
      if (s.model === "nttb") html += renderTabletennis();
      if (s.model === "elo") html += renderElo();
      if (s.model === "badminton") html += renderBadminton();
      if (s.model === "dupr") html += renderPickleball();

      target.innerHTML = html;
      bindCalcEvents();
      target.oninput = invalidateResult;
      target.onchange = invalidateResult;
    }

    function renderTennis() {
      return `
        
        ${matchTabs(["single", "double"])}
        ${matchKind === "single" ? singleForm("tennis", "Rating", "6,0000", "6,5000", true) : doubleForm("tennis", "Rating", "5,0000", "6,0000", "5,8000", "4,8000", false, true)}
        ${actionArea("Bereken tennisrating")}
      `;
    }

    function renderPadel() {
      return `
        <div class="notice warn">Padel is opgenomen als indicatie. De officiële padelrating kan door extra factoren afwijken.</div>
        ${doubleForm("padel", "Padelrating", "5,0000", "6,0000", "5,8000", "4,8000", true, true)}
        ${optionalScore("Optioneel: vul de games in", "Games thuis", "Games uit")}
        ${actionArea("Bereken padelindicatie")}
      `;
    }

    function renderTabletennis() {
      return `
        <div class="notice good">Bij tafeltennis is een hoger puntenaantal beter. Kies het soort wedstrijd en vul de winnaar in.</div>
        <div class="form-grid">
          ${field("ttAName", "Speler 1", "Speler 1")}
          ${field("ttBName", "Speler 2", "Speler 2")}
          ${field("ttARating", "Ratingpunten speler 1", "900", "numeric")}
          ${field("ttBRating", "Ratingpunten speler 2", "820", "numeric")}
          <div class="full">
            <label for="ttWeight">Soort wedstrijd</label>
            <select id="ttWeight">
              <option value="0">R0 - klein / lokaal</option>
              <option value="1" selected>R1 - competitie</option>
              <option value="2">R2 - regionaal toernooi</option>
              <option value="3">R3 - open toernooi</option>
              <option value="4">R4 - nationaal</option>
              <option value="5">R5 - hoogste gewicht</option>
            </select>
            <div class="hint">Twijfel je? Kies voor een gewone competitiewedstrijd R1.</div>
          </div>
          ${winnerChoices("Speler 1 won", "Speler 2 won")}
        </div>
        ${actionArea("Bereken tafeltennisrating")}
      `;
    }

    function renderElo() {
      return `
        <div class="notice warn">Squash is opgenomen als indicatie. Officiële systemen kunnen meer factoren gebruiken dan alleen winst, verlies en verschil in rating.</div>
        <div class="form-grid">
          ${field("eloAName", "Speler 1", "Speler 1")}
          ${field("eloBName", "Speler 2", "Speler 2")}
          ${field("eloARating", "Rating / level speler 1", "1200", "numeric")}
          ${field("eloBRating", "Rating / level speler 2", "1100", "numeric")}
          <div class="full">
            <label for="eloEffect">Effect van deze wedstrijd</label>
            <select id="eloEffect">
              <option value="16">Klein effect</option>
              <option value="24" selected>Normaal effect</option>
              <option value="32">Groot effect</option>
            </select>
          </div>
          ${winnerChoices("Speler 1 won", "Speler 2 won")}
        </div>
        ${optionalScore("Optioneel: vul games of punten in", "Speler 1", "Speler 2")}
        ${actionArea("Bereken indicatie")}
      `;
    }

    function renderBadminton() {
      return `
        <div class="notice">Badminton werkt vooral met ranglijstpunten. Deze tool telt de beste scores op en laat zien wat een nieuwe score doet.</div>
        <div class="form-grid">
          ${field("badName", "Speler", "Speler")}
          ${field("badNew", "Nieuwe score", "450", "numeric")}
          <div class="full">
            <label for="badScores">Huidige scores</label>
            <textarea id="badScores">620
540
480
420
390
360
310
280
240
200
160</textarea>
            <div class="hint">Zet elke score op een nieuwe regel of scheid scores met komma's.</div>
          </div>
        </div>
        ${actionArea("Bereken puntentotaal")}
      `;
    }

    function renderPickleball() {
      return `
        <div class="notice warn">Pickleball is opgenomen als DUPR-achtige indicatie. De officiële DUPR-rating kan afwijken.</div>
        ${matchTabs(["single", "double"])}
        ${matchKind === "single" ? singleForm("pb", "Rating", "3,500", "3,300", false) : doubleForm("pb", "Rating", "3,500", "3,300", "3,700", "3,200", false, false)}
        ${optionalScore("Optioneel: vul de punten in", matchKind === "single" ? "Speler 1" : "Team thuis", matchKind === "single" ? "Speler 2" : "Team uit")}
        ${actionArea("Bereken indicatie")}
      `;
    }

    function matchTabs(types) {
      const labels = { single: "Enkelspel", double: "Dubbelspel" };
      return `<div class="tabs">${types.map(t => `<button type="button" aria-pressed="${matchKind === t}" class="tab ${matchKind === t ? "active" : ""}" data-kind="${t}">${labels[t]}</button>`).join("")}</div>`;
    }

    function field(id, label, value, mode = "text") {
      return `
        <div>
          <label for="${id}">${label}</label>
          <input id="${id}" value="${value}" inputmode="${mode}" autocomplete="off">
        </div>
      `;
    }

    function singleForm(prefix, ratingLabel, rA, rB, lowerIsBetter) {
      return `
        <div class="form-grid">
          ${field(`${prefix}AName`, "Speler 1", "Speler 1")}
          ${field(`${prefix}BName`, "Speler 2", "Speler 2")}
          ${field(`${prefix}ARating`, `${ratingLabel} speler 1`, rA, "decimal")}
          ${field(`${prefix}BRating`, `${ratingLabel} speler 2`, rB, "decimal")}
          <div class="full"><div class="hint">${lowerIsBetter ? "Bij deze sport betekent een lager ratinggetal meestal dat je sterker bent." : "Bij deze sport betekent een hoger ratinggetal meestal dat je sterker bent."}</div></div>
          ${winnerChoices("Speler 1 won", "Speler 2 won")}
        </div>
      `;
    }

    function doubleForm(prefix, ratingLabel, a1, a2, b1, b2, showGender, lowerIsBetter) {
      return `
        <div class="form-grid">
          <div class="team-card">
            <h4>Team thuis</h4>
            <div class="team-grid">
              ${field(`${prefix}A1Name`, "Speler 1", "Thuis speler 1")}
              ${field(`${prefix}A1Rating`, `${ratingLabel} speler 1`, a1, "decimal")}
              ${showGender ? gender(`${prefix}A1Gender`, "Geslacht speler 1") : ""}
              ${field(`${prefix}A2Name`, "Speler 2", "Thuis speler 2")}
              ${field(`${prefix}A2Rating`, `${ratingLabel} speler 2`, a2, "decimal")}
              ${showGender ? gender(`${prefix}A2Gender`, "Geslacht speler 2") : ""}
            </div>
          </div>
          <div class="team-card">
            <h4>Team uit</h4>
            <div class="team-grid">
              ${field(`${prefix}B1Name`, "Speler 1", "Uit speler 1")}
              ${field(`${prefix}B1Rating`, `${ratingLabel} speler 1`, b1, "decimal")}
              ${showGender ? gender(`${prefix}B1Gender`, "Geslacht speler 1") : ""}
              ${field(`${prefix}B2Name`, "Speler 2", "Uit speler 2")}
              ${field(`${prefix}B2Rating`, `${ratingLabel} speler 2`, b2, "decimal")}
              ${showGender ? gender(`${prefix}B2Gender`, "Geslacht speler 2") : ""}
            </div>
          </div>
          <div class="full"><div class="hint">${lowerIsBetter ? "Bij deze sport betekent een lager ratinggetal meestal dat je sterker bent." : "Bij deze sport betekent een hoger ratinggetal meestal dat je sterker bent."}</div></div>
          ${winnerChoices("Team thuis won", "Team uit won")}
        </div>
      `;
    }

    function gender(id, label) {
      return `
        <div>
          <label for="${id}">${label}</label>
          <select id="${id}">
            <option value="M">Man</option>
            <option value="V">Vrouw</option>
          </select>
        </div>
      `;
    }

    function winnerChoices(a, b) {
      return `
        <div class="full">
          <label>Wie won de wedstrijd?</label>
          <div class="choice-grid">
            <label class="choice"><input type="radio" name="winner" value="A" checked>${a}</label>
            <label class="choice"><input type="radio" name="winner" value="B">${b}</label>
          </div>
        </div>
      `;
    }

    function optionalScore(title, aLabel, bLabel) {
      return `
        <details class="full" style="margin-top:14px;">
          <summary>${title}</summary>
          <div class="score-grid">
            ${[1,2,3].map(i => `
              <div class="score-box">
                <strong>Set ${i}</strong>
                <div class="score-pair">
                  <div>
                    <label for="scoreA${i}">${aLabel}</label>
                    <input id="scoreA${i}" inputmode="numeric" placeholder="6">
                  </div>
                  <div>
                    <label for="scoreB${i}">${bLabel}</label>
                    <input id="scoreB${i}" inputmode="numeric" placeholder="4">
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </details>
      `;
    }

    function actionArea(label) {
      return `<div class="actions"><button class="action-button primary" id="calculate">${label}</button></div>
        <div class="error" id="error" role="alert"></div>
        <div class="results" id="results" aria-live="polite" tabindex="-1"></div>
        <div class="actions result-actions" id="resultActions" hidden>
          <button class="action-button" id="saveResult" disabled>Sla resultaat op</button>
          <button class="action-button" id="printResult">Print resultaat</button>
        </div>`;
    }

    function bindCalcEvents() {
      document.querySelectorAll("[data-kind]").forEach(btn => {
        btn.addEventListener("click", () => {
          matchKind = btn.dataset.kind;
          lastResult = null;
          renderCalculator();
        });
      });

      document.getElementById("calculate")?.addEventListener("click", calculate);
      document.getElementById("printResult")?.addEventListener("click", () => window.print());
      document.getElementById("saveResult")?.addEventListener("click", saveLastResult);
    }

    function invalidateResult() {
      lastResult = null;
      document.getElementById("results").innerHTML = "";
      document.getElementById("resultActions").hidden = true;
      document.getElementById("saveResult").disabled = true;
      hideError();
    }
    function calculate() {
      hideError();
      lastResult = null;
      document.getElementById("resultActions").hidden = true;
      document.getElementById("results").innerHTML = "";
      try {
        const model = SPORTS[activeSport].model;
        let calc;
        if (model === "knltb") calc = matchKind === "single" ? calcLowerSingle("tennis", "Tennis", "DSS-model", DSS_Q_SINGLE, false) : calcLowerDouble("tennis", "Tennis", "DSS-model", false);
        if (model === "padel") calc = calcLowerDouble("padel", "Padel", "Indicatie", true);
        if (model === "nttb") calc = calcNttb();
        if (model === "elo") calc = calcElo();
        if (model === "badminton") calc = calcBadminton();
        if (model === "dupr") calc = matchKind === "single" ? calcDuprSingle() : calcDuprDouble();

        lastResult = calc;
        document.getElementById("results").innerHTML = renderResult(calc);
        document.getElementById("saveResult").disabled = false;
        document.getElementById("resultActions").hidden = false;
        document.getElementById("results").focus();
      } catch (err) {
        showError(err.message || "Controleer de ingevulde gegevens.");
      }
    }

    function calcLowerSingle(prefix, sport, status, q, useScore) {
      const aName = get(`${prefix}AName`) || "Speler 1";
      const bName = get(`${prefix}BName`) || "Speler 2";
      const a = parseNumber(get(`${prefix}ARating`), "Rating speler 1", 0, 10);
      const b = parseNumber(get(`${prefix}BRating`), "Rating speler 2", 0, 10);
      const winner = getWinner();
      const pA = dssExpected(a, b, q);
      const pB = 1 - pA;
      const rA = winner === "A" ? 1 : 0;
      const rB = winner === "B" ? 1 : 0;
      const newA = a + DSS_K * (pA - rA);
      const newB = b + DSS_K * (pB - rB);

      return baseResult(sport, status, `${aName} - ${bName}`, "lower", [
        makeRow(aName, a, newA, pA, winner === "A"),
        makeRow(bName, b, newB, pB, winner === "B")
      ], "Lager is beter. Bij winst daalt je rating meestal; bij verlies stijgt je rating meestal.");
    }

    function calcLowerDouble(prefix, sport, status, useScore) {
      const names = {
        a1: get(`${prefix}A1Name`) || "Thuis speler 1",
        a2: get(`${prefix}A2Name`) || "Thuis speler 2",
        b1: get(`${prefix}B1Name`) || "Uit speler 1",
        b2: get(`${prefix}B2Name`) || "Uit speler 2"
      };
      const r = {
        a1: parseNumber(get(`${prefix}A1Rating`), "Rating thuis speler 1", 0, 10),
        a2: parseNumber(get(`${prefix}A2Rating`), "Rating thuis speler 2", 0, 10),
        b1: parseNumber(get(`${prefix}B1Rating`), "Rating uit speler 1", 0, 10),
        b2: parseNumber(get(`${prefix}B2Rating`), "Rating uit speler 2", 0, 10)
      };
      const winner = getWinner();
      const teamA = (r.a1 + r.a2) / 2;
      const teamB = (r.b1 + r.b2) / 2;
      const pA = dssExpected(teamA, teamB, DSS_Q_DOUBLE);
      const pB = 1 - pA;

      let resultA = winner === "A" ? 1 : 0;
      let resultB = winner === "B" ? 1 : 0;
      let scoreText = "";

      if (useScore) {
        const score = readScore();
        if (score.total > 0) {
          resultA = clamp(score.a / score.total, 0.05, 0.95);
          resultB = clamp(score.b / score.total, 0.05, 0.95);
          scoreText = " De ingevulde games zijn meegenomen als indicatie van hoe ruim de uitslag was.";
        }
      }

      const deltaA = DSS_K * (pA - resultA);
      const deltaB = DSS_K * (pB - resultB);

      return {
        ...baseResult(sport, status, `${names.a1} / ${names.a2} - ${names.b1} / ${names.b2}`, "lower", [
          makeRow(names.a1, r.a1, r.a1 + deltaA, pA, winner === "A"),
          makeRow(names.a2, r.a2, r.a2 + deltaA, pA, winner === "A"),
          makeRow(names.b1, r.b1, r.b1 + deltaB, pB, winner === "B"),
          makeRow(names.b2, r.b2, r.b2 + deltaB, pB, winner === "B")
        ], `Lager is beter. Beide spelers binnen hetzelfde koppel krijgen dezelfde ratingwijziging.${scoreText}`),
        extra: [
          { label: "Team thuis gemiddeld", value: fmt(teamA, 4) },
          { label: "Team uit gemiddeld", value: fmt(teamB, 4) }
        ]
      };
    }

    function calcNttb() {
      const aName = get("ttAName") || "Speler 1";
      const bName = get("ttBName") || "Speler 2";
      const a = parseNumber(get("ttARating"), "Ratingpunten speler 1", 0, 5000);
      const b = parseNumber(get("ttBRating"), "Ratingpunten speler 2", 0, 5000);
      const winner = getWinner();
      const col = Number(get("ttWeight"));
      const diff = Math.abs(a - b);
      const higherWins = (a >= b && winner === "A") || (b >= a && winner === "B");
      const table = higherWins ? nttbExpected : nttbUnexpected;
      const row = table.find(x => diff >= x.min && diff <= x.max);
      const winnerGain = row.values[col];
      const loserLoss = row.values[col === 0 ? 0 : 1];

      const newA = winner === "A" ? a + winnerGain : a - loserLoss;
      const newB = winner === "B" ? b + winnerGain : b - loserLoss;

      return {
        ...baseResult("Tafeltennis", "Puntentabel", `${aName} - ${bName}`, "higher", [
          makeRow(aName, a, newA, null, winner === "A"),
          makeRow(bName, b, newB, null, winner === "B")
        ], "Hoger is beter. De winnaar krijgt punten erbij; de verliezer levert punten in."),
        extra: [
          { label: "Ratingverschil", value: Math.round(diff).toString() },
          { label: "Winnaar", value: `+${winnerGain}` },
          { label: "Verliezer", value: `-${loserLoss}` }
        ]
      };
    }

    function calcElo() {
      const aName = get("eloAName") || "Speler 1";
      const bName = get("eloBName") || "Speler 2";
      const a = parseNumber(get("eloARating"), "Rating speler 1", 0, 100000);
      const b = parseNumber(get("eloBRating"), "Rating speler 2", 0, 100000);
      const k = Number(get("eloEffect"));
      return calcHigherIndication("Squash", `${aName} - ${bName}`, aName, bName, a, b, k, "Hoger is beter. Deze berekening is een indicatie.");
    }

    function calcDuprSingle() {
      const aName = get("pbAName") || "Speler 1";
      const bName = get("pbBName") || "Speler 2";
      const a = parseNumber(get("pbARating"), "Rating speler 1", 0, 10);
      const b = parseNumber(get("pbBRating"), "Rating speler 2", 0, 10);
      return calcHigherIndication("Pickleball", `${aName} - ${bName}`, aName, bName, a, b, 0.045, "Hoger is beter. Deze berekening is een DUPR-achtige indicatie.", true);
    }

    function calcDuprDouble() {
      const names = {
        a1: get("pbA1Name") || "Thuis speler 1",
        a2: get("pbA2Name") || "Thuis speler 2",
        b1: get("pbB1Name") || "Uit speler 1",
        b2: get("pbB2Name") || "Uit speler 2"
      };
      const r = {
        a1: parseNumber(get("pbA1Rating"), "Rating thuis speler 1", 0, 10),
        a2: parseNumber(get("pbA2Rating"), "Rating thuis speler 2", 0, 10),
        b1: parseNumber(get("pbB1Rating"), "Rating uit speler 1", 0, 10),
        b2: parseNumber(get("pbB2Rating"), "Rating uit speler 2", 0, 10)
      };
      const winner = getWinner();
      const teamA = (r.a1 + r.a2) / 2;
      const teamB = (r.b1 + r.b2) / 2;
      const pA = eloExpected(teamA * 1000, teamB * 1000);
      const pB = 1 - pA;
      let resultA = winner === "A" ? 1 : 0;
      let resultB = winner === "B" ? 1 : 0;
      const score = readScore();
      let note = "";
      if (score.total > 0) {
        resultA = clamp(score.a / score.total, 0.05, 0.95);
        resultB = clamp(score.b / score.total, 0.05, 0.95);
        note = " De ingevulde punten zijn meegenomen als indicatie van hoe ruim de uitslag was.";
      }
      const dA = 0.045 * (resultA - pA);
      const dB = 0.045 * (resultB - pB);

      return {
        ...baseResult("Pickleball", "Indicatie", `${names.a1} / ${names.a2} - ${names.b1} / ${names.b2}`, "higher", [
          makeRow(names.a1, r.a1, r.a1 + dA, pA, winner === "A"),
          makeRow(names.a2, r.a2, r.a2 + dA, pA, winner === "A"),
          makeRow(names.b1, r.b1, r.b1 + dB, pB, winner === "B"),
          makeRow(names.b2, r.b2, r.b2 + dB, pB, winner === "B")
        ], `Hoger is beter. Deze berekening is een DUPR-achtige indicatie.${note}`),
        extra: [
          { label: "Team thuis gemiddeld", value: fmt(teamA, 3) },
          { label: "Team uit gemiddeld", value: fmt(teamB, 3) }
        ]
      };
    }

    function calcHigherIndication(sport, summary, aName, bName, a, b, k, text, scale1000 = false) {
      const winner = getWinner();
      const pA = scale1000 ? eloExpected(a * 1000, b * 1000) : eloExpected(a, b);
      const pB = 1 - pA;
      let resultA = winner === "A" ? 1 : 0;
      let resultB = winner === "B" ? 1 : 0;
      const score = readScore();
      let note = "";
      if (score.total > 0) {
        resultA = clamp(score.a / score.total, 0.05, 0.95);
        resultB = clamp(score.b / score.total, 0.05, 0.95);
        note = " De score is meegenomen als indicatie van hoe ruim de uitslag was.";
      }
      const newA = a + k * (resultA - pA);
      const newB = b + k * (resultB - pB);
      return baseResult(sport, "Indicatie", summary, "higher", [
        makeRow(aName, a, newA, pA, winner === "A"),
        makeRow(bName, b, newB, pB, winner === "B")
      ], text + note);
    }

    function calcBadminton() {
      const name = get("badName") || "Speler";
      const newScore = parseNumber(get("badNew"), "Nieuwe score", 0, 100000);
      const scores = get("badScores").split(/[\s,;]+/).filter(Boolean).map(v => parseNumber(v, "Een van de huidige scores", 0, 100000));
      if (!scores.length) throw new Error("Vul minimaal één huidige score in.");
      const before = scores.slice().sort((a,b) => b-a).slice(0, 10);
      const after = scores.concat([newScore]).sort((a,b) => b-a).slice(0, 10);
      const beforeTotal = before.reduce((a,b) => a+b, 0);
      const afterTotal = after.reduce((a,b) => a+b, 0);

      return {
        ...baseResult("Badminton", "Puntentool", name, "higher", [
          makeRow(name, beforeTotal, afterTotal, null, true)
        ], "Hoger is beter. De tool telt de beste scores op als praktisch ranglijsthulpmiddel."),
        extra: [
          { label: "Beste scores vooraf", value: before.join(", ") },
          { label: "Beste scores na nieuwe score", value: after.join(", ") },
          { label: "Nieuwe score", value: Math.round(newScore).toString() }
        ]
      };
    }

    function baseResult(sport, status, summary, direction, rows, explanation) {
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        date: new Date().toISOString(),
        sport,
        status,
        summary,
        direction,
        rows,
        explanation
      };
    }

    function makeRow(name, oldRating, newRating, probability, winner) {
      return { name, oldRating, newRating, delta: newRating - oldRating, probability, winner };
    }

    function renderResult(calc) {
      const extra = calc.extra ? `
        <div class="result-card">
          <div class="metrics">
            ${calc.extra.map(x => `
              <div class="metric">
                <span>${escape(x.label)}</span>
                <strong>${escape(x.value)}</strong>
              </div>
            `).join("")}
          </div>
        </div>
      ` : "";

      return `
        <div class="notice ${calc.status === "Indicatie" ? "warn" : "good"}">
          <strong>${escape(calc.sport)} - ${escape(calc.status)}</strong><br>${escape(calc.explanation)}
        </div>
        ${extra}
        ${calc.rows.map(row => resultCard(row, calc)).join("")}
      `;
    }

    function resultCard(row, calc) {
      const precision = precisionFor(calc.sport);
      const better = calc.direction === "lower" ? row.delta < -0.000001 : row.delta > 0.000001;
      const worse = calc.direction === "lower" ? row.delta > 0.000001 : row.delta < -0.000001;
      const cls = better ? "good" : worse ? "bad" : "neutral";
      const label = better ? "Beter" : worse ? "Minder" : "Gelijk";
      return `
        <article class="result-card">
          <div class="result-top">
            <span class="result-name">${escape(row.name)}</span>
            ${row.winner ? `<span class="tag official">Winnaar</span>` : ""}
          </div>
          <div class="metrics">
            <div class="metric">
              <span>Rating vóór</span>
              <strong>${fmt(row.oldRating, precision)}</strong>
            </div>
            <div class="metric ${cls}">
              <span>Rating na</span>
              <strong>${fmt(row.newRating, precision)}</strong>
              <span>${delta(row.delta, precision)} - ${label}</span>
            </div>
            <div class="metric">
              <span>${row.probability === null ? "Verschil" : "Kans vooraf"}</span>
              <strong>${row.probability === null ? delta(row.delta, precision) : pct(row.probability)}</strong>
            </div>
          </div>
        </article>
      `;
    }

    function saveLastResult() {
      if (!lastResult) return;
      const history = loadHistory();
      history.unshift(lastResult);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 80))); } catch { showError("Opslaan lukt niet. Controleer of je browser lokale opslag toestaat."); return; }
      renderHistory();
      const btn = document.getElementById("saveResult");
      btn.textContent = "Opgeslagen";
      setTimeout(() => { btn.textContent = "Sla resultaat op"; }, 1000);
    }

    function renderHistory() {
      const target = document.getElementById("historyTable");
      const history = loadHistory();
      if (!history.length) {
        target.innerHTML = `<p class="muted">Nog geen opgeslagen berekeningen.</p>`;
        return;
      }

      const rows = history.map(item => {
        const precision = precisionFor(item.sport);
        const details = item.rows.map(r => `${escape(r.name)}: ${fmt(r.oldRating, precision)} → ${fmt(r.newRating, precision)} (${delta(r.delta, precision)})`).join("<br>");
        return `
          <tr>
            <td>${new Date(item.date).toLocaleString("nl-NL")}</td>
            <td>${escape(item.sport)}</td>
            <td>${escape(item.summary)}</td>
            <td>${escape(item.status)}</td>
            <td>${details}</td>
          </tr>
        `;
      }).join("");

      target.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Sport</th>
              <th>Wedstrijd</th>
              <th>Soort</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function exportHistory() {
      const history = loadHistory();
      if (!history.length) {
        alert("Er is nog geen historie om te exporteren.");
        return;
      }
      const lines = ["datum;sport;wedstrijd;soort;speler;rating_voor;rating_na;verschil"];
      history.forEach(item => {
        const precision = precisionFor(item.sport);
        item.rows.forEach(r => {
          lines.push([
            new Date(item.date).toLocaleString("nl-NL"),
            item.sport,
            item.summary,
            item.status,
            r.name,
            fmt(r.oldRating, precision),
            fmt(r.newRating, precision),
            delta(r.delta, precision)
          ].map(csv).join(";"));
        });
      });

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "racketrating-calculator-historie.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function loadHistory() {
      try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(history) ? history.filter(item => item && Array.isArray(item.rows)) : [];
      } catch {
        return [];
      }
    }

    function parseNumber(value, label, min, max) {
      const normalized = String(value).trim().replace(",", ".");
      if (normalized === "") throw new Error(`${label} is verplicht.`);
      const n = Number(normalized);
      if (!Number.isFinite(n)) throw new Error(`${label} moet een geldig getal zijn.`);
      if (n < min || n > max) throw new Error(`${label} lijkt buiten het verwachte bereik te vallen.`);
      return n;
    }

    function readScore() {
      let a = 0;
      let b = 0;
      for (let i = 1; i <= 3; i++) {
        const av = get(`scoreA${i}`);
        const bv = get(`scoreB${i}`);
        if (!av && !bv) continue;
        a += parseNumber(av || "0", `Score links set ${i}`, 0, 1000);
        b += parseNumber(bv || "0", `Score rechts set ${i}`, 0, 1000);
      }
      return { a, b, total: a + b };
    }

    function getWinner() {
      const checked = document.querySelector('input[name="winner"]:checked');
      if (!checked) throw new Error("Kies wie de wedstrijd heeft gewonnen.");
      return checked.value;
    }

    function get(id) {
      return document.getElementById(id)?.value.trim() || "";
    }

    function showError(message) {
      const el = document.getElementById("error");
      el.textContent = message;
      el.style.display = "block";
    }

    function hideError() {
      const el = document.getElementById("error");
      if (!el) return;
      el.textContent = "";
      el.style.display = "none";
    }

    function dssExpected(own, opponent, q) {
      return 1 / (1 + Math.exp(q * (own - opponent)));
    }

    function eloExpected(own, opponent) {
      return 1 / (1 + Math.pow(10, (opponent - own) / 400));
    }

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function precisionFor(sport) {
      if (sport === "Tennis" || sport === "Padel") return 4;
      if (sport === "Pickleball") return 3;
      return 0;
    }

    function fmt(n, digits) {
      return Number(n).toFixed(digits).replace(".", ",");
    }

    function delta(n, digits) {
      return `${n > 0 ? "+" : ""}${fmt(n, digits)}`;
    }

    function pct(n) {
      return `${(n * 100).toFixed(1).replace(".", ",")}%`;
    }

    function escape(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function csv(value) {
      return `"${String(value).replaceAll('"', '""')}"`;
    }

    function showView() {
      const aliases = {"calculator-section":"berekenen","tennis-rating-berekenen":"uitleg","toernooi-rating-simulator":"uitleg","veelgestelde-vragen":"uitleg"};
      const hash = location.hash.slice(1);
      const view = aliases[hash] || (["berekenen","opgeslagen","uitleg"].includes(hash) ? hash : "berekenen");
      document.querySelectorAll("[data-view]").forEach(el => el.hidden = el.dataset.view !== view);
      document.querySelectorAll("nav a").forEach(el => {
        if(el.hash === "#"+view) el.setAttribute("aria-current","page");
        else el.removeAttribute("aria-current");
      });
    }
    window.addEventListener("hashchange", showView);
    init();
    showView();
  
