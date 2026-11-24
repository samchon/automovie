import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `f-long-legged` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const F_LONG_LEGGED: IMotionHumanPerson = {
  mass: 61.95270373127933,
  params: {
    body: {
      anatomy: {
        sex: "female",
        bodyFatPercentage: 28.628840000000004,
        stature: 1629.37,
        chestCircumference: 900.4114423956751,
        bustPointWidth: 186.68947748223022,
        underbustCircumference: 758.0155351269998,
        sideNeckToBustPoint: 262.9535127269894,
        waistCircumference: 727.0639328884113,
        hipCircumference: 954.5715754301607,
        neckBaseCircumference: 346.0664415174987,
        neckCircumference: 315.2854966869503,
        upperArmLength: 323.76433038570076,
        forearmLength: 261.00052453628734,
        elbowCircumference: 237.80627020068056,
        wristCircumference: 151.010912295833,
        thighCircumference: 582.9642196440027,
        kneeCircumference: 367.21283392079977,
        calfCircumference: 348.7404321444836,
        handCircumference: 187.64544316992811,
        backNeckToWaist: 347.5996825416861,
        acrossBackShoulderWidth: 391.06372179476335,
        highHipCircumference: 903.0956227089617,
        upperArmCircumference: 286.45337583233425,
        forearmCircumference: 244.54966833526288,
        inseam: 752.9271710989174,
      },
    },
    head: {
      length: 187.7290368375142,
      cephalicIndex: 76.49524656884431,
      circumference: 547.4644582336485,
      height: 226.1368428481614,
      faceHeight: 118.86227502217996,
      faceWidth: 131.99762611507256,
      mandibularWidth: 97.51538258310767,
      minimumFrontalWidth: 106.06054497441092,
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
            palpebralFissureLength: 27.94770758567416,
            palpebralFissureHeight: 9.197707782174911,
          },
          right: {
            palpebralFissureLength: 27.94770758567416,
            palpebralFissureHeight: 9.197707782174911,
          },
        },
        intercanthalWidth: 31.466303864446083,
        nose: {
          width: 32.77321105370423,
          height: 54.82096495542365,
          protrusion: 20.244670787926097,
        },
        mouth: {
          width: 48.35556600255133,
          upperVermilionHeight: 7.416364546071938,
          lowerVermilionHeight: 8.51879711373128,
        },
      },
      earPair: {
        left: {
          length: 58.23856072670647,
          breadth: 26.353648711519252,
          protrusion: 20.778910149449796,
        },
        right: {
          length: 58.23856072670647,
          breadth: 26.353648711519252,
          protrusion: 20.778910149449796,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 188.09433920576302,
          palmLength: 112.89814838026749,
          handBreadth: 80.02356357889317,
          thumbLength: 55.266821626459766,
        },
        right: {
          handLength: 188.09433920576302,
          palmLength: 112.89814838026749,
          handBreadth: 80.02356357889317,
          thumbLength: 55.266821626459766,
        },
      },
      feet: {
        left: {
          footLength: 252.4487852401113,
          footBreadth: 90.40803367379908,
          ankleHeight: 58.816580967556334,
        },
        right: {
          footLength: 252.4487852401113,
          footBreadth: 90.40803367379908,
          ankleHeight: 58.816580967556334,
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
