import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The effector of a touch: the hand's anatomical axes, the point a surface
 * or a held tool's tip has in the hand, where that point is on a posed hand,
 * how deep a skin surface stands inside the hand's own collider, and the arm
 * goal that lays the effector on a region.
 *
 * Scenarios, on four bodies of the population and both hands:
 * 1. The axes at the T-pose rest: the fingers point out to the hand's side
 *    (+X left, -X right), the palm faces down (-Y), the thumb points forward
 *    (+Z); a `-` axis is the opposite vector.
 * 2. A bare wrist is the joint itself, the zero point. A tool on the wrist
 *    of `{ thumb: 0.4, palm: 0.2 }` hand lengths stands 0.4 hands forward
 *    and 0.2 hands down of it; the same tool on the palm stands that far
 *    from the bare palm's point.
 * 3. A bare palm faces the way the palm axis does and a bare hand back the
 *    opposite way, each within 45 degrees; a named `facing` and `along` are
 *    those axes exactly.
 * 4. On a hand at `(0.3, 1.2, 0.4)` turned a quarter about +Y, the
 *    effector's point is the hand's place plus its rest point turned the
 *    same way, `(x, y, z)` to `(z, y, -x)`.
 * 5. The skin's depth inside the hand's collider is never negative, under
 *    30 mm (a hand is thinner), the same on both hands within 0.5 mm, and
 *    zero for a tool, whose tip stands outside the hand.
 * 6. The goal that lays an effector with named axes on a region: the hand's
 *    rotation turns the facing axis against the region's normal and the
 *    along axis onto the tangent, the bend is the hint, and a hand posed at
 *    the goal has the effector's point on the contact point within 1e-9 m.
 *    Read on a chest facing +Z with the tangent up, and on a level surface
 *    with the tangent along +X.
 * 7. A goal declares the effector's point as its contact; a bare wrist,
 *    which is the joint itself, declares none.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public axes, point, pad and goal; a mirrored axis, a tool in metres, a goal whose hand faces away or whose effector misses the point fails.
 * @evidence contracts/development/testing.md#independent-expectations The axes are the rig's rest pose, the tool's offset is written in hand lengths, the quarter turn is written by hand, and the goal is checked by posing a hand at it and reading the effector back.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, bare surfaces and tools, a named and a default facing, a vertical and a level region, on four builds.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because it prepares real bodies; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States what an effector is and lists the 7 scenarios with their numbers.
 */
