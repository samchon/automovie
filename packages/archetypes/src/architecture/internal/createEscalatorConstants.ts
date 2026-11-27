/** The reference dimensions and source attributions for the escalator model. */
export namespace createEscalatorConstants {
  /** The planning guide read for every escalator figure below. */
  export const KONE: string =
    "KONE Planning Guide for Escalators & Autowalks, sections 5.3 to 5.12 with their EN 115-1 notes (https://www.kone.co.uk/Images/Escalator%20planning%20guide%20GBIR_tcm45-86614.pdf)";

  /** Construction sizes the guide does not give, provisional. */
  export const ESTIMATE: string =
    "Coarse film-set construction estimate; no source read gives it";

  /**
   * Step pitch along the step band, metres: three horizontal steps are 1200 mm
   * (KONE 5.7).
   */
  export const PITCH: number = 0.4;

  /**
   * Lateral distance from the step's edge to the handrail centre, metres
   * (provisional construction estimate).
   */
  export const RAIL_OFFSET: number = 0.1;

  /**
   * Thickness drawn for landing plates, step runs and treads, metres (provisional
   * construction estimate).
   */
  export const PLATE: number = 0.05;

  /**
   * Depth of each fixed landing plate drawn before a comb, metres (provisional
   * construction estimate).
   */
  export const LANDING: number = 1;
}
