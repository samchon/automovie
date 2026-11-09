/**
 * The falling cap's laws: free fall under standard gravity, the failure
 * stages' durations, the impact fragments' bounds and the dust, from the
 * falling-masonry study.
 *
 * ```ts
 * FallLaw.fallTime(2.7); // 0.742 s
 * ```
 *
 * @evidence docs/research/physics/falling-masonry.md#fall g = 9.80665 m/s²; t = √(2h/g).
 * @evidence docs/research/physics/falling-masonry.md#stages Tipping 0.8–1.5 s rotating 5–15°; fall rotating forward 60–90°; flat landing.
 * @evidence docs/research/physics/falling-masonry.md#fragments Three fragments at 2–4 m/s within 40° of away-from-upright, at most 2.5 m; dust below 0.8 m within 1 m, thinning in 1.5–2.0 s.
 * @evidence docs/research/physics/falling-masonry.md#clearance Clear when outside the danger region when the cap reaches head height.
 * @evidence contracts/development/behaviors.md#studied-laws Every constant is the study's.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
 * @evidence contracts/development/common.md#meaningful-documentation States units and sources.
 * @evidence contracts/development/design.md#principled-representation Seconds, metres and radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the masonry track and tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 */
export namespace FallLaw {
  /** Standard gravity, metres per second squared. */
  export const G: number = 9.80665;

  /** Default tipping stage, seconds (inside 0.8–1.5). */
  export const TIPPING: number = 1.2;

  /** Tipping rotation, radians (10°). */
  export const TIP_ANGLE: number = (10 * Math.PI) / 180;

  /** Forward rotation through the fall, radians (75°). */
  export const FALL_ANGLE: number = (75 * Math.PI) / 180;

  /** Fragment count, speed range (m/s), cone half-angle (rad) and longest travel (m). */
  export const FRAGMENTS = Object.freeze({ count: 3, minSpeed: 2, maxSpeed: 4, cone: (40 * Math.PI) / 180, reach: 2.5 });

  /** Dust: radius (m), height (m), thinning (s). */
  export const DUST = Object.freeze({ radius: 1.0, height: 0.8, seconds: 1.8 });

  /**
   * Seconds to fall a height from rest.
   *
   * @param height Metres.
   * @returns Seconds.
   */
  export function fallTime(height: number): number {
    return Math.sqrt((2 * Math.max(0, height)) / G);
  }

  /**
   * Metres fallen after a time from rest.
   *
   * @param seconds Seconds since release.
   * @returns Metres.
   */
  export function fallen(seconds: number): number {
    return 0.5 * G * Math.max(0, seconds) ** 2;
  }
}
