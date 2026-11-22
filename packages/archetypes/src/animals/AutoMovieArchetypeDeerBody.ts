import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { DeerCohorts } from "./DeerCohorts";
import { QuadrupedBodyProfile } from "./QuadrupedBodyProfile";

/**
 * A coarse adult Boso sika body with separately sampled same-sex skeletal controls.
 *
 * Ochiai and Asada 1995, Chiba 3(2):223-232, Tables 1/3, reports October
 * body means for males age 4+ (mass n = 25, other dimensions n = 27) and
 * females age 2+ (mass n = 46, other dimensions n = 51):
 * http://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_03-2_11ochiai.pdf .
 * Their 1997 Chiba 4(2):159-172, Tables 3/7, reports different Boso specimens:
 * males age 5+ (skull n = 25, limbs n = 6) and females age 5+
 * (skull n = 60, limbs n = 7):
 * http://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_04-2_12ochiai.pdf .
 * These share a species and geographic population, not paired individuals,
 * age cutoffs or sample dates. Ratios of the two studies' means define a
 * provisional control prototype, not measured individual allometry.
 *
 * The fourth limb bars, neck, short tail, skin radii and absolute standing
 * directions remain explicitly authored estimates. Head dimensions describe
 * the cleaned skull; using them for a coarse capsule does not recover soft
 * tissue. The producer owns antlers and any authored tack separately.
 *
 * @param withersHeight Admitted instance height in metres; only undefined defaults to its selected reference, while null is invalid.
 * @param cohort Whole adult sex/age reference, male by default; no juvenile transfer is supported.
 * @returns Fresh coarse controls, with unknown segment mass fractions and foot material absent.
 * @throws {RangeError} For a nonpositive or nonfinite instance height.
 * @evidence contracts/development/common.md#meaningful-documentation Names both sex/age-specific body and skeletal samples, true-bone versus tape measures, SI normalization and every unmeasured construction parameter; no visual or ROM result is implied.
 * @evidence contracts/development/implementation.md#principled-implementation Normalize actual bone means by the separate population height reference, retaining that provisional premise. Source body/girth/skull dimensions size the coarse landmarks, and straight-axis projections preserve authored neck/tail lengths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the two source records and supply their explicit normalization to QuadrupedBodyProfile's common geometry mapping; the producer separately adds species-identifying parts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No red-deer, horse or human anatomy is silently substituted for this small sika population; unsupported digit lengths, soft-tissue shape and standing pose remain named estimates and no marginal SD is used as independent trait variation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed scalar arithmetic and two four-element arrays take constant time and storage, with no fitting, mesh queries or iterative solves.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Published reference records serve every call, while returned profile records/arrays are fresh and no completed geometry or pose is replayed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the result. No query or resource is retained; omitted segment shares leave the builder's coarse uniform-density allocation explicit.
 */
export function AutoMovieArchetypeDeerBody(
  withersHeight?: number,
  cohort: AutoMovieArchetypeDeerBody.Cohort = DeerCohorts.DEFAULT,
): AutoMovieArchetypeQuadrupedBody.IBody {
  const m: Readonly<DeerCohorts.IMeasures> | undefined =
    AutoMovieArchetypeDeerBody.REFERENCES[cohort];
  const bone: Readonly<DeerCohorts.ISkeleton> | undefined =
    AutoMovieArchetypeDeerBody.SKELETONS[cohort];
  if (m === undefined || bone === undefined)
    throw new RangeError(`Unknown adult Boso sika reference ${cohort}`);
  const c: typeof AutoMovieArchetypeDeerBody.CONSTRUCTION =
    AutoMovieArchetypeDeerBody.CONSTRUCTION;
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
 * Boso sika reference means and the remaining named construction estimates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Source records retain distinct cohort/sample meanings and SI units; construction member comments identify every estimate's role.
 * @evidence contracts/development/design.md#principled-representation Weighed/tape body measures and actual bone/skull lengths remain separate records, while construction choices supply only what those references do not measure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Current deer construction reads the same closed body representation as other quadrupeds. The producer owns antlers rather than this profile duplicating their geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No inferred withers height is mislabeled an independent measurement, no unknown anatomy or physical coefficient is invented and no published marginal spread becomes a fitted individual relationship.
 */
export namespace AutoMovieArchetypeDeerBody {
  /** The two complete adult external references; juveniles remain unsupported. */
  export type Cohort = DeerCohorts.Name;

  /** Explicit choices and the authored equal-choice seeded palette, not population frequencies. */
  export const COHORTS: readonly Cohort[] = DeerCohorts.NAMES;

  /** Previous male4+ body reference retained by canonical construction. */
  export const MEASURES: Readonly<DeerCohorts.IMeasures> =
    DeerCohorts.MEASURES[DeerCohorts.DEFAULT];

  /** Both sex/age body means from 1995 Table3; mass/tape counts differ. */
  export const REFERENCES: Readonly<
    Record<Cohort, Readonly<DeerCohorts.IMeasures>>
  > = DeerCohorts.MEASURES;

  /** Previous male5+ bone/skull controls, not a paired male4+ individual. */
  export const SKELETON: Readonly<DeerCohorts.ISkeleton> =
    DeerCohorts.SKELETONS[DeerCohorts.DEFAULT];

  /** Same-sex, separate age5+ skeletal samples from 1997 Tables3/7. */
  export const SKELETONS: Readonly<
    Record<Cohort, Readonly<DeerCohorts.ISkeleton>>
  > = DeerCohorts.SKELETONS;

  /** Authored construction parameters for an unmeasured standing soft-tissue proxy; coat colors are authored too. */
  export const CONSTRUCTION: Readonly<
    QuadrupedBodyProfile.IConstruction & {
      /** Unmeasured distal limb control / height. */
      distalLength: number;

      /** Straight neck control length / height. */
      neckLength: number;

      /** Neck radius / height. */
      neckRadius: number;

      /** Short tail length / height. */
      tailLength: number;
    }
  > = {
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
}
