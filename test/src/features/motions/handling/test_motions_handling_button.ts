import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanButton,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { strict as assert } from "node:assert";

import { button } from "../../../../../packages/motions/src/handling/internal/button";
import { poseBones } from "../../../../../packages/motions/src/posture/internal/poseBones";
import { resolveHumanPosture } from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { testAffordance } from "../../internal/fixtures/testAffordance";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A button plan admits finite signed travel through the opening and requires
 * finite positive dimensions and duration. Each invalid field is named before
 * the plan reads its garment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both signed stroke directions, the bounded opening and trailing contact, and the own-field refusal for invalid motion numbers.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the owning action planner with a posed slider and bracing rim in both directions, resolves the displayed fingertips and submits each invalid field with a garment reader that would fail on any access.
 * @evidence contracts/development/testing.md#independent-expectations The slider starts at zero, reaches half the requested signed travel at stroke midpoint and ends at the requested travel. The fixed rim and trailing point one radius from the panel center establish the midstroke targets, which the displayed tips must reach within the button radius. Each refusal must retain the supplied field and exact value, including NaN and signed zero.
 */
export async function test_motions_handling_button(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const motion: IAutoMovieMotionHumanButton = {
    garment: "garment",
    opening: "opening",
    rim: "rim",
    button: "center",
    contact: "push",
    travel: 0.05,
    radius: 0.01,
    thickness: 0.004,
    duration: 0.45,
  };
  const context = motionActionContext(body, motion);
  const tempo = 2; // Keep the staged reach within the arm planner's pace.
  for (const direction of [1, -1] as const) {
    const prop = garment(direction);
    const travel = direction * motion.travel;
    const plan = button.plan(
      motionActionContext(
        body,
        { ...motion, travel },
        {
          props: [prop],
          tempo,
          at: { x: 0, y: 0, z: direction === 1 ? 0 : 0.9 },
          yaw: direction === 1 ? 0 : 180,
        },
      ),
    );
    assert.deepEqual(plan.hands, ["right", "left"]);
    assert.equal(plan.drives?.length, 1);
    const drive = plan.drives![0]!;
    const start = drive.from * plan.duration;
    const end = drive.to * plan.duration;
    assert.equal(drive.prop, motion.garment);
    assert.equal(drive.articulation, "slider");
    assert(nclose(end - start, tempo * motion.duration, 1e-12));
    assert(nclose(drive.travel(start), 0, 1e-12));
    const middle = (start + end) / 2;
    assert(nclose(drive.travel(middle), travel / 2, 1e-12));
    assert(nclose(drive.travel(end), travel, 1e-12));
    assert(
      plan.contacts.some(
        (contact) =>
          contact.kind === "bear" &&
          contact.part === "leftHand" &&
          contact.region === "indexTipLeft" &&
          contact.support.kind === "prop" &&
          contact.support.subject === motion.garment &&
          contact.from === drive.from &&
          contact.to === drive.to,
      ),
      "the index retains its rim brace through the slider stroke",
    );
    const played = poseBones(
      body,
      resolveHumanPosture(body, plan.posture(middle)),
    );
    for (const [region, target] of [
      ["thumbTipRight", { x: 0, y: 0.98, z: 0.45 - direction * 0.01 }],
      ["indexTipLeft", { x: direction * 0.06, y: 0.98, z: 0.45 }],
    ] as const) {
      const site = body.surfaces.regions[region];
      const point =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(
          site,
          played.get(site.bone)!,
        ).point;
      assert(
        vclose(point, target, motion.radius),
        `${region} should meet its physical stroke target at ${JSON.stringify(target)}, read ${JSON.stringify(point)}`,
      );
    }
  }

  const invalid = [
    0,
    -0,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];
  for (const field of ["travel", "radius", "thickness", "duration"] as const)
    for (const value of field === "travel" ? invalid : [...invalid, -1])
      assert.throws(
        () =>
          button.plan({
            ...context,
            params: { ...motion, [field]: value },
            prop: () => {
              throw new Error("A parameter refusal must precede garment reads");
            },
          }),
        (error: unknown): boolean =>
          error instanceof AutoMovieMotionHumanRefusal &&
          error.kind === "parameter" &&
          error.axis === field &&
          Object.is(error.value, value) &&
          error.reason.includes("finite") &&
          error.fix.includes(field),
        `${field} should refuse ${Object.is(value, -0) ? "-0" : value}`,
      );
}

/** One straight slider crossing the panel in the requested direction. */
function garment(direction: 1 | -1): IAutoMovieMotionHumanProp {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const center: IAutoMovieVector3 = { x: 0, y: 0.03, z: -direction * 0.025 };
  const push = testAffordance(
    "push",
    "surface",
    { ...center, z: center.z - direction * 0.01 },
    { x: -direction * Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    { rides: "slider" },
  );
  const moving = [
    testAffordance("center", "socket", center, undefined, { rides: "slider" }),
    push,
  ];
  const fixed = [
    testAffordance("opening", "aperture", origin, undefined, {
      width: 0.08,
      height: 0.06,
    }),
    testAffordance("rim", "surface", { x: direction * 0.06, y: 0.03, z: 0 }),
    testAffordance("slider", "slider", origin, undefined, {
      travel: 0.06,
      reverse: 0.06,
      parts: ["button"],
    }),
  ];
  return {
    subject: "garment",
    fixed: true,
    frame: {
      position: { x: 0, y: 0.95, z: 0.45 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances: [...fixed, ...moving],
    articulate(state): IAutoMovieMotionHumanProp.IPosed {
      return {
        affordances: [
          ...fixed,
          ...moving.map(
            (site): IAutoMovieAffordance => ({
              ...site,
              frame: {
                ...site.frame,
                translation: {
                  ...site.frame.translation,
                  z: site.frame.translation.z + (state.slider ?? 0),
                },
              },
            }),
          ),
        ],
      };
    },
  };
}
