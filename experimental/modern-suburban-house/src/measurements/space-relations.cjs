#!/usr/bin/env node
/**
 * In-memory source perturbations for the authored space relationships. The
 * child process intercepts only a selected TypeScript read; tracked source is
 * never written. Each case compares actual built consumers with the clean
 * scene, and the seam test inspects emitted mesh vertices rather than helper
 * text. This runs with check:spaces so a severed source relation is red.
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");

/** @type {Array<[string, string, Array<[string, string]>, string[]]>} */
const cases = [
  [
    "garage-door",
    "src/spaces/envelope/front.ts",
    [
      ["from: 6.1,", "from: 6.0,"],
      ["to: 11.1,", "to: 11.2,"],
    ],
    [
      "drivewayX",
      "drivewayPartX",
      "drivewayZoneX",
      "frontConnectorX",
      "frontWalkZoneX",
      "sideConnectorX",
      "sideWalkZoneConnectorX",
    ],
  ],
  [
    "garage-right",
    "src/spaces/building.ts",
    [
      [
        "const outer = { x: [MAIN.inner.x[1], 11.7] as const",
        "const outer = { x: [MAIN.inner.x[1], 11.8] as const",
      ],
    ],
    ["sideWalkX", "sideLongPartX", "sideFrontZoneX", "fenceRight"],
  ],
  [
    "chimney-west",
    "src/spaces/roof/junctions.ts",
    [["x: [-6.3, -5.5] as const", "x: [-6.5, -5.5] as const"]],
    ["fenceWest"],
  ],
  [
    "garden-door",
    "src/spaces/envelope/rear.ts",
    [
      ["from: -1.2,", "from: -1.0,"],
      ["to: 1.2,", "to: 1.4,"],
    ],
    ["terraceStepX", "lowerLandingX", "lowerLandingPartX", "gardenConnectorX"],
  ],
  [
    "main-rear-wall",
    "src/spaces/building.ts",
    [["z: [-10.7, 0] as const", "z: [-10.9, 0] as const"]],
    ["terraceRearZ", "terraceZoneZ"],
  ],
  [
    "porch-edge",
    "src/spaces/porch.ts",
    [["PORCH_STEP_BACK_Z = 2.2;", "PORCH_STEP_BACK_Z = 2.3;"]],
    ["porchPlatformZ", "porchZoneZ", "porchStepZ", "porchConnectorZ"],
  ],
  [
    "gable-a",
    "src/spaces/roof/junctions.ts",
    [["const a = -5.75;", "const a = -5.7;"]],
    ["gableCenter", "gableHeight"],
  ],
  [
    "terrace-edge",
    "src/spaces/site/terrace.ts",
    [["TERRACE_EDGE_Z = -14.4;", "TERRACE_EDGE_Z = -14.6;"]],
    ["gardenStepZ", "gardenConnectorZ"],
  ],
  [
    "garage-wall",
    "src/spaces/building.ts",
    [["const wall = 0.25;", "const wall = 0.4;"]],
    [
      "garageInnerX",
      "garageRoomX",
      "garageFloorX",
      "garageFrontWallZ",
      "garageRearWallZ",
      "garageRightWallX",
      "garageShelfZ",
      "garageToolBoardZ",
      "garageCrossX",
      "garageWindowX",
    ],
  ],
  [
    "right-overhang",
    "src/spaces/roof/junctions.ts",
    [["right: 0.4,", "right: 0.5,"]],
    ["rightFrontZ", "rightBackZ", "rightEastX"],
  ],
  [
    "porch-width",
    "src/spaces/porch.ts",
    [["PORCH_STEP_HALF_WIDTH = 0.75;", "PORCH_STEP_HALF_WIDTH = 0.85;"]],
    ["porchStepX", "porchConnectorWidth"],
  ],
  [
    "garden-width",
    "src/spaces/site/terrace.ts",
    [
      [
        "STEP_CENTRE_X - 0.75, STEP_CENTRE_X + 0.75",
        "STEP_CENTRE_X - 0.85, STEP_CENTRE_X + 0.85",
      ],
    ],
    ["gardenStepWidth", "gardenConnectorWidth"],
  ],
  [
    "stair-guard-reserve",
    "src/spaces/stair.ts",
    [["guardReserve: 0.075,", "guardReserve: 0.1,"]],
    ["stairGuardPostWidth", "stairConnectorWidth"],
  ],
];

