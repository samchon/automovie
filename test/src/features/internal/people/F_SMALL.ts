import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `f-small`, the shortest and lightest woman (1.48 m, 38 kg), of the ANSUR 1988
 * boundary population: the Human parameters (millimetres) and the surveyed mass
 * (kilograms) of `HumanPopulation.params(end)` and
 * `HumanPopulation.measures(end).mass` of the motions package's capture harness
 * for this end of its sweep.
 */
export const F_SMALL: IMotionHumanPerson = {
  mass: 37.69078758176998,
  params: {
    body: {
      anatomy: {
        sex: "female",
        bodyFatPercentage: 21.234951199999998,
        stature: 1481.427096,
        chestCircumference: 777.6038536479608,
        bustPointWidth: 166.50380313784302,
        underbustCircumference: 660.2944690422605,
        sideNeckToBustPoint: 232.5525758994283,
        waistCircumference: 599.7169332595683,
        hipCircumference: 825.1259593622111,
        neckBaseCircumference: 312.09022950608977,
        neckCircumference: 283.9053262901891,
        upperArmLength: 284.5191204678296,
        forearmLength: 222.15101959290598,
        elbowCircumference: 201,
        wristCircumference: 135.42727436540156,
        thighCircumference: 473.90530499528387,
        kneeCircumference: 310.5708724732466,
        calfCircumference: 302.8665205220529,
        handCircumference: 170.05870878464572,
        backNeckToWaist: 342.243528934759,
        acrossBackShoulderWidth: 360.6780081657438,
        highHipCircumference: 739.1554135744997,
        upperArmCircumference: 210.99475419205808,
        forearmCircumference: 204.6433789767227,
        inseam: 640,
      },
    },
    head: {
      length: 179.92496613697384,
      cephalicIndex: 78.42379179127222,
      circumference: 527.2231895549053,
      height: 214.58624194456758,
      faceHeight: 111.77117769771799,
      faceWidth: 125.3414693202867,
      mandibularWidth: 92.59803902564973,
      minimumFrontalWidth: 100.71230017738192,
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
            palpebralFissureLength: 26.538407060959408,
            palpebralFissureHeight: 8.733901068731392,
          },
          right: {
            palpebralFissureLength: 26.538407060959408,
            palpebralFissureHeight: 8.733901068731392,
          },
        },
        intercanthalWidth: 29.879573417555015,
        nose: {
          width: 31.120578064290527,
          height: 51.550450422134695,
          protrusion: 19.03691222170239,
        },
        mouth: {
          width: 45.917171929213936,
          upperVermilionHeight: 6.9739183386434505,
          lowerVermilionHeight: 8.010581875468828,
        },
      },
      earPair: {
        left: {
          length: 56.60205518725606,
          breadth: 24.707835345011162,
          protrusion: 21.200462052958855,
        },
        right: {
          length: 56.60205518725606,
          breadth: 24.707835345011162,
          protrusion: 21.200462052958855,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 165.4848210842938,
          palmLength: 99.32744368781191,
          handBreadth: 72.80310561553738,
          thumbLength: 48.62357967481062,
        },
        right: {
          handLength: 165.4848210842938,
          palmLength: 99.32744368781191,
          handBreadth: 72.80310561553738,
          thumbLength: 48.62357967481062,
        },
      },
      feet: {
        left: {
          footLength: 223.93441110466225,
          footBreadth: 81.94893231048421,
          ankleHeight: 55.98661135504137,
        },
        right: {
          footLength: 223.93441110466225,
          footBreadth: 81.94893231048421,
          ankleHeight: 55.98661135504137,
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
