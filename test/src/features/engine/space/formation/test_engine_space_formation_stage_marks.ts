import { AutoMovieEngineTransform, AutoMovieEnginePopulationFormation, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieFormationDesign,
  IAutoMovieFormationSlotMotion,
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
 * 3. Compiled cues and raw shared-slot cues enter an ordinary shot. Invalid
 *    slots fail through both compilation and raw cue admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes anchor-relative marks from slot displacement. Held marks, late assignments, block orientation and raw and compiled shot admission have separate cases.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles typed mark sets and places the resulting slots through the public formation pipeline. It checks compiled and independently authored cue admission, the actual reading of a valid shared cue, and located refusal of sparse or otherwise invalid raw slot lists. The compiler refusals include conflicting sets, promoted or malformed slots and non-finite coordinates.
 * @evidence contracts/development/testing.md#independent-expectations At 90-degree yaw the first mark lies at (14, 2, 22), the second at (16, 2, 23). Halfway time advances by one-half with linear easing and one-quarter with ease-in. A retained 45-degree offset gives facing 135 degrees. The raw group names only slots 0 and 2, and only those two read the destination. A unique safe integer below count is required for each slot.
 */
export function test_engine_space_formation_stage_marks(): void {
  const motions = AutoMovieEnginePopulationFormation.compileFormationStageMarks(design, [first, second]);
  const at = (
    slot: number,
    time: number,
    unitDesign: IAutoMovieFormationDesign = design,
    cues: typeof motions = motions,
  ): IAutoMovieFormationSlotPlacement =>
    AutoMovieEnginePopulationFormation.placeFormationSlot({
      position: AutoMovieEnginePopulationFormation.formationSlotPosition(unitDesign, slot),
      anchor: unitDesign.anchor,
      facingDeg: unitDesign.facingDeg,
      baseFacingDeg: unitDesign.facingDeg,
      unit: AutoMovieEnginePopulationFormation.sampleFormationMotion([], unitDesign.id, time),
      member: AutoMovieEnginePopulationFormation.sampleFormationSlotMotion(cues, unitDesign.id, slot, time),
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
  const blockedMotion = AutoMovieEnginePopulationFormation.compileFormationStageMarks(blocked, [
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

  const admit = AutoMovieEngineValidation.validateAutoMovieFormationSlotMotions;
  const shot: Parameters<typeof admit>[0] = {
    id: "field",
    durationSeconds: 8,
    participants: [{ id: design.id, kind: "formation" }],
  };
  const formations: Parameters<typeof admit>[1]["formations"] = [
    {
      id: design.id,
      count: design.count,
      heroes: [
        {
          slot: 3,
          actor: "leader",
          transform: AutoMovieEngineTransform.identity(),
        },
      ],
    },
  ];
  TestValidator.equals(
    "ordinary shot cue admission",
    admit(shot, { formations, formationSlotMotions: motions }),
    [],
  );
  const raw: IAutoMovieFormationSlotMotion = {
    ...motions[0]!,
    id: "group",
    slots: [0, 2],
  };
  TestValidator.equals(
    "a raw cue can name two unique anonymous slots",
    admit(shot, { formations, formationSlotMotions: [raw] }),
    [],
  );
  const read = (slot: number) =>
    AutoMovieEnginePopulationFormation.sampleFormationSlotMotion(
      [raw],
      design.id,
      slot,
      raw.end,
    );
  TestValidator.predicate(
    "the two named slots alone hold the authored destination",
    read(0) === raw.to &&
      read(2) === raw.to &&
      vclose(read(1).offset, { x: 0, y: 0, z: 0 }, 0),
  );
  const sparse: number[] = [0];
  sparse[2] = 2;
  for (const slots of [
    [0.5],
    [NaN],
    [Infinity],
    [-1],
    [design.count],
    [0, 0],
    [],
    new Array<number>(1),
    sparse,
  ]) {
    const diagnostics = admit(shot, {
      formations,
      formationSlotMotions: [{ ...raw, slots }],
    });
    TestValidator.predicate(
      `raw cue slot refusal: ${slots.join(", ")}`,
      diagnostics.length === 1 &&
        diagnostics[0]!.category === "error" &&
        diagnostics[0]!.target === "shot:field" &&
        diagnostics[0]!.message.includes(
          `formationSlotMotion:group.slots must name at least one unique safe integer slot inside 0..${design.count - 1}`,
        ),
    );
  }

  const mark = first.marks[0]!;
  for (const slot of [0.5, NaN]) {
    let refused: boolean = false;
    try {
      AutoMovieEnginePopulationFormation.compileFormationStageMarks(design, [
        { ...first, marks: [{ ...mark, slot }] },
      ]);
    } catch (error) {
      refused =
        error instanceof RangeError && error.message.includes("safe integer");
    }
    TestValidator.predicate(`malformed mark slot ${slot}`, refused);
  }
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
      throwsError(() => AutoMovieEnginePopulationFormation.compileFormationStageMarks(design, sets)),
    );
}
