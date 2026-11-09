import { AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";

import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";
import type { AutoMovieHumanTrunkMound } from "./AutoMovieHumanTrunkMound";
import type { AutoMovieHumanTrunkViewCurves } from "./AutoMovieHumanTrunkViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The trunk-thigh back contour, written once by the trunk and read by the
 * leg's seeded fold: S00's own surface on each buttock's apex line, from the
 * seat down past S00's open crotch end to the gluteal furrow, where the
 * buttock relief (`AutoMovieHumanTrunkViewMounds`, window from the iliac crest
 * to the ANSUR gluteal furrow height) reaches zero with zero slope and
 * curvature; and the lateral trunk-thigh line, half the ANSUR hip breadth.
 *
 * Above the crotch the contour is S00's own section; below it, the lower-
 * buttock law ({@link law}) carries it down to the fold, and S00's midline
 * back at the crotch is that law's value, so the bottom ring is the cheeks,
 * not a notch pinched toward the anus. The lateral
 * line holds the hip breadth from the buttock level down to the furrow
 * (ANSUR's hip breadth is the maximum across both thigh roots: declared).
 */
export namespace AutoMovieHumanTrunkGlutealContour {
  /** One buttock's back contour. */
  export interface ISide {
    /** `left` or `right`. */
    side: "left" | "right";

    /** The buttock apex's phase on S00's chart, radians. */
    phase: number;

    /** World point of the contour at a height from the furrow to the buttock level. */
    at(y: number): Vec3;
  }

  /** The contours. */
  export interface IOutput {
    /** The gluteal furrow height (the fold line's level), mm. */
    fold: number;

    /** S00's open end (the crotch height), mm. */
    crotch: number;

    /** The buttock level, mm. */
    buttock: number;

    /** Left and right back contours. */
    left: ISide;

    /** Right back contour. */
    right: ISide;

    /** The lateral trunk-thigh line: half breadth from the midline, mm, at a height from the furrow to the buttock level. */
    lateral(y: number): number;

    /** Basis. */
    basis: string[];
  }

  /**
   * The lower-buttock law in the midline plane: from the seat (X `seat` at
   * the buttock level `buttock`, a maximum) down to the thigh's back at the
   * gluteal furrow (X `thigh` at `fold`), a quarter ellipse whose tangent
   * turns horizontal at the fold, the crease where the buttock tucks into
   * the thigh (declared construction: no published lower-buttock profile
   * read). Returns X and dX/dy at a height in [fold, buttock].
   */
  export function law(seat: number, buttock: number, thigh: number, fold: number): (y: number) => [number, number] {
    return (y: number): [number, number] => {
      const eta: number = Math.min(1, Math.max(0, (buttock - y) / (buttock - fold)));
      const root: number = Math.sqrt(Math.max(1e-12, 1 - eta * eta));
      return [thigh + (seat - thigh) * root, ((seat - thigh) * eta) / (root * (buttock - fold))];
    };
  }

  /** The contours from a built S00's view curves. */
  export function of(curves: AutoMovieHumanTrunkViewCurves.IOutput, measures: IAutoMovieHumanBodyMeasures): IOutput {
    const source: AutoMovieHumanTrunkComposedSection.ISource = curves.source;
    // The law descends from the buttock apex (ANSUR buttock depth's own point), not the midline, which is the cleft's floor.
    const seat: number = curves.points.find((p: { name: string; point: Vec3 }): boolean => p.name === "buttock.right apex")?.point[0] ?? curves.axis.xs + AutoMovieHumanTrunkComposedSection.read(source.posterior, curves.bottom);
    const buttockY: number = curves.mounds.find((m: AutoMovieHumanTrunkMound.ISpec): boolean => m.name === "buttock.right")?.station ?? NaN;
    const lower: (y: number) => [number, number] = law(seat, buttockY, curves.axis.xs - measures.thighCircumference / (2 * Math.PI), measures.glutealFurrowHeight);
    const side: (name: "left" | "right") => ISide = (name: "left" | "right"): ISide => {
      const spec: AutoMovieHumanTrunkMound.ISpec | undefined = curves.mounds.find((m: AutoMovieHumanTrunkMound.ISpec): boolean => m.name === `buttock.${name}`);
      const phase: number = spec?.phase ?? NaN;
      const s00: (y: number) => Vec3 = (y: number): Vec3 => {
        const r: number = AutoMovieHumanTrunkComposedSection.radius(source, y, phase);
        let dx: number = 0;
        let dz: number = 0;
        for (const relief of source.reliefs as readonly IAutoMovieLoftRelief[]) {
          const h: number = AutoMovieLoftRelief.height(relief, y, phase)[0];
          dx += h * relief.axis[0];
          dz += h * relief.axis[2];
        }
        return [curves.axis.xs + r * Math.cos(phase) + dx, y, r * Math.sin(phase) + dz];
      };
      const end: Vec3 = s00(curves.bottom);
      return {
        side: name,
        phase,
        at: (y: number): Vec3 => (y >= curves.bottom ? s00(y) : [end[0] + lower(y)[0] - lower(curves.bottom)[0], y, end[2]]),
      };
    };
    const half: number = measures.hipBreadth / 2;
    return {
      fold: measures.glutealFurrowHeight,
      crotch: curves.bottom,
      buttock: curves.mounds.find((m: AutoMovieHumanTrunkMound.ISpec): boolean => m.name === "buttock.right")?.station ?? NaN,
      left: side("left"),
      right: side("right"),
      lateral: (): number => half,
      basis: [
        "back contour: S00 itself (wall plus buttock relief) on the buttock apex's phase down to its open crotch end; below it the lower-buttock law's fall (quarter ellipse from the seat to the thigh's back, hip X less the thigh circumference's radius, at the ANSUR gluteal furrow; declared) added to S00's value at the crotch; S00's midline back at the crotch is that law's value",
        "fold line: the gluteal furrow height (ANSUR 1988 gluteal furrow on crotch height)",
        "lateral line: half the ANSUR hip breadth across both thigh roots, held from the buttock level to the furrow (declared)",
      ],
    };
  }
}
