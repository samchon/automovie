import {
  type Archetype,
  createAppliance,
  createBag,
  createBall,
  createBar,
  createBarbell,
  createBed,
  createBench,
  createBicycle,
  createBox,
  createCar,
  createCareItem,
  createCart,
  createCleaning,
  createClub,
  createDevice,
  createDiscus,
  createDoor,
  createDrinkware,
  createDumbbell,
  createExerciseBike,
  createExerciseMat,
  createFood,
  createGlove,
  createGolfClub,
  createHammerThrow,
  createHandgun,
  createHighJump,
  createHolster,
  createHorse,
  createHurdle,
  createJavelin,
  createJumpRope,
  createKerb,
  createKettlebell,
  createKeyboard,
  createLadder,
  createLandingMat,
  createLight,
  createLoad,
  createLongGun,
  createLongTool,
  createMagazine,
  createMobilityAid,
  createMotorcycle,
  createObstacle,
  createParallelBars,
  createPell,
  createPlyoBox,
  createPolearm,
  createPram,
  createPullUpBar,
  createRack,
  createRacket,
  createRamp,
  createRelayBaton,
  createRing,
  createRowingMachine,
  createSanitary,
  createSeat,
  createShield,
  createShot,
  createSled,
  createSmoking,
  createStairs,
  createStartingBlock,
  createStationery,
  createStorage,
  createSwitch,
  createSword,
  createTable,
  createTableware,
  createTap,
  createTool,
  createTorch,
  createTray,
  createUmbrella,
  createVaultingPole,
  createVaultingTable,
  createVessel,
  createWall,
  createWeaponLoop,
  createWeaponRack,
  createWearable,
  createWindow,
} from "@automovie/archetypes";

/**
 * Every archetype the package produces, one row per producer and kind, each as a function of the seed: the population the contract tests sweep.
 *
 * A row's name is `<producer>-<kind>`. The door's three axes (kind, hinge side, hardware) are covered pairwise, not multiplied out.
 *
 * @returns The rows.
 */
