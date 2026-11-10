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
      // ANSUR suprasternale height: the deepest point of the jugular notch on the exact anterior-midline cut, read on the reference by node:trunk-measure (receipt packages/human/.shots/f1_trunk/measure-2026-11-08T04-29-23-837Z/trunk.json, suprasternale).
      suprasternaleHeight: 1416,
      // ISO 8559-1 5.3.2 neck girth: perpendicular to the neck axis, its least girth below the larynx, taut tape; measured on the reference.
      neckCircumference: 324.92422528540664,
      // ANSUR II acromion-radiale, solved on the reference's left arm in its own pose: the AR whose GH (de Leva 1996: 0.1044 AR below the trunk's S00 acromion, with Campbell 2009's offset) to elbow centre (0.8524 AR) equals her GH to her ISB epicondyle midpoint, 266.16 mm (node:arm-world, .shots/f1_arm/world-2026-11-08T06-43-26-191Z/report.json). The former 321.18 put the elbow 8.4 mm distal of hers.
      upperArmLength: 312.249369415214,
      // ANSUR II radiale-stylion: beam caliper parallel to the forearm, arm hanging, palm forward; measured on the reference's right arm as the elbow centre (ISB epicondyle midpoint) to stylion's level less de Leva 1996's radiale offset 0.0432 AR (node:arm-measure, .shots/f1_arm/measure-2026-11-08T03-58-34-257Z/forearm.json), re-taken with the AR above so the elbow centre to the wrist centre stays her 225.28 mm. The former 241.26 was the source course, not the skin.
      forearmLength: 210.292319416176,
      // Relaxed upper arm girth (NHANES mid-upper arm): midway acromion to olecranon, perpendicular to the arm, right arm; measured on the reference.
      upperArmCircumference: 267.77898541765603,
      // ANSUR 1988 axillary arm circumference (Gordon et al. 1989): right upper arm perpendicular to its long axis at the axilla level, taut tape; measured on the reference by node:arm-measure (packages/human/.shots/f1_arm/measure-2026-11-07T17-46-24-536Z/axillary.json: the highest plane, 207 mm above the elbow break, whose arm loop stays separate from the trunk).
      axillaryArmCircumference: 282.35967263695653,
      // Elbow girth (ANSUR 1988, extended): over the olecranon, right arm; measured on the reference.
      elbowCircumference: 227.05861308167655,
      // ANSUR II wrist girth over stylion, perpendicular to the forearm, right arm; measured on the reference.
      wristCircumference: 148.656022073454,
      // Forearm skin caliper at Perry et al. 2021's station (0.2 radiale-stylion past radiale): breadth along the epicondyle line, depth across it; right arm, measured on the reference (node:arm-measure, .shots/f1_arm/measure-2026-11-08T03-58-34-257Z/forearm.json).
      forearmBreadth: 82.49655577098375,
      forearmDepth: 67.47136095884878,
      // Wrist skin caliper over stylion: breadth along the styloid line, depth across it; the section's taut tape there reads 149.14 against the wrist girth 148.66; right arm, measured on the reference (same receipt).
      wristSkinBreadth: 52.589788502267254,
      wristDepth: 43.17488227352635,
      // Relaxed maximum forearm girth below the elbow, perpendicular to the forearm, right arm; measured on the reference.
      forearmCircumference: 237.07992301196214,
      inseam: 744.5504760742188,
      // ISO 8559-1 5.3.22 knee girth: horizontal at mid-patella, right side; measured on the reference.
      kneeCircumference: 334.6398096761222,
      // ISO 8559-1 5.3.24 calf girth: horizontal maximum, right side; measured on the reference.
      calfCircumference: 348.43357968836165,
      // ANSUR 1988 (29) calf height: the level of the greatest horizontal calf girth, read on the reference's left-leg mesh by horizontal cuts every 1 mm (NodeLegReference.readings, render leg-2026-11-08T03-39-23-460Z): 348.47 mm girth at 343.03 mm, the calf girth above at the same level. Receipt in packages/human/docs/sources/f1-leg-receipts.md.
      calfHeight: 343.0287456512451,
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
    // Head height menton to vertex perpendicular to FH (Snyder 1977 no. 25, the identity's definition): node:head-measure on the reference head in her FH frame (receipt .shots/f1_head/measure-2026-11-08T03-22-03-851Z/head.json, values.headHeightPerpendicularToFH; her FH stands 5.5 degrees off her native horizontal, so the earlier upright reading, 223.69, was not this measure).
    height: 229.6316285068193,
    // Morphological face height n-gn (FaceBase, 3D, gn the chin's lowest median point): the same receipt, values.nasionMentonDistance.
    faceHeight: 118.75359911912236,
    faceWidth: 126.630033866968,
    mandibularWidth: 113.70094763251657,
    minimumFrontalWidth: 100,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    // The face measures below: node:head-measure on the reference head (receipt .shots/f1_head/measure-2026-11-08T00-27-31-425Z/head.json): FH through the tragia and the soft orbitales read on the mesh, the midsagittal silhouette's landmarks, taut-tape arcs as convex hulls.
    // Bitragion menton arc (ANSUR 1988), taut tape from tragion to tragion under the chin through the menton.
    bitragionMentonArc: 312.50194475653177,
    // Bitragion subnasale arc (ANSUR 1988), taut tape from tragion to tragion through the subnasale.
    bitragionSubnasaleArc: 296.78318468968035,
    // Submental inclination: the menton's tangent to the submental contour up to the cervical point, degrees below FH (receipt .shots/f1_head/measure-2026-11-08T03-22-03-851Z/head.json, readings.submentalTangentDegrees; the earlier 16.31 was its search window's edge on the throat).
    submentalInclination: 8.970976298492682,
    // Subnasale ahead of the soft glabella, along FH (her Sn stands behind G).
    subnasaleAheadOfGlabella: -5.335249310694479,
    // Soft glabella ahead of and above the soft nasion (her flat brow's most prominent point above the nasal root).
    glabellaAheadOfNasion: 4.816016521929299,
    glabellaAboveNasion: 25.601345592422163,
    // Soft pogonion ahead of the glabella along FH, and above the menton.
    pogonionAheadOfGlabella: -19.45949263859346,
    pogonionAboveMenton: 20.10835550877054,
    // FaceBase facial depths t-n, t-sn, t-gn (3D tragion distances, mean of both sides) and the lips' protrusion ahead of Sn-Pg': node:head-measure on the reference head (receipt .shots/f1_head/measure-2026-11-08T00-45-33-143Z/head.json).
    tragionNasionDepth: 124.70180080931877,
    tragionSubnasaleDepth: 131.36635454994232,
    // t-gn to FaceBase's (Farkas's) gnathion, the chin's lowest median point (receipt .shots/f1_head/measure-2026-11-08T03-22-03-851Z/head.json, values.tragionMentonDepth; the earlier 142.68 was read to the mid-chin point).
    tragionGnathionDepth: 143.8177512567862,
    upperLipProtrusion: 3.6512574378629834,
    lowerLipProtrusion: 4.47169057842411,
    // Bitragion breadth (ANSUR), the straight distance between the tragia read on the reference head (receipt .shots/f1_head/measure-2026-11-08T00-45-33-143Z/head.json, frame.tragion).
    bitragionBreadth: 144.4564155925047,
    // Nasal bridge length n-prn (Farkas), the straight distance between the receipt's nasion and pronasale (.shots/f1_head/measure-2026-11-08T00-45-33-143Z/head.json).
    nasalBridgeLength: 42.70782516279823,
    // node:head-measure on the reference head in her FH frame (receipt .shots/f1_head/measure-2026-11-08T03-22-03-851Z/head.json, values and readings): ANSUR II tragion to top of head (head in FH); FaceBase n-sto and sn-sto (3D); ANSUR 1988 bitragion coronal arc (taut tape in the coronal plane through the tragia, normal to FH).
    tragionTopOfHead: 128.61494112622827,
    upperFacialHeight: 75.52771526340307,
    upperLipHeight: 17.15872676086289,
    bitragionCoronalArc: 358.7181942079085,
    // Stagnara's cervical arrow apex, the deepest point of the cervical lordosis on the back's midline skin, read standing against a plumb line on the whole-body reference about her tragia (receipt .shots/f1_head/measure-2026-11-08T03-49-29-355Z/head.json, readings.cervicalArrowApex.upright: -60.60, -61.19).
    cervicalArrowApexBehindTragion: 60.6,
    cervicalArrowApexBelowTragion: 61.19,
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
        // Nasal height n-sn (FaceBase, 3D): node:head-measure (receipt .shots/f1_head/measure-2026-11-08T03-22-03-851Z/head.json, values.nasionSubnasaleDistance).
        height: 59.28077964136021,
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
