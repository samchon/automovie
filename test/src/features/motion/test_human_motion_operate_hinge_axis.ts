import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { operate, operateDrive } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A hinged leaf turns about its own hinge line, however it lies (#3476,
 * #3488): a door's vertical line through the point it names, or a prop's
 * hinge axis, a gun cock's cross pin.
 *
 * Scenarios, a handle 0.08 m from its line, swung 45 degrees:
 * 1. About a horizontal axis (a cock's pin along +X through the origin), the
 *    swung handle keeps its distance from the line and its offset along it,
 *    and its arm from the line's foot is the rest arm turned 45 degrees
 *    about the axis, all to the float resolution of the turn's arithmetic
 *    (`Number.EPSILON` times the radius times the few operations of a
 *    rotation).
 * 2. A pull turns the handle toward its outward normal's side: the swung
 *    handle's displacement points along the normal.
 * 3. A door's line given by a point (no axis) gives exactly the vertical
 *    turn it gave before: the point, the normal and the radius equal those
 *    of the same line given with the vertical axis to the same resolution,
 *    and the foot keeps the handle's own height exactly.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the law's public leaf state and the drive's line readers on a tilted and an upright line; a leaf that ignores its axis, turns the wrong way or changes a door's swing fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected arm is the rest arm turned by the engine's axis-angle rotation; the bound is float resolution derived from the radius.
 * @evidence contracts/development/testing.md#distinguishing-cases A horizontal pin and an upright door line, the swing's side.
 * @evidence contracts/development/testing.md#execution-ownership Pure functions, no performance.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios with their bounds.
 */
export function test_human_motion_operate_hinge_axis(): void {
  const swing: number = 45;
  const radius: number = 0.08;
  const mechanism: IAutoMovieMotionHumanOperate.Mechanism = {
    kind: "hinge",
    at: { kind: "point", frame: "world", at: { x: 0, y: 0, z: 0 } },
    swing,
  };
  // The floating operations a swung point accumulates: an axis-angle
  // quaternion (a normalisation and a sine and cosine, about 10), its
  // rotation of the arm (two cross products and their sums, about 30), the
  // projection on the line and the arm's subtraction and addition (about
  // 20), rounded up to a power of two.
  const OPERATIONS: number = 2 ** Math.ceil(Math.log2(10 + 30 + 20));
  const resolution: number = Number.EPSILON * radius * OPERATIONS;

  // 1-2. A cock's pin along +X through the origin, the handle above it.
  const pin: IAutoMovieMotionHumanOperateDrive.IHinge = {
    point: { x: 0, y: 0, z: 0 },
    axis: { x: 1, y: 0, z: 0 },
  };
  const handle = {
    point: { x: 0.01, y: radius, z: 0 },
    normal: { x: 0, y: 0, z: -1 },
  };
  const swung = operate.state(mechanism, handle, pin, 1);
  TestValidator.predicate(
    "the swung handle keeps its radius about the pin",
    Math.abs(operateDrive.radius(pin, swung.point) - radius) <= resolution,
  );
  TestValidator.predicate(
    "the swung handle keeps its place along the pin",
    Math.abs(swung.point.x - handle.point.x) <= resolution,
  );
  const foot: IAutoMovieVector3 = operateDrive.foot(pin, handle.point);
  const rest: IAutoMovieVector3 = Vector3.subtract(handle.point, foot);
  const sides: IAutoMovieVector3[] = [swing, -swing].map(
    (degrees: number): IAutoMovieVector3 =>
      Vector3.add(
        foot,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(pin.axis!, degrees),
          rest,
        ),
      ),
  );
  const miss: number = Math.min(
    ...sides.map((p: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(p, swung.point)),
    ),
  );
  TestValidator.predicate(
    `the handle turns ${swing} degrees about the pin (${miss.toExponential(2)} m)`,
    miss <= resolution,
  );
  TestValidator.predicate(
    "a pull turns the handle toward its normal",
    Vector3.dot(Vector3.subtract(swung.point, handle.point), handle.normal) > 0,
  );

  // 3. A door's line given by a point keeps the vertical turn.
  const door = {
    point: { x: 0.8, y: 1.0, z: 0.05 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const line: IAutoMovieMotionHumanOperateDrive.IHinge = {
    point: { x: 0, y: 0.3, z: 0 },
  };
  const upright: IAutoMovieMotionHumanOperateDrive.IHinge = {
    point: { x: 0, y: 0.3, z: 0 },
    axis: { x: 0, y: 1, z: 0 },
  };
  const a = operate.state(mechanism, door, line, 1);
  const b = operate.state(mechanism, door, upright, 1);
  const scale: number = Vector3.length(door.point);
  TestValidator.predicate(
    "a door's line by a point turns as the vertical axis",
    Vector3.length(Vector3.subtract(a.point, b.point)) <=
      Number.EPSILON * scale * OPERATIONS &&
      Vector3.length(Vector3.subtract(a.normal, b.normal)) <=
        Number.EPSILON * OPERATIONS,
  );
  TestValidator.predicate(
    "a door's foot keeps the handle's height exactly",
    operateDrive.foot(line, door.point).y === door.point.y,
  );
  TestValidator.predicate(
    "a door's radius is the handle's horizontal distance from the line",
    Math.abs(
      operateDrive.radius(line, door.point) -
        operateDrive.radius(upright, door.point),
    ) <=
      Number.EPSILON * scale * OPERATIONS,
  );
}
