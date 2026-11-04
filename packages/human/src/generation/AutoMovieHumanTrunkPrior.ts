import type { AutoMovieLoftParameter } from "@automovie/engine";

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

    /** Per unit of the fat control, the tapes held. */
    fat: readonly number[];

    /** Per unit of the muscularity control, the tapes held. */
    muscularity: readonly number[];
  }

  /** The prior. */
  export interface IPrior {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: AutoMovieLoftParameter.Rule;

    /** Control points of a shoulder section. */
    shoulderOrder: number;

    /** Uniform phases of the shoulders' rings. */
    shoulderSamples: number;

    /** Phase correspondence rule of the shoulders. */
    shoulderRule: AutoMovieLoftParameter.Rule;

    /** Phases on the left where the arm's arc starts and ends. */
    arm: readonly [number, number];

    /** Index in `layers` of the layer the trunk and the shoulders share. */
    joint: number;

    /** Fractions of the column of the layers, the trunk's then the shoulders'. */
    layers: readonly number[];

    /** The arm's lobe at each shoulder layer. */
    lobes: readonly ILobe[];

    /** Hull girth of a section per unit of the hip, high hip, waist, underbust and chest tapes. */
    closure: readonly number[];

    /** The domain's mean of the lengths the column reads as departures from it. */
    bodyLengths: IBodyLengths;

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

    /** The rear line from the gluteal fold to the upper back. */
    seat: ISeat;
  }

  /**
   * The rear under the lumbar, as means of horizontal cuts of 52 reference
   * people inside the domain. Under the crest the rear falls as the square of
   * the height: the fall over 100 mm stands 2.78 times that over 60 mm, and
   * (100/60)^2 is 2.78. That fall follows the section's own share across the
   * hip, so a move of the rear's depth carries it.
   *
   * The heights take no line in the inputs: their left-out errors exceed their
   * spread between people. They stay shared means, and a person's own crest
   * height is not predicted.
   */
  export interface ISeat {
    /** Height of the buttock's crest over the crotch, a share of the stature. */
    crest: number;

    /** The crest's place behind the origin, per unit of the hip tape. */
    depth: number;

    /** Fall of the rear per unit of the hip tape and of the squared height off the crest in statures. */
    bend: number;

    /** Height of the lumbar over the crotch, a share of the stature. */
    lumbar: number;
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

  /** Lengths along the front of the torso, mm. */
  export interface IBodyLengths {
    /** Shoulder to bust apex. */
    shoulderToApex: number;

    /** Neck to waist. */
    neckToWaist: number;

    /** Front interscye length. */
    frontInterscyeLength: number;
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
  export const PRIOR: IPrior = {order: 256,samples: 512,rule: "sagittal",shoulderOrder: 256,shoulderSamples: 512,shoulderRule: "sagittal",arm: [1.133,2.308],joint: 45,layers: [0,0.00355,0.00521,0.01022,0.01855,0.02356,0.03187,0.04019,0.0485,0.05682,0.06513,0.07345,0.08176,0.09008,0.09839,0.10671,0.11502,0.12334,0.13165,0.13997,0.14828,0.19832,0.29838,0.34841,0.36508,0.38176,0.39,0.39844,0.406,0.414,0.424,0.436,0.44847,0.4985,0.54853,0.59856,0.64859,0.66527,0.68194,0.69862,0.7153,0.74233,0.76068,0.77469,0.78092,0.78664,0.79069,0.79236,0.79868,0.80904,0.82071,0.83204,0.84871,0.86539,0.89904,0.9327,0.96635,1],lobes: [{x: -21.3891,z: [109.9992,0.3312],sizeX: -1.7759,sizeZ: -1.8522},{x: -21.4205,z: [109.8927,0.3309],sizeX: -1.7731,sizeZ: -1.8543},{x: -21.4346,z: [109.8447,0.3307],sizeX: -1.7719,sizeZ: -1.8552},{x: -21.4955,z: [109.6381,0.3301],sizeX: -1.7666,sizeZ: -1.8586},{x: -21.6226,z: [109.1943,0.3289],sizeX: -1.7559,sizeZ: -1.8641},{x: -21.8115,z: [108.4853,0.3272],sizeX: -1.7401,sizeZ: -1.8702},{x: -22.0416,z: [107.5222,0.3254],sizeX: -1.7208,sizeZ: -1.8756},{x: -22.4437,z: [105.5039,0.3227],sizeX: -1.6871,sizeZ: -1.8822},{x: -22.8644,z: [102.7032,0.3204],sizeX: -1.652,sizeZ: -1.8878},{x: -23.77,z: [92.2914,0.3151],sizeX: -1.6329,sizeZ: -1.926},{x: -25.0776,z: [76.1269,0.3057],sizeX: -1.6933,sizeZ: -2.0121},{x: -26.8439,z: [62.4105,0.2983],sizeX: -1.7681,sizeZ: -2.0954},{x: -29.0907,z: [52.9868,0.2943],sizeX: -1.8454,sizeZ: -2.165}],closure: [0.9969,0.9822,1.0112,1.0254,1.0047],bodyLengths: {shoulderToApex: 272.8,neckToWaist: 356.3,frontInterscyeLength: 358},stations: [0,0.00521,0.02356,0.09825,0.14828,0.19832,0.34841,0.36508,0.39844,0.4985,0.59856,0.66527,0.68194,0.69862,0.7153,0.74233,0.76068,0.78664,0.79868,0.83204,0.88982,0.97591,1],shares: [[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[1,0,0,0,0,0],[0.8648,0.1352,0,0,0,0],[0.0168,0.9832,0,0,0,0],[0,1,0,0,0,0],[0,0.8438,0.1562,0,0,0],[0,0,1,0,0,0],[0,0,0.352,0.648,0,0],[0,0,0,1,0,0],[0,0,0,0.8798,0.1202,0],[0,0,0,0.6002,0.3998,0],[0,0,0,0.2828,0.7172,0],[0,0,0,0,1,0],[0,0,0,0,0.9855,0.0145],[0,0,0,0,0.9215,0.0785],[0,0,0,0,0.8774,0.1226],[0,0,0,0,0.7208,0.2792],[0,0,0,0,0.3921,0.6079],[0,0,0,0,0.0246,0.9754],[0,0,0,0,0,1]],width: {level: [-0.6863,-0.6872,-0.6907,-0.7332,-0.6717,-0.7602,-0.4908,-0.6034,-0.9145,-0.7183,-0.5691,-0.9155,-1.0391,-1.1739,-1.2697,-1.2168,-1.0466,-0.732,-0.5583,0.1565,2.8866,4.6025,4.61],sex: [0.0204,0.0204,0.0204,0.0147,0.0112,0.0135,0.0104,0.0081,0.0024,0.0044,0.0178,0.0052,0.0013,-0.0043,-0.0119,-0.0237,-0.0265,-0.0246,-0.0234,-0.0232,-0.0436,-0.0653,-0.0654],gain: [0.8595,0.8596,0.8599,0.8623,0.8504,0.8629,0.8185,0.8347,0.8813,0.8498,0.8291,0.8847,0.9022,0.9184,0.928,0.9168,0.8941,0.8546,0.8329,0.7372,0.3245,0.0429,0.0413],fat: [-0.0087,-0.0087,-0.0083,0.0023,0.0083,0.0081,0.0077,0.0054,-0.0015,0.0009,-0.0071,-0.017,-0.0199,-0.023,-0.0261,-0.0297,-0.0307,-0.0296,-0.028,-0.018,0.0256,0.0486,0.0487],muscularity: [-0.0149,-0.0149,-0.0151,-0.02,-0.0233,-0.0274,-0.0187,-0.019,-0.0195,-0.0086,-0.0341,-0.0159,-0.0153,-0.0147,-0.0137,-0.0124,-0.0131,-0.015,-0.0149,-0.009,0.023,0.0413,0.0414]},front: {level: [-5.7967,-5.7959,-5.7804,-3.9012,-3.3266,-3.8295,-5.2957,-5.2996,-5.2887,-5.234,-4.2965,-1.1751,-0.2939,0.7946,2.0217,3.6331,4.1609,4.3639,4.3209,4.04,4.5332,2.4544,1.9583],sex: [0.0778,0.0783,0.0791,-0.0419,-0.0397,-0.0164,-0.1238,-0.1333,-0.1575,-0.0486,0.0256,0.0014,-0.002,-0.0053,-0.008,-0.0116,-0.0142,-0.0121,-0.0077,0.0071,-0.0244,0.0135,0.0128],gain: [1.4998,1.4996,1.4969,1.2239,1.1448,1.223,1.5,1.5,1.5,1.4998,1.3716,0.9133,0.783,0.6212,0.4408,0.2078,0.1326,0.1034,0.1088,0.1423,0.0228,0.2517,0.3268],fat: [0.0121,0.0128,0.0162,0.0936,0.1321,0.124,0.0194,0.0166,0.0079,0.0316,0.0159,0.0578,0.0695,0.0826,0.0932,0.0889,0.0731,0.0531,0.0473,0.0424,0.0798,-0.0203,-0.029],muscularity: [0.0186,0.0181,0.0157,-0.0179,-0.0118,0.0001,0.0048,-0.0013,-0.0186,-0.0347,0.0232,0.0504,0.0606,0.0739,0.0899,0.1146,0.1262,0.1339,0.1331,0.117,0.0822,-0.0304,-0.0342]},back: {level: [-1.7278,-1.7403,-1.7979,-3.0009,-3.0465,-2.4661,-3.8837,-3.9827,-4.283,-1.5154,-3.7166,-5.0663,-5.3487,-5.6136,-5.8266,-6.0026,-6.0119,-5.9305,-5.8517,-5.1353,0.9729,3.8008,3.6564],sex: [-0.0099,-0.0102,-0.0117,-0.0137,-0.0193,-0.0169,0.0438,0.044,0.0437,-0.0268,-0.0907,-0.0266,-0.0236,-0.0228,-0.0226,-0.0139,0.0012,0.0185,0.0198,-0.0018,-0.1036,-0.0868,-0.0818],gain: [0.9472,0.9493,0.9592,1.1544,1.1663,1.085,1.2359,1.2508,1.2991,0.9202,1.2191,1.4014,1.4374,1.4661,1.4855,1.4982,1.4997,1.4996,1.4981,1.4337,0.5756,0.1416,0.1649],fat: [-0.026,-0.0264,-0.0283,-0.0366,-0.0321,-0.0193,-0.0263,-0.0298,-0.0402,-0.0057,0.0249,0.0499,0.0417,0.0326,0.0263,0.0313,0.0423,0.0539,0.0559,0.0606,0.1229,0.1302,0.1287],muscularity: [0.0453,0.0455,0.0461,0.0372,0.0359,0.0371,-0.0014,-0.0012,-0.0007,0.0534,0.0441,-0.0107,-0.0238,-0.0398,-0.0601,-0.1001,-0.126,-0.1458,-0.1431,-0.0925,0.0655,0.0728,0.0709]},middle: [38.3013,38.3514,38.6221,48.1774,48.845,47.5579,23.4811,24.4609,27.414,35.4824,3.7945,-18.884,-20.7767,-22.9861,-26.2146,-33.9695,-39.4532,-43.2919,-42.4788,-31.7332,-3.315,8.4144,8.6902],power: [2.5892,2.588,2.5809,2.3071,2.2177,2.2002,2.0646,2.0742,2.0985,2.0405,2.1891,2.1061,2.1357,2.1791,2.2389,2.3918,2.5588,2.8871,3.059,3.5132,3.7936,2.9596,2.7255],frontPull: {level: [1.2222,0.965,0.5694,0,0,0,0,0,-0.0001,-0.071,-0.0175,-0.0034,-0.0037,-0.0032,0.0001,0.0145,0.0269,0.0404,0.0441,0.0461,0.0271,0.047,0.0496],sex: [-0.0138,-0.0111,0.018,0,0,0,0,0,0.0001,0.0795,0.0141,-0.0022,-0.0018,-0.0007,0.0014,0.0061,0.0087,0.0101,0.0103,0.0105,0.0064,0.01,0.0116],bust: [-0.0973,-0.0977,-0.0349,0,0,0,0,0,0.0007,0.5906,0.1971,0.043,0.0631,0.098,0.1421,0.1929,0.1846,0.1346,0.1113,0.0648,-0.0212,0.0436,0.0521]},backPull: [0.5744,0.5661,0.5321,0.1552,0.1054,0.0725,0.0234,0.0259,0.0327,0.107,0.1577,0.154,0.154,0.1552,0.1589,0.174,0.1887,0.2032,0.2036,0.1853,0.1483,0.1073,0.1019],frontGroove: [26.7169,27.2486,29.3184,30.0723,17.6559,15.0285,78.5087,83.9113,93.8852,119.9596,112.5119,18.9111,17.7909,18.6915,20.1819,22.4532,23.1249,23.3218,23.4794,26.3276,55.6342,119.6517,119.9818],backGroove: [17.5108,17.5881,17.8421,15.1123,15.0002,15,15,15,15,15.0115,20.8784,20.8211,21.451,22.1997,23.0381,24.4087,25.2282,26.6079,27.5237,30.9645,33.8796,25.0514,25.0027],navel: {station: 0.3984,height: 0.018,width: 11,depth: 6},bust: {station: 0.74233,height: 0.11,place: 0.31,width: 0.3,rise: 1,sex: 0.13,soft: 3},seat: {crest: 0.0549,depth: 0.1083,bend: 9.85,lumbar: 0.1617}};
}
