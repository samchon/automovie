import { CamelCohorts } from "./CamelCohorts";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedBodyProfile } from "./QuadrupedBodyProfile";

/**
 * A coarse dromedary body from explicit body and limb reference cohorts.
 *
 * Diop et al. 2020, REMVT 73:247-254, measured 131 Mauritanian adult females
 * aged about 7-15 years (https://doi.org/10.19182/remvt.31948). Neck length
 * is larynx to brisket attachment, head length is occipital crest to nose,
 * head breadth is a tape path between ears via the crest, and chest girth
 * excludes the hump. Mapping those surface measures to circular bars is
 * a declared coarse interpretation, not recovered camel anatomy.
 *
 * Mostafa and Khalil 2018 Tables 2-3 supply separate Egyptian external limb
 * controls (https://doi.org/10.5958/2277-8934.2018.00022.X). Their overall
 * sample had 208 camels, 159 males and 49 females; the normal-subgroup size and
 * withers mean are not supplied. Dividing those lengths by Diop's height
 * is an explicitly provisional cross-cohort normalization. Table 5 standing
 * internal joint angles do not determine absolute bar pitches or passive
 * ROM; this profile keeps its authored standing controls separate.
 *
 * The five morphotype means in Diop Table II retain their complete body vector.
 * Egyptian limb controls keep the existing ratios to the 1.847 m pooled
 * reference, uniformly scaled to the selected height as provisional construction.
 * They are not new measurements of that morphotype's limbs.
 *
 * @param withersHeight Admitted instance height in metres, defaulting to the selected reference.
 * @param cohort Whole pooled or classified adult-female reference; pooled by default.
 * @returns Fresh coarse body controls; the actual producer owns the separate hump and tack.
 * @throws {RangeError} For nonpositive or nonfinite instance height.
 * @evidence contracts/development/common.md#meaningful-documentation States every measurement path, separate cohort, cross-cohort normalization, unknown anatomical pose and construction-only quantity; no visual verdict or ROM claim is made.
 * @evidence contracts/development/implementation.md#principled-implementation One selected surface-mean vector gives actual body/neck/head controls. The borrowed Egyptian limb-to-pooled-height ratios are uniformly scaled to its height as an explicit provisional transfer; no group-specific limb measurement is invented. The shared profile preserves the withers apex and complete head extent.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keep body/limb records distinct and supply their normalized data to QuadrupedBodyProfile's common geometry owner; hump generation remains with the producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No horse proportions, mass allocation, hoof material, invented paired allometry or passive limits enter this profile. Source standing angles remain reference data, never disguised as the authored absolute pitches.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and two fixed four-bar arrays; the shared owner's fixed admission scans add no tessellation, fitting, iterative solver or geometry search.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Source means are reused by reference while every returned array and nested profile record is fresh; no completed model or pose is replayed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the result and no query or external handle is retained. Omitted mass shares and foot material preserve their explicit unknown status in the shared builder.
 */
export function CamelBody(
  withersHeight?: number,
  cohort: CamelBody.Cohort = CamelCohorts.DEFAULT,
): QuadrupedBody.IBody {
  const m: Readonly<CamelCohorts.IMeasures> | undefined =
    CamelBody.REFERENCES[cohort];
  if (m === undefined)
    throw new RangeError(`Unknown dromedary reference ${cohort}`);
  const limb: typeof CamelBody.SEGMENTS = CamelBody.SEGMENTS;
  const c: typeof CamelBody.CONSTRUCTION = CamelBody.CONSTRUCTION;
  const scale: number = m.withers / CamelBody.MEASURES.withers;
  return QuadrupedBodyProfile({
    measures: {
      withers: m.withers,
      girth: m.girth,
      body: m.body,
      neck: m.neck,
      neckRadius: m.neckGirth / (2 * Math.PI),
      head: m.head,
      headDiameter: m.headBreadth,
      tail: c.tailLength * m.withers,
    },
    fore: [
      limb.fore[0] * scale,
      limb.fore[1] * scale,
      limb.fore[2] * scale,
      limb.fore[3] * scale,
    ],
    hind: [
      limb.hind[0] * scale,
      limb.hind[1] * scale,
      limb.hind[2] * scale,
      limb.hind[3] * scale,
    ],
    construction: c,
    withersHeight: withersHeight ?? m.withers,
    colors: { coat: "#aa7951", tail: "#664830" },
  });
}

/**
 * Primary body/limb records and explicitly authored dromedary construction controls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each source, cohort, metre/degree unit and construction gap; standing internal angles remain distinct from rigid-bar directions and ROM.
 * @evidence contracts/development/design.md#principled-representation Independent published cohorts are separate records, with named authored choices for the common coarse rig; no statistical covariance or individual allometry is asserted.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The body and actual camel producer read these shape inputs. The existing shared rig remains the only limb layout and the producer separately owns the hump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unknown physical property or trait distribution is invented; source table dispersion inconsistencies are not used as probability bands.
 */
export namespace CamelBody {
  /** Closed whole-reference choices, with the original pooled reference retained. */
  export type Cohort = CamelCohorts.Name;

  /** Every explicit selectable pooled or classified source reference. */
  export const COHORTS: readonly Cohort[] = CamelCohorts.NAMES;

  /** Authored equal-choice seed palette; its frequencies are not population estimates. */
  export const DRAW: readonly Cohort[] = CamelCohorts.DRAW;

  /** Original Diop pooled means for 131 adult females; no mass or tail measure. */
  export const MEASURES: Readonly<CamelCohorts.IMeasures> =
    CamelCohorts.MEASURES[CamelCohorts.DEFAULT];

  /** Whole source vectors; the five morphotype rows come from Table II, p.250. */
  export const REFERENCES: Readonly<
    Record<Cohort, Readonly<CamelCohorts.IMeasures>>
  > = CamelCohorts.MEASURES;

  /** Mostafa/Khalil 2018 Table3, normal external conformation means in metres; no paired height. */
  export const SEGMENTS: Readonly<{
    /** Shoulder-elbow, elbow-carpus, carpus-fetlock and reported fore digit. */
    fore: readonly [number, number, number, number];

    /** Hip-stifle, stifle-tarsal, tarsal-fetlock and reported hind digit. */
    hind: readonly [number, number, number, number];
  }> = {
    fore: [0.3863, 0.5229, 0.2779, 0.1523],
    hind: [0.4534, 0.4683, 0.4192, 0.1337],
  };

  /** Authored rigid-bar interpretation. None of these directions is a measured joint angle. */
  export const CONSTRUCTION: Readonly<
    QuadrupedBodyProfile.IConstruction & {
      /** Unknown tail's authored length / withers height. */
      tailLength: number;
    }
  > = {
    withersRadius: 0.055,
    pelvisRun: 0.15,
    neckRootDrop: 0.12,
    neckPitch: 55,
    headPitch: 20,
    tailLength: 0.3,
    tailPitch: 75,
    tailRadius: 0.009,
    tailDock: 0.5,
    inset: 0.2,
    forePitch: [-15, 10, 0, 0],
    hindPitch: [22, -20, 0, 0],
    barRadii: [0.045, 0.026, 0.018, 0.023],
  };
}
