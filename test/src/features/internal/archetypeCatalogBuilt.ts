import {
  type AutoMovieArchetype,
  createAppliance,
  createBar,
  createBeerTap,
  createBin,
  createBoard,
  createCellFront,
  createControl,
  createDoor,
  createElevator,
  createGate,
  createHandhold,
  createHatch,
  createKerb,
  createLadder,
  createMachine,
  createMirror,
  createObstacle,
  createRamp,
  createSaloonDoor,
  createSanitary,
  createStairs,
  createStreetFixture,
  createSwitch,
  createTap,
  createValve,
  createWall,
  createWindow,
} from "@automovie/archetypes";

import type { archetypeCatalog } from "./archetypeCatalog";

/**
 * The catalog's rows of the built environment: doors, windows and switches,
 * stairs and street fixtures, machines, walls, bars and ladders. Part of
 * `archetypeCatalog`, kept apart so each file stays within its size.
 *
 * @param add Adds one row: its name, its archetype for a seed, and whether no
 *   seed varies it.
 */
export function archetypeCatalogBuilt(add: archetypeCatalog.Add): void {
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
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype =>
        createDoor({ kind: "hinged", hinge, hardware, ...dimensions }, seed),
    );
  for (const hinge of ["left", "right"] as const)
    add(
      `door-sliding-${hinge}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype =>
        createDoor({ kind: "sliding", hinge, ...dimensions }, seed),
    );
  for (const kind of createWindow.KINDS)
    add(
      `window-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createWindow({ kind, ...dimensions }, seed),
    );
  for (const kind of createSwitch.KINDS)
    add(
      `switch-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSwitch({ kind, ...dimensions }, seed),
    );
  add(
    "stairs",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createStairs({ ...dimensions }, seed),
  );
  add(
    "ramp",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createRamp({ ...dimensions }, seed),
  );
  for (const kind of createKerb.KINDS)
    add(
      `kerb-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createKerb({ kind, ...dimensions }, seed),
    );
  add(
    "tap",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createTap({ ...dimensions }, seed),
  );
  for (const kind of createSanitary.KINDS)
    add(
      `sanitary-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSanitary({ kind, ...dimensions }, seed),
    );
  for (const kind of createAppliance.KINDS)
    add(
      `appliance-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createAppliance({ kind, ...dimensions }, seed),
    );
  for (const kind of createObstacle.KINDS)
    add(
      `obstacle-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createObstacle({ kind, ...dimensions }, seed),
    );
  for (const kind of createStreetFixture.KINDS)
    add(
      `streetFixture-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype =>
        createStreetFixture({ kind, ...dimensions }, seed),
    );
  for (const kind of createBin.KINDS)
    add(
      `bin-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBin({ kind, ...dimensions }, seed),
    );
  for (const kind of createGate.KINDS)
    add(
      `gate-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createGate({ kind, ...dimensions }, seed),
    );
  for (const kind of createMachine.KINDS)
    add(
      `machine-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createMachine({ kind, ...dimensions }, seed),
    );
  add(
    "valve",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createValve({ ...dimensions }, seed),
  );
  for (const kind of createHandhold.KINDS)
    add(
      `handhold-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createHandhold({ kind, ...dimensions }, seed),
    );
  for (const kind of createMirror.KINDS)
    add(
      `mirror-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createMirror({ kind, ...dimensions }, seed),
    );
  for (const kind of createBoard.KINDS)
    add(
      `board-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBoard({ kind, ...dimensions }, seed),
    );
  add(
    "saloonDoor",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createSaloonDoor({ ...dimensions }, seed),
  );
  for (const kind of createControl.KINDS)
    add(
      `control-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createControl({ kind, ...dimensions }, seed),
    );
  add(
    "hatch",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createHatch({ ...dimensions }, seed),
  );
  add(
    "beerTap",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createBeerTap({ ...dimensions }, seed),
  );
  add(
    "cellFront",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype =>
      createCellFront({ ...createCellFront.REFERENCE, ...dimensions }, seed),
  );
  add(
    "elevator",
    (
      seed?: number | string,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createElevator({ ...dimensions }, seed),
  );
  for (const kind of createWall.KINDS)
    add(
      `wall-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createWall({ kind, ...dimensions }, seed),
    );
  for (const kind of createBar.KINDS)
    add(
      `bar-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBar({ kind, ...dimensions }, seed),
    );
  for (const kind of createLadder.KINDS)
    add(
      `ladder-${kind}`,
      (
        seed?: number | string,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createLadder({ kind, ...dimensions }, seed),
    );
}
