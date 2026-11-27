import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * Prepare an immersed coast's distance over time: under a constant quadratic
 * drag coefficient `k`, `dv/dt = -k v²` from the initial speed integrates to
 * `log(1 + k v0 t) / k` (uniform motion `v0 t` without drag), read within the
 * coast's duration.
 *
 * @param k The drag's coefficient per metre, the heading drag over the mass and
 *   the speed squared; 0 for none.
 * @param speed The initial speed, m/s.
 * @param duration The coast's seconds.
 * @returns The distance travelled at a second, metres.
 * @throws {HumanRefusal} When the logarithm's argument `1 + k v0 t` would not
 *   stay positive over the coast: no finite endpoint.
 */
export function swimImmersedCoast(
  k: number,
  speed: number,
  duration: number,
): (seconds: number) => number {
  if (k !== 0 && !(k * speed * Math.max(0, duration) > -1))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "speed",
      value: speed,
      reason: "the coast has no finite endpoint at this speed and duration",
      fix: "reduce the speed or the duration",
    });
  return (seconds: number): number => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    return k === 0 ? speed * t : Math.log1p(k * speed * t) / k;
  };
}
