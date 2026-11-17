import {
  clampJointToSkeleton,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";

/**
 * A caller-supplied clamp wrapper may retain every incoming clinical record.
 * Private candidate storage must never overwrite those observable inputs.
 *
 * Scenarios:
 * 1. A genuine box clamp wrapped by an owned retaining function keeps each
 *    input and exact scalar/key snapshot. Every retained record stays unchanged
 *    after its query and after later A/B/A targets, without imposing a count
 *    or requiring knowledge of the producer's candidate enumeration.
 *    An ordinary wrapper keeps the original props receiver; a live getter
 *    supplying a genuine factory first and a wrapper later keeps that same
 *    retention/receiver contract whenever the wrapper is actually called.
 * 2. Flexion[-30,30] with clinical neutral10 permits rig[-40,20]. Pure X60
 *    therefore selects clinical30/rig20; X-60 selects clinical-30/rig-40.
 *    The actual paired quaternion must realize that independent endpoint.
 * 3. Editing an earlier issued winner joint/quaternion cannot change later
 *    winners or retained callback inputs, nor can a later query repair those
 *    caller edits. Known native clamp provenance never transfers to a wrapper.
 * 4. Another unknown wrapper returns the actual clamp's values in one reused
 *    output record. Boundary and interior targets must retain the correct
 *    selected clinical joint/raw quaternion pair after later probes overwrite
 *    that callback scratch. The box path and a general-path90-degree swing
 *    cone share these literal optima because the cone never binds flexion±30.
 *    No ownership after the callback's scope is assumed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines retained arbitrary-callback input ownership, original props receiver, live factory-to-wrapper replacement, mutable callback-return lifetime in analytic/general paths, clinical versus rig degree intervals, nonzero neutral and four mutation/lifetime scenarios without a candidate-count claim.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public prepared projection through an ordinary retaining wrapper, a factory-to-wrapper getter and an unknown wrapper returning one mutable shared result. It checks props receiver, retained input fields/keys, caller-result edits and immediate selected joint/raw pairing. Independently clipped boundary/interior rotations detect fake success while ownership cases expose private scratch leakage, stale callable provenance or mutable foreign-return aliases separating an old numeric score from its actual articulation.
 * @evidence contracts/development/testing.md#independent-expectations Clinical-to-rig is F-10, so the authored interval is rig[-40,20]. Quaternion dot magnitude is cos((wanted-achieved)/2) over these less-than180-degree differences, whose unique constrained optimum is the nearest stated endpoint. Interior rig0/-15 remain exact at clinical10/-5. Half-angle sine/cosine gives raw expectations within1e-12; clinical comparisons retain1e-6-degree analytic precision. Retained input snapshots specify ownership equivalence only, not numerical projection expectations or a prescribed callback count.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both active endpoints and exact interior targets, positive/negative demand, nonzero affine neutral, wrapped-factory input retention/receiver, a changing callable getter, mutable foreign clamp outputs, repeated demands, exact input fields/keys, fresh issued winners and old-result poison. The same one-axis objective also runs with a nonbinding90-degree swing cone to require general search. Existing tests own coupled search and genuine unwrapped preparation; this unit uses no private metadata, getter-count or foreign-return ownership assertion.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine/ROM unit owns the finite one-bone kernel rig, retaining wrapper, scalar snapshots and issued-result edits. It invokes public clamp/projector APIs, patches no foreign function or global, adds no producer/export, and starts no Human, renderer, process or compiler.
 */
export function test_rom_projector_clamp_input_ownership(): void {
  const constraint: IAutoMovieJointConstraint = { flexion: { min: -30, max: 30 }, abduction: null, twist: null };
  const basis: IAutoMovieJointAxes = normalizeJointAxes({ flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 }, twist: { x: 0, y: 0, z: 1 } }, "retained clamp basis");
  const skeleton: IAutoMovieSkeleton = { id: "retained-clamp-kernel", bones: [{
    bone: "spine", parent: null, axes: basis, constraint,
    rest: { translation: { x: 0, y: 0, z: 0 }, rotation: turn(0), scale: { x: 1, y: 1, z: 1 } },
  }] };
  const actual: ReturnType<typeof clampJointToSkeleton.of> = clampJointToSkeleton.of("spine", skeleton);
  for (const changing of [false, true]) observe(actual, constraint, basis, changing);
  returnedScratch(actual, constraint, basis);
  const cone: IAutoMovieJointConstraint = { ...constraint, swingDeg: 90 };
  const general: IAutoMovieSkeleton = { ...skeleton, bones: [{ ...skeleton.bones[0]!, constraint: cone }] };
  returnedScratch(clampJointToSkeleton.of("spine", general), cone, basis);
}

