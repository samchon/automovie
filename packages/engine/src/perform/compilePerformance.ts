import { AutoMovieBodyRegion, IAutoMovieActionCall, IAutoMovieMotion } from "@automovie/interface";
import { IAutoMoviePlacement } from "../motion/IAutoMoviePlacement";
import { arrangeMotion } from "../motion/arrangeMotion";
import { sequenceMotion } from "../motion/sequence";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { actionRegion } from "./actionRegion";
import { IAutoMovieActionSynthesizer } from "./IAutoMovieActionSynthesizer";
import { IAutoMovieCompiledPerformance } from "./IAutoMovieCompiledPerformance";
import { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";

/**
 * Compile a shot's flat {@link IAutoMovieActionCall} list into **one performance
 * clip per actor**, keyed by node id.
 *
 * The builder does the orchestration the PERFORMANCE stage needs and the
 * engine primitives do not: it **splits unison actions** (`actor: string[]`)
 * onto each actor's timeline; **expands `repeat`** by concatenating the
 * synthesised cycle ({@link sequenceMotion}); and groups each actor's actions by
 * **body region**. Actions sharing a region are placed on one timeline and
 * **held across gaps** ({@link arrangeMotion}): they take turns. Actions on
 * **disjoint** regions are **layered** ({@link layerClips}): a walk can play at
 * the same time as a content-disjoint gesture or look-at. Actions in one broad
 * region normally share an arranged timeline; when two overlap on disjoint
 * carried bones they receive separate lanes and layer without either being
 * truncated. The per-action keyframes come entirely from `synthesize`. A `null`
 * synthesis is skipped.
 *
 * The builder also **states what it did not apply**: every clip the region
 * mask trimmed rides back on `masked` (#1349), so the caller that owns the
 * success envelope can refuse or report it instead of returning a clip that
 * silently omits half of what the author asked for.
 *
 * @param actions The shot's action calls (any order; arranged by `start`).
 * @param synthesize The content seam: one action → one base clip (or null).
 * @returns Per-actor performance motion keyed by actor node id, plus every
 *   piece of authored content the region mask discarded.
 * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-local-clock Compiles authored action calls into actor-keyed shot motion on the declared local clock.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Schedules each actor action on its shot-local performance timeline.
 * @author Samchon
 */
export const compilePerformance = (
  actions: IAutoMovieActionCall[],
  synthesize: IAutoMovieActionSynthesizer,
): IAutoMovieCompiledPerformance => {
  // 1. fan each action to every actor that performs it, grouped by body region
  const byActor = new Map<
    string,
    Map<AutoMovieBodyRegion, IAutoMovieRegionPlacement[]>
  >();
  actions.forEach((action, index) => {
    const actors =
      typeof action.actor === "string" ? [action.actor] : action.actor;
    for (const actor of actors) {
      const base = synthesize(action, actor);
      if (base === null) continue; // no motion for this actor, skip

      // 2. repeat: concatenate the base cycle N times within the action's span
      const cycles =
        action.repeat !== undefined && action.repeat > 1 ? action.repeat : 1;
      const motion =
        cycles > 1
          ? sequenceMotion(
              `${base.id}:x${cycles}`,
              Array.from({ length: cycles }, () => base),
            )
          : base;

      const region = actionRegion(action);
      const regions =
        byActor.get(actor) ??
        new Map<AutoMovieBodyRegion, IAutoMovieRegionPlacement[]>();
      const placements = regions.get(region) ?? [];
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
    const layered = regions.size > 1;
    const regionClips = [...regions.entries()].flatMap(
      ([region, placements]) => {
        const keepRoot = !layered || ROOT_REGIONS.has(region);
        const lanes: Array<{
          end: number;
          placements: IAutoMoviePlacement[];
        }> = [];
        for (const placement of [...placements].sort(
          (a, b) => a.start - b.start || a.action - b.action,
        )) {
          const trimmed = maskMotionToRegion(
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
          const item = { start: placement.start, motion: trimmed.motion };
          const lane = lanes.find(
            (candidate) => candidate.end <= item.start + 1e-9,
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
        return lanes.map((lane, index) =>
          arrangeMotion(`perform:${actor}:${region}:${index}`, lane.placements),
        );
      },
    );
    performances[actor] = padRestLeadIn(
      regionClips.length === 1
        ? { ...regionClips[0]!, id: `perform:${actor}` }
        : layerClips(`perform:${actor}`, regionClips),
    );
  }
  // Action order first, then actor, so the report reads in the order the author
  // wrote the shot rather than in Map-insertion order.
  masked.sort(
    (a, b) => a.action - b.action || compareCodeUnits(a.actor, b.actor),
  );
  return { performances, masked };
};
