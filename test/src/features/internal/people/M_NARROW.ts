import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-narrow` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_NARROW: IMotionHumanPerson = {
  mass: 78.36467405880832,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.559279999999994,
        stature: 1755.81,
        chestCircumference: 983.4556518582493,
        bustPointWidth: 214.3278802190281,
        underbustCircumference: 923.9939280847307,
        sideNeckToBustPoint: 271.3583526806961,
        waistCircumference: 843.3774241664468,
        hipCircumference: 986.3329833579,
        neckBaseCircumference: 402.3166073528398,
        neckCircumference: 375.46588665759697,
        upperArmLength: 340.7777826232137,
        forearmLength: 267.64258983166553,
        elbowCircumference: 276.432025570665,
        wristCircumference: 173.08818471978114,
        thighCircumference: 599.6645823526222,
        kneeCircumference: 387.19706994286406,
        calfCircumference: 377.1133652772555,
        handCircumference: 212.0442854029536,
        backNeckToWaist: 399.1707776034026,
        acrossBackShoulderWidth: 383.2492315748688,
        highHipCircumference: 895.3400318157488,
        upperArmCircumference: 338.660702599573,
        forearmCircumference: 277.5656835857488,
        inseam: 739.7944045057766,
      },
    },
    head: {
      length: 196.9600770942938,
      cephalicIndex: 76.6891169111533,
      circumference: 566.3356822326083,
      height: 226.0314276625524,
      faceHeight: 126.10494729411576,
      faceWidth: 139.44428508072417,
      mandibularWidth: 103.73693878362408,
      minimumFrontalWidth: 110.58655483727965,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.58970178917104,
            palpebralFissureHeight: 8.259231339335138,
          },
          right: {
            palpebralFissureLength: 28.58970178917104,
            palpebralFissureHeight: 8.259231339335138,
          },
        },
        intercanthalWidth: 32.46122390645462,
        nose: {
          width: 35.836397034342866,
          height: 56.112735981501196,
          protrusion: 20.819212996670053,
        },
        mouth: {
          width: 50.52832712044465,
          upperVermilionHeight: 7.435433213096448,
          lowerVermilionHeight: 8.62510252719188,
        },
      },
      earPair: {
        left: {
          length: 64.71181327936449,
          breadth: 30.685753341011964,
          protrusion: 24.110432141863335,
        },
        right: {
          length: 64.71181327936449,
          breadth: 30.685753341011964,
          protrusion: 24.110432141863335,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 191.4342260590095,
          palmLength: 115.3755164815034,
          handBreadth: 89.70153450141322,
          thumbLength: 57.95586774953048,
        },
        right: {
          handLength: 191.4342260590095,
          palmLength: 115.3755164815034,
          handBreadth: 89.70153450141322,
          thumbLength: 57.95586774953048,
        },
      },
      feet: {
        left: {
          footLength: 267.3929816696779,
          footBreadth: 100.06095176124933,
          ankleHeight: 68.26549766962663,
        },
        right: {
          footLength: 267.3929816696779,
          footBreadth: 100.06095176124933,
          ankleHeight: 68.26549766962663,
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
