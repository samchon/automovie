import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadChin } from "./HumanAnatomyHeadChin";
import { HumanAnatomyHeadEar } from "./HumanAnatomyHeadEar";
import { HumanAnatomyHeadEye } from "./HumanAnatomyHeadEye";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyHeadMouth } from "./HumanAnatomyHeadMouth";
import { HumanAnatomyHeadNose } from "./HumanAnatomyHeadNose";
import { HumanAnatomyHeadProfile } from "./HumanAnatomyHeadProfile";
import { HumanAnatomyHeadVault } from "./HumanAnatomyHeadVault";
import type { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type ISide = "left" | "right";
const A: typeof HumanAnatomy = HumanAnatomy;
const ahead: typeof HumanAnatomyHeadGeometry.ahead = HumanAnatomyHeadGeometry.ahead;

/**
 * The face's landmarks and the dimensions between them, located on a skin by
 * the Farkas and FaceBase definitions, whether the skin is a generated person
 * or a captured real head: this piece conducts the others and owns the median
 * landmarks of the nose, lips and brow.
 */
export namespace HumanAnatomyHeadSites {
  /** The face's measures and the landmarks they are taken between. */
  export interface ISites extends HumanAnatomyShared.IFace {
    /** Median landmarks on the outer skin, mm. */
    median: {
      vertex: V3;
      glabella: V3;
      nasion: V3;
      pronasale: V3;
      subnasale: V3;
      labraleSuperius: V3;
      stomion: V3;
      labraleInferius: V3;
      sublabiale: V3;
      pogonion: V3;
      gnathion: V3;
      menton: V3;
      opisthocranion: V3;
    };

    /** Endocanthion and exocanthion by side, mm; NaN when the eye has no fissure. */
    canthi: Record<ISide, { en: V3; ex: V3 }>;

    /** Auricles by side. */
    ears: Record<ISide, HumanAnatomyHeadEar.IEar>;

    /** The median profile from the lip up the face, with the indices of the landmarks on it. */
    profile: {
      /** Profile points from the lip's end up the face, every 0.5 mm. */
      up: V3[];

      /** Index of subnasale on `up`. */
      subnasale: number;

      /** Index of glabella on `up`. */
      glabella: number;
    };
  }

  /**
   * Locate the face's landmarks by their Farkas and FaceBase definitions.
   *
   * @param skin Skin to read, a generated person or a captured head.
   * @param S Stature, mm.
   * @param mouth Whether the skin carries an oral cavity whose teeth to count.
   */
  export function faceSites(skin: HumanAnatomy.ISkin, S: number, mouth: boolean): ISites {
    const loops: V3[][] = A.openings(skin);
    const profile: HumanAnatomyHeadProfile.IProfile = HumanAnatomyHeadProfile.medianProfile(skin, S, loops);
    const { up, lo, eUp, eLo, top, topLine, mouthLoop }: HumanAnatomyHeadProfile.IProfile = profile;

    // Upward from the lip: pronasale the most anterior point before the vertex.
    let vertexIdx: number = 0;
    for (let i: number = 0; i < up.length; i++) if (up[i]![1] > up[vertexIdx]![1]) vertexIdx = i;

    let prn: number = 0;
    for (let i: number = 0; i < vertexIdx; i++) if (up[i]![0] > up[prn]![0]) prn = i;

    // Walking up from the lip the body lies behind, on the walker's left, so a
    // concave corner turns right (negative).
    const sn: number = HumanAnatomyHeadGeometry.subnasale(up, prn, -1);

    // Labrale superius: the upper lip's most prominent point, farthest ahead
    // of the chord from subnasale down to stomion, so a lip that slopes back
    // still shows its own prominence.
    let ls: number = 0;
    for (let i: number = 0; i < sn; i++) if (ahead(up[i]!, up[sn]!, up[0]!) > ahead(up[ls]!, up[sn]!, up[0]!)) ls = i;

    const prnP: V3 = up[prn]!;
    const snP: V3 = up[sn]!;
    const eyes: HumanAnatomyHeadEye.IEyes = HumanAnatomyHeadEye.eyes(loops, prnP, top);

    // The brow is read against the eye openings' mean height, or 40 mm above
    // pronasale when the skin shows no eye.
    const eyeLevel: number =
      eyes.found.length === 0
        ? prnP[1] + 40
        : eyes.found.reduce((s: number, e: V3[]): number => s + HumanAnatomyHeadGeometry.centre(e)[1], 0) / eyes.found.length;
    const brow: HumanAnatomyHeadVault.IBrow = HumanAnatomyHeadVault.brow(up, prn, vertexIdx, eyeLevel);
    const glabella: V3 = up[brow.g]!;
    const nasion: V3 = up[brow.n]!;
    const op: V3 = HumanAnatomyHeadVault.opisthocranion(topLine, glabella);
    const chin: HumanAnatomyHeadChin.IChin = HumanAnatomyHeadChin.chin(lo);
    const gnathion: V3 = lo[chin.gn]!;
    const sto: V3 = A.lerp(eUp, eLo, 0.5);

    // The lips: an opening of the skin parts them, otherwise the labial
    // fissure's crease or slit reaches the cheilia.
    const opening: HumanAnatomyHeadMouth.IOpening | undefined =
      mouthLoop === undefined ? undefined : HumanAnatomyHeadMouth.opening(mouthLoop);
    const mouthWidth: number =
      opening === undefined ? HumanAnatomyHeadMouth.labialFissure(skin, sto, profile.cavity) : opening.width;

    // Teeth are seen through the mouth's opening; skin closed over the mouth
    // hides whatever lies behind it.
    const teethSeen: number =
      !mouth || mouthLoop === undefined ? 0 : HumanAnatomyHeadMouth.teeth(skin, sto[1] - 40, sto[1] + 40);

    const ears: Record<ISide, HumanAnatomyHeadEar.IEar> = {
      left: HumanAnatomyHeadEar.auricle(skin, "left"),
      right: HumanAnatomyHeadEar.auricle(skin, "right"),
    };
    const breadths: HumanAnatomyHeadVault.IBreadths = HumanAnatomyHeadVault.breadths(
      skin,
      [...ears.left.points, ...ears.right.points],
      {
        menton: lo[chin.me]![1],
        stomion: sto[1],
        tragion: A.lerp(ears.left.tragion, ears.right.tragion, 0.5),
        earTop: Math.max(ears.left.superaurale[1], ears.right.superaurale[1]),
        eyeLow: Math.min(...eyes.found.flatMap((e: V3[]): number[] => e.map((p: V3): number => p[1]))),
      },
    );

    return {
      length: A.dist(glabella, op),
      breadth: breadths.head,
      height: top[1] - lo[chin.me]![1],
      circumference: HumanAnatomyHeadVault.circumference(skin, glabella, op, top),
      faceHeight: A.dist(nasion, gnathion),
      faceWidth: breadths.face,
      mandibular: breadths.mandibular,
      intercanthal: A.dist(eyes.canthi.left.en, eyes.canthi.right.en),
      fissure: eyes.fissure,
      noseWidth: HumanAnatomyHeadNose.alare(skin, snP, prnP),
      noseHeight: A.dist(nasion, snP),
      noseProtrusion: A.dist(snP, prnP),
      mouthWidth,
      upperVermilion: A.dist(up[ls]!, sto),
      lowerVermilion: A.dist(sto, lo[chin.li]!),
      lipGap: A.dist(eUp, eLo),
      mouthGap: opening === undefined ? 0 : opening.gap,
      teethSeen,
      nasolabial: HumanAnatomyHeadNose.nasolabial(up, prn, sn, ls),
      lowerFace: A.dist(snP, gnathion) / A.dist(nasion, gnathion),
      upperLip: A.dist(snP, sto) / A.dist(nasion, gnathion),
      median: {
        vertex: top,
        glabella,
        nasion,
        pronasale: prnP,
        subnasale: snP,
        labraleSuperius: up[ls]!,
        stomion: sto,
        labraleInferius: lo[chin.li]!,
        sublabiale: lo[chin.sl]!,
        pogonion: lo[chin.pg]!,
        gnathion,
        menton: lo[chin.me]!,
        opisthocranion: op,
      },
      canthi: eyes.canthi,
      ears,
      profile: { up, subnasale: sn, glabella: brow.g },
    };
  }
}
