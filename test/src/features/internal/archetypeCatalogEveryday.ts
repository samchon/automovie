import {
  type AutoMovieArchetype,
  createBall,
  createCleaning,
  createCue,
  createCueTable,
  createDiscus,
  createFireRing,
  createFood,
  createGlove,
  createGoal,
  createGolfClub,
  createHammerThrow,
  createHighJump,
  createHurdle,
  createInstrument,
  createJavelin,
  createKeyboard,
  createLandingMat,
  createLight,
  createMicrophone,
  createMobilityAid,
  createPoolEdge,
  createPram,
  createRacket,
  createRelayBaton,
  createRock,
  createShot,
  createSkateboard,
  createSki,
  createStartingBlock,
  createStick,
  createSurfboard,
  createTableware,
  createTent,
  createTorch,
  createTray,
  createTree,
  createUmbrella,
  createVaultingPole,
  createVaultingTable,
  createVessel,
  createWearable,
} from "@automovie/archetypes";

import type { archetypeCatalog } from "./archetypeCatalog";

/**
 * The catalog's rows of everyday objects, outdoor scenery, sport apparatus and
 * implements, and music. Part of `archetypeCatalog`, kept apart so each file
 * stays within its size.
 *
 * @param add Adds one row: its name, its archetype for a seed, and whether no
 *   seed varies it.
 * @param settled Whether a variant's bands are each one value and it has at
 *   most one read model.
 */
export function archetypeCatalogEveryday(
  add: archetypeCatalog.Add,
  settled: archetypeCatalog.Settled,
): void {
  // Everyday: vessels, wearables, keyboards, cleaning, carriers, a torch and a pram.
  for (const kind of createVessel.KINDS)
    add(
      `vessel-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createVessel({ kind, ...dimensions }, seed),
    );
  for (const kind of createWearable.KINDS)
    add(
      `wearable-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createWearable({ kind, ...dimensions }, seed),
    );
  for (const kind of createKeyboard.KINDS)
    add(
      `keyboard-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createKeyboard({ kind, ...dimensions }, seed),
    );
  for (const kind of createCleaning.KINDS)
    add(
      `cleaning-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createCleaning({ kind, ...dimensions }, seed),
    );
  for (const kind of createTray.KINDS)
    add(
      `tray-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createTray({ kind, ...dimensions }, seed),
    );
  add(
    "torch",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createTorch({ ...dimensions }, seed),
  );
  add(
    "pram",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createPram({ ...dimensions }, seed),
  );
  for (const kind of createTableware.KINDS)
    add(
      `tableware-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createTableware({ kind, ...dimensions }, seed),
      settled(createTableware.BANDS[kind], createTableware.MODELS[kind]),
    );
  for (const kind of createFood.KINDS)
    add(
      `food-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createFood({ kind, ...dimensions }, seed),
      settled(createFood.BANDS[kind], createFood.MODELS[kind]),
    );
  for (const kind of createLight.KINDS)
    add(
      `light-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createLight({ kind, ...dimensions }, seed),
      settled(createLight.BANDS[kind]),
    );
  for (const open of [false, true])
    add(
      `umbrella-${open ? "open" : "closed"}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createUmbrella({ open, ...dimensions }, seed),
    );
  for (const kind of createMobilityAid.KINDS)
    add(
      `mobilityAid-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createMobilityAid({ kind, ...dimensions }, seed),
    );
  for (const kind of createRock.KINDS)
    add(
      `rock-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createRock({ kind, ...dimensions }, seed),
    );
  for (const kind of createFireRing.KINDS)
    add(
      `fireRing-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createFireRing({ kind, ...dimensions }, seed),
      settled(createFireRing.BANDS[kind]),
    );
  for (const kind of createTent.KINDS)
    add(
      `tent-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createTent({ kind, ...dimensions }, seed),
    );
  for (const kind of createTree.KINDS)
    add(
      `tree-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createTree({ kind, ...dimensions }, seed),
    );
  // Sport: the jump apparatus.
  add(
    "vaultingPole",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createVaultingPole({ ...dimensions }, seed),
  );
  add(
    "highJump",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createHighJump({ ...dimensions }, seed),
  );
  add(
    "highJump-poleVault",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype =>
      createHighJump({ kind: "poleVault", ...dimensions }, seed),
  );
  for (const kind of createPoolEdge.KINDS)
    add(
      `poolEdge-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createPoolEdge({ kind, ...dimensions }, seed),
    );
  for (const kind of createGoal.KINDS)
    add(
      `goal-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createGoal({ kind, ...dimensions }, seed),
    );
  for (const kind of createStick.KINDS)
    add(
      `stick-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createStick({ kind, ...dimensions }, seed),
    );
  add(
    "cue",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createCue({ ...dimensions }, seed),
  );
  add(
    "cueTable",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createCueTable({ ...dimensions }, seed),
  );
  add(
    "skateboard",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createSkateboard({ ...dimensions }, seed),
  );
  add(
    "ski",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createSki({ ...dimensions }, seed),
  );
  add(
    "surfboard",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createSurfboard({ ...dimensions }, seed),
  );
  for (const kind of createLandingMat.KINDS)
    add(
      `landingMat-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createLandingMat({ kind, ...dimensions }, seed),
    );
  for (const kind of createVaultingTable.KINDS)
    add(
      `vaultingTable-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype =>
        createVaultingTable({ kind, ...dimensions }, seed),
    );
  // Sport: the balls, the struck and thrown implements and the track.
  for (const kind of createBall.KINDS)
    add(
      `ball-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBall({ kind, ...dimensions }, seed),
    );
  for (const kind of createRacket.KINDS)
    add(
      `racket-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createRacket({ kind, ...dimensions }, seed),
    );
  for (const kind of createGolfClub.KINDS)
    add(
      `golfClub-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createGolfClub({ kind, ...dimensions }, seed),
    );
  for (const kind of createGlove.KINDS)
    add(
      `glove-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createGlove({ kind, ...dimensions }, seed),
    );
  for (const kind of createJavelin.KINDS)
    add(
      `javelin-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createJavelin({ kind, ...dimensions }, seed),
    );
  for (const kind of createShot.KINDS)
    add(
      `shot-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createShot({ kind, ...dimensions }, seed),
    );
  for (const kind of createDiscus.KINDS)
    add(
      `discus-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createDiscus({ kind, ...dimensions }, seed),
    );
  for (const kind of createHammerThrow.KINDS)
    add(
      `hammerThrow-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createHammerThrow({ kind, ...dimensions }, seed),
    );
  for (const kind of createHurdle.KINDS)
    add(
      `hurdle-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createHurdle({ kind, ...dimensions }, seed),
    );
  add(
    "startingBlock",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createStartingBlock({ ...dimensions }, seed),
  );
  add(
    "relayBaton",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createRelayBaton({ ...dimensions }, seed),
  );
  // Music: the instruments and the microphones.
  for (const kind of createInstrument.KINDS)
    add(
      `instrument-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createInstrument({ kind, ...dimensions }, seed),
    );
  for (const kind of createMicrophone.KINDS)
    add(
      `microphone-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createMicrophone({ kind, ...dimensions }, seed),
      kind === "handheld",
    );
}
