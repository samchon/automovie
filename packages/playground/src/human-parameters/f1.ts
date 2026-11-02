import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored f1 example in the Human parameter units; null measurements remain unknown.
 *
 * `appearance` transcribes the reference's requested appearance, `test/.shots/f1/appearance.json`,
 * field for field: `skin.{oiliness, wrinkles, seed}`, `hair.{style, color, length, curl, hairline}`,
 * `browPair.<side>.color`, `lashPair.<side>.{color, length}` and `underwear.{bottom, top, color}` keep
 * the same names, units (millimetres, dimensionless 0 to 1, uint32 seed) and closed-choice values;
 * the reference stores the choices as their serialized strings, which are these enum members' values.
 * The request has no freckle or acne entry, so those optional fields stay absent, and it states no
 * pigmentation or iris colour, so `pigmentation` stays absent rather than invented.
 */
export const f1: IAutoMovieHumanParameters = {
  body: {
    controls: {
      height: {
        value: 1696.9285583496094,
        pinned: true,
      },
      fat: {
        value: -0.6499820947647095,
        pinned: true,
      },
      masculineFeminine: {
        value: 0.9449925422668457,
        pinned: true,
      },
      muscularity: {
        value: 0.07685086876153946,
        pinned: true,
      },
      chest: {
        value: Number("851.5725708007812"),
        pinned: false,
      },
      bustSpan: {
        value: 180.9891700744629,
        pinned: false,
      },
      underbust: {
        value: 741.7649841308594,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 324.3755340576172,
        pinned: false,
      },
      neckToWaist: {
        value: 330.7135772705078,
        pinned: false,
      },
      acrossShoulder: {
        value: 296.65414810180664,
        pinned: false,
      },
      shoulderToApex: {
        value: 243.9493751525879,
        pinned: false,
      },
      waist: {
        value: 666.32080078125,
        pinned: false,
      },
      hip: {
        value: 983.2448577880859,
        pinned: false,
      },
      highHip: {
        value: 820.6779479980469,
        pinned: false,
      },
      neckBase: {
        value: 359.11495208740234,
        pinned: false,
      },
      neck: {
        value: 332.83763885498047,
        pinned: false,
      },
      neckLength: {
        value: 79.85565185546875,
        pinned: false,
      },
      upperArmLength: {
        value: 321.1808776855469,
        pinned: false,
      },
      lowerArmLength: {
        value: 241.26361846923828,
        pinned: false,
      },
      bicep: {
        value: 262.2895050048828,
        pinned: false,
      },
      elbow: {
        value: 219.84554290771484,
        pinned: false,
      },
      wrist: {
        value: 142.9803466796875,
        pinned: false,
      },
      forearm: {
        value: 227.94408798217773,
        pinned: false,
      },
      inseam: {
        value: 744.5504760742188,
        pinned: false,
      },
      thigh: {
        value: Number("556.6152954101562"),
        pinned: false,
      },
      knee: {
        value: 327.44773864746094,
        pinned: false,
      },
      calf: {
        value: 341.2932586669922,
        pinned: false,
      },
      handCircumference: {
        value: 179.6338653564453,
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
    length: 189.4,
    cephalicIndex: 83.3,
    circumference: 553.6,
    height: 216.7,
    faceHeight: 116.8,
    faceWidth: 126.630033866968,
    mandibularWidth: 113.70094763251657,
    minimumFrontalWidth: 100,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 32,
          palpebralFissureHeight: 10.472869873046875,
        },
        right: {
          palpebralFissureLength: 32,
          palpebralFissureHeight: 10.603485107421875,
        },
      },
      intercanthalWidth: 31,
      nose: {
        width: 37.4,
        height: 57.8,
        protrusion: 21.8,
      },
      mouth: {
        width: 47,
        upperVermilionHeight: 8,
        lowerVermilionHeight: 10,
      },
    },
    earPair: {
      left: {
        length: 62.8,
        breadth: 26.2,
        protrusion: 20.6,
      },
      right: {
        length: 63.5,
        breadth: 26.3,
        protrusion: 21.7,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        palmLength: 105.1,
        handLength: 179.5,
        handBreadth: 75.7,
        thumbLength: 52.5,
      },
      right: {
        palmLength: 105.1,
        handLength: 179.5,
        handBreadth: 75.7,
        thumbLength: 52.5,
      },
    },
    feet: {
      left: {
        footLength: 243.3159897216381,
        footBreadth: 90.19352375312418,
        ankleHeight: 69.2,
      },
      right: {
        footLength: 243.3068806706005,
        footBreadth: 90.07814933414397,
        ankleHeight: 69.2,
      },
    },
  },
  appearance: {
    skin: {
      oiliness: 0.25,
      wrinkles: 0,
      seed: 51001,
    },
    hair: {
      style: AutoMovieHumanHairStyle.Bob,
      color: AutoMovieHumanHairColor.DarkBrown,
      length: 300,
      curl: AutoMovieHumanHairCurl.II,
      hairline: AutoMovieHumanHairline.BellShaped,
    },
    browPair: {
      left: { color: AutoMovieHumanHairColor.DarkBrown },
      right: { color: AutoMovieHumanHairColor.DarkBrown },
    },
    lashPair: {
      left: { color: AutoMovieHumanHairColor.DarkBrown, length: 10 },
      right: { color: AutoMovieHumanHairColor.DarkBrown, length: 10 },
    },
    underwear: {
      bottom: AutoMovieHumanLowerUnderwear.Briefs,
      top: AutoMovieHumanUpperUnderwear.Bra,
      color: "#6D5260",
    },
  },
} satisfies IAutoMovieHumanParameters;
