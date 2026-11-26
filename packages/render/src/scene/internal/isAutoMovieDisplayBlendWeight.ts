/** Whether a display blend supplies a usable coefficient for both sources. */
export function isAutoMovieDisplayBlendWeight(weight: number): boolean {
  return weight >= 0 && weight <= 1;
}
