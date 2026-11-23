import type {
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanRacket,
} from "@automovie/interface";

/**
 * Film-scale preparation, support and stroke variants for the court skills. The
 * phase ordering follows the observations linked below. All dimensions and
 * timings here are provisional staging values.
 */
export namespace CourtStrokeProfiles {
  /** Volleyball cases owned by the court-stroke planner. */
  export type VolleyballKind = Extract<
    IAutoMovieMotionHumanBallSport.Kind,
    `volleyball${string}`
  >;

  /** A court attack or reception with either the hand or a held racket. */
  export type Kind = IAutoMovieMotionHumanRacket.Stroke | VolleyballKind;

  /**
   * A vector in x toward the racket or hitting side, y up, z forward. Reaches,
   * drives and tool axes use the same signed frame.
   */
  export type Offset = readonly [number, number, number];

  /**
   * A stance and stroke profile in the performer's entry heading. Step and
   * crouch scale by stature, and reaches and swing travel by arm length.
   */
  export interface IProfile {
    /**
     * Lead-foot step from its entry placement, hitting-side and forward shares
     * of stature.
     */
    readonly step: readonly [number, number];
    /** Whether the foot taking the step is on the hitting side. */
    readonly sameFoot: boolean;
    /** Drop of the root at maximum loading, as a share of stature. */
    readonly sink: number;
    /** Heading, chest turn and pitch at preparation, in degrees. */
    readonly chamber: Offset;
    /** Heading, chest turn and pitch at strike, in degrees. */
    readonly hit: Offset;
    /** Striking hand's position relative to the shoulder centre. */
    readonly reach: Offset;
    /** Stroke travel direction and amplitude through the striking instant. */
    readonly drive: Offset;
    /**
     * Optional settled wrist offset in arm lengths from the shoulder centre at
     * follow-through end.
     */
    readonly finish?: Offset;
    /**
     * Off hand's preparation offset from its shoulder, or from the shoulder
     * centre for paired contact.
     */
    readonly balance: Offset;
    /** Facing direction of the palm or racket face at contact. */
    readonly face: Offset;
    /**
     * Racket's longitudinal direction at contact, orthogonalized against the
     * face normal by the planner.
     */
    readonly axis: Offset;
    /**
     * Takeoff to landing in seconds at 1.75 m stature, zero for a planted
     * stroke.
     */
    readonly air: number;
    /** Seconds to prepare, strike and recover at 1.75 m stature. */
    readonly beats: readonly [number, number, number];
    /** Bilateral palm contacts for overhead set and block. */
    readonly paired?: boolean;
  }

