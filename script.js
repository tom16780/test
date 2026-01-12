import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const storyBeats = [
  "Hours 1-6: Arrive in Metro Valley, build trust with dispatch and local crews.",
  "Hours 7-14: Investigate the missing convoy with Pier 9 responders.",
  "Hours 15-22: Track underground street races across the skyline expressway.",
  "Hours 23-30: Secure the finance district during a citywide data breach.",
  "Hours 31-38: Rally emergency teams through the first storm front.",
  "Hours 39-46: Escort evacuees during the harbor blackout crisis.",
  "Hours 47-54: Follow the desert airstrip trail to the rival network.",
  "Hours 55-62: Coordinate multi-agency response in downtown lockdown.",
  "Hours 63-70: Recover the missing convoy and expose the mastermind.",
  "Hours 71-74: Restore the city as sunrise returns to Metro Valley.",
];

const tutorialSteps = [
  "Move with WASD or left stick. Tap C to cycle camera distances.",
  "Press E to enter vehicles or interiors. Press E again to exit.",
  "Toggle Inventory with I (or LB). Swap weapons with 1/2/3 or LB/RB.",
  "Use F (or Right Stick Click) to fire your equipped weapon.",
  "Follow live encounters to unlock story beats across the city.",
];

const randomEvents = [
  "Street racer challenges you near Harbor Loop.",
  "A delivery drone is spiraling over Midtown.",
  "Pop-up market blocks the avenue ahead.",
  "Lost dog sprinting across Crosswalk 4.",
  "Power flicker reported near the stadium.",
  "Police escort sweeping down Main Street.",
  "Skate crew takes over the boulevard.",
  "Rain storm rolling in from the west ridge.",
  "VIP convoy requests an escort.",
  "Flash mob forming at the plaza stage.",
];

const sceneCanvas = document.getElementById("scene");
const sceneWrap = document.getElementById("scene-wrap");
const mainMenu = document.getElementById("main-menu");
const loadingScreen = document.getElementById("loading-screen");
const startBtn = document.getElementById("start-btn");
const menuStartBtn = document.getElementById("menu-start-btn");
const menuStoryBtn = document.getElementById("menu-story-btn");
const menuSettingsBtn = document.getElementById("menu-settings-btn");
const menuSettings = document.getElementById("menu-settings");
const settingWeather = document.getElementById("setting-weather");
const settingNpcs = document.getElementById("setting-npcs");
const settingTraffic = document.getElementById("setting-traffic");
const settingClouds = document.getElementById("setting-clouds");
const settingHud = document.getElementById("setting-hud");
const settingsApplyBtn = document.getElementById("settings-apply-btn");
const controllerStatus = document.getElementById("controller-status");
const hudLocation = document.getElementById("hud-location");
const hudMode = document.getElementById("hud-mode");
const hudTime = document.getElementById("hud-time");
const hudWeather = document.getElementById("hud-weather");
const eventFeed = document.getElementById("event-feed");
const storyList = document.getElementById("story-list");
const tutorialList = document.getElementById("tutorial-list");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const toggleHudBtn = document.getElementById("toggle-hud-btn");
const toggleTutorialBtn = document.getElementById("toggle-tutorial-btn");
const hud = document.getElementById("hud");
const storyPanel = document.getElementById("story-panel");
const eventPanel = document.getElementById("event-panel");
const tutorialPanel = document.getElementById("tutorial-panel");

const state = {
  sceneReady: false,
  timeOfDay: 17.5,
  weatherIndex: 0,
  weatherTimer: 0,
  eventTimer: 0,
  mode: "On Foot",
  controllerActive: false,
  playerInVehicle: null,
  playerInPlane: false,
  currentInterior: null,
  hudVisible: true,
  actionPressed: false,
  hudPressed: false,
  cameraPressed: false,
  storyPressed: false,
  storyVisible: true,
  tutorialVisible: true,
  cameraIndex: 0,
  windDirection: new THREE.Vector2(1, 0.2),
  analogThrottle: 0,
  weatherRate: 1,
  npcCount: 10,
  trafficCount: 4,
  cloudSpeed: 1,
  highContrastHud: false,
  tutorialPressed: false,
  input: {
    forward: false,
    backward: false,
    left: false,
    right: false,
  },
  analog: {
    x: 0,
    y: 0,
  },
};

