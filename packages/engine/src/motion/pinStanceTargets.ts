import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import { contactMask } from "./contactMask";


/**
 * Group each leg's stance mask into maximal inclusive runs and assign one fixed model-frame contact per run. A run beginning at frame zero resumes an authoritative opening target; otherwise its first foot supplies XZ and sampled ground supplies Y. Parallel times/FK arrays are caller-admitted.
 *
 * @evidence contracts/common.md#principled-implementation Contiguous true intervals define one stance run; its fixed target is shared by all covered frame maps and compact metadata, preserving prior-beat contact only at the opening boundary. Every resulting target must be finite.
 * @evidence contracts/common.md#clear-and-simple-design The detection/pinning stage owns run grouping and target choice, leaving clinical IK and dense keyframe output to rekeyPlantedFeet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No contact is invented for false mask frames; opening pins apply only to an actual opening stance, and malformed sampled/carried target coordinates throw rather than replacing the target.
 * @evidence contracts/common.md#meaningful-documentation States inclusive times, model-frame coordinates, parallel-array premise, ground snapping and authoritative opening-target precedence.
 * @evidence contracts/performance.md#efficient-algorithms For L legs and F frames, mask construction, run grouping and target assignment take O(LF) work with O(F plus contacts) maps/entries and O(number of runs) compact metadata.
 * @evidence contracts/performance.md#reuse-equivalent-work All frames in one run share the same fixed target object and the compact plant record, so IK reads one admitted contact rather than resampling ground at each pinned frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned per-frame maps and plants belong to the pass caller; run masks/ranges are temporary, and no input pose, callback or external handle is retained.
 */
export const pinStanceTargets: (props: { /** Legs whose feet are planted. */ legs : readonly IAutoMovieFootLeg [ ] ; /** Per-frame FK bone lookups. */ resolved : ReadonlyArray < ReadonlyMap < AutoMovieHumanoidBone , IAutoMovieResolvedBone > > ; /** Frame times, parallel to `resolved`. */ times : readonly number [ ] ; /** Ground height at a plan position. */ groundAt : ( x : number , z : number ) => number ; /** Contact tolerance above the ground counted as stance. */ tolerance : number ; /** Prior beat's authoritative opening pin per foot, in model space. */ openingTargets ? : ReadonlyMap < AutoMovieHumanoidBone , IAutoMovieVector3 > ; }) => { /** Compact inclusive stance records, one per detected run. */ plants : IAutoMovieFootPlant [ ] ; /** Parallel per-frame maps sharing each run's fixed contact target. */ targets : Array < Map < AutoMovieHumanoidBone , IAutoMovieVector3 > > ; } = (props: {
  /** Legs whose feet are planted. */
  legs: readonly IAutoMovieFootLeg[];

  /** Per-frame FK bone lookups. */
  resolved: ReadonlyArray<
    ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
  >;

  /** Frame times, parallel to `resolved`. */
  times: readonly number[];

  /** Ground height at a plan position. */
  groundAt: (x: number, z: number) => number;

  /** Contact tolerance above the ground counted as stance. */
  tolerance: number;

  /** Prior beat's authoritative opening pin per foot, in model space. */
  openingTargets?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}): {
  /** Compact inclusive stance records, one per detected run. */
  plants: IAutoMovieFootPlant[];

  /** Parallel per-frame maps sharing each run's fixed contact target. */
  targets: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>>;
} => {
  const { legs, resolved, times, groundAt, tolerance }: typeof props = props;
  const plants: IAutoMovieFootPlant[] = [];
  const targets: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>> = times.map(
    (): Map<AutoMovieHumanoidBone, IAutoMovieVector3> => new Map(),
  );

  for (const leg of legs) {
    const contact: boolean[] = contactMask({
      effector: leg.foot,
      resolved,
      groundAt,
      tolerance,
    });
    for (const run of stanceRuns(contact)) {
      const startFoot: IAutoMovieVector3 = resolved[run.start]!.get(leg.foot)!.worldPosition;
      const carried: IAutoMovieVector3 | undefined =
        run.start === 0 ? props.openingTargets?.get(leg.foot) : undefined;
      const target: IAutoMovieVector3 =
        carried === undefined
          ? {
              x: startFoot.x,
              y: groundAt(startFoot.x, startFoot.z),
              z: startFoot.z,
            }
          : { ...carried };
      if (!Number.isFinite(target.x) || !Number.isFinite(target.y) || !Number.isFinite(target.z))
        throw new Error(`stance target for ${leg.foot} must have finite coordinates`);
      for (let f: number = run.start; f <= run.end; ++f)
        targets[f]!.set(leg.foot, target);
      plants.push({
        foot: leg.foot,
        start: times[run.start]!,
        end: times[run.end]!,
        position: target,
      });
    }
  }

  return { plants, targets };
};


/** Contiguous `true` runs of a contact mask, as inclusive frame ranges. */
const stanceRuns: (contact: readonly boolean [ ]) => Array < { start : number ; end : number } > = (
  contact: readonly boolean[],
): Array<{ start: number; end: number }> => {
  const runs: Array<{ start: number; end: number }> = [];
  let start: number = -1;
  contact.forEach((inContact: boolean, index: number): void => {
    if (inContact && start === -1) start = index;
    else if (!inContact && start !== -1) {
      runs.push({ start, end: index - 1 });
      start = -1;
    }
  });
  if (start !== -1) runs.push({ start, end: contact.length - 1 });
  return runs;
};
