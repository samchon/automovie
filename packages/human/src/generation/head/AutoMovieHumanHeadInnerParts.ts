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
 * | Part                                | Parent                                   | Join        | Size from                                                                                                    |
 * | ----------------------------------- | ---------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
 * | tip lobule                          | nose                                     | merge       | elliptical cap, as wide as the tip ball's breadth (`face.tipBall[2]` half nose widths), closing at pronasale |
 * | ala, each side                      | nose                                     | merge       | original nasal side to alare, with the retained alar footprint                                               |
 * | nostril, each side                  | nose (material contact: that side's ala) | diff        | an ellipse entering the underside of the actual ala                                                          |
 * | philtral groove                     | head mass                                | diff        | the philtrum's depth and half width (`face.philtrum`), subnasale to labrale superius                         |
 * | mentolabial sulcus                  | head mass                                | diff        | Legan and Burstone's sulcus depth (`profile.sulcus`) at the sublabiale                                       |
 * | helix, antihelix, concha, each side | auricle                                  | merge, diff | drawn in the ear's own frame (`AutoMovieHumanHeadEarParts`)                                                  |
 *
 * The alar centre and upper/lower heights use the retained vertical n-prn
 * ratios. Projected long supports preserve those heights in the tilted nasal
 * frame. Each alar base uses the original nasal surface on the lateral axis to
 * alare. Each nostril uses the underside of its own ala. Philtrum uses the
 * actual source Sn-ls chord. The labiomental depth is perpendicular to the
 * actual source Li-Pg line (Legan/Burstone 1980).
 *
 * @evidence contracts/common.md#principled-implementation Uses actual native contact for the alar bases and both nostril recesses. Alar height ratios keep their vertical n-prn denominator when mapped into the tilted footprint. The nostril footprint scales adult basilar measurements by the supplied al–al chord.
 * @evidence contracts/common.md#clear-and-simple-design Places a fixed set of inner views and returns their explicit parent/join metadata; Dome owns the shared cap source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native-mesh fit, parent relocation or kernel-grazing profile change determines these sources. Existing positive-size floors and embedding allowances remain declared construction conventions.
 * @evidence contracts/common.md#meaningful-documentation States the source units, prior denominators, tilted-frame projection and original material contacts.
 * @evidence contracts/performance.md#efficient-algorithms Seven source requests use fixed vector arithmetic and cap station counts; material contacts additionally admit original scalars, order original source sites and search bounded native/plane brackets at their owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One nasal frame and shared source lip sites serve the related parts; each returned view is authored once per call.
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
   * @evidence contracts/common.md#principled-implementation Preserves Euclidean source landmarks, al-al apices and the retained alar vertical n-prn ratios; dividing by the nasal unit direction's Y component converts height to local long support.
   * @evidence contracts/common.md#clear-and-simple-design Shares one nasal frame and returns the explicit inner-part list for Composer, leaving joins to the tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the original material source during authoring. The retained ratio placements, floors, embedding allowance and cutter axes are declared estimates.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes alar ratio units, cap placement and the still-unrealized openings and lining.
   * @evidence contracts/performance.md#efficient-algorithms Seven requests combine fixed vector/cap work with original scalar admission, O(n log n) source-site ordering, bounded native contact/plane inverses and one prepared native curvature read per success.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses nasal directions and the original lip sites within this assembly; each view is produced once and borrowed by Composer.
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
    const alarSpan: number = plan.nasion - plan.tip;
    const nasalForward: number = m.pronasale[0] - m.subnasale[0];
    // Transfer Chaikangwan et al. Table 1's mean adult aperture (12.5 by
    // 8.6 mm) using the midpoint of the two adult FaceBase al–al norms.
    const nostrilLength: number = (12.5 / 34.35) * plan.noseWidth;
    const nostrilWidth: number = (8.6 / 34.35) * plan.noseWidth;

    // The nose's frame: up along the dorsum's chord, forward square to it.
    const up: [number, number, number] = unit([
      m.nasion[0] - m.subnasale[0],
      m.nasion[1] - m.subnasale[1],
      0,
    ]);
    const forward: [number, number, number] = [up[1], -up[0], 0];
    const tip: [number, number, number] = [m.pronasale[0], m.pronasale[1], 0];
    // Oblique nasal sections can turn back in lobule phase while their
    // true intersection remains transversal. Trace by physical arclength.
    out.push(
      ...part(
        "nose.lobule",
        "nose",
        "merge",
        sub(tip, scale(forward, INSET + (f.tipBall[2]! * plan.noseWidth) / 2)),
        forward,
        up,
        [
          f.tipBall[2]! * plan.noseWidth,
          f.tipBall[2]! * plan.noseWidth,
          f.tipBall[2]! * plan.noseWidth,
          f.tipBall[2]! * plan.noseWidth,
        ],
        INSET + (f.tipBall[2]! * plan.noseWidth) / 2,
        tip,
        nose,
        attempts,
      ).map(
        (feature): IAutoMovieHumanHeadFeatures.IFeature => ({
          ...feature,
          parameter: "arc",
        }),
      ),
    );
    for (const sign of [1, -1] as const) {
      const side: string = sign > 0 ? "left" : "right";
      const half: number = f.ala[5]! * plan.noseWidth;

      // Weinberg et al. 3D Facial Norms defines lateral alare and measures
      // al–al. The AP fraction of the prn lead and the vertical n–prn
      // fraction are retained ESTIMATEs locating the section of the wing.
      const apex: [number, number, number] = [
        m.subnasale[0] + 0.42 * nasalForward,
        m.subnasale[1] + f.ala[2]! * alarSpan,
        sign * plan.noseWidth,
      ];
      const lower: number = (f.ala[4]! * alarSpan) / up[1];
      const footprint: [number, number, number, number] = [
        (f.ala[3]! * alarSpan) / up[1],
        half,
        lower,
        half,
      ];
      const name: string = `nose.ala.${side}`;
      const span: Omit<IAutoMovieHumanHeadDome.IDome, "host"> = {
        name,
        origin: [apex[0], apex[1], 0],
        outward: [0, 0, sign],
        along: up,
        extents: footprint,
        height: plan.noseWidth,
        profile: 2,
        shoulder: AutoMovieViewSection.ELLIPSE,
      };
      const ala: IAutoMovieHumanHeadFeatures.IFeature[] = domePart(
        span,
        "nose",
        "merge",
        apex,
        nose,
        attempts,
        INSET,
      );
      out.push(...ala);

      // The midpoint of the exposed lateral run leaves material on both
      // sides of the cut axis. Project the lower footprint box onto Y to
      // start outside the real cap and end at its interior axis.
      const drop: number = lower * up[1] + half * Math.abs(up[0]);
      const nostril: [number, number, number] = [
        apex[0],
        apex[1] - drop,
        ((ala[0]?.attachment?.point[2] ?? 0) + apex[2]) / 2,
      ];
      // The cumulative nose subtree merges this ala before the nostril
      // difference. Surface contact belongs to the same side's original ala.
      // World-X alignment is an ESTIMATE for the simplified external inlet.
      out.push(
        ...part(
          `nose.nostril.${side}`,
          "nose",
          "diff",
          [nostril[0], nostril[1] - INSET, nostril[2]],
          [0, 1, 0],
          [1, 0, 0],
          [nostrilLength, nostrilWidth, nostrilLength, nostrilWidth],
          INSET + drop,
          nostril,
          ala[0]?.part ?? `nose.ala.${side}`,
          attempts,
          INSET,
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
        "diff",
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
        "diff",
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
   * @param host The original material parent, or the name of a required one
   *   whose own source failed; that name records this part as a failed attempt
   *   instead of authoring it without its contact.
   */
  function part(
    name: string,
    parent: string,
    join: "merge" | "diff",
    origin: [number, number, number],
    outward: [number, number, number],
    along: [number, number, number],
    extents: [number, number, number, number],
    height: number,
    seed: [number, number, number],
    host: IAutoMovieViewPart | string,
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
    baseInset?: number,
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
    };

    return domePart(dome, parent, join, seed, host, attempts, baseInset);
  }

  /** Admit the caller's original cap and keep its tree and material owners. */
  function domePart(
    dome: Omit<IAutoMovieHumanHeadDome.IDome, "host">,
    parent: string,
    join: "merge" | "diff",
    seed: [number, number, number],
    host: IAutoMovieViewPart | string,
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
    baseInset?: number,
  ): IAutoMovieHumanHeadFeatures.IFeature[] {
    const { name, origin, extents: e } = dome;
    // A missing material parent is its own failed premise, recorded like
    // any other attempt, so the composer still refuses the whole head.
    if (typeof host === "string") {
      const error: string = `Dome ${name} has no original material parent ${host}`;
      if (attempts === undefined) throw new Error(error);
      attempts.push({
        name,
        definition: dome,
        parent: host,
        parentSource: null,
        domain: null,
        base: [...origin],
        point: [...seed],
        attachment: null,
        error,
      });
      return [];
    }
    const source: ReturnType<typeof AutoMovieHumanHeadDome.attempt> =
      AutoMovieHumanHeadDome.attempt(dome, host, seed, attempts, baseInset);
    return source === null
      ? []
      : [
          {
            part: source,
            join,
            seed,
            contact:
              source.attachment === null || source.attachment.parameter === null
                ? INSET
                : source.stations.at(-1)! -
                  source.rise +
                  source.attachment.parameter,
            size: [source.rise - INSET, Math.min(...e)],
            parent,
            ...(host === undefined ? {} : { material: host }),
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
