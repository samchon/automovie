import { AutoMovieBodyRegion, AutoMovieHumanoidBone, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { IAutoMoviePlacement } from "../motion/IAutoMoviePlacement";
import { sampleMotion } from "../motion/sampleMotion";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { blendPoses } from "./blendPoses";
import { bodyRegionBones } from "./bodyRegionBones";
import { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";

/**
 * What {@link compilePerformance} produced: the per-actor clips, and the
 * authored content its region masks discarded.
 *
 * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-local-clock Carries the resolved per-actor motions on their shot-local performance clock.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Defines the public receipt for a compiled actor performance.
 * @author Samchon
 */
export interface IAutoMovieCompiledPerformance {
  /**
   * Per-actor performance motion, keyed by actor node id.
   *
   * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-local-clock Binds every compiled actor motion to its resolved shot-local timeline.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Emits the per-actor resolved performance state.
   */
  performances: Record<string, IAutoMovieMotion>;

  /**
   * Every piece of authored content a region mask dropped, ordered by action
   * index then actor. Empty when every clip fell inside its own region, which
   * is the ordinary case.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Preserves every non-empty mask loss beside the compiled performance.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Makes layer-composition omissions part of the public result rather than a silent drop.
   */
  masked: IAutoMovieMaskedContent[];
}

/** One placed clip, carrying the index of the action that produced it. */
interface IAutoMovieRegionPlacement extends IAutoMoviePlacement {
  /** Index into the action list `compilePerformance` was given. */
  action: number;
}

/**
 * What one mask trimmed, before the action and actor that own it are known.
 * Stated once, off {@link IAutoMovieMaskedContent}, so the three channels cannot
 * be listed differently in the two places that read them.
 */
type IAutoMovieMaskedChannels = Pick<
  IAutoMovieMaskedContent,
  "bones" | "root" | "expression"
>;

/** Whether a mask record carries anything worth reporting. */
const maskedAnything = (masked: IAutoMovieMaskedChannels): boolean =>
  masked.bones.length > 0 || masked.root || masked.expression;

const maskMotionToRegion = (
  motion: IAutoMovieMotion,
  region: AutoMovieBodyRegion,
  keepRoot: boolean,
): IAutoMovieMaskedChannels & { motion: IAutoMovieMotion } => {
  const bones = new Set(bodyRegionBones(region));
  // Expression is FACE content: joints are made disjoint by the bone filter
  // below, but a synthesizer authoring an expression on a non-face clip (a
  // grimace on a fullBody stagger) used to ride through and overlap an emote
  // ungated. Layering resolves expressions last-envelope-wins, so one
  // silently ate the other (#1101). Stripping it here makes the fullBody↔face
  // exemption's disjointness claim true by construction: only the face
  // region's owner speaks for the face.
  const keepExpression = region === "face";
  const dropped = new Set<AutoMovieHumanoidBone>();
  let droppedRoot = false;
  let droppedExpression = false;
  const keyframes = motion.keyframes.map((keyframe) => {
    if (!keepRoot && keyframe.pose.root !== null) droppedRoot = true;
    if (!keepExpression && keyframe.expression !== null)
      droppedExpression = true;
    return {
      ...keyframe,
      expression: keepExpression ? keyframe.expression : null,
      pose: {
        ...keyframe.pose,
        root: keepRoot ? keyframe.pose.root : null,
        joints: keyframe.pose.joints.filter((joint) => {
          if (bones.has(joint.bone)) return true;
          dropped.add(joint.bone);
          return false;
        }),
      },
    };
  });
  return {
    motion: { ...motion, keyframes },
    // Sorted so the reported list is stable whatever order the keyframes
    // happened to name the bones in (the engine is deterministic, and its
    // diagnostics are part of that).
    bones: [...dropped].sort(compareCodeUnits),
    root: droppedRoot,
    expression: droppedExpression,
  };
};

/**
 * Layer several per-region clips into one by **sampling and blending**: at
 * every keyframe time across the clips, sample each and {@link blendPoses} the
 * result (equal weight: the regions are disjoint here, so the additive blend
 * equals a union), so disjoint regions play _concurrently_ (legs walk while
 * arms wave while the head tracks). A face clip's expression rides along.
 *
 * A region claims its bones only from its first keyframe onward (#1003):
 * clamp-sampling before that would replay a late lookAt's aim (or a react's
 * explicit-zero rest) backward over the whole shot, breaking causality. PAST
 * its last keyframe a region keeps only its ROOT (a walk's destination
 * persists) while joint and expression claims release, so a finished flinch or
 * emote stops diluting whatever other regions do next.
 *
 * The envelope must hold BETWEEN union keyframes too (#1060): the composite is
 * later interpolated by {@link sampleMotion}, so gating only at union times
 * would ramp a late clip's content backward across the entire preceding segment
 * (a lookAt at 4s visibly turning the head from t=0), and expressions, which
 * interpolation carries at full strength from either segment end, would leak
 * all the way back. Boundary keyframes at `first − ε` / `last + ε` pin each
 * envelope edge onto the grid, so every interpolated segment lies entirely
 * inside or entirely outside the envelope.
 */
const layerClips = (
  id: string,
  clips: IAutoMovieMotion[],
): IAutoMovieMotion => {
  const envelopes = clips.map((clip) => ({
    clip,
    first: clip.keyframes[0]!.time,
    last: clip.keyframes[clip.keyframes.length - 1]!.time,
  }));
  const timeSet = new Set(clips.flatMap((c) => c.keyframes.map((k) => k.time)));
  const earliest = Math.min(...envelopes.map((e) => e.first));
  const latest = Math.max(...envelopes.map((e) => e.last));
  for (const { first, last } of envelopes) {
    if (first - earliest > BOUNDARY_EPSILON)
      timeSet.add(first - BOUNDARY_EPSILON);
    if (latest - last > BOUNDARY_EPSILON) timeSet.add(last + BOUNDARY_EPSILON);
  }
  const times = [...timeSet].sort((a, b) => a - b);
  const keyframes: IAutoMovieKeyframe[] = times.map((time) => {
    // An inserted boundary time may fall where NO envelope contributes (all
    // clips rootless and out of span). That instant is honestly rest.
    const samples: { pose: IAutoMoviePose; weight: number }[] = [];
    let expression = null;
    for (const { clip, first, last } of envelopes) {
      if (time < first - 1e-9) continue; // not started: no claim yet
      const s = sampleMotion(clip, time);
      if (time > last + 1e-9) {
        if (s.pose.root !== null)
          samples.push({
            pose: { skeleton: clip.skeleton, root: s.pose.root, joints: [] },
            weight: 1,
          });
        continue; // ended: the root persists, the joints release
      }
      samples.push({ pose: s.pose, weight: 1 });
      if (s.expression !== null) expression = s.expression;
    }
    return {
      time,
      pose:
        samples.length === 0
          ? { skeleton: clips[0]!.skeleton, root: null, joints: [] }
          : blendPoses(samples),
      expression,
      easing: "linear",
      bezier: null,
    };
  });
  // Disjoint regions mean at most ONE clip strides (the root-bearing
  // locomotion region); its cycle is the layered composite's cycle. Two
  // striding regions would be ambiguous, so the clock is honestly dropped.
  const cycles = clips
    .map((clip) => clip.gaitCycle ?? null)
    .filter((cycle) => cycle !== null);

  return {
    id,
    skeleton: clips[0]!.skeleton,
    duration: times[times.length - 1]!,
    loop: false,
    keyframes,
    gaitCycle: cycles.length === 1 ? cycles[0]! : null,
  };
};

/**
 * Hold rest before a late-starting composite (#1003). A shot samples its
 * performance from t=0 with clamping, which would otherwise replay the first
 * keyframe's pose backward over the pre-action span (a lookAt at 3s aimed from
 * frame 0). The `step` easing holds the rest pose across the whole lead-in
 * segment, so the action still begins exactly at its authored start.
 *
 * A second rest keyframe at `first − ε` closes the expression hole (#1060):
 * expression interpolation ignores easing and carries a segment-end expression
 * at full strength from either endpoint, so the step pad alone held the POSE
 * but let a late emote's face leak back to t=0. With rest at both ends the
 * lead-in segment is null-expression throughout.
 */
const padRestLeadIn = (motion: IAutoMovieMotion): IAutoMovieMotion => {
  const first = motion.keyframes[0]!.time;
  if (first <= 1e-9) return motion;
  const rest = (
    time: number,
    easing: IAutoMovieKeyframe["easing"],
  ): IAutoMovieKeyframe => ({
    time,
    pose: { skeleton: motion.skeleton, root: null, joints: [] },
    expression: null,
    easing,
    bezier: null,
  });
  return {
    ...motion,
    keyframes: [
      rest(0, "step"),
      ...(first > BOUNDARY_EPSILON
        ? [rest(first - BOUNDARY_EPSILON, "linear")]
        : []),
      ...motion.keyframes,
    ],
  };
};

/**
 * What one mask trimmed, before the action and actor that own it are known.
 * Stated once, off {@link IAutoMovieMaskedContent}, so the three channels cannot
 * be listed differently in the two places that read them.
 */
type IAutoMovieMaskedChannels = Pick<
  IAutoMovieMaskedContent,
  "bones" | "root" | "expression"
>;
