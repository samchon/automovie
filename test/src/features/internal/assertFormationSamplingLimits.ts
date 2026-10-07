import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFormationOverlapScenario } from "./IFormationOverlapScenario";
import { namedFacts } from "./predicates";

/** Existing tier, height, member-cap and cue-budget assertions; the original limits are unchanged. */
export const assertFormationSamplingLimits = (
  wide: IAutoMovieModel,
  flat: IAutoMovieModel,
  scenario: IFormationOverlapScenario,
): void => {
  const {
    post,
    row,
    tiered,
    file,
    judge,
    host,
    hostSlotX,
    filler,
    carry,
    codes,
  } = scenario;
  // 12. a unit a camera may draw at more than one tier is judged by the least.
  const narrow = post({ id: "narrow", radius: 0.1 });
  const tieredPair = [
    tiered({ id: "left", models: ["post", "narrow"] }),
    tiered({
      id: "right",
      models: ["post", "narrow"],
      anchor: { x: 0.3, y: 0, z: 0 },
    }),
  ];
  TestValidator.equals(
    "a unit drawn at several tiers is judged by the least clearance of any of them",
    namedFacts([
      // Two narrow posts fill 0.2 m, which 0.3 m clears; two wide ones fill
      // 0.8 m, which it does not.
      [
        "leastIsWhatCounts",
        () =>
          codes({ models: [wide, narrow], formations: tieredPair }).length ===
          0,
      ],
      [
        "theWidestAloneWouldRefuse",
        () =>
          codes({
            models: [wide, narrow],
            formations: [
              tiered({ id: "left", models: ["post"] }),
              tiered({
                id: "right",
                models: ["post"],
                anchor: { x: 0.3, y: 0, z: 0 },
              }),
            ],
          }).length === 1,
      ],
      // And inside the least, the same pair is refused: what the tiers bought is
      // the least and not an exemption.
      [
        "insideTheLeastIsStillRefused",
        () =>
          codes({
            models: [wide, narrow],
            formations: [
              tiered({ id: "left", models: ["post", "narrow"] }),
              tiered({
                id: "right",
                models: ["post", "narrow"],
                anchor: { x: 0.15, y: 0, z: 0 },
              }),
            ],
          }).length === 1,
      ],
    ]),
    {
      leastIsWhatCounts: true,
      theWidestAloneWouldRefuse: true,
      insideTheLeastIsStillRefused: true,
    },
  );

  // 13. one tier measuring and another not is no size at all.
  TestValidator.equals(
    "a unit that measures at one tier and not at another is not measured",
    namedFacts([
      [
        "mixedIsLeftAlone",
        () =>
          codes({
            models: [wide, flat],
            formations: [
              {
                ...row({ spacing: 0.1 }),
                lod: [{ model: "post" }, { model: "flat" }],
              },
            ],
          }).length === 0,
      ],
      [
        "theMeasurableTierAloneRefuses",
        () =>
          codes({
            models: [wide, flat],
            formations: [
              { ...row({ spacing: 0.1 }), lod: [{ model: "post" }] },
            ],
          }).length === 1,
      ],
    ]),
    { mixedIsLeftAlone: true, theMeasurableTierAloneRefuses: true },
  );

  // 14. a lift between two units narrows the clearance between them.
  const lifted = (height: number) => [
    row({ id: "lower", count: 1, spacing: 1 }),
    row({
      id: "upper",
      count: 1,
      spacing: 1,
      anchor: { x: 0.3, y: height, z: 0 },
    }),
  ];
  TestValidator.equals(
    "two units are judged by the height between them, not only by the plan",
    namedFacts([
      // A post two metres tall stands from -1 to 1 about its own origin, so a
      // metre and a half of lift still leaves half a metre of shared height.
      [
        "overlappingHeightsRefused",
        () => codes({ models: [wide], formations: lifted(1.5) }).length === 1,
      ],
      // Two metres of lift stands the upper column's floor exactly on the
      // lower's ceiling, which is passing above rather than standing inside.
      [
        "touchingHeightsAccepted",
        () => codes({ models: [wide], formations: lifted(2) }).length === 0,
      ],
      [
        "clearAbove",
        () => codes({ models: [wide], formations: lifted(3) }).length === 0,
      ],
      // And the plan distance is the same in all three, so what separated them
      // is the lift and nothing else.
      [
        "levelIsRefused",
        () => codes({ models: [wide], formations: lifted(0) }).length === 1,
      ],
    ]),
    {
      overlappingHeightsRefused: true,
      touchingHeightsAccepted: true,
      clearAbove: true,
      levelIsRefused: true,
    },
  );

  // 15. a pair one behind the other, across a cell boundary in depth.
  const ranked = judge({
    models: [wide],
    formations: [
      file({ count: 2, spacing: 0.3, anchor: { x: 0, y: 0, z: 0.7 } }),
    ],
  });
  TestValidator.equals(
    "two members one behind the other are found across a boundary in depth",
    namedFacts([
      ["one", () => ranked.length === 1],
      ["members", () => ranked[0]!.message.includes("its slots 0 and 1")],
      ["apart", () => ranked[0]!.message.includes("0.3m apart")],
      // The two stand at z = 0.7 and z = 1.0, which the gate's own cell width of
      // twice the widest column puts on either side of a boundary.
      ["place", () => ranked[0]!.message.includes("(0, 0.85)")],
    ]),
    { one: true, members: true, apart: true, place: true },
  );

  // 16. only the first measured members of an enormous unit are measured.
  const HOST_COUNT = 5_000;
  const MEASURED_SLOT = 100;
  const UNMEASURED_SLOT = 4_500;
  const sentry = (x: number): ReturnType<IFormationOverlapScenario["row"]> =>
    row({ id: "sentry", count: 1, spacing: 1, anchor: { x, y: 0, z: 0 } });
  TestValidator.equals(
    "a body standing on a member past the measured cap is not measured",
    namedFacts([
      [
        "withinTheCap",
        () =>
          codes({
            models: [wide],
            formations: [
              host(HOST_COUNT),
              sentry(hostSlotX(HOST_COUNT, MEASURED_SLOT)),
            ],
          }).length === 1,
      ],
      [
        "pastTheCap",
        () =>
          codes({
            models: [wide],
            formations: [
              host(HOST_COUNT),
              sentry(hostSlotX(HOST_COUNT, UNMEASURED_SLOT)),
            ],
          }).length === 0,
      ],
      // The unit itself is laid out at a metre, well clear of its members' own
      // width, so neither answer above is the crowd reporting on itself.
      [
        "theHostIsCleanOnItsOwn",
        () =>
          codes({ models: [wide], formations: [host(HOST_COUNT)] }).length ===
          0,
      ],
    ]),
    { withinTheCap: true, pastTheCap: true, theHostIsCleanOnItsOwn: true },
  );

  // 17. a shot whose ends already spend the budget is walked at its ends alone.
  const spent = filler(8);
  const meetingAtAnEnd = [
    row({ id: "still", count: 1, spacing: 1 }),
    row({ id: "walker", count: 1, spacing: 1, anchor: { x: -5, y: 0, z: 0 } }),
  ];
  TestValidator.equals(
    "a shot with no sampling budget left is walked at its cue ends alone",
    namedFacts([
      // The walker finishes its cue standing on the still unit, which is an end
      // and is therefore always sampled.
      [
        "anEndIsAlwaysRead",
        () =>
          codes({
            models: [wide],
            formations: meetingAtAnEnd,
            formationMotions: [
              carry({ formation: "walker", from: 0, to: 5 }),
              ...spent,
            ],
          }).length === 1,
      ],
      // The same crossing happening only between two ends is the resolution the
      // budget states, rather than a claim that nothing crossed.
      [
        "theInteriorIsTheStatedLimit",
        () =>
          codes({
            models: [wide],
            formations: meetingAtAnEnd,
            formationMotions: [
              carry({ formation: "walker", from: 0, to: 10 }),
              ...spent,
            ],
          }).length === 0,
      ],
      // With the budget unspent that same crossing is found, so the acceptance
      // above is the ends being all that was left and not the walk failing.
      [
        "withBudgetItIsFound",
        () =>
          codes({
            models: [wide],
            formations: meetingAtAnEnd,
            formationMotions: [carry({ formation: "walker", from: 0, to: 10 })],
          }).length === 1,
      ],
    ]),
    {
      anEndIsAlwaysRead: true,
      theInteriorIsTheStatedLimit: true,
      withBudgetItIsFound: true,
    },
  );
};
