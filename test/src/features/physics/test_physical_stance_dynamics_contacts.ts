import { physicalStanceDynamics } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Gravity, metres per second squared. */
const G: number = 9.81;

/** The feet's friction coefficient. */
const FRICTION: number = 0.7;

/**
 * The stance's joint solve over accelerations and contact forces keeps its
 * contact rules on a base standing on four legs that cannot turn their feet
 * about the vertical, without a simulation (TSID; Herzog et al. 2016):
 *
 * 1. Asked for the weight with no moment, the feet carry the weight, the
 *    centre of pressure lies inside the feet's hull, every point stays in its
 *    friction pyramid with a non-negative normal force, and no foot carries
 *    a vertical moment about its own centre.
 * 2. Asked by the torso orientation task for a yaw acceleration (Feng et al.
 *    2013, Section III-B), the base turns as asked: the feet realize the
 *    heading by a couple of friction forces across them, each foot still
 *    without a vertical moment of its own, and still carry the weight.
 * 3. Asked by the height task for a vertical acceleration, with the lift
 *    that needs, the base rises as asked and the feet carry that lift.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each contact rule and the heading task's realization.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceDynamics.stance` on a fixed four-legged assembly and reads the base acceleration and every point force.
 * @evidence contracts/development/testing.md#independent-expectations Weight, centre of pressure, friction and moments are summed by hand from the returned point forces and the declared geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Detects a force deficit, a centre of pressure outside the feet, a friction violation, a foot's own vertical moment on a yaw-less leg and a heading task left unrealized.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_stance_dynamics_contacts(): void {
  const failures: string[] = [];
  const inertia = (value: number): number[] => [
    value,
    0,
    0,
    0,
    value,
    0,
    0,
    0,
    value,
  ];
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const base: physicalStanceDynamics.IBody = {
    mass: 20,
    center: { x: 0, y: 0.5, z: 0 },
    inertia: inertia(1),
    velocity: still,
    angular: still,
  };
  const corners: [number, number][] = [
    [0.2, 0.2],
    [-0.2, 0.2],
    [0.2, -0.2],
    [-0.2, -0.2],
  ];
  const rod: number = 0.5;
  const total: number = base.mass + corners.length * rod;
  const legs: physicalStanceDynamics.ILeg[] = corners.map(([x, z]) => ({
    joints: [
      {
        pivot: { x, y: 0.5, z },
        axes: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 0, z: 1 },
        ],
        bodies: [
          {
            mass: rod,
            center: { x, y: 0.25, z },
            inertia: inertia(0.01),
            velocity: still,
            angular: still,
          },
        ],
      },
    ],
    points: [
      { point: { x: x - 0.03, y: 0, z: z - 0.05 }, friction: FRICTION },
      { point: { x: x + 0.03, y: 0, z: z - 0.05 }, friction: FRICTION },
      { point: { x: x + 0.03, y: 0, z: z + 0.05 }, friction: FRICTION },
      { point: { x: x - 0.03, y: 0, z: z + 0.05 }, friction: FRICTION },
    ],
    load: total * G,
    yaw: false,
    bounds: [
      { lower: -1000, upper: 1000 },
      { lower: -1000, upper: 1000 },
    ],
  }));
  const solve = (
    orientation?: physicalStanceDynamics.IStance["orientation"],
    height?: physicalStanceDynamics.IStance["height"],
    lift: number = total * G,
  ): physicalStanceDynamics.ISolution | undefined =>
    physicalStanceDynamics.stance({
      base,
      legs,
      gravity: { x: 0, y: -G, z: 0 },
      stiffness: 10,
      damping: 2 * Math.sqrt(10),
      task: {
        force: { x: 0, y: lift, z: 0 },
        moment: still,
        origin: base.center,
      },
      ...(orientation ? { orientation } : {}),
      ...(height ? { height } : {}),
    });
  const check = (
    name: string,
    solution: physicalStanceDynamics.ISolution | undefined,
    lift: number = total * G,
  ): void => {
    if (!solution) {
      failures.push(`${name}: no solution`);
      return;
    }
    let normal: number = 0;
    let pressure: number = 0;
    let lateral: number = 0;
    solution.forces.forEach((forces, leg: number) => {
      const points = legs[leg]!.points;
      const center: IAutoMovieVector3 = {
        x: points.reduce((sum, p) => sum + p.point.x, 0) / points.length,
        y: 0,
        z: points.reduce((sum, p) => sum + p.point.z, 0) / points.length,
      };
      let yaw: number = 0;
      forces.forEach((f: IAutoMovieVector3, k: number) => {
        const p: IAutoMovieVector3 = points[k]!.point;
        normal += f.y;
        pressure += p.x * f.y;
        lateral += p.z * f.y;
        if (!(f.y >= -1e-6))
          failures.push(`${name}: leg ${leg} point ${k} pulls, ${f.y} N`);
        if (!(Math.abs(f.x) + Math.abs(f.z) <= FRICTION * f.y + 1e-6))
          failures.push(
            `${name}: leg ${leg} point ${k} leaves its friction pyramid`,
          );
        yaw += (p.z - center.z) * f.x - (p.x - center.x) * f.z;
      });
      if (!(Math.abs(yaw) <= 1e-6))
        failures.push(
          `${name}: yaw-less leg ${leg} carries ${yaw} N m about its own centre`,
        );
    });
    if (!(Math.abs(normal - lift) <= 0.01 * lift))
      failures.push(`${name}: feet carry ${normal} N of ${lift} N`);
    const cop: [number, number] = [pressure / normal, lateral / normal];
    if (!(Math.abs(cop[0]) < 0.23 && Math.abs(cop[1]) < 0.25))
      failures.push(`${name}: centre of pressure ${cop} outside the feet`);
  };

  check("weight", solve());
  const turning = solve({ acceleration: { x: 0, y: 1, z: 0 }, weight: 1 });
  check("heading", turning);
  if (turning && !(Math.abs(turning.base[4]! - 1) <= 0.05))
    failures.push(
      `heading task: base yaw acceleration ${turning.base[4]} of 1`,
    );
  // 3. The height task: the base rises as asked, the contacts still kept.
  const rising = solve(
    undefined,
    { acceleration: 1, weight: 1 },
    total * (G + 1),
  );
  check("height", rising, total * (G + 1));
  if (rising && !(Math.abs(rising.base[1]! - 1) <= 0.05))
    failures.push(
      `height task: base vertical acceleration ${rising.base[1]} of 1`,
    );
  TestValidator.equals("stance contact rules", failures, []);
}
