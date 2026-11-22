/**
 * Adult Boso sika body references and separately sampled sex-matched skeletons.
 *
 * Ochiai and Asada 1995, Chiba 3(2):223-232, Table 3 (printed p.225),
 * supplies male4+ and female2+ body means. Mass counts are 25 and 46; the
 * corresponding tape-trait counts are 27 and 51. Their 1997 Chiba 4(2):159-172
 * Tables 3/7 instead measure skulls/limbs of ages5+: male skull n25, female
 * skull n60, male limbs n6 and female limbs n7. These are sex-matched controls,
 * not paired individuals or identical age cutoffs. No juvenile model or hard
 * population range is inferred from those grouped observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both study/table sources, sex/age/trait-dependent counts, SI units and the provisional cross-sample use.
 * @evidence contracts/development/design.md#principled-representation Two closed adult references retain whole external body vectors and separate sex-matched skeletal observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieArchetypeDeerBody and createDeer consume these existing physical dimensions and cohort keys; juvenile growth and statistical sampling remain unsupported.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Female controls are not labelled male anatomy, group SD is not a hard bound and no unmeasured paired allometry or cohort frequency is encoded.
 */
export namespace DeerCohorts {
  /**
   * The two source-supported adult body references.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names male4+ and female2+ external body cohorts; skeletal transfer uses older same-sex samples.
   * @evidence contracts/development/design.md#principled-representation A closed union prevents unimplemented juvenile variants or unknown populations from entering construction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by the producer's input, source body lookup and whole-cohort draw.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reference identity is explicit rather than inferred from mass, shape or antler presence.
   */
  export type Name = "boso-adult-male" | "boso-adult-female";

  /**
   * Whole external body means in metres and kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines shoulder height, chest circumference, shoulder-to-rump length and weighed bare mass.
   * @evidence contracts/development/design.md#principled-representation Four required positive scalar observations remain one selected sex/age vector.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only the body traits current model construction consumes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Equipment weight, soft-tissue head dimensions, individual covariance and hard population limits remain absent.
   */
  export interface IMeasures {
    /** Ground to shoulder landmark, metres. */
    withers: number;
    /** Chest circumference, metres. */
    girth: number;
    /** Shoulder-to-rump straight length, metres. */
    body: number;
    /** Published bare body mean, kilograms; excludes authored equipment. */
    mass: number;
  }

  /**
   * Sex-matched skull and limb means of separately sampled adults age5+.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names bone/skull lengths, metre conversion and distinct samples; none is a tape-derived pseudo-bone.
   * @evidence contracts/development/design.md#principled-representation Two fixed three-bone tuples and skull length/breadth preserve the measured traits of each sex.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The coarse body uses these controls; named construction still owns unmeasured neck, distal bars, tail and standing directions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These old-adult skeletal means are explicit provisional transfers to the selected external reference, not paired individual measurements or passive joint limits.
   */
  export interface ISkeleton {
    /** Humerus, radius and metacarpus maximum lengths, metres. */
    fore: readonly [number, number, number];
    /** Femur, tibia and metatarsus maximum lengths, metres. */
    hind: readonly [number, number, number];
    /** Greatest cranium length, metres. */
    head: number;
    /** Greatest breadth across parietal processes, metres. */
    headWidth: number;
  }

  /** Previous male reference, preserved for canonical seedless construction. */
  export const DEFAULT: Name = "boso-adult-male";

  /** Authored equal-choice adult-reference palette, not population sex frequencies. */
  export const NAMES: readonly Name[] = [DEFAULT, "boso-adult-female"];

  /** 1995 Table3 body centimetres converted to metres, weights retained in kilograms. */
  export const MEASURES: Readonly<Record<Name, Readonly<IMeasures>>> = {
    "boso-adult-male": { withers: 0.836, girth: 0.92, body: 0.882, mass: 60.4 },
    "boso-adult-female": {
      withers: 0.74,
      girth: 0.788,
      body: 0.803,
      mass: 39.5,
    },
  };

  /** 1997 Table3 skull and Table7 limb millimetre means converted to metres. */
  export const SKELETONS: Readonly<Record<Name, Readonly<ISkeleton>>> = {
    "boso-adult-male": {
      fore: [0.1995, 0.198, 0.1873],
      hind: [0.2396, 0.278, 0.2143],
      head: 0.2669,
      headWidth: 0.1219,
    },
    "boso-adult-female": {
      fore: [0.1749, 0.1773, 0.1725],
      hind: [0.2141, 0.2424, 0.1981],
      head: 0.2441,
      headWidth: 0.1037,
    },
  };
}
