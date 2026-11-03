import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";

/**
 * The trunk's landmark heights and the rules that place them from the inputs.
 *
 * Heights stand at shares of the span from the crotch (the leg law's) to
 * cervicale, each share one pooled mean of ANSUR II's women and men (Gordon
 * et al. 2014, public working databases; `docs/sources/ansur-ii-trunk-ratios.md`
 * and `ansur-ii.md`), grade measured: with the crotch at 0.4809 S and
 * cervicale at 0.8605 S, a landmark at height h over stature S has the share
 * `(h - 0.4809) / (0.8605 - 0.4809)`. No share carries a sex term.
 *
 * Three heights are solved later on the construction's own surface, so they
 * are only started here: the natural waist (by `neckToWaist`), the bust point
 * (by `shoulderToApex`) and the shoulder point's breadth (by `acrossShoulder`).
 */
export namespace AutoMovieHumanTrunkLandmarks {
  /** The landmarks of a trunk; the skeleton's code reads this name. */
  export type ILandmarks = IAutoMovieHumanTrunkLandmarks;

  /**
   * Cervicale height over stature (the back neck point, ISO 8559-1 3.1.6):
   * ANSUR II 0.8570 women, 0.8639 men, pooled 0.8605; the neck owns cervicale,
   * and until its construction places it the population's height is used.
   * Measured. The neck's bottom ring stands lower on f1 (1406 mm against 1462
   * mm), so it is not cervicale.
   */
  export const CERVICALE: number = 0.8605;

  /** Buttock point (the hip tape's site): ANSUR II buttock height 0.5118 S women, 0.5054 S men. Measured. */
  export const BUTTOCK: number = 0.073;

  /** Iliocristale: ANSUR II 0.6113 S women, 0.6044 S men. Measured. */
  export const ILIOCRISTALE: number = 0.335;

  /** Omphalion: ANSUR II 0.6017 S women, 0.6014 S men; Gray 1918 puts it 2 to 2.5 cm above the iliac tubercles. Measured. */
  export const OMPHALION: number = 0.318;

  /**
   * The natural waist's start before its solve: midway between iliocristale
   * (0.6079 S) and the tenth rib (0.6433 S pooled, ANSUR II), the ISO 8559-1
   * waist level's bony landmarks. Derived.
   */
  export const WAIST: number = 0.382;

  /** Chest point, the bust point's start before its solve: ANSUR II chest height 0.7194 S women, 0.7351 S men. Measured. */
  export const CHEST: number = 0.649;

  /** Axilla, the layer the trunk and the shoulders share: ANSUR II 0.7607 S women, 0.7567 S men. Measured. */
  export const AXILLA: number = 0.732;

  /** Acromion height (the shoulder point): ANSUR II acromial height regressions at the sexes' mean statures, 0.8199 S and 0.8203 S. Derived. */
  export const ACROMION: number = 0.894;

  /**
   * The glenohumeral centre under the shoulder point, as a share of the
   * acromion-radiale length: de Leva's 33.7 mm (women) and 34.5 mm (men)
   * over the derived adducted acromion-radiale lengths 322.7 mm and 330.5 mm
   * are both 0.1044 (`docs/anatomy/skeleton.md`). Derived; it scales with
   * the arm for every person.
   */
  export const GLENOHUMERAL: number = 0.1044;

  /**
   * The inframammary fold under the bust point, a share of the span: two
   * intercostal spaces, the nipple at the fourth rib and the fold at the
   * sixth (Gray 1918), about 49 mm on a 654 mm span. Conventional.
   */
  export const FOLD_DROP: number = 0.075;

  /**
   * A height at a share of the crotch-to-cervicale span.
   *
   * @param crotch Crotch height, mm.
   * @param cervicale Cervicale height, mm.
   * @param share Share of the span, 0 at the crotch and 1 at cervicale.
   * @returns The height, mm.
   */
  export function at(crotch: number, cervicale: number, share: number): number {
    return crotch + share * (cervicale - crotch);
  }

  /**
   * The glenohumeral centre under a shoulder point: straight below it, as ISO
   * 8559-1 3.1.1 projects the acromion vertically to the skin.
   *
   * @param shoulder The shoulder point `[x, y, z]`, mm.
   * @param acromionRadiale The upper arm length input, mm.
   * @returns The glenohumeral centre `[x, y, z]`, mm.
   */
  export function glenohumeral(
    shoulder: readonly [number, number, number],
    acromionRadiale: number,
  ): [number, number, number] {
    return [shoulder[0], shoulder[1] - GLENOHUMERAL * acromionRadiale, shoulder[2]];
  }

  /**
   * A left landmark reflected onto the right side (rule J6).
   *
   * @param p A point `[x, y, z]`, mm.
   * @returns The point with z negated.
   */
  export function mirror(p: readonly [number, number, number]): [number, number, number] {
    return [p[0], p[1], -p[2]];
  }

  /**
   * The column's axis at a height, interpolated between its samples and held
   * beyond them.
   *
   * @param landmarks The trunk's landmarks.
   * @param y Height, mm.
   * @returns The axis point `[x, y, 0]`, mm.
   */
  export function axisAt(landmarks: IAutoMovieHumanTrunkLandmarks, y: number): [number, number, number] {
    const a: [number, number][] = landmarks.axis;
    if (y <= a[0]![0]) return [a[0]![1], y, 0];

    for (let i: number = 1; i < a.length; i++)
      if (y <= a[i]![0]) {
        const f: number = (y - a[i - 1]![0]) / (a[i]![0] - a[i - 1]![0]);
        return [a[i - 1]![1] + f * (a[i]![1] - a[i - 1]![1]), y, 0];
      }
    return [a[a.length - 1]![1], y, 0];
  }
}
