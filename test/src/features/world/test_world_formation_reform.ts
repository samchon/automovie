import type { IAutoMovieSampledFormationMotion } from "./../../../../packages/engine/src/IAutoMovieSampledFormationMotion";
import {
  IAutoMovieFormationPlacement,
  formationSlotPosition,
  sampleFormationMotion,
} from "@automovie/engine";
import { IAutoMovieVector3,
  IAutoMovieFormationDesign,
  IAutoMovieFormationMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../internal/predicates";

const FILES: number = 4;
const RANKS: number = 3;
const COUNT: number = FILES * RANKS;

/** Three ranks of four, the arrangement the unit is designed in. */
const line: Extract<IAutoMovieFormationDesign["layout"], { kind: "line" }> = {
  kind: "line",
  ranks: RANKS,
  files: FILES,
  spacing: { lateral: 2, depth: 3 },
};

/**
 * The same twelve as four ranks of three, seated the other way round.
 *
 * A column fills its files before its ranks where a line fills its ranks before
 * its files, so no member keeps its place: this is a re-arrangement and not the
 * same arrangement at another spacing, which is what makes the midpoints below
 * readings of the blend rather than of a scale.
 */
const column: Extract<IAutoMovieFormationDesign["layout"], { kind: "column" }> = {
  kind: "column",
  ranks: FILES,
  files: RANKS,
  spacing: { lateral: 2, depth: 3 },
};

const unit: (facingDeg?: number) => IAutoMovieFormationPlacement = (facingDeg: number = 0): IAutoMovieFormationPlacement => ({
  id: "block",
  count: COUNT,
  layout: line,
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg,
  seed: 5,
});

/** One cue re-forming the unit across its whole window. */
const reform: (layout: IAutoMovieFormationDesign["layout"]) => IAutoMovieFormationMotion = (
  layout: IAutoMovieFormationDesign["layout"],
): IAutoMovieFormationMotion => {
  const still: { translation: { x: number; y: number; z: number; }; facingOffsetDeg: number; spacingScale: { lateral: number; depth: number; }; } = {
    translation: { x: 0, y: 0, z: 0 },
    facingOffsetDeg: 0,
    spacingScale: { lateral: 1, depth: 1 },
  };
  return {
    id: "close-ranks",
    formation: "block",
    action: "hold",
    start: 1,
    end: 3,
    from: still,
    to: still,
    easing: "linear",
    layout,
  };
};

/**
 * A crowd can change the arrangement it stands in, not only its spacing.
 *
 * Layout cues blend member positions rather than layout parameters. The first
 * starts at the design and later cues start at the previous completed layout;
 * target dressing participates in the same local point law.
 *
 * Scenarios:
 *
 * 1. Before the cue starts, the selected member stands where the design put it: a
 *    declared re-form does not reach backwards.
 * 2. Halfway through, the selected member stands at the midpoint of its two places, and
 *    the two places are different for the members checked, so a reader that
 *    returned either end lands somewhere the midpoint is not.
 * 3. At the end, every member stands exactly where the target arrangement puts it,
 *    and it stays there after the cue closes rather than snapping back.
 * 4. The blend happens in the unit's own frame: the same re-form under a turned
 *    unit puts each member at the turned image of the unturned midpoint. This
 *    consistency case does not distinguish equivalent fixed-heading blends.
 * 5. A target arrangement that declares its own dressing ends each member on its
 *    dressed place in that arrangement, not on the exact lattice and not with
 *    the designed layout's tolerance, so a finished re-form matches a unit
 *    designed in the target layout.
 * 6. A second layout cue starts from the previous completed arrangement, holds it in the gap and carries its new arrangement through a later layout-free cue.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples real formation cues and places actual slots through formationSlotPosition; asserts endpoint/retention, interpolation, heading consistency and target dressing, then rejects sequential cues that restart at the original design.
 * @evidence contracts/testing.md#independent-expectations Sequential slot 6 has line coordinates (1,3), column coordinates (0,6), and the final line at doubled lateral/one-metre depth has (2,1); the second midpoint must be (1,3.5). Existing endpoint consistency calls cover blending/dressing only and do not independently validate every layout formula or distinguish equivalent fixed-yaw world/local interpolation.
 * @evidence contracts/testing.md#distinguishing-cases Covers before/start/midpoint/end/after, every final slot, turned-unit consistency, dressed target, gap before second cue, second-cue start/midpoint/end and later layout-free retention. Ground-admission consequences belong to production reform-ground tests.
 * @evidence contracts/testing.md#execution-ownership The exported portable test_world_formation_reform owns synchronous numerical layout sampling/placement cases, with no Human assets, renderer, browser or dynamic case registration; visual crowd-motion quality is not asserted.
 */
export function test_world_formation_reform(): void {
  const cues: IAutoMovieFormationMotion[] = [reform(column)];
  const at: (time: number) => IAutoMovieSampledFormationMotion = (time: number) : IAutoMovieSampledFormationMotion => sampleFormationMotion(cues, "block", time);
  const placed: (formation: IAutoMovieFormationPlacement, slot: number, time: number) => IAutoMovieVector3 = (
    formation: IAutoMovieFormationPlacement,
    slot: number,
    time: number,
  ) : IAutoMovieVector3 => formationSlotPosition(formation, slot, at(time).reform);

  const straight: IAutoMovieFormationPlacement = unit();
  const designed: (slot: number) => IAutoMovieVector3 = (slot: number) : IAutoMovieVector3 => formationSlotPosition(straight, slot);
  const target: (slot: number) => IAutoMovieVector3 = (slot: number) : IAutoMovieVector3 =>
    formationSlotPosition({ ...straight, layout: column }, slot);

  // A member whose two places differ in both axes, so neither a lateral nor a
  // depth blend alone can produce the midpoint below.
  const SLOT: number = 6;
  const midpoint: { x: number; y: number; z: number; } = {
    x: (designed(SLOT).x + target(SLOT).x) / 2,
    y: (designed(SLOT).y + target(SLOT).y) / 2,
    z: (designed(SLOT).z + target(SLOT).z) / 2,
  };

  TestValidator.equals(
    "a unit re-forms from where it was designed to where its cue names",
    namedFacts([
      [
        "theTwoArrangementsPutItSomewhereElse",
        () : boolean =>
          nclose(designed(SLOT).x, target(SLOT).x) === false &&
          nclose(designed(SLOT).z, target(SLOT).z) === false,
      ],
      [
        "beforeTheCueItStandsWhereItWasDesigned",
        () : boolean => vclose(placed(straight, SLOT, 0.5), designed(SLOT)),
      ],
      [
        "halfwayItStandsAtTheMidpointOfItsTwoPlaces",
        () : boolean => vclose(placed(straight, SLOT, 2), midpoint),
      ],
      [
        "atTheEndItStandsWhereTheTargetPutsIt",
        () : boolean => vclose(placed(straight, SLOT, 3), target(SLOT)),
      ],
      // Held rather than released: a unit that re-formed has re-formed, and a
      // cue closing is not the unit walking back to its design.
      [
        "afterTheCueItStaysThere",
        () : boolean => vclose(placed(straight, SLOT, 9), target(SLOT)),
      ],
      // Every member, not the one read above: a blend that moved one member and
      // left the rest is not a re-form.
      [
        "everyMemberArrivesInTheTargetArrangement",
        () : boolean =>
          Array.from({ length: COUNT }, (_: unknown, slot: number) : number => slot).every((slot: number) : boolean =>
            vclose(placed(straight, slot, 3), target(slot)),
          ),
      ],
    ]),
    {
      theTwoArrangementsPutItSomewhereElse: true,
      beforeTheCueItStandsWhereItWasDesigned: true,
      halfwayItStandsAtTheMidpointOfItsTwoPlaces: true,
      atTheEndItStandsWhereTheTargetPutsIt: true,
      afterTheCueItStaysThere: true,
      everyMemberArrivesInTheTargetArrangement: true,
    },
  );

  // A quarter turn, read at the same instant. Stated as a consistency reading
  // and not as a discriminating one: rotation is linear, so blending two turned
  // places and turning one blended place agree here, and what this pins is that
  // the re-form does not quietly pick a different frame for a turned unit. The
  // reading that separates the two frames needs a cue that turns the unit as it
  // re-forms, which is applied a layer up in `placeFormationSlot`.
  const turned: IAutoMovieFormationPlacement = unit(90);
  const turnedMidpoint: { x: number; y: number; z: number; } = {
    x: midpoint.z,
    y: midpoint.y,
    z: -midpoint.x,
  };
  TestValidator.equals(
    "the re-form happens inside the unit, before its heading is applied",
    namedFacts([
      [
        "aTurnedUnitReFormsAboutItsOwnAxes",
        () : boolean => vclose(placed(turned, SLOT, 2), turnedMidpoint),
      ],
      [
        "andItsEndsAreTheTurnedArrangement",
        () : boolean =>
          vclose(
            placed(turned, SLOT, 3),
            formationSlotPosition({ ...turned, layout: column }, SLOT),
          ),
      ],
    ]),
    {
      aTurnedUnitReFormsAboutItsOwnAxes: true,
      andItsEndsAreTheTurnedArrangement: true,
    },
  );

  // The target column carries its own tolerance while the designed line has
  // none, so a member ending on the exact column lattice read the wrong
  // layout's dressing.
  const dressedColumn: IAutoMovieFormationDesign["layout"] = {
    ...column,
    dressing: { lateral: 0.4, depth: 0.6 },
  };
  const dressedCues: IAutoMovieFormationMotion[] = [reform(dressedColumn)];
  const dressedEnd: (slot: number) => IAutoMovieVector3 = (slot: number) : IAutoMovieVector3 =>
    formationSlotPosition(
      straight,
      slot,
      sampleFormationMotion(dressedCues, "block", 3).reform,
    );
  TestValidator.equals(
    "a re-form ends on the target arrangement's own dressing",
    namedFacts([
      [
        "everyMemberEndsOnItsDressedTargetPlace",
        () : boolean =>
          Array.from({ length: COUNT }, (_: unknown, slot: number) : number => slot).every((slot: number) : boolean =>
            vclose(
              dressedEnd(slot),
              formationSlotPosition(
                { ...straight, layout: dressedColumn },
                slot,
              ),
            ),
          ),
      ],
      [
        "theDressingMovesMembersOffTheExactTarget",
        () : boolean =>
          Array.from({ length: COUNT }, (_: unknown, slot: number) : number => slot).some(
            (slot: number) : boolean => vclose(dressedEnd(slot), target(slot)) === false,
          ),
      ],
    ]),
    {
      everyMemberEndsOnItsDressedTargetPlace: true,
      theDressingMovesMembersOffTheExactTarget: true,
    },
  );
  const finalLayout: IAutoMovieFormationDesign["layout"] = { ...line, spacing: { lateral: 4, depth: 1 } };
  const secondCue: IAutoMovieFormationMotion = { ...reform(finalLayout), id: "second", start: 4, end: 6 };
  const holdCue: IAutoMovieFormationMotion = { ...reform(column), id: "hold-after", start: 7, end: 8 };
  delete holdCue.layout;
  const sequential: IAutoMovieFormationMotion[] = [reform(column), secondCue, holdCue];
  const sequentialPosition: (time: number) => { x: number; y: number; z: number } = (time: number): { x: number; y: number; z: number } =>
    formationSlotPosition(straight, 6, sampleFormationMotion(sequential, "block", time).reform);
  for (const time of [3.5, 4]) TestValidator.predicate("gap and second-cue start hold the completed column", vclose(sequentialPosition(time), { x: 0, y: 0, z: 6 }, 1e-12));
  TestValidator.predicate("second cue interpolates from the completed layout", vclose(sequentialPosition(5), { x: 1, y: 0, z: 3.5 }, 1e-12));
  for (const time of [6, 7.5, 9]) TestValidator.predicate("second target survives completion and layout-free cues", vclose(sequentialPosition(time), { x: 2, y: 0, z: 1 }, 1e-12));
}
