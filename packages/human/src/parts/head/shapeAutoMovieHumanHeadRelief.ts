import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The head's local relief and the neutral nose, as a correction to the distance of the masses.
 *
 * Each swelling or hollow sits at the landmark it belongs to, sized by fractions of the face:
 *
 * - Zygomatic prominences, the cheek bones, which "set back from the front of the cage about one-third of the distance to the ear" (Bridgman 1920, Constructive Anatomy, p. 116), elongated along the arch.
 * - Superciliary arches over the medial half of each orbit, meeting at glabella.
 * - Temporal fossae behind the forehead's lateral edge, where "the sides turn sharply to the plane of the temples" (Bridgman, p. 126).
 * - The mandibular angles at gonion and the mental protuberance of the chin.
 *
 * The neutral nose is the region the nose module replaces: a tapered wedge from the nasal root to the tip with the alae at its base, from the 3D Facial Norms adult means over face height and width (nasal height n-sn 56.6 / 127.2, protrusion sn-prn 21.0 / 127.2, width al-al 36.1 / 137.6; Weinberg et al. 2016). Grade: derived.
 *
 * @param frame The head frame and its landmarks
 * @param head The head measurements
 * @param breadth Maximum head breadth, millimetres
 * @param form Form coefficients
 * @returns The relief, millimetres outward, and the nose's signed distance
 */
export function shapeAutoMovieHumanHeadRelief(
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
  breadth: number,
  form: IAutoMovieHumanHeadForm,
): shapeAutoMovieHumanHeadRelief.IOutput {
  const fh: number = head.faceHeight;
  const fw: number = head.faceWidth;
  const v = AutoMovieHumanVector.of;
  const bumps: IBump[] = [];
  for (const s of [1, -1]) {
    bumps.push({
      centre: v(s * 0.38 * fw, frame.eye.y - 0.19 * fh, frame.zygion.z + 0.1 * fh),
      radii: v(0.16 * fw, 0.11 * fh, 0.35 * fh),
      height: form.malar * fh,
    });
    bumps.push({
      centre: v(s * 0.16 * fw, frame.eye.y + 0.16 * fh, frame.glabella.z),
      radii: v(0.17 * fw, 0.08 * fh, 0.25 * fh),
      height: form.brow * fh,
    });
    bumps.push({
      centre: v(s * 0.5 * breadth, frame.eye.y + 0.12 * fh, frame.frontotemporale.z - 0.25 * fh),
      radii: v(0.15 * fw, 0.2 * fh, 0.22 * fh),
      height: -form.templeHollow * fh,
    });
    bumps.push({
      centre: v(s * frame.gonion.x, frame.gonion.y + 0.02 * fh, frame.gonion.z + 0.03 * fh),
      radii: v(0.1 * fw, 0.12 * fh, 0.15 * fh),
      height: form.gonial * fh,
    });
  }
  bumps.push({
    centre: v(0, frame.menton.y + 0.1 * fh, frame.nasion.z),
    radii: v(0.13 * fw, 0.1 * fh, 0.2 * fh),
    height: form.mental * fh,
  });
  const snY: number = frame.menton.y + 0.567 * fh;
  const subnasale: number = frame.nasion.z + 0.081 * fh;
  const root: IAutoMovieVector3 = v(0, frame.nasion.y - 0.05 * fh, frame.nasion.z - 0.01 * fh);
  const tip: IAutoMovieVector3 = v(0, snY + 0.05 * fh, subnasale + 0.15 * fh);
  const halfWidth: number = 0.131 * fw;
  const rootHalfWidth: number = 0.06 * fw;
  return {
    relief: (p: IAutoMovieVector3): number => {
      let sum: number = 0;
      for (const b of bumps) {
        const q: number =
          ((p.x - b.centre.x) / b.radii.x) ** 2 +
          ((p.y - b.centre.y) / b.radii.y) ** 2 +
          ((p.z - b.centre.z) / b.radii.z) ** 2;
        if (q < 1) sum += b.height * (1 - q) ** 2;
      }
      return sum;
    },
    nose: (p: IAutoMovieVector3): number => {
      if (p.y > root.y + 2 || p.y < snY - 2) return 1e3;
      const t: number = Math.min(1, Math.max(0, (root.y - p.y) / (root.y - snY)));
      const ridge: number =
        root.z + (tip.z - root.z) * Math.min(1, t / ((root.y - tip.y) / (root.y - snY)));
      const half: number = rootHalfWidth + (halfWidth - rootHalfWidth) * Math.pow(t, 1.6);
      const depth: number = Math.max(1, ridge - (root.z - 0.4 * half - 10));
      const dx: number = Math.abs(p.x);
      const dz: number = p.z - (ridge - depth);
      const s: number =
        dz > 0
          ? Math.pow(dx / half, 1.6) + Math.pow(dz / depth, 1.6)
          : (dx / half) ** 2 + (dz / depth) ** 2;
      return Math.max(
        AutoMovieHumanHeadMath.radial(Math.hypot(dx, dz), s, 1.6),
        snY - p.y,
      );
    },
  };
}
/** Output type of {@link shapeAutoMovieHumanHeadRelief}. */
export namespace shapeAutoMovieHumanHeadRelief {
  /**
   * The relief and the nose.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Outward offset of the skin at a point, millimetres; negative in a hollow. */
    relief: (p: IAutoMovieVector3) => number;

    /** Signed distance from the neutral nose, millimetres. */
    nose: (p: IAutoMovieVector3) => number;
  }
}

/** A local swelling or hollow of the skin. */
interface IBump {
  centre: IAutoMovieVector3;
  radii: IAutoMovieVector3;
  height: number;
}
