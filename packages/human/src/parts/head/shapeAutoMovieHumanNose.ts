import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The nose module: the nose as a solid the face surface takes on, from the identity's nose width, height and protrusion, with the place of each nostril's pocket.
 *
 * Subnasale lies the nose height below nasion, at the depth the face takes for it, and pronasale the protrusion in front of it, {@link TIP_RISE} of the nose height above it. Four smooth masses make the nose, joined by a smooth union: the dorsum from the nasal root to the tip, widening from the root's breadth ({@link ROOT} of the nose width; Du et al. 2008 measure the root breadth 18.3 of a 39.2 mm nose in Chinese men) toward the lobule; the tip's lobule; the two alae, whose outer edges are the nose width apart; and the columella from the tip back to subnasale. Each nostril's pocket centre sits inside the ala's base, lifted into the nose, so the cage's nostril cells fold in around it.
 *
 * @param frame The head frame and its landmarks
 * @param head The head measurements
 * @returns The nose's signed distance and the nostrils' pocket centres, left first, head frame
 */
export function shapeAutoMovieHumanNose(
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
): shapeAutoMovieHumanNose.IOutput {
  const f: IAutoMovieHumanIdentity.IFeatures = head.features;
  const v = AutoMovieHumanVector.of;
  const width: number = f.noseWidth;
  const height: number = f.noseHeight;
  const snY: number = frame.nasion.y - height;
  const snZ: number = frame.nasion.z + SUBNASALE * head.faceHeight;
  const lobule: number = 0.24 * width;
  const tip: IAutoMovieVector3 = v(0, snY + TIP_RISE * height, snZ + f.noseProtrusion - lobule);
  const root: IAutoMovieVector3 = v(0, frame.nasion.y - 0.04 * height, frame.nasion.z - 0.5 * ROOT * width);
  const ala: number = 0.24 * width;
  const alae: IAutoMovieVector3[] = [1, -1].map(
    (s: number): IAutoMovieVector3 => v(s * (width / 2 - ala), snY + 0.1 * height, snZ + 0.15 * f.noseProtrusion),
  );
  const columella: number = 0.1 * width;
  const blend: number = 0.25 * width;
  const capsule = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    ra: number,
    rb: number,
    p: IAutoMovieVector3,
  ): number => {
    const ab: IAutoMovieVector3 = AutoMovieHumanVector.offset(b, [a, -1]);
    const ap: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [a, -1]);
    const t: number = Math.min(1, Math.max(0, AutoMovieHumanVector.dot(ap, ab) / AutoMovieHumanVector.dot(ab, ab)));
    const q: IAutoMovieVector3 = AutoMovieHumanVector.offset(a, [ab, t]);
    return AutoMovieHumanVector.distance(p, q) - (ra + (rb - ra) * t);
  };
  const subnasale: IAutoMovieVector3 = v(0, snY + 0.02 * height, snZ);
  return {
    distance: (p: IAutoMovieVector3): number => {
      let d: number = capsule(root, tip, 0.5 * ROOT * width, 0.3 * width, p);
      d = AutoMovieHumanHeadMath.smoothMin(d, AutoMovieHumanVector.distance(p, tip) - lobule, blend);
      for (const a of alae)
        d = AutoMovieHumanHeadMath.smoothMin(d, AutoMovieHumanVector.distance(p, a) - ala, blend);
      d = AutoMovieHumanHeadMath.smoothMin(d, capsule(tip, subnasale, columella, columella, p), 0.5 * blend);
      // the nose ends at the lip: nothing of it below subnasale
      return AutoMovieHumanHeadMath.smoothMax(d, snY - 0.02 * height - p.y, 0.3 * blend);
    },
    nostrils: [1, -1].map(
      (s: number): IAutoMovieVector3 => v(s * 0.2 * width, snY + 0.04 * height, snZ + 0.25 * f.noseProtrusion),
    ) as [IAutoMovieVector3, IAutoMovieVector3],
  };
}
/** Output type of {@link shapeAutoMovieHumanNose}. */
export namespace shapeAutoMovieHumanNose {
  /**
   * The nose solid and its nostrils.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Signed distance from the nose, millimetres, head frame. */
    distance: (p: IAutoMovieVector3) => number;

    /** Each nostril's pocket centre, left first, head frame. */
    nostrils: [IAutoMovieVector3, IAutoMovieVector3];
  }
}

/** Subnasale in front of nasion over face height, from the 3D Facial Norms tragion depths (Weinberg et al. 2016). Grade: derived. */
const SUBNASALE: number = 0.081;

/** Pronasale above subnasale over nose height. Conventional: the tip's lobule sits over the columella. */
const TIP_RISE: number = 0.12;

/** Nasal root breadth over nose width: 18.3 over 39.2 mm in Chinese men and 17.3 over 36.1 in women (Du et al. 2008, Ann Occup Hyg 52(8):773-782). Grade: derived. */
const ROOT: number = 0.47;
