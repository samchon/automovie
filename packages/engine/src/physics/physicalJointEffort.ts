import type { IAutoMoviePhysicalJointEffort } from "@automovie/interface";

/**
 * Effective tracking fraction of one joint motor at one native tick.
 *
 * An explicit per-joint override replaces the body's effort; a joint inside a
 * moving recovery limb takes the balance policy's joint fraction; a joint whose
 * child received a disturbance stays compliant, multiplied by the declared
 * compliance fraction, until its softening deadline has passed. The factors are
 * independent, so they multiply.
 */
export function physicalJointEffort(
  input: IAutoMoviePhysicalJointEffort.IInput,
): number {
  const base: number = input.override ?? input.effort;
  const recovery: number = input.recovery ?? 1;
  const compliant: boolean =
    input.softenedUntil !== undefined && input.softenedUntil >= input.seconds;
  return base * recovery * (compliant ? input.compliance : 1);
}
