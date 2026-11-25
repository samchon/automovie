import {
  Transform,
  compileFormationStageMarks,
  formationSlotPosition,
  placeFormationSlot,
  sampleFormationMotion,
  sampleFormationSlotMotion,
  validateAutoMovieFormationSlotMotions,
} from "@automovie/engine";
import type {
  IAutoMovieFormationDesign,
  IAutoMovieFormationSlotPlacement,
  IAutoMovieFormationStageMarkSet,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../../../internal/predicates";

const design: IAutoMovieFormationDesign = {
  id: "band",
  model: "performer",
  count: 4,
  layout: {
    kind: "line",
    ranks: 2,
    files: 2,
    spacing: { lateral: 2, depth: 3 },
  },
  anchor: { x: 10, y: 2, z: 20 },
  facingDeg: 90,
  seed: 7,
  capabilities: [],
  heroOverrides: [{ slot: 3, actor: "leader" }],
};

const first: IAutoMovieFormationStageMarkSet = {
  id: "open",
  start: 1,
  end: 3,
  marks: [{ slot: 0, lateral: -2, depth: 4, facingOffsetDeg: 45 }],
};

const second: IAutoMovieFormationStageMarkSet = {
  id: "close",
  start: 4,
  end: 6,
  easing: "easeIn",
  marks: [
    { slot: 0, lateral: -3, depth: 6 },
    { slot: 1, lateral: 1, depth: 3 },
  ],
};

/**
 * A quarter-turned ensemble holds the correct individual marks through multiple
 * sets. A mark is a point from the unit anchor, distinct from the displacement
 * the member channel stores.
 *
 * Scenarios:
 *
 * 1. A rotated unit travels between absolute marks, holds through a gap, and
 *    retains the last assigned facing when the next mark omits it.
 * 2. A late joiner, an unset slot and a separately rotated block keep their own
 *    rest placement.
 * 3. The resulting cues enter an ordinary shot. Invalid authored sets fail.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The actual compiler feeds the member sampler and placement and the ordinary sparse shot cue admission. Interval holds, earlier and later performers, retained facing and refusal cases exercise the public entry.
 * @evidence contracts/development/testing.md#independent-expectations With a 90 degree unit yaw, authored local depth adds to world X and negative local lateral adds to world Z. The 2 m centered file spacing puts slot zero at local X -1 initially. Linear half time and quadratic ease-in half time give one-half and one-quarter progress. A second 90 degree yaw sends the first blocked slot one metre along block depth before applying the block translation.
 * @evidence contracts/development/testing.md#distinguishing-cases A rotated translated unit, a turned and displaced block, an unset member, a late joiner and a gap catch identity swaps, missing inverse rest placement and endpoint resets. Error cases distinguish repeated ids or slots, a negative/nonfinite window, overlapping starts, a missing slot, a hero slot and malformed coordinates or heading.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable CPU-only feature spec samples numeric placements without a human body, renderer, browser or artist tooling.
 * @evidence contracts/development/common.md#meaningful-documentation States the staged unit and which data the reference positions use.
 */
export function test_engine_space_formation_stage_marks(): void {
  const motions = compileFormationStageMarks(design, [first, second]);
  const at = (
    slot: number,
    time: number,
    unitDesign: IAutoMovieFormationDesign = design,
    cues: typeof motions = motions,
  ): IAutoMovieFormationSlotPlacement =>
    placeFormationSlot({
      position: formationSlotPosition(unitDesign, slot),
      anchor: unitDesign.anchor,
      facingDeg: unitDesign.facingDeg,
      baseFacingDeg: unitDesign.facingDeg,
      unit: sampleFormationMotion([], unitDesign.id, time),
      member: sampleFormationSlotMotion(cues, unitDesign.id, slot, time),
    });

  const epsilon: number = 1e-12;
  const rest: IAutoMovieVector3 = { x: 10, y: 2, z: 21 };
  const opened: IAutoMovieVector3 = { x: 14, y: 2, z: 22 };
  const closed: IAutoMovieVector3 = { x: 16, y: 2, z: 23 };
  const final: IAutoMovieFormationSlotPlacement = at(0, 7);

  /** Compute the point at a specified fraction of a straight displacement. */
  const along = (
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    fraction: number,
  ): IAutoMovieVector3 => ({
    x: from.x + fraction * (to.x - from.x),
    y: from.y + fraction * (to.y - from.y),
    z: from.z + fraction * (to.z - from.z),
  });

  const travel: readonly [string, number, IAutoMovieVector3][] = [
    ["rest before first set", 0, rest],
    ["linear halfway", 2, along(rest, opened, 0.5)],
    ["first mark holds in gap", 3.5, opened],
    ["second set starts from first mark", 4, opened],
    ["eased second set", 5, along(opened, closed, 0.25)],
  ];
  for (const [label, seconds, expected] of travel)
    TestValidator.predicate(
      label,
      vclose(at(0, seconds).position, expected, epsilon),
    );
  TestValidator.predicate(
    "second mark and prior facing hold after finishing",
    vclose(final.position, closed, epsilon) &&
      nclose(final.facingDeg, 135, epsilon),
  );
  TestValidator.predicate(
    "second slot before assignment",
    vclose(at(1, 3).position, { x: 10, y: 2, z: 19 }, epsilon),
  );
  TestValidator.predicate(
    "second slot at exact endpoint",
    vclose(at(1, 6).position, { x: 13, y: 2, z: 19 }, epsilon),
  );
  TestValidator.predicate(
    "untouched rear slot",
    vclose(at(2, 7).position, { x: 13, y: 2, z: 21 }, epsilon),
  );

  const blocked: IAutoMovieFormationDesign = {
    ...design,
    blocks: [
      {
        layout: design.layout,
        count: design.count,
        offset: { lateral: 2, depth: 5 },
        facing: 90,
      },
    ],
  };
  const blockedMotion = compileFormationStageMarks(blocked, [
    { ...first, marks: [{ slot: 0, lateral: 3, depth: 8 }] },
  ]);
  TestValidator.predicate(
    "a turned block reaches its absolute mark from its own rest position",
    vclose(
      at(0, 0, blocked, blockedMotion).position,
      { x: 16, y: 2, z: 18 },
      epsilon,
    ) &&
      vclose(
        at(0, 2, blocked, blockedMotion).position,
        { x: 17, y: 2, z: 17.5 },
        epsilon,
      ) &&
      vclose(
        at(0, 3, blocked, blockedMotion).position,
        { x: 18, y: 2, z: 17 },
        epsilon,
      ),
  );

  TestValidator.equals(
    "ordinary shot cue admission",
    validateAutoMovieFormationSlotMotions(
      {
        id: "field",
        durationSeconds: 8,
        participants: [{ id: design.id, kind: "formation" }],
      },
      {
        formations: [
          {
            id: design.id,
            count: design.count,
            heroes: [
              { slot: 3, actor: "leader", transform: Transform.identity() },
            ],
          },
        ],
        formationSlotMotions: motions,
      },
    ),
    [],
  );

  const mark = first.marks[0]!;
  const refused: readonly IAutoMovieFormationStageMarkSet[][] = [
    [first, { ...second, id: first.id }],
    [{ ...first, start: -1 }],
    [{ ...first, end: Infinity }],
    [first, { ...second, start: 2 }],
    [{ ...first, marks: [] }],
    [{ ...first, marks: [mark, mark] }],
    [{ ...first, marks: [{ ...mark, slot: 4 }] }],
    [{ ...first, marks: [{ ...mark, slot: 3 }] }],
    [{ ...first, marks: [{ ...mark, depth: NaN }] }],
    [{ ...first, marks: [{ ...mark, facingOffsetDeg: Infinity }] }],
  ];
  for (const [index, sets] of refused.entries())
    TestValidator.predicate(
      `malformed stage marks ${index}`,
      throwsError(() => compileFormationStageMarks(design, sets)),
    );
}
