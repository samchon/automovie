import type { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";

/**
 * Named constants of the trunk construction: how each measure of the column's
 * section runs up it. Fitted by
 * `test/src/executable/human-score/fitTrunkPrior.ts`.
 */
export namespace AutoMovieHumanTrunkPrior {
  /** A size per station: the log per tape read, and a slope in the sex control. */
  export interface ISize {
    /** Log of the size over the tapes read there. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];

    /** Per unit of the log of the tapes read at that station. */
    gain: readonly number[];
  }

  /** The pull at the front per station, a line. */
  export interface IPull {
    /** The pull at no difference between the tapes. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];

    /** Per unit of the log of chest over underbust. */
    bust: readonly number[];
  }

  /** The prior. */
  export interface IPrior {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: AutoMovieHumanLoftParameter.Rule;

    /** Control points of a shoulder section. */
    shoulderOrder: number;

    /** Uniform phases of the shoulders' rings. */
    shoulderSamples: number;

    /** Phase correspondence rule of the shoulders. */
    shoulderRule: AutoMovieHumanLoftParameter.Rule;

    /** Phases on the left where the arm's arc starts and ends. */
    arm: readonly [number, number];

    /** Index in `layers` of the layer the trunk and the shoulders share. */
    joint: number;

    /** Fractions of the column of the layers, the trunk's then the shoulders'. */
    layers: readonly number[];

    /** The arm's lobe at each shoulder layer. */
    lobes: readonly ILobe[];

    /** Fractions of the column where the measures are given. */
    stations: readonly number[];

    /** Per station, the share of the hip, high hip, waist, underbust, chest and neck base tapes. */
    shares: readonly (readonly number[])[];

    /** Half width. */
    width: ISize;

    /** Depth ahead of the widest point. */
    front: ISize;

    /** Depth behind the widest point. */
    back: ISize;

    /** Forward place of the widest point, mm. */
    middle: readonly number[];

    /** Super-ellipse power. */
    power: readonly number[];

    /** Midline pull at the front, a share of the depth. */
    frontPull: IPull;

    /** Midline pull at the back, a share of the depth. */
    backPull: readonly number[];

    /** Half width of the front groove, mm. */
    frontGroove: readonly number[];

    /** Half width of the back groove, mm. */
    backGroove: readonly number[];

    /** The navel's pit. */
    navel: INavel;

    /** The breast's relief. */
    bust: IBust;
  }

  /**
   * The breast as a relief on the column's front: it stands forward by the
   * chest tape's excess over the underbust tape, as a radius, at a share of
   * the bust span from the midline.
   */
  export interface IBust {
    /** Fraction of the column of its apex. */
    station: number;

    /** Half height as a fraction of the column. */
    height: number;

    /** Apex off the midline per unit of the bust span. */
    place: number;

    /** Half width per unit of the bust span. */
    width: number;

    /** Rise per unit of the tapes' excess radius. */
    rise: number;

    /** Its growth per unit of the masculine-feminine control. */
    sex: number;

    /** Softness of the rise at no excess, mm. */
    soft: number;
  }

  /** An arm's lobe across a shoulder layer: an ellipse. */
  export interface ILobe {
    /** Forward place, mm. */
    x: number;

    /** Lateral place: world offset and share of the across-shoulder input. */
    z: readonly number[];

    /** Log of the forward half size over the biceps tape. */
    sizeX: number;

    /** Log of the lateral half size over the biceps tape. */
    sizeZ: number;
  }

  /** A pit on the midline of the belly. */
  export interface INavel {
    /** Fraction of the column. */
    station: number;

    /** Half height as a fraction of the column. */
    height: number;

    /** Half width, mm. */
    width: number;

    /** Depth, mm. */
    depth: number;
  }

  /** The law's constants. */
  export const PRIOR: IPrior = {order: 256,samples: 512,rule: "sagittal",shoulderOrder: 256,shoulderSamples: 512,shoulderRule: "sagittal",arm: [1.133,2.308],joint: 27,layers: [0,0.00355,0.00521,0.01022,0.01855,0.02356,0.03523,0.04822,0.09825,0.14828,0.19832,0.29838,0.34841,0.36508,0.38176,0.39844,0.44847,0.4985,0.54853,0.59856,0.64859,0.66527,0.68194,0.69862,0.7153,0.74233,0.76068,0.78664,0.79069,0.79236,0.79868,0.80904,0.82071,0.83204,0.84871,0.86539,0.89904,0.9327,0.96635,1],lobes: [{x: -21.3891,z: [109.9992,0.3312],sizeX: -1.7759,sizeZ: -1.8522},{x: -21.4205,z: [109.8927,0.3309],sizeX: -1.7731,sizeZ: -1.8543},{x: -21.4346,z: [109.8447,0.3307],sizeX: -1.7719,sizeZ: -1.8552},{x: -21.4955,z: [109.6381,0.3301],sizeX: -1.7666,sizeZ: -1.8586},{x: -21.6226,z: [109.1943,0.3289],sizeX: -1.7559,sizeZ: -1.8641},{x: -21.8115,z: [108.4853,0.3272],sizeX: -1.7401,sizeZ: -1.8702},{x: -22.0416,z: [107.5222,0.3254],sizeX: -1.7208,sizeZ: -1.8756},{x: -22.4437,z: [105.5039,0.3227],sizeX: -1.6871,sizeZ: -1.8822},{x: -22.8644,z: [102.7032,0.3204],sizeX: -1.652,sizeZ: -1.8878},{x: -23.77,z: [92.2914,0.3151],sizeX: -1.6329,sizeZ: -1.926},{x: -25.0776,z: [76.1269,0.3057],sizeX: -1.6933,sizeZ: -2.0121},{x: -26.8439,z: [62.4105,0.2983],sizeX: -1.7681,sizeZ: -2.0954},{x: -29.0907,z: [52.9868,0.2943],sizeX: -1.8454,sizeZ: -2.165}],stations: [0,0.00521,0.02356,0.09825,0.14828,0.19832,0.34841,0.36508,0.39844,0.4985,0.59856,0.66527,0.68194,0.69862,0.7153,0.74233,0.76068,0.78664,0.79868,0.83204,0.88982,0.97591,1],shares: [[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[0.8648,0.1352,0,0,0,0],[0.0168,0.9832,0,0,0,0],[0,1,0,0,0,0],[0,0.8438,0.1562,0,0,0],[0,0,1,0,0,0],[0,0,0.352,0.648,0,0],[0,0,0,1,0,0],[0,0,0,0.8798,0.1202,0],[0,0,0,0.6002,0.3998,0],[0,0,0,0.2828,0.7172,0],[0,0,0,0,1,0],[0,0,0,0,0.9855,0.0145],[0,0,0,0,0.9215,0.0785],[0,0,0,0,0.8774,0.1226],[0,0,0,0,0.7208,0.2792],[0,0,0,0,0.3921,0.6079],[0,0,0,0,0.0246,0.9754],[0,0,0,0,0,1]],width: {level: [-0.2026,-0.205,-0.2184,-0.5676,-0.6722,-0.6982,-0.5067,-0.5542,-0.6669,-0.6623,0.0254,-0.299,-0.3581,-0.4238,-0.4581,-0.331,-0.1161,0.2232,0.3655,0.7432,1.65,3.0641,3.0892],sex: [0.0197,0.0196,0.0195,0.0086,0.002,0.0031,0.0025,0.0002,-0.0056,0.0003,-0.0023,-0.0051,-0.0084,-0.0132,-0.0194,-0.0292,-0.0319,-0.0312,-0.0302,-0.0275,-0.0249,-0.0385,-0.0387],gain: [0.7901,0.7904,0.7921,0.8378,0.8493,0.8527,0.8198,0.8266,0.8444,0.8411,0.7403,0.7942,0.8026,0.8094,0.8109,0.7898,0.7604,0.716,0.698,0.6497,0.5187,0.2971,0.2935]},front: {level: [-5.8005,-5.8015,-5.8068,-5.8671,-5.8592,-5.8075,-5.304,-5.3077,-5.2958,-5.2565,-4.9656,-3.2261,-2.7682,-2.1856,-1.4279,0.0248,0.8781,1.5066,1.5534,1.3723,2.9741,3.2649,2.9769],sex: [0.0782,0.0782,0.0772,-0.0815,-0.0911,-0.0577,-0.1231,-0.135,-0.1657,-0.0607,0.0414,0.0336,0.0342,0.0355,0.0375,0.0404,0.0421,0.0496,0.055,0.0678,0.0383,-0.0046,-0.0081],gain: [1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.4706,1.2142,1.1452,1.0553,0.9406,0.729,0.6088,0.5228,0.5178,0.545,0.2656,0.1171,0.1574]},back: {level: [-1.3857,-1.3848,-1.3844,-2.1939,-2.378,-2.2591,-3.1232,-3.1337,-3.1663,-1.8567,-4.8254,-5.7383,-5.7932,-5.8662,-5.949,-6.0477,-6.0564,-5.984,-5.9145,-5.5535,-4.01,0.1753,0.1341],sex: [0.0118,0.0116,0.0109,0.0097,0.0021,0,0.0445,0.0447,0.0441,-0.0012,-0.0618,-0.0252,-0.0301,-0.0385,-0.0492,-0.0603,-0.0577,-0.05,-0.0475,-0.0426,-0.0417,-0.0357,-0.0324],gain: [0.9009,0.9011,0.9028,1.0417,1.0732,1.0574,1.126,1.1281,1.1373,0.9732,1.3834,1.4971,1.4995,1.4999,1.5,1.5,1.5,1.4999,1.4997,1.49,1.3559,0.7387,0.747]},middle: [38.3013,38.3514,38.6221,48.1774,48.845,47.5579,23.4811,24.4609,27.414,35.4824,3.7945,-18.884,-20.7767,-22.9861,-26.2146,-33.9695,-39.4532,-43.2919,-42.4788,-31.7332,-3.315,8.4144,8.6902],power: [2.5892,2.588,2.5809,2.3071,2.2177,2.2002,2.0646,2.0742,2.0985,2.0405,2.1891,2.1061,2.1357,2.1791,2.2389,2.3918,2.5588,2.8871,3.059,3.5132,3.7936,2.9596,2.7255],frontPull: {level: [1.2222,0.965,0.5694,0,0,0,0,0,-0.0001,-0.071,-0.0175,-0.0034,-0.0037,-0.0032,0.0001,0.0145,0.0269,0.0404,0.0441,0.0461,0.0271,0.047,0.0496],sex: [-0.0138,-0.0111,0.018,0,0,0,0,0,0.0001,0.0795,0.0141,-0.0022,-0.0018,-0.0007,0.0014,0.0061,0.0087,0.0101,0.0103,0.0105,0.0064,0.01,0.0116],bust: [-0.0973,-0.0977,-0.0349,0,0,0,0,0,0.0007,0.5906,0.1971,0.043,0.0631,0.098,0.1421,0.1929,0.1846,0.1346,0.1113,0.0648,-0.0212,0.0436,0.0521]},backPull: [0.5744,0.5661,0.5321,0.1552,0.1054,0.0725,0.0234,0.0259,0.0327,0.107,0.1577,0.154,0.154,0.1552,0.1589,0.174,0.1887,0.2032,0.2036,0.1853,0.1483,0.1073,0.1019],frontGroove: [26.7169,27.2486,29.3184,30.0723,17.6559,15.0285,78.5087,83.9113,93.8852,119.9596,112.5119,18.9111,17.7909,18.6915,20.1819,22.4532,23.1249,23.3218,23.4794,26.3276,55.6342,119.6517,119.9818],backGroove: [17.5108,17.5881,17.8421,15.1123,15.0002,15,15,15,15,15.0115,20.8784,20.8211,21.451,22.1997,23.0381,24.4087,25.2282,26.6079,27.5237,30.9645,33.8796,25.0514,25.0027],navel: {station: 0.3984,height: 0.018,width: 11,depth: 6},bust: {station: 0.74233,height: 0.11,place: 0.31,width: 0.3,rise: 1,sex: 0.13,soft: 3}};
}
