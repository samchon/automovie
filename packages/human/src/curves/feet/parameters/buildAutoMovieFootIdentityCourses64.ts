import type { IAutoMovieFootDimensions64 as D } from "../family/IAutoMovieFootDimensions64";
import type { IAutoMovieFootIdentityBridge64 as I } from "./IAutoMovieFootIdentityBridge64";

/**
 * Derive named main-foot rows from common physical heel, instep, arch and ball rules.
 *
 * Stations adapt to current collar bounds, heel reach and Toes row; they are not
 * source-specific points. Smoothstep joins the dimensional scales, a rounded heel
 * onset and a 0.12-breadth midfoot pinch. Heel rounding occupies the actual
 * heel-to-posterior-collar interval, rather than a fixed fraction of foot length.
 * The arch bump 16a²(1-a)² peaks at one.
 * The sole rises between heel and ball pads; the medial arch rises further.
 * Gray's gross distinction between weight-bearing pads and a raised arch informs
 * that arrangement: https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/.
 * The central rail uses the midpoint of two rise amplitudes: zero lateral rise
 * and the independently supplied medial soft-arch rise. This is a coarse
 * transverse-height convention, not interpolation by measured arc length or an
 * exact midpoint of the angular supports; its X support remains at 0.55 width.
 * That half-rise fraction, its location, profile fractions and handle proportions are construction
 * conventions for an unloaded rest blockout, with no fitted population or
 * measurement protocol. The common foot ends at the branch parent: distal
 * metatarsal-to-digit supports belong to the five toe fans and four shared webs,
 * rather than closed whole-foot courses crossing already separated digits.
 * Navicular height only scales the separate soft-arch quantities and must be
 * positive. Throws when physical row ordering
 * cannot contain heel, collar and toe transition; returns dimensionless recipes.
 */
export function buildAutoMovieFootIdentityCourses64(
  r: I.Resolved,
  navicularHeight: number,
): Record<string, D.Course> {
  const m: I.Independent = r.measurements;
  const L: number = r.footLengthMm;
  const smooth: (x: number) => number = (x: number): number => {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  };
  const mix: (a: number, b: number, t: number) => number = (
    a: number,
    b: number,
    t: number,
  ): number => a + (b - a) * smooth(t);
  const [back, front]: readonly [number, number] = r.collarRangeW;
  if (!(r.heelW < back && front < r.parentW && r.parentW < r.webReach))
    throw new Error(
      "Measured heel/ankle/toe planes do not admit the sparse foot family",
    );
  const instepW: number = front + 0.15 * (r.parentW - front);
  const planes: [string, number][] = [
    ["heelRear", r.heelW + 0.45 * (back - r.heelW)],
    ["heelShoulder", r.heelW + 0.85 * (back - r.heelW)],
    ...["AchillesWall", "hindfoot", "ankleAxis", "rearArch"].map(
      (name: string, i: number): [string, number] => [
        name,
        back + (0.12 + 0.22 * i) * (front - back),
      ],
    ),
    ["instep", instepW],
    ["arch", front + 0.4 * (r.parentW - front)],
    ["midfoot", front + 0.65 * (r.parentW - front)],
    ["forefoot", r.parentW],
  ];
  const result: Record<string, D.Course> = {};
  const ballT: number = (r.rootW[0]! - r.heelW) / L;
  // The rear cap needs longitudinal room before the collar opens the sections.
  // Its two support rows divide that available interval at 45% and 85%, reserving
  // longitudinal room for the common posterior dome before the collar transition.
  // These fractions are geometric spacing conventions, not heel measurements.
  const heelT: number = (back - r.heelW) / L;
  // The independent instep height must occur at the actual named instep support,
  // rather than at an unsampled peak of a different interpolation coordinate.
  const instepT: number = (instepW - r.heelW) / L;
  for (const [name, w] of planes) {
    const t: number = (w - r.heelW) / L;
    let width: number;
    if (t < heelT)
      width =
        m.heelBreadthMm * Math.sqrt(Math.max(0, 1 - (1 - t / heelT) ** 2));
    else {
      const u: number = (t - heelT) / (ballT - heelT);
      width =
        mix(m.heelBreadthMm, r.footBreadthMm, u) -
        0.12 *
          r.footBreadthMm *
          Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 2;
    }
    const top: number =
      t < instepT
        ? mix(2 * m.heelPadHeightMm, m.instepHeightMm, t / instepT)
        : mix(
            m.instepHeightMm,
            m.ballHeightMm,
            (t - instepT) / (ballT - instepT),
          );
    const archPhase: number = Math.min(
      1,
      Math.max(0, (t - 0.2) / (ballT - 0.2)),
    );
    const arch: number = 16 * archPhase ** 2 * (1 - archPhase) ** 2;
    const inner: number = 0.48 * top + m.plantarArchHeightMm * arch;
    const plantar: number = 0.12 * top + m.plantarArchHeightMm * arch;
    result[name] = {
      longitudinalRatio: w / (w >= 0 ? r.webReach : -r.heelW),
      centerOutwardRatio: -0.02 * smooth((t - heelT) / (ballT - heelT)),
      breadthRatio: width / r.footBreadthMm,
      dorsalHeightRatio: top / m.instepHeightMm,
      soleHeightAboveFloor_mm: 0.5 * m.plantarArchHeightMm * arch,
      roofPeakFraction: 0.38,
      soleContactFraction: 0.55,
      outerWallHeightFraction: 0.42,
      innerWallHeightFraction: 0.48,
      upperOuterHeightFraction: 0.86,
      upperInnerHeightFraction: 0.8,
      plantarInnerHeightFraction: 0.12,
      plantarOuterHeightFraction: 0.1,
      innerArchRatio: inner / navicularHeight,
      plantarInnerArchRatio: plantar / navicularHeight,
      ankleOuterShoulderOutwardFraction: 0.93,
      ankleOuterShoulderHeightFraction: 0.6,
      ankleInnerShoulderOutwardFraction: 0.07,
      ankleInnerShoulderHeightFraction: 0.6,
    };
  }
  return result;
}