const weatherStates = [
  { label: "Clear", fog: 0x0c1424, intensity: 1 },
  { label: "Cloudy", fog: 0x0b111f, intensity: 0.8 },
  { label: "Rain", fog: 0x0a0f1c, intensity: 0.6 },
  { label: "Storm", fog: 0x090c18, intensity: 0.5 },
];

const world = {
  scene: null,
  camera: null,
  renderer: null,
  sunLight: null,
  ambientLight: null,
  rain: null,
  clouds: [],
  player: null,
  npcs: [],
  cars: [],
  plane: null,
  interiors: [],
  police: [],
  target: new THREE.Vector3(),
  cameraOffset: new THREE.Vector3(0, 12, 18),
  cameraOffsets: [
    new THREE.Vector3(0, 12, 18),
    new THREE.Vector3(0, 8, 11),
    new THREE.Vector3(0, 18, 26),
  ],
};
const clock = new THREE.Clock();

function initStoryList() {
  storyList.innerHTML = "";
  storyBeats.forEach((beat, index) => {
    const item = document.createElement("li");
    item.textContent = beat;
    if (index === 0) {
      item.style.color = "#fff";
    }
    storyList.appendChild(item);
  });
}

function initTutorial() {
  if (!tutorialList) return;
  tutorialList.innerHTML = "";
  tutorialSteps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    tutorialList.appendChild(item);
  });
}

function pushEvent(message) {
  const item = document.createElement("li");
  item.textContent = message;
  eventFeed.prepend(item);
  while (eventFeed.children.length > 5) {
    eventFeed.removeChild(eventFeed.lastChild);
  }
}

function showLoading() {
  loadingScreen.classList.remove("hidden");
}

function hideLoading() {
  loadingScreen.classList.add("hidden");
}

function toggleMenuSettings() {
  menuSettings.classList.toggle("hidden");
}

function applySettings() {
  state.weatherRate = Number(settingWeather.value);
  state.npcCount = Number(settingNpcs.value);
  state.trafficCount = Number(settingTraffic.value);
  state.cloudSpeed = Number(settingClouds.value);
  state.highContrastHud = settingHud.checked;
  hud.classList.toggle("high-contrast", state.highContrastHud);
  if (state.sceneReady) {
    buildNPCs();
    buildCars();
  }
}

function initScene() {
  if (!sceneCanvas) return;
  if (state.sceneReady) return;
  showLoading();

  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;

  world.scene = new THREE.Scene();
  world.scene.background = new THREE.Color(0x0c1424);
  world.scene.fog = new THREE.Fog(0x0c1424, 30, 160);

  world.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
  world.camera.position.set(0, 14, 20);

  world.renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
  world.renderer.setPixelRatio(window.devicePixelRatio || 1);
  world.renderer.setSize(width, height, false);
  world.renderer.shadowMap.enabled = true;

  world.ambientLight = new THREE.AmbientLight(0xbad4ff, 0.4);
  world.sunLight = new THREE.DirectionalLight(0xfff4dd, 1.1);
  world.sunLight.position.set(30, 40, 20);
  world.sunLight.castShadow = true;
  world.scene.add(world.ambientLight, world.sunLight);

  const groundGeometry = new THREE.PlaneGeometry(220, 220);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1728, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.scene.add(ground);

  buildRoads();
  buildBuildings();
  buildEnterableBuildings();
  buildPlayer();
  buildNPCs();
  buildCars();
  buildPlane();
  buildCityProps();
  buildPolice();
  buildClouds();
  buildRain();
  initTutorial();

  window.addEventListener("resize", handleResize);
  sceneCanvas.addEventListener("click", () => sceneCanvas.focus());

  state.sceneReady = true;
  hideLoading();
  animate();
}

function buildRoads() {
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2738, roughness: 0.8 });
  for (let i = -2; i <= 2; i += 1) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(220, 6), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = i * 20;
    road.receiveShadow = true;
    world.scene.add(road);

    if (i !== 0) {
      const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(6, 220), roadMaterial);
      crossRoad.rotation.x = -Math.PI / 2;
      crossRoad.position.x = i * 20;
      crossRoad.receiveShadow = true;
      world.scene.add(crossRoad);
    }
  }
}

