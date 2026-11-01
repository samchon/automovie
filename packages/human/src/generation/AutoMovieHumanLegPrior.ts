/**
 * Named constants of the leg construction, in leg fractions and leg lengths,
 * shared by every person and both sides.
 *
 * Each channel holds one value per station; a natural spline carries it
 * between them. The stations are the ankle, the lower calf, the calf belly,
 * the knee, the thigh and the groin, closer together where the leg changes
 * fastest. Fitted by `test/src/executable/human-score/fitLegPrior.ts`.
 */
export namespace AutoMovieHumanLegPrior {
  /** The crotch's height as a line in four public inputs. */
  export interface ICrotch {
    /** World millimetres. */
    offset: number;

    /** Millimetres per millimetre of stature. */
    height: number;

    /** Millimetres per millimetre of inseam tape. */
    inseam: number;

    /** Millimetres per millimetre of thigh tape. */
    thigh: number;

    /** World millimetres per unit of the masculine-feminine control. */
    sex: number;
  }

  /**
   * The crotch ring is tilted, so its horizontal projection is not a section:
   * the last section of the law sits off that projection by a shared amount.
   */
  export interface IRing {
    /** Section centre ahead of the ring's, in leg lengths. */
    forward: number;

    /** Section centre outside the ring's, in leg lengths. */
    lateral: number;

    /** Section radius per ring radius. */
    ratio: number;
  }

  /** Station of a tape measure and its ratio to the prior section's hull there. */
  export interface ICourse {
    /** Leg fraction of the tape. */
    station: number;

    /** Hull girth at the station per unit of the tape input. */
    ratio: number;
  }

  /** The ankle centre ahead of the origin as a line, world millimetres. */
  export interface IAnkle {
    /** Constant. */
    offset: number;

    /** Per unit of the fat control. */
    fat: number;

    /** Per unit of the muscularity control. */
    muscularity: number;
  }

  /** The axis's place off the midline per station: a constant and three inputs. */
  export interface ILateral {
    /** World millimetres. */
    offset: readonly number[];

    /** Millimetres per millimetre of leg length. */
    leg: readonly number[];

    /** Millimetres per millimetre of hip tape. */
    hip: readonly number[];

    /** World millimetres per unit of the masculine-feminine control. */
    sex: readonly number[];
  }

  /** The prior's channels. */
  export interface IPrior {
    /** Height of the crotch. */
    crotch: ICrotch;

    /** The groin section against the crotch ring's projection. */
    ring: IRing;

    /** Forward place of the ankle centre. */
    ankle: IAnkle;

    /** Leg fractions of the channels, ankle first. */
    stations: readonly number[];

    /** Log of the equivalent radius in leg lengths. */
    profile: readonly number[];

    /** Section centre ahead of the ankle centre, in leg lengths. */
    forward: readonly number[];

    /** Section centre off the midline, as a line. */
    lateral: ILateral;

    /**
     * Area-normalized radial shape of the left leg per station, as the
     * Fourier series `[a0, a1, b1, a2, b2, ...]` of the polar angle from
     * the front toward the outside.
     */
    shape: readonly (readonly number[])[];

    /** Calf tape. */
    calf: ICourse;

    /** Knee tape. */
    knee: ICourse;

    /** Thigh tape. */
    thigh: ICourse;
  }

