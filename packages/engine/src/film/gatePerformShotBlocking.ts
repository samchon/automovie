import {
  IAutoMovieActionCall,
  IAutoMovieBlocking,
  type IAutoMovieEnginePerformShotGateContext,
  type IAutoMoviePerformShotFrameJob,
  IAutoMoviePerformance,
  type IAutoMovieViolationAppendSink,
} from "@automovie/interface";

import { performShotActionSpan } from "./performShotActionSpan";
import { performShotActors } from "./performShotActors";

/**
 * Refuse a performance that does not realize the beat's blocking.
 *
 * When the pipeline blocked the beat, the performance must play that plan and
 * not another: the same beat id, a duration within `1e-6` s of the blocked one,
 * every timing anchor covered by a stage action of its actor whose span
 * contains the anchor within `1e-9` s, and the blocked camera intent honoured
 * by the first frame move, its framing and its move. Without a frame move, only
 * a `static` intent is honoured, by the locked-off camera. Each failure is one
 * violation at the field that disagrees.
 *
 * @param context The shot's staged tables and collector.
 * @param blocking The beat's validated blocking.
 * @param stageActions The non-`frame` actions, before any injected recoil.
 * @param frames The frame jobs, already sorted by start.
 */
export function gatePerformShotBlocking(
  context: IAutoMovieEnginePerformShotGateContext,
  blocking: IAutoMovieBlocking,
  stageActions: readonly IAutoMovieActionCall[],
  frames: readonly IAutoMoviePerformShotFrameJob[],
): void {
  const out: IAutoMovieViolationAppendSink = context.out;
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
  const lead: IAutoMoviePerformShotFrameJob | undefined = frames[0];
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
