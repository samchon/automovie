import {
  type AutoMovieArchetype,
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
      (seed?: number | string): AutoMovieArchetype => createCar({ kind }, seed),
    );
  add(
    "bicycle",
    (seed?: number | string): AutoMovieArchetype => createBicycle({}, seed),
  );
  for (const kind of createWheelchair.KINDS)
    add(
      `wheelchair-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createWheelchair({ kind }, seed),
    );
  for (const kind of createMotorcycle.KINDS)
    add(
      `motorcycle-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createMotorcycle({ kind }, seed),
    );
  for (const kind of createCart.KINDS)
    add(
      `cart-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createCart({ kind }, seed),
      kind === "limber" || kind === "wagon",
    );
  for (const kind of createBoat.KINDS)
    add(
      `boat-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createBoat({ kind }, seed),
      kind === "launch",
    );
  add(
    "deck",
    (seed?: number | string): AutoMovieArchetype =>
      createDeck(createDeck.REFERENCE, seed),
    true,
  );
  add(
    "horse",
    (seed?: number | string): AutoMovieArchetype => createHorse({}, seed),
  );

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
    (seed?: number | string): AutoMovieArchetype =>
      createOx({ ...createOx.REFERENCE, lead }, seed),
  );
  add(
    "camel",
    (seed?: number | string): AutoMovieArchetype =>
      createCamel({ ...createCamel.REFERENCE, lead }, seed),
  );
  add(
    "deer",
    (seed?: number | string): AutoMovieArchetype =>
      createDeer({ mass: 62, lead }, seed),
  );
  add(
    "pony",
    (seed?: number | string): AutoMovieArchetype => createPony({}, seed),
  );
  add(
    "donkey",
    (seed?: number | string): AutoMovieArchetype => createDonkey({}, seed),
  );
  add(
    "mule",
    (seed?: number | string): AutoMovieArchetype => createMule({}, seed),
  );
  for (const frame of createHandgun.FRAMES)
    add(
      `handgun-${frame}`,
      (seed?: number | string): AutoMovieArchetype =>
        createHandgun({ frame }, seed),
    );
  for (const kind of createHolster.KINDS)
    add(
      `holster-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createHolster({ kind }, seed),
    );
  for (const kind of createMagazine.KINDS)
    add(
      `magazine-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createMagazine({ kind }, seed),
      settled(createMagazine.BANDS[kind]),
    );
  for (const kind of createProjectile.KINDS)
    add(
      `projectile-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createProjectile({ kind }, seed),
      settled(createProjectile.BANDS[kind], createProjectile.MODELS[kind]),
    );
  for (const kind of createBow.KINDS)
    add(
      `bow-${kind}`,
      (seed?: number | string): AutoMovieArchetype => createBow({ kind }, seed),
    );
  for (const kind of createCannon.KINDS)
    add(
      `cannon-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createCannon({ kind }, seed),
      settled(createCannon.BANDS[kind], createCannon.MODELS[kind]),
    );
  for (const kind of createSiegeEngine.KINDS)
    add(
      `siegeEngine-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createSiegeEngine({ kind }, seed),
    );
  for (const kind of createLongGun.KINDS)
    add(
      `longGun-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createLongGun({ kind }, seed),
    );
  add(
    `dumbbell`,
    (seed?: number | string): AutoMovieArchetype => createDumbbell({}, seed),
  );
  add(
    `kettlebell`,
    (seed?: number | string): AutoMovieArchetype => createKettlebell({}, seed),
  );
  add(
    `bench`,
    (seed?: number | string): AutoMovieArchetype => createBench({}, seed),
  );
  add(
    `plyo-box`,
    (seed?: number | string): AutoMovieArchetype => createPlyoBox({}, seed),
  );
  add(
    `rack`,
    (seed?: number | string): AutoMovieArchetype => createRack({}, seed),
  );
  add(
    "sled",
    (seed?: number | string): AutoMovieArchetype => createSled({}, seed),
  );
  add(
    "rowingMachine",
    (seed?: number | string): AutoMovieArchetype =>
      createRowingMachine({}, seed),
  );
  add(
    "exerciseBike",
    (seed?: number | string): AutoMovieArchetype =>
      createExerciseBike({}, seed),
  );
  for (const kind of createExerciseMat.KINDS)
    add(
      `exerciseMat-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createExerciseMat({ kind }, seed),
    );
  add(
    "jumpRope",
    (seed?: number | string): AutoMovieArchetype => createJumpRope({}, seed),
  );
  add(
    "ring",
    (seed?: number | string): AutoMovieArchetype => createRing({}, seed),
  );
  add(
    "boxingGlove",
    (seed?: number | string): AutoMovieArchetype => createBoxingGlove({}, seed),
  );
  add(
    "heavyBag",
    (seed?: number | string): AutoMovieArchetype => createHeavyBag({}, seed),
  );
  for (const kind of createPullUpBar.KINDS)
    add(
      `pull-up-bar-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createPullUpBar({ kind }, seed),
    );
  for (const kind of createParallelBars.KINDS)
    add(
      `parallel-bars-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createParallelBars({ kind }, seed),
    );
  for (const kind of createBarbell.KINDS)
    add(
      `barbell-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createBarbell({ kind }, seed),
    );
  for (const kind of createClub.KINDS)
    add(
      `club-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createClub({ kind }, seed),
    );
  for (const kind of createSword.KINDS)
    add(
      `sword-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createSword({ kind }, seed),
    );
  for (const kind of createShield.KINDS)
    add(
      `shield-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createShield({ kind }, seed),
    );
  for (const kind of createPolearm.KINDS)
    add(
      `polearm-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createPolearm({ kind }, seed),
    );
  add(
    "pell",
    (seed?: number | string): AutoMovieArchetype => createPell({}, seed),
  );
  for (const kind of createWeaponLoop.KINDS)
    add(
      `weaponLoop-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createWeaponLoop({ kind }, seed),
    );
  add(
    "weaponRack",
    (seed?: number | string): AutoMovieArchetype => createWeaponRack({}, seed),
  );
}
