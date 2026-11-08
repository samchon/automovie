import type { IAutoMovieHumanPose } from "@automovie/human";

/**
 * Give both protectors a short visible brace at actual admitted impact/debris events.
 * @evidence contracts/common.md#implementation-and-ownership A continuous quick attack and slower recovery modulate cervical flexion only, leaving actual contact-bearing limbs/support unchanged. Overlapping events use their maximum rather than accumulating neck angles. This is an authored perceptual response, not a force/COM calculation or an extra attack. The runtime supplies events only after the principal cap has been admitted to fall.
 * @evidence contracts/common.md#authoring-interface Input/output are clinical poses; film/event times are seconds. Returns a fresh pose. Before events and after0.38seconds it preserves the input exactly. Carina3°/Harry5° additions are expressive performance choices within the current poses' public intervals, not universal biomechanical limits. Recheck bounds if a caller changes the underlying neck pose.
 */
export function applyDuelImpactReaction(pose: IAutoMovieHumanPose, role: "Carina" | "Harry", seconds: number, actualEvents: readonly number[]): IAutoMovieHumanPose {
  if (!Number.isFinite(seconds) || actualEvents.some((time: number): boolean => !Number.isFinite(time))) throw new Error("Finite actual reaction events required");
  let weight: number = 0;
  for (const event of actualEvents) {
    const age: number = seconds - event;
    if (age <= 0 || age >= 0.38) continue;
    const phase: number = age < 0.08 ? age / 0.08 : 1 - (age - 0.08) / 0.30;
    weight = Math.max(weight, phase * phase * (3 - 2 * phase));
  }
  const result: IAutoMovieHumanPose = structuredClone(pose);
  if (weight > 0) {
    result.neck ??= {};
    result.neck.cervical = { ...result.neck.cervical, flexion: (result.neck.cervical?.flexion ?? 0) + (role === "Carina" ? 3 : 5) * weight };
  }
  return result;
}