function buildBuildings() {
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3a52, roughness: 0.6, metalness: 0.1 });
  for (let x = -80; x <= 80; x += 20) {
    for (let z = -80; z <= 80; z += 20) {
      if (Math.abs(x) < 12 || Math.abs(z) < 12) continue;
      const height = 8 + Math.random() * 20;
      const geometry = new THREE.BoxGeometry(10, height, 10);
      const building = new THREE.Mesh(geometry, buildingMaterial.clone());
      building.material.color.setHSL(0.6, 0.35, 0.22 + Math.random() * 0.25);
      building.position.set(x + (Math.random() * 6 - 3), height / 2, z + (Math.random() * 6 - 3));
      building.castShadow = true;
      building.receiveShadow = true;
      world.scene.add(building);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 3, 4), new THREE.MeshStandardMaterial({ color: 0x1b243a }));
      roof.position.set(building.position.x, height + 1, building.position.z);
      roof.rotation.y = Math.random() * Math.PI;
      roof.castShadow = true;
      world.scene.add(roof);
    }
  }
}

function buildCityProps() {
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0x2e3a55, roughness: 0.6 });
  const lampHeadMaterial = new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffd28a, emissiveIntensity: 0.6 });
  for (let i = -90; i <= 90; i += 30) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 6), lampMaterial);
    pole.position.set(i, 3, -15);
    world.scene.add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), lampHeadMaterial);
    head.position.set(i, 6, -15);
    world.scene.add(head);
  }

  const park = new THREE.Mesh(new THREE.CircleGeometry(12, 24), new THREE.MeshStandardMaterial({ color: 0x163020 }));
  park.rotation.x = -Math.PI / 2;
  park.position.set(40, 0.02, 40);
  world.scene.add(park);
}

function clearInteriors() {
  world.interiors.forEach((interior) => {
    world.scene.remove(interior.exterior);
    world.scene.remove(interior.door);
    world.scene.remove(interior.interiorGroup);
  });
  world.interiors.length = 0;
}

function buildEnterableBuildings() {
  clearInteriors();
  const shopMaterial = new THREE.MeshStandardMaterial({ color: 0x3b4f6d, roughness: 0.6 });
  const interiorFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x1b243a, roughness: 0.9 });
  const interiorWallMaterial = new THREE.MeshStandardMaterial({ color: 0x2b354d, roughness: 0.8 });

  const buildings = [
    { name: "Corner Shop", position: new THREE.Vector3(40, 0, -40) },
    { name: "Skyline Cafe", position: new THREE.Vector3(-50, 0, 40) },
    { name: "Metro Outfitters", position: new THREE.Vector3(-60, 0, -10) },
  ];

  buildings.forEach((building) => {
    const exterior = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), shopMaterial.clone());
    exterior.position.set(building.position.x, 3, building.position.z);
    exterior.castShadow = true;
    exterior.receiveShadow = true;
    world.scene.add(exterior);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x4fd2ff }));
    door.position.set(building.position.x, 1.25, building.position.z + 5.1);
    door.userData = { type: "door", building };
    world.scene.add(door);

    const interiorGroup = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), interiorFloorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.4), interiorWallMaterial);
    backWall.position.set(0, 2, -5);
    interiorGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 10), interiorWallMaterial);
    leftWall.position.set(-5, 2, 0);
    interiorGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 10), interiorWallMaterial);
    rightWall.position.set(5, 2, 0);
    interiorGroup.add(rightWall);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1.5), new THREE.MeshStandardMaterial({ color: 0x5b6b85 }));
    counter.position.set(0, 0.5, -2);
    interiorGroup.add(counter);

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 0.6), new THREE.MeshStandardMaterial({ color: 0x7a8ab0 }));
    shelf.position.set(-3, 1.5, 2);
    interiorGroup.add(shelf);

    const light = new THREE.PointLight(0x8bd8ff, 0.9, 25);
    light.position.set(0, 3.5, 0);
    interiorGroup.add(light);

    interiorGroup.position.set(building.position.x, 0.05, building.position.z);
    interiorGroup.visible = false;
    world.scene.add(interiorGroup);

    world.interiors.push({
      name: building.name,
      exterior,
      door,
      interiorGroup,
      entryPoint: new THREE.Vector3(building.position.x, 1.2, building.position.z + 1.5),
      exitPoint: new THREE.Vector3(building.position.x, 1.2, building.position.z + 6),
    });
  });
}

function buildPlayer() {
  const geometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0x4fd2ff });
  const player = new THREE.Mesh(geometry, material);
  player.position.set(0, 2, 0);
  player.castShadow = true;
  world.scene.add(player);
  world.player = player;
}

