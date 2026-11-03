import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored m1 example in the Human parameter units; null measurements remain unknown.
 *
 * `appearance` transcribes the reference's requested appearance, `test/.shots/m1/appearance.json`,
 * field for field: `skin.{oiliness, wrinkles, seed}`, `hair.{style, color, length, curl, hairline}`,
 * `browPair.<side>.color`, `lashPair.<side>.{color, length}` and `underwear.{bottom, top, color}` keep
 * the same names, units (millimetres, dimensionless 0 to 1, uint32 seed) and closed-choice values;
 * the reference stores the choices as their serialized strings, which are these enum members' values.
 * The request has no freckle or acne entry, so those optional fields stay absent, and it states no
 * pigmentation or iris colour, so `pigmentation` stays absent rather than invented.
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
        // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
        value: 1050.114067546747,
        pinned: false,
      },
      bustSpan: {
        value: 222.98137664794922,
        pinned: false,
      },
      underbust: {
        // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
        value: 974.746683869573,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 382.62561798095703,
        pinned: false,
      },
      neckToWaist: {
        // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
        value: 406.84838597492103,
        pinned: false,
      },
      acrossShoulder: {
        // ISO 8559-1 5.4.3 across back shoulder width: shoulder point to shoulder point through the back neck point, taut over the skin; measured on the reference by test_human_anatomy_course.
        value: 426.7,
        pinned: false,
      },
      shoulderToApex: {
        value: 282.20455169677734,
        pinned: false,
      },
      waist: {
        // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
        value: 880.2550704117248,
        pinned: false,
      },
      hip: {
        // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
        value: 1051.681703845049,
        pinned: false,
      },
      highHip: {
        // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
        value: 933.5698119736606,
        pinned: false,
      },
      neckBase: {
        // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
        value: 420.16554549557407,
        pinned: false,
      },
      neck: {
        // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
        value: 375.88492141519305,
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
        // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
        value: 377.572009833336,
        pinned: false,
      },
      elbow: {
        // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
        value: 307.4063499181038,
        pinned: false,
      },
      wrist: {
        // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
        value: 199.4079555509107,
        pinned: false,
      },
      forearm: {
        // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
        value: 311.6678543934774,
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
        // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
        value: 387.43857809544085,
        pinned: false,
      },
      calf: {
        // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
        value: 387.1819980069014,
        pinned: false,
      },
      handCircumference: {
        // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
        value: 237.80803578705763,
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
    // Head length g-op (FaceBase maximum cranial length); measured on the reference.
    length: 193.44601662967304,
    // Cephalic index eu-eu / g-op x 100, both measured on the reference.
    cephalicIndex: 88.43199043254445,
    circumference: 594.2,
    height: 230.4,
    // Morphological face height n-gn (FaceBase); measured on the reference.
    faceHeight: 115.41454281162578,
    faceWidth: 138.1856610107695,
    mandibularWidth: 139.78542138528064,
    minimumFrontalWidth: 111,
    mouthOpening: 54,
    mandibularLaterotrusion: 11,
    face: {
      eyePair: {
        left: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 31.522705123054166,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 8.733606296954253,
        },
        right: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 31.457286610123326,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 8.973116133899634,
        },
      },
      // Intercanthal width en-en (FaceBase); measured on the reference.
      intercanthalWidth: 33.10942951442336,
      nose: {
        // Nasal width al-al (FaceBase); measured on the reference.
        width: 43.64141547000153,
        // Nasal height n-sn (FaceBase); measured on the reference.
        height: 49.394018979764674,
        // Nasal protrusion sn-prn (FaceBase); measured on the reference.
        protrusion: 15.643356107771945,
      },
      mouth: {
        width: 53,
        // Upper vermilion height ls-sto (FaceBase); measured on the reference.
        upperVermilionHeight: 8.836887303118406,
        // Lower vermilion height sto-li (FaceBase); measured on the reference.
        lowerVermilionHeight: 8.460277735099668,
      },
    },
    earPair: {
      left: {
        length: 65.4,
        breadth: 29.6,
        protrusion: 22.3,
      },
      right: {
        length: 64.8,
        breadth: 31.4,
        protrusion: 21.2,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        palmLength: 122.1,
        handLength: 204.9,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 99.95439514074724,
        thumbLength: 62.4,
      },
      right: {
        palmLength: 122.1,
        handLength: 204.9,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 99.95531265378469,
        thumbLength: 62.4,
      },
    },
    feet: {
      left: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 289.24225011272574,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 107.21490894035352,
        ankleHeight: 73.6,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 289.2422702438339,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 107.2148897934451,
        ankleHeight: 73.6,
      },
    },
  },
  appearance: {
    skin: {
      oiliness: 0.3,
      wrinkles: 0,
      seed: 51003,
    },
    hair: {
      style: AutoMovieHumanHairStyle.Short,
      color: AutoMovieHumanHairColor.Black,
      length: 100,
      curl: AutoMovieHumanHairCurl.II,
      hairline: AutoMovieHumanHairline.Rectangular,
    },
    browPair: {
      left: { color: AutoMovieHumanHairColor.Black },
      right: { color: AutoMovieHumanHairColor.Black },
    },
    lashPair: {
      left: { color: AutoMovieHumanHairColor.Black, length: 8 },
      right: { color: AutoMovieHumanHairColor.Black, length: 8 },
    },
    underwear: {
      bottom: AutoMovieHumanLowerUnderwear.BoxerBriefs,
      top: AutoMovieHumanUpperUnderwear.None,
      color: "#3D454B",
    },
  },
} satisfies IAutoMovieHumanParameters;
