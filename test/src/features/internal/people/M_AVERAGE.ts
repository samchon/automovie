import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-average`, the average man (1.75 m), of the ANSUR 1988 boundary population:
 * the Human parameters (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_AVERAGE: IMotionHumanPerson = {
  mass: 78.36467405880832,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.559279999999994,
        stature: 1755.81,
        chestCircumference: 990.5901465779621,
        bustPointWidth: 215.73235304264873,
        underbustCircumference: 925.38860836088,
        sideNeckToBustPoint: 272.2770176221457,
        waistCircumference: 839.0565331114228,
        hipCircumference: 982.954080907526,
        neckBaseCircumference: 408.1982029178129,
        neckCircumference: 379.38614941847834,
        upperArmLength: 340.7917082825057,
        forearmLength: 269.8405854786128,
        elbowCircumference: 276.9298855439492,
        wristCircumference: 174.1503164011807,
        thighCircumference: 595.9252545024955,
        kneeCircumference: 386.1388911309809,
        calfCircumference: 377.8020688495041,
        handCircumference: 213.73593907399092,
        backNeckToWaist: 402.7928348250569,
        acrossBackShoulderWidth: 419.89493151659997,
        highHipCircumference: 882.4187585115811,
        upperArmCircumference: 340.26038771900136,
        forearmCircumference: 279.278306566314,
        inseam: 739.001905967114,
      },
    },
    head: {
      length: 197.08940681563743,
      cephalicIndex: 76.94863937412545,
      circumference: 567.5807214442372,
      height: 227.17947006126812,
      faceHeight: 127.18737505634495,
      faceWidth: 140.43651381001175,
      mandibularWidth: 104.4750885822327,
      minimumFrontalWidth: 111.37344371349975,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.79313446094069,
            palpebralFissureHeight: 8.318000665105474,
          },
          right: {
            palpebralFissureLength: 28.79313446094069,
            palpebralFissureHeight: 8.318000665105474,
          },
        },
        intercanthalWidth: 32.69220475252641,
        nose: {
          width: 36.09139423749857,
          height: 56.59438229708431,
          protrusion: 20.997915693264495,
        },
        mouth: {
          width: 50.887866113259754,
          upperVermilionHeight: 7.4992556047373204,
          lowerVermilionHeight: 8.69913650149529,
        },
      },
      earPair: {
        left: {
          length: 64.65808772022231,
          breadth: 30.82149771513013,
          protrusion: 24.197863655415002,
        },
        right: {
          length: 64.65808772022231,
          breadth: 30.82149771513013,
          protrusion: 24.197863655415002,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 193.76460012842617,
          palmLength: 116.7800099066821,
          handBreadth: 90.41047000606729,
          thumbLength: 58.66137822252405,
        },
        right: {
          handLength: 193.76460012842617,
          palmLength: 116.7800099066821,
          handBreadth: 90.41047000606729,
          thumbLength: 58.66137822252405,
        },
      },
      feet: {
        left: {
          footLength: 269.65263975686554,
          footBreadth: 100.59439032671055,
          ankleHeight: 67.06258529792082,
        },
        right: {
          footLength: 269.65263975686554,
          footBreadth: 100.59439032671055,
          ankleHeight: 67.06258529792082,
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
