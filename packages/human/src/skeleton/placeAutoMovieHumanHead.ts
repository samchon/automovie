import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Head proportions derived from adult means, applied at every age as fractions of the head's own measurements. Grade: derived.
 */
const DERIVED: Record<
  | "palateAboveMenton"
  | "stomionBelowNasion"
  | "nasionForward"
  | "pupilSpread"
  | "tragionSpread"
  | "frankfortBelowPupil"
  | "jawCentreBelowCondyle",
  number
> = {
  /** Subnasale above menton over nasion-gnathion height: lower face height 73.1 and 66.4 mm over face height 127.2 and 118.6 mm, men and women (3D Facial Norms; Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197). The head joint is placed at this level, see below. */
  palateAboveMenton: 0.567,
  /** Stomion below nasion over face height: upper face height 78.2 and 74.3 mm over 127.2 and 118.6 mm (same source). */
  stomionBelowNasion: 0.62,
  /** Nasion in front of tragion over head length: tragion-nasion depth 126.7 and 118.9 mm over head length 198.3 and 187.3 mm (same source), the depth taken as horizontal. */
  nasionForward: 0.637,
  /** Half the interpupillary distance over face width: the pupil midway between endocanthion and exocanthion gives (ex-ex + en-en) / 4, which is 0.221 and 0.225 of face width in adult men and women and 0.224 and 0.231 at 3 to 4 years (same source). */
  pupilSpread: 0.225,
  /** Half the bitragion width over face width: tragion-tragion 147.9 and 139.0 mm over 137.6 and 129.8 mm (same source). */
  tragionSpread: 0.5365,
  /** Tragion below the pupil over face height: the Frankfort plane runs through porion and orbitale, the lowest point of the orbital margin, which lies half an orbit height (41 to 43 mm on CT; Bekerman et al. 2014) below the eye centre; 21 mm over the adult face height of 122.9 mm. */
  frankfortBelowPupil: 0.171,
  /** Centre of rotation for jaw opening below the condyle, over face height: 32.4 mm (Mehl et al. 2025, Clin Oral Investig 29:530, optical tracking registered to CT in eight adults) over 122.9 mm. */
  jawCentreBelowCondyle: 0.264,
};

/**
 * Placements no source read measures, as fractions of the head's own measurements. Grade: conventional, each a check on renders.
 *
 * The head joint is the atlanto-occipital joint: radiographically the tip of the dens and the atlas lie near the level of the hard palate, so it is placed at subnasale height, directly below tragion in the frontal plane of the spine, the erect head's plumb line through the ear.
 */
const CONVENTIONAL: Record<
  | "pupilBelowNasion"
  | "eyeBehindNasion"
  | "eyeRadius"
  | "glabellaForward"
  | "glabellaAboveNasion"
  | "condyleForward"
  | "mentonForward"
  | "stomionForward"
  | "gonionAboveMenton"
  | "gonionForward"
  | "zygionForward"
  | "frontotemporaleAboveNasion"
  | "frontotemporaleForward",
  number
> = {
  /** Of face height. */
  pupilBelowNasion: 0.08,
  /** Of head length. */
  eyeBehindNasion: 0.11,
  /** Eye bone length to the cornea, of head height: a 24 mm globe (Bekerman et al. 2014) in an adult head. */
  eyeRadius: 0.059,
  /** Of head length, in front of tragion. */
  glabellaForward: 0.67,
  /** Of face height. */
  glabellaAboveNasion: 0.1,
  /** Mandibular condyle in front of tragion, of head length. */
  condyleForward: 0.07,
  /** Of head length, in front of tragion. */
  mentonForward: 0.58,
  /** Of head length, in front of tragion. */
  stomionForward: 0.6,
  /** Of face height. */
  gonionAboveMenton: 0.25,
  /** Of head length, in front of tragion. */
  gonionForward: 0.02,
  /** Of head length, in front of tragion. */
  zygionForward: 0.3,
  /** Of face height. */
  frontotemporaleAboveNasion: 0.2,
  /** Of head length, in front of tragion. */
  frontotemporaleForward: 0.5,
};

/**
 * Place the head, eyes and jaw.
 *
 * Heights stack from the identity: menton at stature minus head height, nasion a face height above it, the head joint at the hard-palate level, the eyes just below nasion, tragion on the Frankfort plane half an orbit below the eyes. Depths run forward from tragion as fractions of head length: glabella and opisthocranion one head length apart, nasion from the tragion-nasion depth. Widths come from face, mandibular, minimum frontal and head breadths and the derived interpupillary spread. The jaw bone starts at the measured centre of rotation for opening, 32 mm below the condyle in adults, so a single rotation opens the mouth as Mehl et al. tracked it, the condyles gliding forward as the jaw turns.
 *
 * Axes: the head nods about X (flexion forward), as the engine's default; each eye looks down with positive flexion, outward (temporally) with positive abduction, and twists (torsion) about its line of sight; the jaw opens with positive flexion and moves the chin to the person's left with positive abduction.
 *
 * @param body The body measurements
 * @param head The head measurements
 * @returns Head, eye and jaw joints, the head joint centre and the head's landmarks
 */
