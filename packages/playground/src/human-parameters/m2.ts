import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored m2 example in the Human parameter units; null measurements remain unknown.
 *
 * `head` transcribes the authored clinical-dimension request in `test/.shots/m2/head.json`.
 * It records requested dimensions, not achieved clinical measurements.
 * Surface proxies and residuals stay in `test/.shots/m2/head-application.json`;
 * they do not replace the requested clinical fields.
 *
 * `appearance` transcribes the reference's requested appearance, `test/.shots/m2/appearance.json`,
 * field for field: `skin.{oiliness, wrinkles, seed}`, `hair.{style, color, length, curl, hairline}`,
 * `browPair.<side>.color`, `lashPair.<side>.{color, length}` and `underwear.{bottom, top, color}` keep
 * the same names, units (millimetres, dimensionless 0 to 1, uint32 seed) and closed-choice values;
 * the reference stores the choices as their serialized strings, which are these enum members' values.
 * The request has no freckle or acne entry, so those optional fields stay absent, and it states no
 * pigmentation or iris colour, so `pigmentation` stays absent rather than invented.
 */
export const m2: IAutoMovieHumanParameters = {
  body: {
    controls: {
      height: {
        value: 1856.9737243652344,
        pinned: true,
      },
      fat: {
        value: -0.5832067131996155,
        pinned: true,
      },
      masculineFeminine: {
        value: -0.8181820511817932,
        pinned: true,
      },
      muscularity: {
        value: 0.3070158362388611,
        pinned: true,
      },
      chest: {
        value: 1126.5807342529297,
        pinned: false,
      },
      bustSpan: {
        value: 246.2342071533203,
        pinned: false,
      },
      underbust: {
        value: 1006.9091796875,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 400.17303466796875,
        pinned: false,
      },
      neckToWaist: {
        value: 377.90287017822266,
        pinned: false,
      },
      acrossShoulder: {
        value: 377.3447799682617,
        pinned: false,
      },
      shoulderToApex: {
        value: 303.3722686767578,
        pinned: false,
      },
      waist: {
        value: 903.441162109375,
        pinned: false,
      },
      hip: {
        value: 1094.142074584961,
        pinned: false,
      },
      highHip: {
        value: 969.7705841064453,
        pinned: false,
      },
      neckBase: {
        value: 455.6153106689453,
        pinned: false,
      },
      neck: {
        value: 422.6400375366211,
        pinned: false,
      },
      neckLength: {
        value: 75.89990615844727,
        pinned: false,
      },
      upperArmLength: {
        value: 371.8878173828125,
        pinned: false,
      },
      lowerArmLength: {
        value: 276.3052558898926,
        pinned: false,
      },
      bicep: {
        value: 377.82127380371094,
        pinned: false,
      },
      elbow: {
        value: 299.7189521789551,
        pinned: false,
      },
      wrist: {
        value: 186.31258010864258,
        pinned: false,
      },
      forearm: {
        value: 299.83781814575195,
        pinned: false,
      },
      inseam: {
        value: 792.3451232910156,
        pinned: false,
      },
      thigh: {
        value: 611.2964248657227,
        pinned: false,
      },
      knee: {
        value: 378.81011962890625,
        pinned: false,
      },
      calf: {
        value: 412.2428512573242,
        pinned: false,
      },
      handCircumference: {
        value: 230.93168258666992,
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
    length: 200,
    cephalicIndex: 78,
    circumference: 585,
    height: 248,
    faceHeight: 123,
    faceWidth: 145,
    mandibularWidth: 119,
    minimumFrontalWidth: 114,
    mouthOpening: 54,
    mandibularLaterotrusion: 11,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 33,
          palpebralFissureHeight: 12
        },
        right: {
          palpebralFissureLength: 33,
          palpebralFissureHeight: 12
        }
      },
      intercanthalWidth: 33,
      nose: {
        width: 34,
        height: 56,
        protrusion: 24
      },
      mouth: {
        width: 58,
        upperVermilionHeight: 6,
        lowerVermilionHeight: 9
      }
    },
    earPair: {
      left: {
        length: 68,
        breadth: 31,
        protrusion: 18
      },
      right: {
        length: 68,
        breadth: 31,
        protrusion: 18
      }
    }
  },
  extremities: {
    hands: {
      left: {
        palmLength: 88.17157427060376,
        handLength: 168.59441357757672,
        handBreadth: 68.09946526935424,
        thumbLength: 79.73545171172455,
      },
      right: {
        palmLength: 88.17149775988048,
        handLength: 168.5944568396517,
        handBreadth: 68.09944990787706,
        thumbLength: 79.73537433647563,
      },
    },
    feet: {
      left: {
        footLength: 206.78462297733597,
        footBreadth: 108.18090936868944,
        ankleHeight: 89.92040930269248,
      },
      right: {
        footLength: 206.7881156128512,
        footBreadth: 108.07010832672562,
        ankleHeight: 89.86850824340534,
      },
    },
  },
  appearance: {
    skin: {
      oiliness: 0.3,
      wrinkles: 0,
      seed: 51004,
    },
    hair: {
      style: AutoMovieHumanHairStyle.Short,
      color: AutoMovieHumanHairColor.DarkBrown,
      length: 70,
      curl: AutoMovieHumanHairCurl.II,
      hairline: AutoMovieHumanHairline.Rectangular,
    },
    browPair: {
      left: { color: AutoMovieHumanHairColor.DarkBrown },
      right: { color: AutoMovieHumanHairColor.DarkBrown },
    },
    lashPair: {
      left: { color: AutoMovieHumanHairColor.DarkBrown, length: 8 },
      right: { color: AutoMovieHumanHairColor.DarkBrown, length: 8 },
    },
    underwear: {
      bottom: AutoMovieHumanLowerUnderwear.BoxerBriefs,
      top: AutoMovieHumanUpperUnderwear.None,
      color: "#3D454B",
    },
  },
} satisfies IAutoMovieHumanParameters;
