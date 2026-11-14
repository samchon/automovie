import {
  type Archetype,
  createBag,
  createBar,
  createBarbell,
  createBed,
  createBench,
  createBicycle,
  createBox,
  createCar,
  createCareItem,
  createCart,
  createClub,
  createDevice,
  createDoor,
  createDrinkware,
  createDumbbell,
  createHandgun,
  createHighJump,
  createHolster,
  createHorse,
  createKettlebell,
  createLadder,
  createLandingMat,
  createLoad,
  createLongGun,
  createLongTool,
  createMotorcycle,
  createParallelBars,
  createPell,
  createPlyoBox,
  createPolearm,
  createPullUpBar,
  createRack,
  createRamp,
  createSeat,
  createShield,
  createSmoking,
  createStairs,
  createStationery,
  createStorage,
  createSwitch,
  createSword,
  createTable,
  createTool,
  createVaultingPole,
  createVaultingTable,
  createWall,
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
  add(
    "holster",
    (seed?: number | string): Archetype => createHolster({}, seed),
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