function clearMeshes(meshes) {
  meshes.forEach((mesh) => {
    world.scene.remove(mesh);
  });
  meshes.length = 0;
}

function buildNPCs() {
  clearMeshes(world.npcs);
  const geometry = new THREE.CapsuleGeometry(0.7, 1.5, 4, 8);
  for (let i = 0; i < state.npcCount; i += 1) {
    const material = new THREE.MeshStandardMaterial({ color: 0xffb347 });
    const npc = new THREE.Mesh(geometry, material);
    npc.position.set((Math.random() - 0.5) * 120, 1.6, (Math.random() - 0.5) * 120);
    npc.userData = {
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      speed: 2 + Math.random(),
      baseColor: material.color.clone(),
      avoidStrength: 4 + Math.random() * 2,
    };
    npc.castShadow = true;
    world.scene.add(npc);
    world.npcs.push(npc);
  }
}

function buildCars() {
  clearMeshes(world.cars);
  const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff4d6d, metalness: 0.3, roughness: 0.4 });
  for (let i = 0; i < state.trafficCount; i += 1) {
    const geometry = new THREE.BoxGeometry(3.5, 1.4, 6.5);
    const car = new THREE.Mesh(geometry, carMaterial.clone());
    car.material.color.setHSL(0.95 - i * 0.1, 0.6, 0.5);
      goal: new THREE.Vector3((Math.random() - 0.5) * 120, 0, (Math.random() - 0.5) * 120),
function buildPolice() {
  clearMeshes(world.police);
  const geometry = new THREE.CapsuleGeometry(0.8, 1.6, 4, 8);
  for (let i = 0; i < 4; i += 1) {
    const material = new THREE.MeshStandardMaterial({ color: 0x4fd2ff });
    const officer = new THREE.Mesh(geometry, material);
    officer.position.set((Math.random() - 0.5) * 80, 1.6, (Math.random() - 0.5) * 80);
    officer.userData = {
      patrolAngle: Math.random() * Math.PI * 2,
      speed: 3.5,
    };
    officer.castShadow = true;
    world.scene.add(officer);
    world.police.push(officer);
  }
}

    car.position.set(-20 + i * 12, 0.8, 10 + i * 6);
    car.userData = {
      velocity: new THREE.Vector3(),
      ai: i !== 0,
      lane: i,
      heading: Math.PI * 0.5,
      speed: 0,
      maxSpeed: 18 - i * 2,
      direction: i % 2 === 0 ? 1 : -1,
    };
    car.castShadow = true;
    world.scene.add(car);
    world.cars.push(car);
  }
}

function buildPlane() {
  const geometry = new THREE.BoxGeometry(5, 1, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0x9aa7ff, metalness: 0.4, roughness: 0.3 });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(-60, 1.2, -60);
  plane.castShadow = true;
  plane.userData = {
    velocity: new THREE.Vector3(),
    heading: Math.PI * 0.2,
    speed: 0,
    maxSpeed: 26,
  };
  world.scene.add(plane);
  world.plane = plane;
}

function buildClouds() {
  const cloudGeometry = new THREE.PlaneGeometry(18, 10);
  for (let i = 0; i < 8; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const cloud = new THREE.Mesh(cloudGeometry, material);
    cloud.position.set((Math.random() - 0.5) * 200, 35 + Math.random() * 15, (Math.random() - 0.5) * 200);
    cloud.rotation.y = Math.random() * Math.PI * 2;
    world.scene.add(cloud);
    world.clouds.push(cloud);
  }
}

