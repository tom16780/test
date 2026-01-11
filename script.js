const houses = [
  {
    id: "house-1",
    name: "Maple House",
    neighbor: "Nina the Watchful",
    district: 1,
    puzzle: {
      type: "sequence",
      prompt: "Set the porch lights in the right order: 1 → 2 → 3.",
      solution: ["1", "2", "3"],
    },
    items: ["Flashlight", "Keycard"],
    hints: ["Nina listens for rhythmic footsteps.", "She trusts ordered routines."],
  },
  {
    id: "house-2",
    name: "Oak House",
    neighbor: "Gus the Gadgeteer",
    district: 1,
    puzzle: {
      type: "riddle",
      prompt: "Which tool would silence a creaky door?",
      options: ["Oil can", "Alarm bell", "Megaphone"],
      solution: "Oil can",
    },
    items: ["Oil can", "Crumpled map"],
    hints: ["Gus overthinks every noise.", "He appreciates quiet repairs."],
  },
  {
    id: "house-3",
    name: "Pine House",
    neighbor: "Mara the Mapper",
    district: 1,
    puzzle: {
      type: "tuner",
      prompt: "Tune the radio slider to 60 to calm the chatter.",
      solution: 60,
    },
    items: ["Radio dial", "Sticky note"],
    hints: ["Mara is focused on frequencies.", "She likes exact numbers."],
  },
  {
    id: "house-4",
    name: "Cedar House",
    neighbor: "Ivy the Sleeper",
    district: 2,
    puzzle: {
      type: "code",
      prompt: "Find the sleep routine code (3 digits).",
      solution: "427",
    },
    items: ["Bedtime journal", "Wind chime"],
    hints: ["Ivy notes her schedule in a journal.", "The chime marks each hour."],
  },
  {
    id: "house-5",
    name: "Birch House",
    neighbor: "Theo the Gardener",
    district: 2,
    puzzle: {
      type: "pattern",
      prompt: "Select the plant colors in bloom order: red → yellow → blue.",
      solution: ["Red", "Yellow", "Blue"],
      options: ["Blue", "Green", "Red", "Yellow"],
    },
    items: ["Seed pouch", "Watering can"],
    hints: ["Theo keeps the garden in bloom order.", "He follows color patterns."],
  },
  {
    id: "house-6",
    name: "Willow House",
    neighbor: "Rae the Storyteller",
    district: 3,
    puzzle: {
      type: "logic",
      prompt: "Choose the true statement to calm Rae.",
      options: [
        "Rae was home before midnight.",
        "The lantern was lit after 9.",
        "Both statements are true.",
      ],
      solution: "The lantern was lit after 9.",
    },
    items: ["Lantern", "Story card"],
    hints: ["Rae narrates every detail.", "She recalls precise timing."],
  },
];

const state = {
  activeHouse: null,
  solved: new Set(),
  soundOn: true,
  sequenceInput: [],
  patternInput: [],
  inventory: new Set(),
  unlockedDistricts: 1,
  behaviorLog: [],
};

const houseGrid = document.getElementById("house-grid");
const puzzleArea = document.getElementById("puzzle-area");
const alertLevel = document.getElementById("alert-level");
const neighborsSaved = document.getElementById("neighbors-saved");
const districtsUnlocked = document.getElementById("districts-unlocked");
const inventoryList = document.getElementById("inventory-list");
const behaviorFeed = document.getElementById("behavior-feed");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const soundBtn = document.getElementById("sound-btn");

let audioCtx;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(frequency, duration = 0.2) {
  if (!state.soundOn) return;
  ensureAudio();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.15;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function updateStatus() {
  const solvedCount = state.solved.size;
  neighborsSaved.textContent = `${solvedCount}`;
  districtsUnlocked.textContent = `${state.unlockedDistricts}`;

  if (solvedCount === 0) {
    alertLevel.textContent = "Calm";
    alertLevel.style.color = "var(--success)";
  } else if (solvedCount < houses.length) {
    alertLevel.textContent = "Alert";
    alertLevel.style.color = "var(--accent)";
  } else {
    alertLevel.textContent = "Safe";
    alertLevel.style.color = "var(--success)";
  }
}

function updateUnlockedDistricts() {
  const solvedCount = state.solved.size;
  if (solvedCount >= 2) state.unlockedDistricts = 2;
  if (solvedCount >= 4) state.unlockedDistricts = 3;
}

function renderHouses() {
  houseGrid.innerHTML = "";
  houses.forEach((house) => {
    const card = document.createElement("div");
    card.className = "house-card";
    card.dataset.house = house.id;

    const isUnlocked = house.district <= state.unlockedDistricts;
    if (!isUnlocked) {
      card.classList.add("locked");
    }

    if (state.activeHouse?.id === house.id) {
      card.classList.add("active");
    }

    const statusBadge = document.createElement("span");
    const solved = state.solved.has(house.id);
    if (!isUnlocked) {
      statusBadge.className = "badge locked";
      statusBadge.textContent = "Locked";
    } else {
      statusBadge.className = `badge ${solved ? "safe" : ""}`;
      statusBadge.textContent = solved ? "Secured" : "Suspicious";
    }

    const title = document.createElement("h3");
    title.textContent = house.name;

    const neighbor = document.createElement("p");
    neighbor.textContent = `Neighbor: ${house.neighbor}`;

    const district = document.createElement("p");
    district.className = "muted";
    district.textContent = `District ${house.district}`;

    const action = document.createElement("button");
    action.className = "primary";
    action.textContent = solved ? "Revisit" : "Enter";
    action.disabled = !isUnlocked;
    action.addEventListener("click", () => selectHouse(house));

    card.append(statusBadge, title, neighbor, district, action);
    houseGrid.appendChild(card);
  });
}

function renderInventory() {
  inventoryList.innerHTML = "";
  if (state.inventory.size === 0) {
    const item = document.createElement("li");
    item.textContent = "No items collected yet.";
    inventoryList.appendChild(item);
    return;
  }

  state.inventory.forEach((itemName) => {
    const item = document.createElement("li");
    item.textContent = itemName;
    inventoryList.appendChild(item);
  });
}

function pushBehaviorLog(text) {
  state.behaviorLog.unshift(text);
  state.behaviorLog = state.behaviorLog.slice(0, 6);
  behaviorFeed.innerHTML = "";
  state.behaviorLog.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    behaviorFeed.appendChild(li);
  });
}

