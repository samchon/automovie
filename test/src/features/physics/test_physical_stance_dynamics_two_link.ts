import { physicalStanceDynamics } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The stance chain's composite-rigid-body mass matrix and recursive
 * Newton-Euler bias forces match the planar two-link arm's closed form
 * (Spong, Hutchinson and Vidyasagar 2006, Section 7.4): M11 = I1 + I2 + m1
 * lc1^2 + m2 (l1^2 + lc2^2 + 2 l1 lc2 cos q2), M12 = I2 + m2 (lc2^2 + l1 lc2
 * cos q2), M22 = I2 + m2 lc2^2; gravity g1 = (m1 lc1 + m2 l1) g cos q1 + m2
 * lc2 g cos(q1 + q2), g2 = m2 lc2 g cos(q1 + q2); and Coriolis h1 = -m2 l1
 * lc2 sin q2 (2 q1' q2' + q2'^2), h2 = m2 l1 lc2 sin q2 q1'^2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the closed form each quantity is checked against.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceDynamics.crba` and `solve` on a fixed-base planar arm and reads the mass matrix and bias forces.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the textbook closed form for the planar two-link arm, not the implementation's own recursion.
 * @evidence contracts/development/testing.md#distinguishing-cases A pose with a bent elbow and nonzero joint rates separates the configuration-dependent mass terms, gravity and the velocity products.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export async function test_physical_stance_dynamics_two_link(): Promise<void> {
  const [m1, m2, l1, lc1, lc2, I1, I2, g] = [
    3, 2, 0.5, 0.25, 0.2, 0.07, 0.03, 9.81,
  ];
  const [q1, q2, w1, w2] = [0.4, 0.9, 1.3, -0.7];
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
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
  const elbow: IAutoMovieVector3 = {
    x: l1 * Math.cos(q1),
    y: l1 * Math.sin(q1),
    z: 0,
  };
  const result: physicalStanceDynamics.IResult = physicalStanceDynamics.solve({
    base: {
      mass: 1,
      center: { x: 0, y: 0, z: 0 },
      inertia: inertia(1),
      velocity: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      angularAcceleration: { x: 0, y: 0, z: 0 },
    },
    joints: [
      {
        pivot: { x: 0, y: 0, z: 0 },
        axes: [z],
        bodies: [
          {
            mass: m1,
            center: { x: lc1 * Math.cos(q1), y: lc1 * Math.sin(q1), z: 0 },
            inertia: inertia(I1),
            velocity: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: w1 },
          },
        ],
      },
      {
        pivot: elbow,
        axes: [z],
        bodies: [
          {
            mass: m2,
            center: {
              x: elbow.x + lc2 * Math.cos(q1 + q2),
              y: elbow.y + lc2 * Math.sin(q1 + q2),
              z: 0,
            },
            inertia: inertia(I2),
            velocity: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: w1 + w2 },
          },
        ],
      },
    ],
    gravity: { x: 0, y: -g, z: 0 },
    constrained: false,
  });
  const M11: number =
    I1 +
    I2 +
    m1 * lc1 * lc1 +
    m2 * (l1 * l1 + lc2 * lc2 + 2 * l1 * lc2 * Math.cos(q2));
  const M12: number = I2 + m2 * (lc2 * lc2 + l1 * lc2 * Math.cos(q2));
  const M22: number = I2 + m2 * lc2 * lc2;
  const h1: number =
    (m1 * lc1 + m2 * l1) * g * Math.cos(q1) +
    m2 * lc2 * g * Math.cos(q1 + q2) -
    m2 * l1 * lc2 * Math.sin(q2) * (2 * w1 * w2 + w2 * w2);
  const h2: number =
    m2 * lc2 * g * Math.cos(q1 + q2) + m2 * l1 * lc2 * Math.sin(q2) * w1 * w1;
  const failures: string[] = [];
  const near = (name: string, actual: number, expected: number): void => {
    if (
      !(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)))
    )
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  near("M11", result.mass[0]![0]!, M11);
  near("M12", result.mass[0]![1]!, M12);
  near("M21", result.mass[1]![0]!, M12);
  near("M22", result.mass[1]![1]!, M22);
  near("h1", result.bias[0]!, h1);
  near("h2", result.bias[1]!, h2);
  TestValidator.equals("two-link inverse dynamics", failures, []);
}
