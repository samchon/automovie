import type { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";

/**
 * Published normal-impact measurements, with the counterface and speed retained
 * so a material name cannot silently become a universal constant.
 *
 * Jankowski's specimen tests use a ball and a massive plate of the same
 * material. They do not measure furniture, a fabric bag or an inflated ball.
 * The table records those limits instead of assigning unmeasured materials the
 * former builder-wide coefficient of 0.2.
 */
export namespace AutoMovieArchetypeRestitution {
  /** A primary-source normal restitution measurement for a specified test. */
  export interface IMeasurement {
    /** The impacting material, matching the shared physical surface vocabulary. */
    readonly material: AutoMovieArchetypeMaterial.Kind;

    /** The stationary massive counterface used in the experiment. */
    readonly against: AutoMovieArchetypeMaterial.Kind;

    /** Normal approach speed in metres per second. */
    readonly speed: number;

    /** Smallest and largest measured normal separation/approach speed ratios. */
    readonly range: readonly [number, number];

    /** The tested object and substrate, whose geometry limits transfer. */
    readonly specimen: string;

    /** Primary publication, table and direct reference. */
    readonly source: string;
  }

  /**
   * Measurements at 1 m/s from Robert Jankowski, Journal of Theoretical and
   * Applied Mechanics 45(4), 931–942 (2007), section 3, Tables 1 and 2. A steel
   * ball impacts a massive steel plate, a concrete ball a concrete plate, and a
   * pinewood ball a pinewood plate. Only these three material rows at this
   * speed are included here; the source also reports other speeds and ceramic
   * specimens.
   */
  export const MEASUREMENTS: readonly IMeasurement[] = Object.freeze([
    Object.freeze<IMeasurement>({
      material: "steel",
      against: "steel",
      speed: 1,
      range: Object.freeze([0.514, 0.6239] as const),
      specimen:
        "18G2A steel balls of 21, 50 and 83 mm diameter against a massive plate of the same material",
      source:
        "Jankowski 2007, section 3, Tables 1 and 2 (https://yadda.icm.edu.pl/baztech/element/bwmeta1.element.baztech-article-BWM4-0004-0022/c/httpwww_ptmts_org_pljankowski-4-07.pdf)",
    }),
    Object.freeze<IMeasurement>({
      material: "concrete",
      against: "concrete",
      speed: 1,
      range: Object.freeze([0.5858, 0.5981] as const),
      specimen:
        "C30/37 concrete balls of 103, 114 and 128 mm diameter against a massive plate of the same material",
      source:
        "Jankowski 2007, section 3, Tables 1 and 2 (https://yadda.icm.edu.pl/baztech/element/bwmeta1.element.baztech-article-BWM4-0004-0022/c/httpwww_ptmts_org_pljankowski-4-07.pdf)",
    }),
    Object.freeze<IMeasurement>({
      material: "wood",
      against: "wood",
      speed: 1,
      range: Object.freeze([0.5334, 0.5797] as const),
      specimen:
        "Pinewood balls of 55, 71 and 118 mm diameter against a massive plate of the same material",
      source:
        "Jankowski 2007, section 3, Tables 1 and 2 (https://yadda.icm.edu.pl/baztech/element/bwmeta1.element.baztech-article-BWM4-0004-0022/c/httpwww_ptmts_org_pljankowski-4-07.pdf)",
    }),
  ]);

  /**
   * Find an exact published material-pair and impact-speed measurement.
   *
   * @param material The moving specimen's physical material.
   * @param against The massive stationary counterface's material.
   * @param speed Normal approach speed, metres per second.
   * @returns The immutable source record, or null when this table has no such
   *   test.
   */
  export function measurement(
    material: AutoMovieArchetypeMaterial.Kind,
    against: AutoMovieArchetypeMaterial.Kind,
    speed: number,
  ): IMeasurement | null {
    return (
      MEASUREMENTS.find(
        (row: IMeasurement): boolean =>
          row.material === material &&
          row.against === against &&
          Object.is(row.speed, speed),
      ) ?? null
    );
  }
}
