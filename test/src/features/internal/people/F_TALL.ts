import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `f-tall`, the tallest woman (1.78 m), of the ANSUR 1988 boundary population:
 * the Human parameters (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const F_TALL: IMotionHumanPerson = {
  mass: 72.27969402619999,
  params: {
    body: {
      anatomy: {
        sex: "female",
        bodyFatPercentage: 28.0840545437908,
        stature: 1777.312904,
        chestCircumference: 939.9227224866,
        bustPointWidth: 192.55342891520002,
        underbustCircumference: 801.2620520575999,
        sideNeckToBustPoint: 282.60627824200003,
        waistCircumference: 753.1253690024,
        hipCircumference: 1017.3968254064,
        neckBaseCircumference: 360.949410978,
        neckCircumference: 326.90136472,
        upperArmLength: 341.9789689324,
        forearmLength: 267.3872278648,
        elbowCircumference: 250.7788582268,
        wristCircumference: 159.408660266,
        thighCircumference: 607.580340558,
        kneeCircumference: 386.7113539552,
        calfCircumference: 367.891926528,
        handCircumference: 195.2671200886,
        backNeckToWaist: 394.73539744018126,
        acrossBackShoulderWidth: 412.208984426352,
        highHipCircumference: 946.1641968635266,
        upperArmCircumference: 293.73944209361434,
        forearmCircumference: 252.75409419561473,
        inseam: 781.4568442951327,
      },
    },
    head: {
      length: 192.5042970488,
      cephalicIndex: 75.77104250998808,
      circumference: 558.086794304,
      height: 233.28703832123327,
      faceHeight: 123.283729198477,
      faceWidth: 133.73156551000002,
      mandibularWidth: 98.79635837372432,
      minimumFrontalWidth: 107.45377122090635,
      mouthOpening: 48,
      mandibularLaterotrusion: 9,
      bitragionMentonArc: 312.50194475653177,
      bitragionSubnasaleArc: 296.78318468968035,
      submentalInclination: 8.970976298492682,
      subnasaleAheadOfGlabella: -5.335249310694479,
      glabellaAheadOfNasion: 4.816016521929299,
      glabellaAboveNasion: 25.601345592422163,
      pogonionAheadOfGlabella: -19.45949263859346,
      pogonionAboveMenton: 20.10835550877054,
      tragionNasionDepth: 124.70180080931877,
      tragionSubnasaleDepth: 131.36635454994232,
      tragionGnathionDepth: 143.8177512567862,
      upperLipProtrusion: 3.6512574378629834,
      lowerLipProtrusion: 4.47169057842411,
      bitragionBreadth: 144.4564155925047,
      nasalBridgeLength: 42.70782516279823,
      tragionTopOfHead: 128.61494112622827,
      upperFacialHeight: 75.52771526340307,
      upperLipHeight: 17.15872676086289,
      bitragionCoronalArc: 358.7181942079085,
      cervicalArrowApexBehindTragion: 60.6,
      cervicalArrowApexBelowTragion: 61.19,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.31483260607769,
            palpebralFissureHeight: 9.318530166152033,
          },
          right: {
            palpebralFissureLength: 28.31483260607769,
            palpebralFissureHeight: 9.318530166152033,
          },
        },
        intercanthalWidth: 31.879649660799704,
        nose: {
          width: 33.203724566839306,
          height: 56.86020225258594,
          protrusion: 20.997734652691697,
        },
        mouth: {
          width: 48.990771523465355,
          upperVermilionHeight: 7.692239427223692,
          lowerVermilionHeight: 8.835680423162348,
        },
      },
      earPair: {
        left: {
          length: 61.901908558200006,
          breadth: 26.91811148332591,
          protrusion: 22.148096256,
        },
        right: {
          length: 61.901908558200006,
          breadth: 26.91811148332591,
          protrusion: 22.148096256,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 194.767236467,
          palmLength: 116.90336059615076,
          handBreadth: 83.45806433439999,
          thumbLength: 57.22748574971679,
        },
        right: {
          handLength: 194.767236467,
          palmLength: 116.90336059615076,
          handBreadth: 83.45806433439999,
          thumbLength: 57.22748574971679,
        },
      },
      feet: {
        left: {
          footLength: 263.5068952448,
          footBreadth: 94.2885595632,
          ankleHeight: 65.5385007522,
        },
        right: {
          footLength: 263.5068952448,
          footBreadth: 94.2885595632,
          ankleHeight: 65.5385007522,
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
        style: "bob",
        color: "darkBrown",
        length: 300,
        curl: "II",
        hairline: "bellShaped",
      },
      browPair: {
        left: {
          color: "darkBrown",
        },
        right: {
          color: "darkBrown",
        },
      },
      lashPair: {
        left: {
          color: "darkBrown",
          length: 10,
        },
        right: {
          color: "darkBrown",
          length: 10,
        },
      },
      underwear: {
        bottom: "briefs",
        top: "bra",
        color: "#6D5260",
      },
    },
  },
};
