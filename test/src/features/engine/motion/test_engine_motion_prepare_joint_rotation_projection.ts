import {
  AutoMovieEngineMotionJointProjection,
  AutoMovieEngineKinematics,
  AutoMovieEngineKinematicsJointRotation,
} from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";

/**
 * A caller-supplied clamp wrapper may retain every incoming clinical record.
 * Private candidate storage must never overwrite those observable inputs.
 *
 * Scenarios:
 *
 * 1. A genuine box clamp wrapped by an owned retaining function keeps each input
 *    and exact scalar/key snapshot. Every retained record stays unchanged after
 *    its query and after later A/B/A targets, without imposing a count or
 *    requiring knowledge of the producer's candidate enumeration. An ordinary
 *    wrapper keeps the original props receiver; a live getter supplying a
 *    genuine factory first and a wrapper later keeps that same
 *    retention/receiver contract whenever the wrapper is actually called.
 * 2. Flexion[-30,30] with clinical neutral10 permits rig[-40,20]. Pure X60
 *    therefore selects clinical30/rig20; X-60 selects clinical-30/rig-40. The
 *    actual paired quaternion must realize that independent endpoint.
 * 3. Editing an earlier issued winner joint/quaternion cannot change later winners
 *    or retained callback inputs, nor can a later query repair those caller
 *    edits. Known native clamp provenance never transfers to a wrapper.
 * 4. Null rest against numeric neutral: with a twist frame of neutral 90, an
 *    explicit-null-rest projector and the ordinary numeric clamp each keep
 *    their own independently derived optimum (pure X at 90 for null rest; the
 *    boundary 120 or 2 atan(1/2) degrees for numeric zero), across q, -q and q
 *    and alternating contracts, and a general swing gate keeps the same
 *    contracts.
 * 5. Another unknown wrapper returns the actual clamp's values in one reused
 *    output record. Boundary and interior targets must retain the correct
 *    selected clinical joint/raw quaternion pair after later probes overwrite
 *    that callback scratch. The box path and a general-path90-degree swing cone
 *    share these literal optima because the cone never binds flexion±30. No
 *    ownership after the callback's scope is assumed.
 */
export function test_engine_motion_prepare_joint_rotation_projection(): void {
  nullAffineFrames();
  const constraint: IAutoMovieJointConstraint = {
    flexion: { min: -30, max: 30 },
    abduction: null,
    twist: null,
  };
  const basis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
    },
    "retained clamp basis",
  );
  const skeleton: IAutoMovieSkeleton = {
    id: "retained-clamp-kernel",
    bones: [
      {
        bone: "spine",
        parent: null,
        axes: basis,
        constraint,
        rest: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: turn(0),
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    ],
  };
  const actual: ReturnType<typeof AutoMovieEngineKinematics.clampJointToSkeletonOf> =
    AutoMovieEngineKinematics.clampJointToSkeletonOf("spine", skeleton);
  for (const changing of [false, true])
    observe(actual, constraint, basis, changing);
  returnedScratch(actual, constraint, basis);
  const cone: IAutoMovieJointConstraint = { ...constraint, swingDeg: 90 };
  const general: IAutoMovieSkeleton = {
    ...skeleton,
    bones: [{ ...skeleton.bones[0]!, constraint: cone }],
  };
  returnedScratch(AutoMovieEngineKinematics.clampJointToSkeletonOf("spine", general), cone, basis);
}

/**
 * Numeric scores must remain paired with their selected values despite a
 * foreign output alias.
 */
function returnedScratch(
  actual: ReturnType<typeof AutoMovieEngineKinematics.clampJointToSkeletonOf>,
  constraint: IAutoMovieJointConstraint,
  basis: IAutoMovieJointAxes,
): void {
  const shared: IAutoMovieJointPose = {
    bone: "spine",
    flexion: 0,
    abduction: 0,
    twist: 0,
  };
  const frame: IAutoMovieRestFrame = { flexion: { sign: 1, neutral: 10 } };
  const project: AutoMovieEngineMotionJointProjection.IProjector =
    AutoMovieEngineMotionJointProjection.prepare({
      domain: { bone: "spine", constraint },
      basis,
      frame,
      clamp: (input: IAutoMovieJointPose): IAutoMovieJointPose =>
        Object.assign(shared, actual(input)),
    });
  for (const [desired, clinical, shown] of [
    [60, 30, 20],
    [-60, -30, -40],
    [0, 10, 0],
    [-15, -5, -15],
    [60, 30, 20],
  ] as const) {
    const result: AutoMovieEngineMotionJointProjection.IProjection =
      project.withQuaternion(turn(desired));
    TestValidator.predicate(
      `mutable foreign output retains its actual selected pair at cone=${constraint.swingDeg}, demand${desired}, clinical=${result.joint.flexion}`,
      nclose(result.joint.flexion!, clinical, 1e-6) &&
        qclose(result.quaternion, turn(shown), 1e-12) &&
        qclose(
          AutoMovieEngineKinematicsJointRotation.jointToQuaternionOnBasis(result.joint, basis, frame),
          result.quaternion,
          1e-12,
        ),
    );
  }
}

