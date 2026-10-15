/**
 * Corrections the trunk's girth fit applies to its sections, each a factor on the value the anatomy gives, 1 when the anatomy alone reproduces the measurement.
 *
 * The fit measures the subdivided surface the way a tape and an anthropometer measure a person, and moves these factors until the chest, underbust, waist, buttock and thigh measurements of the surface match the identity's.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkTune {
  /** Chest section at the chest point. */
  chest: IAutoMovieHumanTrunkTune.ISection;

  /** Rib cage below the breasts and pectorals, at the costal arch. */
  under: IAutoMovieHumanTrunkTune.ISection;

  /** Natural waist section. */
  waist: IAutoMovieHumanTrunkTune.ISection;

  /** Hip and buttock section. */
  hip: IAutoMovieHumanTrunkTune.ISection;

  /** Thigh section at the gluteal furrow. */
  thigh: number;

  /** Breast projection. */
  breast: number;
}
export namespace IAutoMovieHumanTrunkTune {
  /**
   * Factors on one section.
   *
   * @author Samchon
   */
  export interface ISection {
    /** On its half breadth. */
    breadth: number;

    /** On its depth. */
    depth: number;

    /** On its squareness exponent. */
    squareness: number;
  }

  /**
   * The factors that change nothing.
   *
   * @returns A new neutral tune
   */
  export function neutral(): IAutoMovieHumanTrunkTune {
    const section = (): ISection => ({ breadth: 1, depth: 1, squareness: 1 });
    return {
      chest: section(),
      under: section(),
      waist: section(),
      hip: section(),
      thigh: 1,
      breast: 1,
    };
  }
}
