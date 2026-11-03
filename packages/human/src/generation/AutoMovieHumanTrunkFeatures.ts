import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanBreastDome } from "./AutoMovieHumanBreastDome";
import { AutoMovieHumanBreastFootprint } from "./AutoMovieHumanBreastFootprint";
import { AutoMovieHumanBreastFrame } from "./AutoMovieHumanBreastFrame";
import { AutoMovieHumanBreastRelief } from "./AutoMovieHumanBreastRelief";
import { AutoMovieHumanGlutealDome } from "./AutoMovieHumanGlutealDome";
import { AutoMovieHumanGlutealFrame } from "./AutoMovieHumanGlutealFrame";
import { AutoMovieHumanGlutealRelief } from "./AutoMovieHumanGlutealRelief";
import { AutoMovieHumanScapularMass } from "./AutoMovieHumanScapularMass";
import { AutoMovieHumanSpinalFrame } from "./AutoMovieHumanSpinalFrame";
import { AutoMovieHumanSpinalGroove } from "./AutoMovieHumanSpinalGroove";
import { AutoMovieHumanSpinalProfile } from "./AutoMovieHumanSpinalProfile";
import { AutoMovieHumanSternalNotch } from "./AutoMovieHumanSternalNotch";
import { AutoMovieHumanSternalNotchProfile } from "./AutoMovieHumanSternalNotchProfile";
import { AutoMovieHumanUmbilicalFrame } from "./AutoMovieHumanUmbilicalFrame";
import { AutoMovieHumanUmbilicalProfile } from "./AutoMovieHumanUmbilicalProfile";
import { AutoMovieHumanUmbilicus } from "./AutoMovieHumanUmbilicus";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanTrunkCourses } from "./AutoMovieHumanTrunkCourses";
import type { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import type { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import { AutoMovieHumanTrunkRing } from "./AutoMovieHumanTrunkRing";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/**
 * The trunk's features merged into its chart: the breasts, the buttocks, the
 * umbilicus and the spinal furrow, each built in its own frame by its own
 * pieces and merged by a relief window over the column's base surface.
 *
 * The features read only the column, the landmark heights and the person's
 * tapes, so they can be built, drawn and measured without the rest of the
 * body.
 */
export namespace AutoMovieHumanTrunkFeatures {
  /** What the features stand on: landmark heights and the tapes that size them. */
  export interface ISites {
    /** Crotch height, mm. */
    crotch: number;

    /** Buttock point height, mm. */
    buttock: number;

    /** Iliocristale height, mm. */
    iliocristale: number;

    /** Omphalion height, mm. */
    omphalion: number;

    /** Natural waist height, mm: the row where the furrow's phase span is read. */
    waist: number;

    /** Inframammary fold height, mm. */
    fold: number;

    /** Bust point height, mm. */
    bust: number;

    /** Axilla height, mm: the top of the trunk's chain. */
    axilla: number;

    /** The furrow's lower end, mm. */
    furrowFrom: number;

    /** The bust span, mm: the breadth between the bust points. */
    bustSpan: number;

    /** The breasts' projection over the chest wall at the bust point, mm: what the chest tape closes over the wall. */
    projection: number;

    /** What the base's back lacks at the buttock point for the buttock's depth, mm: the buttock's projection. */
    buttockProjection: number;

    /** The crotch-to-cervicale span, mm: the blades' reach is a share of it. */
    span: number;

    /** Height of the neck's bottom ring, the shoulders' top, mm: the windows near the neck stay under it. */
    neck: number;
  }

  /**
   * The phase of a side's section at a lateral place: the bisection of the
   * section's spline over the quadrant's phases.
   *
   * @param controls The section's controls.
   * @param side The quadrant.
   * @param z Lateral place, mm.
   * @returns The phase, radians.
   */
  export function phaseAt(controls: readonly number[], side: AutoMovieHumanTrunkQuadrant.Side, z: number): number {
    const widest: number = AutoMovieHumanTrunkQuadrant.phase(70);
    let lo: number = side === "front" ? 0 : widest;
    let hi: number = side === "front" ? widest : Math.PI;

    for (let k: number = 0; k < 40; k++) {
      const mid: number = (lo + hi) / 2;
      const zm: number = AutoMovieHumanSplineCurve.evaluate(controls, AutoMovieHumanTrunkQuadrant.ORDER, mid)[1];

      // Lateral place rises with phase on the front and falls with it on the back.
      if (zm < z === (side === "front")) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * The trunk's base surface on a column: the body point at a height and a
   * phase, the section's rings remembered per height so a relief's net reads
   * each ring once.
   *
   * @param col The column.
   * @returns The base surface.
   */
  export function baseSurface(col: AutoMovieHumanTrunkColumn.IColumn): AutoMovieHumanTrunkReliefNet.Base {
    const rings: Map<number, number[]> = new Map();

    return (y: number, t: number): [number, number, number] => {
      let controls: number[] | undefined = rings.get(y);
      if (controls === undefined) {
        controls = AutoMovieHumanTrunkRing.controls(col.at(y));
        rings.set(y, controls);
      }
      const p: [number, number, number, number] = AutoMovieHumanSplineCurve.evaluate(controls, AutoMovieHumanTrunkQuadrant.ORDER, t);

      return [p[0], y, p[1]];
    };
  }

  /**
   * The breast's dome in its own frame.
   *
   * @param col The column.
   * @param sites The landmark heights and tapes.
   * @returns The left breast as a height field.
   */
  export function breastDome(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanTrunkFeature {
    const s: IAutoMovieHumanTrunkSection = col.at(sites.bust);
    const controls: number[] = AutoMovieHumanTrunkRing.controls(s);
    const lateral: number = Math.min(0.8 * s.width, sites.bustSpan / 2);

    // The breast's own frame stands on the wall at the bust point, along the wall's normal.
    const apex: [number, number, number] = AutoMovieHumanTrunkCourses.point(s, [], lateral, "front", controls);
    const j: [number, number, number, number, number, number] = AutoMovieHumanSplineCurve.jet(
      controls,
      AutoMovieHumanTrunkQuadrant.ORDER,
      phaseAt(controls, "front", lateral),
    );
    const frame: AutoMovieHumanTrunkFeatureFrame.IFrame = AutoMovieHumanBreastFrame.create({ apex, tangent: [j[2], j[3]] });

    return AutoMovieHumanBreastDome.create({
      frame,
      footprint: AutoMovieHumanBreastFootprint.create(lateral, sites.bust - sites.fold),
      projection: sites.projection,
    });
  }

  /**
   * The breasts merged into the column.
   *
   * @param col The column.
   * @param sites The landmark heights and tapes.
   * @returns The left and the right window.
   */
  export function breasts(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanRelief[] {
    const s: IAutoMovieHumanTrunkSection = col.at(sites.bust);
    const controls: number[] = AutoMovieHumanTrunkRing.controls(s);

    return AutoMovieHumanBreastRelief.create({
      dome: breastDome(col, sites),
      base: baseSurface(col),
      phaseOf: (z: number): number => phaseAt(controls, "front", Math.min(0.97 * s.width, Math.max(0, z))),
      ceiling: sites.axilla,
    });
  }

  /**
   * The gluteal mass in its own frame.
   *
   * @param col The column.
   * @param sites The landmark heights and the buttock's projection.
   * @returns The left buttock as a height field.
   */
  export function glutealDome(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanTrunkFeature {
    const s: IAutoMovieHumanTrunkSection = col.at(sites.buttock);
    const controls: number[] = AutoMovieHumanTrunkRing.controls(s);

    // The gluteal mass's own frame stands on the back wall at the buttock point.
    const lateral: number = AutoMovieHumanGlutealDome.LATERAL * s.width;
    const apex: [number, number, number] = AutoMovieHumanTrunkCourses.point(s, [], lateral, "back", controls);
    const j: [number, number, number, number, number, number] = AutoMovieHumanSplineCurve.jet(
      controls,
      AutoMovieHumanTrunkQuadrant.ORDER,
      phaseAt(controls, "back", lateral),
    );
    const frame: AutoMovieHumanTrunkFeatureFrame.IFrame = AutoMovieHumanGlutealFrame.create({ apex, tangent: [j[2], j[3]] });

    return AutoMovieHumanGlutealDome.create({
      frame,
      width: s.width,
      lower: sites.buttock - sites.crotch,
      upper: Math.max(10, sites.iliocristale - sites.buttock),
      projection: sites.buttockProjection,
    });
  }

  /**
   * The buttocks merged into the column.
   *
   * @param col The column.
   * @param sites The landmark heights and the buttock's projection.
   * @returns The left and the right window; none when the base already has the buttock's depth.
   */
  export function buttocks(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanRelief[] {
    const s: IAutoMovieHumanTrunkSection = col.at(sites.buttock);
    const controls: number[] = AutoMovieHumanTrunkRing.controls(s);

    return AutoMovieHumanGlutealRelief.create({
      dome: glutealDome(col, sites),
      base: baseSurface(col),
      phaseOf: (z: number): number => phaseAt(controls, "back", Math.min(0.97 * s.width, Math.max(0, z))),
    });
  }
  /**
   * The scapular masses standing on the back's envelope at the axilla's height.
   *
   * @param col The column.
   * @param sites The landmark heights and the span.
   * @returns The left and the right window.
   */
  export function scapulae(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanRelief[] {
    const s: IAutoMovieHumanTrunkSection = col.at(sites.axilla);
    const controls: number[] = AutoMovieHumanTrunkRing.controls(s);

    // The mass's centre lies midway between the blade's borders on the back wall.
    const lateral: number = ((AutoMovieHumanScapularMass.MEDIAL + AutoMovieHumanScapularMass.OUTER) / 2) * s.width;
    const centre: [number, number, number] = AutoMovieHumanTrunkCourses.point(s, [], lateral, "back", controls);
    const j: [number, number, number, number, number, number] = AutoMovieHumanSplineCurve.jet(
      controls,
      AutoMovieHumanTrunkQuadrant.ORDER,
      phaseAt(controls, "back", lateral),
    );

    return AutoMovieHumanScapularMass.create({
      centre,
      tangent: [j[2], j[3]],
      width: s.width,
      span: sites.span,
      phaseOf: (z: number): number => phaseAt(controls, "back", Math.min(0.97 * s.width, Math.max(0, z))),
      base: baseSurface(col),
      ceiling: sites.neck - AutoMovieHumanSternalNotch.CLEARANCE,
    });
  }

  /**
   * The umbilicus, the spinal furrow and the sternal notch.
   *
   * @param col The column.
   * @param sites The landmark heights.
   * @returns The pit's window, the furrow's and the notch's.
   */
  export function midline(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanRelief[] {
    const rate = (y: number, index: number): number => AutoMovieHumanTrunkRing.speeds(col.at(y))[index]!;
    const base: AutoMovieHumanTrunkReliefNet.Base = baseSurface(col);
    const to: number = sites.axilla - 1;
    const middle: number = (sites.furrowFrom + to) / 2;
    const notch: AutoMovieHumanTrunkFeatureFrame.IFrame = AutoMovieHumanSternalNotch.frame(sites.neck, (y: number): number => col.at(y).front);

    return [
      AutoMovieHumanSternalNotch.create(notch, base, AutoMovieHumanSternalNotchProfile.HALF / rate(notch.origin[1], 0)),
      AutoMovieHumanUmbilicus.create(
        AutoMovieHumanUmbilicalFrame.create(sites.omphalion, col.at(sites.omphalion).front),
        base,
        AutoMovieHumanUmbilicalProfile.RADIUS / rate(sites.omphalion, 0),
      ),
      AutoMovieHumanSpinalGroove.create(
        AutoMovieHumanSpinalFrame.create(middle, col.at(middle).back),
        (to - sites.furrowFrom) / 2,
        base,
        AutoMovieHumanSpinalProfile.RADIUS / rate(sites.waist, 6),
      ),
    ];
  }

  /**
   * Every feature of the trunk.
   *
   * @param col The column.
   * @param sites The landmark heights and tapes.
   * @returns The windows: both breasts, both blades and both buttocks (unions), the notch, the umbilicus and the furrow (carves).
   */
  export function all(col: AutoMovieHumanTrunkColumn.IColumn, sites: ISites): IAutoMovieHumanRelief[] {
    return [...breasts(col, sites), ...scapulae(col, sites), ...buttocks(col, sites), ...midline(col, sites)];
  }
}
