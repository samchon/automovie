import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-short-legged` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_SHORT_LEGGED: IMotionHumanPerson = {
  mass: 78.36467405880832,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.559279999999994,
        stature: 1755.81,
        chestCircumference: 995.916032757309,
        bustPointWidth: 216.46482402936385,
        underbustCircumference: 937.3607816849527,
        sideNeckToBustPoint: 278.6396978242677,
        waistCircumference: 850.8788702749401,
        hipCircumference: 989.0781884859759,
        neckBaseCircumference: 410.9373384644492,
        neckCircumference: 381.49923278827583,
        upperArmLength: 330.50123049809355,
        forearmLength: 255.43603064662125,
        elbowCircumference: 275.36898286478885,
        wristCircumference: 175.25506596285038,
        thighCircumference: 591.3626522396555,
        kneeCircumference: 386.7548909344004,
        calfCircumference: 378.4191557038481,
        handCircumference: 213.1933560385663,
        backNeckToWaist: 423.38074413622854,
        acrossBackShoulderWidth: 420.49944630671416,
        highHipCircumference: 907.0337315984946,
        upperArmCircumference: 332.11589390555446,
        forearmCircumference: 275.1450318624494,
        inseam: 690.960627032316,
      },
    },
    head: {
      length: 197.25581719949156,
      cephalicIndex: 77.15181976549464,
      circumference: 568.6715364552964,
      height: 226.0970261724181,
      faceHeight: 126.02050388557758,
      faceWidth: 140.33616044160226,
      mandibularWidth: 104.40043259163834,
      minimumFrontalWidth: 111.29385828429197,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.77255941281516,
            palpebralFissureHeight: 8.312056773716195,
          },
          right: {
            palpebralFissureLength: 28.77255941281516,
            palpebralFissureHeight: 8.312056773716195,
          },
        },
        intercanthalWidth: 32.66884349996721,
        nose: {
          width: 36.06560398620233,
          height: 56.075161320154805,
          protrusion: 20.80527186790196,
        },
        mouth: {
          width: 50.85150257334345,
          upperVermilionHeight: 7.430454238536414,
          lowerVermilionHeight: 8.61932691670224,
        },
      },
      earPair: {
        left: {
          length: 67.26759033033562,
          breadth: 31.0346783847471,
          protrusion: 25.44145442724148,
        },
        right: {
          length: 67.26759033033562,
          breadth: 31.0346783847471,
          protrusion: 25.44145442724148,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 187.56100603101297,
          palmLength: 113.04116504197108,
          handBreadth: 90.0840404123494,
          thumbLength: 56.78326746624465,
        },
        right: {
          handLength: 187.56100603101297,
          palmLength: 113.04116504197108,
          handBreadth: 90.0840404123494,
          thumbLength: 56.78326746624465,
        },
      },
      feet: {
        left: {
          footLength: 262.90939521959774,
          footBreadth: 99.71062057432346,
          ankleHeight: 68.17843550528997,
        },
        right: {
          footLength: 262.90939521959774,
          footBreadth: 99.71062057432346,
          ankleHeight: 68.17843550528997,
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
