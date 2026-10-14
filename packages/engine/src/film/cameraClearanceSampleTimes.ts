import {
  IAutoMovieClip,
  IAutoMovieMotion,
  IAutoMovieShot,
  IAutoMovieTrack,
} from "@automovie/interface";

import { sampleTimes } from "../motion/sampleTimes";

/**
 * Build the clearance sample clock of one shot: a function from a take's camera motion to the strictly increasing shot-local seconds at which that take must be inspected.
 *
 * The clock is the endpoint-inclusive fixed clock of `sampleRate` over `duration`, refined by every key time of every actor motion, object clip and the take's camera clip that falls strictly inside the shot, repeated per cycle for a looping sequence. Each interval stays within one key segment. Under admitted motion inputs, linear, step and named non-overshooting easing keep translation and scale within their endpoint ranges; quaternion rotation follows an arc instead of that chord and needs the evaluator's separate rotation bound. This clock refuses `cubicBezier` actor easing, `cubicspline` clip tracks and an open loop seam on a channel the bound reads. It does not certify the evaluator's normalized-lerp or changing-scale limits.
 *
 * The actor/object part is computed once and each take adds its camera boundaries. Unboundable motion/clip interpolation or seams throw Error at the corresponding call; a loop cycle count must also be a non-negative safe integer so incrementing its enumeration index can progress. This representability gate is not a workload budget, and representable populations can still exhaust host resources.
 *
 * @evidence contracts/common.md#principled-implementation Inserts admitted causal keys so each interval holds one interpolation segment; endpoint-contained translation and scale then support endpoint obstacle bounds. Overshooting interpolation and open seams are refused instead of hidden by a denser clock. Rotating camera offsets require evaluateCameraClearance's separate arc bound, whose normalized-lerp and scale limits this key enumeration does not remove.
 * @evidence contracts/common.md#clear-and-simple-design Returns a per-take function so the clearance compiler validates and collects the take-independent actor and object boundaries once while each take adds only its camera; the loop-seam and boundary helpers stay private because only this clock reads them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No motion, clip or camera is named; each refusal is a stated property of the motion, rotation seams count only for the camera because obstacle bounds are rotation-invariant, and a quaternion seam accepts the negated quaternion because it is the same rotation.
 * @evidence contracts/common.md#meaningful-documentation States clock composition, key-segment and endpoint-range premises, the separate rotation bound and its limits, refusals and throwing call, representable-count versus workload limits, and the shared-versus-per-take split.
 * @evidence contracts/performance.md#efficient-algorithms Linear in fixed-clock samples plus key times times loop cycles, and the per-take sort is `O(T log T)` over that take's instants; a set removes coincident keys so each instant is evaluated once.
 * @evidence contracts/performance.md#reuse-equivalent-work The validated actor and object boundary set is built once per shot and copied into each take's set, since every take reads the same motions and only its camera clip differs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned function retains the shared set, bounded by the fixed-clock samples plus all actor and object key instants in the shot, until the clearance compiler drops it at the end of the call; each take's array is owned by its caller.
 */
export function cameraClearanceSampleTimes(props: {
  /** Shot length in seconds. */
  duration: number;

  /** Fixed-clock samples per second, finite and positive. */
  sampleRate: number;

  /** Actor motion per node; its root translation and scale move obstacles. */
  motions: Readonly<Record<string, IAutoMovieMotion>>;

  /** Object clips whose node channels move obstacles. */
  objectMotions: readonly IAutoMovieClip[];
}): (cameraMotion: IAutoMovieShot["cameraMotion"]) => number[] {
  for (const motion of Object.values(props.motions)) {
    if (
      motion.keyframes.some(
        (keyframe: IAutoMovieMotion["keyframes"][number]): boolean =>
          keyframe.easing === "cubicBezier",
      )
    )
      throw new Error(
        `camera clearance cannot conservatively bound actor motion "${motion.id}" with cubicBezier easing; use linear, step, or named non-overshooting easing`,
      );
    if (!actorLoopIsClosed(motion))
      throw new Error(
        `camera clearance cannot conservatively bound actor motion "${motion.id}" across an open loop seam; close its root translation and clearance radius`,
      );
  }
  for (const clip of props.objectMotions)
    assertClipBoundable(clip, false, "its node translation and scale channels");
  const shared: Set<number> = new Set(
    sampleTimes(props.duration, props.sampleRate),
  );
  for (const motion of Object.values(props.motions))
    addSequenceBoundaries(shared, props.duration, {
      duration: motion.duration,
      loop: motion.loop,
      times: motion.keyframes.map(
        (keyframe: IAutoMovieMotion["keyframes"][number]): number =>
          keyframe.time,
      ),
    });
  for (const clip of props.objectMotions)
    addSequenceBoundaries(shared, props.duration, clipSequence(clip));
  return (cameraMotion: IAutoMovieShot["cameraMotion"]): number[] => {
    const result: Set<number> = new Set(shared);
    if (cameraMotion !== null) {
      assertClipBoundable(cameraMotion, true, "its camera transform channels");
      addSequenceBoundaries(result, props.duration, clipSequence(cameraMotion));
    }
    return [...result].sort(
      (left: number, right: number): number => left - right,
    );
  };
}

