import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  clampJointToSkeleton,
  prepareJointRotationProjection,
  solveDistalTwist,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A native two-axis wrist chord can spare losing distal projections while
 * every selected joint and quaternion stays bit-identical to ordinary scoring.
 *
 * Scenarios:
 *
 * 1. Signed cardinal bases under both factor orders bound projected wrist
 *    rotations throughout a grid of three-axis targets.
 * 2. Native distal results match the exact same projector behind an opaque
 *    wrapper, including zero signs and both selected clinical joint records.
 * 3. Wrappers, a mismatched clamp domain, nonzero fixed twist and an explicit
 *    rotation chart decline the certificate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the supported axes, the signed result oracle and the unsupported projector cases.
 * @evidence contracts/development/testing.md#behavioral-verification Drives public distal fitting with actual native and wrapped paired projectors, measuring selected joints and quaternion components.
 * @evidence contracts/development/testing.md#independent-expectations The actual clamped projection's quaternion geodesic independently bounds the chord. Object.is compares each result against the same unpruned projector reached through a wrapper.
 * @evidence contracts/development/testing.md#distinguishing-cases Two factor orders, reflected/permuted axes, positive and zero bounds, and unsupported callback/domain/fixed-twist cases.
 * @evidence contracts/development/testing.md#execution-ownership Runs in-memory joint and quaternion operations under one discovered test function.
 */
export function test_kinematics_distal_wrist_chord(): void {
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const skeleton: IAutoMovieSkeleton = { id: "distal-wrist-chord", bones: [] };
  const clamp: ReturnType<typeof clampJointToSkeleton.of> =
    clampJointToSkeleton.of("rightHand", skeleton);
  const domain: Parameters<typeof prepareJointRotationProjection>[0]["domain"] =
    {
      bone: "rightHand",
      constraint: DEFAULT_HUMANOID_ROM.rightHand!,
    };
  const lowerBasis: IAutoMovieJointAxes = {
    flexion: x,
    abduction: y,
    twist: z,
    twistPlacement: "distal",
  };
  const basisList: IAutoMovieJointAxes[] = [
    { flexion: x, abduction: y, twist: z },
    {
      flexion: { ...z, z: -1 },
      abduction: x,
      twist: y,
      twistPlacement: "distal",
    },
  ];
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const failures: string[] = [];
  let active: number = 0;

  for (const basis of basisList) {
    const projector: ReturnType<typeof prepareJointRotationProjection> =
      prepareJointRotationProjection({ domain, basis, clamp });
    const chord: NonNullable<
      ReturnType<typeof prepareJointRotationProjection.wristChord>
    > = prepareJointRotationProjection.wristChord(projector.withQuaternion)!;
    const opaque: typeof projector.withQuaternion = (
      rotation: IAutoMovieQuaternion,
    ): ReturnType<typeof projector.withQuaternion> =>
      projector.withQuaternion(rotation);
    TestValidator.equals(
      "opaque paired callback",
      prepareJointRotationProjection.wristChord(opaque),
      undefined,
    );
    for (const f of [-100, -30, 0, 85])
      for (const a of [-80, 0, 24, 70])
        for (const t of [-110, 0, 8, 120]) {
          const rotation: IAutoMovieQuaternion = Quaternion.multiply(
            Quaternion.fromAxisAngle(z, t),
            Quaternion.multiply(
              Quaternion.fromAxisAngle(y, a),
              Quaternion.fromAxisAngle(x, f),
            ),
          );
          const shown: IAutoMovieQuaternion =
            projector.withQuaternion(rotation).quaternion;
          const miss: number = Quaternion.angleAfterNormalize(shown, rotation);
          const floor: number = chord(rotation);
          if (floor > 0) active++;
          if (floor > miss * miss) failures.push(`bound at ${f}/${a}/${t}`);
          const props: Parameters<typeof solveDistalTwist.withProjection>[0] = {
            joint: {
              bone: "rightLowerArm",
              flexion: 42,
              abduction: 0,
              twist: 0,
            },
            effector: { bone: "rightHand", flexion: 0, abduction: 0, twist: 0 },
            above: identity,
            lowerBasis,
            lowerFrame: undefined,
            effectorRest: identity,
            effectorBasis: basis,
            effectorFrame: undefined,
            rotation,
            skeleton,
            projectEffector: projector,
            projectEffectorWithQuaternion: projector.withQuaternion,
          };
          const bounded: solveDistalTwist.IResult =
            solveDistalTwist.withProjection(props);
          const ordinary: solveDistalTwist.IResult =
            solveDistalTwist.withProjection({
              ...props,
              projectEffectorWithQuaternion: opaque,
            });
          if (
            !(
              sameJoint(bounded.joint, ordinary.joint) &&
              sameJoint(bounded.projection.joint, ordinary.projection.joint) &&
              sameQuaternion(
                bounded.projection.local,
                ordinary.projection.local,
              ) &&
              sameQuaternion(
                bounded.projection.quaternion,
                ordinary.projection.quaternion,
              )
            )
          )
            failures.push(`winner at ${f}/${a}/${t}`);
        }

    const unmatched: typeof projector = prepareJointRotationProjection({
      domain: { ...domain, constraint: { ...domain.constraint! } },
      basis,
      clamp,
    });
    const offset: typeof projector = prepareJointRotationProjection({
      domain,
      basis,
      clamp,
      frame: { twist: { neutral: 5, sign: 1 } },
    });
    const charted: typeof projector = prepareJointRotationProjection({
      domain,
      clamp,
      basis: { ...basis, rotationOrder: "flexion-abduction-twist" },
    });
    TestValidator.equals(
      "mismatched bound domain",
      prepareJointRotationProjection.wristChord(unmatched.withQuaternion),
      undefined,
    );
    TestValidator.equals(
      "nonzero rig twist",
      prepareJointRotationProjection.wristChord(offset.withQuaternion),
      undefined,
    );
    TestValidator.equals(
      "explicit rotation chart",
      prepareJointRotationProjection.wristChord(charted.withQuaternion),
      undefined,
    );
  }
  TestValidator.predicate("nontrivial wrist bounds", active > 0);
  TestValidator.equals(
    "conservative bounds and unchanged actual winners",
    failures,
    [],
  );
}

/** Compare the actual selected clinical coordinates including signed zero. */
function sameJoint(a: IAutoMovieJointPose, b: IAutoMovieJointPose): boolean {
  return (
    a.bone === b.bone &&
    Object.is(a.flexion, b.flexion) &&
    Object.is(a.abduction, b.abduction) &&
    Object.is(a.twist, b.twist)
  );
}

/** Compare all actual raw quaternion components including signed zero. */
function sameQuaternion(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): boolean {
  return (
    Object.is(a.x, b.x) &&
    Object.is(a.y, b.y) &&
    Object.is(a.z, b.z) &&
    Object.is(a.w, b.w)
  );
}
