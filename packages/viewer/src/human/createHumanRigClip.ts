import type {
  IAutoMovieHumanPose,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import type { AutoMovieHumanController } from "@automovie/human/control";
import * as THREE from "three";

/**
 * Compile one caller-authored body motion for a fixed prepared Human rest rig.
 * The existing clinical evaluator and parent-local pose conversion are supplied
 * by the binding. This function owns only temporary key preparation and track
 * assembly; it retains no evaluator, drawing, clock, action or clip cache.
 * Eye/jaw keys reject before evaluation because body tracks do not sample faces.
 * Optional ankle alignment is the existing authored-key height convention.
 * Standard Three tracks store Float32 seconds. Compilation rejects times that become nonfinite or cease to increase strictly in that representation before evaluating poses; logical definitions and clip duration remain unchanged.
 *
 * @param name Admitted motion name, also used as the Three clip name.
 * @param definition The control's private-definition snapshot, in local seconds.
 * @param rest Matching pose-{} output for this fixed prepared body.
 * @param evaluatePose Existing clinical evaluator, reused for distinct nonempty keys.
 * @param localPose Existing parent-local transform conversion, without another FK.
 * @returns Validated new clip; the binding owns its private cache and copies.
 *
 * @evidence contracts/common.md#principled-implementation Math.fround admits finite, strictly increasing Float32 seconds used by the standard Three tracks before existing evaluated poses and parent-local rotations supply quaternion tracks; the original ankle-height convention supplies only root position.
 * @evidence contracts/common.md#clear-and-simple-design Key compilation is independent of rig playback and visual placement; the binding supplies its existing conversion and owns the returned clip.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite or collapsed stored times reject without clamping, rescaling, retiming or weakening the logical controller; no second FK, interpolation sampler, clinical mapping, world-joint blending or face sampler is introduced.
 * @evidence contracts/common.md#meaningful-documentation States fixed-body matching, local seconds, Float32 storage refusal, unchanged logical duration, supplied evaluation/conversion ownership, face-channel refusal, ankle convention and returned-clip lifetime.
 * @evidence contracts/performance.md#efficient-algorithms For K keys and B bones, stored-time admission uses O(K) scalar work without another array, evaluation runs once per distinct pose record and track assembly uses O(K*B) values; temporary key identity strings scale with supplied pose data.
 * @evidence contracts/performance.md#reuse-equivalent-work Empty poses reuse the supplied rest output and equal JSON pose records reuse one evaluation within this compilation; cross-call private clip reuse remains with the binding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Key caches and converted frames are call-local, returned track arrays belong to the caller's clip, and no running task, drawing resource or retained evaluator is acquired.
 */
export function createHumanRigClip(
  name: string,
  definition: AutoMovieHumanController.IDefinition,
  rest: Skeleton.IOutput,
  evaluatePose: (pose: IAutoMovieHumanPose) => Skeleton.IOutput,
  localPose: (
    output: Skeleton.IOutput,
  ) => ReadonlyMap<string, { rotation: THREE.Quaternion }>,
): THREE.AnimationClip {
  for (const key of definition.keys)
    if (key.pose.head?.eyes !== undefined || key.pose.head?.jaw !== undefined)
      throw new Error(
        "Human body clips do not animate gaze or jaw; use explicit setPose and setExpression",
      );

  // Three stores these seconds in Float32Array; validate that representation before evaluating poses.
  let previousTime: number = -Infinity;
  for (const key of definition.keys) {
    const storedTime: number = Math.fround(key.time);
    if (!Number.isFinite(storedTime) || storedTime <= previousTime)
      throw new Error(
        "Human body clips require finite, strictly increasing Float32 key times",
      );
    previousTime = storedTime;
  }

  const cache: Map<string, Skeleton.IOutput> = new Map();
  const outputs: Skeleton.IOutput[] = definition.keys.map(
    (key: AutoMovieHumanController.IKey): Skeleton.IOutput => {
      const identity: string = JSON.stringify(key.pose);
      let output: Skeleton.IOutput | undefined = cache.get(identity);
      if (output === undefined) {
        output =
          Object.keys(key.pose).length === 0
            ? rest
            : evaluatePose(structuredClone(key.pose));
        cache.set(identity, output);
      }
      return output;
    },
  );
  const frames: ReadonlyMap<string, { rotation: THREE.Quaternion }>[] =
    outputs.map(
      (
        output: Skeleton.IOutput,
      ): ReadonlyMap<string, { rotation: THREE.Quaternion }> =>
        localPose(output),
    );
  const times: number[] = definition.keys.map(
    (key: AutoMovieHumanController.IKey): number => key.time,
  );
  const tracks: THREE.KeyframeTrack[] = [];
  for (const bone of rest.bones) {
    const values: number[] = frames.flatMap(
      (
        frame: ReadonlyMap<string, { rotation: THREE.Quaternion }>,
      ): number[] => frame.get(bone.bone)!.rotation.toArray(),
    );
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${bone.bone}.quaternion`,
        times,
        values,
      ),
    );
  }
  const floor: number = definition.alignAnkles ? ankleHeight(rest) : 0;
  const heights: number[] = outputs.flatMap(
    (output: Skeleton.IOutput): number[] => [
      0,
      definition.alignAnkles ? floor - ankleHeight(output) : 0,
      0,
    ],
  );
  tracks.push(new THREE.VectorKeyframeTrack(".position", times, heights));
  const clip: THREE.AnimationClip = new THREE.AnimationClip(
    name,
    definition.duration,
    tracks,
  );
  if (!clip.validate())
    throw new Error("Human motion produced invalid Three tracks");
  return clip;
}

/**
 * Existing authored-key floor convention; no continuous foot-contact solver is implied.
 * Requires both actual Human ankle placements and returns their lower Y in metres.
 *
 * Selects the existing leftFoot/rightFoot ankle placements and preserves the original lower-height convention used by authored root tracks.
 * This value-only helper belongs to clip compilation and retains no transport or placement responsibility.
 * Named ankles are the existing optional alignment convention, not a normalized bone adapter, fitted coordinate or contact solver.
 * States the two-placement requirement, metre Y value and authored-key-only meaning.
 * One O(B) scan of actual placements selects two ankles, followed by their minimum; no geometry is traversed.
 * The caller reuses this compilation's existing evaluated outputs instead of deriving or evaluating another body.
 * Only a call-local two-placement array is retained and the returned scalar owns no resources.
 */
function ankleHeight(output: Skeleton.IOutput): number {
  const feet: Skeleton.IPlacement[] = output.posed.filter(
    (placement: Skeleton.IPlacement): boolean =>
      placement.bone === "leftFoot" || placement.bone === "rightFoot",
  );
  if (feet.length !== 2)
    throw new Error(
      "Ankle-aligned Human motion needs both actual ankle placements",
    );
  return Math.min(
    ...feet.map(
      (placement: Skeleton.IPlacement): number => placement.position[1],
    ),
  );
}
