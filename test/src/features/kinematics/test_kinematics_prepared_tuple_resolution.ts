import {
  Transform,
  preparePoseResolution,
  prepareSkeletonPoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLegAxis,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Authored tuples stage the complete ordered scalar input before root work
 * and retain ordinary full admission, current dependency changes and outputs.
 *
 * Scenarios:
 * 1. A two-bone kernel has root rest(2,3,4), child offset(1,0,0), and root
 *    flexion about+Y. StagedF90 places the child at(2,3,3), even after the
 *    input tuple, own map and inherited entries change. A new stage seesF0.
 * 2. One operation switches recordF0→tupleF90→recordF-90→empty tuple,
 *    giving literal child positions(3,3,4),(2,3,3),(2,3,5),(3,3,4).
 *    Outputs are fresh and caller edits cannot poison the same staged read.
 * 3. A late tuple getter's owned exception precedes an earlier NaN's native
 *    admission; undefined tuple fails during staging, but undefined component
 *    survives staging and is refused at the original later finite check.
 * 4. Every staged authored row is admitted, including an unrequested NaN
 *    child or stray key. Repairing the source then recovers normal FK.
 * 5. Bound Map demand snapshots spine while a live set changes to hips.
 *    A changed ancestor during that hips-only query must still reach the
 *    next spine Map. Array/Map/tuple reads share current source admission,
 *    while each returned Map and nested frame remain caller-owned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines two-phase tuple lifetime, own/inherited map scope, clinical degrees, independent Y-axis geometry, cross-representation invalidation, malformed staging/admission order and fresh ownership in five scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls genuine public rig.prepareTuples, rig.resolve, rig.resolveMap and bound-demand map using one exact operation. Literal child positions distinguish missing/restored ancestor work; source/output edits and ordinary/staged alternation expose aliases or stale dependencies. Owned exceptions and malformed unrequested/stray rows require actual original admission without a callback-count assertion.
 * @evidence contracts/development/testing.md#independent-expectations Ry90 maps(1,0,0) to(0,0,-1), Ry-90 maps it to(0,0,1), and neutral leaves it unchanged before adding root(2,3,4). Metre positions allow1e-12 for trig arithmetic. Object.entries excludes inherited keys and completes its values before tuple F/A/T reads; a completed scalar snapshot cannot observe later tuple/map edits. Undefined tuple has no index0, whereas undefined component reaches the finite check only in phase two.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers initial/new stages, numeric tuple/map edits, inherited versus own malformed entries, ordinary/staged/empty transition on one operation, changed/removed ancestor angles, old-output poison, late getter versus early NaN, explicit undefined tuple/component and all-row admission despite child-only demand; fixed versus live Map membership, current ancestor changes under another demand and exact parent-first full Map order. HumanTrunk owns the actual root/supplier callback order separately.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine unit owns its labeled two-bone mathematical kernel, maps, descriptors, exceptions and operation. It uses public APIs without Human anatomy claims, private helpers, fake flags, foreign replacement, host, renderer or compiler.
 */
export function test_kinematics_prepared_tuple_resolution(): void {
  const axes: IAutoMovieJointAxes = { flexion: { x: 0, y: 1, z: 0 },
    abduction: { x: 0, y: 0, z: 1 }, twist: { x: 1, y: 0, z: 0 }, twistPlacement: "proximal" };
  const skeleton: IAutoMovieSkeleton = { id: "staged-tuple-kernel", bones: [
    { bone: "hips", parent: null, axes, constraint: null, rest: Transform.of({ x: 2, y: 3, z: 4 }, { x: 0, y: 0, z: 0, w: 1 }) },
    { bone: "spine", parent: "hips", constraint: null, rest: Transform.of({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }) },
  ] };
  const rig: prepareSkeletonPoseResolution.IRig = prepareSkeletonPoseResolution(skeleton);
  const stage: prepareSkeletonPoseResolution.ITupleReader = rig.prepareTuples(new Set(["spine"]));
  const carrier: Omit<IAutoMoviePose, "joints"> = { skeleton: skeleton.id, root: null };
  const tuple: [number, number, number] = [90, 0, 0];
  const joints: IAutoMovieHumanLegAxis.IJoints = { hips: tuple };
  Object.setPrototypeOf(joints, { head: [NaN, 0, 0] });
  const fixed: prepareSkeletonPoseResolution.ITupleRead = stage(joints);
  tuple[0] = 0;
  joints.hips = [0, 0, 0];
  Object.setPrototypeOf(joints, { head: [Infinity, 0, 0] });
  const before: ReturnType<typeof fixed> = fixed(carrier);
  TestValidator.equals("fixed tuple demand emits only the child", Array.from(before.keys()), ["spine"]);
  TestValidator.predicate("staged numeric data ignores later source edits and inherited records",
    vclose(before.get("spine")!.worldPosition, { x: 2, y: 3, z: 3 }, 1e-12) &&
    vclose(stage(joints)(carrier).get("spine")!.worldPosition, { x: 3, y: 3, z: 4 }, 1e-12));
  before.get("spine")!.worldPosition.x = 999;
  const replay: ReturnType<typeof fixed> = fixed(carrier);
  TestValidator.predicate("staged reads retain caller-owned maps/frames and cannot repair old poison",
    replay !== before && replay.get("spine") !== before.get("spine") &&
    replay.get("spine")!.worldPosition !== before.get("spine")!.worldPosition &&
    vclose(replay.get("spine")!.worldPosition, { x: 2, y: 3, z: 3 }, 1e-12) && Object.is(before.get("spine")!.worldPosition.x, 999));

  const operation: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  const neutral: IAutoMoviePose = { ...carrier, joints: [{ bone: "hips", flexion: 0, abduction: 0, twist: 0 }] };
  TestValidator.predicate("ordinary neutral representation begins at the literal rest child",
    vclose(rig.resolve(neutral, operation)[1]!.worldPosition, { x: 3, y: 3, z: 4 }, 1e-12));
  TestValidator.predicate("tuple representation invalidates that actual ancestor on the same operation",
    vclose(fixed(carrier, operation).get("spine")!.worldPosition, { x: 2, y: 3, z: 3 }, 1e-12));
  neutral.joints[0]!.flexion = -90;
  TestValidator.predicate("ordinary representation observes the next changed ancestor",
    vclose(rig.resolve(neutral, operation)[1]!.worldPosition, { x: 2, y: 3, z: 5 }, 1e-12));
  TestValidator.predicate("empty tuple representation removes the old ancestor articulation",
    vclose(stage({})(carrier, operation).get("spine")!.worldPosition, { x: 3, y: 3, z: 4 }, 1e-12));

  const sentinel: Error = new Error("owned later tuple getter failure");
  const late: [number, number, number] = [0, 0, 0];
  Object.defineProperty(late, 0, { get: (): never => { throw sentinel; } });
  let error: unknown = undefined;
  try { stage({ hips: [NaN, 0, 0], spine: late }); } catch (actual) { error = actual; }
  TestValidator.predicate("all tuple reads precede every native finite admission", error === sentinel);
  TestValidator.predicate("an explicit undefined tuple fails during original property access",
    throwsError((): unknown => stage({ hips: undefined })));
  const missing: [number, number, number] = [0, 0, 0];
  Object.defineProperty(missing, 0, { value: undefined });
  const invalid: prepareSkeletonPoseResolution.ITupleRead = stage({ hips: missing });
  TestValidator.predicate("an undefined scalar is staged unchanged and refused by later clinical admission",
    throwsError((): unknown => invalid(carrier), ["flexion", "finite"]));
  for (const name of ["spine", "head", "stray"]) {
    const malformed: IAutoMovieHumanLegAxis.IJoints = { hips: [0, 0, 0] };
    Object.defineProperty(malformed, name, { value: [NaN, 0, 0], enumerable: true });
    const read: prepareSkeletonPoseResolution.ITupleRead = stage(malformed);
    TestValidator.predicate(`demand never filters native admission of authored${name}`,
      throwsError((): unknown => read(carrier, operation), ["flexion", "finite"]));
  }
  TestValidator.predicate("a failed staged scan cannot poison the next valid complete source",
    vclose(stage({ hips: [90, 0, 0] })(carrier, operation).get("spine")!.worldPosition, { x: 2, y: 3, z: 3 }, 1e-12));
  mapped(rig, carrier, operation);
}

/** The public tuple reader's authored map type, without importing internal staging metadata. */
type IJoints = Parameters<prepareSkeletonPoseResolution.ITupleReader>[0];

/** Map output uses the same actual admission/dependencies with fresh demanded records. */
function mapped(rig: prepareSkeletonPoseResolution.IRig, carrier: Omit<IAutoMoviePose, "joints">,
  operation: ReturnType<typeof preparePoseResolution>): void {
  const names: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(["spine"]);
  const bound: ReturnType<typeof rig.prepareBones> = rig.prepareBones(names);
  names.clear();
  names.add("hips");
  const pose: IAutoMoviePose = { ...carrier, joints: [{ bone: "hips", flexion: 90, abduction: 0, twist: 0 }] };
  const first: ReturnType<typeof bound.map> = bound.map(pose, operation);
  TestValidator.equals("bound Map demand snapshots its original child", Array.from(first.keys()), ["spine"]);
  TestValidator.predicate("bound child Map retains the literal ancestor turn",
    vclose(first.get("spine")!.worldPosition, { x: 2, y: 3, z: 3 }, 1e-12));
  const live: ReturnType<typeof rig.resolveMap> = rig.resolveMap(pose, operation, names);
  TestValidator.equals("ordinary Map demand observes current set membership", Array.from(live.keys()), ["hips"]);
  TestValidator.predicate("live parent Map retains its original translated rest point",
    vclose(live.get("hips")!.worldPosition, { x: 2, y: 3, z: 4 }, 1e-12));
  pose.joints[0]!.flexion = -90;
  rig.resolveMap(pose, operation, names);
  first.get("spine")!.worldPosition.x = 777;
  first.get("spine")!.worldRotation.x = 888;
  const next: ReturnType<typeof bound.map> = bound.map(pose, operation);
  TestValidator.predicate("another demand still updates a previously observed child's current ancestor",
    next !== first && next.get("spine") !== first.get("spine") &&
    vclose(next.get("spine")!.worldPosition, { x: 2, y: 3, z: 5 }, 1e-12) &&
    Object.is(first.get("spine")!.worldPosition.x, 777) && Object.is(first.get("spine")!.worldRotation.x, 888));
  first.clear();
  pose.joints.push({ bone: "head", flexion: NaN, abduction: 0, twist: 0 },
    { bone: "head", flexion: 0, abduction: 0, twist: 0 });
  TestValidator.predicate("bound Map still admits an overwritten unrequested record in authored order",
    throwsError((): unknown => bound.map(pose, operation), ["flexion", "finite"]));
  pose.joints = [];
  const complete: ReturnType<typeof rig.resolveMap> = rig.resolveMap(pose, operation);
  TestValidator.equals("a recovered full Map retains ordinary parent-first order", Array.from(complete.keys()), ["hips", "spine"]);
  TestValidator.predicate("removed articulation and edited caller maps cannot poison a recovered full Map",
    vclose(complete.get("spine")!.worldPosition, { x: 3, y: 3, z: 4 }, 1e-12) && first.size === 0);
}