function buildRain() {
  const rainGeometry = new THREE.BufferGeometry();
  const dropCount = 800;
  const positions = new Float32Array(dropCount * 3);
  for (let i = 0; i < dropCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const rainMaterial = new THREE.PointsMaterial({ color: 0x88c6ff, size: 0.2, transparent: true, opacity: 0.6 });
  const rain = new THREE.Points(rainGeometry, rainMaterial);
  rain.visible = false;
  world.scene.add(rain);
  world.rain = rain;
}

function handleResize() {
  if (!world.renderer || !world.camera) return;
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(width, height, false);
}

function updateDayNight(delta) {
  state.timeOfDay = (state.timeOfDay + delta * 0.2) % 24;
  const t = state.timeOfDay / 24;
  const angle = t * Math.PI * 2;
  world.sunLight.position.set(Math.cos(angle) * 40, 30 + Math.sin(angle) * 30, Math.sin(angle) * 40);

  const intensity = Math.max(0.2, Math.sin(angle) + 0.5);
  world.sunLight.intensity = intensity * weatherStates[state.weatherIndex].intensity;
  world.ambientLight.intensity = 0.3 + intensity * 0.4;

  const skyColor = new THREE.Color().setHSL(0.62, 0.5, 0.12 + intensity * 0.35);
  world.scene.background = skyColor;
  world.scene.fog.color = skyColor;

  const hours = Math.floor(state.timeOfDay);
  const minutes = Math.floor((state.timeOfDay - hours) * 60);
  hudTime.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function updateWeather(delta) {
  state.weatherTimer += delta * state.weatherRate;
  if (state.weatherTimer > 45) {
    state.weatherTimer = 0;
    state.weatherIndex = (state.weatherIndex + 1) % weatherStates.length;
    pushEvent(`Weather update: ${weatherStates[state.weatherIndex].label}.`);
    state.windDirection = new THREE.Vector2(Math.random() * 2 - 1, Math.random() * 0.4 - 0.2).normalize();
  }

  const currentWeather = weatherStates[state.weatherIndex];
  hudWeather.textContent = currentWeather.label;
  world.scene.fog.color.setHex(currentWeather.fog);
  world.rain.visible = currentWeather.label === "Rain";
}

function updateRain(delta) {
  if (!world.rain.visible) return;
  const positions = world.rain.geometry.attributes.position.array;
  for (let i = 1; i < positions.length; i += 3) {
    positions[i] -= delta * 30;
    if (positions[i] < 0) {
      positions[i] = 60;
    }
  }
  world.rain.geometry.attributes.position.needsUpdate = true;
}

  if (currentWeather.label === "Storm" && Math.random() < 0.02) {
    world.ambientLight.intensity = 1.2;
  } else {
    world.ambientLight.intensity = 0.3 + Math.max(0.2, Math.sin(state.timeOfDay / 24 * Math.PI * 2) + 0.5) * 0.4;
  }
function updateClouds(delta) {
  world.clouds.forEach((cloud, index) => {
    const speed = state.cloudSpeed * (1 + index * 0.2);
    cloud.position.x += delta * speed * state.windDirection.x * 6;
    cloud.position.z += delta * speed * state.windDirection.y * 6;
    if (cloud.position.x > 120) cloud.position.x = -120;
    if (cloud.position.x < -120) cloud.position.x = 120;
    if (cloud.position.z > 120) cloud.position.z = -120;
    if (cloud.position.z < -120) cloud.position.z = 120;
  });
}

function updateNPCs(delta) {
  world.npcs.forEach((npc) => {
    npc.userData.wanderTimer -= delta;
    if (npc.userData.wanderTimer <= 0) {
      npc.userData.wanderAngle = Math.random() * Math.PI * 2;
      npc.userData.wanderTimer = 2 + Math.random() * 4;
    }
    const distance = npc.position.distanceTo(world.target);
    const steering = new THREE.Vector3();
    if (distance < 10) {
      const away = npc.position.clone().sub(world.target).normalize();
      steering.add(away.multiplyScalar(npc.userData.avoidStrength));
    }
    if (npc.position.distanceTo(npc.userData.goal) < 4) {
      npc.userData.goal.set((Math.random() - 0.5) * 120, 0, (Math.random() - 0.5) * 120);
    }
    const goalDirection = npc.userData.goal.clone().sub(npc.position).normalize();
    steering.add(goalDirection.multiplyScalar(1.5));
    world.npcs.forEach((other) => {
      if (other === npc) return;
      const separation = npc.position.distanceTo(other.position);
      if (separation < 3) {
        steering.add(npc.position.clone().sub(other.position).normalize().multiplyScalar(2));
      }
    });
    npc.position.add(steering.multiplyScalar(npc.userData.speed * delta * 0.3));
    npc.material.color.copy(distance < 6 ? new THREE.Color(0x4fd2ff) : npc.userData.baseColor);
  });
}

function updatePolice(delta) {
  world.police.forEach((officer) => {
    const distance = officer.position.distanceTo(world.target);
    const direction = world.target.clone().sub(officer.position).normalize();
    if (distance < 25) {
      officer.position.add(direction.multiplyScalar(officer.userData.speed * delta));
    } else {
      officer.userData.patrolAngle += delta * 0.6;
      officer.position.x += Math.cos(officer.userData.patrolAngle) * delta * 2;
      officer.position.z += Math.sin(officer.userData.patrolAngle) * delta * 2;
    }
  });
}

function updateTraffic(delta) {
  world.cars.forEach((car) => {
    if (!car.userData.ai) return;
    const targetSpeed = car.userData.maxSpeed * (state.weatherIndex === 2 ? 0.6 : 1);
    car.userData.speed = THREE.MathUtils.lerp(car.userData.speed, targetSpeed, 0.02);
    car.position.x += car.userData.direction * car.userData.speed * delta * 0.5;
    car.rotation.y = car.userData.direction > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    if (car.position.x > 110 || car.position.x < -110) {
      car.userData.direction *= -1;
    }
  });
}

function updatePlayer(delta) {
  const target = state.playerInVehicle ? state.playerInVehicle : state.playerInPlane ? world.plane : world.player;
  if (state.playerInVehicle) {
    updateVehicleMovement(state.playerInVehicle, delta, 12);
    return;
  }
  if (state.playerInPlane) {
    updatePlaneMovement(world.plane, delta);
    return;
  }

  const speed = 6;
  const movement = new THREE.Vector3();
  const inputX = state.input.right - state.input.left + state.analog.x;
  const inputZ = state.input.backward - state.input.forward + state.analog.y;
  movement.set(inputX, 0, inputZ);
  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(speed * delta);
    world.player.position.add(movement);
  }

  world.target.copy(target.position);
}

function updateVehicleMovement(vehicle, delta, speed) {
  const steer = state.input.right - state.input.left + state.analog.x;
  const throttle =
    (state.input.forward ? 1 : 0) -
    (state.input.backward ? 1 : 0) -
    state.analog.y +
    state.analogThrottle;
  const accel = throttle * speed;
  vehicle.userData.speed = THREE.MathUtils.clamp(
    vehicle.userData.speed + accel * delta * 6,
    -vehicle.userData.maxSpeed * 0.4,
    vehicle.userData.maxSpeed,
  );
  const turnRate = 2.2 * (Math.abs(vehicle.userData.speed) / vehicle.userData.maxSpeed + 0.2);
  vehicle.userData.heading += steer * delta * turnRate;
  vehicle.rotation.y = vehicle.userData.heading;
  vehicle.position.x += Math.sin(vehicle.userData.heading) * vehicle.userData.speed * delta;
  vehicle.position.z += Math.cos(vehicle.userData.heading) * vehicle.userData.speed * delta;
  world.target.copy(vehicle.position);
}

function updatePlaneMovement(plane, delta) {
  const steer = state.input.right - state.input.left + state.analog.x;
  const throttle =
    (state.input.forward ? 1 : 0) -
    (state.input.backward ? 1 : 0) -
    state.analog.y +
    state.analogThrottle;
  plane.userData.speed = THREE.MathUtils.clamp(
    plane.userData.speed + throttle * delta * 8,
    0,
    plane.userData.maxSpeed,
  );
  plane.userData.heading += steer * delta * 1.4;
  plane.rotation.y = plane.userData.heading;
  plane.position.x += Math.sin(plane.userData.heading) * plane.userData.speed * delta;
  plane.position.z += Math.cos(plane.userData.heading) * plane.userData.speed * delta;
  plane.position.y = 8 + Math.sin(Date.now() * 0.001) * 2 + plane.userData.speed * 0.05;
  world.target.copy(plane.position);
}

function updateCamera(delta) {
  const desiredPosition = world.target.clone().add(world.cameraOffset);
  world.camera.position.lerp(desiredPosition, 0.08);
  world.camera.lookAt(world.target);
}

function updateHUDMode() {
  if (state.playerInPlane) {
    state.mode = "Flying";
  } else if (state.playerInVehicle) {
    state.mode = "Driving";
  } else {
    state.mode = "On Foot";
  }
  hudMode.textContent = state.mode;
}

function updateEvents(delta) {
  state.eventTimer += delta;
  if (state.eventTimer > 12) {
    state.eventTimer = 0;
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    const zone = getZoneLabel(world.target);
    pushEvent(`${event} (${zone}).`);
  }
}

function adjustCameraZoom(delta) {
  const zoomTarget = THREE.MathUtils.clamp(world.cameraOffset.length() + delta, 8, 30);
  world.cameraOffset.setLength(zoomTarget);
}

function getZoneLabel(position) {
  if (state.currentInterior) {
    return state.currentInterior.name;
  }
  if (position.x < -30 && position.z < -30) {
    return "Airstrip";
  }
  if (position.x > 40 && position.z > 20) {
    return "Harbor Loop";
  }
  if (position.z < -40) {
    return "Old Town";
  }
  if (position.x > 40) {
    return "Stadium District";
  }
  return "Downtown";
}

function updateZone() {
  hudLocation.textContent = getZoneLabel(world.target);
}

function findNearbyInterior() {
  return world.interiors.find((interior) => interior.door.position.distanceTo(world.player.position) < 5);
}

function enterInterior(interior) {
  state.currentInterior = interior;
  interior.interiorGroup.visible = true;
  interior.exterior.visible = false;
  interior.door.visible = false;
  world.player.position.copy(interior.entryPoint);
  pushEvent(`Entered ${interior.name}.`);
}

function exitInterior() {
  if (!state.currentInterior) return;
  const interior = state.currentInterior;
  interior.interiorGroup.visible = false;
  interior.exterior.visible = true;
  interior.door.visible = true;
  world.player.position.copy(interior.exitPoint);
  pushEvent(`Exited ${interior.name}.`);
  state.currentInterior = null;
}

function handleInteract() {
  if (state.currentInterior) {
    exitInterior();
    return;
  }
  const nearbyInterior = findNearbyInterior();
  if (nearbyInterior) {
    enterInterior(nearbyInterior);
    return;
  }
  toggleVehicle();
}

function animate() {
  if (!state.sceneReady) return;
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, clock.getDelta());
  updateDayNight(delta);
  updateWeather(delta);
  updateRain(delta);
  updateClouds(delta);
  updateNPCs(delta);
  updateTraffic(delta);
  updatePlayer(delta);
  updateCamera(delta);
  updateHUDMode();
  updateEvents(delta);
  updateZone();
  world.renderer.render(world.scene, world.camera);
}

