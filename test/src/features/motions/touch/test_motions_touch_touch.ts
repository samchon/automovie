import { AutoMovieEngineRandom } from "@automovie/engine";

import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  touchEffectors
} from "../../../../../packages/motions/src/touch/internal/touchEffectors";
import {
  touchFaces
} from "../../../../../packages/motions/src/touch/internal/touchFaces";
import {
  touchLayouts
} from "../../../../../packages/motions/src/touch/internal/touchLayouts";
import {
  touchSide
} from "../../../../../packages/motions/src/touch/internal/touchSide";
import {
  touchSite
} from "../../../../../packages/motions/src/touch/internal/touchSite";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { resolvedBones } from "../../internal/resolvedBones";
import { vclose } from "../../internal/vclose";

/** Rounding of a few sums and midpoints, metres. */
const ROUNDING: number = 1e-12;

/** A touch's layout reader (`touchHold.Lay`). */
type Lay = Parameters<typeof touchLayouts>[1];

/**
 * Check hand selection, two-hand facing and surface layout for touch.
 *
 * Scenarios:
 *
 * 1. Respect an explicit hand and select the free hand for own forearm
 *    contacts. Face a two-hand midpoint beyond the shoulder span in the
 *    relevant heading.
 * 2. Apply the authored surface offset, cap movement toward a shoulder, bound
 *    the draw and reject a negative reach allowance. Preserve the point on a
 *    prop's fixed contact.
 * 3. Prepare declared hand-target pairs in order. Repeat them without another
 *    layout read and return fresh objects. Resolve an undeclared pair on
 *    demand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the choice axes, frame and layout reuse boundary.
 * @evidence contracts/development/testing.md#behavioral-verification The hand, facing, surface and preparation functions receive small typed fixtures and their own asserts.
 * @evidence contracts/development/testing.md#independent-expectations The shoulder midpoint and local offset geometry determine the expected coordinates. Callback observations distinguish eager, reused and new reads.
 */
export async function test_motions_touch_touch(): Promise<void> {
  // 1. Hand choice.
  // Reads the body's surfaces and arm regions through the context of the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const side = (params: IAutoMovieMotionHumanTouch.IParams) =>
    touchSide(
      motionActionContext<IAutoMovieMotionHumanTouch.IParams>(body, params),
      touchEffectors.TABLE.fingertips,
    );
  TestValidator.equals(
    "the chosen hands",
    [
      side({ target: { kind: "self", region: "forearmLeft" }, hand: "left" }),
      side({ target: { kind: "self", region: "forearmLeft" } }),
      side({ target: { kind: "self", region: "forearmRight" } }),
      side({
        target: { kind: "self", region: "sternum" },
        other: { kind: "self", region: "forearmLeft" },
      }),
    ],
    ["left", "right", "left", "left"],
  );

  // 2. Facing.
  const posture = (yaw: number): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 1, z: 0 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const shoulders = resolvedBones([
    ["leftUpperArm", { x: 0.2, y: 1.4, z: 0 }],
    ["rightUpperArm", { x: -0.2, y: 1.4, z: 0 }],
  ]);
  TestValidator.predicate(
    "faced aside",
    vclose(
      touchFaces(
        shoulders,
        posture(0),
        { x: 0.5, y: 1, z: 0.3 },
        { x: 0.7, y: 1, z: 0.3 },
      )!,
      { x: 0.6, y: 1, z: 0.3 },
      ROUNDING,
    ) &&
      touchFaces(
        shoulders,
        posture(90),
        { x: 0, y: 1, z: -0.4 },
        { x: 0, y: 1, z: -0.6 },
      ) !== undefined,
  );
  TestValidator.equals(
    "not faced",
    [
      touchFaces(
        shoulders,
        posture(0),
        { x: 0, y: 1, z: 0.3 },
        { x: 0.2, y: 1, z: 0.3 },
      ),
      touchFaces(
        resolvedBones([["leftUpperArm", { x: 0.2, y: 1.4, z: 0 }]]),
        posture(0),
        { x: 0.5, y: 1, z: 0.3 },
        { x: 0.7, y: 1, z: 0.3 },
      ),
    ],
    [undefined, undefined],
  );

  // 3. Sites.
  const context: Parameters<typeof touchSite>[0] = {
    series: () => ({
      random: AutoMovieEngineRandom.createRandom(AutoMovieEngineRandom.deriveSeed("site")),
      index: 1,
    }),
  };
  const frame: IAutoMovieMotionHumanTouchSite.IFrame = {
    point: { x: 0, y: 1.2, z: 0.1 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const shoulder: IAutoMovieVector3 = { x: 0.2, y: 1.4, z: 0 };
  const at = (site: IAutoMovieMotionHumanTouchSite.ISite): IAutoMovieVector3 =>
    touchSite(context, site)(frame, shoulder).point;
  const short: number = 0.1 / Math.hypot(0.2, 0.2);
  const drawn: IAutoMovieVector3 = at({ draw: 0.05 });
  TestValidator.predicate(
    "the sites",
    vclose(
      at({ up: 0.05, out: 0.02 }),
      { x: 0.02, y: 1.25, z: 0.1 },
      ROUNDING,
    ) &&
      vclose(at({ along: 0.3 }), frame.point, ROUNDING) &&
      vclose(
        at({ rule: "reach", within: 0.1 }),
        { x: 0.2 * short, y: 1.2 + 0.2 * short, z: 0.1 },
        ROUNDING,
      ) &&
      vclose(
        at({ rule: "reach", within: 1 }),
        { x: 0.2, y: 1.4, z: 0.1 },
        ROUNDING,
      ) &&
      Math.abs(drawn.z - 0.1) <= ROUNDING &&
      Math.hypot(drawn.x, drawn.y - 1.2) <= 0.05 + ROUNDING,
  );
  let refused: boolean = false;
  try {
    touchSite(context, { rule: "reach", within: -1 });
  } catch (error: unknown) {
    refused = error instanceof AutoMovieMotionHumanRefusal && error.axis === "site.within";
  }
  TestValidator.predicate("a negative within", refused);

  // 4. Layouts.
  const forehead: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "forehead",
  };
  const own: IAutoMovieMotionTarget = { kind: "self", region: "forehead" };
  const calls: string[] = [];
  const read: Lay = (
    hand: AutoMovieHumanSide,
    target: IAutoMovieMotionTarget,
  ): ReturnType<Lay> => {
    calls.push(`${hand}:${target.kind}`);
    return { lay: "arm", tangent: "up" };
  };
  const layout: Lay = touchLayouts(
    [
      ["right", forehead],
      ["left", own],
    ],
    read,
  );
  TestValidator.equals("read in order", calls, ["right:person", "left:self"]);
  const first: ReturnType<Lay> = layout("right", forehead);
  const again: ReturnType<Lay> = layout("right", forehead);
  TestValidator.predicate(
    "a declared pair",
    calls.length === 2 &&
      first.lay === "arm" &&
      first.tangent === "up" &&
      first !== again,
  );
  layout("left", forehead);
  TestValidator.equals("an undeclared pair is read", calls.length, 3);
}