function selectHouse(house) {
  state.activeHouse = house;
  state.sequenceInput = [];
  state.patternInput = [];
  renderHouses();
  renderPuzzle(house);
  playTone(440, 0.15);
}

function renderPuzzle(house) {
  puzzleArea.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = `${house.name} Interior`;

  const prompt = document.createElement("p");
  prompt.textContent = house.puzzle.prompt;

  const hint = document.createElement("p");
  hint.className = "muted";
  hint.textContent = house.hints[0];

  const interiorTitle = document.createElement("h4");
  interiorTitle.textContent = "Interior Items";

  const interior = document.createElement("div");
  interior.className = "interior-grid";
  house.items.forEach((itemName) => {
    const btn = document.createElement("button");
    const collected = state.inventory.has(itemName);
    btn.className = `item-button ${collected ? "collected" : ""}`;
    btn.textContent = collected ? `${itemName} ✓` : `Pick up ${itemName}`;
    btn.disabled = collected;
    btn.addEventListener("click", () => {
      state.inventory.add(itemName);
      btn.classList.add("collected");
      btn.textContent = `${itemName} ✓`;
      btn.disabled = true;
      renderInventory();
      playTone(520, 0.1);
    });
    interior.appendChild(btn);
  });

  puzzleArea.append(heading, prompt, hint, interiorTitle, interior);

  if (house.puzzle.type === "sequence") {
    const sequenceInfo = document.createElement("p");
    sequenceInfo.className = "muted";
    sequenceInfo.textContent = `Current sequence: ${state.sequenceInput.join("-") || ""}`;

    const controls = document.createElement("div");
    controls.className = "puzzle-controls";

    ["1", "2", "3"].forEach((value) => {
      const btn = document.createElement("button");
      btn.className = "puzzle-button";
      btn.textContent = value;
      btn.addEventListener("click", () => handleSequence(value, sequenceInfo, house));
      controls.appendChild(btn);
    });

    puzzleArea.append(sequenceInfo, controls);
  }

  if (house.puzzle.type === "riddle") {
    const controls = document.createElement("div");
    controls.className = "puzzle-controls";

    house.puzzle.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "puzzle-button";
      btn.textContent = option;
      btn.addEventListener("click", () => handleRiddle(btn, option, house));
      controls.appendChild(btn);
    });

    puzzleArea.append(controls);
  }

  if (house.puzzle.type === "tuner") {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "30";
    slider.max = "90";
    slider.value = "45";
    slider.className = "tuner";

    const readout = document.createElement("p");
    readout.className = "muted";
    readout.textContent = `Frequency: ${slider.value}`;

    slider.addEventListener("input", () => {
      readout.textContent = `Frequency: ${slider.value}`;
      playTone(300 + Number(slider.value), 0.05);
    });

    const confirm = document.createElement("button");
    confirm.className = "primary";
    confirm.textContent = "Lock Frequency";
    confirm.addEventListener("click", () => handleTuner(slider, house, readout));

    puzzleArea.append(readout, slider, confirm);
  }

  if (house.puzzle.type === "code") {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 3;
    input.placeholder = "Enter 3-digit code";
    input.className = "tuner";

    const confirm = document.createElement("button");
    confirm.className = "primary";
    confirm.textContent = "Unlock Routine";
    confirm.addEventListener("click", () => handleCode(input, house));

    puzzleArea.append(input, confirm);
  }

  if (house.puzzle.type === "pattern") {
    const status = document.createElement("p");
    status.className = "muted";
    status.textContent = "Current selection: ";

    const controls = document.createElement("div");
    controls.className = "puzzle-controls";

    house.puzzle.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "puzzle-button";
      btn.textContent = option;
      btn.addEventListener("click", () => handlePattern(option, status, house));
      controls.appendChild(btn);
    });

    puzzleArea.append(status, controls);
  }

  if (house.puzzle.type === "logic") {
    const controls = document.createElement("div");
    controls.className = "puzzle-controls";

    house.puzzle.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "puzzle-button";
      btn.textContent = option;
      btn.addEventListener("click", () => handleLogic(btn, option, house));
      controls.appendChild(btn);
    });

    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = house.hints[1];

    puzzleArea.append(controls, note);
  }

  if (state.solved.has(house.id)) {
    const solvedMsg = document.createElement("p");
    solvedMsg.className = "muted";
    solvedMsg.textContent = "This neighbor is calm. You can replay the puzzle for fun.";
    puzzleArea.appendChild(solvedMsg);
  }
}

