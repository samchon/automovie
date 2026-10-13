import { IAutoMovieProductionSoundEvent } from "@automovie/interface";
/**
 * Evaluate only the selected semantic event's fixed procedural tone.
 *
 * @evidence contracts/common.md#principled-implementation Each closed event kind retains the original sine/noise expression and operand order at sample time t and normalized envelope time; no unselected palette expression contributes to the result.
 * @evidence contracts/common.md#clear-and-simple-design Tone selection is separate from mixing's clock, envelope, pan and density gain so one scalar owner exposes the fixed event palette without building a five-value object per sample.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All supported kinds use their declared tone, with no fixture phase or added sample clamp; time/noise admission remains with the typed plan and mixer.
 * @evidence contracts/common.md#meaningful-documentation States seconds, normalized time and supplied seeded noise, preserving original selected expressions; trigonometric implementation rounding remains a cross-host limitation.
 * @evidence contracts/performance.md#efficient-algorithms A constant-size kind switch evaluates only the one or two sine calls used by that tone, with constant live scalar storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The mixer reuses its already computed time, normalized time and seeded noise; unselected tone calculations and the former per-sample palette object are removed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned scalar retains no event, sample buffer or palette object; no cross-event cache, audio device or task is acquired.
 */
export function productionSoundEventTone(
  kind: IAutoMovieProductionSoundEvent["kind"],
  t: number,
  normalized: number,
  noise: number,
): number {
  switch (kind) {
    case "contact": return Math.sin(2 * Math.PI * 115 * t) + noise * 0.45;
    case "arrival": return Math.sin(2 * Math.PI * (58 + 42 * normalized) * t);
    case "break": return noise * 0.9 + Math.sin(2 * Math.PI * 190 * t) * 0.3;
    case "reveal": return Math.sin(2 * Math.PI * (220 + 440 * normalized) * t) * 0.7 + Math.sin(2 * Math.PI * 330 * t) * 0.3;
    case "transition": return noise * 0.25 + Math.sin(2 * Math.PI * 88 * t) * 0.5;
  }
}
