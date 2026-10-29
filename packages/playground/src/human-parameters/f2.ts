import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored f2 example in the Human parameter units; null measurements remain unknown.
 *
 * `head` transcribes the authored clinical-dimension request in `test/.shots/f2/head.json`.
 * It records requested dimensions, not achieved clinical measurements.
 * Surface proxies and residuals stay in `test/.shots/f2/head-application.json`;
 * they do not replace the requested clinical fields.
 *
 * `appearance` transcribes the reference's requested appearance, `test/.shots/f2/appearance.json`,
 * field for field: `skin.{oiliness, wrinkles, seed}`, `hair.{style, color, length, curl, hairline}`,
 * `browPair.<side>.color`, `lashPair.<side>.{color, length}` and `underwear.{bottom, top, color}` keep
 * the same names, units (millimetres, dimensionless 0 to 1, uint32 seed) and closed-choice values;
 * the reference stores the choices as their serialized strings, which are these enum members' values.
 * The request has no freckle or acne entry, so those optional fields stay absent, and it states no
 * pigmentation or iris colour, so `pigmentation` stays absent rather than invented.
 */
export const f2: IAutoMovieHumanParameters = {
  body: {
    controls: {
      height: {
        value: 1703.5589599609375,
        pinned: true,
      },
      fat: {
        value: -0.5042912364006042,
        pinned: true,
      },
      masculineFeminine: {
        value: 0.7907429337501526,
        pinned: true,
      },
      muscularity: {
        value: 0.15562009811401367,
        pinned: true,
      },
      chest: {
        value: 919.1614532470703,
        pinned: false,
      },
      bustSpan: {
        value: 186.75151824951172,
        pinned: false,
      },
      underbust: {
        value: 741.2198638916016,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 328.59004974365234,
        pinned: false,
      },
      neckToWaist: {
        value: 349.1606140136719,
        pinned: false,
      },
      acrossShoulder: {
        value: 303.9740562438965,
        pinned: false,
      },
      shoulderToApex: {
        value: 268.69110107421875,
        pinned: false,
      },
      waist: {
        value: Number("681.0659790039062"),
        pinned: false,
      },
      hip: {
        value: 1006.4704132080078,
        pinned: false,
      },
      highHip: {
        value: 856.5824127197266,
        pinned: false,
      },
      neckBase: {
        value: 349.5635223388672,
        pinned: false,
      },
      neck: {
        value: 331.35772705078125,
        pinned: false,
      },
      neckLength: {
        value: 91.32719039916992,
        pinned: false,
      },
      upperArmLength: {
        value: 326.64955139160156,
        pinned: false,
      },
      lowerArmLength: {
        value: 246.33581161499023,
        pinned: false,
      },
      bicep: {
        value: 293.9323425292969,
        pinned: false,
      },
      elbow: {
        value: 240.5398178100586,
        pinned: false,
      },
      wrist: {
        value: 145.31728744506836,
        pinned: false,
      },
      forearm: {
        value: 234.40244674682617,
        pinned: false,
      },
      inseam: {
        value: 736.4272308349609,
        pinned: false,
      },
      thigh: {
        value: 568.3276748657227,
        pinned: false,
      },
      knee: {
        value: 331.46873474121094,
        pinned: false,
      },
      calf: {
        value: 355.2852249145508,
        pinned: false,
      },
      handCircumference: {
        value: 190.85552215576172,
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
    length: 190,
    cephalicIndex: 77,
    circumference: 555,
    height: 230,
    faceHeight: 124,
    faceWidth: 137,
    mandibularWidth: 105,
    minimumFrontalWidth: 106,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 33,
          palpebralFissureHeight: 10
        },
        right: {
          palpebralFissureLength: 33,
          palpebralFissureHeight: 10
        }
      },
      intercanthalWidth: 32,
      nose: {
        width: 32,
        height: 55,
        protrusion: 23
      },
      mouth: {
        width: 54,
        upperVermilionHeight: 6,
        lowerVermilionHeight: 10
      }
    },
    earPair: {
      left: {
        length: 62,
        breadth: 28,
        protrusion: 15
      },
      right: {
        length: 62,
        breadth: 28,
        protrusion: 15
      }
    }
  },
  extremities: {
    hands: {
      left: {
        palmLength: 82.91030881586363,
        handLength: 159.0197910890635,
        handBreadth: 61.76422546373127,
        thumbLength: 70.72526214679591,
      },
      right: {
        palmLength: 82.91038074678414,
        handLength: 159.0199320272517,
        handBreadth: 61.76432533595288,
        thumbLength: 70.72522840503292,
      },
    },
    feet: {
      left: {
        footLength: 186.86891578247474,
        footBreadth: 95.382508993088,
        ankleHeight: 78.54168458181431,
      },
      right: {
        footLength: 186.87607073104544,
        footBreadth: 95.20917274894023,
        ankleHeight: 78.50128912955795,
      },
    },
  },
  appearance: {
    skin: {
      oiliness: 0.25,
      wrinkles: 0,
      seed: 51002,
    },
    hair: {
      style: AutoMovieHumanHairStyle.Crop,
      color: AutoMovieHumanHairColor.Brown,
      length: 50,
      curl: AutoMovieHumanHairCurl.II,
      hairline: AutoMovieHumanHairline.BellShaped,
    },
    browPair: {
      left: { color: AutoMovieHumanHairColor.Brown },
      right: { color: AutoMovieHumanHairColor.Brown },
    },
    lashPair: {
      left: { color: AutoMovieHumanHairColor.Brown, length: 10 },
      right: { color: AutoMovieHumanHairColor.Brown, length: 10 },
    },
    underwear: {
      bottom: AutoMovieHumanLowerUnderwear.Briefs,
      top: AutoMovieHumanUpperUnderwear.Bra,
      color: "#6D5260",
    },
  },
} satisfies IAutoMovieHumanParameters;