function handleSequence(value, display, house) {
  state.sequenceInput.push(value);
  display.textContent = `Current sequence: ${state.sequenceInput.join("-")}`;
  playTone(520, 0.08);

  if (state.sequenceInput.length === house.puzzle.solution.length) {
    const correct = state.sequenceInput.every((entry, index) => entry === house.puzzle.solution[index]);
    if (correct) {
      resolveHouse(house, "Sequence locked. Porch is secure.");
    } else {
      state.sequenceInput = [];
      display.textContent = "Sequence reset. Try again.";
      playTone(200, 0.3);
    }
  }
}

function handleRiddle(button, option, house) {
  if (option === house.puzzle.solution) {
    button.classList.add("correct");
    resolveHouse(house, "Correct tool! Door silence achieved.");
  } else {
    button.classList.add("wrong");
    playTone(180, 0.3);
  }
}

function handleTuner(slider, house, readout) {
  const current = Number(slider.value);
  if (current === house.puzzle.solution) {
    resolveHouse(house, "Frequency locked. The chatter fades.");
  } else {
    playTone(180, 0.3);
    readout.textContent = "Frequency off. Try closer to 60.";
  }
}

function handleCode(input, house) {
  if (input.value.trim() === house.puzzle.solution) {
    resolveHouse(house, "Routine unlocked. Ivy is asleep.");
  } else {
    playTone(180, 0.3);
    input.value = "";
  }
}

function handlePattern(option, status, house) {
  state.patternInput.push(option);
  status.textContent = `Current selection: ${state.patternInput.join(" → ")}`;
  playTone(480, 0.08);

  if (state.patternInput.length === house.puzzle.solution.length) {
    const correct = state.patternInput.every((entry, index) => entry === house.puzzle.solution[index]);
    if (correct) {
      resolveHouse(house, "Garden sequence set. Theo relaxes.");
    } else {
      state.patternInput = [];
      status.textContent = "Pattern reset. Try again.";
      playTone(200, 0.3);
    }
  }
}

function handleLogic(button, option, house) {
  if (option === house.puzzle.solution) {
    button.classList.add("correct");
    resolveHouse(house, "Rae is satisfied with the truth.");
  } else {
    button.classList.add("wrong");
    playTone(180, 0.3);
  }
}

function resolveHouse(house, message) {
  state.solved.add(house.id);
  updateUnlockedDistricts();
  playTone(700, 0.2);
  const feedback = document.createElement("p");
  feedback.textContent = message;
  feedback.className = "muted";
  puzzleArea.appendChild(feedback);
  updateStatus();
  renderHouses();
  pushBehaviorLog(`${house.neighbor} calms down after the puzzle.`);
}

function resetGame() {
  state.activeHouse = null;
  state.solved.clear();
  state.sequenceInput = [];
  state.patternInput = [];
  state.inventory.clear();
  state.unlockedDistricts = 1;
  state.behaviorLog = [];
  puzzleArea.innerHTML = "<h3>Puzzle Console</h3><p class=\"muted\">Select a house to enter its interior and investigate clues.</p>";
  updateStatus();
  renderHouses();
  renderInventory();
  renderBehaviorFeed();
}

function renderBehaviorFeed() {
  behaviorFeed.innerHTML = "";
  if (state.behaviorLog.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Neighbors are quiet for now.";
    behaviorFeed.appendChild(li);
  } else {
    state.behaviorLog.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      behaviorFeed.appendChild(li);
    });
  }
}

function tickBehaviors() {
  const house = houses[Math.floor(Math.random() * houses.length)];
  const hint = house.hints[Math.floor(Math.random() * house.hints.length)];
  pushBehaviorLog(`${house.neighbor}: ${hint}`);
}

startBtn.addEventListener("click", () => {
  playTone(600, 0.2);
  alertLevel.textContent = "On Watch";
  alertLevel.style.color = "var(--accent)";
});

resetBtn.addEventListener("click", resetGame);

soundBtn.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundBtn.textContent = `Sound: ${state.soundOn ? "On" : "Off"}`;
  playTone(420, 0.1);
});

renderHouses();
updateStatus();
renderInventory();
renderBehaviorFeed();
setInterval(tickBehaviors, 12000);
