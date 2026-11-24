import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  clampJointToSkeleton,
  prepareJointRotationProjection,
  solveDistalTwist,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The declared flexion-abduction-twist order remains active in orientation
 * projection and forearm twist fitting.
 *
 * Scenarios:
 *
 * 1. For rotations outside the wrist box, the projected orientation beats
 *    a grid of legal flexion-abduction rotations composed in declared order.
 * 2. Distal fitting reaches rotations made by independently composing legal
 *    forearm twist and charted wrist angles for either twist-axis sign.
 */
export function test_unit_engine_kinematics_joint_chart_projection(): void {
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const frame: IAutoMovieQuaternion = Quaternion.identity();
  const skeleton: IAutoMovieSkeleton = {
    id: "joint-chart-projection",
    bones: [],
  };
  const constraint = DEFAULT_HUMANOID_ROM.rightHand!;
  const clamp: ReturnType<typeof clampJointToSkeleton.of> =
    clampJointToSkeleton.of("rightHand", skeleton);
  const lowerBasis: IAutoMovieJointAxes = {
    flexion: x,
    abduction: y,
    twist: z,
    twistPlacement: "distal",
  };
  const failures: string[] = [];

  /** Compose a wrist angle pair without reading the engine's chart. */
  const wrist = (flexion: number, abduction: number): IAutoMovieQuaternion =>
    Quaternion.multiply(
      Quaternion.fromAxisAngle(x, flexion),
      Quaternion.fromAxisAngle(y, abduction),
    );

  const grid: IAutoMovieQuaternion[] = [];
  for (
    let f: number = constraint.flexion!.min;
    f <= constraint.flexion!.max;
    f += 2
  )
    for (
      let a: number = constraint.abduction!.min;
      a <= constraint.abduction!.max;
      a += 2
    )
      grid.push(wrist(f, a));
  for (const sign of [-1, 1] as const) {
    const basis: IAutoMovieJointAxes = {
      flexion: x,
      abduction: y,
      twist: { ...z, z: sign },
      rotationOrder: "flexion-abduction-twist",
    };
    const projector: ReturnType<typeof prepareJointRotationProjection> =
      prepareJointRotationProjection({
        domain: { bone: "rightHand", constraint },
        basis,
        clamp,
      });
    for (const [f, a, t] of [
      [83, -47, 42],
      [-115, 67, -32],
      [67, 37, 49],
      [-62, -40, 65],
    ] as const) {
      const target: IAutoMovieQuaternion = Quaternion.multiply(
        wrist(f, a),
        Quaternion.fromAxisAngle(z, t),
      );
      const projected: IAutoMovieQuaternion =
        projector.withQuaternion(target).quaternion;
      const error: number = Quaternion.angleAfterNormalize(projected, target);
      const best: number = Math.min(
        ...grid.map((legal: IAutoMovieQuaternion): number =>
          Quaternion.angleAfterNormalize(legal, target),
        ),
      );
      if (error > best + 1e-12) failures.push(`grid ${sign}/${f}/${a}/${t}`);
    }
    for (const [t, f, a] of [
      [15, 23, 12],
      [-25, -37, -21],
      [38, 58, 3],
    ] as const) {
      const target: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle(z, t),
        wrist(f, a),
      );
      const result: solveDistalTwist.IResult = solveDistalTwist.withProjection({
        joint: { bone: "rightLowerArm", flexion: 0, abduction: 0, twist: 0 },
        effector: { bone: "rightHand", flexion: 0, abduction: 0, twist: 0 },
        above: frame,
        lowerBasis,
        lowerFrame: undefined,
        effectorRest: frame,
        effectorBasis: basis,
        effectorFrame: undefined,
        rotation: target,
        skeleton,
        projectEffector: projector,
        projectEffectorWithQuaternion: projector.withQuaternion,
      });
      const error: number = Quaternion.angleAfterNormalize(
        result.projection.quaternion,
        result.projection.local,
      );
      if (error > 1e-8)
        failures.push(`reachable ${sign}/${t}/${f}/${a}: ${error}`);
    }
  }
  TestValidator.equals(
    "declared chart projection and distal rotation",
    failures,
    [],
  );
}
