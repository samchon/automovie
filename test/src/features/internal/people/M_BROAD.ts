import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-broad` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_BROAD: IMotionHumanPerson = {
  mass: 78.36467405880832,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.559279999999994,
        stature: 1755.81,
        chestCircumference: 997.7246412976748,
        bustPointWidth: 217.1368258662694,
        underbustCircumference: 926.7832886370294,
        sideNeckToBustPoint: 273.19568256359537,
        waistCircumference: 834.7356420563989,
        hipCircumference: 979.575178457152,
        neckBaseCircumference: 414.0797984827861,
        neckCircumference: 383.3064121793597,
        upperArmLength: 340.8056339417977,
        forearmLength: 272.03858112556014,
        elbowCircumference: 277.42774551723335,
        wristCircumference: 175.21244808258024,
        thighCircumference: 592.1859266523688,
        kneeCircumference: 385.08071231909776,
        calfCircumference: 378.49077242175264,
        handCircumference: 215.42759274502822,
        backNeckToWaist: 406.4148920467112,
        acrossBackShoulderWidth: 456.5406314583311,
        highHipCircumference: 869.4974852074135,
        upperArmCircumference: 341.8600728384297,
        forearmCircumference: 280.9909295468791,
        inseam: 738.2094074284514,
      },
    },
    head: {
      length: 197.21873653698105,
      cephalicIndex: 77.20782146408428,
      circumference: 568.825760655866,
      height: 228.32751245998384,
      faceHeight: 128.26980281857414,
      faceWidth: 141.42874253929935,
      mandibularWidth: 105.21323838084135,
      minimumFrontalWidth: 112.16033258971987,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.996567132710343,
            palpebralFissureHeight: 8.376769990875811,
          },
          right: {
            palpebralFissureLength: 28.996567132710343,
            palpebralFissureHeight: 8.376769990875811,
          },
        },
        intercanthalWidth: 32.9231855985982,
        nose: {
          width: 36.34639144065429,
          height: 57.07602861266743,
          protrusion: 21.176618389858938,
        },
        mouth: {
          width: 51.24740510607487,
          upperVermilionHeight: 7.563077996378192,
          lowerVermilionHeight: 8.773170475798702,
        },
      },
      earPair: {
        left: {
          length: 64.60436216108013,
          breadth: 30.957242089248286,
          protrusion: 24.285295168966673,
        },
        right: {
          length: 64.60436216108013,
          breadth: 30.957242089248286,
          protrusion: 24.285295168966673,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 196.09497419784282,
          palmLength: 118.18450333186078,
          handBreadth: 91.11940551072134,
          thumbLength: 59.3668886955176,
        },
        right: {
          handLength: 196.09497419784282,
          palmLength: 118.18450333186078,
          handBreadth: 91.11940551072134,
          thumbLength: 59.3668886955176,
        },
      },
      feet: {
        left: {
          footLength: 271.9122978440532,
          footBreadth: 101.12782889217178,
          ankleHeight: 65.85967292621501,
        },
        right: {
          footLength: 271.9122978440532,
          footBreadth: 101.12782889217178,
          ankleHeight: 65.85967292621501,
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
        style: "short",
        color: "black",
        length: 100,
        curl: "II",
        hairline: "rectangular",
      },
      browPair: {
        left: {
          color: "black",
        },
        right: {
          color: "black",
        },
      },
      lashPair: {
        left: {
          color: "black",
          length: 8,
        },
        right: {
          color: "black",
          length: 8,
        },
      },
      underwear: {
        bottom: "boxerBriefs",
        top: "none",
        color: "#3D454B",
      },
    },
  },
};