export function archetypeCatalog(): archetypeCatalog.IRow[] {
  const rows: archetypeCatalog.IRow[] = [];
  const add = (
    name: string,
    create: (seed?: number | string) => Archetype,
  ): void => {
    rows.push({ name, create });
  };
  for (const kind of createDrinkware.KINDS)
    add(
      `drinkware-${kind}`,
      (seed?: number | string): Archetype => createDrinkware({ kind }, seed),
    );
  for (const kind of createDevice.KINDS)
    add(
      `device-${kind}`,
      (seed?: number | string): Archetype => createDevice({ kind }, seed),
    );
  for (const kind of createSmoking.KINDS)
    add(
      `smoking-${kind}`,
      (seed?: number | string): Archetype => createSmoking({ kind }, seed),
    );
  for (const kind of createStationery.KINDS)
    add(
      `stationery-${kind}`,
      (seed?: number | string): Archetype => createStationery({ kind }, seed),
    );
  for (const kind of createCareItem.KINDS)
    add(
      `careItem-${kind}`,
      (seed?: number | string): Archetype => createCareItem({ kind }, seed),
    );
  for (const kind of createBag.KINDS)
    add(
      `bag-${kind}`,
      (seed?: number | string): Archetype => createBag({ kind }, seed),
    );
  add("box", (seed?: number | string): Archetype => createBox({}, seed));
  for (const kind of createTool.KINDS)
    add(
      `tool-${kind}`,
      (seed?: number | string): Archetype => createTool({ kind }, seed),
    );
  for (const kind of createLongTool.KINDS)
    add(
      `longTool-${kind}`,
      (seed?: number | string): Archetype => createLongTool({ kind }, seed),
    );
  for (const kind of createSeat.KINDS)
    add(
      `seat-${kind}`,
      (seed?: number | string): Archetype => createSeat({ kind }, seed),
    );
  for (const kind of createBed.KINDS)
    add(
      `bed-${kind}`,
      (seed?: number | string): Archetype => createBed({ kind }, seed),
    );
  for (const kind of createTable.KINDS)
    add(
      `table-${kind}`,
      (seed?: number | string): Archetype => createTable({ kind }, seed),
    );
  for (const kind of createStorage.KINDS)
    add(
      `storage-${kind}`,
      (seed?: number | string): Archetype => createStorage({ kind }, seed),
    );
  for (const kind of createLoad.KINDS)
    add(
      `load-${kind}`,
      (seed?: number | string): Archetype => createLoad({ kind }, seed),
    );

  // Door: every pair of (hinge side, hardware) values, and the sliding kind on both sides.
  for (const [hinge, hardware] of [
    ["left", "lever"],
    ["right", "knob"],
    ["left", "plate"],
    ["right", "lever"],
    ["left", "knob"],
    ["right", "plate"],
  ] as const)
    add(
      `door-hinged-${hinge}-${hardware}`,
      (seed?: number | string): Archetype =>
        createDoor({ kind: "hinged", hinge, hardware }, seed),
    );
  for (const hinge of ["left", "right"] as const)
    add(
      `door-sliding-${hinge}`,
      (seed?: number | string): Archetype =>
        createDoor({ kind: "sliding", hinge }, seed),
    );
  for (const kind of createWindow.KINDS)
    add(
      `window-${kind}`,
      (seed?: number | string): Archetype => createWindow({ kind }, seed),
    );
  for (const kind of createSwitch.KINDS)
    add(
      `switch-${kind}`,
      (seed?: number | string): Archetype => createSwitch({ kind }, seed),
    );
  add("stairs", (seed?: number | string): Archetype => createStairs({}, seed));
  add("ramp", (seed?: number | string): Archetype => createRamp({}, seed));
  for (const kind of createKerb.KINDS)
    add(
      `kerb-${kind}`,
      (seed?: number | string): Archetype => createKerb({ kind }, seed),
    );
  add("tap", (seed?: number | string): Archetype => createTap({}, seed));
  for (const kind of createSanitary.KINDS)
    add(
      `sanitary-${kind}`,
      (seed?: number | string): Archetype => createSanitary({ kind }, seed),
    );
  for (const kind of createAppliance.KINDS)
    add(
      `appliance-${kind}`,
      (seed?: number | string): Archetype => createAppliance({ kind }, seed),
    );
  for (const kind of createObstacle.KINDS)
    add(
      `obstacle-${kind}`,
      (seed?: number | string): Archetype => createObstacle({ kind }, seed),
    );
  for (const kind of createWall.KINDS)
    add(
      `wall-${kind}`,
      (seed?: number | string): Archetype => createWall({ kind }, seed),
    );
  for (const kind of createBar.KINDS)
    add(
      `bar-${kind}`,
      (seed?: number | string): Archetype => createBar({ kind }, seed),
    );
  for (const kind of createLadder.KINDS)
    add(
      `ladder-${kind}`,
      (seed?: number | string): Archetype => createLadder({ kind }, seed),
    );
  for (const kind of createCar.KINDS)
    add(
      `car-${kind}`,
      (seed?: number | string): Archetype => createCar({ kind }, seed),
    );
  add(
    "bicycle",
    (seed?: number | string): Archetype => createBicycle({}, seed),
  );
  for (const kind of createMotorcycle.KINDS)
    add(
      `motorcycle-${kind}`,
      (seed?: number | string): Archetype => createMotorcycle({ kind }, seed),
    );
  for (const kind of createCart.KINDS)
    add(
      `cart-${kind}`,
      (seed?: number | string): Archetype => createCart({ kind }, seed),
    );
  add("horse", (seed?: number | string): Archetype => createHorse({}, seed));
  for (const frame of createHandgun.FRAMES)
    add(
      `handgun-${frame}`,
      (seed?: number | string): Archetype => createHandgun({ frame }, seed),
    );
  for (const kind of createHolster.KINDS)
    add(
      `holster-${kind}`,
      (seed?: number | string): Archetype => createHolster({ kind }, seed),
    );
  for (const kind of createMagazine.KINDS)
    add(
      `magazine-${kind}`,
      (seed?: number | string): Archetype => createMagazine({ kind }, seed),
    );
  for (const kind of createLongGun.KINDS)
    add(
      `longGun-${kind}`,
      (seed?: number | string): Archetype => createLongGun({ kind }, seed),
    );
  add(
    `dumbbell`,
    (seed?: number | string): Archetype => createDumbbell({}, seed),
  );
  add(
    `kettlebell`,
    (seed?: number | string): Archetype => createKettlebell({}, seed),
  );
  add(`bench`, (seed?: number | string): Archetype => createBench({}, seed));
  add(
    `plyo-box`,
    (seed?: number | string): Archetype => createPlyoBox({}, seed),
  );
  add(`rack`, (seed?: number | string): Archetype => createRack({}, seed));
  add("sled", (seed?: number | string): Archetype => createSled({}, seed));
  add(
    "rowingMachine",
    (seed?: number | string): Archetype => createRowingMachine({}, seed),
  );
  add(
    "exerciseBike",
    (seed?: number | string): Archetype => createExerciseBike({}, seed),
  );
  for (const kind of createExerciseMat.KINDS)
    add(
      `exerciseMat-${kind}`,
      (seed?: number | string): Archetype => createExerciseMat({ kind }, seed),
    );
  add(
    "jumpRope",
    (seed?: number | string): Archetype => createJumpRope({}, seed),
  );
  add("ring", (seed?: number | string): Archetype => createRing({}, seed));
  for (const kind of createPullUpBar.KINDS)
    add(
      `pull-up-bar-${kind}`,
      (seed?: number | string): Archetype => createPullUpBar({ kind }, seed),
    );
  for (const kind of createParallelBars.KINDS)
    add(
      `parallel-bars-${kind}`,
      (seed?: number | string): Archetype => createParallelBars({ kind }, seed),
    );
  for (const kind of createBarbell.KINDS)
    add(
      `barbell-${kind}`,
      (seed?: number | string): Archetype => createBarbell({ kind }, seed),
    );
  for (const kind of createClub.KINDS)
    add(
      `club-${kind}`,
      (seed?: number | string): Archetype => createClub({ kind }, seed),
    );
  for (const kind of createSword.KINDS)
    add(
      `sword-${kind}`,
      (seed?: number | string): Archetype => createSword({ kind }, seed),
    );
  for (const kind of createShield.KINDS)
    add(
      `shield-${kind}`,
      (seed?: number | string): Archetype => createShield({ kind }, seed),
    );
  for (const kind of createPolearm.KINDS)
    add(
      `polearm-${kind}`,
      (seed?: number | string): Archetype => createPolearm({ kind }, seed),
    );
  add("pell", (seed?: number | string): Archetype => createPell({}, seed));
  for (const kind of createWeaponLoop.KINDS)
    add(
      `weaponLoop-${kind}`,
      (seed?: number | string): Archetype => createWeaponLoop({ kind }, seed),
    );
  add(
    "weaponRack",
    (seed?: number | string): Archetype => createWeaponRack({}, seed),
  );

  // Everyday: vessels, wearables, keyboards, cleaning, carriers, a torch and a pram.
  for (const kind of createVessel.KINDS)
    add(
      `vessel-${kind}`,
      (seed?: number | string): Archetype => createVessel({ kind }, seed),
    );
  for (const kind of createWearable.KINDS)
    add(
      `wearable-${kind}`,
      (seed?: number | string): Archetype => createWearable({ kind }, seed),
    );
  for (const kind of createKeyboard.KINDS)
    add(
      `keyboard-${kind}`,
      (seed?: number | string): Archetype => createKeyboard({ kind }, seed),
    );
  for (const kind of createCleaning.KINDS)
    add(
      `cleaning-${kind}`,
      (seed?: number | string): Archetype => createCleaning({ kind }, seed),
    );
  for (const kind of createTray.KINDS)
    add(
      `tray-${kind}`,
      (seed?: number | string): Archetype => createTray({ kind }, seed),
    );
  add("torch", (seed?: number | string): Archetype => createTorch({}, seed));
  add("pram", (seed?: number | string): Archetype => createPram({}, seed));
  for (const kind of createTableware.KINDS)
    add(
      `tableware-${kind}`,
      (seed?: number | string): Archetype => createTableware({ kind }, seed),
    );
  for (const kind of createFood.KINDS)
    add(
      `food-${kind}`,
      (seed?: number | string): Archetype => createFood({ kind }, seed),
    );
  for (const kind of createLight.KINDS)
    add(
      `light-${kind}`,
      (seed?: number | string): Archetype => createLight({ kind }, seed),
    );
  for (const open of [false, true])
    add(
      `umbrella-${open ? "open" : "closed"}`,
      (seed?: number | string): Archetype => createUmbrella({ open }, seed),
    );
  for (const kind of createMobilityAid.KINDS)
    add(
      `mobilityAid-${kind}`,
      (seed?: number | string): Archetype => createMobilityAid({ kind }, seed),
    );
  // Sport: the jump apparatus.
  add(
    "vaultingPole",
    (seed?: number | string): Archetype => createVaultingPole({}, seed),
  );
  add(
    "highJump",
    (seed?: number | string): Archetype => createHighJump({}, seed),
  );
  for (const kind of createLandingMat.KINDS)
    add(
      `landingMat-${kind}`,
      (seed?: number | string): Archetype => createLandingMat({ kind }, seed),
    );
  for (const kind of createVaultingTable.KINDS)
    add(
      `vaultingTable-${kind}`,
      (seed?: number | string): Archetype =>
        createVaultingTable({ kind }, seed),
    );
  // Sport: the balls, the struck and thrown implements and the track.
  for (const kind of createBall.KINDS)
    add(
      `ball-${kind}`,
      (seed?: number | string): Archetype => createBall({ kind }, seed),
    );
  for (const kind of createRacket.KINDS)
    add(
      `racket-${kind}`,
      (seed?: number | string): Archetype => createRacket({ kind }, seed),
    );
  for (const kind of createGolfClub.KINDS)
    add(
      `golfClub-${kind}`,
      (seed?: number | string): Archetype => createGolfClub({ kind }, seed),
    );
  for (const kind of createGlove.KINDS)
    add(
      `glove-${kind}`,
      (seed?: number | string): Archetype => createGlove({ kind }, seed),
    );
  for (const kind of createJavelin.KINDS)
    add(
      `javelin-${kind}`,
      (seed?: number | string): Archetype => createJavelin({ kind }, seed),
    );
  for (const kind of createShot.KINDS)
    add(
      `shot-${kind}`,
      (seed?: number | string): Archetype => createShot({ kind }, seed),
    );
  for (const kind of createDiscus.KINDS)
    add(
      `discus-${kind}`,
      (seed?: number | string): Archetype => createDiscus({ kind }, seed),
    );
  for (const kind of createHammerThrow.KINDS)
    add(
      `hammerThrow-${kind}`,
      (seed?: number | string): Archetype => createHammerThrow({ kind }, seed),
    );
  for (const kind of createHurdle.KINDS)
    add(
      `hurdle-${kind}`,
      (seed?: number | string): Archetype => createHurdle({ kind }, seed),
    );
  add(
    "startingBlock",
    (seed?: number | string): Archetype => createStartingBlock({}, seed),
  );
  add(
    "relayBaton",
    (seed?: number | string): Archetype => createRelayBaton({}, seed),
  );
  return rows;
}

/** Companion type of {@link archetypeCatalog}. */
export namespace archetypeCatalog {
  /** One archetype of the catalog. */
  export interface IRow {
    /** `<producer>-<kind>`. */
    name: string;

    /** The archetype for a seed; the middle of every band when the seed is absent. */
    create(seed?: number | string): Archetype;
  }
}
