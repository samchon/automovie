import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored m2 example in the Human parameter units; null measurements remain unknown.
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
        // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
        value: 1147.3762659298159,
        pinned: false,
      },
      bustSpan: {
        value: 246.2342071533203,
        pinned: false,
      },
      underbust: {
        // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
        value: 1046.5613586726363,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 400.17303466796875,
        pinned: false,
      },
      neckToWaist: {
        // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
        value: 436.6023518789452,
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
        // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
        value: 911.0235737324305,
        pinned: false,
      },
      hip: {
        // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
        value: 1088.7478399938984,
        pinned: false,
      },
      highHip: {
        // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
        value: 987.3755819911206,
        pinned: false,
      },
      neckBase: {
        // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
        value: 456.39789520530735,
        pinned: false,
      },
      neck: {
        // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
        value: 418.3785770349084,
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
        // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
        value: 390.8613092742273,
        pinned: false,
      },
      elbow: {
        // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
        value: 311.4362529841102,
        pinned: false,
      },
      wrist: {
        // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
        value: 197.05228410321232,
        pinned: false,
      },
      forearm: {
        // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
        value: 312.20074067803455,
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
        // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
        value: 383.1108939350745,
        pinned: false,
      },
      calf: {
        // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
        value: 421.7880601887109,
        pinned: false,
      },
      handCircumference: {
        // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
        value: 245.522516595668,
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
    length: 201.52431604089276,
    cephalicIndex: 83.6,
    circumference: 594.1,
    height: 210.1,
    // Morphological face height n-gn (FaceBase); measured on the reference.
    faceHeight: 125.40300847317029,
    // Face width zy-zy (FaceBase maximum facial width); measured on the reference.
    faceWidth: 156.38555526733398,
    mandibularWidth: 126.91175381064693,
    minimumFrontalWidth: 105.9,
    mouthOpening: 54,
    mandibularLaterotrusion: 11,
    face: {
      eyePair: {
        left: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 33.61787031437682,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 10.109533321427481,
        },
        right: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 33.68595635436452,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 9.80859834261776,
        },
      },
      // Intercanthal width en-en (FaceBase); measured on the reference.
      intercanthalWidth: 32.31103597299708,
      nose: {
        // Nasal width al-al (FaceBase); measured on the reference.
        width: 40.9725141603886,
        // Nasal height n-sn (FaceBase); measured on the reference.
        height: 58.424605905711935,
        // Nasal protrusion sn-prn (FaceBase); measured on the reference.
        protrusion: 23.60853841039552,
      },
      mouth: {
        // Mouth width ch-ch (FaceBase labial fissure width); measured on the reference.
        width: 57,
        // Upper vermilion height ls-sto (FaceBase); measured on the reference.
        upperVermilionHeight: 7.958418063145457,
        // Lower vermilion height sto-li (FaceBase); measured on the reference.
        lowerVermilionHeight: 9.894008874736056,
      },
    },
    earPair: {
      left: {
        length: 64.6,
        breadth: 31,
        protrusion: 24.4,
      },
      right: {
        length: 66.9,
        breadth: 32,
        protrusion: 20.3,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        palmLength: 125.2,
        handLength: 210,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 103.0760400371471,
        thumbLength: 63.2,
      },
      right: {
        palmLength: 125.2,
        handLength: 210,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 103.07613479645829,
        thumbLength: 63.2,
      },
    },
    feet: {
      left: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 290.4753163245989,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 108.79692124024963,
        ankleHeight: 89.92040930269248,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 290.47533074234366,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 108.79691054529103,
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
