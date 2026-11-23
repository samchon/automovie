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
 * The catalog's rows of everyday objects, outdoor scenery, sport apparatus and implements, and music. Part of `archetypeCatalog`, kept apart so each file stays within its size.
 *
 * @param add Adds one row: its name, its archetype for a seed, and whether no seed varies it.
 * @param settled Whether a variant's bands are each one value and it has at most one read model.
 */
export function archetypeCatalogEveryday(
  add: archetypeCatalog.Add,
  settled: archetypeCatalog.Settled,
): void {
  // Everyday: vessels, wearables, keyboards, cleaning, carriers, a torch and a pram.
  for (const kind of createVessel.KINDS)
    add(
      `vessel-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createVessel({ kind }, seed),
    );
  for (const kind of createWearable.KINDS)
    add(
      `wearable-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createWearable({ kind }, seed),
    );
  for (const kind of createKeyboard.KINDS)
    add(
      `keyboard-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createKeyboard({ kind }, seed),
    );
  for (const kind of createCleaning.KINDS)
    add(
      `cleaning-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createCleaning({ kind }, seed),
    );
  for (const kind of createTray.KINDS)
    add(
      `tray-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createTray({ kind }, seed),
    );
  add(
    "torch",
    (seed?: number | string): AutoMovieArchetype => createTorch({}, seed),
  );
  add(
    "pram",
    (seed?: number | string): AutoMovieArchetype => createPram({}, seed),
  );
  for (const kind of createTableware.KINDS)
    add(
      `tableware-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createTableware({ kind }, seed),
      settled(createTableware.BANDS[kind], createTableware.MODELS[kind]),
    );
  for (const kind of createFood.KINDS)
    add(
      `food-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createFood({ kind }, seed),
      settled(createFood.BANDS[kind], createFood.MODELS[kind]),
    );
  for (const kind of createLight.KINDS)
    add(
      `light-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createLight({ kind }, seed),
      settled(createLight.BANDS[kind]),
    );
  for (const open of [false, true])
    add(
      `umbrella-${open ? "open" : "closed"}`,
      (seed?: number | string): AutoMovieArchetype =>
        createUmbrella({ open }, seed),
    );
  for (const kind of createMobilityAid.KINDS)
    add(
      `mobilityAid-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createMobilityAid({ kind }, seed),
    );
  for (const kind of createRock.KINDS)
    add(
      `rock-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createRock({ kind }, seed),
    );
  for (const kind of createFireRing.KINDS)
    add(
      `fireRing-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createFireRing({ kind }, seed),
      settled(createFireRing.BANDS[kind]),
    );
  for (const kind of createTent.KINDS)
    add(
      `tent-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createTent({ kind }, seed),
    );
  for (const kind of createTree.KINDS)
    add(
      `tree-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createTree({ kind }, seed),
    );
  // Sport: the jump apparatus.
  add(
    "vaultingPole",
    (seed?: number | string): AutoMovieArchetype =>
      createVaultingPole({}, seed),
  );
  add(
    "highJump",
    (seed?: number | string): AutoMovieArchetype => createHighJump({}, seed),
  );
  add(
    "highJump-poleVault",
    (seed?: number | string): AutoMovieArchetype =>
      createHighJump({ kind: "poleVault" }, seed),
  );
  for (const kind of createPoolEdge.KINDS)
    add(
      `poolEdge-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createPoolEdge({ kind }, seed),
    );
  for (const kind of createGoal.KINDS)
    add(
      `goal-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createGoal({ kind }, seed),
    );
  for (const kind of createStick.KINDS)
    add(
      `stick-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createStick({ kind }, seed),
    );
  add(
    "cue",
    (seed?: number | string): AutoMovieArchetype => createCue({}, seed),
  );
  add(
    "cueTable",
    (seed?: number | string): AutoMovieArchetype => createCueTable({}, seed),
  );
  add(
    "skateboard",
    (seed?: number | string): AutoMovieArchetype => createSkateboard({}, seed),
  );
  add(
    "ski",
    (seed?: number | string): AutoMovieArchetype => createSki({}, seed),
  );
  add(
    "surfboard",
    (seed?: number | string): AutoMovieArchetype => createSurfboard({}, seed),
  );
  for (const kind of createLandingMat.KINDS)
    add(
      `landingMat-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createLandingMat({ kind }, seed),
    );
  for (const kind of createVaultingTable.KINDS)
    add(
      `vaultingTable-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createVaultingTable({ kind }, seed),
    );
  // Sport: the balls, the struck and thrown implements and the track.
  for (const kind of createBall.KINDS)
    add(
      `ball-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createBall({ kind }, seed),
    );
  for (const kind of createRacket.KINDS)
    add(
      `racket-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createRacket({ kind }, seed),
    );
  for (const kind of createGolfClub.KINDS)
    add(
      `golfClub-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createGolfClub({ kind }, seed),
    );
  for (const kind of createGlove.KINDS)
    add(
      `glove-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createGlove({ kind }, seed),
    );
  for (const kind of createJavelin.KINDS)
    add(
      `javelin-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createJavelin({ kind }, seed),
    );
  for (const kind of createShot.KINDS)
    add(
      `shot-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createShot({ kind }, seed),
    );
  for (const kind of createDiscus.KINDS)
    add(
      `discus-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createDiscus({ kind }, seed),
    );
  for (const kind of createHammerThrow.KINDS)
    add(
      `hammerThrow-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createHammerThrow({ kind }, seed),
    );
  for (const kind of createHurdle.KINDS)
    add(
      `hurdle-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createHurdle({ kind }, seed),
    );
  add(
    "startingBlock",
    (seed?: number | string): AutoMovieArchetype =>
      createStartingBlock({}, seed),
  );
  add(
    "relayBaton",
    (seed?: number | string): AutoMovieArchetype => createRelayBaton({}, seed),
  );
  // Music: the instruments and the microphones.
  for (const kind of createInstrument.KINDS)
    add(
      `instrument-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createInstrument({ kind }, seed),
    );
  for (const kind of createMicrophone.KINDS)
    add(
      `microphone-${kind}`,
      (seed?: number | string): AutoMovieArchetype =>
        createMicrophone({ kind }, seed),
      kind === "handheld",
    );
}
