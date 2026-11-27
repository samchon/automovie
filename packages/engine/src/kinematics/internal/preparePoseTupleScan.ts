import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieSkeletonPoseResolution,
} from "@automovie/interface";

import type { preparePoseJointResolution } from "./preparePoseJointResolution";

/*
 * Snapshot an authored tuple map before any root work or joint admission.
 * Object.entries captures every enumerable value first. All tuple components
 * then read in F/A/T order before numerical admission can start, preserving a
 * later tuple getter's failure ahead of an earlier nonfinite coordinate.
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
    values.push(
      entry[0] as AutoMovieHumanoidBone,
      tuple![0],
      tuple![1],
      tuple![2],
    );
  }
  return (
    reader: Pick<
      preparePoseJointResolution.IReader,
      "admitValues" | "validateValues"
    >,
  ): void => {
    for (let offset: number = 0; offset < values.length; offset += 4) {
      // These roles come from the actual ordered writer, not admission flags.
      const bone: AutoMovieHumanoidBone = values[
        offset
      ] as AutoMovieHumanoidBone;
      const f: IAutoMovieJointPose["flexion"] = values[
        offset + 1
      ] as IAutoMovieJointPose["flexion"];
      const a: IAutoMovieJointPose["abduction"] = values[
        offset + 2
      ] as IAutoMovieJointPose["abduction"];
      const t: IAutoMovieJointPose["twist"] = values[
        offset + 3
      ] as IAutoMovieJointPose["twist"];
      if (ancestors === undefined || ancestors.has(bone))
        reader.admitValues(bone, f, a, t);
      else reader.validateValues(bone, f, a, t);
    }
  };
}

/*
 * Authored tuple input and a staged, still-unadmitted scalar scan.
 */
export namespace preparePoseTupleScan {
  /*
   * Clinical tuples per bone (`IAutoMovieSkeletonPoseResolution.IJoints`).
   */
  export type IJoints = IAutoMovieSkeletonPoseResolution.IJoints;

  /*
   * Supply every staged value to actual private joint admission, never a public
   * callback or reader key.
   */
  export type IScan = (
    reader: Pick<
      preparePoseJointResolution.IReader,
      "admitValues" | "validateValues"
    >,
  ) => void;
}

/*
 * An actually empty entry snapshot has no admission events or scalar storage.
 */
const EMPTY_SCAN: preparePoseTupleScan.IScan = (): void => undefined;

/*
 * Clinical F/A/T values in degrees or null rest, in their original tuple order.
 */
type ITuple = readonly [
  IAutoMovieJointPose["flexion"],
  IAutoMovieJointPose["abduction"],
  IAutoMovieJointPose["twist"],
];

/*
 * One private staged slot, populated only by the ordered name/F/A/T writer
 * below.
 */
type IStagedValue = AutoMovieHumanoidBone | IAutoMovieJointPose["flexion"];
