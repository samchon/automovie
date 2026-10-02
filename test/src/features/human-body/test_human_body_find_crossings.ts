import { TestValidator } from "@nestia/e2e";

import { findBodyCrossings } from "../../../scripts/body-basis/findBodyCrossings";
import { listBodyHipStates } from "../../../scripts/body-basis/listBodyHipStates";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * The census instrument for a list of states and the hip-flexion review
 * population it is fed.
 *
 * The basis is the analytic box (see `humanBodyBasisFixture`) with the spine's
 * flexion range opened to 170 degrees, where the folded box crosses itself
 * between the hips and the spine segment and not before.
 *
 * Scenarios:
 * 1. A pose short of the fold reads no crossing and is no finding, a pose at
 *    the fold reads the hips against the spine and is a finding carrying its
 *    document and its pairs, and a pose past the range is refused by the
 *    builder and listed with its reason and no finding.
 * 2. The visitor sees every state once, with its pairs or its refusal.
 * 3. The hip population is the neutral body and each macro channel at each
 *    end of its envelope (a channel with no negative side has one end), plus
 *    the extra shapes, each flexed to each angle on the left, the right and
 *    both thighs, named `<shape>:<pose>`.
 */
export const test_human_body_find_crossings = (): void => {
  const { basis: box } = humanBodyBasisFixture();
  const basis = {
    ...box,
    joints: [
      box.joints[0],
      {
        ...box.joints[1],
        constraint: {
          flexion: { min: -30, max: 170 },
          abduction: { min: -10, max: 10 },
          twist: { min: -10, max: 10 },
        },
      },
    ],
  };
  const spine = (flexion: number) => ({
    name: `spine@${flexion}`,
    set: "test",
    group: "test",
    shape: {},
    pose: [
      { bone: "spine" as const, flexion, abduction: null, twist: null },
    ],
  });

  // 1 and 2. findings, refusals and the visitor
  const seen: [string, string][] = [];
  const { findings, refused } = findBodyCrossings(
    basis,
    [spine(30), spine(170), spine(200)],
    (state, found) =>
      seen.push([
        state.name,
        typeof found === "string" ? "refused" : String(found.length),
      ]),
  );
  TestValidator.equals("one finding", findings.map((f) => f.name), ["spine@170"]);
  TestValidator.equals("its pair", findings[0].pairs.map((p) => p.part + "x" + p.other), ["hipsxspine"]);
  TestValidator.predicate(
    "with triangles on both sides",
    findings[0].pairs[0].triangles > 0 && findings[0].pairs[0].otherTriangles > 0,
  );
  TestValidator.equals("and its document", findings[0].document, {
    shape: {},
    pose: [{ bone: "spine", flexion: 170, abduction: null, twist: null }],
  });
  TestValidator.equals("one refusal", refused.map((r) => r.name), ["spine@200"]);
  TestValidator.predicate("with a reason", refused[0].reason.length > 0);
  TestValidator.equals("the visitor saw every state once", seen, [
    ["spine@30", "0"],
    ["spine@170", "1"],
    ["spine@200", "refused"],
  ]);

  // 3. the hip population
  const states = listBodyHipStates(
    {
      ...basis,
      channels: [
        ...basis.channels,
        { ...basis.channels[1], id: "macroTwo", minimum: -1, maximum: 1 },
      ],
    },
    [90, 125],
    { "heavy@0.7": { tall: 0.7 } },
  );
  const names = states.map((state) => state.name);
  TestValidator.equals(
    "shapes: neutral, each macro end, the extra",
    [...new Set(names.map((name) => name.split(":")[0]))],
    ["neutral", "tall@1", "macroTwo@1", "macroTwo@-1", "heavy@0.7"],
  );
  TestValidator.equals("three poses per angle per shape", states.length, 5 * 2 * 3);
  TestValidator.equals(
    "the poses of one shape and angle",
    names.slice(0, 3),
    [
      "neutral:leftUpperLeg.flexion@90",
      "neutral:rightUpperLeg.flexion@90",
      "neutral:both:UpperLeg.flexion@90",
    ],
  );
  TestValidator.equals(
    "both thighs are two joints at the angle",
    states[2].pose.map((joint) => [joint.bone, joint.flexion]),
    [
      ["leftUpperLeg", 90],
      ["rightUpperLeg", 90],
    ],
  );
  TestValidator.equals("the extra shape is carried", states[states.length - 1].shape, { tall: 0.7 });
};
