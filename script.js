import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const storyBeats = [
  "Hour 1: Arrive in Metro Valley, take your first dispatch call.",
  "Hour 2: Meet the crew at Pier 9 and investigate a missing convoy.",
  "Hour 3: High-speed pursuit through the skyline expressway.",
  "Hour 4: Calm before the storm at the rooftop lookout.",
  "Hour 5: Night infiltration at the finance district gala.",
  "Hour 6: Escape across the river bridges in a thunderstorm.",
  "Hour 7: Desert airstrip showdown with rival pilots.",
  "Hour 8: Sunrise finale and the city-wide blackout reveal.",
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
const controllerStatus = document.getElementById("controller-status");
const hudLocation = document.getElementById("hud-location");
const hudMode = document.getElementById("hud-mode");
const hudTime = document.getElementById("hud-time");
const hudWeather = document.getElementById("hud-weather");
const eventFeed = document.getElementById("event-feed");
const storyList = document.getElementById("story-list");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const toggleHudBtn = document.getElementById("toggle-hud-btn");
const hud = document.getElementById("hud");

const state = {
  sceneReady: false,
  timeOfDay: 17.5,
  weatherIndex: 0,
  weatherTimer: 0,
  eventTimer: 0,
  mode: "On Foot",
  controllerActive: false,
  controllerName: "",
  playerInVehicle: null,
  playerInPlane: false,
  hudVisible: true,
  actionPressed: false,
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
  target: new THREE.Vector3(),
  cameraOffset: new THREE.Vector3(0, 12, 18),
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
  buildPlayer();
  buildNPCs();
  buildCars();
  buildPlane();
  buildClouds();
  buildRain();

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
      const height = 6 + Math.random() * 18;
      const geometry = new THREE.BoxGeometry(10, height, 10);
      const building = new THREE.Mesh(geometry, buildingMaterial.clone());
      building.material.color.setHSL(0.6, 0.35, 0.25 + Math.random() * 0.2);
      building.position.set(x + (Math.random() * 6 - 3), height / 2, z + (Math.random() * 6 - 3));
      building.castShadow = true;
      building.receiveShadow = true;
      world.scene.add(building);
    }
  }
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

function buildNPCs() {
  const geometry = new THREE.CapsuleGeometry(0.7, 1.5, 4, 8);
  for (let i = 0; i < 10; i += 1) {
    const material = new THREE.MeshStandardMaterial({ color: 0xffb347 });
    const npc = new THREE.Mesh(geometry, material);
    npc.position.set((Math.random() - 0.5) * 120, 1.6, (Math.random() - 0.5) * 120);
    npc.userData = {
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      speed: 2 + Math.random(),
    };
    npc.castShadow = true;
    world.scene.add(npc);
    world.npcs.push(npc);
  }
}

function buildCars() {
  const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff4d6d, metalness: 0.3, roughness: 0.4 });
  for (let i = 0; i < 4; i += 1) {
    const geometry = new THREE.BoxGeometry(3.5, 1.4, 6.5);
    const car = new THREE.Mesh(geometry, carMaterial.clone());
    car.material.color.setHSL(0.95 - i * 0.1, 0.6, 0.5);
    car.position.set(-20 + i * 12, 0.8, 10 + i * 6);
    car.userData = {
      velocity: new THREE.Vector3(),
      ai: i !== 0,
      lane: i,
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
  state.weatherTimer += delta;
  if (state.weatherTimer > 45) {
    state.weatherTimer = 0;
    state.weatherIndex = (state.weatherIndex + 1) % weatherStates.length;
    pushEvent(`Weather update: ${weatherStates[state.weatherIndex].label}.`);
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

function updateClouds(delta) {
  world.clouds.forEach((cloud, index) => {
    cloud.position.x += delta * (1 + index * 0.2);
    if (cloud.position.x > 120) {
      cloud.position.x = -120;
    }
  });
}

function updateNPCs(delta) {
  world.npcs.forEach((npc) => {
    npc.userData.wanderTimer -= delta;
    if (npc.userData.wanderTimer <= 0) {
      npc.userData.wanderAngle = Math.random() * Math.PI * 2;
      npc.userData.wanderTimer = 2 + Math.random() * 4;
    }
    npc.position.x += Math.cos(npc.userData.wanderAngle) * npc.userData.speed * delta;
    npc.position.z += Math.sin(npc.userData.wanderAngle) * npc.userData.speed * delta;
  });
}

function updateTraffic(delta) {
  world.cars.forEach((car) => {
    if (!car.userData.ai) return;
    car.position.x += delta * 4;
    if (car.position.x > 110) {
      car.position.x = -110;
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
  const inputX = state.input.right - state.input.left + state.analog.x;
  const inputZ = state.input.backward - state.input.forward + state.analog.y;
  const movement = new THREE.Vector3(inputX, 0, inputZ);
  if (movement.lengthSq() > 0) {
    movement.normalize();
  }
  vehicle.userData.velocity.lerp(movement.multiplyScalar(speed), 0.1);
  vehicle.position.add(vehicle.userData.velocity.clone().multiplyScalar(delta * 6));
  world.target.copy(vehicle.position);
}

function updatePlaneMovement(plane, delta) {
  const inputX = state.input.right - state.input.left + state.analog.x;
  const inputZ = state.input.backward - state.input.forward + state.analog.y;
  plane.position.x += inputX * delta * 20;
  plane.position.z += inputZ * delta * 20;
  plane.position.y = 8 + Math.sin(Date.now() * 0.001) * 2;
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
    pushEvent(event);
  }
}

function updateZone() {
  const position = world.target;
  if (position.x < -30 && position.z < -30) {
    hudLocation.textContent = "Airstrip";
  } else if (position.x > 40 && position.z > 20) {
    hudLocation.textContent = "Harbor Loop";
  } else if (position.z < -40) {
    hudLocation.textContent = "Old Town";
  } else if (position.x > 40) {
    hudLocation.textContent = "Stadium District";
  } else {
    hudLocation.textContent = "Downtown";
  }
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
    case "a":
    case "arrowleft":
      state.input.left = true;
      break;
    case "d":
    case "arrowright":
      state.input.right = true;
      break;
    case "e":
      toggleVehicle();
      break;
    case "h":
      toggleHud();
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

function updateController() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gamepad = Array.from(gamepads).find((pad) => pad);
  if (gamepad) {
    state.controllerActive = true;
    state.controllerName = gamepad.id;
    controllerStatus.textContent = gamepad.id.includes("Xbox") ? "Xbox Controller Connected" : "Controller Connected";
    state.analog.x = Math.abs(gamepad.axes[0] || 0) > 0.15 ? gamepad.axes[0] : 0;
    state.analog.y = Math.abs(gamepad.axes[1] || 0) > 0.15 ? gamepad.axes[1] : 0;
    const actionPressed = gamepad.buttons[0]?.pressed;
    if (actionPressed && !state.actionPressed) {
      toggleVehicle();
    }
    state.actionPressed = Boolean(actionPressed);
  } else {
    state.controllerActive = false;
    controllerStatus.textContent = "Searching...";
    state.analog.x = 0;
    state.analog.y = 0;
    state.actionPressed = false;
  }
  requestAnimationFrame(updateController);
}

function startExperience() {
  mainMenu.classList.add("hidden");
  initScene();
  initStoryList();
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
  initScene();
  initStoryList();
});
fullscreenBtn?.addEventListener("click", handleFullscreen);
toggleHudBtn?.addEventListener("click", toggleHud);

updateController();
