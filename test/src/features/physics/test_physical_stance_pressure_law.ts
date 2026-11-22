import { Quaternion, physicalStanceBalance } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The stance's centre-of-pressure law, its support's shrinking and the
 * torso's orientation task match their closed forms without a simulation:
 *
 * 1. The command is u = xi + k (xi - xi_ref) plus the integral's bias (Hof
 *    et al. 2005; Stephens 2011, Eq. 5.31): kept as is inside the polygon,
 *    moved to the nearest edge point and reported clamped outside it.
 * 2. A square shrunk by the margin keeps its centre and loses the margin on
 *    every side.
 * 3. The torso's desired angular acceleration is -omega_n^2 e - 2 omega_n w
 *    (Feng et al. 2013, Section III-B): e the rotation vector from the
 *    intended orientation to the actual one, about every axis, yaw included,
 *    and the same for a quaternion and its negative.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each law and its closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceBalance.law`, `shrink` and `orient` and reads their values.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the stated formulas evaluated by hand for a square polygon and single-axis rotations.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a command inside the polygon from a clamped one, a bias from none, a pitch from a yaw error, damping from stiffness, and the two signs of one rotation.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_stance_pressure_law(): void {
  const failures: string[] = [];
  const near = (name: string, actual: number, expected: number): void => {
    if (
      !(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)))
    )
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  const k: number = physicalStanceBalance.GAIN;
  const square: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  // 1. Inside: the command itself.
  const inside = physicalStanceBalance.law(
    { x: 0, y: 0, z: 0.03 },
    origin,
    square,
  );
  near("inside u.z", inside.pressure.z, 0.03 + k * 0.03);
  if (inside.clamped) failures.push("a command inside the polygon was clamped");
  // With a bias.
  const biased = physicalStanceBalance.law(
    { x: 0, y: 0, z: 0.03 },
    origin,
    square,
    {
      x: 0.01,
      z: -0.01,
    },
  );
  near("biased u.x", biased.pressure.x, 0.01);
  near("biased u.z", biased.pressure.z, 0.03 + k * 0.03 - 0.01);
  // Outside: the nearest edge point, clamped.
  const outside = physicalStanceBalance.law(
    { x: 0, y: 0, z: 0.08 },
    origin,
    square,
  );
  near("outside command z", outside.command.z, 0.08 + k * 0.08);
  near("outside u.z", outside.pressure.z, 0.1);
  near("outside u.x", outside.pressure.x, 0);
  if (!outside.clamped)
    failures.push("a command outside the polygon was not clamped");

  // 2. The shrunken square.
  const shrunk: IAutoMovieVector3[] = physicalStanceBalance.shrink(
    square,
    0.02,
  );
  near("shrunk vertices", shrunk.length, 4);
  for (const vertex of shrunk) {
    near("shrunk |x|", Math.abs(vertex.x), 0.08);
    near("shrunk |z|", Math.abs(vertex.z), 0.08);
  }

  // 2b. A narrow foot, a heel point and a 6 cm forefoot edge 15 cm ahead,
  // keeps its own three vertices for the stance solve; only the union of
  // the feet is shrunk for the command. A foot that is not flat bears at its
  // ankle.
  const narrow: IAutoMovieVector3[] = [
    { x: 0.1, y: 0, z: 0 },
    { x: 0.13, y: 0, z: 0.15 },
    { x: 0.07, y: 0, z: 0.15 },
  ];
  const mirror: IAutoMovieVector3[] = narrow.map((p) => ({ ...p, x: -p.x }));
  const borne = physicalStanceBalance.support([
    {
      limb: "left",
      outline: narrow,
      flat: 1,
      ankle: { x: 0.1, y: 0, z: 0.02 },
    },
    {
      limb: "right",
      outline: mirror,
      flat: 1,
      ankle: { x: -0.1, y: 0, z: 0.02 },
    },
    { limb: "lifted", outline: narrow, flat: 0, ankle: { x: 0.3, y: 0, z: 0 } },
  ]);
  near("narrow foot vertices", borne.feet[0]!.points.length, 3);
  near("narrow foot heel z", borne.feet[0]!.points[0]!.z, 0);
  near("lifted foot points", borne.feet[2]!.points.length, 1);
  near("lifted foot at its ankle", borne.feet[2]!.points[0]!.x, 0.3);
  // The feet's union hull, counter-clockwise seen from above: every command
  // vertex lies the margin inside each of its edges.
  const hull: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: 0 },
    { x: 0.3, y: 0, z: 0 },
    { x: 0.13, y: 0, z: 0.15 },
    { x: -0.13, y: 0, z: 0.15 },
  ];
  if (!(borne.polygon.length >= 3))
    failures.push(`the shrunken union has ${borne.polygon.length} vertices`);
  for (const vertex of borne.polygon)
    hull.forEach((a: IAutoMovieVector3, i: number): void => {
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const depth: number =
        ((b.x - a.x) * (vertex.z - a.z) - (b.z - a.z) * (vertex.x - a.x)) /
        Math.hypot(b.x - a.x, b.z - a.z);
      if (!(Math.abs(depth) >= physicalStanceBalance.MARGIN - 1e-9))
        failures.push(
          `command vertex ${JSON.stringify(vertex)} lies ${depth} m from a support edge, inside the margin`,
        );
    });

  // 2c. The swing the stance can react, a = BUDGET m g / (m_s z0), and the
  // clearance it can carry, h = min(h_policy, LIFT_SHARE m g T^2 / (24 m_s)).
  near(
    "swing acceleration",
    physicalStanceBalance.swing(8, 1, 0.7, 9.81),
    (physicalStanceBalance.BUDGET * 8 * 9.81) / 0.7,
  );
  near(
    "lowered clearance",
    physicalStanceBalance.clearance(0.3, 8, 1, 9.81, 0.1),
    (physicalStanceBalance.LIFT_SHARE * 8 * 9.81 * 0.09) / 24,
  );
  near(
    "kept clearance",
    physicalStanceBalance.clearance(1, 8, 1, 9.81, 0.1),
    0.1,
  );
  // 2d. The torso demand within the support's moment over the inertia.
  const steadied: IAutoMovieVector3 = physicalStanceBalance.steady(
    { x: 10, y: 4, z: -10 },
    { x: [-2, 3], z: [-1, 1] },
    { x: 0.5, z: 2 },
  );
  near("steady x", steadied.x, 3 / 0.5);
  near("steady heading", steadied.y, 4);
  near("steady z", steadied.z, -1 / 2);

  // 3. The torso orientation task.
  const w: number = physicalStanceBalance.TORSO;
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  for (const [axis, unit] of [
    ["pitch", { x: 1, y: 0, z: 0 }],
    ["yaw", { x: 0, y: 1, z: 0 }],
    ["roll", { x: 0, y: 0, z: 1 }],
  ] as const) {
    const angle: number = 0.1;
    const turned = Quaternion.fromAxisAngle(unit, (angle * 180) / Math.PI);
    for (const q of [
      turned,
      { x: -turned.x, y: -turned.y, z: -turned.z, w: -turned.w },
    ]) {
      const a: IAutoMovieVector3 = physicalStanceBalance.orient(
        q,
        identity,
        still,
        w,
      );
      near(`${axis} x`, a.x, -w * w * angle * unit.x);
      near(`${axis} y`, a.y, -w * w * angle * unit.y);
      near(`${axis} z`, a.z, -w * w * angle * unit.z);
    }
  }
  const damped: IAutoMovieVector3 = physicalStanceBalance.orient(
    identity,
    identity,
    { x: 0, y: 2, z: 0 },
    w,
  );
  near("damping", damped.y, -2 * w * 2);
  TestValidator.equals("stance pressure law", failures, []);
}
