import type { IAutoMovieHumanParameters } from "../../../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanSex } from "../../../../../human/src/typings/AutoMovieHumanSex";
import { AutoMovieHumanUpperUnderwear } from "../../../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored f2 example in the Human parameter units; an omitted measure takes its survey default.
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
    anatomy: {
      // The reference person's sex, which selects the survey statistics its omitted measures derive from. Its own mesh shows no gluteal notch deeper than HumanAnatomyLegFold.SMOOTH (test_human_reference_inputs), so its gluteal furrow height, and with it the ISO 8559-1 5.3.20 thigh girth sought below the fold, take their defaults.
      sex: AutoMovieHumanSex.Female,
      stature: 1703.5589599609375,
      // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
      chestCircumference: 918.6375490096898,
      bustPointWidth: 186.75151824951172,
      // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
      underbustCircumference: 761.8000786778941,
      // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
      backNeckToWaist: 386.69612918782747,
      // ISO 8559-1 5.4.3 across back shoulder width: shoulder point to shoulder point through the back neck point, taut over the skin; measured on the reference by test_human_anatomy_course.
      acrossBackShoulderWidth: 401.7,
      sideNeckToBustPoint: 268.69110107421875,
      // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
      waistCircumference: 689.2230617421899,
      // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
      hipCircumference: 1009.6596427664421,
      // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
      highHipCircumference: 878.8940593520194,
      // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
      neckBaseCircumference: 359.1524854687775,
      // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
      neckCircumference: 316.85655215182607,
      upperArmLength: 326.64955139160156,
      forearmLength: 246.33581161499023,
      // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
      upperArmCircumference: 300.2753984277156,
      // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
      elbowCircumference: 248.216700736266,
      // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
      wristCircumference: 149.54423795967244,
      // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
      forearmCircumference: 246.4004645215409,
      inseam: 736.4272308349609,
      // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
      kneeCircumference: 338.96511509777696,
      // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
      calfCircumference: 361.9808863818945,
      // ANSUR II ankle circumference: the least horizontal girth of the leg above the malleoli, right side; read on the reference's own mesh by test_human_reference_inputs, from 0.25 S down to 0.05 S.
      ankleCircumference: 208.5,
      // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
      handCircumference: 197.44981991063952,
    },
  },
  head: {
    // Head length g-op (FaceBase maximum cranial length); measured on the reference.
    length: 194.16216915989682,
    // Cephalic index eu-eu / g-op x 100, both measured on the reference.
    cephalicIndex: 79.29041669379146,
    // Head circumference through glabella and opisthocranion, above the ears; measured on the reference.
    circumference: 560.3343006632343,
    // Head height menton to vertex, read upright (Snyder 1977 no. 25); measured on the reference.
    height: 231.39487056840358,
    // Morphological face height n-gn (FaceBase); measured on the reference.
    faceHeight: 122.26450210358796,
    // Face width zy-zy (FaceBase maximum facial width); measured on the reference.
    faceWidth: 148.48164081573486,
    mandibularWidth: 115.62324689283679,
    minimumFrontalWidth: 112.5,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 33.93537896913413,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 11.196451402428647,
        },
        right: {
          // Palpebral fissure length en-ex (FaceBase), this side; measured on the reference.
          palpebralFissureLength: 33.92313943154284,
          // Palpebral fissure height, lid margin to lid margin at the pupil, this side; measured on the reference.
          palpebralFissureHeight: 11.168848127191946,
        },
      },
      // Intercanthal width en-en (FaceBase); measured on the reference.
      intercanthalWidth: 31.791438532450826,
      nose: {
        // Nasal width al-al (FaceBase); measured on the reference.
        width: 40.31633068556177,
        // Nasal height n-sn (FaceBase); measured on the reference.
        height: 57.05990093016105,
        // Nasal protrusion sn-prn (FaceBase); measured on the reference.
        protrusion: 17.6010046752627,
      },
      mouth: {
        // Mouth width ch-ch (FaceBase labial fissure width); measured on the reference.
        width: 52,
        // Upper vermilion height ls-sto (FaceBase); measured on the reference.
        upperVermilionHeight: 10.773453232128324,
        // Lower vermilion height sto-li (FaceBase); measured on the reference.
        lowerVermilionHeight: 8.706250691947176,
      },
    },
    earPair: {
      left: {
        length: 60.4,
        breadth: 26.5,
        protrusion: 16,
      },
      right: {
        length: 60,
        breadth: 26.7,
        protrusion: 16.5,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        // ANSUR II palm length, stylion to the middle finger's base crease, this side; measured on the reference.
        palmLength: 106.28685327159428,
        handLength: 184.3,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 84.8269072651695,
        thumbLength: 54.4,
      },
      right: {
        // ANSUR II palm length, stylion to the middle finger's base crease, this side; measured on the reference.
        palmLength: 106.28685327125584,
        handLength: 184.3,
        // Hand breadth across metacarpals II to V (ANSUR II), this side; measured on the reference.
        handBreadth: 84.82723496027239,
        thumbLength: 54.4,
      },
    },
    feet: {
      left: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 247.8430528772614,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 97.25890726840983,
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 800.6 mm) less the inseam (736.43 mm).
        ankleHeight: 64.17,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 247.84304120808827,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 97.2589075786412,
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 800.6 mm) less the inseam (736.43 mm).
        ankleHeight: 64.17,
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
