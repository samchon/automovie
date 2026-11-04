import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type ILine = HumanAnatomyHeadGeometry.ILine;
const A: typeof HumanAnatomy = HumanAnatomy;
const band: typeof HumanAnatomyShared.band = HumanAnatomyShared.band;
const resample: typeof HumanAnatomyShared.resample = HumanAnatomyShared.resample;

/**
 * The nose: its width at the alare, read on horizontal sections, and the
 * nasolabial angle at subnasale, read on the median profile.
 */
export namespace HumanAnatomyHeadNose {
  /** Angle off straight back within which a horizontal contour reads as the ala's lateral wall, degrees. */
  export const WALL: number = 20;

  /**
   * Nasal width, alare to alare, the direct distance between the two alare:
   * on horizontal cuts from subnasale up, the face's contour on each side
   * walked inward from 35 mm off the midline. The cheek beside the nose faces
   * forward, so the contour runs across; the ala's lateral wall faces outward,
   * so the contour there runs within {@link WALL} degrees of straight back.
   * Alare is where the inward walk first meets that wall, the ala's most
   * lateral point at that height; a cut with no such wall passes above or
   * below the alae.
   *
   * @param skin Skin to read.
   * @param sn Subnasale.
   * @param prn Pronasale.
   */
  export function alare(skin: HumanAnatomy.ISkin, sn: V3, prn: V3): number {
    let noseWidth: number = 0;

    for (let y: number = sn[1] - 1; y <= sn[1] + 0.4 * (prn[1] - sn[1] + 15); y += 0.5) {
      const contour: IContour | null = frontContour(skin, y, sn);
      if (contour === null) continue;

      let left: V3 | undefined;
      let right: V3 | undefined;

      // Either walking direction may run toward either side, so each reach is
      // assigned by the side it lands on.
      for (const dir of [1, -1] as const) {
        const p: V3 | undefined = reach(contour, dir, sn);
        if (p === undefined) continue;

        if (p[2] > 0) left = p;
        else if (p[2] < 0) right = p;
      }

      // The direct distance between the two alare, never their projection.
      if (left !== undefined && right !== undefined) noseWidth = Math.max(noseWidth, A.dist(left, right));
    }
    return noseWidth;
  }

  /**
   * Nasolabial angle Cm-Sn-Ls: the columella point Cm is where the line from
   * subnasale touches the nose's lower border, the least steep line from
   * subnasale to the profile on the way to pronasale.
   *
   * @param up Median profile from the lip up the face.
   * @param prn Index of pronasale.
   * @param sn Index of subnasale.
   * @param ls Index of labrale superius.
   * @returns The angle, degrees.
   */
  export function nasolabial(up: V3[], prn: number, sn: number, ls: number): number {
    const snP: V3 = up[sn]!;
    const rise: (p: V3) => number = (p: V3): number => Math.atan2(p[1] - snP[1], p[0] - snP[0]);
    let cm: number = prn;

    for (let i: number = sn + 2; i < prn; i++) if (up[i]![0] > snP[0] + 1 && rise(up[i]!) < rise(up[cm]!)) cm = i;

    const colum: V3 = A.unit(A.sub(up[cm]!, snP));
    const lip: V3 = A.unit(A.sub(up[Math.max(0, ls)]!, snP));
    return (Math.acos(Math.max(-1, Math.min(1, A.dot(colum, lip)))) * 180) / Math.PI;
  }

  /** A horizontal contour of the face, resampled every 0.25 mm, and where its median front point lies. */
  interface IContour {
    /** Contour points in walking order. */
    line: V3[];

    /** Whether the contour closes on itself. */
    closed: boolean;

    /** Index of the contour's median front point. */
    at: number;
  }

  /** The horizontal contour at a height whose median front point lies nearest in front of subnasale. */
  function frontContour(skin: HumanAnatomy.ISkin, y: number, sn: V3): IContour | null {
    const parts: ILine[] = A.polylines(skin, [0, y, 0], [0, 1, 0], band(skin, y - 1, y + 1));
    let found: IContour | null = null;

    for (const part of parts) {
      const r: V3[] = resample(part.points, 0.25);

      for (let i: number = 0; i < r.length; i++) {
        const p: V3 = r[i]!;

        if (Math.abs(p[2]) < 1 && p[0] > sn[0] - 5 && (found === null || p[0] > found.line[found.at]![0]))
          found = { line: r, closed: part.closed, at: i };
      }
    }
    return found;
  }

  /**
   * The alare of one side on a contour: walk outward to 35 mm off the midline,
   * then back inward until the contour turns to run back.
   *
   * @param dir +1 or -1, the index direction away from the median point.
   * @returns The alare, or undefined when the contour has no lateral wall.
   */
  function reach(contour: IContour, dir: 1 | -1, sn: V3): V3 | undefined {
    const n: number = contour.line.length;
    const get: (i: number) => V3 | undefined = (i: number): V3 | undefined => (contour.closed ? contour.line[((i % n) + n) % n] : contour.line[i]);

    // Outward to 35 mm off the midline, staying on the face.
    let end: number = 0;

    for (let k: number = 1; k < n; k++) {
      const p: V3 | undefined = get(contour.at + dir * k);
      if (p === undefined || p[0] < sn[0] - 40) break;

      end = k;
      if (Math.abs(p[2]) > 35) break;
    }

    // Back inward, every 1 mm of arc, until the contour turns to run back.
    for (let k: number = end; k - 4 > 0; k--) {
      const p: V3 = get(contour.at + dir * k)!;
      const q: V3 = get(contour.at + dir * (k - 4))!;
      if (Math.abs(q[2]) < 5) break;

      const run: number = Math.abs(q[2] - p[2]) / Math.max(1e-9, Math.hypot(q[0] - p[0], q[2] - p[2]));
      if (run < Math.sin((WALL * Math.PI) / 180)) return p;
    }
    return undefined;
  }
}