  /**
   * Reference movements include volleyball approach and countermovement (Tilp,
   * Wagner and Müller, doi:10.1080/14763140802233231), tennis serve leg and
   * shoulder coordination (Reid et al., PMID 18202570), forehand pelvis and
   * trunk timing (Landlinger et al., PMID 24149792), badminton forecourt
   * lunging (doi:10.3390/bioengineering11050501), table tennis transfer
   * (doi:10.1080/17461391.2018.1534993), squash forward lunging
   * (https://ojs.srce.hr/index.php/kinesiology/article/view/5703), and padel
   * wall returns (doi:10.3390/ijerph17217838).
   */
  export const VALUES: Readonly<Record<Kind, IProfile>> = {
    tennisServe: {
      step: [0, 0],
      sameFoot: false,
      sink: 0.055,
      chamber: [26, 22, -12],
      hit: [-7, -15, 6],
      reach: [0.4, 0.63, 0.35],
      drive: [-0.14, -0.19, 0.39],
      balance: [-0.3, 0.78, 0.36],
      face: [0, -0.1, 1],
      axis: [0.22, 1, 0.1],
      air: 0.23,
      beats: [0.6, 0.2, 0.48],
    },
    tennisForehand: {
      step: [0.17, 0.09],
      sameFoot: true,
      sink: 0.049,
      chamber: [22, 27, 5],
      hit: [-3, -14, 9],
      reach: [0.61, -0.23, 0.59],
      drive: [-0.47, 0.18, 0.62],
      finish: [0.27, 0.1, 0.38],
      balance: [-0.32, 0, 0.55],
      face: [0, -0.06, 1],
      axis: [1, 0.18, 0.06],
      air: 0,
      beats: [0.36, 0.25, 0.44],
    },
    tennisBackhand: {
      step: [-0.1, 0.13],
      sameFoot: true,
      sink: 0.04,
      chamber: [-29, -24, 7],
      hit: [3, 15, 4],
      reach: [-0.22, -0.17, 0.48],
      drive: [0.26, 0.15, 0.44],
      balance: [-0.34, -0.08, -0.21],
      face: [0, -0.03, 1],
      axis: [-1, 0.25, 0.03],
      air: 0,
      beats: [0.4, 0.25, 0.44],
    },
    tennisVolley: {
      step: [-0.055, 0.19],
      sameFoot: false,
      sink: 0.028,
      chamber: [8, 12, 7],
      hit: [0, -3, 10],
      reach: [0.49, 0.03, 0.65],
      drive: [-0.09, -0.04, 0.24],
      balance: [-0.39, -0.07, 0.34],
      face: [0, 0.13, 1],
      axis: [0.75, 0.65, -0.08],
      air: 0,
      beats: [0.23, 0.13, 0.28],
    },
    badmintonLunge: {
      step: [0.085, 0.28],
      sameFoot: true,
      sink: 0.088,
      chamber: [8, 10, 12],
      hit: [0, -3, 20],
      reach: [0.5, -0.35, 0.63],
      drive: [0.02, 0.24, 0.18],
      balance: [-0.32, -0.11, -0.42],
      face: [0, 0.37, 1],
      axis: [0.36, 0.52, -0.16],
      air: 0,
      beats: [0.35, 0.13, 0.32],
    },
    badmintonClear: {
      step: [0.09, -0.16],
      sameFoot: true,
      sink: 0.037,
      chamber: [25, 24, -8],
      hit: [-9, -13, 7],
      reach: [0.46, 0.62, 0.29],
      drive: [-0.17, 0.15, 0.4],
      balance: [-0.18, 0.56, 0.55],
      face: [0, 0.19, 1],
      axis: [0.16, 1, 0],
      air: 0,
      beats: [0.44, 0.2, 0.35],
    },
    tableTennisTopspin: {
      step: [0.12, 0.02],
      sameFoot: true,
      sink: 0.065,
      chamber: [17, 20, 14],
      hit: [-7, -11, 11],
      reach: [0.47, -0.28, 0.47],
      drive: [-0.22, 0.37, 0.31],
      balance: [-0.32, -0.18, 0.39],
      face: [0, -0.24, 1],
      axis: [0.95, 0.37, 0],
      air: 0,
      beats: [0.24, 0.15, 0.27],
    },
    squashDrive: {
      step: [0.15, 0.24],
      sameFoot: true,
      sink: 0.079,
      chamber: [21, 23, 14],
      hit: [-4, -7, 20],
      reach: [0.54, -0.42, 0.53],
      drive: [-0.25, 0.08, 0.54],
      balance: [-0.44, -0.16, -0.31],
      face: [0, 0.12, 1],
      axis: [1, 0.07, -0.1],
      air: 0,
      beats: [0.36, 0.19, 0.37],
    },
    padelGlassReturn: {
      step: [0.12, -0.16],
      sameFoot: true,
      sink: 0.047,
      chamber: [40, 19, 7],
      hit: [-9, -13, 10],
      reach: [0.5, -0.24, 0.42],
      drive: [-0.2, 0.19, 0.32],
      balance: [-0.43, -0.03, -0.15],
      face: [0, 0.15, 1],
      axis: [0.65, 0.4, 0],
      air: 0,
      beats: [0.4, 0.18, 0.36],
    },
    volleyballServe: {
      step: [-0.03, 0.16],
      sameFoot: false,
      sink: 0.033,
      chamber: [19, 21, -9],
      hit: [-6, -12, 8],
      reach: [0.43, 0.59, 0.41],
      drive: [-0.15, -0.26, 0.43],
      balance: [-0.29, 0.34, 0.6],
      face: [0, 0.11, 1],
      axis: [0, 1, 0],
      air: 0,
      beats: [0.5, 0.22, 0.38],
    },
    volleyballSpike: {
      step: [0.02, 0.17],
      sameFoot: false,
      sink: 0.091,
      chamber: [17, 20, -9],
      hit: [-9, -19, 12],
      reach: [0.42, 0.61, 0.32],
      drive: [-0.12, -0.19, 0.44],
      balance: [-0.39, 0.57, 0.25],
      face: [0, -0.29, 1],
      axis: [0, 1, 0],
      air: 0.55,
      beats: [0.38, 0.3, 0.54],
    },
    volleyballBlock: {
      step: [0.13, 0.04],
      sameFoot: true,
      sink: 0.061,
      chamber: [2, 0, 8],
      hit: [0, 0, 1],
      reach: [0.31, 0.66, 0.3],
      drive: [0, 0.24, 0.2],
      balance: [-0.32, 0.66, 0.3],
      face: [0, 0.05, 1],
      axis: [0, 1, 0],
      air: 0.43,
      beats: [0.32, 0.24, 0.45],
      paired: true,
    },
    volleyballReceive: {
      step: [0.12, 0.1],
      sameFoot: true,
      sink: 0.088,
      chamber: [6, 0, 21],
      hit: [0, -3, 18],
      reach: [0.055, -0.56, 0.61],
      drive: [0, 0.11, 0.1],
      balance: [-0.055, -0.56, 0.61],
      face: [0, 1, 0.28],
      axis: [0, -0.51, 1],
      air: 0,
      beats: [0.32, 0.14, 0.35],
      paired: true,
    },
    volleyballSet: {
      step: [0.025, 0.09],
      sameFoot: true,
      sink: 0.048,
      chamber: [3, 0, 4],
      hit: [0, 0, -3],
      reach: [0.12, 0.57, 0.31],
      drive: [0, 0.26, 0.09],
      balance: [-0.12, 0.57, 0.31],
      face: [0, 1, 0.23],
      axis: [0, 0.25, 1],
      air: 0,
      beats: [0.3, 0.21, 0.35],
      paired: true,
    },
  };
}
