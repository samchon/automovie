/**
 * Effective tracking fraction of one joint motor at one native tick.
 *
 * An explicit per-joint override replaces the body's effort; a joint inside a
 * moving recovery limb takes the balance policy's joint fraction; a joint whose
 * child received a disturbance stays compliant, multiplied by the declared
 * compliance fraction, until its softening deadline has passed. The factors
 * are independent, so they multiply.
 */
export function physicalJointEffort(input: {
  /** Body tracking fraction for this interval, in [0, 1]. */ effort: number;
  /** Explicit per-joint fraction, when the target declares one. */ override?: number;
  /** Balance joint fraction, present only while this joint's limb is a moving recovery limb. */ recovery?: number;
  /** Seconds until which the joint's child stays softened; absent when it never was. */ softenedUntil?: number;
  /** Current native tick time, seconds. */ seconds: number;
  /** Tracking fraction while compliant, in [0, 1]. */ compliance: number;
}): number {
  const base: number = input.override ?? input.effort;
  const recovery: number = input.recovery ?? 1;
  const compliant: boolean =
    input.softenedUntil !== undefined && input.softenedUntil >= input.seconds;
  return base * recovery * (compliant ? input.compliance : 1);
}