export function placeAutoMovieHumanHead(
  body: IAutoMovieHumanIdentity.IBody,
  head: IAutoMovieHumanIdentity.IHead,
): placeAutoMovieHumanHead.IOutput {
  const v: typeof AutoMovieHumanVector.of = AutoMovieHumanVector.of;
  const L: number = head.headLength;
  const B: number = (head.headLength * head.cephalicIndex) / 100;
  const fh: number = head.faceHeight;
  const menton: number = body.stature - head.headHeight;
  const nasion: number = menton + fh;
  const eyeY: number = nasion - CONVENTIONAL.pupilBelowNasion * fh;
  const tragionY: number = eyeY - DERIVED.frankfortBelowPupil * fh;
  const eyeZ: number = (DERIVED.nasionForward - CONVENTIONAL.eyeBehindNasion) * L;
  const glabellaZ: number = CONVENTIONAL.glabellaForward * L;
  const vaultZ: number = glabellaZ - L / 2;
  const joint: IAutoMovieVector3 = v(0, menton + DERIVED.palateAboveMenton * fh, 0);
  const jaw: IAutoMovieVector3 = v(
    0,
    tragionY - DERIVED.jawCentreBelowCondyle * fh,
    CONVENTIONAL.condyleForward * L,
  );
  const vertex: IAutoMovieVector3 = v(0, body.stature, vaultZ);
  const mentonPoint: IAutoMovieVector3 = v(0, menton, CONVENTIONAL.mentonForward * L);
  const mark: (
    bone: "head" | "jaw",
    position: IAutoMovieVector3,
  ) => IAutoMovieHumanLandmarks.ILandmark = (
    bone: "head" | "jaw",
    position: IAutoMovieVector3,
  ): IAutoMovieHumanLandmarks.ILandmark => ({ bone, position });
  const side: (s: number) => placeAutoMovieHumanHead.ISide = (
    s: number,
  ): placeAutoMovieHumanHead.ISide => ({
    eurion: mark("head", v((s * B) / 2, (body.stature + tragionY) / 2, vaultZ)),
    zygion: mark(
      "head",
      v((s * head.faceWidth) / 2, tragionY, CONVENTIONAL.zygionForward * L),
    ),
    frontotemporale: mark(
      "head",
      v(
        (s * head.minimumFrontalWidth) / 2,
        nasion + CONVENTIONAL.frontotemporaleAboveNasion * fh,
        CONVENTIONAL.frontotemporaleForward * L,
      ),
    ),
    gonion: mark(
      "jaw",
      v(
        (s * head.mandibularWidth) / 2,
        menton + CONVENTIONAL.gonionAboveMenton * fh,
        CONVENTIONAL.gonionForward * L,
      ),
    ),
    tragion: mark("head", v(s * DERIVED.tragionSpread * head.faceWidth, tragionY, 0)),
  });
  const eye: (s: number) => IAutoMovieHumanSkeleton.IJoint = (
    s: number,
  ): IAutoMovieHumanSkeleton.IJoint => {
    const centre: IAutoMovieVector3 = v(
      s * DERIVED.pupilSpread * head.faceWidth,
      eyeY,
      eyeZ,
    );
    return {
      bone: s === 1 ? "leftEye" : "rightEye",
      parent: "head",
      position: centre,
      tail: v(centre.x, centre.y, centre.z + CONVENTIONAL.eyeRadius * head.headHeight),
      axes: { flexion: v(1, 0, 0), abduction: v(0, s, 0), twist: v(0, 0, -s) },
      constraint: null,
    };
  };
  return {
    joint,
    joints: [
      {
        bone: "head",
        parent: "neck",
        position: joint,
        tail: vertex,
        axes: { flexion: v(1, 0, 0), abduction: v(0, 0, 1), twist: v(0, 1, 0) },
        constraint: null,
      },
      eye(1),
      eye(-1),
      {
        bone: "jaw",
        parent: "head",
        position: jaw,
        tail: mentonPoint,
        axes: { flexion: v(1, 0, 0), abduction: v(0, 1, 0), twist: v(0, 0, 1) },
        constraint: null,
      },
    ],
    landmarks: {
      vertex: mark("head", vertex),
      glabella: mark(
        "head",
        v(0, nasion + CONVENTIONAL.glabellaAboveNasion * fh, glabellaZ),
      ),
      nasion: mark("head", v(0, nasion, DERIVED.nasionForward * L)),
      opisthocranion: mark(
        "head",
        v(0, nasion + CONVENTIONAL.glabellaAboveNasion * fh, glabellaZ - L),
      ),
      stomion: mark(
        "jaw",
        v(
          0,
          nasion - DERIVED.stomionBelowNasion * fh,
          CONVENTIONAL.stomionForward * L,
        ),
      ),
      menton: mark("jaw", mentonPoint),
    },
    left: side(1),
    right: side(-1),
  };
}
/** Side and output types of {@link placeAutoMovieHumanHead}. */
export namespace placeAutoMovieHumanHead {
  /** Head landmarks of one side. */
  export type ISide = Pick<
    IAutoMovieHumanLandmarks.ISide,
    "eurion" | "zygion" | "frontotemporale" | "gonion" | "tragion"
  >;

  /**
   * The placed head.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Head (atlanto-occipital) joint centre, the neck bone's tail. */
    joint: IAutoMovieVector3;

    /** Head, eyes and jaw, parents first. */
    joints: IAutoMovieHumanSkeleton.IJoint[];

    /** Midline head landmarks. */
    landmarks: Pick<
      IAutoMovieHumanLandmarks,
      "vertex" | "glabella" | "nasion" | "opisthocranion" | "stomion" | "menton"
    >;

    /** Left head landmarks. */
    left: ISide;

    /** Right head landmarks. */
    right: ISide;
  }
}
