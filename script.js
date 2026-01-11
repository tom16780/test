import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const houses = [
  {
    id: "house-1",
    name: "Maple House",
    neighbor: "Nina the Watchful",
    district: 1,
    job: "Night-shift mail sorter",
    goal: "Keep the block in perfect order",
    routine: "Sleeps by day, patrols the porch at night",
    quirks: "Counts every footstep out loud",
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
    job: "DIY radio tinkerer",
    goal: "Silence every squeak in the street",
    routine: "Fixes gadgets before sunrise",
    quirks: "Writes repair notes on napkins",
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
    job: "Community cartographer",
    goal: "Plot every sound wave",
    routine: "Logs signal data at dusk",
    quirks: "Labels cupboards by compass direction",
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
    job: "Nap schedule consultant",
    goal: "Protect her dream journal",
    routine: "Dozes to wind chimes at noon",
    quirks: "Falls asleep mid-sentence",
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
    job: "Botanical stylist",
    goal: "Keep the garden in bloom order",
    routine: "Watering sprints before breakfast",
    quirks: "Names every plant in rhyme",
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
    job: "Late-night podcaster",
    goal: "Gather the perfect true story",
    routine: "Records monologues after 9 PM",
    quirks: "Narrates footsteps like a sports game",
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
  inventoryOrder: [],
  selectedItemIndex: 0,
  unlockedDistricts: 1,
  behaviorLog: [],
  controllerActive: false,
  focusIndex: 0,
  lastAxisMove: 0,
  lastButtonPress: 0,
};

const houseGrid = document.getElementById("house-grid");
const puzzleArea = document.getElementById("puzzle-area");
const alertLevel = document.getElementById("alert-level");
const neighborsSaved = document.getElementById("neighbors-saved");
const districtsUnlocked = document.getElementById("districts-unlocked");
const inventoryList = document.getElementById("inventory-list");
const behaviorFeed = document.getElementById("behavior-feed");
const profileCard = document.getElementById("profile-card");
const controllerStatus = document.getElementById("controller-status");
const sceneCanvas = document.getElementById("scene");
const useItemBtn = document.getElementById("use-item-btn");
const dropItemBtn = document.getElementById("drop-item-btn");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const soundBtn = document.getElementById("sound-btn");

let audioCtx;
const sceneState = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  houseMeshes: new Map(),
};

function initScene() {
  if (!sceneCanvas) return;
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;

  sceneState.scene = new THREE.Scene();
  sceneState.scene.background = new THREE.Color("#0b0f1f");

  sceneState.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
  sceneState.camera.position.set(0, 12, 16);

  sceneState.renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
  sceneState.renderer.setPixelRatio(window.devicePixelRatio || 1);
  sceneState.renderer.setSize(width, height, false);

  sceneState.controls = new OrbitControls(sceneState.camera, sceneCanvas);
  sceneState.controls.enableDamping = true;
  sceneState.controls.target.set(0, 2, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const directional = new THREE.DirectionalLight(0xfff0d6, 0.8);
  directional.position.set(8, 12, 6);
  sceneState.scene.add(ambient, directional);

  const groundGeometry = new THREE.PlaneGeometry(30, 30);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2038,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  sceneState.scene.add(ground);

  const streetGeometry = new THREE.PlaneGeometry(24, 4);
  const streetMaterial = new THREE.MeshStandardMaterial({ color: 0x2a324f });
  const street = new THREE.Mesh(streetGeometry, streetMaterial);
  street.rotation.x = -Math.PI / 2;
  street.position.y = 0.01;
  sceneState.scene.add(street);

  buildHouseMeshes();
  updateHouseHighlights();
  animateScene();

  window.addEventListener("resize", handleSceneResize);
}

function buildHouseMeshes() {
  sceneState.houseMeshes.clear();
  const rowSpacing = 6;
  const columnSpacing = 6;
  houses.forEach((house, index) => {
    const geometry = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    const material = new THREE.MeshStandardMaterial({ color: 0x3d4b70 });
    const mesh = new THREE.Mesh(geometry, material);
    const row = Math.floor(index / 3);
    const column = index % 3;
    mesh.position.set(-6 + column * columnSpacing, 1.2, -4 + row * rowSpacing);
    mesh.userData.houseId = house.id;
    sceneState.scene.add(mesh);
    sceneState.houseMeshes.set(house.id, mesh);

    const roofGeometry = new THREE.ConeGeometry(1.9, 1.4, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2f45 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(mesh.position.x, 2.9, mesh.position.z);
    roof.rotation.y = Math.PI / 4;
    sceneState.scene.add(roof);
  });
}

function updateHouseHighlights() {
  sceneState.houseMeshes.forEach((mesh, houseId) => {
    const house = houses.find((entry) => entry.id === houseId);
    if (!house) return;
    const solved = state.solved.has(houseId);
    const isActive = state.activeHouse?.id === houseId;
    const baseColor = solved ? 0x4cc99f : 0x3d4b70;
    const highlightColor = isActive ? 0xffb347 : baseColor;
    mesh.material.color.setHex(highlightColor);
  });
}

function handleSceneResize() {
  if (!sceneState.renderer || !sceneState.camera) return;
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;
  sceneState.camera.aspect = width / height;
  sceneState.camera.updateProjectionMatrix();
  sceneState.renderer.setSize(width, height, false);
}

function animateScene() {
  if (!sceneState.renderer || !sceneState.scene || !sceneState.camera) return;
  requestAnimationFrame(animateScene);
  sceneState.controls?.update();
  sceneState.renderer.render(sceneState.scene, sceneState.camera);
}

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

    const role = document.createElement("p");
    role.className = "muted";
    role.textContent = `Job: ${house.job}`;

    const district = document.createElement("p");
    district.className = "muted";
    district.textContent = `District ${house.district}`;

    const action = document.createElement("button");
    action.className = "primary";
    action.textContent = solved ? "Revisit" : "Enter";
    action.disabled = !isUnlocked;
    action.addEventListener("click", () => selectHouse(house));

    card.append(statusBadge, title, neighbor, role, district, action);
    houseGrid.appendChild(card);
  });

  syncFocusableElements();
}

