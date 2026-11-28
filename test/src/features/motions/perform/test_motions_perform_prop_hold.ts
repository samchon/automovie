
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanPropHold
} from "../../../../../packages/motions/src/perform/internal/HumanPropHold";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * How far a fitted frame may stand from its closed form: a few rotations and
 * sums of decimetre offsets, far above their rounding.
 */
const FIT: number = 1e-9;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * `HumanPropHold.fit` holds a prop in two hands as one rigid thing: the line
 * between the two grip points on the prop laid on the line between the two
 * sockets, its middle on their middle, its turn about that line halfway between
 * the two hands'. `frame` reads where a grip holds a prop on given bones.
 *
 * Scenarios, for a bar gripped 0.3 m either side of its origin:
 *
 * 1. Hands at (∓0.3, 1, 0) hold the bar level at (0, 1, 0), unturned.
 * 2. Hands at (0, 1, ∓0.3) turn it a quarter about `-Y`: its `+X` to `+Z`.
 * 3. Hands swapped, (±0.3, 1, 0), give it a half turn about its up, `+Y`: its
 *    `+X` to `-X`, its up kept.
 * 4. One hand rolled a quarter about the bar's line rolls it an eighth.
 * 5. Grip points at 0.1 and 0.7 m on the bar, hands at ∓0.3, put its origin at
 *    -0.4.
 * 6. Hands at one point leave the blended turn.
 * 7. `frame` reads a worn span's bone frame, and a hand's grip socket placed on
 *    its bone with the bone's turn, the left hand's on the left socket.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The bar fixture covers aligned, crossed, swapped, rolled and coincident hands, offset grip points, and bone-relative grip and wear frames.
 * @evidence contracts/development/testing.md#behavioral-verification The fit owner receives paired local contacts and world socket frames. The test reads the fitted origin and basis directions, and compares `frame` with the archived body's bone and left grip socket.
 * @evidence contracts/development/testing.md#independent-expectations Centered grips at ±0.3 m put the origin at the socket midpoint. Swapping sockets reverses +X while keeping +Y. Sharing a quarter roll gives an eighth turn with up components (0, √½, √½). An off-center grip midpoint at X 0.4 needs origin X -0.4.
 */
export async function test_motions_perform_prop_hold(): Promise<void> {
  const hand = (
    at: IAutoMovieVector3,
    grip: number,
    rotation: IAutoMovieQuaternion = IDENTITY,
  ): HumanPropHold.IHand => ({
    hand: { position: at, rotation },
    offset: { position: P(-grip, 0, 0), rotation: IDENTITY },
  });

  // 1. Level.
  const level: IAutoMovieRigidTransform = HumanPropHold.fit(
    hand(P(-0.3, 1, 0), -0.3),
    hand(P(0.3, 1, 0), 0.3),
  );
  TestValidator.predicate(
    "level between the hands",
    near(level.position, P(0, 1, 0)) &&
      near(turn(level.rotation, P(1, 0, 0)), P(1, 0, 0)),
  );

  // 2. Across.
  const across: IAutoMovieRigidTransform = HumanPropHold.fit(
    hand(P(0, 1, -0.3), -0.3),
    hand(P(0, 1, 0.3), 0.3),
  );
  TestValidator.predicate(
    "laid on the hands' line",
    near(across.position, P(0, 1, 0)) &&
      near(turn(across.rotation, P(1, 0, 0)), P(0, 0, 1)) &&
      near(turn(across.rotation, P(0, 1, 0)), P(0, 1, 0)),
  );

  // 3. Swapped.
  const swapped: IAutoMovieRigidTransform = HumanPropHold.fit(
    hand(P(0.3, 1, 0), -0.3),
    hand(P(-0.3, 1, 0), 0.3),
  );
  TestValidator.predicate(
    "a half turn keeping its up",
    near(swapped.position, P(0, 1, 0)) &&
      near(turn(swapped.rotation, P(1, 0, 0)), P(-1, 0, 0)) &&
      near(turn(swapped.rotation, P(0, 1, 0)), P(0, 1, 0)),
  );

  // 4. A shared roll.
  const rolled: IAutoMovieRigidTransform = HumanPropHold.fit(
    hand(P(-0.3, 1, 0), -0.3),
    hand(P(0.3, 1, 0), 0.3, {
      x: Math.SQRT1_2,
      y: 0,
      z: 0,
      w: Math.SQRT1_2,
    }),
  );
  TestValidator.predicate(
    "the hands share the roll",
    near(turn(rolled.rotation, P(0, 1, 0)), P(0, Math.SQRT1_2, Math.SQRT1_2)) &&
      near(turn(rolled.rotation, P(1, 0, 0)), P(1, 0, 0)),
  );

  // 5. Off-centre grips.
  const offset: IAutoMovieRigidTransform = HumanPropHold.fit(
    hand(P(-0.3, 1, 0), 0.1),
    hand(P(0.3, 1, 0), 0.7),
  );
  TestValidator.predicate(
    "the grip points' middle on the hands' middle",
    near(offset.position, P(-0.4, 1, 0)),
  );

  // 6. One point.
  const one: IAutoMovieRigidTransform = HumanPropHold.fit(
    hand(P(0, 1, 0), -0.3),
    hand(P(0, 1, 0), 0.3),
  );
  TestValidator.predicate(
    "coincident hands keep the blended turn",
    near(turn(one.rotation, P(1, 0, 0)), P(1, 0, 0)),
  );

  // 7. Frames on bones.
  const { context } = await standingPerformanceState();
  const body: IAutoMovieMotionHumanBody = context.body;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, context.entry.pose);
  const head: IAutoMovieResolvedBone = bones.get("head")!;
  const worn: IAutoMovieRigidTransform = HumanPropHold.frame(body, bones, {
    side: "right",
    bone: "head",
  });
  const socket = body.surfaces.sockets.gripLeft;
  const left: IAutoMovieRigidTransform = HumanPropHold.frame(body, bones, {
    side: "left",
  });
  const right: IAutoMovieRigidTransform = HumanPropHold.frame(body, bones, {
    side: "right",
  });
  TestValidator.predicate(
    "frames on bones",
    worn.position === head.worldPosition &&
      worn.rotation === head.worldRotation &&
      near(
        left.position,
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(socket, bones.get(socket.bone)!)
          .point,
      ) &&
      left.rotation === bones.get(socket.bone)!.worldRotation &&
      left.position.x * right.position.x < 0,
  );
}

/** A vector turned. */
function turn(q: IAutoMovieQuaternion, v: IAutoMovieVector3): IAutoMovieVector3 {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Whether two points agree within the fit bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= FIT &&
    Math.abs(a.y - b.y) <= FIT &&
    Math.abs(a.z - b.z) <= FIT
  );
}
