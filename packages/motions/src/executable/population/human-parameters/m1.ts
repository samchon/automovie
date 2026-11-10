import {
  AutoMovieHumanHairColor,
  AutoMovieHumanHairCurl,
  AutoMovieHumanHairStyle,
  AutoMovieHumanHairline,
  AutoMovieHumanLowerUnderwear,
  AutoMovieHumanSex,
  AutoMovieHumanUpperUnderwear,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

/** Authored m1 example in the Human parameter units; an omitted measure takes its survey default.
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
    anatomy: {
      // The reference person's sex, which selects the survey statistics its omitted measures derive from. Its own mesh shows no gluteal notch deeper than HumanAnatomyLegFold.SMOOTH (test_human_reference_inputs), so its gluteal furrow height, and with it the ISO 8559-1 5.3.20 thigh girth sought below the fold, take their defaults.
      sex: AutoMovieHumanSex.Male,
      stature: 1841.8359375,
      // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
      chestCircumference: 1050.114067546747,
      bustPointWidth: 222.98137664794922,
      // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
      underbustCircumference: 974.746683869573,
      // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
      backNeckToWaist: 406.84838597492103,
      // ISO 8559-1 5.4.3 across back shoulder width: shoulder point to shoulder point through the back neck point, taut over the skin; measured on the reference by test_human_anatomy_course.
      acrossBackShoulderWidth: 426.7,
      sideNeckToBustPoint: 282.20455169677734,
      // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
      waistCircumference: 880.2550704117248,
      // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
      hipCircumference: 1051.681703845049,
      // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
      highHipCircumference: 933.5698119736606,
      // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
      neckBaseCircumference: 420.16554549557407,
      // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
      neckCircumference: 375.88492141519305,
      upperArmLength: 368.43692779541016,
      forearmLength: 270.13219833374023,
      // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
      upperArmCircumference: 377.572009833336,
      // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
      elbowCircumference: 307.4063499181038,
      // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
      wristCircumference: 199.4079555509107,
      // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
      forearmCircumference: 311.6678543934774,
      inseam: 782.9294586181641,
      // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
      kneeCircumference: 387.43857809544085,
      // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
      calfCircumference: 387.1819980069014,
      // ANSUR II ankle circumference: the least horizontal girth of the leg above the malleoli, right side; read on the reference's own mesh by test_human_reference_inputs, from 0.25 S down to 0.05 S.
      ankleCircumference: 237.4,
      // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
      handCircumference: 237.80803578705763,
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
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 858.5 mm) less the inseam (782.93 mm).
        ankleHeight: 75.57,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 289.2422702438339,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 107.2148897934451,
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 858.5 mm) less the inseam (782.93 mm).
        ankleHeight: 75.57,
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
