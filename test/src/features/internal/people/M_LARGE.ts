import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-large`, the tallest and heaviest man (1.91 m, 118 kg), of the ANSUR 1988
 * boundary population: the Human parameters (millimetres) and the surveyed mass
 * (kilograms) of `HumanPopulation.params(end)` and
 * `HumanPopulation.measures(end).mass` of the motions package's capture harness
 * for this end of its sweep.
 */
export const M_LARGE: IMotionHumanPerson = {
  mass: 118.34129140566047,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 28.933996479999998,
        stature: 1911.203082,
        chestCircumference: 1205.7013897261647,
        bustPointWidth: 258.62453042117795,
        underbustCircumference: 1111.1524089395416,
        sideNeckToBustPoint: 317.2464782830433,
        waistCircumference: 1029.7694119811185,
        hipCircumference: 1177.0382730109927,
        neckBaseCircumference: 465.88110289807764,
        neckCircumference: 437.5068788545477,
        upperArmLength: 375.3424192157138,
        forearmLength: 300.2317944869119,
        elbowCircumference: 334.0047544655746,
        wristCircumference: 198.96602005618547,
        thighCircumference: 749.8590274277358,
        kneeCircumference: 453.9088510487625,
        calfCircumference: 452.3110280954363,
        handCircumference: 239.7189280370917,
        backNeckToWaist: 428.10559320552903,
        acrossBackShoulderWidth: 457.4998697124599,
        highHipCircumference: 1096.4302168771467,
        upperArmCircumference: 450.6665140477259,
        forearmCircumference: 341.6837571656412,
        inseam: 814.8192334418127,
      },
    },
    head: {
      length: 206.91517833622112,
      cephalicIndex: 76.2674799361338,
      circumference: 595.9118522364407,
      height: 240.38764609606537,
      faceHeight: 135.41050651032447,
      faceWidth: 150.32137217379605,
      mandibularWidth: 111.82874202435883,
      minimumFrontalWidth: 119.2126493924744,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 30.81978727561277,
            palpebralFissureHeight: 8.903477021743496,
          },
          right: {
            palpebralFissureLength: 30.81978727561277,
            palpebralFissureHeight: 8.903477021743496,
          },
        },
        intercanthalWidth: 34.993300135852,
        nose: {
          width: 38.63174724477851,
          height: 60.253417205065766,
          protrusion: 22.355508150289417,
        },
        mouth: {
          width: 54.46969348363507,
          upperVermilionHeight: 7.984110053674792,
          lowerVermilionHeight: 9.261567662262758,
        },
      },
      earPair: {
        left: {
          length: 67.43787138374701,
          breadth: 32.657919161346406,
          protrusion: 23.411369201599936,
        },
        right: {
          length: 67.43787138374701,
          breadth: 32.657919161346406,
          protrusion: 23.411369201599936,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 214.6774177603804,
          palmLength: 129.38395845361777,
          handBreadth: 100.5632398919422,
          thumbLength: 64.99264153890711,
        },
        right: {
          handLength: 214.6774177603804,
          palmLength: 129.38395845361777,
          handBreadth: 100.5632398919422,
          thumbLength: 64.99264153890711,
        },
      },
      feet: {
        left: {
          footLength: 299.02405761168,
          footBreadth: 112.64288188033971,
          ankleHeight: 73.53612764821608,
        },
        right: {
          footLength: 299.02405761168,
          footBreadth: 112.64288188033971,
          ankleHeight: 73.53612764821608,
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