/**
 * Observe ordinary and later-replaced callables through their original public
 * props receiver.
 */
function observe(
  actual: ReturnType<typeof AutoMovieEngineKinematics.clampJointToSkeletonOf>,
  constraint: IAutoMovieJointConstraint,
  basis: IAutoMovieJointAxes,
  changing: boolean,
): void {
  const retained: {
    input: IAutoMovieJointPose;
    snapshot: IAutoMovieJointPose;
    keys: string[];
  }[] = [];
  const marker: object = {};
  const wrapped: Parameters<typeof AutoMovieEngineMotionJointProjection.prepare>[0]["clamp"] =
    function (this: object, input: IAutoMovieJointPose): IAutoMovieJointPose {
      TestValidator.predicate(
        "an arbitrary clamp keeps its original public props receiver",
        this === props && props.marker === marker,
      );
      retained.push({
        input,
        snapshot: { ...input },
        keys: Object.keys(input),
      });
      return actual(input);
    };
  let first: boolean = true;
  const props: Parameters<typeof AutoMovieEngineMotionJointProjection.prepare>[0] & {
    marker: object;
  } = {
    domain: { bone: "spine", constraint },
    basis,
    frame: { flexion: { sign: 1, neutral: 10 } },
    marker,
    get clamp(): Parameters<typeof AutoMovieEngineMotionJointProjection.prepare>[0]["clamp"] {
      if (changing && first) {
        first = false;
        return actual;
      }
      return wrapped;
    },
  };
  const project: AutoMovieEngineMotionJointProjection.IProjector =
    AutoMovieEngineMotionJointProjection.prepare(props);
  let previous: AutoMovieEngineMotionJointProjection.IProjection | undefined;
  for (const [desired, clinical, shown] of [
    [60, 30, 20],
    [-60, -30, -40],
    [60, 30, 20],
  ] as const) {
    const result: AutoMovieEngineMotionJointProjection.IProjection =
      project.withQuaternion(turn(desired));
    TestValidator.predicate(
      "retaining clamp still projects to the independent physical endpoint",
      nclose(result.joint.flexion!, clinical, 1e-6) &&
        result.joint.abduction === 0 &&
        result.joint.twist === 0 &&
        qclose(result.quaternion, turn(shown), 1e-12),
    );
    TestValidator.predicate(
      "every caller-retained clamp input keeps its original exact clinical fields",
      retained.every(
        (entry: {
          input: IAutoMovieJointPose;
          snapshot: IAutoMovieJointPose;
          keys: string[];
        }): boolean =>
          entry.input.bone === entry.snapshot.bone &&
          Object.is(entry.input.flexion, entry.snapshot.flexion) &&
          Object.is(entry.input.abduction, entry.snapshot.abduction) &&
          Object.is(entry.input.twist, entry.snapshot.twist) &&
          Object.keys(entry.input).join("|") === entry.keys.join("|"),
      ),
    );
    if (previous !== undefined)
      TestValidator.predicate(
        "a later winner cannot borrow or repair the caller's earlier edited result",
        result.joint !== previous.joint &&
          result.quaternion !== previous.quaternion &&
          Object.is(previous.joint.flexion, 999) &&
          Object.is(previous.quaternion.x, 888),
      );
    result.joint.flexion = 999;
    result.quaternion.x = 888;
    previous = result;
  }
  TestValidator.predicate(
    "issued-result edits never alter callback-retained inputs after the final query",
    retained.length > 0 &&
      retained.every(
        (entry: {
          input: IAutoMovieJointPose;
          snapshot: IAutoMovieJointPose;
          keys: string[];
        }): boolean =>
          Object.is(entry.input.flexion, entry.snapshot.flexion) &&
          Object.is(entry.input.abduction, entry.snapshot.abduction) &&
          Object.is(entry.input.twist, entry.snapshot.twist),
      ),
  );
}

/** Pure X articulation from the independent degree half-angle formula. */
function turn(degrees: number): IAutoMovieQuaternion {
  return {
    x: Math.sin((degrees * Math.PI) / 360),
    y: 0,
    z: 0,
    w: Math.cos((degrees * Math.PI) / 360),
  };
}

