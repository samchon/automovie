import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";

/** Authored m1 example in the Human parameter units; null measurements remain unknown.
 *
 */
export const m1: IAutoMovieHumanParameters = {
  body: {
    controls: {
      height: {
        value: 1841.8359375,
        pinned: true,
      },
      fat: {
        value: -0.599245548248291,
        pinned: true,
      },
      masculineFeminine: {
        value: -0.9330601692199707,
        pinned: true,
      },
      muscularity: {
        value: 0.3861200213432312,
        pinned: true,
      },
      chest: {
        value: 1029.960708618164,
        pinned: false,
      },
      bustSpan: {
        value: 222.98137664794922,
        pinned: false,
      },
      underbust: {
        value: 934.654541015625,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 382.62561798095703,
        pinned: false,
      },
      neckToWaist: {
        value: 366.0093307495117,
        pinned: false,
      },
      acrossShoulder: {
        value: 357.1936798095703,
        pinned: false,
      },
      shoulderToApex: {
        value: 282.20455169677734,
        pinned: false,
      },
      waist: {
        value: 869.6788024902344,
        pinned: false,
      },
      hip: {
        value: 1068.3586883544922,
        pinned: false,
      },
      highHip: {
        value: 921.9930267333984,
        pinned: false,
      },
      neckBase: {
        value: 388.69434356689453,
        pinned: false,
      },
      neck: {
        value: 411.9615173339844,
        pinned: false,
      },
      neckLength: {
        value: 81.73600196838379,
        pinned: false,
      },
      upperArmLength: {
        value: 368.43692779541016,
        pinned: false,
      },
      lowerArmLength: {
        value: 270.13219833374023,
        pinned: false,
      },
      bicep: {
        value: 367.7124786376953,
        pinned: false,
      },
      elbow: {
        value: 298.21081161499023,
        pinned: false,
      },
      wrist: {
        value: 191.20689392089844,
        pinned: false,
      },
      forearm: {
        value: 297.51611709594727,
        pinned: false,
      },
      inseam: {
        value: 782.9294586181641,
        pinned: false,
      },
      thigh: {
        value: 634.4074249267578,
        pinned: false,
      },
      knee: {
        value: 377.4470901489258,
        pinned: false,
      },
      calf: {
        value: 379.04212951660156,
        pinned: false,
      },
      handCircumference: {
        value: 224.8426055908203,
        pinned: false,
      },
    },
    measurements: {
      height: null,
      chest: null,
      bustSpan: null,
      underbust: null,
      frontInterscyeLength: null,
      neckToWaist: null,
      acrossShoulder: null,
      shoulderToApex: null,
      waist: null,
      hip: null,
      highHip: null,
      neckBase: null,
      neck: null,
      neckLength: null,
      upperArmLength: null,
      lowerArmLength: null,
      bicep: null,
      elbow: null,
      wrist: null,
      forearm: null,
      inseam: null,
      thigh: null,
      knee: null,
      calf: null,
      handCircumference: null,
    },
    diagnostics: {
      rise: null,
      shoulderHeight: null,
    },
  },
  head: {
    length: 168.49408149719238,
    cephalicIndex: 89.36349483823332,
    circumference: 563.0135083475064,
    height: Number("217.22427368164062"),
    faceHeight: 107.21147564812946,
    faceWidth: 138.1856610107695,
    mandibularWidth: 139.78542138528064,
    minimumFrontalWidth: 88.57894286708213,
    mouthOpening: 54,
    mandibularLaterotrusion: 11,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 31,
          palpebralFissureHeight: 8.521728515625,
        },
        right: {
          palpebralFissureLength: 31,
          palpebralFissureHeight: 8.54095458984375,
        },
      },
      intercanthalWidth: 33,
      nose: {
        width: 34.53574180603027,
        height: 43.17291259765625,
        protrusion: 2.7626512989853325,
      },
      mouth: {
        width: 53,
        upperVermilionHeight: 8,
        lowerVermilionHeight: 11,
      },
    },
    earPair: {
      left: {
        length: 62.663421630859375,
        breadth: 31.716914772987366,
        protrusion: 15.434045791625977,
      },
      right: {
        length: 61.67388916015625,
        breadth: 32.948821783065796,
        protrusion: 15.19474983215332,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        palmLength: 85.1440701971472,
        handLength: 162.6834338927915,
        handBreadth: 65.57267261155773,
        thumbLength: 78.53857994926517,
      },
      right: {
        palmLength: 85.14409045954716,
        handLength: 162.6835946560925,
        handBreadth: 65.57266579552402,
        thumbLength: 78.53852960380425,
      },
    },
    feet: {
      left: {
        footLength: 208.63641370887046,
        footBreadth: 106.40079265976524,
        ankleHeight: 92.10582483067942,
      },
      right: {
        footLength: 208.62334778071462,
        footBreadth: 106.33913751781259,
        ankleHeight: 92.14281368230522,
      },
    },
  },
} satisfies IAutoMovieHumanParameters;
