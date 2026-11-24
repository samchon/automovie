import {
  Quaternion,
  decomposeJointRotation,
  decomposeJointRotationOnBasis,
  jointToQuaternion,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointRotationDomain,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { qclose } from "../../../../features/internal/qclose";

/**
 * A bone can explicitly compose flexion, then abduction, then twist.
 *
 * Scenarios:
 * 1. Opposite-handed Cartesian and rotated bases compose noncommuting
 *    angles under a signed clinical frame. Direct, mutable, fixed and
 *    scalar prepared readers agree with independent axis-angle products.
 * 2. Both abduction gimbals pin the last angle. An alternate chart
 *    reconstructs the same quaternion and selects the ROM-compatible fold.
 * 3. The same angles still produce the original components for undeclared
 *    orders on the legacy proximal and distal bases.
 *
 * @see https://www.isbweb.org/standards/hip.pdf
 * @evidence contracts/development/common.md#meaningful-documentation Defines the axes, analogous ISB order, signs, alias domain and scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine package's public wrappers and basis readers, comparing actual products and reported angles and reconstructing the gimbal and folded attitudes.
 * @evidence contracts/development/testing.md#independent-expectations Three independent principal-axis quaternions composed in the declared order supply orientation. The authored signed frame supplies exact chart coordinates and the folded interval excludes the principal reading.
 * @evidence contracts/development/testing.md#distinguishing-cases Cartesian and dense axes, both handednesses, mutable frame reads, both abduction gimbals, a near-gimbal, a folded principal angle and both legacy defaults.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable CPU-only feature uses fixed axes and an in-memory angle grid.
 */
export function test_motion_dynamics_joint_rotation_order(): void {
  const spin: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 2, z: 3 },
    29,
  );
  const frame: IAutoMovieRestFrame = {
    flexion: { sign: -1, neutral: 10 },
    abduction: { sign: 1, neutral: -5 },
    twist: { sign: -1, neutral: 20 },
  };
  for (const dense of [false, true]) {
    for (const hand of [-1, 1]) {
      const axes: IAutoMovieJointAxes = {
        flexion: { x: 1, y: 0, z: 0 },
        abduction: { x: 0, y: 1, z: 0 },
        twist: { x: 0, y: 0, z: hand },
      };
      if (dense) {
        axes.flexion = Quaternion.rotateVector(spin, axes.flexion);
        axes.abduction = Quaternion.rotateVector(spin, axes.abduction);
        axes.twist = Quaternion.rotateVector(spin, axes.twist);
      }
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        {
          ...axes,
          twistPlacement: "distal",
          rotationOrder: "flexion-abduction-twist",
        },
        "test clinical order",
      );
      const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
        jointToQuaternionOnBasis.prepare(basis, frame);
      const mutable: ReturnType<
        typeof jointToQuaternionOnBasis.prepareMutable
      > = jointToQuaternionOnBasis.prepareMutable(basis);
      const queried: typeof compose = jointToQuaternionOnBasis.prepareQueries(
        basis,
        frame,
        {
          abduction: [-19],
          twist: [39],
        },
      )();
      const scalar = jointToQuaternionOnBasis.prepareScalarQueries(
        basis,
        frame,
        {
          flexion: [0, 28],
          abduction: [-19],
          twist: [39],
        },
      )();
      const inverse: ReturnType<
        ReturnType<typeof decomposeJointRotationOnBasis.prepareQueries>
      > = decomposeJointRotationOnBasis.prepareQueries(basis, frame)();

      for (const [f, a, t] of [
        [28, -19, 39],
        [0, -19, 39],
        [28, 90, 39],
        [28, -90, 39],
        [28, 89.9999, 39],
      ] as const) {
        const label: string =
          (dense ? "dense " : "cardinal ") + hand + " at " + a;
        const clinical: IAutoMovieResolvedJointAngles = {
          flexion: 10 - f,
          abduction: a - 5,
          twist: 20 - t,
        };
        const expected: IAutoMovieQuaternion = Quaternion.multiply(
          Quaternion.fromAxisAngle(basis.flexion, f),
          Quaternion.multiply(
            Quaternion.fromAxisAngle(basis.abduction, a),
            Quaternion.fromAxisAngle(basis.twist, t),
          ),
        );
        const direct: IAutoMovieQuaternion = jointToQuaternion(
          clinical,
          basis,
          frame,
        );
        TestValidator.predicate(
          label + " independent ordered product",
          qclose(direct, expected),
        );
        const prepared: IAutoMovieQuaternion[] = [
          compose(clinical),
          mutable(clinical, frame),
          queried(clinical),
          scalar(
            clinical,
            (x, y, z, w): IAutoMovieQuaternion => ({ x, y, z, w }),
            undefined,
          ),
        ];
        for (const actual of prepared)
          TestValidator.predicate(
            label + " prepared bit parity",
            Object.is(actual.x, direct.x) &&
              Object.is(actual.y, direct.y) &&
              Object.is(actual.z, direct.z) &&
              Object.is(actual.w, direct.w),
          );

        const reading: IAutoMovieResolvedJointAngles = inverse(expected);
        const directInverse: IAutoMovieResolvedJointAngles =
          decomposeJointRotation(expected, basis, frame);
        TestValidator.equals(
          label + " prepared extraction parity",
          reading,
          directInverse,
        );
        TestValidator.predicate(
          label + " reconstructs orientation",
          qclose(compose(reading), expected),
        );
        TestValidator.predicate(
          label + " expected chart",
          Math.abs(a) === 90
            ? nclose(reading.abduction, clinical.abduction, 1e-8) &&
                nclose(reading.twist, 20, 1e-8)
            : nclose(reading.flexion, clinical.flexion, 1e-6) &&
                nclose(reading.abduction, clinical.abduction, 1e-6) &&
                nclose(reading.twist, clinical.twist, 1e-6),
        );
      }

      const fold: IAutoMovieResolvedJointAngles = {
        flexion: -18,
        abduction: 105,
        twist: -19,
      };
      const outside: IAutoMovieJointRotationDomain = {
        bone: "leftUpperLeg",
        constraint: {
          flexion: { min: -19, max: -17 },
          abduction: { min: 104, max: 106 },
          twist: { min: -20, max: -18 },
        },
      };
      const folded: IAutoMovieQuaternion = compose(fold);
      const score: { overshoot: number } = { overshoot: NaN };
      const selected: IAutoMovieResolvedJointAngles =
        decomposeJointRotationOnBasis.scored(
          folded,
          basis,
          frame,
          outside,
          score,
        );
      const preparedFold: IAutoMovieResolvedJointAngles =
        decomposeJointRotationOnBasis.prepareQueries(basis, frame, outside)()(
          folded,
        );
      TestValidator.equals(
        "prepared folded chart parity",
        preparedFold,
        selected,
      );
      TestValidator.predicate(
        "bounded inverse selects the equivalent folded chart",
        score.overshoot === 0 &&
          nclose(selected.flexion, fold.flexion, 1e-9) &&
          nclose(selected.abduction, fold.abduction, 1e-9) &&
          nclose(selected.twist, fold.twist, 1e-9) &&
          qclose(compose(selected), folded),
      );

      for (const twistPlacement of ["proximal", "distal"] as const) {
        const legacy: IAutoMovieJointAxes = normalizeJointAxes(
          { ...axes, twistPlacement },
          "test legacy order",
        );
        const joint: IAutoMovieResolvedJointAngles = {
          flexion: 28,
          abduction: -19,
          twist: 39,
        };
        const f: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          legacy.flexion,
          joint.flexion,
        );
        const a: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          legacy.abduction,
          joint.abduction,
        );
        const t: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          legacy.twist,
          joint.twist,
        );
        const expected: IAutoMovieQuaternion =
          twistPlacement === "proximal"
            ? Quaternion.multiply(t, Quaternion.multiply(a, f))
            : Quaternion.multiply(a, Quaternion.multiply(f, t));
        const actual: IAutoMovieQuaternion = jointToQuaternionOnBasis(
          joint,
          legacy,
        );
        TestValidator.predicate(
          "legacy Hamilton grouping is bit exact",
          Object.is(actual.x, expected.x) &&
            Object.is(actual.y, expected.y) &&
            Object.is(actual.z, expected.z) &&
            Object.is(actual.w, expected.w),
        );
      }
    }
  }
}