  /** The law's constants. */
  export const PRIOR: IPrior = {
    crotch: { offset: 1.55245, height: 0.09106, inseam: 0.89836, thigh: -0.02214, sex: -5.73345 },
    ring: { forward: 0.01424, lateral: 0.00731, ratio: 0.94373 },
    ankle: { offset: 2.80246, fat: 3.1084, muscularity: 0.5333 },
    stations: [0, 0.0985, 0.197, 0.27088, 0.33244, 0.394, 0.44325, 0.4925, 0.54175, 0.61562, 0.71413, 0.81262, 0.91113, 0.96037],
    profile: [-3.00493, -2.86194, -2.65839, -2.51331, -2.46821, -2.49751, -2.53807, -2.52477, -2.46906, -2.37095, -2.20026, -2.06766, -1.98422, -1.95237],
    forward: [0, -0.0115, -0.01488, -0.0182, -0.01811, -0.01326, -0.00459, 0.01123, 0.02149, 0.03238, 0.04139, 0.04728, 0.05159, 0.04965],
    lateral: {
      offset: [34.73299, 43.73572, 49.13327, 54.05717, 63.91446, 72.74896, 75.56743, 71.46235, 67.95286, 62.19401, 64.80983, 57.49655, 43.19682, 30.0177],
      leg: [0.052, 0.04026, 0.03159, 0.02452, 0.01537, 0.00179, -0.01099, -0.01626, -0.01085, -0.00018, -0.00011, 0.00129, 0.00863, 0.00955],
      hip: [0.06155, 0.06274, 0.06218, 0.05975, 0.05614, 0.05512, 0.0558, 0.05606, 0.04928, 0.04278, 0.0399, 0.04497, 0.05192, 0.06321],
      sex: [1.82687, 0.4571, -0.25046, -0.91715, -1.21991, -1.75962, -2.10725, -1.87901, -1.55529, 0.19473, 1.12442, 0.72649, 0.71022, 1.96953],
    },
    shape: [
      [0.99076, 0.00334, 0.00547, 0.18076, 0.03585, -0.00714, -0.02781, 0.02083, 0.02068, -0.00899, -0.01815, 0.00266, 0.00397],
      [0.99886, -0.00095, -0.00061, 0.04659, 0.0434, 0.00402, 0.01708, 0.00371, 0.00069, 0.00088, -0.0009, -0.00144, -0.00046],
      [0.99938, -0.00158, 0.00041, 0.00428, 0.0292, 0.01123, 0.03059, 0.00706, 0.0107, 0.00304, 0.00247, 0.00061, -0.00167],
      [0.99888, -0.00243, 0.00125, -0.0041, 0.04642, 0.0185, 0.03316, 0.00591, 0.01297, 0.00369, 0.00491, 0.00043, 0.00055],
      [0.99896, -0.00251, 0.00083, 0.00766, 0.04152, 0.01768, 0.03318, 0.0082, 0.01383, 0.00564, 0.00254, 0.00032, -0.00082],
      [0.99932, -0.00146, 0.00003, 0.02385, 0.02565, 0.01648, 0.02245, 0.00374, 0.007, 0.0008, -0.00204, -0.00096, -0.00186],
      [0.99925, -0.00094, -0.00078, 0.03447, -0.00951, 0.01497, 0.02242, 0.00706, 0.01071, 0.00193, -0.00512, 0.00367, 0.00001],
      [0.99794, -0.00244, -0.00166, 0.0479, -0.01892, 0.04408, 0.0455, 0.02476, 0.00032, -0.00479, -0.00316, 0.00372, -0.00158],
      [0.99727, -0.00551, 0.00069, 0.04313, 0.01645, 0.06995, 0.04159, 0.0277, -0.00034, -0.00588, 0.01218, -0.00082, -0.00974],
      [0.99902, -0.00186, 0.00064, 0.03803, 0.01897, 0.03898, 0.00805, 0.00686, -0.00193, -0.0058, 0.0031, -0.00036, -0.00612],
      [0.99885, -0.00003, 0.00017, 0.05776, 0.02983, 0.00124, -0.00178, -0.00327, -0.00806, -0.00087, -0.00365, 0, -0.00143],
      [0.99849, -0.00101, 0.00023, 0.0413, 0.05716, 0.01094, 0.01039, 0.00188, -0.00043, -0.00033, -0.0007, -0.00103, -0.00137],
      [0.99913, -0.00078, 0.00009, 0.02057, 0.04046, 0.0111, 0.01223, -0.005, 0.00712, -0.00007, 0.00355, 0.00133, 0.00111],
      [0.99927, -0.00014, -0.00025, 0.03819, 0.02446, -0.00561, 0.0057, -0.00161, 0.01173, -0.00275, 0.00353, 0.00106, 0.00326],
    ],
    calf: {station: 0.33244, ratio: 1.02071},
    knee: {station: 0.44325, ratio: 1.00011},
    thigh: {station: 0.86187, ratio: 1.00086},
  };
}
