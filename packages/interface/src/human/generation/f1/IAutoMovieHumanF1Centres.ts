/**
 * Public contracts for registered anatomical courses.
 */
export namespace IAutoMovieHumanF1Centres {
  /**
   * What a course centre is.
   */
  export type Kind = "joint" | "origin" | "datum";

  /**
   * One course centre's inventory row.
   */
  export interface ICentre {
    /** The centre's name in `AutoMovieHumanF1Placing.POINTS`. */
    name: string;
    /** The segment whose frame holds it. */
    frame: string;
    /** Its kind. */
    kind: Kind;
    /** Where f1's value comes from. */
    source: string;
    /** The rule that generates it from joint centres, segment frames and the person's measures. */
    rule: string;
  }

  /**
   * One turn of a course, measured.
   */
  export interface ITurn {
    /** The interior centre's name. */
    centre: string;
    /** The stored half arclength, mm. */
    half: number;
    /** The turn's angle, radians. */
    angle: number;
    /** How far the turn leaves each segment's line before the centre, mm. */
    setback: number;
    /** How far the course stands from the centre at the turn's middle, mm. */
    gap: number;
    /** The station of the turn's middle, mm. */
    station: number;
    /** The mean of the section's four guide reaches at that station, mm; NaN outside the family's knots. */
    radius: number;
  }

  /**
   * How far a course stands from its section and from its bone at one station.
   */
  export interface IOffset {
    /** The station, mm. */
    station: number;
    /** The mean of the four guide extremes in the section chart `[u, v]`, mm from the course point. */
    centroid: [number, number];
    /** The course point's distance to the bone line, mm; null where the family has no bone line or the station lies past its ends. */
    bone: number | null;
  }
}
