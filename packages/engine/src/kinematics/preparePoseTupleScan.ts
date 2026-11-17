import type { AutoMovieHumanoidBone, IAutoMovieJointPose } from "@automovie/interface";

import type { preparePoseJointResolution } from "./preparePoseJointResolution";

/** Clinical F/A/T values in degrees or null rest, in their original tuple order. */
type ITuple = readonly [
  IAutoMovieJointPose["flexion"],
  IAutoMovieJointPose["abduction"],
  IAutoMovieJointPose["twist"],
];

/** One private staged slot, populated only by the ordered name/F/A/T writer below. */
type IStagedValue = AutoMovieHumanoidBone | IAutoMovieJointPose["flexion"];

/** An actually empty entry snapshot has no admission events or scalar storage. */
const EMPTY_SCAN: preparePoseTupleScan.IScan = (): void => undefined;

/**
 * Snapshot an authored tuple map before any root work or joint admission.
 * Object.entries captures every enumerable value first. All tuple components
 * then read in F/A/T order before numerical admission can start, preserving a
 * later tuple getter's failure ahead of an earlier nonfinite coordinate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two-phase entry/value snapshot, degree/null coordinates, explicit undefined failure, ordered admission and query-owned lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Retains Object.entries then all F/A/T reads before root work. The scan sends copied primitives to one admission owner. An optional ancestor set must come from the same genuine fixed-demand rig; outside it, identical basis/finite/used-frame checks run while pure quaternion composition/selection is unnecessary. No post-admission arithmetic validates additional inputs under immutable normalized axes/frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns authored representation staging only. The prepared rig binds genuine graph/demand state, the root owner runs between snapshot and scan, and preparePoseJointResolution owns all actual numerical admission/composition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every canonical/stray/undemanded entry receives original numerical checks and explicit undefined failure order. Genuine graph ancestry controls pure math only; no proxy, reused record, caller validity flag, relaxed constraint or target answer replaces admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms Object.entries takes the original O(J) snapshot; one private 4J name/F/A/T array replaces J intermediate records and lets all entry pairs end before root work. Actually empty snapshots share one stateless scan. All J admission checks remain, while only changed names in the fixed ancestor closure need quaternion construction. No speedup is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only this actual call's copied names/scalars survive root construction. Later input-map or tuple edits cannot change the staged reading, matching the former completed joint list. Every scan still admits all supplied values and shares no pose/target answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Entry pairs and their tuple references end after staging. The later scan captures only its 4J copied name/coordinate slots and optional fixed ancestor set, with no entries or input-map variable. Malformed coordinate values retain their actual reference only until original later admission/query release. No joint record, root, reader, result history or handle is stored.
 */
export function preparePoseTupleScan(
  joints: preparePoseTupleScan.IJoints,
  ancestors?: ReadonlySet<AutoMovieHumanoidBone>,
): preparePoseTupleScan.IScan {
  const entries: [string, ITuple | undefined][] = Object.entries(joints);
  if (entries.length === 0) return EMPTY_SCAN;
  const values: IStagedValue[] = [];
  for (const entry of entries) {
    const tuple: ITuple | undefined = entry[1];
    values.push(entry[0] as AutoMovieHumanoidBone, tuple![0], tuple![1], tuple![2]);
  }
  return (reader: Pick<preparePoseJointResolution.IReader, "admitValues" | "validateValues">): void => {
    for (let offset: number = 0; offset < values.length; offset += 4) {
      // These roles come from the actual ordered writer, not admission flags.
      const bone: AutoMovieHumanoidBone = values[offset] as AutoMovieHumanoidBone;
      const f: IAutoMovieJointPose["flexion"] = values[offset + 1] as IAutoMovieJointPose["flexion"];
      const a: IAutoMovieJointPose["abduction"] = values[offset + 2] as IAutoMovieJointPose["abduction"];
      const t: IAutoMovieJointPose["twist"] = values[offset + 3] as IAutoMovieJointPose["twist"];
      if (ancestors === undefined || ancestors.has(bone))
        reader.admitValues(bone, f, a, t);
      else reader.validateValues(bone, f, a, t);
    }
  };
}

/**
 * Authored tuple input and a staged, still-unadmitted scalar scan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States clinical tuple ordering, optional-map fields and the actual private reader that admits each later scalar scan.
 * @evidence contracts/development/design.md#principled-representation IJoints maps canonical names to the existing joint type's three degree/null quantities; IScan separates source staging from actual numerical admission without claiming a completed pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the genuine tuple producer/private state consume these forms. Actual fixed graph ancestry chooses admission-only or admission-plus-composition; existing joint/reader owners define quantities/checks and packed arrays remain private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bone subset, pose/time key, proxy row, optional validity certificate or alternative ROM convention is represented. All runtime names/values remain unchanged for their original admission owner.
 */
export namespace preparePoseTupleScan {
  /** Directly authored clinical triples, with omission meaning no authored record. */
  export type IJoints = Partial<Record<AutoMovieHumanoidBone, ITuple>>;

  /** Supply every staged value to actual private joint admission, never a public callback or reader key. */
  export type IScan = (reader: Pick<preparePoseJointResolution.IReader, "admitValues" | "validateValues">) => void;
}
