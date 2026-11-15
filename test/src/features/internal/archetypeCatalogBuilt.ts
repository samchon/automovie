import {
  type Archetype,
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
 * The catalog's rows of the built environment: doors, windows and switches, stairs and street fixtures, machines, walls, bars and ladders. Part of `archetypeCatalog`, kept apart so each file stays within its size.
 *
 * @param add Adds one row: its name, its archetype for a seed, and whether no seed varies it.
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
    (seed?: number | string): Archetype =>
      createCellFront(createCellFront.REFERENCE, seed),
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
}
