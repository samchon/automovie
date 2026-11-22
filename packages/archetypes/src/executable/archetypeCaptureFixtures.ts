import {
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
  createValve,
  createWall,
  createWindow,
} from "../architecture";
import type { AutoMovieArchetype } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * The capture catalog's building subjects: doors and the windows, switches and controls beside them, the climbing aids, the fixtures, the obstacles and the street, each every kind of its producers at the middle of their bands.
 *
 * @param door The lever door at rest, which the catalog also shows open.
 * @returns The subjects by name, in the catalog's order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which subjects it builds and what the door is for.
 * @evidence contracts/development/implementation.md#principled-implementation Every producer and kind through its own public call at the middle of its bands, as `archetypeCaptureCatalog` builds its other subjects.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal of subjects over the shared helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No archetype is built here by hand; an inspection list, never a registry a production reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a few dozen small models once per page load.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once by the catalog.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds plain data only.
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
      beerTap: createBeerTap(),
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
      valve: createValve(),
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
