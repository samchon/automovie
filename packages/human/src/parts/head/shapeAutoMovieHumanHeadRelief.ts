import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { shapeAutoMovieHumanNose } from "./shapeAutoMovieHumanNose";

/**
 * The head's local relief, as a correction to the distance of the masses, and the nose.
 *
 * Each swelling or hollow sits at the landmark it belongs to, sized by fractions of the face:
 *
 * - Zygomatic prominences, the cheek bones, which "set back from the front of the cage about one-third of the distance to the ear" (Bridgman 1920, Constructive Anatomy, p. 116), elongated along the arch.
 * - Superciliary arches over the medial half of each orbit, meeting at glabella.
 * - Temporal fossae behind the forehead's lateral edge, where "the sides turn sharply to the plane of the temples" (Bridgman, p. 126).
 * - The mandibular angles at gonion and the mental protuberance of the chin.
 * - The buccal fat over each cheek, fuller the smaller the face is against the head, as in infants and young children.
 *
 * The nose is the nose module's solid ({@link shapeAutoMovieHumanNose}).
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
  const share: number = fh / head.headHeight;
  const buccal: number = Math.max(0, form.buccal + form.buccalGrowth * (ADULT_FACE_SHARE - share));
  for (const s of [1, -1])
    bumps.push({
      centre: v(s * 0.3 * fw, frame.stomion.y + 0.2 * fh, frame.nasion.z - 0.1 * fh),
      radii: v(0.15 * fw, 0.2 * fh, 0.35 * fh),
      height: buccal * fh,
    });
  bumps.push({
    centre: v(0, frame.menton.y + 0.1 * fh, frame.nasion.z),
    radii: v(0.13 * fw, 0.1 * fh, 0.2 * fh),
    height: form.mental * fh,
  });
  return {
    relief: (p: IAutoMovieVector3): number => {
      let sum: number = 0;
      for (const b of bumps) {
        const q: number =
          ((p.x - b.centre.x) / b.radii.x) ** 2 +
          ((p.y - b.centre.y) / b.radii.y) ** 2 +
          ((p.z - b.centre.z) / b.radii.z) ** 2;
        if (q < 1) sum += b.height * (1 - q) ** 3;
      }
      return sum;
    },
    nose: shapeAutoMovieHumanNose(frame, head).distance,
  };
}
/** Face height over head height in adults: 127.2 / 219.8 and 118.6 / 205.3 mm (3D Facial Norms face heights over the converter's adult head heights). Grade: derived. */
const ADULT_FACE_SHARE: number = 0.578;

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

    /** Signed distance from the nose, millimetres. */
    nose: (p: IAutoMovieVector3) => number;
  }
}

/** A local swelling or hollow of the skin. */
interface IBump {
  centre: IAutoMovieVector3;
  radii: IAutoMovieVector3;
  height: number;
}
