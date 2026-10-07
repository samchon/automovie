import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { assertFormationModelColumns } from "../internal/assertFormationModelColumns";
import { assertFormationSamplingLimits } from "../internal/assertFormationSamplingLimits";
import { namedFacts } from "../internal/predicates";

const scenario = createFormationOverlapScenario();
const { post, row, carry, close, remove, judge, codes, sampledTime } = scenario;

/**
 * A shot may not stand one member of a crowd inside another.
 *
 * Two bodies cannot occupy one place, which is as true of dancers and animals
 * as of vehicles and machines. Nothing in the pipeline checked it: a unit could
 * be laid out at a tenth of its members' own width, a cue could pull one to a
 * fifth of its intervals, and two units could be staged on the same ground, and
 * every one of those compiled clean.
 *
 * A member's size is not asked of the author. It is read from the runtime the
 * builder already built, as the largest disc that fits inside one of its parts
 * on the axis the member stands on, so the measure follows the geometry instead
 * of sitting beside it going stale. Inscribed and never circumscribed, because
 * a refusal has to mean two bodies really share a place: everything the reading
 * leaves out costs an overlap it does not find and can never make it invent
 * one.
 *
 * Scenarios:
 *
 * 1. Members standing further apart than their bodies reach are accepted, so the
 *    gate leaves alone the ordinary case it exists beside.
 * 2. Members standing closer are refused once, naming the shot, the unit, which
 *    two members, how far apart they stand, where, and the width they were
 *    measured against — all read from the one answer rather than asked twice.
 *    Four members overlap in three pairs and the unit is reported once, because
 *    an author correcting an interval corrects all of them.
 * 3. Members exactly their own width apart are accepted, because touching is not
 *    standing inside, and a strict reading would refuse a crowd dressed to its
 *    own measure.
 * 4. Two units each standing perfectly well are refused when they stand in each
 *    other, which is exactly what a gate looping one unit at a time cannot see.
 *    The refusal names both units and the member of each.
 * 5. Two units clear at both ends of a cue and passing through one another in
 *    between are refused at a time inside the cue's own ends, which reading
 *    only the ends cannot see.
 * 6. A cue closing a unit's intervals below its members' own width is refused, and
 *    one that keeps them above it is accepted: what a unit is laid out at is
 *    not the only arrangement it ever holds.
 * 7. A member the shot has taken out is not measured, because nothing can stand
 *    inside a body that is not there.
 * 8. Two units in one place at different heights are accepted, because bodies that
 *    never meet in height never share a place: the reading is a column and not
 *    a footprint.
 * 9. A unit whose runtime this shot does not carry, whose tier list is empty, or
 *    whose geometry fills no column at all is not measured rather than measured
 *    against a stand-in, and a shot with no measurable unit answers nothing.
 * 10. Every primitive states the disc inside it: a sphere its radius, a capsule and
 *     a cylinder theirs over their shaft, a cone half its base over its wider
 *     half, a box its narrower side over its height. A plane has no thickness
 *     and a mesh states no dimensions, so neither holds a column, and nor does
 *     a shape whose dimensions are not real.
 * 11. A part is measured where its bone rests, added up the chain however the bones
 *     are ordered, and left out when the chain leaves the axis, when the part's
 *     own transform does, or when it turns about anything but the vertical, and
 *     equally when the BONE it rides is turned out of the vertical. A part's
 *     scale is applied rather than refused, and one that scales a column away
 *     leaves nothing to measure.
 * 12. A unit a camera may draw at more than one tier is judged by the LEAST of
 *     them, because which tier it draws is the camera's decision and a refusal
 *     has to hold whichever one it makes. The same pair measured against the
 *     widest tier alone is refused, which is what makes the acceptance a
 *     reading of the least and not of nothing.
 * 13. A unit measuring at one tier and not at another is not measured at all: half
 *     a size is not a size, and a gate that filled the gap with the tier it
 *     does have would be refusing against a stand-in.
 * 14. Two units standing at different heights are judged by the difference between
 *     them: a lift that still leaves their columns meeting is refused, and one
 *     that carries the upper clear of the lower is accepted, at the same
 *     distance apart in plan.
 * 15. Two members are found across a cell boundary in DEPTH as well as across one
 *     in width, because a crowd has ranks and the pair inside one another may
 *     be one behind the other rather than side by side.
 * 16. Only the first measured members of an enormous unit are measured: a body
 *     standing on one of them is refused, and the same body standing on a
 *     member past the cap is not. That is the trade the cap makes, stated
 *     rather than hidden.
 * 17. A shot whose cue ends already exceed the sampling budget is walked at its
 *     ends alone: an overlap standing at one of them is still refused, and one
 *     that happens only between two of them is the resolution this budget
 *     states.
 */
