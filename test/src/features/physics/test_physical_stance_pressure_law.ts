import {
  AutoMoviePhysicalBalance,
  physicalStanceBalance,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The stance's centre-of-pressure law and its support's shrinking match their
 * closed forms without a simulation:
 *
 * 1. The command is u = xi + k (xi - xi_ref) plus the integral's bias (Hof et al.
 *    2005; Stephens 2011, Eq. 5.31): kept as is inside the polygon, moved to
 *    the nearest edge point and reported clamped outside it.
 * 2. A square shrunk by the margin keeps its centre and loses the margin on every
 *    side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each law and its closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceBalance.law` and `shrink` and reads their values.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the stated formulas evaluated by hand for a square polygon.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a command inside the polygon from a clamped one, and a bias from none.
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
  // keeps its own three vertices for the support; only the union of
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
  // The lifted foot with no known edge bears at its ankle point, which has
  // no room to shrink; the margin comes off the seated feet's union.
  for (const vertex of borne.polygon.filter(
    (v) => !(Math.abs(v.x - 0.3) < 1e-9 && Math.abs(v.z) < 1e-9),
  ))
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

  // 2c. The swing's bound is the hip's declared torque at the endpoint,
  // tau / (m_eff l), and a swing lasts at least Khadiv's 0.3 s.
  near(
    "hip-bound swing",
    physicalStanceBalance.swingBound({
      effective: 2,
      length: 0.8,
      torque: 160,
    }),
    160 / (2 * 0.8),
  );
  near("shortest swing", AutoMoviePhysicalBalance.duration(0.01, 0, 100), 0.3);
  near(
    "distance-bound swing",
    AutoMoviePhysicalBalance.duration(0.5, 0, 10),
    Math.sqrt((AutoMoviePhysicalBalance.MINIMUM_JERK * 0.5) / 10),
  ); // The clearance the stance can carry, h = min(h, LIFT_SHARE m g T^2 / (24 m_s)).
  near(
    "lowered clearance",
    physicalStanceBalance.clearance(0.3, 8, 1, 9.81, 0.1),
    (physicalStanceBalance.LIFT_SHARE * 8 * 9.81 * 0.09) /
      AutoMoviePhysicalBalance.CLEARANCE,
  );
  near(
    "kept clearance",
    physicalStanceBalance.clearance(1, 8, 1, 9.81, 0.1),
    0.1,
  );
  // 2d. The capture point's shift for angular momentum, omega / (m g) k x y.
  const shifted: IAutoMovieVector3 = physicalStanceBalance.spin(
    { x: 2, y: 0, z: -1 },
    3,
    80,
    9.81,
  );
  near("spin x", shifted.x, (1 * 3) / (80 * 9.81));
  near("spin z", shifted.z, (2 * 3) / (80 * 9.81));
  // 2e. An unseated foot bears on its edge, not its ankle.
  const edged = physicalStanceBalance.support([
    {
      limb: "edge",
      outline: square,
      flat: 0,
      ankle: { x: 0, y: 0, z: 0 },
      edge: [
        { x: 0.1, y: 0, z: -0.1 },
        { x: 0.1, y: 0, z: 0.1 },
      ],
    },
  ]);
  near("edge-borne points", edged.feet[0]!.points.length, 2);
  near("edge-borne x", edged.feet[0]!.points[0]!.x, 0.1);
  // 2f. Two edge-borne feet, a heel-up foot on its toe edge and a rolled one
  // on its side edge, still give a support with area: each edge is
  // shortened by the margin along its length only.
  const two = physicalStanceBalance.support([
    {
      limb: "toe",
      outline: square,
      flat: 0,
      ankle: { x: 0.1, y: 0, z: 0 },
      edge: [
        { x: 0.05, y: 0, z: 0.2 },
        { x: 0.15, y: 0, z: 0.2 },
      ],
    },
    {
      limb: "side",
      outline: square,
      flat: 0,
      ankle: { x: -0.1, y: 0, z: 0 },
      edge: [
        { x: -0.15, y: 0, z: 0 },
        { x: -0.15, y: 0, z: 0.2 },
      ],
    },
  ]);
  if (!(two.polygon.length >= 3))
    failures.push(
      `two edge-borne feet give a polygon of ${two.polygon.length} vertices`,
    );
  // 2g. A seated narrow tripod (a heel point and a 3.6 cm forefoot edge)
  // and a rear heel-up foot on its toe edge: the margin comes off their
  // joint hull once, which keeps area and spans both feet.
  const stepping = physicalStanceBalance.support([
    {
      limb: "landed",
      outline: [
        { x: -0.1, y: 0, z: 0.45 },
        { x: -0.08, y: 0, z: 0.6 },
        { x: -0.116, y: 0, z: 0.61 },
      ],
      flat: 1,
      ankle: { x: -0.1, y: 0, z: 0.47 },
    },
    {
      limb: "rear",
      outline: square,
      flat: 0,
      ankle: { x: 0.1, y: 0, z: 0 },
      edge: [
        { x: 0.07, y: 0, z: 0.15 },
        { x: 0.13, y: 0, z: 0.15 },
      ],
    },
  ]);
  const zs: number[] = stepping.polygon.map((p) => p.z);
  if (
    !(stepping.polygon.length >= 3) ||
    !(Math.max(...zs) > 0.5 && Math.min(...zs) < 0.2)
  )
    failures.push(
      `a seated tripod and a rear edge give ${JSON.stringify(stepping.polygon)}, not a hull spanning both feet`,
    );
  const shortened = physicalStanceBalance.shorten(
    [
      { x: 0, y: 0, z: 0 },
      { x: 0.2, y: 0, z: 0 },
    ],
    physicalStanceBalance.MARGIN,
  );
  near("shortened start", shortened[0]!.x, physicalStanceBalance.MARGIN);
  near("shortened end", shortened[1]!.x, 0.2 - physicalStanceBalance.MARGIN);
  near("shortened across", shortened[0]!.z, 0);
  TestValidator.equals("stance pressure law", failures, []);
}
