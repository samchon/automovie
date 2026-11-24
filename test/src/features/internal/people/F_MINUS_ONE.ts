import type { IMotionHumanPerson } from "./IMotionHumanPerson";

/**
 * `f-minus-one` of the ANSUR 1988 boundary population: the Human parameters
 * (millimetres) and the surveyed mass (kilograms) of
 * `HumanPopulation.params(end)` and `HumanPopulation.measures(end).mass` of the
 * motions package's capture harness for this end of its sweep.
 */
export const F_MINUS_ONE: IMotionHumanPerson = {
  mass: 50.715992963731324,
  params: {
    body: {
      anatomy: {
        sex: "female",
        bodyFatPercentage: 25.450039999999994,
        stature: 1565.7659999999998,
        chestCircumference: 845.8040221296076,
        bustPointWidth: 175.86836658665572,
        underbustCircumference: 718.8483167126559,
        sideNeckToBustPoint: 251.91642770585034,
        waistCircumference: 664.8644735588368,
        hipCircumference: 901.8930452190505,
        neckBaseCircumference: 329.97738179825814,
        neckCircumference: 300.35560476055866,
        upperArmLength: 298.709198852326,
        forearmLength: 232.39599645680832,
        elbowCircumference: 219.53199855738816,
        wristCircumference: 143.45995775419783,
        thighCircumference: 530.4074071510282,
        kneeCircumference: 338.8472375195305,
        calfCircumference: 329.0955196793465,
        handCircumference: 178.2210707226412,
        backNeckToWaist: 358.00109610719477,
        acrossBackShoulderWidth: 376.91177012089565,
        highHipCircumference: 828.1191760953869,
        upperArmCircumference: 251.13973998175948,
        forearmCircumference: 223.6719128498129,
        inseam: 671.5386862317247,
      },
    },
    head: {
      length: 183.91185641672098,
      cephalicIndex: 77.69146265822062,
      circumference: 537.4549139490507,
      height: 220.54222657971636,
      faceHeight: 115.44892163587933,
      faceWidth: 128.38774790142747,
      mandibularWidth: 94.84852662938663,
      minimumFrontalWidth: 103.15999545773494,
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
            palpebralFissureLength: 27.183392168009778,
            palpebralFissureHeight: 8.946168372599455,
          },
          right: {
            palpebralFissureLength: 27.183392168009778,
            palpebralFissureHeight: 8.946168372599455,
          },
        },
        intercanthalWidth: 30.605761685564964,
        nose: {
          width: 31.876927506371178,
          height: 53.24667802261889,
          protrusion: 19.663307057713006,
        },
        mouth: {
          width: 47.033135369829864,
          upperVermilionHeight: 7.203389714211696,
          lowerVermilionHeight: 8.27416386091884,
        },
      },
      earPair: {
        left: {
          length: 58.42208864237479,
          breadth: 25.407489918289148,
          protrusion: 21.563668181782734,
        },
        right: {
          length: 58.42208864237479,
          breadth: 25.407489918289148,
          protrusion: 21.563668181782734,
        },
      },
    },
    extremities: {
      hands: {
        left: {
          handLength: 172.8799450225113,
          palmLength: 103.76615142985632,
          handBreadth: 76.17980585791456,
          thumbLength: 50.79645206068255,
        },
        right: {
          handLength: 172.8799450225113,
          palmLength: 103.76615142985632,
          handBreadth: 76.17980585791456,
          thumbLength: 50.79645206068255,
        },
      },
      feet: {
        left: {
          footLength: 234.3028489609286,
          footBreadth: 85.9541715344222,
          ankleHeight: 58.63552020645575,
        },
        right: {
          footLength: 234.3028489609286,
          footBreadth: 85.9541715344222,
          ankleHeight: 58.63552020645575,
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
