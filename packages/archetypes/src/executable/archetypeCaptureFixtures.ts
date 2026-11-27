import {
  createAppliance,
  AutoMovieArchetypeBar,
  createBin,
  AutoMovieArchetypeBoard,
  createCellFront,
  AutoMovieArchetypeControl,
  AutoMovieArchetypeDoor,
  AutoMovieArchetypeElevator,
  createGate,
  createHandhold,
  createHatch,
  createLadder,
  createMachine,
  createMirror,
  AutoMovieArchetypeObstacle,
  createRamp,
  createSaloonDoor,
  createSanitary,
  createStairs,
  AutoMovieArchetypeStreetFixture,
  createSwitch,
  createWall,
  createWindow,
  AutoMovieArchetypeBeerTap,
  AutoMovieArchetypeValve,
} from "../architecture";
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
  door: ReturnType<typeof AutoMovieArchetypeDoor.create>,
): Readonly<Record<string, archetypeCaptureCatalog.ISubject>> {
  const still: typeof archetypeCaptureSubject.still =
    archetypeCaptureSubject.still;
  const kinds: typeof archetypeCaptureSubject.kinds =
    archetypeCaptureSubject.kinds;
  return {
    doors: still({
      "door-lever-right": door,
      "door-knob-left": AutoMovieArchetypeDoor.create({ hinge: "left", hardware: "knob" }),
      "door-plate-right": AutoMovieArchetypeDoor.create({ hardware: "plate" }),
      "door-sliding-left": AutoMovieArchetypeDoor.create({ kind: "sliding", hinge: "left" }),
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
        AutoMovieArchetypeControl.KINDS,
        (kind: AutoMovieArchetypeControl.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeControl.create({ kind }),
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
        AutoMovieArchetypeBar.KINDS,
        (kind: AutoMovieArchetypeBar.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeBar.create({ kind }),
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
        AutoMovieArchetypeObstacle.KINDS,
        (kind: AutoMovieArchetypeObstacle.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeObstacle.create({ kind }),
      ),
    ),
    street: still({
      ...kinds(
        "streetFixture",
        AutoMovieArchetypeStreetFixture.KINDS,
        (kind: AutoMovieArchetypeStreetFixture.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeStreetFixture.create({ kind }),
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
      elevator: AutoMovieArchetypeElevator.create(),
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
        AutoMovieArchetypeBoard.KINDS,
        (kind: AutoMovieArchetypeBoard.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeBoard.create({ kind }),
      ),
    }),
  };
}
