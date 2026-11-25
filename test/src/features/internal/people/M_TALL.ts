import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-tall` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_TALL: IMotionHumanPerson = {
  mass: 92.594575576,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.47557325757755,
        stature: 1911.203082,
        chestCircumference: 1041.5351343782,
        bustPointWidth: 228.3071797456,
        underbustCircumference: 970.6844478314,
        sideNeckToBustPoint: 289.37572566740005,
        waistCircumference: 883.7493519888,
        hipCircumference: 1041.724754952,
        neckBaseCircumference: 425.19502423840004,
        neckCircumference: 393.8701033228,
        upperArmLength: 372.77352495720004,
        forearmLength: 295.18086943360004,
        elbowCircumference: 293.0752021066,
        wristCircumference: 184.1362105824,
        thighCircumference: 629.3858644976,
        kneeCircumference: 410.000619662,
        calfCircumference: 397.5190843304,
        handCircumference: 224.40377246079998,
        backNeckToWaist: 434.14626896280674,
        acrossBackShoulderWidth: 441.48614889891917,
        highHipCircumference: 940.1503538800987,
        upperArmCircumference: 354.1853996427292,
        forearmCircumference: 292.02347130191174,
        inseam: 819.7930933068959,
      },
    },
    head: {
      length: 202.79028180160003,
      cephalicIndex: 75.50097817911902,
      circumference: 579.881143596,
      height: 234.86338965196626,
      faceHeight: 131.97899088289,
      faceWidth: 143.2021205304,
      mandibularWidth: 106.53250940006266,
      minimumFrontalWidth: 113.56671337001896,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 29.360155700687127,
            palpebralFissureHeight: 8.481806486793207,
          },
          right: {
            palpebralFissureLength: 29.360155700687127,
            palpebralFissureHeight: 8.481806486793207,
          },
        },
        intercanthalWidth: 33.33601011848851,
        nose: {
          width: 36.80213961093074,
          height: 58.72650066015389,
          protrusion: 21.78898434387335,
        },
        mouth: {
          width: 51.88999740156162,
          upperVermilionHeight: 7.78178012281191,
          lowerVermilionHeight: 9.026864942461815,
        },
      },
      earPair: {
        left: {
          length: 67.16844964,
          breadth: 31.950762065111746,
          protrusion: 24.123098951,
        },
        right: {
          length: 67.16844964,
          breadth: 31.950762065111746,
          protrusion: 24.123098951,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 208.57242960000002,
          palmLength: 125.70454241282981,
          handBreadth: 94.93809782320001,
          thumbLength: 63.1443832952303,
        },
        right: {
          handLength: 208.57242960000002,
          palmLength: 125.70454241282981,
          handBreadth: 94.93809782320001,
          thumbLength: 63.1443832952303,
        },
      },
      feet: {
        left: {
          footLength: 291.0136744866,
          footBreadth: 106.44986314,
          ankleHeight: 72.8804843036,
        },
        right: {
          footLength: 291.0136744866,
          footBreadth: 106.44986314,
          ankleHeight: 72.8804843036,
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