export function test_human_motion_compose_touch_effector(): void {
  type IEffector = AutoMovieMotionHumanTouchEffector.IEffector;
  const E = AutoMovieMotionHumanTouchEffector;
  const near = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z);
  const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    a.x * b.x + a.y * b.y + a.z * b.z;
  const minus = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  });
  const posed = (
    side: "left" | "right",
    position: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): Map<
    AutoMovieHumanoidBone,
    { worldPosition: IAutoMovieVector3; worldRotation: IAutoMovieQuaternion }
  > =>
    new Map<
      AutoMovieHumanoidBone,
      { worldPosition: IAutoMovieVector3; worldRotation: IAutoMovieQuaternion }
    >([[`${side}Hand`, { worldPosition: position, worldRotation: rotation }]]);

  // 1. the axes
  for (const side of ["left", "right"] as const) {
    const out: number = side === "left" ? 1 : -1;
    for (const [axis, expected] of [
      ["fingers", { x: out, y: 0, z: 0 }],
      ["palm", { x: 0, y: -1, z: 0 }],
      ["thumb", { x: 0, y: 0, z: 1 }],
      ["-fingers", { x: -out, y: 0, z: 0 }],
      ["-palm", { x: 0, y: 1, z: 0 }],
      ["-thumb", { x: 0, y: 0, z: -1 }],
    ] as const)
      TestValidator.predicate(
        `the ${side} hand's ${axis} axis`,
        same(E.axis(side, axis), expected),
      );
  }

  const tool: { thumb: number; palm: number } = { thumb: 0.4, palm: 0.2 };
  for (const name of [
    "m-average",
    "f-minus-one",
    "f-small",
    "m-large",
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const hand: number = body.measure.hand;
    for (const side of ["left", "right"] as const) {
      const label: string = `${name} ${side}`;
      const wrist: IEffector = { surface: "wrist", shape: "relaxed" };
      const palm: IEffector = { surface: "palm", shape: "flat" };
      const cup: IEffector = { ...palm, tool, facing: "palm", along: "thumb" };

      // 2. points
      TestValidator.predicate(
        `${label}: a bare wrist is the joint`,
        same(E.local(body, side, wrist).point, { x: 0, y: 0, z: 0 }),
      );
      TestValidator.predicate(
        `${label}: a tool stands in hand lengths from the wrist`,
        same(E.local(body, side, { ...wrist, tool }).point, {
          x: 0,
          y: -0.2 * hand,
          z: 0.4 * hand,
        }),
      );
      TestValidator.predicate(
        `${label}: a tool stands in hand lengths from the palm`,
        same(
          minus(
            E.local(body, side, cup).point,
            E.local(body, side, palm).point,
          ),
          { x: 0, y: -0.2 * hand, z: 0.4 * hand },
        ),
      );

      // 3. facings
      TestValidator.predicate(
        `${label}: a bare palm faces the palm's way`,
        dot(E.local(body, side, palm).normal, E.axis(side, "palm")) >
          Math.SQRT1_2,
      );
      TestValidator.predicate(
        `${label}: a bare hand back faces the other way`,
        dot(
          E.local(body, side, { surface: "handBack", shape: "flat" }).normal,
          E.axis(side, "-palm"),
        ) > Math.SQRT1_2,
      );
      TestValidator.predicate(
        `${label}: named axes are the facing and the along`,
        same(E.local(body, side, cup).normal, { x: 0, y: -1, z: 0 }) &&
          same(E.local(body, side, cup).forward, { x: 0, y: 0, z: 1 }),
      );

      // 4. the point on a posed hand
      const quarter: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        90,
      );
      const rest: IAutoMovieVector3 = E.local(body, side, cup).point;
      TestValidator.predicate(
        `${label}: the point follows the hand`,
        same(
          E.point(
            body,
            posed(side, { x: 0.3, y: 1.2, z: 0.4 }, quarter),
            side,
            cup,
          ),
          {
            x: 0.3 + rest.z,
            y: 1.2 + rest.y,
            z: 0.4 - rest.x,
          },
        ),
      );

      // 5. the pad
      const pad: number = E.pad(body, side, palm);
      TestValidator.predicate(
        `${label}: the palm's skin stands ${(pad * 1000).toFixed(1)} mm inside the hand, 0 to 30`,
        pad >= 0 && pad < 0.03,
      );
      TestValidator.predicate(
        `${label}: both hands have the same pad`,
        near(pad, E.pad(body, side === "left" ? "right" : "left", palm), 5e-4),
      );
      TestValidator.equals(
        `${label}: a tool has no pad`,
        E.pad(body, side, cup),
        0,
      );

      // 6. the goal
      const bend: IAutoMovieVector3 = { x: 0.5, y: 1, z: -0.2 };
      for (const [at, normal, tangent] of [
        [
          { x: 0.05, y: 1.3, z: 0.12 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 1, z: 0 },
        ],
        [
          { x: -0.2, y: 0.8, z: 0.3 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 0, z: 0 },
        ],
      ] as const) {
        const goal: IHumanPosture.IGoal = E.goal(
          body,
          side,
          cup,
          at,
          normal,
          tangent,
          bend,
        );
        const turn = (v: IAutoMovieVector3): IAutoMovieVector3 =>
          Quaternion.rotateVector(goal.rotation!, v);
        TestValidator.predicate(
          `${label}: the goal turns the palm against the region`,
          same(turn({ x: 0, y: -1, z: 0 }), {
            x: -normal.x,
            y: -normal.y,
            z: -normal.z,
          }),
        );
        TestValidator.predicate(
          `${label}: the goal lays the thumb on the tangent`,
          same(turn({ x: 0, y: 0, z: 1 }), tangent),
        );
        TestValidator.equals(
          `${label}: the goal keeps the hint`,
          goal.bend,
          bend,
        );
        TestValidator.predicate(
          `${label}: a hand at the goal has the tip on the point`,
          same(
            E.point(body, posed(side, goal.point, goal.rotation!), side, cup),
            at,
          ),
        );
        // 7. the contact
        TestValidator.predicate(
          `${label}: the goal's contact is the effector's point`,
          goal.contact !== undefined && same(goal.contact, rest),
        );
        TestValidator.equals(
          `${label}: a bare wrist declares no contact`,
          E.goal(body, side, wrist, at, normal, tangent, bend).contact,
          undefined,
        );
      }
    }
  }
}
