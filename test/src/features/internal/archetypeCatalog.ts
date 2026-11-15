import {
  type Archetype,
  type IArchetypeBand,
  createAppliance,
  createBag,
  createBall,
  createBar,
  createBarbell,
  createBarrel,
  createBed,
  createBeerTap,
  createBench,
  createBicycle,
  createBin,
  createBoard,
  createBoat,
  createBow,
  createBox,
  createBoxingGlove,
  createCannon,
  createCar,
  createCareItem,
  createCart,
  createCellFront,
  createCleaning,
  createClub,
  createConsole,
  createControl,
  createCue,
  createCueTable,
  createDeck,
  createDevice,
  createDiscus,
  createDoor,
  createDrinkware,
  createDumbbell,
  createElevator,
  createExerciseBike,
  createExerciseMat,
  createFireRing,
  createFood,
  createGate,
  createGlove,
  createGoal,
  createGolfClub,
  createHammerThrow,
  createHandgun,
  createHandhold,
  createHatch,
  createHeavyBag,
  createHighChair,
  createHighJump,
  createHolster,
  createHorse,
  createHurdle,
  createInstrument,
  createJavelin,
  createJumpRope,
  createKerb,
  createKettlebell,
  createKeyboard,
  createLadder,
  createLandingMat,
  createLectern,
  createLight,
  createLoad,
  createLongGun,
  createLongTool,
  createMachine,
  createMagazine,
  createMicrophone,
  createMirror,
  createMobilityAid,
  createMotorcycle,
  createObstacle,
  createParallelBars,
  createPell,
  createPlyoBox,
  createPolearm,
  createPoolEdge,
  createPony,
  createPram,
  createProjectile,
  createPullUpBar,
  createRack,
  createRacket,
  createRamp,
  createRelayBaton,
  createRing,
  createRock,
  createRowingMachine,
  createSafe,
  createSaloonDoor,
  createSanitary,
  createSeat,
  createShowcase,
  createShield,
  createShot,
  createSkateboard,
  createSki,
  createSled,
  createSmoking,
  createStairs,
  createStartingBlock,
  createStationery,
  createStick,
  createStorage,
  createStreetFixture,
  createSurfboard,
  createSwitch,
  createSword,
  createTable,
  createTableware,
  createTap,
  createTent,
  createTool,
  createTorch,
  createTray,
  createTree,
  createUmbrella,
  createValve,
  createVaultingPole,
  createVaultingTable,
  createVessel,
  createWall,
  createWeaponLoop,
  createWeaponRack,
  createWearable,
  createWheelchair,
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
  // A row is fixed when every band it draws is one value and it has at most one read model to pick.
  const settled = (
    bands: Readonly<Partial<Record<string, IArchetypeBand>>>,
    models?: Readonly<Partial<Record<string, unknown>>>,
  ): boolean =>
    Object.values(bands).every(
      (band: IArchetypeBand | undefined): boolean =>
        band === undefined || band.minimum === band.maximum,
    ) && Object.keys(models ?? {}).length <= 1;
  const add = (
    name: string,
    create: (seed?: number | string) => Archetype,
    fixed?: boolean,
  ): void => {
    rows.push({ name, create, ...(fixed === true ? { fixed } : {}) });
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
      settled(createStationery.BANDS[kind], createStationery.MODELS[kind]),
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
      settled(createTool.BANDS[kind], createTool.MODELS[kind]),
    );
  for (const kind of createLongTool.KINDS)
    add(
      `longTool-${kind}`,
      (seed?: number | string): Archetype => createLongTool({ kind }, seed),
      settled(createLongTool.BANDS[kind], createLongTool.MODELS[kind]),
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
  add(
    "highChair",
    (seed?: number | string): Archetype => createHighChair({}, seed),
  );
  add(
    "lectern",
    (seed?: number | string): Archetype => createLectern({}, seed),
  );
  add(
    "console",
    (seed?: number | string): Archetype => createConsole({}, seed),
  );
  add(
    "showcase",
    (seed?: number | string): Archetype => createShowcase({}, seed),
  );
  for (const hinge of ["left", "right"] as const)
    add(
      `safe-${hinge}`,
      (seed?: number | string): Archetype => createSafe({ hinge }, seed),
      true,
    );
  for (const kind of createBarrel.KINDS)
    add(
      `barrel-${kind}`,
      (seed?: number | string): Archetype => createBarrel({ kind }, seed),
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
  for (const kind of createStreetFixture.KINDS)
    add(
      `streetFixture-${kind}`,
      (seed?: number | string): Archetype =>
        createStreetFixture({ kind }, seed),
    );
  for (const kind of createBin.KINDS)
    add(
      `bin-${kind}`,
      (seed?: number | string): Archetype => createBin({ kind }, seed),
    );
  for (const kind of createGate.KINDS)
    add(
      `gate-${kind}`,
      (seed?: number | string): Archetype => createGate({ kind }, seed),
    );
  for (const kind of createMachine.KINDS)
    add(
      `machine-${kind}`,
      (seed?: number | string): Archetype => createMachine({ kind }, seed),
    );
  add("valve", (seed?: number | string): Archetype => createValve({}, seed));
  for (const kind of createHandhold.KINDS)
    add(
      `handhold-${kind}`,
      (seed?: number | string): Archetype => createHandhold({ kind }, seed),
    );
  for (const kind of createMirror.KINDS)
    add(
      `mirror-${kind}`,
      (seed?: number | string): Archetype => createMirror({ kind }, seed),
    );
  for (const kind of createBoard.KINDS)
    add(
      `board-${kind}`,
      (seed?: number | string): Archetype => createBoard({ kind }, seed),
    );
  add(
    "saloonDoor",
    (seed?: number | string): Archetype => createSaloonDoor({}, seed),
  );
  for (const kind of createControl.KINDS)
    add(
      `control-${kind}`,
      (seed?: number | string): Archetype => createControl({ kind }, seed),
    );
  add("hatch", (seed?: number | string): Archetype => createHatch({}, seed));
  add(
    "beerTap",
    (seed?: number | string): Archetype => createBeerTap({}, seed),
  );
  add(
    "cellFront",
    (seed?: number | string): Archetype => createCellFront(createCellFront.REFERENCE, seed),
  );
  add(
    "elevator",
    (seed?: number | string): Archetype => createElevator({}, seed),
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
  for (const kind of createWheelchair.KINDS)
    add(
      `wheelchair-${kind}`,
      (seed?: number | string): Archetype => createWheelchair({ kind }, seed),
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
      kind === "limber" || kind === "wagon",
    );
  for (const kind of createBoat.KINDS)
    add(
      `boat-${kind}`,
      (seed?: number | string): Archetype => createBoat({ kind }, seed),
      kind === "launch",
    );
  add(
    "deck",
    (seed?: number | string): Archetype =>
      createDeck(createDeck.REFERENCE, seed),
    true,
  );
  add("horse", (seed?: number | string): Archetype => createHorse({}, seed));
  add("pony", (seed?: number | string): Archetype => createPony({}, seed));
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
      settled(createMagazine.BANDS[kind]),
    );
  for (const kind of createProjectile.KINDS)
    add(
      `projectile-${kind}`,
      (seed?: number | string): Archetype => createProjectile({ kind }, seed),
      settled(createProjectile.BANDS[kind], createProjectile.MODELS[kind]),
    );
  for (const kind of createBow.KINDS)
    add(
      `bow-${kind}`,
      (seed?: number | string): Archetype => createBow({ kind }, seed),
    );
  for (const kind of createCannon.KINDS)
    add(
      `cannon-${kind}`,
      (seed?: number | string): Archetype => createCannon({ kind }, seed),
      settled(createCannon.BANDS[kind]),
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
  add(
    "boxingGlove",
    (seed?: number | string): Archetype => createBoxingGlove({}, seed),
  );
  add(
    "heavyBag",
    (seed?: number | string): Archetype => createHeavyBag({}, seed),
  );
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
      settled(createTableware.BANDS[kind], createTableware.MODELS[kind]),
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
      settled(createLight.BANDS[kind]),
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
  for (const kind of createRock.KINDS)
    add(
      `rock-${kind}`,
      (seed?: number | string): Archetype => createRock({ kind }, seed),
    );
  for (const kind of createFireRing.KINDS)
    add(
      `fireRing-${kind}`,
      (seed?: number | string): Archetype => createFireRing({ kind }, seed),
      settled(createFireRing.BANDS[kind]),
    );
  for (const kind of createTent.KINDS)
    add(
      `tent-${kind}`,
      (seed?: number | string): Archetype => createTent({ kind }, seed),
    );
  for (const kind of createTree.KINDS)
    add(
      `tree-${kind}`,
      (seed?: number | string): Archetype => createTree({ kind }, seed),
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
  add(
    "highJump-poleVault",
    (seed?: number | string): Archetype =>
      createHighJump({ kind: "poleVault" }, seed),
  );
  for (const kind of createPoolEdge.KINDS)
    add(
      `poolEdge-${kind}`,
      (seed?: number | string): Archetype => createPoolEdge({ kind }, seed),
    );
  for (const kind of createGoal.KINDS)
    add(
      `goal-${kind}`,
      (seed?: number | string): Archetype => createGoal({ kind }, seed),
    );
  for (const kind of createStick.KINDS)
    add(
      `stick-${kind}`,
      (seed?: number | string): Archetype => createStick({ kind }, seed),
    );
  add("cue", (seed?: number | string): Archetype => createCue({}, seed));
  add(
    "cueTable",
    (seed?: number | string): Archetype => createCueTable({}, seed),
  );
  add(
    "skateboard",
    (seed?: number | string): Archetype => createSkateboard({}, seed),
  );
  add("ski", (seed?: number | string): Archetype => createSki({}, seed));
  add(
    "surfboard",
    (seed?: number | string): Archetype => createSurfboard({}, seed),
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
  // Music: the instruments and the microphones.
  for (const kind of createInstrument.KINDS)
    add(
      `instrument-${kind}`,
      (seed?: number | string): Archetype => createInstrument({ kind }, seed),
    );
  for (const kind of createMicrophone.KINDS)
    add(
      `microphone-${kind}`,
      (seed?: number | string): Archetype => createMicrophone({ kind }, seed),
      kind === "handheld",
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

    /** True when every band of the row's variant has zero width, as a standardised munition's read single figures do, so no seed varies it. */
    fixed?: boolean;
  }
}
