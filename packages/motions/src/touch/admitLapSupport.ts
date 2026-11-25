import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Admit a partner's thighs as a lap at no more than 30 degrees from level.
 *
 * @param partner The performer providing the support.
 * @param drop Knee height below the hips in metres.
 * @param thigh The supporting performer's thigh length in metres.
 * @throws {HumanRefusal} When the knee drop exceeds half the thigh length.
 */
export function admitLapSupport(
  partner: string,
  drop: number,
  thigh: number,
): void {
  if (drop > 0.5 * thigh)
    throw new HumanRefusal({
      kind: "base",
      axis: "partner",
      value: partner,
      reason: `the partner's knees lie ${(drop * 1000).toFixed(0)} mm below the hips, so there is no lap`,
      fix: "seat the partner first",
    });
}
