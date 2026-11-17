import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanTrunk } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Fixed-demand trunk reading stages exactly the original authored values
 * before root/workspace callbacks and still admits all authored coordinates.
 *
 * Scenarios:
 * 1. All Object.entries value getters complete before tuple F/A/T getters.
 *    A late owned tuple exception beats an earlier NaN; no root/supplier
 *    work runs until every tuple coordinate has actually been read.
 * 2. With the late tuple repaired, owned root and supplier exceptions each
 *    precede that NaN's native finite refusal. Valid root/supplier work is
 *    still performed before finite admission, in the original order.
 * 3. Raw and fixed-demand paths emit only head and obey rigid translation
 *    by(1,2,3), with unchanged orientation. Editing an issued frame cannot
 *    change a later current-root read or repair the old caller-owned point.
 *    A NaN finger override is still refused despite head-only observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines complete entry/tuple staging, original root/skeleton/supplier order, owned failure precedence, raw trunk observation, canonical fixture immutability, rigid metre translation and fresh output in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public HumanTrunk.resolve and prepareResolve on the same canonical body through owned getter fixtures and real preparePoseResolution suppliers. Exact event order and original owned exceptions detect skipped/reordered required input work; actual native finite errors require full admission, while literal translation and fresh frame checks expose stale tuple/root results.
 * @evidence contracts/development/testing.md#independent-expectations Object.entries completes both map values before the original map-to-joint conversion reads either tuple. Each tuple reads F/A/T, followed by posture root construction, skeleton carrier and workspace supplier before numerical admission. These observable original events define the exact trace without counting internal FK. A global translation of(1,2,3) must add that same vector to the head and preserve its quaternion;1e-9m and1e-12 quaternion-dot cover binary64 propagation, not an altered physical bound. Base head coordinates are read only to express this rigid covariance law.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers late getter/early NaN, root failure, supplier failure, actual clinical refusal/recovery, initial/current/returned root state, explicit unrequested finger override, raw versus genuine staged consumer and caller-output poison. The engine tuple unit separately owns literal two-bone articulation, map snapshots and record/tuple operation invalidation.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable motion unit uses an immutable canonical Human fixture, an owned body facade/tuple map/posture and genuine operation factories. It edits no shared skeleton/ROM/table, replaces no foreign method/global, imports no private helper and starts no host, renderer or compiler.
 */
export function test_motion_trunk_tuple_staging(): void {
  const canonical: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const trace: string[] = [];
  const body: IAutoMovieMotionHumanBody = { ...canonical,
    get skeleton(): IAutoMovieSkeleton { trace.push("skeleton"); return canonical.skeleton; } };
  const demand: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head"]);
  const prepared: ReturnType<typeof HumanTrunk.prepareResolve> = HumanTrunk.prepareResolve(body, demand);
  const state: { flexion: number; lateFails: boolean; rootFails: boolean; supplierFails: boolean; root: IAutoMovieVector3 } = {
    flexion: NaN, lateFails: true, rootFails: false, supplierFails: false, root: { x: 0, y: 0, z: 0 },
  };
  const lateError: Error = new Error("owned later trunk tuple failure");
  const rootError: Error = new Error("owned trunk root failure");
  const supplierError: Error = new Error("owned trunk supplier failure");
  const head: readonly [number, number, number] = [0, 0, 0];
  const finger: readonly [number, number, number] = [0, 0, 0];
  for (const [tuple, name] of [[head, "head"], [finger, "finger"]] as const)
    for (const axis of [0, 1, 2])
      Object.defineProperty(tuple, axis, { get: (): number => {
        trace.push(`${name}.${axis}`);
        if (name === "finger" && axis === 0 && state.lateFails) throw lateError;
        return name === "head" && axis === 0 ? state.flexion : 0;
      } });
  const joints: IAutoMovieMotionHumanPosture["joints"] = {
    get head(): readonly [number, number, number] { trace.push("map.head"); return head; },
    get leftIndexDistal(): readonly [number, number, number] { trace.push("map.finger"); return finger; },
  };
  const posture: IAutoMovieMotionHumanPosture = {
    get root(): IAutoMovieVector3 { trace.push("root"); if (state.rootFails) throw rootError; return state.root; },
    yaw: 0, pitch: 0, roll: 0, joints, limbs: {},
  };
  const supplier: () => ReturnType<typeof preparePoseResolution> = (): ReturnType<typeof preparePoseResolution> => {
    trace.push("supplier");
    if (state.supplierFails) throw supplierError;
    return preparePoseResolution();
  };
  const allScalars: string[] = ["map.head", "map.finger", "head.0", "head.1", "head.2", "finger.0", "finger.1", "finger.2"];
  const complete: string[] = [...allScalars, "root", "skeleton", "supplier"];
  const readers: readonly [string, () => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>][] = [
    ["raw", (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => HumanTrunk.resolve(body, posture, joints, supplier, demand)],
    ["prepared", (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => prepared(posture, supplier)],
  ];
  for (const [name, read] of readers) {
    state.flexion = NaN;
    state.lateFails = true;
    state.rootFails = false;
    state.supplierFails = false;
    trace.length = 0;
    TestValidator.predicate(`${name} completes later tuple access before early numeric admission`, caught(read) === lateError);
    TestValidator.equals(`${name} reads all map values before the tuple failure`, trace, allScalars.slice(0, 6));
    state.lateFails = false;
    state.rootFails = true;
    trace.length = 0;
    TestValidator.predicate(`${name} constructs its actual root before native finite admission`, caught(read) === rootError);
    TestValidator.equals(`${name} root failure follows every scalar read`, trace, [...allScalars, "root"]);
    state.rootFails = false;
    state.supplierFails = true;
    trace.length = 0;
    TestValidator.predicate(`${name} requests its actual workspace before finite admission`, caught(read) === supplierError);
    TestValidator.equals(`${name} supplier failure keeps the original staging/root/carrier order`, trace, complete);
    state.supplierFails = false;
    trace.length = 0;
    TestValidator.predicate(`${name} finally refuses the actual unchanged NaN`, throwsError(read, ["flexion", "finite"]));
    TestValidator.equals(`${name} numeric refusal retains all earlier observable work`, trace, complete);
    state.flexion = 0;
    state.root = { x: 0, y: 0, z: 0 };
    const initial: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read();
    TestValidator.equals(`${name} emits only the demanded head`, Array.from(initial.keys()), ["head"]);
    const first: IAutoMovieResolvedBone = initial.get("head")!;
    const point: IAutoMovieVector3 = { ...first.worldPosition };
    first.worldPosition.x = 999;
    state.root = { x: 1, y: 2, z: 3 };
    const shifted: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read();
    TestValidator.predicate(`${name} observes current root translation with independently owned frames`,
      shifted !== initial && shifted.get("head") !== first &&
      vclose(shifted.get("head")!.worldPosition, { x: point.x + 1, y: point.y + 2, z: point.z + 3 }, 1e-9) &&
      qclose(shifted.get("head")!.worldRotation, first.worldRotation, 1e-12) && Object.is(first.worldPosition.x, 999));
  }
  TestValidator.predicate("the actual prepared consumer admits even an unrequested malformed override",
    throwsError((): unknown => prepared(posture, supplier, { head: [0, 0, 0], leftIndexDistal: [NaN, 0, 0] }), ["flexion", "finite"]));
}

/** Observe only the owned action's actual failure; assertion predicates stay outside the catch. */
function caught(action: () => unknown): unknown {
  try { action(); } catch (error) { return error; }
  return undefined;
}
