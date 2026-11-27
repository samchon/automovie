import { AutoMovieArchetypeBar, AutoMovieArchetypeBoard, AutoMovieArchetypeControl, AutoMovieArchetypeDoor, AutoMovieArchetypeElevator, AutoMovieArchetypeObstacle, AutoMovieArchetypeStreetFixture, AutoMovieArchetypeBeerTap, AutoMovieArchetypeValve, AutoMovieArchetypeBin, AutoMovieArchetypeCellFront, AutoMovieArchetypeGate, AutoMovieArchetypeHandhold, AutoMovieArchetypeHatch, AutoMovieArchetypeLadder, AutoMovieArchetypeMirror, AutoMovieArchetypeRamp, AutoMovieArchetypeSaloonDoor, AutoMovieArchetypeStairs, AutoMovieArchetypeSwitch, AutoMovieArchetypeWall, AutoMovieArchetypeWindow, AutoMovieArchetypeAppliance, AutoMovieArchetypeMachine, AutoMovieArchetypeSanitary } from "../../architecture";
import type { AutoMovieArchetype } from "../../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";
/*
 * The capture catalog's building subjects: doors and the windows, switches and
 * controls beside them, the climbing aids, the fixtures, the obstacles and the
 * street, each every kind of its producers at the middle of their bands.
 * Parameter door: The lever door at rest, which the catalog also shows open.
 * Returns: The subjects by name, in the catalog's order.
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
        AutoMovieArchetypeWindow.KINDS,
        (kind: AutoMovieArchetypeWindow.Kind): AutoMovieArchetype => AutoMovieArchetypeWindow.create({ kind }),
      ),
      ...kinds(
        "switch",
        AutoMovieArchetypeSwitch.KINDS,
        (kind: AutoMovieArchetypeSwitch.Kind): AutoMovieArchetype => AutoMovieArchetypeSwitch.create({ kind }),
      ),
      ...kinds(
        "control",
        AutoMovieArchetypeControl.KINDS,
        (kind: AutoMovieArchetypeControl.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeControl.create({ kind }),
      ),
      hatch: AutoMovieArchetypeHatch.create(),
      beerTap: AutoMovieArchetypeBeerTap.create(),
    }),
    climbing: still({
      stairs: AutoMovieArchetypeStairs.create({ steps: 8 }),
      ramp: AutoMovieArchetypeRamp.create(),
      ...kinds(
        "ladder",
        AutoMovieArchetypeLadder.KINDS,
        (kind: AutoMovieArchetypeLadder.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeLadder.create({ kind, rungs: 8 }),
      ),
      ...kinds(
        "bar",
        AutoMovieArchetypeBar.KINDS,
        (kind: AutoMovieArchetypeBar.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeBar.create({ kind }),
      ),
      ...kinds(
        "wall",
        AutoMovieArchetypeWall.KINDS,
        (kind: AutoMovieArchetypeWall.Kind): AutoMovieArchetype => AutoMovieArchetypeWall.create({ kind }),
      ),
    }),
    fixtures: still({
      ...kinds(
        "sanitary",
        AutoMovieArchetypeSanitary.KINDS,
        (kind: AutoMovieArchetypeSanitary.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeSanitary.create({ kind }),
      ),
      ...kinds(
        "appliance",
        AutoMovieArchetypeAppliance.KINDS,
        (kind: AutoMovieArchetypeAppliance.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeAppliance.create({ kind }),
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
        AutoMovieArchetypeBin.KINDS,
        (kind: AutoMovieArchetypeBin.Kind): AutoMovieArchetype => AutoMovieArchetypeBin.create({ kind }),
      ),
      ...kinds(
        "gate",
        AutoMovieArchetypeGate.KINDS,
        (kind: AutoMovieArchetypeGate.Kind): AutoMovieArchetype => AutoMovieArchetypeGate.create({ kind }),
      ),
      ...kinds(
        "machine",
        AutoMovieArchetypeMachine.KINDS,
        (kind: AutoMovieArchetypeMachine.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeMachine.create({ kind }),
      ),
      valve: AutoMovieArchetypeValve.create(),
      elevator: AutoMovieArchetypeElevator.create(),
      ...kinds(
        "handhold",
        AutoMovieArchetypeHandhold.KINDS,
        (kind: AutoMovieArchetypeHandhold.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeHandhold.create({ kind }),
      ),
      cellFront: AutoMovieArchetypeCellFront.create(AutoMovieArchetypeCellFront.REFERENCE),
      saloonDoor: AutoMovieArchetypeSaloonDoor.create(),
      ...kinds(
        "mirror",
        AutoMovieArchetypeMirror.KINDS,
        (kind: AutoMovieArchetypeMirror.Kind): AutoMovieArchetype => AutoMovieArchetypeMirror.create({ kind }),
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
