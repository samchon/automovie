import type { IAutoMovieTransform, IAutoMovieJointPose, AutoMovieEasing, IAutoMovieGaitCycle, AutoMovieBodyRegion, AutoMovieHumanoidBone, IAutoMovieActionCall, IAutoMovieExpression, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import type { IAutoMovieMotionSample } from "../motion/IAutoMovieMotionSample";

import { IAutoMoviePlacement } from "../motion/IAutoMoviePlacement";
import { arrangeMotion } from "../motion/arrangeMotion";
import { sampleMotion } from "../motion/sampleMotion";
import { sequenceMotion } from "../motion/sequenceMotion";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMovieActionSynthesizer } from "./IAutoMovieActionSynthesizer";
import { IAutoMovieCompiledPerformance } from "./IAutoMovieCompiledPerformance";
import { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";
import { actionRegion } from "./actionRegion";
import { blendPoses } from "./blendPoses";
import { bodyRegionBones } from "./bodyRegionBones";



const ROOT_REGIONS: Set<AutoMovieBodyRegion> = new Set<AutoMovieBodyRegion>(["lowerBody", "fullBody"]);


/**
 * Boundary-pin width in seconds, greater than the 1e-9 envelope comparison tolerance. Composite interpolation can still ramp over this one-microsecond interval; the constant proves no visual threshold.
 */
const BOUNDARY_EPSILON: number = 1e-6 as const;


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
const maskedAnything: (masked: IAutoMovieMaskedChannels) => boolean = (masked: IAutoMovieMaskedChannels): boolean =>
  masked.bones.length > 0 || masked.root || masked.expression;


const maskMotionToRegion: (motion: IAutoMovieMotion, region: AutoMovieBodyRegion, keepRoot: boolean) => IAutoMovieMaskedChannels & { motion : IAutoMovieMotion } = (
  motion: IAutoMovieMotion,
  region: AutoMovieBodyRegion,
  keepRoot: boolean,
): IAutoMovieMaskedChannels & { motion: IAutoMovieMotion } => {
  const bones: Set<AutoMovieHumanoidBone> = new Set(bodyRegionBones(region));
  // Expression is FACE content: joints are made disjoint by the bone filter
  // below, but a synthesizer authoring an expression on a non-face clip (a
  // grimace on a fullBody stagger) used to ride through and overlap an emote
  // ungated. Layering resolves expressions last-envelope-wins, so one
  // silently ate the other (#1101). Stripping it here makes the fullBody↔face
  // exemption's disjointness claim true by construction: only the face
  // region's owner speaks for the face.
  const keepExpression: boolean = region === "face";
  const dropped: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  let droppedRoot: boolean = false;
  let droppedExpression: boolean = false;
  const keyframes: { expression: IAutoMovieExpression | null; pose: { root: IAutoMovieTransform | null; joints: IAutoMovieJointPose[]; skeleton: string; }; time: number; easing: AutoMovieEasing; bezier: [number, number, number, number] | null; }[] = motion.keyframes.map((keyframe: IAutoMovieKeyframe) : { expression: IAutoMovieExpression | null; pose: { root: IAutoMovieTransform | null; joints: IAutoMovieJointPose[]; skeleton: string; }; time: number; easing: AutoMovieEasing; bezier: [number, number, number, number] | null; } => {
    if (!keepRoot && keyframe.pose.root !== null) droppedRoot = true;
    if (!keepExpression && keyframe.expression !== null)
      droppedExpression = true;
    return {
      ...keyframe,
      expression: keepExpression ? keyframe.expression : null,
      pose: {
        ...keyframe.pose,
        root: keepRoot ? keyframe.pose.root : null,
        joints: keyframe.pose.joints.filter((joint: IAutoMovieJointPose) : boolean => {
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
 * Sample each region clip at the union of its keyframe and boundary times, then blend set axes with equal weights. Disjoint axes form a union; overlapping axes take an arithmetic mean. A face clip supplies expression.
 *
 * Before its first frame a clip contributes nothing; after its last frame it keeps only its root, preserving a walk destination while releasing joint and expression claims.
 *
 * Boundary samples narrow preceding/following interpolation ramps to at most BOUNDARY_EPSILON. Expressions interpolate against neutral when one endpoint is absent, using segment easing like pose. These samples shorten transitions rather than making discontinuous envelopes.
 */
const layerClips: (id: string, clips: IAutoMovieMotion [ ]) => IAutoMovieMotion = (
  id: string,
  clips: IAutoMovieMotion[],
): IAutoMovieMotion => {
  const envelopes: { clip: IAutoMovieMotion; first: number; last: number; }[] = clips.map((clip: IAutoMovieMotion) : { clip: IAutoMovieMotion; first: number; last: number; } => ({
    clip,
    first: clip.keyframes[0]!.time,
    last: clip.keyframes[clip.keyframes.length - 1]!.time,
  }));
  const timeSet: Set<number> = new Set(clips.flatMap((c: IAutoMovieMotion) : number[] => c.keyframes.map((k: IAutoMovieKeyframe) : number => k.time)));
  const earliest: number = Math.min(...envelopes.map((e: { clip: IAutoMovieMotion; first: number; last: number; }) : number => e.first));
  const latest: number = Math.max(...envelopes.map((e: { clip: IAutoMovieMotion; first: number; last: number; }) : number => e.last));
  for (const { first, last } of envelopes) {
    if (first - earliest > BOUNDARY_EPSILON)
      timeSet.add(first - BOUNDARY_EPSILON);
    if (latest - last > BOUNDARY_EPSILON) timeSet.add(last + BOUNDARY_EPSILON);
  }
  const times: number[] = [...timeSet].sort((a: number, b: number) : number => a - b);
  const keyframes: IAutoMovieKeyframe[] = times.map((time: number) : { time: number; pose: IAutoMoviePose; expression: IAutoMovieExpression | null; easing: "linear"; bezier: null; } => {
    // An inserted boundary time may fall where NO envelope contributes (all
    // clips rootless and out of span). That instant is honestly rest.
    const samples: { pose: IAutoMoviePose; weight: number }[] = [];
    let expression: IAutoMovieExpression | null = null;
    for (const { clip, first, last } of envelopes) {
      if (time < first - 1e-9) continue; // not started: no claim yet
      const s: IAutoMovieMotionSample = sampleMotion(clip, time);
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
  // A single stride clock survives layering; multiple clock-bearing clips
  // are ambiguous and clear the composite clock, even when clocks agree.
  const cycles: IAutoMovieGaitCycle[] = clips
    .map((clip: IAutoMovieMotion) : IAutoMovieGaitCycle | null => clip.gaitCycle ?? null)
    .filter((cycle: IAutoMovieGaitCycle | null) : cycle is IAutoMovieGaitCycle => cycle !== null);

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
 * Hold rest before a late-starting composite, preventing clamp sampling from extending its first pose across the lead-in. Step easing holds rest up to the optional short linear boundary segment.
 *
 * A second rest frame keeps both ends of the long lead-in at null expression. The final linear segment can begin pose and neutral-to-expression interpolation up to one BOUNDARY_EPSILON before authored start; exact onset is not guaranteed.
 */
const padRestLeadIn: (motion: IAutoMovieMotion) => IAutoMovieMotion = (motion: IAutoMovieMotion): IAutoMovieMotion => {
  const first: number = motion.keyframes[0]!.time;
  if (first <= 1e-9) return motion;
  const rest: (time: number, easing: IAutoMovieKeyframe [ "easing" ]) => IAutoMovieKeyframe = (
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
 * Compile admitted actions through an injected synthesizer into exact actor-keyed timelines and deterministic region-loss reports. Null synthesis is skipped; repeat expands one returned cycle, same-region nonoverlapping actions arrange into lanes, and concurrent lanes layer sampled poses.
 *
 * @evidence contracts/common.md#principled-implementation Fans unison actors, assigns stable start/action-order lanes, masks actual channels, then samples the union of keyframe and envelope-boundary times; epsilon boundary pins prevent long backward interpolation leaks while persistent roots outlive joint/expression envelopes.
 * @evidence contracts/common.md#clear-and-simple-design The compiler owns assembly and loss reporting; synthesis owns rig-specific content, arrangeMotion owns gaps, and blendPoses owns per-axis composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-6 second boundary pin and 1e-9 envelope comparisons are existing temporal tolerances; loss is reported rather than hidden, and arbitrary actor keys are stored as own data properties.
 * @evidence contracts/common.md#meaningful-documentation States admitted inputs, null handling, repeat behavior, regional lanes, persistent roots, exact actor keys and mask ordering; sampling remains approximate between union instants.
 * @evidence contracts/performance.md#efficient-algorithms For A action/actor expansions, K repeated keyframes, P placements and U union times over L lanes, assembly copies O(K), lane sorting costs O(P log P) plus O(P L) lane search, and layering visits every lane per union time plus its motion sampling and joint blend cost; output/storage grow with authored repeats and samples.
 * @evidence contracts/performance.md#reuse-equivalent-work One synthesized base is reused for repeats, one mask pass also records loss, and union times are deduplicated before sampling; callbacks are not cached across distinct actions because their content may depend on action/actor state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns performances and reports; lane maps, grids and accumulators are released after return/throw, borrowed nested motion content follows helper contracts, and no retained host/task exists.
 */
export const compilePerformance: (actions: IAutoMovieActionCall [ ], synthesize: IAutoMovieActionSynthesizer) => IAutoMovieCompiledPerformance = (
  actions: IAutoMovieActionCall[],
  synthesize: IAutoMovieActionSynthesizer,
): IAutoMovieCompiledPerformance => {
  // 1. fan each action to every actor that performs it, grouped by body region
  const byActor: Map<string, Map<AutoMovieBodyRegion, IAutoMovieRegionPlacement[]>> = new Map<
    string,
    Map<AutoMovieBodyRegion, IAutoMovieRegionPlacement[]>
  >();
  actions.forEach((action: IAutoMovieActionCall, index: number) : void => {
    const actors: string[] =
      typeof action.actor === "string" ? [action.actor] : action.actor;
    for (const actor of actors) {
      const base: IAutoMovieMotion | null = synthesize(action, actor);
      if (base === null) continue; // no motion for this actor, skip

      // 2. repeat: concatenate the base cycle N times within the action's span
      const cycles: number =
        action.repeat !== undefined && action.repeat > 1 ? action.repeat : 1;
      const motion: IAutoMovieMotion =
        cycles > 1
          ? sequenceMotion(
              `${base.id}:x${cycles}`,
              Array.from({ length: cycles }, () : IAutoMovieMotion => base),
            )
          : base;

      const region: AutoMovieBodyRegion = actionRegion(action);
      const regions: Map<AutoMovieBodyRegion, IAutoMovieRegionPlacement[]> =
        byActor.get(actor) ??
        new Map<AutoMovieBodyRegion, IAutoMovieRegionPlacement[]>();
      const placements: IAutoMovieRegionPlacement[] = regions.get(region) ?? [];
      placements.push({ start: action.start, motion, action: index });
      regions.set(region, placements);
      byActor.set(actor, regions);
    }
  });

  // 3. Per actor, arrange non-overlapping placements into region lanes, then
  // layer every lane. Most regions need one lane. Content-disjoint actions may
  // overlap under the same broad region, though, and a second lane preserves
  // both instead of making arrangeMotion truncate one by timestamp.
  const performances: Record<string, IAutoMovieMotion> = {};
  const masked: IAutoMovieMaskedContent[] = [];
  for (const [actor, regions] of byActor) {
    const layered: boolean = regions.size > 1;
    const regionClips: IAutoMovieMotion[] = [...regions.entries()].flatMap(
      ([region, placements]: [AutoMovieBodyRegion, IAutoMovieRegionPlacement[]]) : IAutoMovieMotion[] => {
        const keepRoot: boolean = !layered || ROOT_REGIONS.has(region);
        const lanes: Array<{
          end: number;
          placements: IAutoMoviePlacement[];
        }> = [];
        for (const placement of [...placements].sort(
          (a: IAutoMovieRegionPlacement, b: IAutoMovieRegionPlacement) : number => a.start - b.start || a.action - b.action,
        )) {
          const trimmed: IAutoMovieMaskedChannels & { motion: IAutoMovieMotion; } = maskMotionToRegion(
            placement.motion,
            region,
            keepRoot,
          );
          if (maskedAnything(trimmed))
            masked.push({
              action: placement.action,
              actor,
              region,
              bones: trimmed.bones,
              root: trimmed.root,
              expression: trimmed.expression,
            });
          const item: { start: number; motion: IAutoMovieMotion; } = { start: placement.start, motion: trimmed.motion };
          const lane: { end: number; placements: IAutoMoviePlacement[]; } | undefined = lanes.find(
            (candidate: { end: number; placements: IAutoMoviePlacement[]; }) : boolean => candidate.end <= item.start + 1e-9,
          );
          if (lane === undefined)
            lanes.push({
              end: item.start + item.motion.duration,
              placements: [item],
            });
          else {
            lane.placements.push(item);
            lane.end = item.start + item.motion.duration;
          }
        }
        return lanes.map((lane: { end: number; placements: IAutoMoviePlacement[]; }, index: number) : IAutoMovieMotion =>
          arrangeMotion(`perform:${actor}:${region}:${index}`, lane.placements),
        );
      },
    );
    Object.defineProperty(performances, actor, {
      value: padRestLeadIn(
        regionClips.length === 1
          ? { ...regionClips[0]!, id: `perform:${actor}` }
          : layerClips(`perform:${actor}`, regionClips),
      ),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  // Action order first, then actor, so the report reads in the order the author
  // wrote the shot rather than in Map-insertion order.
  masked.sort(
    (a: IAutoMovieMaskedContent, b: IAutoMovieMaskedContent) : number => a.action - b.action || compareCodeUnits(a.actor, b.actor),
  );
  return { performances, masked };
};