function renderInventory() {
  inventoryList.innerHTML = "";
  if (state.inventory.size === 0) {
    const item = document.createElement("li");
    item.textContent = "No items collected yet.";
    inventoryList.appendChild(item);
    return;
  }
  state.inventoryOrder = Array.from(state.inventory);
  if (state.selectedItemIndex >= state.inventoryOrder.length) {
    state.selectedItemIndex = 0;
  }
  state.inventoryOrder.forEach((itemName, index) => {
    const item = document.createElement("li");
    item.textContent = itemName;
    if (index === state.selectedItemIndex) {
      item.classList.add("selected");
    }
    item.addEventListener("click", () => {
      state.selectedItemIndex = index;
      renderInventory();
    });
    inventoryList.appendChild(item);
  });
}

function pushBehaviorLog(text) {
  state.behaviorLog.unshift(text);
  state.behaviorLog = state.behaviorLog.slice(0, 6);
  renderBehaviorFeed();
}

function selectHouse(house) {
  state.activeHouse = house;
  state.sequenceInput = [];
  state.patternInput = [];
  renderHouses();
  renderPuzzle(house);
  renderProfile(house);
  updateHouseHighlights();
  pushBehaviorLog(`${house.neighbor} is currently focused on: ${house.goal}.`);
  playTone(440, 0.15);
}

function renderProfile(house) {
  if (!house) {
    profileCard.innerHTML = "<p class=\"muted\">Select a house to view the neighbor's life, job, and goals.</p>";
    return;
  }

  profileCard.innerHTML = `
    <p><strong>${house.neighbor}</strong> (${house.name})</p>
    <p><strong>Job:</strong> ${house.job}</p>
    <p><strong>Goal:</strong> ${house.goal}</p>
    <p><strong>Routine:</strong> ${house.routine}</p>
    <p><strong>Quirk:</strong> ${house.quirks}</p>
  `;
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
      if (!state.inventoryOrder.includes(itemName)) {
        state.inventoryOrder.push(itemName);
      }
      btn.classList.add("collected");
      btn.textContent = `${itemName} ✓`;
      btn.disabled = true;
      renderInventory();
      playTone(520, 0.1);
      pushBehaviorLog(`Picked up ${itemName}. ${house.neighbor} reacts to the movement.`);
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

  syncFocusableElements();
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
  updateHouseHighlights();
  pushBehaviorLog(`${house.neighbor} calms down after the puzzle. They head back to their ${house.job}.`);
}

function resetGame() {
  state.activeHouse = null;
  state.solved.clear();
  state.sequenceInput = [];
  state.patternInput = [];
  state.inventory.clear();
  state.inventoryOrder = [];
  state.selectedItemIndex = 0;
  state.unlockedDistricts = 1;
  state.behaviorLog = [];
  puzzleArea.innerHTML = "<h3>Puzzle Console</h3><p class=\"muted\">Select a house to enter its interior and investigate clues.</p>";
  updateStatus();
  renderHouses();
  renderInventory();
  renderBehaviorFeed();
  renderProfile(null);
  updateHouseHighlights();
}

function useSelectedItem() {
  if (state.inventoryOrder.length === 0) return;
  const itemName = state.inventoryOrder[state.selectedItemIndex];
  if (!itemName) return;
  const context = state.activeHouse ? ` near ${state.activeHouse.name}` : " on the street";
  pushBehaviorLog(`You used ${itemName}${context}. The neighborhood feels different.`);
  playTone(640, 0.15);
}

