/**
 * The fade the definition producer applies near the points and regions it
 * stays away from: zero at distance 0, one at `fadeMetres` and beyond, the
 * cubic smoothstep in between.
 */
export function smoothstepHumanSourceFade(distanceMetres: number, fadeMetres: number): number {
  const t = Math.min(Math.max(distanceMetres / fadeMetres, 0), 1);
  return t * t * (3 - 2 * t);
}
