import type { AutoMovieArchetypeQuadrupedBody } from "../../AutoMovieArchetypeQuadrupedBody";
import { QuadrupedBodyProfile } from "../../QuadrupedBodyProfile";
import { DeerCohorts } from "./DeerCohorts";

/**
 * A coarse adult Boso sika body with separately sampled same-sex skeletal
 * controls.
 *
 * Ochiai and Asada 1995, Chiba 3(2):223-232, Tables 1/3, reports October body
 * means for males age 4+ (mass n = 25, other dimensions n = 27) and females age
 * 2+ (mass n = 46, other dimensions n = 51):
 * http://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_03-2_11ochiai.pdf
 * . Their 1997 Chiba 4(2):159-172, Tables 3/7, reports different Boso
 * specimens: males age 5+ (skull n = 25, limbs n = 6) and females age 5+ (skull
 * n = 60, limbs n = 7):
 * http://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_04-2_12ochiai.pdf
 * . These share a species and geographic population, not paired individuals,
 * age cutoffs or sample dates. Ratios of the two studies' means define a
 * provisional control prototype, not measured individual allometry.
 *
 * The fourth limb bars, neck, short tail, skin radii and absolute standing
 * directions remain explicitly authored estimates. Head dimensions describe the
 * cleaned skull; using them for a coarse capsule does not recover soft tissue.
 * The producer owns antlers and any authored tack separately.
 *
 * @param withersHeight Admitted instance height in metres; only undefined
 *   defaults to its selected reference, while null is invalid.
 * @param cohort Whole adult sex/age reference, male by default; no juvenile
 *   transfer is supported.
 * @returns Fresh coarse controls, with unknown segment mass fractions and foot
 *   material absent.
 * @throws {RangeError} For a nonpositive or nonfinite instance height.
 */
export function buildDeerBody(
  withersHeight?: number,
  cohort: DeerCohorts.Name = DeerCohorts.DEFAULT,
): AutoMovieArchetypeQuadrupedBody.IBody {
  const m: Readonly<DeerCohorts.IMeasures> | undefined =
    DeerCohorts.MEASURES[cohort];
  const bone: Readonly<DeerCohorts.ISkeleton> | undefined =
    DeerCohorts.SKELETONS[cohort];
  if (m === undefined || bone === undefined)
    throw new RangeError(`Unknown adult Boso sika reference ${cohort}`);
  const c: typeof CONSTRUCTION = CONSTRUCTION;
  return QuadrupedBodyProfile({
    measures: {
      withers: m.withers,
      girth: m.girth,
      body: m.body,
      neck: c.neckLength * m.withers,
      neckRadius: c.neckRadius * m.withers,
      head: bone.head,
      headDiameter: bone.headWidth,
      tail: c.tailLength * m.withers,
    },
    fore: [
      bone.fore[0],
      bone.fore[1],
      bone.fore[2],
      c.distalLength * m.withers,
    ],
    hind: [
      bone.hind[0],
      bone.hind[1],
      bone.hind[2],
      c.distalLength * m.withers,
    ],
    construction: c,
    withersHeight: withersHeight === undefined ? m.withers : withersHeight,
    colors: { coat: "#96613e", tail: "#dad2bb" },
  });
}

/**
 * Authored construction parameters for an unmeasured standing soft-tissue
 * proxy; coat colors are authored too.
 */
const CONSTRUCTION: Readonly<IDeerConstruction> = {
  withersRadius: 0.045,
  distalLength: 0.11,
  pelvisRun: 0.15,
  neckLength: 0.34,
  neckRadius: 0.06,
  neckRootDrop: 0.1,
  neckPitch: 45,
  headPitch: 35,
  tailLength: 0.1,
  tailPitch: 55,
  tailRadius: 0.009,
  tailDock: 0.5,
  inset: 0.2,
  forePitch: [-25, 10, 0, 0],
  hindPitch: [35, -35, 0, 0],
  barRadii: [0.035, 0.022, 0.014, 0.019],
};

interface IDeerConstruction extends QuadrupedBodyProfile.IConstruction {
  /** Unmeasured distal limb control / height. */
  distalLength: number;

  /** Straight neck control length / height. */
  neckLength: number;

  /** Neck radius / height. */
  neckRadius: number;

  /** Short tail length / height. */
  tailLength: number;
}