function handleKeyDown(event) {
  if (event.repeat) return;
  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      state.input.forward = true;
      break;
    case "s":
    case "arrowdown":
      state.input.backward = true;
      break;
  updatePolice(delta);
    case "a":
    case "arrowleft":
      state.input.left = true;
      break;
    case "d":
    case "arrowright":
      state.input.right = true;
      break;
    case "e":
      handleInteract();
      break;
    case "h":
      toggleHud();
      break;
    case "t":
      toggleStoryPanel();
      break;
    case "u":
      toggleTutorialPanel();
      break;
    case "c":
      switchCamera();
      break;
    case "z":
      adjustCameraZoom(-1);
      break;
    case "x":
      adjustCameraZoom(1);
      break;
    default:
      break;
  }
}

function handleKeyUp(event) {
  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      state.input.forward = false;
      break;
    case "s":
    case "arrowdown":
      state.input.backward = false;
      break;
    case "a":
    case "arrowleft":
      state.input.left = false;
      break;
    case "d":
    case "arrowright":
      state.input.right = false;
      break;
    default:
      break;
  }
}

function toggleVehicle() {
  if (state.playerInVehicle || state.playerInPlane) {
    if (state.playerInPlane) {
      state.playerInPlane = false;
      world.player.position.copy(world.plane.position).add(new THREE.Vector3(2, 0, 2));
    } else {
      world.player.position.copy(state.playerInVehicle.position).add(new THREE.Vector3(2, 0, 2));
      state.playerInVehicle = null;
    }
    world.player.visible = true;
    return;
  }

  const nearbyCar = world.cars.find((car) => car.position.distanceTo(world.player.position) < 6);
  if (nearbyCar) {
    state.playerInVehicle = nearbyCar;
    world.player.visible = false;
    pushEvent("Entered vehicle: Street Sedan.");
    return;
  }

  if (world.plane.position.distanceTo(world.player.position) < 8) {
    state.playerInPlane = true;
    world.player.visible = false;
    pushEvent("Entered aircraft: Metro Skimmer.");
  }
}

