import { AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMovieHumanHeadDome,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieHumanHeadLandmarks,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPrior,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadLipPart } from "./AutoMovieHumanHeadLipPart";

/**
 * The parts inside the face's parts, each joined to its own parent part:
 *
 * | Part               | Parent    | Join | Size from                                                                            |
 * | ------------------ | --------- | ---- | ------------------------------------------------------------------------------------ |
 * | nostril, each side | nose      | diff | an ellipse entering the underside of the original nose from its own alar quadrant    |
 * | philtral groove    | head mass | diff | the philtrum's depth and half width (`face.philtrum`), subnasale to labrale superius |
 * | mentolabial sulcus | head mass | diff | Legan and Burstone's sulcus depth (`profile.sulcus`) at the sublabiale               |
 *
 * Each nostril uses the underside of its own alar quadrant on the original
 * nose. Philtrum uses the actual source Sn-ls chord. The labiomental depth is
 * perpendicular to the actual source Li-Pg line (Legan/Burstone 1980).
 *
 * @evidence contracts/common.md#principled-implementation Uses actual native contact for both nostril recesses and scales adult basilar measurements by the supplied al–al chord.
 * @evidence contracts/common.md#clear-and-simple-design Places a fixed set of inner views and returns their explicit parent/join metadata; Dome owns the shared cap source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native-mesh fit, parent relocation or kernel-grazing profile change determines these sources. Existing positive-size floors and embedding allowances remain declared construction conventions.
 * @evidence contracts/common.md#meaningful-documentation States source units, prior denominators and original material contacts.
 * @evidence contracts/performance.md#efficient-algorithms Four source requests use fixed vector arithmetic and cap station counts; material contacts additionally admit original scalars, order original source sites and search bounded native/plane brackets at their owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Both cutters share the original nose guides and both grooves borrow the original lip sites; each returned view is authored once per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned feature arrays. Temporary vectors and constants are call-local, with no retained figure cache or handles.
 */
export namespace AutoMovieHumanHeadInnerParts {
  /**
   * Depth of an inner part's base inside its parent, mm.
   *
   * @evidence contracts/common.md#principled-implementation Declares the existing 1.5 mm embedding allowance, not measured tissue thickness.
   * @evidence contracts/common.md#clear-and-simple-design One allowance serves the inner-part constructors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The allowance is independent of person, mesh and join outcome.
   * @evidence contracts/common.md#meaningful-documentation Names its embedding role and calibration millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar constant selects no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar constant coordinates no computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar constant owns no retained population or handles.
   */
  export const INSET: number = 1.5;

