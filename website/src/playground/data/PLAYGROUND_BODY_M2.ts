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

/**
 * The parameters of one person in the Human parameter units; an omitted
 * measure takes its survey default.
 *
 * A copy of the `m2` example the motion capture harness keeps in
 * `packages/motions/src/executable/population/human-parameters/m2.ts`, which
 * no package exports.
 */
export const PLAYGROUND_BODY_M2: IAutoMovieHumanParameters = {
  body: {
    anatomy: {
      // The reference person's sex, which selects the survey statistics its omitted measures derive from. Its own mesh shows no gluteal notch deeper than HumanAnatomyLegFold.SMOOTH (test_human_reference_inputs), so its gluteal furrow height, and with it the ISO 8559-1 5.3.20 thigh girth sought below the fold, take their defaults.
      sex: AutoMovieHumanSex.Male,
      stature: 1856.9737243652344,
      // ISO 8559-1 5.3.4 bust (chest) girth: horizontal at the bust point, taut tape; measured on the reference.
      chestCircumference: 1147.3762659298159,
      bustPointWidth: 246.2342071533203,
      // ISO 8559-1 5.3.8 under bust girth: horizontal at the inframammary fold, taut tape; measured on the reference.
      underbustCircumference: 1046.5613586726363,
      // ISO 8559-1 5.4.5 back neck point to waist: taut down the back's median skin from cervicale to the natural waist; measured on the reference.
      backNeckToWaist: 436.6023518789452,
      // ISO 8559-1 5.4.3 across back shoulder width: shoulder point to shoulder point through the back neck point, taut over the skin; measured on the reference by test_human_anatomy_course.
      acrossBackShoulderWidth: 451.9,
      sideNeckToBustPoint: 303.3722686767578,
      // Natural waist girth (ANSUR 1988): horizontal least girth between rib and iliac crest, taut tape; measured on the reference.
      waistCircumference: 911.0235737324305,
      // ISO 8559-1 5.3.13 hip girth: horizontal at the buttock prominence, taut tape; measured on the reference.
      hipCircumference: 1088.7478399938984,
      // ISO 8559-1 5.3.12 top hip girth: horizontal midway between waist and hip levels, taut tape; measured on the reference.
      highHipCircumference: 987.3755819911206,
      // ISO 8559-1 5.3.3 neck base girth: over cervicale, the side neck points and the jugular notch, taut tape; measured on the reference.
      neckBaseCircumference: 456.39789520530735,
      // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
      neckCircumference: 418.3785770349084,
      upperArmLength: 371.8878173828125,
      forearmLength: 276.3052558898926,
      // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
      upperArmCircumference: 390.8613092742273,
      // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
      elbowCircumference: 311.4362529841102,
      // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
      wristCircumference: 197.05228410321232,
      // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
      forearmCircumference: 312.20074067803455,
      inseam: 792.3451232910156,
      // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
      kneeCircumference: 383.1108939350745,
      // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
      calfCircumference: 421.7880601887109,
      // ANSUR II ankle circumference: the least horizontal girth of the leg above the malleoli, right side; read on the reference's own mesh by test_human_reference_inputs, from 0.25 S down to 0.05 S.
      ankleCircumference: 260.7,
      // Hand circumference at metacarpale (ANSUR 1988): over metacarpals II to V, thumb excluded, right hand; measured on the reference.
      handCircumference: 245.522516595668,
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
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 871.1 mm) less the inseam (792.35 mm).
        ankleHeight: 78.75,
      },
      right: {
        // Foot length along the foot axis, heel to longest toe (ISO 8559-1 5.5.5), this side; measured on the reference.
        footLength: 290.47533074234366,
        // Foot breadth across the metatarsal heads, across the foot axis, this side; measured on the reference.
        footBreadth: 108.79691054529103,
        // Lateral malleolus height by ISO 8559-1 5.7.6: the inside leg length is the crotch height less the outer ankle point's height, so this is the crotch height read on the reference (HumanAnatomyLegSites.crotchHeight, 871.1 mm) less the inseam (792.35 mm).
        ankleHeight: 78.75,
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