function toggleHud() {
  state.hudVisible = !state.hudVisible;
  hud.classList.toggle("hidden", !state.hudVisible);
}

function toggleStoryPanel() {
  state.storyVisible = !state.storyVisible;
  storyPanel.classList.toggle("hidden", !state.storyVisible);
  eventPanel.classList.toggle("hidden", !state.storyVisible);
}

function switchCamera() {
  state.cameraIndex = (state.cameraIndex + 1) % world.cameraOffsets.length;
  world.cameraOffset.copy(world.cameraOffsets[state.cameraIndex]);
}

function updateController() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gamepad = Array.from(gamepads).find((pad) => pad);
  if (gamepad) {
    state.controllerActive = true;
    controllerStatus.textContent = gamepad.id.includes("Xbox") ? "Xbox Controller Connected" : "Controller Connected";
    state.analog.x = Math.abs(gamepad.axes[0] || 0) > 0.15 ? gamepad.axes[0] : 0;
    state.analog.y = Math.abs(gamepad.axes[1] || 0) > 0.15 ? gamepad.axes[1] : 0;
    const triggerForward = gamepad.buttons[7]?.value || 0;
    const triggerBackward = gamepad.buttons[6]?.value || 0;
    state.analogThrottle = triggerForward - triggerBackward;
    const actionPressed = gamepad.buttons[0]?.pressed;
    const hudPressed = gamepad.buttons[1]?.pressed;
    const storyPressed = gamepad.buttons[2]?.pressed;
    const cameraPressed = gamepad.buttons[3]?.pressed;
    if (actionPressed && !state.actionPressed) {
      handleInteract();
    }
    if (hudPressed && !state.hudPressed) {
      toggleHud();
    }
    if (storyPressed && !state.storyPressed) {
      toggleStoryPanel();
    }
    if (cameraPressed && !state.cameraPressed) {
      switchCamera();
    }
    if (!mainMenu.classList.contains("hidden") && gamepad.buttons[9]?.pressed) {
      startExperience();
    }
    if (!mainMenu.classList.contains("hidden") && gamepad.buttons[3]?.pressed && !state.cameraPressed) {
      toggleMenuSettings();
    }
    state.actionPressed = Boolean(actionPressed);
    state.hudPressed = Boolean(hudPressed);
    state.storyPressed = Boolean(storyPressed);
    state.cameraPressed = Boolean(cameraPressed);
  } else {
function toggleTutorialPanel() {
  state.tutorialVisible = !state.tutorialVisible;
  tutorialPanel.classList.toggle("hidden", !state.tutorialVisible);
}

    const tutorialPressed = gamepad.buttons[8]?.pressed;
    const zoomInPressed = gamepad.buttons[12]?.pressed;
    const zoomOutPressed = gamepad.buttons[13]?.pressed;
    if (tutorialPressed && !state.tutorialPressed) {
      toggleTutorialPanel();
    }
    if (zoomInPressed) {
      adjustCameraZoom(-0.5);
    }
    if (zoomOutPressed) {
      adjustCameraZoom(0.5);
    }
    state.tutorialPressed = Boolean(tutorialPressed);
    state.controllerActive = false;
    controllerStatus.textContent = "Searching...";
    state.analog.x = 0;
    state.analog.y = 0;
    state.actionPressed = false;
    state.hudPressed = false;
    state.storyPressed = false;
    state.cameraPressed = false;
    state.tutorialPressed = false;
    state.analogThrottle = 0;
  }
  requestAnimationFrame(updateController);
}

function startExperience() {
  mainMenu.classList.add("hidden");
  menuSettings.classList.add("hidden");
  applySettings();
  initScene();
  initStoryList();
  initTutorial();
  pushEvent("Welcome to Metro Drift. Dispatch live!");
}

function handleFullscreen() {
  if (!document.fullscreenElement) {
    sceneWrap.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
startBtn?.addEventListener("click", startExperience);
menuStartBtn?.addEventListener("click", startExperience);
menuStoryBtn?.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  menuSettings.classList.add("hidden");
  applySettings();
  initScene();
  initStoryList();
  initTutorial();
});
menuSettingsBtn?.addEventListener("click", toggleMenuSettings);
settingsApplyBtn?.addEventListener("click", applySettings);
fullscreenBtn?.addEventListener("click", handleFullscreen);
toggleHudBtn?.addEventListener("click", toggleHud);
toggleTutorialBtn?.addEventListener("click", toggleTutorialPanel);

updateController();