  /**
   * Every inner part of a person.
   *
   * @param plan The landmark skeleton.
   * @param parents The identical evaluated original parents, before any Boolean
   *   realization.
   * @returns The parts, each naming its parent.
   * @evidence contracts/common.md#principled-implementation Preserves Euclidean source landmarks and reads the original nose's alare guides for each nostril's material contact.
   * @evidence contracts/common.md#clear-and-simple-design Shares one nasal frame and returns the explicit inner-part list for Composer, leaving joins to the tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the original material source during authoring. The retained ratio placements, floors, embedding allowance and cutter axes are declared estimates.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes original alare placement, cap placement and verification of the openings and lining.
   * @evidence contracts/performance.md#efficient-algorithms Four requests combine fixed vector/cap work with original scalar admission, O(n log n) source-site ordering, bounded native contact/plane inverses and one prepared native curvature read per success.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the alare guide and original lip sites within this assembly; each view is produced once and borrowed by Composer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned views and metadata, with call-local vectors and no cache, task or handle ownership.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    parents: ReadonlyMap<string, IAutoMovieViewPart>,
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
  ): IAutoMovieHumanHeadFeatures.IFeature[] {
    const parent: (name: string) => IAutoMovieViewPart = (
      name: string,
    ): IAutoMovieViewPart => {
      const source: IAutoMovieViewPart | undefined = parents.get(name);
      if (source === undefined)
        throw new Error(`Inner part has no actual original parent ${name}`);
      return source;
    };
    const mass: IAutoMovieViewPart = parent("head.mass");
    const nose: IAutoMovieViewPart = parent("nose");
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const prior: IAutoMovieHumanHeadPrior.IPrior =
      AutoMovieHumanHeadPrior.PRIOR;
    const f: IAutoMovieHumanHeadPrior.IFace = prior.face;
    const out: IAutoMovieHumanHeadFeatures.IFeature[] = [];
    // Transfer Chaikangwan et al. Table 1's mean adult aperture (12.5 by
    // 8.6 mm) using the midpoint of the two adult FaceBase al–al norms.
    const nostrilLength: number = (12.5 / 34.35) * plan.noseWidth;
    const nostrilWidth: number = (8.6 / 34.35) * plan.noseWidth;
    // The rear of the inlet has a rounded bulb. ESTIMATE its long support
    // from the transverse radius and give the anterior end the remaining
    // measured length so the section tapers toward the anterior end.
    const aperture: [number, number, number, number] = [
      2 * nostrilLength - nostrilWidth,
      nostrilWidth,
      nostrilWidth,
      nostrilWidth,
    ];
    const alare: IAutoMovieViewPart.IKnot | undefined =
      nose.side.positive.knots.find((knot) => knot.site === "nose.alare");
    const touch: IAutoMovieViewPart.IKnot | undefined =
      nose.fullness.kind === "top"
        ? nose.fullness.touch?.[1].knots.find(
            (knot) => knot.site === "nose.alare",
          )
        : undefined;
    const front: IAutoMovieViewPart.IKnot | undefined =
      nose.front.positive.knots.find((knot) => knot.site === "nose.alare");
    if (alare === undefined || touch === undefined || front === undefined)
      throw new Error("Nostril cutters need the original nose's alar support");
    // ESTIMATE: use the centre of the anterolateral quadrant's AP span.
    const x: number =
      nose.axis.at(alare.station).origin[0] + (touch.value + front.value) / 2;
    // The simplified vestibule enters superiorly. In its axial plane, the
    // two ovoids preserve Yang et al.'s 78.09-degree interaxial angle
    // (PMID 27547650, Table 1).
    const divergence: number = (78.09 * Math.PI) / 360;
    // The mean male/female alar-wall ultrasound readings are 3.99/3.45 mm
    // (PMID 23197287). Scale the estimated transverse radius, half the
    // wall thickness, by the same reference-to-person breadth ratio.
    const wallRadius: number = ((3.99 + 3.45) / 2 / 34.35) * plan.noseWidth;
    const start: number = nose.stations[0]! - INSET;
    const height: number = alare.station - start;
    const reach: number = Math.cos(divergence);
    for (const sign of [1, -1] as const) {
      const side: string = sign > 0 ? "left" : "right";
      // ESTIMATE: the centre lies halfway across the native hemi-base from
      // the midsagittal plane to alare. Both cutters keep their own side.
      const z: number = (sign * alare.value) / 2;
      out.push(
        ...part(
          `nose.nostril.${side}`,
          "nose",
          [x, start, z],
          [0, 1, 0],
          [reach, 0, -sign * Math.sin(divergence)],
          aperture,
          height,
          [x, alare.station, z],
          nose,
          attempts,
          { inset: INSET, reach: wallRadius },
        ),
      );
    }
    // The philtral groove and the mentolabial sulcus, cut from the head mass.
    const ls: [number, number, number] = AutoMovieHumanHeadLipPart.midline(
      plan,
      true,
    );
    const philtral: [number, number, number] = unit([
      m.subnasale[0] - ls[0],
      m.subnasale[1] - ls[1],
      0,
    ]);
    const philtralInward: [number, number, number] = [
      -philtral[1],
      philtral[0],
      0,
    ];
    const philtralCentre: [number, number, number] = [
      (m.subnasale[0] + ls[0]) / 2,
      (m.subnasale[1] + ls[1]) / 2,
      0,
    ];
    const philtralHalf: number =
      Math.hypot(m.subnasale[0] - ls[0], m.subnasale[1] - ls[1]) / 2;
    const grooveHalfWidth: number = f.philtrum[1]! * (2 * plan.mouthWidth);
    out.push(
      ...part(
        "philtrum",
        "head.mass",
        sub(philtralCentre, scale(philtralInward, INSET)),
        philtralInward,
        philtral,
        [philtralHalf, grooveHalfWidth, philtralHalf, grooveHalfWidth],
        INSET + f.philtrum[0]! * grooveHalfWidth,
        philtralCentre,
        mass,
        attempts,
      ),
    );
    const li: [number, number, number] = AutoMovieHumanHeadLipPart.midline(
      plan,
      false,
    );
    const lowerChord: [number, number, number] = unit([
      li[0] - m.pogonion[0],
      li[1] - m.pogonion[1],
      0,
    ]);
    const sulcusInward: [number, number, number] = [
      -lowerChord[1],
      lowerChord[0],
      0,
    ];
    const sulcusCentre: [number, number, number] = [
      (li[0] + m.pogonion[0]) / 2,
      (li[1] + m.pogonion[1]) / 2,
      0,
    ];
    const sulcus: number =
      prior.profile.sulcus * (plan.faceHeight / prior.profile.unit);
    out.push(
      ...part(
        "sulcus.mentolabial",
        "head.mass",
        sub(sulcusCentre, scale(sulcusInward, INSET)),
        sulcusInward,
        [0, 0, 1],
        [plan.mouthWidth, sulcus, plan.mouthWidth, sulcus],
        INSET + sulcus,
        sulcusCentre,
        mass,
        attempts,
      ),
    );

    return out;
  }

  /**
   * One inner part.
   *
   * @param host The original material parent.
   */
  function part(
    name: string,
    parent: string,
    origin: [number, number, number],
    outward: [number, number, number],
    along: [number, number, number],
    extents: [number, number, number, number],
    height: number,
    seed: [number, number, number],
    host: IAutoMovieViewPart,
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
    base?: { inset: number; reach: number },
  ): IAutoMovieHumanHeadFeatures.IFeature[] {
    const h: number = Math.max(INSET + 0.5, height);
    const e: [number, number, number, number] = extents.map(
      (x: number): number => Math.max(0.5, Math.abs(x)),
    ) as [number, number, number, number];
    const dome: Omit<IAutoMovieHumanHeadDome.IDome, "host"> = {
      name,
      origin,
      outward,
      along,
      extents: e,
      height: h,
      profile: 2,
      shoulder: AutoMovieViewSection.ELLIPSE,
      // A surface-relative base can move toward its original apex. Keep the
      // cutter's open stem outside the original inferior bracket in that
      // case, using the largest possible displacement of the new base.
      ...(base === undefined ? {} : { stem: h - base.inset }),
    };

    const source: ReturnType<typeof AutoMovieHumanHeadDome.attempt> =
      AutoMovieHumanHeadDome.attempt(dome, host, seed, attempts, base?.inset);
    return source === null
      ? []
      : [
          {
            part: source,
            join: "diff",
            seed,
            contact:
              source.attachment === null || source.attachment.parameter === null
                ? INSET
                : source.stations.at(-1)! -
                  source.rise +
                  source.attachment.parameter,
            // The inlet's wall radius bounds its surrounding tissue reach.
            size: [
              Math.min(source.rise - INSET, base?.reach ?? Infinity),
              Math.min(...e),
            ],
            parent,
            material: host,
            ...(source.attachment === null
              ? {}
              : { attachment: source.attachment }),
            elongated: Math.max(...e) > 2 * Math.min(...e),
          },
        ];
  }

  /** A vector scaled to length 1. */
  function unit(a: [number, number, number]): [number, number, number] {
    const l: number = Math.hypot(...a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Difference. */
  function sub(
    a: readonly number[],
    b: readonly number[],
  ): [number, number, number] {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Scaled vector. */
  function scale(a: readonly number[], s: number): [number, number, number] {
    return [a[0]! * s, a[1]! * s, a[2]! * s];
  }
}
