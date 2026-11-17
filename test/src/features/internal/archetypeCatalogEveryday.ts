import {
  type Archetype,
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
      settled(createFood.BANDS[kind], createFood.MODELS[kind]),
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
}