export const test_production_formation_overlap = (): void => {
  const wide = post({ id: "post", radius: 0.4 });

  TestValidator.equals(
    "members standing further apart than their bodies reach are accepted",
    codes({ models: [wide], formations: [row({ spacing: 1 })] }),
    [],
  );

  const packed = judge({
    models: [wide],
    formations: [row({ spacing: 0.5 })],
  });
  TestValidator.equals(
    "members standing inside one another are refused, and the refusal says which, where and against what",
    namedFacts([
      ["code", () => packed[0]?.code === "engine-validation-failed"],
      ["one", () => packed.length === 1],
      ["target", () => packed[0]!.target === "shot:opening"],
      ["category", () => packed[0]!.category === "error"],
      ["unit", () => packed[0]!.message.startsWith("formation:crowd ")],
      ["members", () => packed[0]!.message.includes("its slots 0 and 1")],
      // The row of four sits at -0.75, -0.25, 0.25 and 0.75, so the first two
      // stand half a metre apart with their midpoint at -0.5.
      ["apart", () => packed[0]!.message.includes("0.5m apart")],
      ["place", () => packed[0]!.message.includes("(-0.5, 0)")],
      // Two posts of 0.4 fill 0.8 m between their axes, which is the number an
      // author has to open the interval past.
      ["width", () => packed[0]!.message.includes("0.8m their bodies fill")],
    ]),
    {
      code: true,
      one: true,
      target: true,
      category: true,
      unit: true,
      members: true,
      apart: true,
      place: true,
      width: true,
    },
  );

  TestValidator.equals(
    "members exactly their own width apart are standing beside one another",
    codes({ models: [wide], formations: [row({ spacing: 0.8 })] }),
    [],
  );

  const crossed = judge({
    models: [wide],
    formations: [
      row({ id: "left", count: 1, spacing: 1 }),
      row({
        id: "right",
        count: 1,
        spacing: 1,
        anchor: { x: 0.3, y: 0, z: 0 },
      }),
    ],
  });
  TestValidator.equals(
    "two units each standing well but standing in each other are refused",
    namedFacts([
      ["one", () => crossed.length === 1],
      ["unit", () => crossed[0]!.message.startsWith("formation:left ")],
      [
        "other",
        () => crossed[0]!.message.includes(`its slot 0 and slot 0 of "right"`),
      ],
      ["apart", () => crossed[0]!.message.includes("0.3m apart")],
      ["place", () => crossed[0]!.message.includes("(0.15, 0)")],
    ]),
    { one: true, unit: true, other: true, apart: true, place: true },
  );

  // One unit stands at the origin; the other is staged five metres out and
  // carried ten metres across it. Both ends of that cue are clear, the place it
  // waits before the cue begins is clear, and the middle is not.
  const passed = judge({
    models: [wide],
    formations: [
      row({ id: "still", count: 1, spacing: 1 }),
      row({
        id: "walker",
        count: 1,
        spacing: 1,
        anchor: { x: -5, y: 0, z: 0 },
      }),
    ],
    formationMotions: [carry({ formation: "walker", from: 0, to: 10 })],
  });
  const passedAt = Number(sampledTime(passed));
  TestValidator.equals(
    "two units passing through one another are refused inside the cue that carries them",
    namedFacts([
      ["code", () => passed[0]?.code === "engine-validation-failed"],
      ["one", () => passed.length === 1],
      ["afterStart", () => passedAt > 1],
      ["beforeEnd", () => passedAt < 3],
    ]),
    { code: true, one: true, afterStart: true, beforeEnd: true },
  );

  TestValidator.equals(
    "a cue that closes a unit's own intervals is judged by what it closes them to",
    namedFacts([
      [
        "closedIsRefused",
        () =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "crowd", scale: 0.2 })],
          }).length === 1,
      ],
      [
        "heldIsAccepted",
        () =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "crowd", scale: 0.9 })],
          }).length === 0,
      ],
      [
        "anotherUnitsCueDoesNotClose",
        () =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "elsewhere", scale: 0.2 })],
          }).length === 0,
      ],
    ]),
    {
      closedIsRefused: true,
      heldIsAccepted: true,
      anotherUnitsCueDoesNotClose: true,
    },
  );

  TestValidator.equals(
    "a member the shot has taken out is not measured",
    codes({
      models: [wide],
      formations: [row({ count: 2, spacing: 0.5 })],
      formationSlotMotions: [remove({ formation: "crowd", slots: [1] })],
    }),
    [],
  );

  TestValidator.equals(
    "units in one place at heights that never meet are accepted",
    codes({
      models: [wide, post({ id: "upper", radius: 0.4, lift: 5 })],
      formations: [
        row({ id: "ground", count: 1, spacing: 1 }),
        row({ id: "sky", count: 1, spacing: 1, model: "upper" }),
      ],
    }),
    [],
  );

  const flat: IAutoMovieModel = {
    ...wide,
    id: "flat",
    parts: [
      {
        id: "sheet",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "plane", width: 4, depth: 4 },
        },
        material: null,
        attachedBone: null,
        transform: null,
      },
    ],
  };
  TestValidator.equals(
    "a unit this shot cannot measure is left alone rather than measured against a guess",
    namedFacts([
      [
        "missingRuntime",
        () =>
          codes({
            models: [],
            formations: [row({ spacing: 0.1 })],
          }).length === 0,
      ],
      [
        "noTierAtAll",
        () =>
          codes({
            models: [wide],
            formations: [{ ...row({ spacing: 0.1 }), lod: [] }],
          }).length === 0,
      ],
      [
        "noColumnAtAll",
        () =>
          codes({
            models: [flat],
            formations: [row({ spacing: 0.1, model: "flat" })],
          }).length === 0,
      ],
      [
        "oneMeasurableUnitStillAnswers",
        () =>
          codes({
            models: [wide, flat],
            formations: [
              row({ id: "paper", spacing: 0.1, model: "flat" }),
              row({ id: "crowd", spacing: 0.1 }),
            ],
          }).length === 1,
      ],
    ]),
    {
      missingRuntime: true,
      noTierAtAll: true,
      noColumnAtAll: true,
      oneMeasurableUnitStillAnswers: true,
    },
  );

  assertFormationModelColumns(wide, scenario);

  assertFormationSamplingLimits(wide, flat, scenario);
};
