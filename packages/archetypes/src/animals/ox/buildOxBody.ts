import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { QuadrupedBodyProfile } from "../quadruped/QuadrupedBodyProfile";
import { OX_BODY_MEASURES } from "./constants/OX_BODY_MEASURES";

/**
 * A coarse ox control body anchored to the Kathani working-bullock means.
 *
 * Bhagat et al. 2022, Table 2, measured 2614 working bullocks
 * (https://doi.org/10.56093/ijans.v92i10.105090). Their withers, girth, body,
 * face, ear, horn and tail means stay together in MEASURES. The survey supplies
 * no limb lengths, neck dimensions, joint directions or live mass.
 *
 * The separate FH adult-female digital column in Hakim et al. 2019, Table 2
 * (https://doi.org/10.29244/jipthp.7.2.47-56), supplies provisional limb and
 * cervical control proportions. These are live surface landmarks: even its
 * femur row runs from tuber ilium to tuber femoris, not an osteometric femur.
 * Their normalization by the FH withers mean is a construction transfer to an
 * ox, not measured Kathani anatomy or a paired individual scaling law. All
 * other directions and radii are named construction estimates below.
 *
 * @param withersHeight The admitted instance height in metres, used for lateral
 *   inset scaling; all proportions remain anchored to the published reference
 *   means.
 * @returns Fresh coarse control data, without segment mass shares or foot
 *   material.
 * @throws {RangeError} For a nonpositive or nonfinite instance height.
 */
export function buildOxBody(
  withersHeight: number = OX_BODY_MEASURES.withers,
): AutoMovieArchetypeQuadrupedBody.IBody {
  const m: typeof OX_BODY_MEASURES = OX_BODY_MEASURES;
  const limb: typeof SEGMENTS = SEGMENTS;
  const c: typeof CONSTRUCTION = CONSTRUCTION;
  const transfer: number = m.withers / limb.withers;
  return QuadrupedBodyProfile({
    measures: {
      withers: m.withers,
      girth: m.girth,
      body: m.body,
      neck: limb.neck * transfer,
      neckRadius: m.headWidth * c.neckRadius,
      head: m.head,
      headDiameter: m.headWidth,
      tail: m.tail,
    },
    fore: [
      limb.fore[0] * transfer,
      limb.fore[1] * transfer,
      limb.fore[2] * transfer,
      c.distalLength * m.withers,
    ],
    hind: [
      limb.hind[0] * transfer,
      limb.hind[1] * transfer,
      limb.hind[2] * transfer,
      c.distalLength * m.withers,
    ],
    construction: c,
    withersHeight,
    colors: { coat: "#aaa398", tail: "#272320" },
  });
}

/**
 * Hakim 2019 Table 2 digital FH adult-female means, n = 24, metres; external
 * landmarks, not bones.
 */
const SEGMENTS: Readonly<IOxLimbSegments> = {
  withers: 1.3658,
  fore: [0.3876, 0.3922, 0.2425],
  hind: [0.4745, 0.4497, 0.2855],
  neck: 0.3692,
};

interface IOxLimbSegments {
  /** That cohort's withers height, used only to normalize its control lengths. */
  withers: number;

  /** Upper arm, forearm and metacarpal surface-control distances. */
  fore: readonly [number, number, number];

  /**
   * Ilium-to-femoral landmark, femoral-to-calcaneal landmark and distal
   * tarsal-to-phalangeal distance.
   */
  hind: readonly [number, number, number];

  /** Axis/atlas region to dorsal neck base, not a measured ox neck. */
  neck: number;
}

/**
 * Authored coarse controls, not measurements or anatomical limits. Colors are
 * likewise authored.
 */
const CONSTRUCTION: Readonly<IOxConstruction> = {
  withersRadius: 0.05,
  distalLength: 0.1,
  pelvisRun: 0.15,
  neckRootDrop: 0.09,
  neckRadius: 0.65,
  neckPitch: 10,
  headPitch: 50,
  tailPitch: 85,
  tailRadius: 0.012,
  tailDock: 0.5,
  inset: 0.2,
  forePitch: [-30, 10, 0, 0],
  hindPitch: [40, -40, 0, 0],
  barRadii: [0.055, 0.033, 0.025, 0.03],
};

interface IOxConstruction extends QuadrupedBodyProfile.IConstruction {
  /** Unmeasured fourth limb bar / withers height. */
  distalLength: number;

  /** Neck cylinder radius / reported forehead width. */
  neckRadius: number;
}
