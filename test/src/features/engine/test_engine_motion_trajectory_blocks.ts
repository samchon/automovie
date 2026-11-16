import { Quaternion, integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Same-unit matrix error control is independent of zero scalar entries,
 * orthogonal column coordinates and common unit scale, while preserving
 * the orientation's own accuracy.
 *
 * X'=t^5 E_01, X(0)=I has X(t)=I+t^6 E_01/6. Right multiplying both by an
 * orthogonal V and multiplying by a common scale changes representation,
 * not its Frobenius relative error. Some individual entries start at zero
 * with a sixth-order onset; their scalar relative error cannot be made
 * small by shrinking the first step. The matrix norm remains well-defined.
 * The independent orientation has omega_x=1+sin(2 pi t), with angle
 * t+(1-cos(2 pi t))/(2 pi). At a 1e-10 relative precision request, compare
 * both blocks' closed forms within the trajectory suite's 1e-6 accuracy.
 * This is an observed analytic regression, not a global-error certificate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both ODEs, closed forms, coordinate and unit transforms, precision request and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public adaptive integration with a nine-scalar block and independent orientation; scalar-zero domination, a wrong block denominator, diluted orientation error or an invalid partition reaching f fails.
 * @evidence contracts/development/testing.md#independent-expectations Integrating t^5 gives t^6/6, integrating the sinusoidal angular rate gives the stated angle, and orthogonal matrix multiplication preserves the Frobenius norm.
 * @evidence contracts/development/testing.md#distinguishing-cases Identity and mixed orthogonal bases, three common unit scales, zero and nonzero matrix entries, q-only contrast, 21 playback instants and invalid zero/fractional/nonfinite/incomplete/sparse partitions.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory unit test through the existing engine API; it starts no process or host.
 */
export function test_engine_motion_trajectory_blocks(): void {
  const findings: string[] = [];
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const axes: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const tight: integrateMotionTrajectory.ITolerance = {
    relative: 1e-10,
    absolute: 0,
  };
  const rate: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => ({ x: 1 + Math.sin(2 * Math.PI * t), y: 0, z: 0 });
  const primal: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (t: number): integrateMotionTrajectory.IRate => ({
        dx: [],
        w: rate(t),
      }),
      x0: [],
      q0: identity,
      t0: 0,
      t1: 1,
      tolerance: tight,
    });
  const component: (v: IAutoMovieVector3, i: number) => number = (
    v: IAutoMovieVector3,
    i: number,
  ): number => (i === 0 ? v.x : i === 1 ? v.y : v.z);
  for (const basis of [
    identity,
    Quaternion.fromAxisAngle({ x: 1, y: 2, z: 3 }, 41),
  ])
    for (const scale of [1e-3, 1, 1e3]) {
      const columns: IAutoMovieVector3[] = axes.map(
        (axis: IAutoMovieVector3): IAutoMovieVector3 =>
          Quaternion.rotateVector(basis, axis),
      );
      const initial: number[] = Array.from(
        { length: 9 },
        (_: unknown, i: number): number =>
          scale * component(columns[i % 3]!, Math.floor(i / 3)),
      );
      const rhs: (t: number) => number[] = (t: number): number[] =>
        Array.from({ length: 9 }, (_: unknown, i: number): number =>
          i < 3 ? scale * columns[i]!.y * t ** 5 : 0,
        );
      const flight: integrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({
          f: (t: number): integrateMotionTrajectory.IRate => ({
            dx: rhs(t),
            w: rate(t),
          }),
          x0: initial,
          q0: identity,
          t0: 0,
          t1: 1,
          tolerance: { ...tight, blocks: [9] },
        });
      for (let k: number = 0; k <= 20; k++) {
        const t: number = k / 20;
        const state: integrateMotionTrajectory.IState = flight.at(t);
        const angle: number =
          t + (1 - Math.cos(2 * Math.PI * t)) / (2 * Math.PI);
        const expectedQ: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          axes[0]!,
          (angle * 180) / Math.PI,
        );
        if (
          !(Quaternion.angle(state.q!, expectedQ) <= 1e-6) ||
          !(Quaternion.angle(primal.at(t).q!, expectedQ) <= 1e-6)
        )
          findings.push(`physical orientation at ${t}, scale ${scale}`);
        for (let i: number = 0; i < 9; i++) {
          const expected: number =
            initial[i]! / scale + (i < 3 ? (columns[i]!.y * t ** 6) / 6 : 0);
          if (!(Math.abs(state.x[i]! / scale - expected) <= 1e-6))
            findings.push(`matrix entry ${i} at ${t}, scale ${scale}`);
        }
      }
    }
  const sparse: number[] = new Array<number>(2);
  sparse[1] = 9;
  for (const blocks of [
    [0],
    [1.5],
    [Number.POSITIVE_INFINITY],
    [8],
    [],
    sparse,
  ]) {
    let invoked: boolean = false;
    let refused: boolean = false;
    try {
      integrateMotionTrajectory({
        f: (): integrateMotionTrajectory.IRate => {
          invoked = true;
          return { dx: Array.from({ length: 9 }, (): number => 0) };
        },
        x0: Array.from({ length: 9 }, (): number => 0),
        t0: 0,
        t1: 1,
        tolerance: { ...tight, blocks },
      });
    } catch {
      refused = true;
    }
    if (!refused || invoked)
      findings.push(
        `invalid blocks ${JSON.stringify(blocks)} reached integration`,
      );
  }
  TestValidator.predicate(
    `matrix error control: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
