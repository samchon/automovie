/**
 * Named constants of the neck construction: a ring per layer as harmonics, and
 * how its size follows the tapes. Fitted by
 * `test/src/executable/human-score/fitNeckPrior.ts`.
 */
export namespace AutoMovieHumanNeckPrior {
  /** A size per layer. */
  export interface ISize {
    /** Log of the size over the tape read there. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];

    /** Per unit of the log of the tape read there. */
    gain: readonly number[];
  }

  /** A place per layer. */
  export interface IPlace {
    /** Forward place, mm. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];
  }

  /** One layer's ring as harmonics of its phase. */
  export interface IRing {
    /** Forward place over the depth: cosines from the constant term. */
    x: readonly number[];

    /** Lateral place over the width: sines from the first. */
    z: readonly number[];

    /** Height off the ring's mean, mm: cosines from the constant term. */
    y: readonly number[];
  }

  /** The prior. */
  export interface IPrior {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the rings. */
    samples: number;

    /** Half width per layer, from the bottom. */
    width: ISize;

    /** Half depth per layer. */
    depth: ISize;

    /** Forward centre per layer. */
    place: IPlace;

    /** Mean height of each layer off the top layer's, mm. */
    drop: readonly number[];

    /** Normalized ring per layer. */
    rings: readonly IRing[];
  }

  /** The law's constants. */
  export const PRIOR: IPrior = {order: 256,samples: 280,width: {level: [3.8507,2.8046,1.1293,0.1298],sex: [-0.037,-0.037,-0.028,-0.024],gain: [0.212,0.357,0.613,0.78]},depth: {level: [0.7847,-0.824,-2.9067,-4.5175],sex: [-0.025,-0.011,0.008,0.014],gain: [0.581,0.841,1.185,1.46]},place: {level: [-20.6,-23.42,-23.24,-23.1],sex: [0.66,0.07,-0.24,-0.26]},drop: [-20.93,-11.32,-1.2,0],rings: [{x: [0,1.02546,0.01243,-0.05818,0.10917,0.00408,-0.02053,-0.03668,0.00579,0.01319,0.00868,-0.01241,-0.01146,-0.00566,0.00147,-0.00181,-0.0025,-0.0026,-0.0008,-0.00215,-0.00163],z: [0.87015,-0.01927,-0.0801,0.00489,0.02557,0.00823,-0.0122,-0.00699,0.00482,0.00415,-0.00131,-0.00185,0.00128,0.0008,-0.00112,-0.0012,0.0005,0.00076,-0.00006,-0.00052],y: [0,-3.47325,-0.49779,-0.2462,-0.8164,-0.32075,0.26297,0.19236,-0.05139,-0.09319,0.10374,0.11988,0.01865,0.02264,-0.01023,0.00428,0.00538,0.00795,0.02327,0.02074,-0.00544]},{x: [0,0.96249,0.07301,0.03957,0.09117,-0.0311,-0.00657,-0.00188,0.00573,-0.00368,0.0012,-0.00799,-0.00559,-0.00266,-0.00066,-0.00205,-0.00114,-0.00226,-0.00179,-0.00187,-0.00245],z: [0.95155,-0.03987,-0.04772,0.00978,0.00343,0.00442,0.00765,0.00067,-0.00249,-0.00175,0.0003,0.00113,0.00217,0.00027,-0.00097,-0.00004,0.00098,0.00007,-0.00085,-0.00068],y: [0,-3.13702,-1.14276,-0.29432,-0.41765,-0.02805,0.14711,0.09798,0.13402,0.02962,0.0476,0.02824,-0.00907,0.01246,-0.00186,0.03366,-0.00001,0.00165,-0.00645,0.0067,0.01417]},{x: [0,0.91842,0.1341,0.11125,0.06562,-0.02845,0.00119,-0.00608,0.00231,0.00074,-0.00316,-0.00352,-0.00215,-0.00451,-0.00243,0.00025,0.00004,-0.00017,-0.00187,-0.0027,-0.00142],z: [1.00952,-0.04539,-0.00297,0.00306,-0.01059,0.00809,0.0132,0.00109,0.00107,-0.00286,-0.00266,0.00018,0.00139,0.00159,0.00172,0.00003,-0.00111,-0.00086,-0.00069,-0.00021],y: [0,-2.54827,-1.31769,-0.13952,-0.09962,0.16703,0.22222,0.11522,0.11979,0.06379,0.01536,0.0281,-0.01915,0.01622,0.01285,0.0088,-0.01168,0.00337,-0.00175,0.01158,0.00056]},{x: [0,0.91175,0.14099,0.11901,0.06315,-0.02641,0.00115,-0.00769,0.00198,0.00139,-0.00296,-0.00264,-0.0026,-0.00437,-0.00234,0.00015,0.00041,-0.00008,-0.00185,-0.00249,-0.00155],z: [1.01697,-0.04507,0.00339,0.00143,-0.01153,0.00896,0.01297,0.00133,0.00185,-0.00339,-0.00277,-0.00006,0.00109,0.00211,0.0017,-0.00002,-0.00118,-0.0011,-0.00047,-0.00023],y: [0,-2.48082,-1.30451,-0.10608,-0.08502,0.17191,0.24878,0.1249,0.10112,0.0601,0.01558,0.03011,-0.02383,0.02336,0.01949,0.00203,-0.01593,0.00603,0.00727,0.01311,-0.0054]}]};
}
