import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-long-armed` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_LONG_ARMED: IMotionHumanPerson = {
  mass: 78.36467405880832,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.559279999999994,
        stature: 1755.81,
        chestCircumference: 992.6261205832446,
        bustPointWidth: 219.99305727383566,
        underbustCircumference: 924.0854249966386,
        sideNeckToBustPoint: 271.6284668280919,
        waistCircumference: 841.7387885324756,
        hipCircumference: 980.2404803894357,
        neckBaseCircumference: 406.9372434890797,
        neckCircumference: 378.16735351432317,
        upperArmLength: 364.4797701992828,
        forearmLength: 281.3664303400074,
        elbowCircumference: 275.5668497043322,
        wristCircumference: 173.78725335811305,
        thighCircumference: 594.5116819421751,
        kneeCircumference: 384.23084379612334,
        calfCircumference: 374.06392830494974,
        handCircumference: 213.8996093800771,
        backNeckToWaist: 394.92199248448424,
        acrossBackShoulderWidth: 419.9164746691676,
        highHipCircumference: 881.8473647983828,
        upperArmCircumference: 338.3769726771528,
        forearmCircumference: 278.77417515494415,
        inseam: 759.8718156857789,
      },
    },
    head: {
      length: 196.3831659054404,
      cephalicIndex: 77.22741634427143,
      circumference: 566.5253044291834,
      height: 227.47316158505296,
      faceHeight: 127.83937355019867,
      faceWidth: 141.07092056731807,
      mandibularWidth: 104.94704349174013,
      minimumFrontalWidth: 111.87656119597945,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.923204330737953,
            palpebralFissureHeight: 8.35557633318536,
          },
          right: {
            palpebralFissureLength: 28.923204330737953,
            palpebralFissureHeight: 8.35557633318536,
          },
        },
        intercanthalWidth: 32.839888250525384,
        nose: {
          width: 36.2544332062375,
          height: 56.884501123751924,
          protrusion: 21.105556954042235,
        },
        mouth: {
          width: 51.117746542866726,
          upperVermilionHeight: 7.537698912157941,
          lowerVermilionHeight: 8.74373073810321,
        },
      },
      earPair: {
        left: {
          length: 64.09116589259278,
          breadth: 30.83041060902222,
          protrusion: 24.170240428964867,
        },
        right: {
          length: 64.09116589259278,
          breadth: 30.83041060902222,
          protrusion: 24.170240428964867,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 197.54380853170426,
          palmLength: 119.05770146892678,
          handBreadth: 90.46323360542917,
          thumbLength: 59.8055169010004,
        },
        right: {
          handLength: 197.54380853170426,
          palmLength: 119.05770146892678,
          handBreadth: 90.46323360542917,
          thumbLength: 59.8055169010004,
        },
      },
      feet: {
        left: {
          footLength: 272.4834334052863,
          footBreadth: 100.42870276133087,
          ankleHeight: 65.98727408858826,
        },
        right: {
          footLength: 272.4834334052863,
          footBreadth: 100.42870276133087,
          ankleHeight: 65.98727408858826,
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
