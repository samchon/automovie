import {
  type Archetype,
  createBarbell,
  createBench,
  createBicycle,
  createBoat,
  createBow,
  createBoxingGlove,
  createCamel,
  createCannon,
  createCar,
  createCart,
  createClub,
  createDeck,
  createDeer,
  createDonkey,
  createDumbbell,
  createExerciseBike,
  createExerciseMat,
  createHandgun,
  createHeavyBag,
  createHolster,
  createHorse,
  createJumpRope,
  createKettlebell,
  createLongGun,
  createMagazine,
  createMotorcycle,
  createMule,
  createOx,
  createParallelBars,
  createPell,
  createPlyoBox,
  createPolearm,
  createPony,
  createProjectile,
  createPullUpBar,
  createRack,
  createRing,
  createRowingMachine,
  createShield,
  createSiegeEngine,
  createSled,
  createSword,
  createWeaponLoop,
  createWeaponRack,
  createWheelchair,
} from "@automovie/archetypes";

import type { archetypeCatalog } from "./archetypeCatalog";

/**
 * The catalog's rows of vehicles, animals, weapons and gym equipment. Part of `archetypeCatalog`, kept apart so each file stays within its size.
 *
 * @param add Adds one row: its name, its archetype for a seed, and whether no seed varies it.
 * @param settled Whether a variant's bands are each one value and it has at most one read model.
 */
export function archetypeCatalogCarried(
  add: archetypeCatalog.Add,
  settled: archetypeCatalog.Settled,
): void {
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

  // These interaction fixtures include real collar/lead geometry and its rein
  // contact. The ox/camel reference masses are adopted as authored complete
  // model totals; the deer's 62 kg total is authored separately from its bare
  // cohort's 60.4 kg mean, without inventing an equipment weight measurement.
  const lead: NonNullable<createOx.IParams["lead"]> = {
    width: 0.02,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };

  // A fixed cohort body still draws tempo in [-1, 1], so these complete
  // catalog rows remain seed-variable even when their geometry is unchanged.
  add(
    "ox",
    (seed?: number | string): Archetype =>
      createOx({ ...createOx.REFERENCE, lead }, seed),
  );
  add(
    "camel",
    (seed?: number | string): Archetype =>
      createCamel({ ...createCamel.REFERENCE, lead }, seed),
  );
  add(
    "deer",
    (seed?: number | string): Archetype =>
      createDeer({ mass: 62, lead }, seed),
  );
  add("pony", (seed?: number | string): Archetype => createPony({}, seed));
  add("donkey", (seed?: number | string): Archetype => createDonkey({}, seed));
  add("mule", (seed?: number | string): Archetype => createMule({}, seed));
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
      settled(createCannon.BANDS[kind], createCannon.MODELS[kind]),
    );
  for (const kind of createSiegeEngine.KINDS)
    add(
      `siegeEngine-${kind}`,
      (seed?: number | string): Archetype => createSiegeEngine({ kind }, seed),
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
}
