import {
  IAutoMovieActionCall,
  IAutoMovieBlocking,
  IAutoMoviePerformance,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IPerformShotFrameJob } from "./IPerformShotFrameJob";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { performShotActionSpan } from "./performShotActionSpan";
import { performShotActors } from "./performShotActors";

/**
 * Refuse a performance that does not realize the beat's blocking.
 *
 * When the pipeline blocked the beat, the performance must play that plan and
 * not another: the same beat id, a duration within `1e-6` s of the blocked
 * one, every timing anchor covered by a stage action of its actor whose span
 * contains the anchor within `1e-9` s, and the blocked camera intent honoured
 * by the first frame move, its framing and its move. Without a frame move, only
 * a `static` intent is honoured, by the locked-off camera. Each failure is one
 * violation at the field that disagrees.
 *
 * @param context The shot's staged tables and collector.
 * @param blocking The beat's validated blocking.
 * @param stageActions The non-`frame` actions, before any injected recoil.
 * @param frames The frame jobs, already sorted by start.
 *
 * @evidence contracts/common.md#principled-implementation Compares the plan and the realization field by field, with anchor coverage decided by interval containment over the shared action span and the camera intent by the earliest frame move, which is the move the intent describes; the tolerances absorb floating start arithmetic only.
 * @evidence contracts/common.md#clear-and-simple-design The coherence check between two pipeline stages in one place, reading spans and actors through the shared helpers so an anchor is judged over the same interval the overlap gate uses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every anchor and actor is held to the same rule; a missing frame move is accepted only for a `static` intent, which a locked-off camera does realize, and never for a moving one.
 * @evidence contracts/common.md#meaningful-documentation States each coherence rule with its tolerance, the static-intent exception, which frame move is compared and why the list must be sorted, and where violations land.
 * @evidence contracts/performance.md#efficient-algorithms Linear in anchors times stage actions for coverage, which is small per beat, plus constant work for the beat, duration and camera checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One comparison of one blocking with one performance per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pushes violations into the shared collector and retains nothing.
 */
export function gatePerformShotBlocking (
  context: IPerformShotGateContext,
  blocking: IAutoMovieBlocking,
  stageActions: readonly IAutoMovieActionCall[],
  frames: readonly IPerformShotFrameJob[],
): void {
  const out: ViolationCollector = context.out;
  const performance: IAutoMoviePerformance = context.performance;
  const base: string = context.base;
  if (blocking.beat !== performance.beat)
    out.push(
      "type",
      "$input.beat",
      `the performance realizes beat "${performance.beat}" but the blocking plans "${blocking.beat}"`,
      performance.beat,
    );
  if (Math.abs(blocking.duration - performance.duration) > 1e-6)
    out.push(
      "range",
      "$input.duration",
      `the blocking fixed this beat at ${blocking.duration}s, but the performance runs ${performance.duration}s`,
      performance.duration,
    );
  for (const intent of blocking.actors)
    for (const anchor of intent.anchors ?? []) {
      const covered: boolean = stageActions.some(
        (action: IAutoMovieActionCall): boolean => {
          if (!performShotActors(action).includes(intent.node)) return false;
          const [from, to]: [number, number] = performShotActionSpan(
            action,
            performance.duration,
          );
          return anchor.t >= from - 1e-9 && anchor.t <= to + 1e-9;
        },
      );
      if (!covered)
        out.push(
          "range",
          base,
          `anchor "${anchor.cue}" pins ${intent.node} at t=${anchor.t}s, but no action of that actor covers the instant`,
          anchor.t,
        );
    }
  const lead: IPerformShotFrameJob | undefined = frames[0];
  if (lead === undefined) {
    if (blocking.camera.move !== "static")
      out.push(
        "type",
        base,
        `the blocking asks for a "${blocking.camera.move}" camera, but no frame action authors it`,
        blocking.camera.move,
      );
    return;
  }
  if (lead.action.framing !== blocking.camera.framing)
    out.push(
      "type",
      `${base}[${lead.index}].framing`,
      `the blocking frames this beat "${blocking.camera.framing}", but the performance frames "${lead.action.framing}"`,
      lead.action.framing,
    );
  if (lead.action.move !== blocking.camera.move)
    out.push(
      "type",
      `${base}[${lead.index}].move`,
      `the blocking moves the camera "${blocking.camera.move}", but the performance moves "${lead.action.move}"`,
      lead.action.move,
    );
}
