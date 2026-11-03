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
        // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
        value: 856.8148732398769,
        pinned: false,
      },
      bustSpan: {
        value: 180.9891700744629,
        pinned: false,
      },
      underbust: {
        // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
        value: 760.4788465027519,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 324.3755340576172,
        pinned: false,
      },
      neckToWaist: {
        // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
        value: 373.85214289738786,
        pinned: false,
      },
      acrossShoulder: {
        // ISO 8559-1 5.4.3 across back shoulder width: shoulder point to shoulder point through the back neck point, taut over the skin; measured on the reference by test_human_anatomy_course.
        value: 395.6,
        pinned: false,
      },
      shoulderToApex: {
        value: 243.9493751525879,
        pinned: false,
      },
      waist: {
        // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
        value: 673.6269910921733,
        pinned: false,
      },
      hip: {
        // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
        value: 991.406328716076,
        pinned: false,
      },
      highHip: {
        // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
        value: 858.1593473761362,
        pinned: false,
      },
      neckBase: {
        // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
        value: 356.1871228195646,
        pinned: false,
      },
      neck: {
        // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
        value: 324.92422528540664,
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
        // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
        value: 267.77898541765603,
        pinned: false,
      },
      elbow: {
        // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
        value: 227.05861308167655,
        pinned: false,
      },
      wrist: {
        // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
        value: 148.656022073454,
        pinned: false,
      },
      forearm: {
        // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
        value: 237.07992301196214,
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
        // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
        value: 334.6398096761222,
        pinned: false,
      },
      calf: {
        // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
        value: 348.43357968836165,
        pinned: false,
      },
      handCircumference: {
        // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
        value: 187.89581494732815,
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
    length: 190.90301035915462,
    // Cephalic index eu-eu / g-op x 100, both measured on the reference.
    cephalicIndex: 82.56526253266203,
    // Head circumference through glabella and opisthocranion, above the ears; measured on the reference.
    circumference: 553.55791014967,
    // Head height menton to vertex, read upright (Snyder 1977 no. 25); measured on the reference.
    height: 223.68650341266016,
    // Morphological face height n-gn (FaceBase); measured on the reference.
    faceHeight: 117.73972529172306,
    faceWidth: 126.630033866968,
    mandibularWidth: 113.70094763251657,
    minimumFrontalWidth: 100,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 32.62735103563099,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 10.710708242470588,
        },
        right: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 32.68809425581976,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 10.748003634718192,
        },
      },
      // Intercanthal width en-en (FaceBase); measured on the reference.
      intercanthalWidth: 30.94865618955156,
      nose: {
        // Nasal width al-al (FaceBase); measured on the reference.
        width: 37.19407756699884,
        // Nasal height n-sn (FaceBase); measured on the reference.
        height: 60.37361939672409,
        // Nasal protrusion sn-prn (FaceBase); measured on the reference.
        protrusion: 24.760533828875374,
      },
      mouth: {
        // Mouth width ch-ch (FaceBase labial fissure width); measured on the reference.
        width: 44.5,
        // Upper vermilion height ls-sto (FaceBase); measured on the reference.
        upperVermilionHeight: 10.243130447829577,
        // Lower vermilion height sto-li (FaceBase); measured on the reference.
        lowerVermilionHeight: 10.718911650273649,
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
        // ANSUR II palm length, stylion to the middle finger's base crease, this side; measured on the reference.
        palmLength: 108.67944999830151,
        handLength: 179.5,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 80.04420310604661,
        thumbLength: 52.5,
      },
      right: {
        // ANSUR II palm length, stylion to the middle finger's base crease, this side; measured on the reference.
        palmLength: 108.67944999805718,
        handLength: 179.5,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 80.04471448169159,
        thumbLength: 52.5,
      },
    },
    feet: {
      left: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 244.44062881845412,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 90.59831700354202,
        ankleHeight: 69.2,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 244.44061858645776,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 90.59832538837064,
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
