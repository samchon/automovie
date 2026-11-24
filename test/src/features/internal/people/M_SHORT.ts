import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-short` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_SHORT: IMotionHumanPerson = {
  mass: 64.38542442399999,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.220945264777683,
        stature: 1600.416918,
        chestCircumference: 941.2048656218,
        bustPointWidth: 203.4528202544,
        underbustCircumference: 881.5555521686,
        sideNeckToBustPoint: 255.4642743326,
        waistCircumference: 796.0706480112,
        hipCircumference: 925.6152450479999,
        neckBaseCircumference: 391.54497576159997,
        neckCircumference: 365.2698966772,
        upperArmLength: 308.84647504279997,
        forearmLength: 244.5191305664,
        elbowCircumference: 261.0847978934,
        wristCircumference: 164.28378941760002,
        thighCircumference: 563.6341355024,
        kneeCircumference: 362.719380338,
        calfCircumference: 358.6009156696,
        handCircumference: 203.1762275392,
        backNeckToWaist: 371.4378569863827,
        acrossBackShoulderWidth: 398.44440402431104,
        highHipCircumference: 826.6759748683666,
        upperArmCircumference: 326.9093292112337,
        forearmCircumference: 266.85882620666774,
        inseam: 658.0607875308522,
      },
    },
    head: {
      length: 191.4297181984,
      cephalicIndex: 78.48904287257935,
      circumference: 555.4388564039999,
      height: 219.54169600803715,
      faceHeight: 122.42100911711,
      faceWidth: 137.7378794696,
      mandibularWidth: 102.46749059993734,
      minimumFrontalWidth: 109.23328662998105,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.239844299312875,
            palpebralFissureHeight: 8.158161591709012,
          },
          right: {
            palpebralFissureLength: 28.239844299312875,
            palpebralFissureHeight: 8.158161591709012,
          },
        },
        intercanthalWidth: 32.063989881511496,
        nose: {
          width: 35.397860389069265,
          height: 54.473499339846114,
          protrusion: 20.21101565612665,
        },
        mouth: {
          width: 49.910002598438375,
          upperVermilionHeight: 7.21821987718809,
          lowerVermilionHeight: 8.373135057538184,
        },
      },
      earPair: {
        left: {
          length: 62.17155036,
          breadth: 29.70053563231749,
          protrusion: 24.276901049,
        },
        right: {
          length: 62.17155036,
          breadth: 29.70053563231749,
          protrusion: 24.276901049,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 178.98757039999998,
          palmLength: 107.87404010139679,
          handBreadth: 85.9219021768,
          thumbLength: 54.18769763623454,
        },
        right: {
          handLength: 178.98757039999998,
          palmLength: 107.87404010139679,
          handBreadth: 85.9219021768,
          thumbLength: 54.18769763623454,
        },
      },
      feet: {
        left: {
          footLength: 248.3463255134,
          footBreadth: 94.79013686,
          ankleHeight: 61.25951569639999,
        },
        right: {
          footLength: 248.3463255134,
          footBreadth: 94.79013686,
          ankleHeight: 61.25951569639999,
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
