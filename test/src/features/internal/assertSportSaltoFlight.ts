import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Read an admitted salto from its displayed root: its complete somersaults
 * and its upright landing, independently of the shooting solver's residual.
 *
 * @param performance The actual performed salto, its last segment the jump.
 * @param subject The performer's subject id.
 * @param turns The requested forward somersaults.
 * @returns Every observed turn-count or landing defect.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the displayed observations and the requested turns.
 * @evidence contracts/development/implementation.md#principled-implementation The root's long axis projected onto the take-off frame's YZ plane defines its somersault angle; nearest-branch changes sampled at 60 Hz accumulate complete revolutions. As with the flight solver's angle reading, this presumes fewer than half a revolution between samples. The 0.02-revolution bound is the existing airborne-signature acceptance, not a fitted flight rate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the flight events, accumulate its observed rotation, then compare its landing attitude.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads actual displayed orientations and never the solver's reported residual or a presumed constant angular speed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the flight's 60 Hz samples, with one displayed pose per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the performance's displayed-pose cache and the engine's quaternion algebra.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only diagnostic strings escape; no process or cache is owned here.
 */
export function assertSportSaltoFlight(
  performance: IAutoMovieMotionHumanPerformance,
  subject: string,
  turns: number,
): string[] {
  const findings: string[] = [];
  const segment: IAutoMovieMotionHumanSegment = performance
    .segments(subject)
    .at(-1)!;
  const at = (name: string): number =>
    segment.start +
    segment.plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )!.share *
      segment.plan.duration;
  const from: number = at("takeoff");
  const to: number = at("touchdown");
  const start: IAutoMovieQuaternion = performance.pose(subject, from).root!
    .rotation;
  const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(start);
  const samples: number = Math.ceil((to - from) * 60);
  let previous: number = 0;
  let accumulated: number = 0;
  let end: IAutoMovieQuaternion = start;
  for (let k: number = 1; k <= samples; k++) {
    // The jump stops applying its airborne turn at touchdown itself.
    const time: number = k === samples ? to - 1e-6 : from + k / 60;
    end = performance.pose(subject, time).root!.rotation;
    const long: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.multiply(back, end),
      { x: 0, y: 1, z: 0 },
    );
    const angle: number = Math.atan2(long.z, long.y);
    accumulated += Math.atan2(
      Math.sin(angle - previous),
      Math.cos(angle - previous),
    );
    previous = angle;
  }
  const observed: number = accumulated / (2 * Math.PI);
  const landing: number = AutoMovieEngineQuaternion.angle(start, end) / (2 * Math.PI);
  if (Math.abs(observed - turns) > 0.02)
    findings.push(
      `displayed ${observed.toFixed(4)} somersaults, requested ${turns}`,
    );
  if (landing > 0.02)
    findings.push(`lands ${landing.toFixed(4)} revolution off upright`);
  return findings;
}
