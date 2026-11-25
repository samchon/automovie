import {
  IAutoMovieActionCall,
  type IAutoMovieActionSynthesizer,
  IAutoMovieClip,
  type IAutoMovieCompilePerformShotLaunches,
  type IAutoMovieEnginePerformShotActionPlan,
  type IAutoMovieEnginePerformShotGateContext,
  IAutoMovieInteractionEvent,
  type IAutoMovieLaunchResult,
  type IAutoMoviePerformShotLaunchJob,
  IAutoMovieQuaternion,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";

import { compilePerformance } from "../perform/compilePerformance";
import { animatedBaseAt } from "./animatedBaseAt";
import { compileLaunch } from "./compileLaunch";
import { performShotActors } from "./performShotActors";

/**
 * Solve every gated launch, bake each projectile's flight onto the shot clock,
 * and fold each target's engine-timed recoil into the stage list.
 *
 * Runs before the performance compiles, so an injected recoil rides the same
 * synthesis and range-of-motion gate as an authored `react`. For each job:
 *
 * - A `bone` aim with a live resolver leads the bone as it moves. A node aim
 *   whose target carries a `locomote` leads the node's animated base, compiled
 *   from that node's own actions; its own recoil fires at impact, past the lead
 *   window, so it does not perturb the path being sampled. Any other aim is the
 *   plain intercept.
 * - A flight that cannot reach the target at the given speed, or that lands more
 *   than `1e-9` s after the shot ends, is one `range` violation at the action's
 *   `speed`, and contributes nothing.
 * - Flight keys shift by the action start and the clip spans the shot. Before its
 *   first key, sampleClipSequence gives that flight no channel authority,
 *   leaving staged placement or an earlier started clip in charge; after
 *   landing its last key holds. Later flights of one projectile receive the id
 *   suffix :<n>.
 * - The flight's events carry the action's index, and its recoil, when the launch
 *   has one, is appended to `plan.stageActions` with the violation path of the
 *   launch's `onHit`, because the recoil has no `region` field of its own. The
 *   recoil stays exempt from the region-overlap gate: the engine schedules it
 *   at an instant the author cannot know, and the layering envelope bounds its
 *   blend to the flinch window.
 *
 * @param context The shot's staged tables and collector.
 * @param plan The action plan; recoils are appended to its stage list.
 * @param synthesize The shot's memoized synthesizer.
 * @param rotations Each staged node's world rotation, by id.
 * @returns The baked flight clips and their events, in job order.
 */
export function compilePerformShotLaunches(
  context: IAutoMovieEnginePerformShotGateContext,
  plan: IAutoMovieEnginePerformShotActionPlan,
  synthesize: IAutoMovieActionSynthesizer,
  rotations: ReadonlyMap<string, IAutoMovieQuaternion>,
): IAutoMovieCompilePerformShotLaunches.IResult {
  const duration: number = context.performance.duration;
  const clips: IAutoMovieClip[] = [];
  const events: IAutoMovieInteractionEvent[] = [];
  const flights: Map<string, number> = new Map();
  for (const job of plan.launches) {
    const result: IAutoMovieLaunchResult | null = compileLaunch({
      action: job.action,
      origin: job.origin,
      target: job.target,
      targetNode: job.targetNode,
      targetAt: leadOf(context, plan, job, synthesize, rotations),
    });
    const path: string = `${context.base}[${job.index}].speed`;
    if (result === null) {
      context.out.push(
        "range",
        path,
        `the launch cannot reach its target at ${job.action.speed} m/s, raise the speed or move the shooter closer`,
        job.action.speed,
      );
      continue;
    }
    const hitAt: number = job.action.start + result.hitTime;
    if (hitAt > duration + 1e-9) {
      context.out.push(
        "range",
        path,
        `the launch lands at ${hitAt}s, outside the shot ending at ${duration}s, fire earlier, raise the speed, or lengthen the shot`,
        job.action.speed,
      );
      continue;
    }
    const flight: number = (flights.get(result.clip.id) ?? 0) + 1;
    flights.set(result.clip.id, flight);
    clips.push({
      ...result.clip,
      id: flight === 1 ? result.clip.id : `${result.clip.id}:${flight}`,
      duration,
      tracks: result.clip.tracks.map(
        (track: IAutoMovieTrack): IAutoMovieTrack => ({
          ...track,
          times: track.times.map(
            (time: number): number => time + job.action.start,
          ),
        }),
      ),
    });
    events.push(
      ...result.events.map(
        (event: IAutoMovieInteractionEvent): IAutoMovieInteractionEvent => ({
          ...event,
          actionIndex: job.index,
        }),
      ),
    );
    if (result.react !== null) {
      plan.stageActions.push(result.react);
      plan.stageActionPaths.push(`${context.base}[${job.index}].onHit`);
    }
  }
  return { clips, events };
}

/** Where a launch's target is over time, or undefined for a static aim. */
function leadOf(
  context: IAutoMovieEnginePerformShotGateContext,
  plan: IAutoMovieEnginePerformShotActionPlan,
  job: IAutoMoviePerformShotLaunchJob,
  synthesize: IAutoMovieActionSynthesizer,
  rotations: ReadonlyMap<string, IAutoMovieQuaternion>,
): ((seconds: number) => IAutoMovieVector3) | undefined {
  const targetAt: IAutoMovieEnginePerformShotGateContext["targetAt"] =
    context.targetAt;
  if (job.action.at.kind === "bone" && targetAt !== undefined)
    return (seconds: number): IAutoMovieVector3 =>
      targetAt(job.action.at, seconds) ?? job.target;
  const node: string | null = job.targetNode;
  if (node === null) return undefined;
  const own: IAutoMovieActionCall[] = plan.stageActions.filter(
    (action: IAutoMovieActionCall): boolean =>
      performShotActors(action).includes(node),
  );
  if (
    !own.some(
      (action: IAutoMovieActionCall): boolean => action.verb === "locomote",
    )
  )
    return undefined;
  return animatedBaseAt(
    context.nodePositions.get(node)!,
    rotations.get(node)!,
    compilePerformance(own, synthesize).performances[node]!,
  );
}
