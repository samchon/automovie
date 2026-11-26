import { createAppliance, createBar, createBin, createBoard, createCellFront, createControl, createDoor, createElevator, createGate, createHandhold, createHatch, createLadder, createMachine, createMirror, createObstacle, createRamp, createSaloonDoor, createSanitary, createStairs, createStreetFixture, createSwitch, createWall, createWindow, AutoMovieArchetypeBeerTap, AutoMovieArchetypeValve } from "../architecture";
import type { AutoMovieArchetype } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * The capture catalog's building subjects: doors and the windows, switches and
 * controls beside them, the climbing aids, the fixtures, the obstacles and the
 * street, each every kind of its producers at the middle of their bands.
 *
 * @param door The lever door at rest, which the catalog also shows open.
 * @returns The subjects by name, in the catalog's order.
 */
export function archetypeCaptureFixtures(
  door: ReturnType<typeof createDoor>,
): Readonly<Record<string, archetypeCaptureCatalog.ISubject>> {
  const still: typeof archetypeCaptureSubject.still =
    archetypeCaptureSubject.still;
  const kinds: typeof archetypeCaptureSubject.kinds =
    archetypeCaptureSubject.kinds;
  return {
    doors: still({
      "door-lever-right": door,
      "door-knob-left": createDoor({ hinge: "left", hardware: "knob" }),
      "door-plate-right": createDoor({ hardware: "plate" }),
      "door-sliding-left": createDoor({ kind: "sliding", hinge: "left" }),
      ...kinds(
        "window",
        createWindow.KINDS,
        (kind: createWindow.Kind): AutoMovieArchetype => createWindow({ kind }),
      ),
      ...kinds(
        "switch",
        createSwitch.KINDS,
        (kind: createSwitch.Kind): AutoMovieArchetype => createSwitch({ kind }),
      ),
      ...kinds(
        "control",
        createControl.KINDS,
        (kind: createControl.Kind): AutoMovieArchetype =>
          createControl({ kind }),
      ),
      hatch: createHatch(),
      beerTap: AutoMovieArchetypeBeerTap.create(),
    }),
    climbing: still({
      stairs: createStairs({ steps: 8 }),
      ramp: createRamp(),
      ...kinds(
        "ladder",
        createLadder.KINDS,
        (kind: createLadder.Kind): AutoMovieArchetype =>
          createLadder({ kind, rungs: 8 }),
      ),
      ...kinds(
        "bar",
        createBar.KINDS,
        (kind: createBar.Kind): AutoMovieArchetype => createBar({ kind }),
      ),
      ...kinds(
        "wall",
        createWall.KINDS,
        (kind: createWall.Kind): AutoMovieArchetype => createWall({ kind }),
      ),
    }),
    fixtures: still({
      ...kinds(
        "sanitary",
        createSanitary.KINDS,
        (kind: createSanitary.Kind): AutoMovieArchetype =>
          createSanitary({ kind }),
      ),
      ...kinds(
        "appliance",
        createAppliance.KINDS,
        (kind: createAppliance.Kind): AutoMovieArchetype =>
          createAppliance({ kind }),
      ),
    }),
    obstacles: still(
      kinds(
        "obstacle",
        createObstacle.KINDS,
        (kind: createObstacle.Kind): AutoMovieArchetype =>
          createObstacle({ kind }),
      ),
    ),
    street: still({
      ...kinds(
        "streetFixture",
        createStreetFixture.KINDS,
        (kind: createStreetFixture.Kind): AutoMovieArchetype =>
          createStreetFixture({ kind }),
      ),
      ...kinds(
        "bin",
        createBin.KINDS,
        (kind: createBin.Kind): AutoMovieArchetype => createBin({ kind }),
      ),
      ...kinds(
        "gate",
        createGate.KINDS,
        (kind: createGate.Kind): AutoMovieArchetype => createGate({ kind }),
      ),
      ...kinds(
        "machine",
        createMachine.KINDS,
        (kind: createMachine.Kind): AutoMovieArchetype =>
          createMachine({ kind }),
      ),
      valve: AutoMovieArchetypeValve.create(),
      elevator: createElevator(),
      ...kinds(
        "handhold",
        createHandhold.KINDS,
        (kind: createHandhold.Kind): AutoMovieArchetype =>
          createHandhold({ kind }),
      ),
      cellFront: createCellFront(createCellFront.REFERENCE),
      saloonDoor: createSaloonDoor(),
      ...kinds(
        "mirror",
        createMirror.KINDS,
        (kind: createMirror.Kind): AutoMovieArchetype => createMirror({ kind }),
      ),
      ...kinds(
        "board",
        createBoard.KINDS,
        (kind: createBoard.Kind): AutoMovieArchetype => createBoard({ kind }),
      ),
    }),
  };
}
