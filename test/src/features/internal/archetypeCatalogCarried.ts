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
 * The catalog's rows of vehicles, animals, weapons and gym equipment. Part of
 * `archetypeCatalog`, kept apart so each file stays within its size.
 *
 * @param add Adds one row: its name, its archetype for a seed, and whether no
 *   seed varies it.
 * @param settled Whether a variant's bands are each one value and it has at
 *   most one read model.
 */
export function archetypeCatalogCarried(
  add: archetypeCatalog.Add,
  settled: archetypeCatalog.Settled,
): void {
  for (const kind of createCar.KINDS)
    add(
      `car-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createCar({ kind, ...dimensions }, seed),
    );
  add(
    "bicycle",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createBicycle({ ...dimensions }, seed),
  );
  for (const kind of createWheelchair.KINDS)
    add(
      `wheelchair-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createWheelchair({ kind, ...dimensions }, seed),
    );
  for (const kind of createMotorcycle.KINDS)
    add(
      `motorcycle-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createMotorcycle({ kind, ...dimensions }, seed),
    );
  for (const kind of createCart.KINDS)
    add(
      `cart-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createCart({ kind, ...dimensions }, seed),
      kind === "limber" || kind === "wagon",
    );
  for (const kind of createBoat.KINDS)
    add(
      `boat-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBoat({ kind, ...dimensions }, seed),
      kind === "launch",
    );
  add(
    "deck",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype =>
      createDeck({ ...createDeck.REFERENCE, ...dimensions }, seed),
    true,
  );
  add(
    "horse",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createHorse({ ...dimensions }, seed),
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
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype =>
      createOx({ ...createOx.REFERENCE, lead, ...dimensions }, seed),
  );
  add(
    "camel",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype =>
      createCamel({ ...createCamel.REFERENCE, lead, ...dimensions }, seed),
  );
  add(
    "deer",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype =>
      createDeer({ mass: 62, lead, ...dimensions }, seed),
  );
  add(
    "pony",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createPony({ ...dimensions }, seed),
  );
  add(
    "donkey",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createDonkey({ ...dimensions }, seed),
  );
  add(
    "mule",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createMule({ ...dimensions }, seed),
  );
  for (const frame of createHandgun.FRAMES)
    add(
      `handgun-${frame}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createHandgun({ frame, ...dimensions }, seed),
    );
  for (const kind of createHolster.KINDS)
    add(
      `holster-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createHolster({ kind, ...dimensions }, seed),
    );
  for (const kind of createMagazine.KINDS)
    add(
      `magazine-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createMagazine({ kind, ...dimensions }, seed),
      settled(createMagazine.BANDS[kind]),
    );
  for (const kind of createProjectile.KINDS)
    add(
      `projectile-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createProjectile({ kind, ...dimensions }, seed),
      settled(createProjectile.BANDS[kind], createProjectile.MODELS[kind]),
    );
  for (const kind of createBow.KINDS)
    add(
      `bow-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBow({ kind, ...dimensions }, seed),
    );
  for (const kind of createCannon.KINDS)
    add(
      `cannon-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createCannon({ kind, ...dimensions }, seed),
      settled(createCannon.BANDS[kind], createCannon.MODELS[kind]),
    );
  for (const kind of createSiegeEngine.KINDS)
    add(
      `siegeEngine-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSiegeEngine({ kind, ...dimensions }, seed),
    );
  for (const kind of createLongGun.KINDS)
    add(
      `longGun-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createLongGun({ kind, ...dimensions }, seed),
    );
  add(
    `dumbbell`,
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createDumbbell({ ...dimensions }, seed),
  );
  add(
    `kettlebell`,
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createKettlebell({ ...dimensions }, seed),
  );
  add(
    `bench`,
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createBench({ ...dimensions }, seed),
  );
  add(
    `plyo-box`,
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createPlyoBox({ ...dimensions }, seed),
  );
  add(
    `rack`,
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createRack({ ...dimensions }, seed),
  );
  add(
    "sled",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createSled({ ...dimensions }, seed),
  );
  add(
    "rowingMachine",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createRowingMachine({ ...dimensions }, seed),
  );
  add(
    "exerciseBike",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createExerciseBike({ ...dimensions }, seed),
  );
  for (const kind of createExerciseMat.KINDS)
    add(
      `exerciseMat-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createExerciseMat({ kind, ...dimensions }, seed),
    );
  add(
    "jumpRope",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createJumpRope({ ...dimensions }, seed),
  );
  add(
    "ring",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createRing({ ...dimensions }, seed),
  );
  add(
    "boxingGlove",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createBoxingGlove({ ...dimensions }, seed),
  );
  add(
    "heavyBag",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createHeavyBag({ ...dimensions }, seed),
  );
  for (const kind of createPullUpBar.KINDS)
    add(
      `pull-up-bar-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createPullUpBar({ kind, ...dimensions }, seed),
    );
  for (const kind of createParallelBars.KINDS)
    add(
      `parallel-bars-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype =>
        createParallelBars({ kind, ...dimensions }, seed),
    );
  for (const kind of createBarbell.KINDS)
    add(
      `barbell-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBarbell({ kind, ...dimensions }, seed),
    );
  for (const kind of createClub.KINDS)
    add(
      `club-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createClub({ kind, ...dimensions }, seed),
    );
  for (const kind of createSword.KINDS)
    add(
      `sword-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSword({ kind, ...dimensions }, seed),
    );
  for (const kind of createShield.KINDS)
    add(
      `shield-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createShield({ kind, ...dimensions }, seed),
    );
  for (const kind of createPolearm.KINDS)
    add(
      `polearm-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createPolearm({ kind, ...dimensions }, seed),
    );
  add(
    "pell",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createPell({ ...dimensions }, seed),
  );
  for (const kind of createWeaponLoop.KINDS)
    add(
      `weaponLoop-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createWeaponLoop({ kind, ...dimensions }, seed),
    );
  add(
    "weaponRack",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createWeaponRack({ ...dimensions }, seed),
  );
}