if (process.argv[2] === "--sample") {
  const chosen = cases.find(([name]) => name === process.argv[3]);
  if (process.argv[3] && !chosen) throw new Error(
    `unknown relation ${process.argv[3]}`,
  );
  if (chosen) {
    const target = path.join(root, chosen[1]);
    const originalRead = fs.readFileSync;
    Object.defineProperty(fs, "readFileSync", { configurable: true, value: /** @param {import("node:fs").PathOrFileDescriptor} file @param {...unknown} args */ (file, ...args) => {
      const content = Reflect.apply(originalRead, fs, [file, ...args]);
      if (path.resolve(String(file)) !== target) return content;
      let changed = String(content);
      for (const [from, to] of chosen[2]) {
        if (changed.split(from).length !== 2) throw new Error(`${chosen[0]}: source match is not unique: ${from}`);
        changed = changed.replace(from, to);
      }
      return changed;
    }});
  }
  require(require.resolve("tsx/cjs"));
  const { GARAGE } = require("../spaces/building.ts");
  const { DRIVEWAY, buildDriveway } = require("../spaces/site/driveway.ts");
  const { FRONT_WALK, buildFrontWalk } = require(
    "../spaces/site/front-walk.ts",
  );
  const { SIDE_WALK, buildSideWalk } = require("../spaces/site/side-walk.ts");
  const { buildFence } = require("../spaces/site/fence.ts");
  const { buildTerrace, LOWER_LANDING } = require("../spaces/site/terrace.ts");
  const { buildPorch } = require("../spaces/porch.ts");
  const { buildGarageInterior } = require("../spaces/rooms/garage-interior.ts");
  const { buildGarageFloorBase } = require("../spaces/garage.ts");
  const { GABLE, gable } = require("../spaces/roof/junctions.ts");
  const { buildHouse } = require("../spaces/house.ts");
  const { buildHouseEnvironment } = require("../spaces/environment.ts");
  /** @param {{ mesh:{ positions:ArrayLike<number> } }} part @param {"x"|"y"|"z"} axis */
  const range = (part, axis) => {
    const offset = { x: 0, y: 1, z: 2 }[axis];
    const values = [];
    for (let i = offset; i < part.mesh.positions.length; i += 3) values.push(
      part.mesh.positions[i],
    );
    return [Math.min(...values), Math.max(...values)].map(
      (n) => Math.round(n * 1e5) / 1e5,
    );
  };
  /** @param {Array<{ id:string;mesh:{ positions:ArrayLike<number> } }>} parts @param {string} id */
  const part = (parts, id) => {
    const found = parts.find((p) => p.id === id);
    if (!found) throw new Error(`missing ${id}`);
    return found;
  };
  const terrace = buildTerrace();
  const porch = buildPorch();
  const drive = buildDriveway(FRONT_WALK.connectorZ, SIDE_WALK.frontBand);
  const front = buildFrontWalk();
  const side = buildSideWalk();
  const fence = buildFence();
  const garageRoom = buildGarageInterior().space;
  /** @param {string} id */
  const reserve = (id) => (garageRoom.reservations ?? []).find(
    (r) => r.id === id,
  );
  /** @type {ReturnType<typeof buildHouse>|undefined} */
  let house;
  /** @type {ReturnType<typeof buildHouseEnvironment>|undefined} */
  let env;
  /** @type {string|null} */
  let assemblyError = null;
  try {
    house = buildHouse();
    env = buildHouseEnvironment(house);
  } catch (error) {
    assemblyError = String(error);
  }
  /** @param {string} id */
  const connector = (id) => env?.connectors.find(
    (/** @type {{ id:string }} */ c) => c.id === id,
  );
  /** @param {{ outline:readonly { x:number;z:number }[] }|undefined} zone @param {"x"|"z"} axis */
  const zoneRange = (zone, axis) => {
    if (!zone) throw new Error("missing zone for relation measurement");
    const v = zone.outline.map((p) => p[axis]);
    return [Math.min(...v), Math.max(...v)];
  };
  /** @param {{ mesh:{ positions:ArrayLike<number> } }} p @param {number} x @param {readonly [number,number]} z */
  const flatStations = (p, x, z) => [...new Set(Array.from(p.mesh.positions)
    .filter((_, i) => i % 3 === 0)
    .map((_, i) => ({ x: p.mesh.positions[i * 3], z: p.mesh.positions[i * 3 + 2] }))
    .filter((v) => Math.abs(v.x - x) < 1e-5 && v.z >= z[0] - 1e-5 && v.z <= z[1] + 1e-5)
    .map((v) => Math.round(v.z * 1e5) / 1e5))].sort((a, b) => a - b);
  const frontSeam = flatStations(
    part(front.parts, "front-walk"),
    FRONT_WALK.x[1],
    FRONT_WALK.connectorZ,
  );
  const sideSeam = flatStations(
    part(side.parts, "side-walk-long"),
    SIDE_WALK.x[0],
    SIDE_WALK.frontBand,
  );
  const driveFrontSeam = flatStations(
    part(drive.parts, "driveway"),
    DRIVEWAY.x[0],
    FRONT_WALK.connectorZ,
  );
  const driveSideSeam = flatStations(
    part(drive.parts, "driveway"),
    DRIVEWAY.x[1],
    SIDE_WALK.frontBand,
  );
  const seam = [frontSeam, sideSeam, driveFrontSeam, driveSideSeam]
    .every((stations) => stations.length === 5);
  const result = {
    drivewayX: DRIVEWAY.x,
    drivewayPartX: range(part(drive.parts, "driveway"), "x"),
    drivewayZoneX: zoneRange(
      drive.zones.find((z) => z.id === "driveway"),
      "x",
    ),
    frontConnectorX: range(part(front.parts, "front-walk-connector-3-0-0"), "x"),
    frontWalkZoneX: zoneRange(
      front.zones.find((z) => z.id === "front-walk"),
      "x",
    ),
    sideConnectorX: range(
      part(side.parts, "side-walk-front-connector-0-0-0"),
      "x",
    ),
    sideWalkZoneConnectorX: side.zones.find((z) => z.id === "side-walk")?.outline[3]?.x,
    sideWalkX: SIDE_WALK.x,
    sideLongPartX: range(part(side.parts, "side-walk-long"), "x"),
    sideFrontZoneX: zoneRange(
      side.zones.find((z) => z.id === "side-front-access"),
      "x",
    ),
    fenceRight: range(part(fence, "fence-post-right-front"), "x"),
    fenceWest: range(part(fence, "fence-post-left-front"), "x"),
    terraceStepX: range(part(terrace.parts, "garden-step-1"), "x"),
    lowerLandingX: LOWER_LANDING.x,
    lowerLandingPartX: range(part(terrace.parts, "garden-lower-landing"), "x"),
    gardenConnectorX: connector("garden-steps")?.route[1].x,
    terraceRearZ: range(part(terrace.parts, "garden-terrace"), "z")[1],
    terraceZoneZ: zoneRange(
      terrace.zones.find((z) => z.id === "garden-terrace"),
      "z",
    ),
    porchPlatformZ: range(part(porch.parts, "porch-platform"), "z"),
    porchZoneZ: zoneRange(
      porch.zones.find((z) => z.id === "front-porch"),
      "z",
    ),
    porchStepZ: range(part(porch.parts, "porch-step-1"), "z"),
    porchConnectorZ: connector("porch-steps")?.route[2].z,
    gableCenter: GABLE.center,
    gableHeight: gable(GABLE.center),
    gardenStepZ: range(part(terrace.parts, "garden-step-1"), "z"),
    gardenConnectorZ: connector("garden-steps")?.route[1].z,
    garageInnerX: GARAGE.inner.x,
    garageRoomX: zoneRange(garageRoom, "x"),
    garageFloorX: range(part(buildGarageFloorBase(), "garage-floor-base"), "x"),
    garageFrontWallZ: house && range(part(house.parts, "front-garage-wall"), "z"),
    garageRearWallZ: house && range(part(house.parts, "rear-garage-wall"), "z"),
    garageRightWallX: house && range(part(house.parts, "right-garage-wall"), "x"),
    garageShelfZ: reserve("garage-shelf")?.z,
    garageToolBoardZ: reserve("garage-tool-board")?.z,
    garageCrossX: reserve("garage-cross-route")?.x,
    garageWindowX: reserve("garage-window-route")?.x,
    rightFrontZ: house && range(part(house.parts, "roof-right-front"), "z"),
    rightBackZ: house && range(part(house.parts, "roof-right-back"), "z"),
    rightEastX: house && range(part(house.parts, "roof-right-front"), "x"),
    porchStepX: range(part(porch.parts, "porch-step-1"), "x"),
    porchConnectorWidth: connector("porch-steps")?.width,
    gardenStepWidth: LOWER_LANDING.x[1] - LOWER_LANDING.x[0],
    gardenConnectorWidth: connector("garden-steps")?.width,
    stairGuardPostWidth: house && range(part(house.parts, "stair-guard-post-west"), "x")[1] - range(part(house.parts, "stair-guard-post-west"), "x")[0],
    stairConnectorWidth: connector("main-stair-connection")?.width,
    seam,
    assemblyError,
  };
  process.stdout.write(JSON.stringify(result));
} else {
  /** @param {string} [name] */
  const sample = (name) => {
    const run = spawnSync(
      process.execPath,
      [__filename, "--sample", ...(name ? [name] : [])],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 << 20,
      },
    );
    if (run.status !== 0) throw new Error(
      `${name ?? "base"}: ${run.stderr || run.stdout}`,
    );
    return JSON.parse(run.stdout);
  };
  const base = sample();
  if (!base.seam || base.assemblyError) throw new Error(
    `base scene or paving seam failed: ${base.assemblyError}`,
  );
  let failures = 0;
  for (const [name, , , fields] of cases) {
    try {
      const changed = sample(name);
      if (name === "stair-guard-reserve" && (Math.abs(base.stairConnectorWidth - 1) > 1e-6 || Math.abs(changed.stairConnectorWidth - 0.95) > 1e-6)) throw new Error(
        `${name}: connector width must follow the two side reservations from 1.00 to 0.95 m`,
      );
      const stuck = fields.filter(
        (field) => changed[field] === undefined || JSON.stringify(changed[field]) === JSON.stringify(base[field]),
      );
      if (stuck.length) {
        ++failures;
        console.error(`${name}: UNMOVED ${stuck.join(", ")}`);
      } else console.log(`${name}: ${fields.length} consumers MOVED`);
    } catch (error) {
      ++failures;
      console.error(String(error));
    }
  }
  console.log(
    `space relations: ${cases.length} mutations, ${failures} failures`,
  );
  if (failures) process.exitCode = 1;
}