function dropSelectedItem() {
  if (state.inventoryOrder.length === 0) return;
  const itemName = state.inventoryOrder[state.selectedItemIndex];
  state.inventory.delete(itemName);
  state.inventoryOrder.splice(state.selectedItemIndex, 1);
  state.selectedItemIndex = Math.max(0, state.selectedItemIndex - 1);
  renderInventory();
  pushBehaviorLog(`Dropped ${itemName}. It might be useful later.`);
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
  const goals = [
    `${house.neighbor} is working on: ${house.goal}.`,
    `${house.neighbor} is heading to their ${house.job}.`,
    `${house.neighbor} mutters: "${house.quirks}"`,
  ];
  pushBehaviorLog(goals[Math.floor(Math.random() * goals.length)] || hint);
}

const focusState = {
  elements: [],
};

function syncFocusableElements() {
  focusState.elements = Array.from(document.querySelectorAll("button, input[type='range'], input[type='text']")).filter(
    (el) => !el.disabled
  );
  if (focusState.elements.length === 0) return;
  if (state.focusIndex >= focusState.elements.length) {
    state.focusIndex = 0;
  }
  setFocus(state.focusIndex);
}

function setFocus(index) {
  focusState.elements.forEach((el) => el.classList.remove("focus-ring"));
  const target = focusState.elements[index];
  if (!target) return;
  target.classList.add("focus-ring");
  target.focus({ preventScroll: true });
}

function moveFocus(direction) {
  if (focusState.elements.length === 0) return;
  state.focusIndex = (state.focusIndex + direction + focusState.elements.length) % focusState.elements.length;
  setFocus(state.focusIndex);
}

function activateFocused() {
  const target = focusState.elements[state.focusIndex];
  if (!target) return;
  if (target.tagName === "INPUT" && target.type === "range") return;
  target.click();
}

function adjustFocusedSlider(delta) {
  const target = focusState.elements[state.focusIndex];
  if (!target || target.tagName !== "INPUT" || target.type !== "range") return;
  const step = 2;
  const value = Math.min(90, Math.max(30, Number(target.value) + delta * step));
  target.value = value;
  target.dispatchEvent(new Event("input"));
}

function handleGamepadInput(gamepad) {
  const now = performance.now();
  const leftAxisX = gamepad.axes[0] || 0;
  const leftAxisY = gamepad.axes[1] || 0;
  const rightAxisY = gamepad.axes[3] || 0;
  const threshold = 0.5;

  if (now - state.lastAxisMove > 180) {
    if (leftAxisY > threshold || gamepad.buttons[13]?.pressed) {
      moveFocus(1);
      state.lastAxisMove = now;
    } else if (leftAxisY < -threshold || gamepad.buttons[12]?.pressed) {
      moveFocus(-1);
      state.lastAxisMove = now;
    }

    if (rightAxisY > threshold) {
      selectNextInventoryItem(1);
      state.lastAxisMove = now;
    } else if (rightAxisY < -threshold) {
      selectNextInventoryItem(-1);
      state.lastAxisMove = now;
    }

    if (leftAxisX > threshold || gamepad.buttons[15]?.pressed) {
      adjustFocusedSlider(1);
      state.lastAxisMove = now;
    } else if (leftAxisX < -threshold || gamepad.buttons[14]?.pressed) {
      adjustFocusedSlider(-1);
      state.lastAxisMove = now;
    }
  }

  if (now - state.lastButtonPress > 200) {
    if (gamepad.buttons[0]?.pressed) {
      activateFocused();
      state.lastButtonPress = now;
    }
    if (gamepad.buttons[1]?.pressed) {
      resetGame();
      state.lastButtonPress = now;
    }
    if (gamepad.buttons[2]?.pressed) {
      useSelectedItem();
      state.lastButtonPress = now;
    }
    if (gamepad.buttons[3]?.pressed) {
      dropSelectedItem();
      state.lastButtonPress = now;
    }
  }
}

function pollGamepads() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const xboxPad = Array.from(gamepads).find((pad) => pad && pad.mapping === "standard");
  if (xboxPad) {
    controllerStatus.textContent = "Xbox Controller Connected";
    if (!state.controllerActive) {
      state.controllerActive = true;
      syncFocusableElements();
    }
    handleGamepadInput(xboxPad);
  } else {
    controllerStatus.textContent = "Searching...";
    state.controllerActive = false;
  }
  requestAnimationFrame(pollGamepads);
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

useItemBtn.addEventListener("click", useSelectedItem);
dropItemBtn.addEventListener("click", dropSelectedItem);

function selectNextInventoryItem(direction) {
  if (state.inventoryOrder.length === 0) return;
  state.selectedItemIndex =
    (state.selectedItemIndex + direction + state.inventoryOrder.length) % state.inventoryOrder.length;
  renderInventory();
}

renderHouses();
updateStatus();
renderInventory();
renderBehaviorFeed();
renderProfile(null);
setInterval(tickBehaviors, 12000);
requestAnimationFrame(pollGamepads);
initScene();
