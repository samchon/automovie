import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanHairColor } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanLowerUnderwear } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanSex } from "../../../human/src/typings/AutoMovieHumanSex";
import { AutoMovieHumanUpperUnderwear } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Authored f1 example in the Human parameter units; an omitted measure takes its survey default.
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
    anatomy: {
      // The reference person's sex, which selects the survey statistics its omitted measures derive from. Its own mesh shows no gluteal notch deeper than HumanAnatomyLegFold.SMOOTH (test_human_reference_inputs), so its gluteal furrow height, and with it the ISO 8559-1 5.3.20 thigh girth sought below the fold, take their defaults.
      sex: AutoMovieHumanSex.Female,
      stature: 1696.9285583496094,
      // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
      chestCircumference: 856.8148732398769,
      bustPointWidth: 180.9891700744629,
      // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
      underbustCircumference: 760.4788465027519,
      // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
      backNeckToWaist: 373.85214289738786,
      // ISO 8559-1 5.4.3 across back shoulder width: shoulder point to shoulder point through the back neck point, taut over the skin; measured on the reference by test_human_anatomy_course.
      acrossBackShoulderWidth: 395.6,
      sideNeckToBustPoint: 243.9493751525879,
      // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
      waistCircumference: 673.6269910921733,
      // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
      hipCircumference: 991.406328716076,
      // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
      highHipCircumference: 858.1593473761362,
      // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
      neckBaseCircumference: 356.1871228195646,
      // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
      neckCircumference: 324.92422528540664,
      upperArmLength: 321.1808776855469,
      forearmLength: 241.26361846923828,
      // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
      upperArmCircumference: 267.77898541765603,
      // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
      elbowCircumference: 227.05861308167655,
      // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
      wristCircumference: 148.656022073454,
      // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
      forearmCircumference: 237.07992301196214,
      inseam: 744.5504760742188,
      // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
      kneeCircumference: 334.6398096761222,
      // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
      calfCircumference: 348.43357968836165,
      // ANSUR II ankle circumference: the least horizontal girth of the leg above the malleoli, right side; read on the reference's own mesh by test_human_reference_inputs, from 0.25 S down to 0.05 S.
      ankleCircumference: 205.1,
      // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
      handCircumference: 187.89581494732815,
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
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 804.9 mm) less the inseam (744.55 mm).
        ankleHeight: 60.35,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 244.44061858645776,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 90.59832538837064,
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 804.9 mm) less the inseam (744.55 mm).
        ankleHeight: 60.35,
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
