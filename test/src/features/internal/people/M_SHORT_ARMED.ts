import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `m-short-armed` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const M_SHORT_ARMED: IMotionHumanPerson = {
  mass: 78.36467405880832,
  params: {
    body: {
      anatomy: {
        sex: "male",
        bodyFatPercentage: 20.559279999999994,
        stature: 1755.81,
        chestCircumference: 988.5541725726794,
        bustPointWidth: 211.4716488114618,
        underbustCircumference: 926.6917917251214,
        sideNeckToBustPoint: 272.92556841619955,
        waistCircumference: 836.3742776903699,
        hipCircumference: 985.6676814256163,
        neckBaseCircumference: 409.4591623465462,
        neckCircumference: 380.60494532263345,
        upperArmLength: 317.10364636572854,
        forearmLength: 258.31474061721826,
        elbowCircumference: 278.2929213835662,
        wristCircumference: 174.51337944424833,
        thighCircumference: 597.338827062816,
        kneeCircumference: 388.0469384658385,
        calfCircumference: 381.5402093940584,
        handCircumference: 213.57226876790475,
        backNeckToWaist: 410.66367716562957,
        acrossBackShoulderWidth: 419.8733883640323,
        highHipCircumference: 882.9901522247794,
        upperArmCircumference: 342.14380276084984,
        forearmCircumference: 279.78243797768374,
        inseam: 718.131996248449,
      },
    },
    head: {
      length: 197.79564772583447,
      cephalicIndex: 76.67185318288084,
      circumference: 568.6361384592909,
      height: 226.8857785374833,
      faceHeight: 126.53537656249124,
      faceWidth: 139.80210705270545,
      mandibularWidth: 104.00313367272528,
      minimumFrontalWidth: 110.87032623102007,
      mouthOpening: 54,
      mandibularLaterotrusion: 11,
      face: {
        eyePair: {
          left: {
            palpebralFissureLength: 28.663064591143428,
            palpebralFissureHeight: 8.28042499702559,
          },
          right: {
            palpebralFissureLength: 28.663064591143428,
            palpebralFissureHeight: 8.28042499702559,
          },
        },
        intercanthalWidth: 32.54452125452744,
        nose: {
          width: 35.928355268759645,
          height: 56.3042634704167,
          protrusion: 20.890274432486763,
        },
        mouth: {
          width: 50.65798568365279,
          upperVermilionHeight: 7.460812297316701,
          lowerVermilionHeight: 8.654542264887372,
        },
      },
      earPair: {
        left: {
          length: 65.22500954785184,
          breadth: 30.81258482123803,
          protrusion: 24.225486881865137,
        },
        right: {
          length: 65.22500954785184,
          breadth: 30.81258482123803,
          protrusion: 24.225486881865137,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 189.98539172514805,
          palmLength: 114.5023183444374,
          handBreadth: 90.3577064067054,
          thumbLength: 57.51723954404768,
        },
        right: {
          handLength: 189.98539172514805,
          palmLength: 114.5023183444374,
          handBreadth: 90.3577064067054,
          thumbLength: 57.51723954404768,
        },
      },
      feet: {
        left: {
          footLength: 266.8218461084448,
          footBreadth: 100.76007789209024,
          ankleHeight: 68.13789650725337,
        },
        right: {
          footLength: 266.8218461084448,
          footBreadth: 100.76007789209024,
          ankleHeight: 68.13789650725337,
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
