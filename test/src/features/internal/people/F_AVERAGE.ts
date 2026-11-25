import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `f-average`, the average woman, of the ANSUR 1988 boundary population: the
 * Human parameters (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const F_AVERAGE: IMotionHumanPerson = {
  mass: 61.95270373127933,
  params: {
    body: {
      anatomy: {
        sex: "female",
        bodyFatPercentage: 28.628840000000004,
        stature: 1629.37,
        chestCircumference: 906.6636898851007,
        bustPointWidth: 184.75794407615308,
        underbustCircumference: 769.3545349635383,
        sideNeckToBustPoint: 267.8755956048649,
        waistCircumference: 725.0895034398546,
        hipCircumference: 966.4850109331435,
        neckBaseCircumference: 346.09534300417045,
        neckCircumference: 315.6210547517354,
        upperArmLength: 311.872900930093,
        forearmLength: 243.4383988192885,
        elbowCircumference: 238.19908927274494,
        wristCircumference: 151.20260095005727,
        thighCircumference: 579.950432260829,
        kneeCircumference: 365.0315830590838,
        calfCircumference: 352.24750896825657,
        handCircumference: 186.1265237456922,
        backNeckToWaist: 366.9625738479911,
        acrossBackShoulderWidth: 390.1574898981086,
        highHipCircumference: 908.151271626748,
        upperArmCircumference: 285.282651505327,
        forearmCircumference: 242.71624673135472,
        inseam: 702.8691354517648,
      },
    },
    head: {
      length: 187.21132457356282,
      cephalicIndex: 77.1479512952107,
      circumference: 546.1960182396222,
      height: 225.57082638080982,
      faceHeight: 118.59209643004034,
      faceWidth: 131.28463825606795,
      mandibularWidth: 96.98865126305095,
      minimumFrontalWidth: 105.48765678610181,
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
            palpebralFissureLength: 27.79674747538986,
            palpebralFissureHeight: 9.148026176737204,
          },
          right: {
            palpebralFissureLength: 27.79674747538986,
            palpebralFissureHeight: 9.148026176737204,
          },
        },
        intercanthalWidth: 31.29633798488139,
        nose: {
          width: 32.596185888406815,
          height: 54.696354761578476,
          protrusion: 20.198653860765724,
        },
        mouth: {
          width: 48.09437243044073,
          upperVermilionHeight: 7.3995068598844735,
          lowerVermilionHeight: 8.499433555272706,
        },
      },
      earPair: {
        left: {
          length: 59.764192302349294,
          breadth: 26.05192673864053,
          protrusion: 21.817838386145926,
        },
        right: {
          length: 59.764192302349294,
          breadth: 26.05192673864053,
          protrusion: 21.817838386145926,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 180.4513440288527,
          palmLength: 108.31066314708056,
          handBreadth: 79.40120239122662,
          thumbLength: 53.02111847070391,
        },
        right: {
          handLength: 180.4513440288527,
          palmLength: 108.31066314708056,
          handBreadth: 79.40120239122662,
          thumbLength: 53.02111847070391,
        },
      },
      feet: {
        left: {
          footLength: 244.36402380659706,
          footBreadth: 89.6559829675184,
          ankleHeight: 60.619169916034075,
        },
        right: {
          footLength: 244.36402380659706,
          footBreadth: 89.6559829675184,
          ankleHeight: 60.619169916034075,
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
