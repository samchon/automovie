import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedBodyProfile } from "./QuadrupedBodyProfile";

/**
 * A coarse ox control body anchored to the Kathani working-bullock means.
 *
 * Bhagat et al. 2022, Table 2, measured 2614 working bullocks
 * (https://doi.org/10.56093/ijans.v92i10.105090). Their withers, girth,
 * body, face, ear, horn and tail means stay together in MEASURES. The survey
 * supplies no limb lengths, neck dimensions, joint directions or live mass.
 *
 * The separate FH adult-female digital column in Hakim et al. 2019, Table 2
 * (https://doi.org/10.29244/jipthp.7.2.47-56), supplies provisional limb and
 * cervical control proportions. These are live surface landmarks: even its
 * femur row runs from tuber ilium to tuber femoris, not an osteometric femur.
 * Their normalization by the FH withers mean is a construction transfer to
 * an ox, not measured Kathani anatomy or a paired individual scaling law.
 * All other directions and radii are named construction estimates below.
 *
 * @param withersHeight The admitted instance height in metres, used for lateral inset scaling; all proportions remain anchored to the published reference means.
 * @returns Fresh coarse control data, without segment mass shares or foot material.
 * @throws {RangeError} For a nonpositive or nonfinite instance height.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both cohorts, SI units, external landmarks, mean-ratio transfer and every construction-only quantity; no anatomical ROM or visual result is claimed.
 * @evidence contracts/development/implementation.md#principled-implementation Normalize the source controls by their own cohort height and map the named body landmarks into the shared bar model. The withers sphere reaches exactly the declared height; the head capsule's axial extent follows the face length and circular trunk radius follows girth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the separate body/limb sources and normalize the borrowed controls, then use QuadrupedBodyProfile's one shared geometry mapping; species geometry and tack stay with the producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No horse body, mass law, segment shares, hoof coefficient, measured standing angles or independent trait sampling is substituted. Unknown fourth limb controls and surface mapping are explicit construction estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size scalar arithmetic and two four-component limb records take constant time and space; no mesh generation or geometry search occurs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses immutable-in-type source means and the shared body representation; each call returns fresh arrays and records for its caller.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no query, cache or handle. The returned scalar profile belongs to the caller; unknown mass shares leave uniform-density allocation to the existing body builder.
 */
export function OxBody(
  withersHeight: number = OxBody.MEASURES.withers,
): QuadrupedBody.IBody {
  const m: typeof OxBody.MEASURES = OxBody.MEASURES;
  const limb: typeof OxBody.SEGMENTS = OxBody.SEGMENTS;
  const c: typeof OxBody.CONSTRUCTION = OxBody.CONSTRUCTION;
  const transfer: number = m.withers / limb.withers;
  return QuadrupedBodyProfile({
    measures: {
      withers: m.withers, girth: m.girth, body: m.body,
      neck: limb.neck * transfer, neckRadius: m.headWidth * c.neckRadius,
      head: m.head, headDiameter: m.headWidth, tail: m.tail,
    },
    fore: [limb.fore[0] * transfer, limb.fore[1] * transfer,
      limb.fore[2] * transfer, c.distalLength * m.withers],
    hind: [limb.hind[0] * transfer, limb.hind[1] * transfer,
      limb.hind[2] * transfer, c.distalLength * m.withers],
    construction: c,
    withersHeight,
    colors: { coat: "#aaa398", tail: "#272320" },
  });
}

/**
 * Ox reference measurements and separately named coarse construction choices.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each source record names its cohort and units; construction members state their dimensionless or degree meaning and authored provenance.
 * @evidence contracts/development/design.md#principled-representation Published body and limb means remain separate records; explicit construction parameters describe the remaining rigid-bar interpretation instead of presenting it as measured anatomy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The body function and actual ox producer read these dimensions; the shared rig owns layout and no second skeleton, mass allocator or species branch is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unknown dimension becomes a cited value, no population SD becomes an independent trait band and no female-cohort control transfer is described as an ox measurement.
 */
export namespace OxBody {
  /** Bhagat 2022 Table 2, 2614 working Kathani bullocks; means in metres, mass absent. */
  export const MEASURES: Readonly<{
    /** Ground to withers. */
    withers: number;

    /** Chest circumference. */
    girth: number;

    /** Reported body length; this article does not specify exact landmarks. */
    body: number;

    /** Face length, not cleaned skull length. */
    head: number;

    /** Forehead width. */
    headWidth: number;

    /** Reported tail length. */
    tail: number;

    /** External ear length. */
    ear: number;

    /** Reported horn length, without a curvature measurement. */
    horn: number;
  }> = {
    withers: 1.1932, girth: 1.5061, body: 1.229,
    head: 0.4292, headWidth: 0.1693, tail: 0.9595,
    ear: 0.1903, horn: 0.1757,
  };

  /** Hakim 2019 Table 2 digital FH adult-female means, n = 24, metres; external landmarks, not bones. */
  export const SEGMENTS: Readonly<{
    /** That cohort's withers height, used only to normalize its control lengths. */
    withers: number;

    /** Upper arm, forearm and metacarpal surface-control distances. */
    fore: readonly [number, number, number];

    /** Ilium-to-femoral landmark, femoral-to-calcaneal landmark and distal tarsal-to-phalangeal distance. */
    hind: readonly [number, number, number];

    /** Axis/atlas region to dorsal neck base, not a measured ox neck. */
    neck: number;
  }> = {
    withers: 1.3658, fore: [0.3876, 0.3922, 0.2425],
    hind: [0.4745, 0.4497, 0.2855], neck: 0.3692,
  };

  /** Authored coarse controls, not measurements or anatomical limits. Colors are likewise authored. */
  export const CONSTRUCTION: Readonly<QuadrupedBodyProfile.IConstruction & {
    /** Unmeasured fourth limb bar / withers height. */
    distalLength: number;

    /** Neck cylinder radius / reported forehead width. */
    neckRadius: number;
  }> = {
    withersRadius: 0.05, distalLength: 0.1, pelvisRun: 0.15,
    neckRootDrop: 0.09, neckRadius: 0.65, neckPitch: 10,
    headPitch: 50, tailPitch: 85, tailRadius: 0.012,
    tailDock: 0.5, inset: 0.2,
    forePitch: [-30, 10, 0, 0], hindPitch: [40, -40, 0, 0],
    barRadii: [0.055, 0.033, 0.025, 0.03],
  };
}
