import type { IAutoMovieHumanArmPose } from "@automovie/human";

/**
 * Carry an actually fitted arm into a new authored posture without a seed jump.
 *
 * @evidence contracts/common.md#implementation-and-ownership Blends shoulder, elbow, forearm and wrist clinical degrees from the actual earlier cached pose to the current authored seed. Fingers remain the current action's independent opening/grip. It changes no anatomy or bound; public fitting still decides the resulting geometry. No prior mutable playback state is retained.
 * @evidence contracts/common.md#authoring-interface Supply finite arm records and a weight in0–1. Omitted scalar controls use the same zero/default convention as the scene's clinical pose. Returns independent region records. The caller requires a strictly earlier frame and resets current root placement before fitting it.
 */
export function blendArmSeed(from: IAutoMovieHumanArmPose, to: IAutoMovieHumanArmPose, weight: number): IAutoMovieHumanArmPose {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error("Arm seed blend must be finite in0–1");
  const result: IAutoMovieHumanArmPose = { ...to };
  for (const region of ["shoulder", "elbow", "forearm", "wrist"] as const) {
    const first: Record<string, number | undefined> = (from[region] ?? {}) as Record<string, number | undefined>;
    const last: Record<string, number | undefined> = (to[region] ?? {}) as Record<string, number | undefined>;
    const keys: Set<string> = new Set([...Object.keys(first), ...Object.keys(last)]);
    result[region] = Object.fromEntries([...keys].map((name: string): [string, number] => {
      const a: number = first[name] ?? 0; const b: number = last[name] ?? 0;
      if (![a, b].every(Number.isFinite)) throw new Error("Arm seed controls must be finite");
      return [name, a + (b - a) * weight];
    }));
  }
  return result;
}
