import {
  type IAutoMovieRestFrame,
  clampJointRom,
  jointRomOvershoot,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { qunit } from "../internal/qunit";

/**
 * Prepared axis factors and paired projections preserve physical rotations.
 *
 * Scenarios:
 * 1. One prepared composer reads changing clinical angles on a fixed admitted
 *    basis/frame. A/B/A results follow independent F-about-X and T-about-Z
 *    geometry, with proximal/distal order distinguished by the Y component.
 *    Earlier returned quaternions remain owned. Nonfinite F/A/T records fail
 *    in order even after warming, recover on valid input, and null rest does
 *    not admit an unused invalid clinical frame at preparation time.
 * 2. Paired projection clips a hinge to both authored endpoints for q and -q;
 *    a nonzero fixed F/T domain has its unique rotation. Raw paired results
 *    match direct public composition, and poisoning an earlier wrapper,
 *    quaternion and joint cannot affect later targets on that same projector.
 * 3. A reachable three-mobile-axis target stays reachable; an outside coupled
 *    target returns legal angles with a matching raw quaternion. No fallback
 *    global minimum or speed/work-count guarantee is asserted.
 *
 * Degrees are clinical; quaternions are local articulations. On the cardinal
 * basis, for f=F/2 and t=T/2 in radians, Tz*Fx is
 * (sin(f)cos(t), sin(f)sin(t), cos(f)sin(t), cos(f)cos(t)).
 * Fx*Tz reverses only its Y sign. The fixed affine clinical maps give the
 * rig angles before this equation is applied. These physical expectations
 * use existing qclose precision; raw component identity is a secondary API
 * equivalence check, not an independent nearest-rotation oracle.
 *
 * Basis, frame, domain and matching clamp stay unchanged for each factory.
 * Only caller-owned clinical records or returned values change. The direct
 * and prepared composer share code, so raw parity alone cannot prove their
 * geometry. No producer candidates, stored outputs or fitted limits supply
 * an expectation, and these deferred CPU cases start no execution process.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three causes, degrees/local frames, two independent factor equations, fixed factory lifetime, output ownership, admission order and the limits of raw parity and fallback checks.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepared/direct composition and the paired projector with its actual clamp, observes mutable clinical reads, ordered failures/recovery, raw outputs, admitted rotations and isolation after caller mutation.
 * @evidence contracts/development/testing.md#independent-expectations Two cardinal-axis quaternion factors give the primary physical result and order sign; interval geometry gives each hinge endpoint and the fixed domain's unique rotation. Public raw composition is used only for paired/equivalence semantics, not as the nearest-rotation oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Proximal/distal noncommuting factors, mirrored affine clinical mapping, A/B/A on one angle object, warmed good/invalid/good inputs, null versus invalid used frames, positive/negative hinge requests and quaternion signs, fixed nonzero axes, poisoned earlier outputs and bounded fallback feasibility.
 * @evidence contracts/development/testing.md#execution-ownership One portable test_motion_joint_rotation_prepared_scope entry owns its finite engine rig records and collects failures without a Human imitation, new motion producer, foreign replacement, runner or host. Existing tests own the larger optimum/degeneracy matrix and actual Human FK.
 */
export function test_motion_joint_rotation_prepared_scope(): void {
  const failures: string[] = [];
  function check(label: string, condition: boolean): void {
    if (!condition) failures.push(label);
  }
  function scenario(label: string, task: () => void): void {
    try {
      task();
    } catch (error) {
      failures.push(`${label}: ${String(error)}`);
    }
  }
  function sameRaw(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
    return (
      Object.is(a.x, b.x) &&
      Object.is(a.y, b.y) &&
      Object.is(a.z, b.z) &&
      Object.is(a.w, b.w)
    );
  }
  function physical(
    flexion: number,
    twist: number,
    placement: "proximal" | "distal" = "proximal",
  ): IAutoMovieQuaternion {
    const f: number = (flexion * Math.PI) / 360;
    const t: number = (twist * Math.PI) / 360;
    return {
      x: Math.sin(f) * Math.cos(t),
      y: Math.sin(f) * Math.sin(t) * (placement === "proximal" ? 1 : -1),
      z: Math.cos(f) * Math.sin(t),
      w: Math.cos(f) * Math.cos(t),
    };
  }
  function errorOf(task: () => unknown): unknown {
    try {
      task();
    } catch (error) {
      return error;
    }
    return undefined;
  }
  function refused(
    label: string,
    direct: () => unknown,
    prepared: () => unknown,
    message: string,
  ): void {
    const a: unknown = errorOf(direct);
    const b: unknown = errorOf(prepared);
    check(
      label,
      a instanceof Error &&
        b instanceof Error &&
        a.constructor === b.constructor &&
        a.message === b.message &&
        b.message.includes(message),
    );
  }
  const canonical: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };

  for (const placement of ["proximal", "distal"] as const)
    scenario(`prepared factors ${placement}`, (): void => {
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        { ...canonical, twistPlacement: placement },
        "prepared factor basis",
      );
      const frame: IAutoMovieRestFrame = {
        flexion: { sign: -1, neutral: 10 },
        twist: { sign: 1, neutral: -5 },
      };
      const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
        jointToQuaternionOnBasis.prepare(basis, frame);
      const joint: IAutoMovieJointPose = {
        bone: "spine",
        flexion: 40,
        abduction: null,
        twist: 15,
      };
      function inspect(
        label: string,
        f: number,
        t: number,
      ): IAutoMovieQuaternion {
        const actual: IAutoMovieQuaternion = compose(joint);
        check(
          `${label} physical factors`,
          qunit(actual) && qclose(actual, physical(f, t, placement)),
        );
        check(
          `${label} raw parity`,
          sameRaw(actual, jointToQuaternionOnBasis(joint, basis, frame)),
        );
        return actual;
      }
      const a: IAutoMovieQuaternion = inspect("A", -30, 20);
      joint.flexion = -20;
      joint.twist = -25;
      const b: IAutoMovieQuaternion = inspect("B", 30, -20);
      joint.flexion = 40;
      joint.twist = 15;
      const restored: IAutoMovieQuaternion = inspect("restored A", -30, 20);
      check("separate quaternion records", a !== b && a !== restored);
      check(
        "later reads preserve earlier values",
        qclose(a, physical(-30, 20, placement)) &&
          qclose(b, physical(30, -20, placement)),
      );
      a.x = Number.NaN;
      inspect("after returned quaternion mutation", -30, 20);

      joint.flexion = Number.NaN;
      joint.abduction = Infinity;
      joint.twist = Number.NaN;
      function invalid(axis: string): void {
        refused(
          `current ${axis} admission`,
          (): IAutoMovieQuaternion =>
            jointToQuaternionOnBasis(joint, basis, frame),
          (): IAutoMovieQuaternion => compose(joint),
          axis,
        );
      }
      invalid("flexion");
      joint.flexion = 40;
      invalid("abduction");
      joint.abduction = null;
      invalid("twist");
      joint.twist = 15;
      inspect("valid after invalid records", -30, 20);
    });

  scenario("unused versus used invalid frame", (): void => {
    const basis: IAutoMovieJointAxes = normalizeJointAxes(
      canonical,
      "null rest",
    );
    const frame: IAutoMovieRestFrame = {
      flexion: { sign: 1, neutral: Number.NaN },
    };
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
      jointToQuaternionOnBasis.prepare(basis, frame);
    const joint: IAutoMovieJointPose = {
      bone: "spine",
      flexion: null,
      abduction: null,
      twist: null,
    };
    check(
      "unused frame stays at rest",
      qclose(compose(joint), physical(0, 0)) &&
        sameRaw(compose(joint), jointToQuaternionOnBasis(joint, basis, frame)),
    );
    joint.flexion = 0;
    joint.abduction = Infinity;
    refused(
      "used flexion frame precedes abduction angle",
      (): IAutoMovieQuaternion => jointToQuaternionOnBasis(joint, basis, frame),
      (): IAutoMovieQuaternion => compose(joint),
      "neutral",
    );
    joint.flexion = null;
    joint.abduction = null;
    check(
      "rest recovers after frame refusal",
      qclose(compose(joint), physical(0, 0)),
    );
  });

  const basis: IAutoMovieJointAxes = normalizeJointAxes(
    canonical,
    "paired basis",
  );
  function projector(
    constraint: IAutoMovieJointConstraint,
  ): prepareJointRotationProjection.IProjector {
    return prepareJointRotationProjection({
      domain: { bone: "spine", constraint },
      basis,
      clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
        clampJointRom(joint, constraint, { axes: basis }),
    });
  }
  function paired(
    label: string,
    project: prepareJointRotationProjection.IProjector,
    target: IAutoMovieQuaternion,
    constraint: IAutoMovieJointConstraint,
    expected?: IAutoMovieQuaternion,
  ): prepareJointRotationProjection.IProjection {
    const result: prepareJointRotationProjection.IProjection =
      project.withQuaternion(target);
    const ordinary: IAutoMovieJointPose = project(target);
    check(`${label} bone`, result.joint.bone === "spine");
    for (const axis of ["flexion", "abduction", "twist"] as const) {
      const actual: number | null = result.joint[axis];
      const expectedAngle: number | null = ordinary[axis];
      check(
        `${label} callable ${axis} parity`,
        actual === null || expectedAngle === null
          ? actual === expectedAngle
          : nclose(actual, expectedAngle, 0),
      );
    }
    check(
      `${label} raw pair`,
      sameRaw(result.quaternion, jointToQuaternionOnBasis(result.joint, basis)),
    );
    check(`${label} finite unit rotation`, qunit(result.quaternion));
    check(
      `${label} actual ROM`,
      nclose(jointRomOvershoot(result.joint, constraint, { axes: basis }), 0),
    );
    if (expected !== undefined)
      check(
        `${label} independent physical rotation`,
        qclose(result.quaternion, expected),
      );
    return result;
  }

  scenario("paired hinge endpoints and ownership", (): void => {
    const constraint: IAutoMovieJointConstraint = {
      flexion: { min: -25, max: 40 },
      abduction: null,
      twist: null,
    };
    const project: prepareJointRotationProjection.IProjector =
      projector(constraint);
    for (const [wanted, admitted] of [
      [-60, -25],
      [75, 40],
    ] as const)
      for (const sign of [1, -1]) {
        const rotation: IAutoMovieQuaternion = physical(wanted, 0);
        const result: prepareJointRotationProjection.IProjection = paired(
          `hinge ${wanted} sign ${sign}`,
          project,
          { x: sign * rotation.x, y: 0, z: 0, w: sign * rotation.w },
          constraint,
          physical(admitted, 0),
        );
        check(
          "unique hinge endpoint",
          nclose(result.joint.flexion ?? NaN, admitted),
        );
      }
    const first: prepareJointRotationProjection.IProjection = paired(
      "owned A",
      project,
      physical(75, 0),
      constraint,
      physical(40, 0),
    );
    first.quaternion.x = Number.NaN;
    first.joint.flexion = -1234;
    const b: prepareJointRotationProjection.IProjection = paired(
      "owned B",
      project,
      physical(-60, 0),
      constraint,
      physical(-25, 0),
    );
    first.quaternion = { x: NaN, y: NaN, z: NaN, w: NaN };
    const restored: prepareJointRotationProjection.IProjection = paired(
      "owned restored A",
      project,
      physical(75, 0),
      constraint,
      physical(40, 0),
    );
    check(
      "fresh wrappers and quaternions",
      first !== b &&
        b !== restored &&
        first.quaternion !== restored.quaternion &&
        b.quaternion !== restored.quaternion,
    );
    check("previous B preserved", qclose(b.quaternion, physical(-25, 0)));
    check("previous B joint preserved", nclose(b.joint.flexion ?? NaN, -25, 0));
  });
  scenario("fixed and fallback paired results", (): void => {
    const fixed: IAutoMovieJointConstraint = {
      flexion: { min: 12, max: 12 },
      abduction: null,
      twist: { min: -18, max: -18 },
    };
    paired(
      "fixed nonzero",
      projector(fixed),
      physical(-75, 65),
      fixed,
      physical(12, -18),
    );
    const three: IAutoMovieJointConstraint = {
      flexion: { min: -40, max: 40 },
      abduction: { min: -30, max: 30 },
      twist: { min: -20, max: 20 },
    };
    paired(
      "reachable three-axis fallback",
      projector(three),
      physical(11, 9),
      three,
      physical(11, 9),
    );
    const coupled: IAutoMovieJointConstraint = { ...three, swingDeg: 25 };
    paired(
      "outside coupled fallback",
      projector(coupled),
      physical(100, 65),
      coupled,
    );
  });

  TestValidator.predicate(
    `prepared joint rotation: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
