import { IAutoMovieProductionSoundEvent } from "@automovie/interface";

/** Evaluate only the selected semantic event's fixed procedural tone. */
export function productionSoundEventTone(
  kind: IAutoMovieProductionSoundEvent["kind"],
  t: number,
  normalized: number,
  noise: number,
): number {
  switch (kind) {
    case "contact":
      return Math.sin(2 * Math.PI * 115 * t) + noise * 0.45;
    case "arrival":
      return Math.sin(2 * Math.PI * (58 + 42 * normalized) * t);
    case "break":
      return noise * 0.9 + Math.sin(2 * Math.PI * 190 * t) * 0.3;
    case "reveal":
      return (
        Math.sin(2 * Math.PI * (220 + 440 * normalized) * t) * 0.7 +
        Math.sin(2 * Math.PI * 330 * t) * 0.3
      );
    case "transition":
      return noise * 0.25 + Math.sin(2 * Math.PI * 88 * t) * 0.5;
  }
}
