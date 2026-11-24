import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanProp,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot, HumanRefusal, jump, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** The continuity and contact bound, metres: 5 mm. */
const CLOSE: number = 0.005;

/** The staged attitude's bound, radians. */
const ATTITUDE: number = 1e-6;

/** The winding's rounding over its samples, radians. */
const WINDING: number = 1e-6;

/** A tick either side of touchdown, seconds. */
const TICK: number = 1e-6;

/**
 * `jump`'s plan carries a fractional twist through its flight with its whole
 * winding and lands on the floor stance the twist turns to.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios:
 *
 * 1. The average man twists +2¼ at the origin and at (3, 0, -2) heading 37
 *    degrees, the small woman −2¼ there: summed through the flight, the
 *    displayed heading winds by the whole twist, the root upright at the
 *    staged heading throughout.
 * 2. The root and both feet cross touchdown without a jump; each foot lands on
 *    the turned footprint, every sole socket on the floor, and holds there to
 *    the end.
 * 3. Half a somersault is refused on `turns`; a raised destination with no prop
 *    is refused on `to`; a fractional twist onto a named fixed platform is
 *    refused on `on`.
 */
export async function test_unit_motions_actions_jump_plan(): Promise<void> {
  const average: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const small: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const yawRotation = (heading: number): IAutoMovieQuaternion => ({
    x: 0,
    y: Math.sin(heading / 2),
    z: 0,
    w: Math.cos(heading / 2),
  });
  const close = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Vector3.distance(a, b) <= CLOSE;
  const plan = (
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
    to: IAutoMovieVector3,
    rotation: NonNullable<IAutoMovieMotionHumanJump.IParams["rotation"]>,
    platform?: IAutoMovieMotionHumanProp,
  ): IAutoMovieMotionHumanActionPlan =>
    jump.plan(
      motionActionContext(
        body,
        {
          to,
          apex: 0.5,
          rotation,
          ...(platform === undefined ? {} : { on: platform.subject }),
        },
        { at, yaw, ...(platform === undefined ? {} : { props: [platform] }) },
      ),
    );
  for (const [body, at, yaw, twist] of [
    [average, { x: 0, y: 0, z: 0 }, 0, 2.25],
    [average, { x: 3, y: 0, z: -2 }, 37, 2.25],
    [small, { x: 3, y: 0, z: -2 }, 37, -2.25],
  ] as const) {
    const to: IAutoMovieVector3 = {
      x: at.x + Math.sin((yaw * Math.PI) / 180),
      y: 0,
      z: at.z + Math.cos((yaw * Math.PI) / 180),
    };
    const p: IAutoMovieMotionHumanActionPlan = plan(body, at, yaw, to, { twist });
    const takeoff: number = R.event(p, "takeoff")!;
    const touchdown: number = R.event(p, "touchdown")!;
    const settled: number = R.event(p, "settled")!;
    const heading: number = (yaw * Math.PI) / 180;
    const winding: number = 2 * Math.PI * twist;
    const label: string = `${twist} turns from ${yaw} degrees`;

    // 1. Five intervals resolve 2¼ turns without aliasing.
    let sum: number = 0;
    let previous: number = heading;
    for (let i: number = 0; i <= 5; i++) {
      const t: number = takeoff + ((touchdown - TICK - takeoff) * i) / 5;
      const share: number = Math.min(1, (t - takeoff) / (touchdown - takeoff));
      const root: IAutoMovieQuaternion = R.pose(body, p, t).root!.rotation;
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(root, { x: 0, y: 0, z: 1 });
      const current: number = Math.atan2(forward.x, forward.z);
      sum += Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
      previous = current;
      TestValidator.predicate(
        `${label}: upright at ${t} s`,
        Quaternion.angle(root, yawRotation(heading + winding * share)) <= ATTITUDE,
      );
    }
    TestValidator.predicate(
      `${label}: the whole winding`,
      Math.abs(sum - winding) <= WINDING,
    );

    // 2. Across touchdown and on the turned footprint.
    const before: IAutoMoviePose = R.pose(body, p, touchdown - TICK);
    const after: IAutoMoviePose = R.pose(body, p, touchdown + TICK);
    TestValidator.predicate(
      `${label}: no root jump at touchdown`,
      close(before.root!.translation, after.root!.translation),
    );
    const landed: number = heading + winding;
    for (const side of ["left", "right"] as const) {
      const lateral: number = body.rest.get(`${side}Foot`)!.x;
      const expected: IAutoMovieVector3 = {
        x: to.x + lateral * Math.cos(landed),
        y: body.measure.ankleHeight,
        z: to.z - lateral * Math.sin(landed),
      };
      const plant: ReturnType<typeof R.bones> = R.bones(body, p, touchdown + TICK);
      TestValidator.predicate(
        `${label}: the ${side} foot lands on the turned target`,
        close(plant.get(`${side}Foot`)!.worldPosition, expected),
      );
      const footYaw: number =
        landed + ((side === "left" ? 1 : -1) * stand.TOE_OUT * Math.PI) / 180;
      for (const { socket, point } of HumanFoot.sockets(body, plant, side)) {
        TestValidator.predicate(
          `${label}: ${side} ${socket} on the turned footprint, on the floor`,
          close(
            point,
            HumanFoot.point(body, side, socket, {
              ankle: expected,
              rotation: yawRotation(footYaw),
            }),
          ) && Math.abs(point.y) <= CLOSE,
        );
        for (const t of [(touchdown + settled) / 2, settled, p.duration]) {
          const held: IAutoMovieVector3 = HumanFoot.sockets(
            body,
            R.bones(body, p, t),
            side,
          ).find((s: ReturnType<typeof HumanFoot.sockets>[number]): boolean => s.socket === socket)!.point;
          TestValidator.predicate(
            `${label}: ${side} ${socket} holds at ${t} s`,
            close(held, point),
          );
        }
      }
    }
  }

  // 3. The refusals.
  const refused = (axis: string, make: () => unknown): void => {
    let error: unknown;
    try {
      make();
    } catch (caught: unknown) {
      error = caught;
    }
    TestValidator.predicate(
      `refused on ${axis}: ${String(error)}`,
      error instanceof HumanRefusal && error.axis === axis,
    );
  };
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const raised: IAutoMovieVector3 = { x: 0, y: 0.2, z: 1 };
  refused("turns", () => plan(average, origin, 0, { x: 0, y: 0, z: 1 }, { somersault: 0.5 }));
  refused("to", () => plan(average, origin, 0, raised, { twist: 0.25 }));
  const platform: IAutoMovieMotionHumanProp = {
    subject: "platform",
    fixed: true,
    frame: { position: { ...raised, y: raised.y / 2 }, rotation: Quaternion.identity() },
    points: { top: { point: { x: 0, y: raised.y / 2, z: 0 }, normal: { x: 0, y: 1, z: 0 } } },
    shapes: [
      {
        kind: "box",
        id: "platform",
        material: "scenery",
        transform: { position: origin, rotation: Quaternion.identity() },
        halfExtents: { x: 0.4, y: raised.y / 2, z: 0.4 },
      },
    ],
  };
  refused("on", () => plan(average, origin, 0, raised, { twist: 0.25 }, platform));
}