/**
 * One motion sequence whose key boundaries refine the fixed clock.
 *
 * @author Samchon
 */
interface ISequence {
  /** Sequence length in seconds; one loop cycle when it loops. */
  duration: number;

  /** Whether the sequence repeats from its start after `duration`. */
  loop: boolean;

  /** Key times in sequence-local seconds, in any order. */
  times: readonly number[];
}

/** Every key time of every track of one clip. */
function clipSequence(clip: IAutoMovieClip): ISequence {
  return {
    duration: clip.duration,
    loop: clip.loop,
    times: clip.tracks.flatMap(
      (track: IAutoMovieTrack): number[] => track.times,
    ),
  };
}

/** Refuse a clip whose interpolation or loop seam escapes its endpoint bound. */
function assertClipBoundable(
  clip: IAutoMovieClip,
  rotationMatters: boolean,
  seam: string,
): void {
  if (
    clip.tracks.some(
      (track: IAutoMovieTrack): boolean =>
        track.interpolation === "cubicspline",
    )
  )
    throw new Error(
      `camera clearance cannot conservatively bound clip "${clip.id}" with cubicspline interpolation; use linear or step interpolation`,
    );
  if (!clipLoopIsClosed(clip, rotationMatters))
    throw new Error(
      `camera clearance cannot conservatively bound clip "${clip.id}" across an open loop seam; close ${seam}`,
    );
}

/** Add every key boundary inside the shot, repeating a looping sequence. */
function addSequenceBoundaries(
  result: Set<number>,
  shotDuration: number,
  sequence: ISequence,
): void {
  if (!(Number.isFinite(sequence.duration) && sequence.duration > 0))
    throw new Error(
      "camera clearance cannot sample a motion sequence without a finite positive duration",
    );
  const cycles: number = sequence.loop
    ? Math.ceil(shotDuration / sequence.duration)
    : 1;
  if (!Number.isSafeInteger(cycles) || cycles < 0)
    throw new Error(
      "camera clearance cannot enumerate a motion sequence whose cycle count is not a non-negative safe integer",
    );
  for (let cycle: number = 0; cycle < cycles; cycle++)
    for (const time of sequence.times) {
      const absolute: number = cycle * sequence.duration + time;
      if (Number.isFinite(absolute) && absolute > 0 && absolute < shotDuration)
        result.add(absolute);
    }
}

/** Whether two component vectors are exactly identical. */
function sameComponents(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (component: number, index: number): boolean => component === right[index],
    )
  );
}

/** Largest absolute component of a scale, the factor a sphere grows by. */
function maximumScale(scale: { x: number; y: number; z: number }): number {
  return Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
}

/** Whether a looping actor returns its root translation and radius to the seam. */
function actorLoopIsClosed(motion: IAutoMovieMotion): boolean {
  if (!motion.loop) return true;
  const first:
    | IAutoMovieMotion["keyframes"][number]["pose"]["root"]
    | undefined = motion.keyframes[0]?.pose.root;
  const last:
    | IAutoMovieMotion["keyframes"][number]["pose"]["root"]
    | undefined = motion.keyframes[motion.keyframes.length - 1]?.pose.root;
  if (first === undefined || last === undefined) return false;
  if (first === null || last === null) return first === last;
  return (
    sameComponents(
      [first.translation.x, first.translation.y, first.translation.z],
      [last.translation.x, last.translation.y, last.translation.z],
    ) && maximumScale(first.scale) === maximumScale(last.scale)
  );
}

/** Whether every node channel the bound reads returns to its loop seam. */
function clipLoopIsClosed(
  clip: IAutoMovieClip,
  rotationMatters: boolean,
): boolean {
  if (!clip.loop) return true;
  return clip.tracks.every((track: IAutoMovieTrack): boolean => {
    if (
      track.channel.kind !== "node" ||
      (track.channel.path === "rotation" && !rotationMatters)
    )
      return true;
    const width: number = track.values.length / track.times.length;
    if (!(Number.isSafeInteger(width) && width > 0)) return false;
    const first: number[] = track.values.slice(0, width);
    const last: number[] = track.values.slice(track.values.length - width);
    if (track.channel.path !== "rotation") return sameComponents(first, last);
    return (
      sameComponents(first, last) ||
      sameComponents(
        first,
        last.map((component: number): number => -component),
      )
    );
  });
}