/**
 * Analytic projection distinguishes null rest from a numeric fixed clinical
 * coordinate when that axis has a nonzero affine neutral.
 *
 * Scenarios:
 *
 * 1. Explicit proximal F=X,A=Y,T=Z has F in[-120,120] and null A/T. A caller-owned
 *    matching clamp explicitly keeps those fixed axes null; T's clinical
 *    neutral90 is unused by that null rest. For the unit target
 *    (0.5,-0.5,0.5,0.5), actual pure-X dot is0.5(sin(F/2)+cos(F/2)), with its
 *    unique absolute maximum at F90. Returning F120 would expose coefficients
 *    incorrectly composed from clinical0 instead of null.
 * 2. The ordinary public clamp forces numeric inverse angles on null-ROM axes to
 *    numeric0. That case and numeric T=[0,0] both use the same frame, so rig
 *    twist is-90 about Z. Its absolute target dot is abs(sin(F/2))/sqrt(2),
 *    maximized at either F endpoint±120. T remains numeric0; no preferred
 *    endpoint tie is added. A second unit target(2/3,1/3,0,2/3) instead has a
 *    unique numeric interior maximum at F=2atan(1/2), while explicit null rest
 *    still gives90. This distinguishes wrong numeric coefficients even when
 *    boundary candidates would accidentally recover the first target's
 *    optimum.
 * 3. Alternating all three contracts with q/-q/q preserves their own domain and
 *    raw winner; edited earlier output joints/quaternions cannot poison
 *    replay.
 * 4. Adding the admitted180-degree swing gate exercises the ordinary general
 *    search. With A's neutral-90 and T's neutral90, target(0.5,0.5,-0.5,0.5) is
 *    exactly numeric clinical(0,0,0). Ordinary clamping keeps that exact
 *    target; explicit fixed nulls instead require the pure-X optimum at90.
 *    Conflating null with clinical0 must not trigger a false unchanged gate.
 */
function nullAffineFrames(): void {
  const basis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
      twistPlacement: "proximal",
    },
    "null affine oracle basis",
  );
  const frame: IAutoMovieRestFrame = { twist: { sign: 1, neutral: 90 } };

  /**
   * Matching public clamp contracts distinguish explicit null rest from numeric
   * inverse clamping.
   */
  function projector(
    twist: IAutoMovieAngleRange | null,
    rest: boolean = false,
  ): AutoMovieEngineMotionJointProjection.IProjector {
    const constraint: IAutoMovieJointConstraint = {
      flexion: { min: -120, max: 120 },
      abduction: null,
      twist,
    };
    return AutoMovieEngineMotionJointProjection.prepare({
      domain: { bone: "spine", constraint },
      basis,
      frame,
      clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
        const admitted: IAutoMovieJointPose = AutoMovieEngineKinematics.clampJointRom(joint, constraint);
        return rest ? { ...admitted, abduction: null, twist: null } : admitted;
      },
    });
  }
  const rest: AutoMovieEngineMotionJointProjection.IProjector = projector(null, true);
  const ordinary: AutoMovieEngineMotionJointProjection.IProjector = projector(null);
  const numeric: AutoMovieEngineMotionJointProjection.IProjector = projector({
    min: 0,
    max: 0,
  });
  let earlier: AutoMovieEngineMotionJointProjection.IProjection | undefined;
  const scenarios: readonly {
    target: IAutoMovieQuaternion;
    boundary: boolean;
    numericAngle: number;
    restDot: number;
    numericDot: number;
  }[] = [
    {
      target: { x: 0.5, y: -0.5, z: 0.5, w: 0.5 },
      boundary: true,
      numericAngle: 120,
      restDot: Math.SQRT1_2,
      numericDot: Math.sqrt(3 / 8),
    },
    {
      target: { x: 2 / 3, y: 1 / 3, z: 0, w: 2 / 3 },
      boundary: false,
      numericAngle: (2 * Math.atan(0.5) * 180) / Math.PI,
      restDot: (2 * Math.SQRT2) / 3,
      numericDot: Math.sqrt(10) / 6,
    },
  ];
  for (const scenario of scenarios) {
    for (const sign of [1, -1, 1]) {
      for (const [project, fixed] of [
        [rest, false],
        [ordinary, true],
        [numeric, true],
        [rest, false],
      ] as const) {
        const target: IAutoMovieQuaternion = {
          x: sign * scenario.target.x,
          y: sign * scenario.target.y,
          z: sign * scenario.target.z,
          w: sign * scenario.target.w,
        };
        const result: AutoMovieEngineMotionJointProjection.IProjection =
          project.withQuaternion(target);
        const angle: number | null = result.joint.flexion;
        TestValidator.predicate(
          "null and numeric affine axes retain their independently derived optima",
          result.joint.bone === "spine" &&
            angle !== null &&
            nclose(
              fixed && scenario.boundary ? Math.abs(angle) : angle,
              fixed ? scenario.numericAngle : 90,
              1e-6,
            ) &&
            (fixed
              ? result.joint.abduction === 0 && result.joint.twist === 0
              : result.joint.abduction === null && result.joint.twist === null),
        );
        if (angle === null) continue;
        const s: number = Math.sin((angle * Math.PI) / 360);
        const c: number = Math.cos((angle * Math.PI) / 360);
        const expected: IAutoMovieQuaternion = fixed
          ? {
              x: s * Math.SQRT1_2,
              y: -s * Math.SQRT1_2,
              z: -c * Math.SQRT1_2,
              w: c * Math.SQRT1_2,
            }
          : { x: s, y: 0, z: 0, w: c };
        const dot: number = Math.abs(
          result.quaternion.x * target.x +
            result.quaternion.y * target.y +
            result.quaternion.z * target.z +
            result.quaternion.w * target.w,
        );
        TestValidator.predicate(
          "paired winner is its actual clinical articulation and maximum physical dot",
          qclose(result.quaternion, expected, 1e-12) &&
            nclose(dot, fixed ? scenario.numericDot : scenario.restDot, 1e-12),
        );
        if (earlier !== undefined)
          TestValidator.predicate(
            "alternating domains cannot borrow or repair an earlier caller result",
            earlier.joint.flexion === 456 &&
              earlier.quaternion.x === 123 &&
              result.joint !== earlier.joint &&
              result.quaternion !== earlier.quaternion,
          );
        result.joint.flexion = 456;
        result.quaternion.x = 123;
        earlier = result;
      }
    }
  }
  generalFallback(basis);
}