/** Numeric scores must remain paired with their selected values despite a foreign output alias. */
function returnedScratch(actual: ReturnType<typeof clampJointToSkeleton.of>, constraint: IAutoMovieJointConstraint,
  basis: IAutoMovieJointAxes): void {
  const shared: IAutoMovieJointPose = { bone: "spine", flexion: 0, abduction: 0, twist: 0 };
  const frame: IAutoMovieRestFrame = { flexion: { sign: 1, neutral: 10 } };
  const project: prepareJointRotationProjection.IProjector = prepareJointRotationProjection({
    domain: { bone: "spine", constraint }, basis, frame,
    clamp: (input: IAutoMovieJointPose): IAutoMovieJointPose => Object.assign(shared, actual(input)),
  });
  for (const [desired, clinical, shown] of [[60, 30, 20], [-60, -30, -40], [0, 10, 0], [-15, -5, -15], [60, 30, 20]] as const) {
    const result: prepareJointRotationProjection.IProjection = project.withQuaternion(turn(desired));
    TestValidator.predicate(`mutable foreign output retains its actual selected pair at cone=${constraint.swingDeg}, demand${desired}, clinical=${result.joint.flexion}`,
      nclose(result.joint.flexion!, clinical, 1e-6) && qclose(result.quaternion, turn(shown), 1e-12) &&
      qclose(jointToQuaternionOnBasis(result.joint, basis, frame), result.quaternion, 1e-12));
  }
}

/** Observe ordinary and later-replaced callables through their original public props receiver. */
function observe(actual: ReturnType<typeof clampJointToSkeleton.of>, constraint: IAutoMovieJointConstraint,
  basis: IAutoMovieJointAxes, changing: boolean): void {
  const retained: { input: IAutoMovieJointPose; snapshot: IAutoMovieJointPose; keys: string[] }[] = [];
  const marker: object = {};
  const wrapped: Parameters<typeof prepareJointRotationProjection>[0]["clamp"] = function (
    this: object, input: IAutoMovieJointPose,
  ): IAutoMovieJointPose {
    TestValidator.predicate("an arbitrary clamp keeps its original public props receiver", this === props && props.marker === marker);
    retained.push({ input, snapshot: { ...input }, keys: Object.keys(input) });
    return actual(input);
  };
  let first: boolean = true;
  const props: Parameters<typeof prepareJointRotationProjection>[0] & { marker: object } = {
    domain: { bone: "spine", constraint }, basis, frame: { flexion: { sign: 1, neutral: 10 } },
    marker,
    get clamp(): Parameters<typeof prepareJointRotationProjection>[0]["clamp"] {
      if (changing && first) { first = false; return actual; }
      return wrapped;
    },
  };
  const project: prepareJointRotationProjection.IProjector = prepareJointRotationProjection(props);
  let previous: prepareJointRotationProjection.IProjection | undefined;
  for (const [desired, clinical, shown] of [[60, 30, 20], [-60, -30, -40], [60, 30, 20]] as const) {
    const result: prepareJointRotationProjection.IProjection = project.withQuaternion(turn(desired));
    TestValidator.predicate("retaining clamp still projects to the independent physical endpoint",
      nclose(result.joint.flexion!, clinical, 1e-6) && result.joint.abduction === 0 && result.joint.twist === 0 &&
      qclose(result.quaternion, turn(shown), 1e-12));
    TestValidator.predicate("every caller-retained clamp input keeps its original exact clinical fields",
      retained.every((entry: { input: IAutoMovieJointPose; snapshot: IAutoMovieJointPose; keys: string[] }): boolean =>
        entry.input.bone === entry.snapshot.bone && Object.is(entry.input.flexion, entry.snapshot.flexion) &&
        Object.is(entry.input.abduction, entry.snapshot.abduction) && Object.is(entry.input.twist, entry.snapshot.twist) &&
        Object.keys(entry.input).join("|") === entry.keys.join("|")));
    if (previous !== undefined)
      TestValidator.predicate("a later winner cannot borrow or repair the caller's earlier edited result",
        result.joint !== previous.joint && result.quaternion !== previous.quaternion &&
        Object.is(previous.joint.flexion, 999) && Object.is(previous.quaternion.x, 888));
    result.joint.flexion = 999;
    result.quaternion.x = 888;
    previous = result;
  }
  TestValidator.predicate("issued-result edits never alter callback-retained inputs after the final query",
    retained.length > 0 && retained.every((entry: { input: IAutoMovieJointPose; snapshot: IAutoMovieJointPose; keys: string[] }): boolean =>
      Object.is(entry.input.flexion, entry.snapshot.flexion) && Object.is(entry.input.abduction, entry.snapshot.abduction) &&
      Object.is(entry.input.twist, entry.snapshot.twist)));
}

/** Pure X articulation from the independent degree half-angle formula. */
function turn(degrees: number): IAutoMovieQuaternion {
  return { x: Math.sin(degrees * Math.PI / 360), y: 0, z: 0, w: Math.cos(degrees * Math.PI / 360) };
}
