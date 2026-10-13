import {
  IAutoMovieActionCall,
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieQuaternion,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieActionSynthesizer } from "../perform/IAutoMovieActionSynthesizer";
import { compilePerformance } from "../perform/compilePerformance";
import { IAutoMovieLaunchResult } from "./IAutoMovieLaunchResult";
import { IPerformShotActionPlan } from "./IPerformShotActionPlan";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { IPerformShotLaunchJob } from "./IPerformShotLaunchJob";
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
 * - A flight that cannot reach the target at the given speed, or that lands
 *   more than `1e-9` s after the shot ends, is one `range` violation at the
 *   action's `speed`, and contributes nothing.
 * - The flight is shifted by the action's start and spans the whole shot, so
 *   the projectile holds at its origin before launch and at its landing after.
 *   A second or later flight of one projectile gets the id suffix `:<n>`, so
 *   ids stay unique.
 * - The flight's events carry the action's index, and its recoil, when the
 *   launch has one, is appended to `plan.stageActions` with the violation path
 *   of the launch's `onHit`, because the recoil has no `region` field of its
 *   own. The recoil stays exempt from the region-overlap gate: the engine
 *   schedules it at an instant the author cannot know, and the layering
 *   envelope bounds its blend to the flinch window.
 *
 * @param context The shot's staged tables and collector.
 * @param plan The action plan; recoils are appended to its stage list.
 * @param synthesize The shot's memoized synthesizer.
 * @param rotations Each staged node's world rotation, by id.
 * @returns The baked flight clips and their events, in job order.
 *
 * @evidence contracts/common.md#principled-implementation The ballistic solve is `compileLaunch`'s; leading a moving target samples the same animated base a `follow` camera reads, and the flight is moved onto the shot clock by a constant time shift, which keeps the clip's own interpolation unchanged.
 * @evidence contracts/common.md#clear-and-simple-design The launch stage of `performShot` in one place, between the input gate and the performance compile; the probe compile reuses `compilePerformance` over the target's own actions instead of a private root sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every launch is solved by the same rules; an unreachable or late flight is refused rather than trimmed, and the recoil's region-overlap exemption is a stated product decision with its reason.
 * @evidence contracts/common.md#meaningful-documentation States when it runs and why, the three aim cases, both refusals, how the flight is placed and named, where events and recoils go and why the recoil's path is the `onHit`, and the overlap exemption.
 * @evidence contracts/performance.md#efficient-algorithms Linear in launches times the solve's own cost; a moving target costs one extra compile of only that node's actions per launch.
 * @evidence contracts/performance.md#reuse-equivalent-work The probe compile goes through the shot's memoized synthesizer, so the target's clips it synthesizes are the ones the authoritative compile reuses; its masked report is dropped because that compile reports every drop once at the same paths.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The probe performances are dropped after each solve; the caller owns the returned clips and events, one flight per launch.
 */
export function compilePerformShotLaunches (
  context: IPerformShotGateContext,
  plan: IPerformShotActionPlan,
  synthesize: IAutoMovieActionSynthesizer,
  rotations: ReadonlyMap<string, IAutoMovieQuaternion>,
): { clips: IAutoMovieClip[]; events: IAutoMovieInteractionEvent[] } {
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
function leadOf (
  context: IPerformShotGateContext,
  plan: IPerformShotActionPlan,
  job: IPerformShotLaunchJob,
  synthesize: IAutoMovieActionSynthesizer,
  rotations: ReadonlyMap<string, IAutoMovieQuaternion>,
): ((seconds: number) => IAutoMovieVector3) | undefined {
  const targetAt: IPerformShotGateContext["targetAt"] = context.targetAt;
  if (job.action.at.kind === "bone" && targetAt !== undefined)
    return (seconds: number): IAutoMovieVector3 =>
      targetAt(job.action.at, seconds) ?? job.target;
  const node: string | null = job.targetNode;
  if (node === null) return undefined;
  const own: IAutoMovieActionCall[] = plan.stageActions.filter(
    (action: IAutoMovieActionCall): boolean =>
      performShotActors(action).includes(node),
  );
  if (!own.some((action: IAutoMovieActionCall): boolean => action.verb === "locomote"))
    return undefined;
  return animatedBaseAt(
    context.nodePositions.get(node)!,
    rotations.get(node)!,
    compilePerformance(own, synthesize).performances[node]!,
  );
}
