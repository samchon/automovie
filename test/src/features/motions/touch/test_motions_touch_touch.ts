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
  HumanRefusal,
  touchEffectors,
  touchFaces,
  touchLayouts,
  touchSide,
  touchSite,
} from "@automovie/motions/internal";
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
 * The `touch` law's own logic, each piece without the arm planner:
 *
 * - `touchSide` picks the touching hand: the one the author names; else never a
 *   hand that would touch its own arm (or leave the other hand on its own arm),
 *   whatever the other's strain.
 * - `touchFaces` names the point a two-handed touch turns the trunk toward: the
 *   middle of the two regions when it lies aside of the shoulders' midpoint by
 *   more than half their span across the heading; none between them or without
 *   both shoulders.
 * - `touchSite` moves a touch's contact over its surface: by an offset up and out
 *   in the surface's plane, not at all along a prop's contact, toward the
 *   shoulder by at most `within` for a reach rule, and by a drawn point within
 *   `draw`; a negative `within` is refused.
 * - `touchLayouts` decides each declared hand and target's layout once, in order,
 *   and hands every later read a fresh copy; an undeclared pair is read anew.
 *
 * Scenarios:
 *
 * 1. Hand choice, the average man standing at the origin: a named left hand
 *    touches; the left forearm is touched by the right hand and the right
 *    forearm by the left; the sternum with the other hand on the left forearm
 *    is touched by the left hand.
 * 2. Facing, shoulders at x = 0.2 and -0.2 at 1.4 m: regions meeting at x = 0.6
 *    are faced facing +Z; meeting at x = 0.1, none; a middle 0.5 m behind,
 *    facing +X, is faced; without the right shoulder, none.
 * 3. Sites on a surface at (0, 1.2, 0.1) facing +Z, the shoulder at (0.2, 1.4, 0):
 *    0.05 m up and 0.02 m out lies at (0.02, 1.25, 0.1); along a contact it
 *    stays; within 0.1 m of the shoulder it moves 0.1 m toward it and within 1
 *    m all the way; a drawn point lies on the plane within its 0.05 m; a
 *    negative `within` is refused on `site.within`.
 * 4. Layouts: building reads each declared pair once in order; a declared pair's
 *    read reads nothing more, returns its decision and is a fresh copy; an
 *    undeclared pair is read at its own call.
 *
 * The body is built whole (`humanFixtureBody`) for the hand choice, which reads
 * the body's surfaces and arms.
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
    refused = error instanceof HumanRefusal && error.axis === "site.within";
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
