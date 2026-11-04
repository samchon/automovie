import type { AutoMovieHumanOralCavity } from "../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyHeadProfile } from "./HumanAnatomyHeadProfile";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanOralCavityParts } from "./HumanOralCavityParts";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;
const band: typeof HumanAnatomyShared.band = HumanAnatomyShared.band;
const resample: typeof HumanAnatomyShared.resample = HumanAnatomyShared.resample;

/**
 * The mouth: its width at the cheilia, the gap its lips leave, and the teeth
 * a viewer would see through it, read from the skin whether the lips part, close
 * over an oral cavity or are sealed.
 */
export namespace HumanAnatomyHeadMouth {
  /** The mouth an opening of the skin leaves. */
  export interface IOpening {
    /** Cheilion to cheilion, mm. */
    width: number;

    /** Widest gap along the middle half of the mouth, mm. */
    gap: number;
  }

  /** Width and gap of a mouth the skin parts by an opening. */
  export function opening(loop: V3[]): IOpening {
    const width: number = HumanAnatomyHeadGeometry.span(HumanAnatomyHeadGeometry.diameter(loop));
    let gap: number = 0;

    // Samples every 0.5 mm along the middle half: the gap is the loop's
    // vertical extent at that station.
    for (let z: number = -width / 4; z <= width / 4; z += 0.5) {
      const ys: number[] = loop.filter((p: V3): boolean => Math.abs(p[2] - z) < 0.5).map((p: V3): number => p[1]);
      if (ys.length >= 2) gap = Math.max(gap, Math.max(...ys) - Math.min(...ys));
    }
    return { width, gap };
  }

  /**
   * Mouth width of closed lips: cheilion to cheilion, where the lips stop
   * meeting. Sagittal planes outward from the midline cut the lips; on each,
   * the outer skin's section is the curve reaching farthest forward at the
   * fissure's height. Over an oral cavity the lips are two walls that touch,
   * so the fissure goes on while the section, within 8 mm of stomion's
   * height, folds into a slit whose walls stay within the profile's contact
   * distance. Lips sealed without a cavity leave a crease, and the fissure
   * goes on while its deepest notch there sits 0.3 mm or more under its 4 mm
   * chord.
   *
   * @param skin Skin to read.
   * @param sto Stomion.
   * @param cavity Whether the lips close over an oral cavity.
   */
  export function labialFissure(skin: HumanAnatomy.ISkin, sto: V3, cavity: boolean): number {
    const near: Uint32Array = band(skin, sto[1] - 45, sto[1] + 45);
    let width: number = 0;

    for (const side of [1, -1]) {
      let reach: number = NaN;

      for (let c: number = 0.5; c <= 45; c += 0.5) {
        const pts: V3[] = outerSection(skin, near, side * c, sto);
        let notch: number = 0;
        let slit: boolean = false;

        for (let i: number = 0; i < pts.length; i++) {
          const p: V3 = pts[i]!;
          if (Math.abs(p[1] - sto[1]) > 8 || p[0] < sto[0] - 20) continue;

          if (i >= 4 && i + 4 < pts.length) notch = Math.max(notch, (pts[i - 4]![0] + pts[i + 4]![0]) / 2 - p[0]);
          for (let j: number = i + 3; cavity && !slit && j < pts.length; j++)
            if (A.dist(p, pts[j]!) < HumanAnatomyHeadProfile.CONTACT) slit = true;
        }
        if (cavity ? !slit : notch < 0.3) break;
        reach = c;
      }
      width += reach;
    }
    return width;
  }

  /**
   * Tooth points no skin hides from the front: rays forward from each meet no
   * skin. Rebuilds the person's oral cavity from the generation's own surface.
   *
   * @param skin Skin of a generated person.
   * @param lo Lowest height to count, mm.
   * @param hi Highest height to count, mm.
   * @returns The count, or NaN when the cavity cannot be built.
   */
  export function teeth(skin: HumanAnatomy.ISkin, lo: number, hi: number): number {
    const interior: AutoMovieHumanOralCavity.IOutput | undefined = HumanOralCavityParts.get(skin.name).interior;
    if (interior === undefined) return NaN;

    let seen: number = 0;

    for (const part of interior.parts) {
      if (part.geometry.type !== "mesh" || !/tooth|teeth|incisor|molar/i.test(part.id)) continue;

      const P: number[] = part.geometry.mesh.positions;

      for (let v: number = 0; v < P.length; v += 3) {
        const p: V3 = [P[v]!, P[v + 1]!, P[v + 2]!];
        if (p[1] < lo || p[1] > hi) continue;
        if (A.ray(skin, p, 0, 1).crossings === 0) seen++;
      }
    }
    return seen;
  }

  /**
   * The outer skin's section by a sagittal plane at the fissure's height: the
   * curve reaching farthest forward there, the oral cavity's own walls being
   * other curves.
   */
  function outerSection(skin: HumanAnatomy.ISkin, near: Uint32Array, z: number, sto: V3): V3[] {
    let pts: V3[] = [];
    let front: number = -Infinity;

    for (const line of A.polylines(skin, [0, 0, z], [0, 0, 1], near)) {
      const r: V3[] = resample(line.points, 0.5);

      for (const p of r)
        if (Math.abs(p[1] - sto[1]) <= 8 && p[0] > front) {
          front = p[0];
          pts = r;
        }
    }
    return pts;
  }
}