/**
 * A non-box gate must compare actual null-rest articulation before keeping a
 * raw inverse.
 */
function generalFallback(basis: IAutoMovieJointAxes): void {
  const constraint: IAutoMovieJointConstraint = {
    flexion: { min: -120, max: 120 },
    abduction: null,
    twist: null,
    swingDeg: 180,
  };
  const frame: IAutoMovieRestFrame = {
    abduction: { sign: 1, neutral: -90 },
    twist: { sign: 1, neutral: 90 },
  };
  const angularRoundoff: number =
    (8 * Math.sqrt(Number.EPSILON) * 180) / Math.PI;
  for (const rest of [true, false]) {
    const project: AutoMovieEngineMotionJointProjection.IProjector =
      AutoMovieEngineMotionJointProjection.prepare({
        domain: { bone: "spine", constraint },
        basis,
        frame,
        clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
          const admitted: IAutoMovieJointPose = AutoMovieEngineKinematics.clampJointRom(
            joint,
            constraint,
          );
          return rest
            ? { ...admitted, abduction: null, twist: null }
            : admitted;
        },
      });
    for (const sign of [1, -1]) {
      const target: IAutoMovieQuaternion = {
        x: sign * 0.5,
        y: sign * 0.5,
        z: sign * -0.5,
        w: sign * 0.5,
      };
      const result: AutoMovieEngineMotionJointProjection.IProjection =
        project.withQuaternion(target);
      const angle: number | null = result.joint.flexion;
      TestValidator.predicate(
        "general projection keeps each actual fixed-coordinate contract",
        angle !== null &&
          nclose(angle, rest ? 90 : 0, rest ? angularRoundoff : 1e-6) &&
          (rest
            ? result.joint.abduction === null && result.joint.twist === null
            : result.joint.abduction === 0 && result.joint.twist === 0),
      );
      if (angle === null) continue;
      const expected: IAutoMovieQuaternion = rest
        ? {
            x: Math.sin((angle * Math.PI) / 360),
            y: 0,
            z: 0,
            w: Math.cos((angle * Math.PI) / 360),
          }
        : { x: 0.5, y: 0.5, z: -0.5, w: 0.5 };
      const dot: number = Math.abs(
        result.quaternion.x * target.x +
          result.quaternion.y * target.y +
          result.quaternion.z * target.z +
          result.quaternion.w * target.w,
      );
      TestValidator.predicate(
        "general fallback scores actual articulation against the original physical demand",
        qclose(result.quaternion, expected, 1e-12) &&
          nclose(dot, rest ? Math.SQRT1_2 : 1, 1e-12),
      );
    }
  }
}
