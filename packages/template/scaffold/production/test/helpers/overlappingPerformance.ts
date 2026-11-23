import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanParameters,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  createHumanBody,
} from "@automovie/motions";

/**
 * An average adult man's Human parameters, millimetres and degrees as the Human
 * package reads them.
 */
const PARAMETERS: IAutoMovieHumanParameters = {
  body: {
    anatomy: {
      sex: "male",
      bodyFatPercentage: 20.559,
      stature: 1755.81,
      chestCircumference: 990.59,
      bustPointWidth: 215.732,
      underbustCircumference: 925.389,
      sideNeckToBustPoint: 272.277,
      waistCircumference: 839.057,
      hipCircumference: 982.954,
      neckBaseCircumference: 408.198,
      neckCircumference: 379.386,
      upperArmLength: 340.792,
      forearmLength: 269.841,
      elbowCircumference: 276.93,
      wristCircumference: 174.15,
      thighCircumference: 595.925,
      kneeCircumference: 386.139,
      calfCircumference: 377.802,
      handCircumference: 213.736,
      backNeckToWaist: 402.793,
      acrossBackShoulderWidth: 419.895,
      highHipCircumference: 882.419,
      upperArmCircumference: 340.26,
      forearmCircumference: 279.278,
      inseam: 739.002,
    },
  },
  head: {
    length: 197.089,
    cephalicIndex: 76.949,
    circumference: 567.581,
    height: 227.179,
    faceHeight: 127.187,
    faceWidth: 140.437,
    mandibularWidth: 104.475,
    minimumFrontalWidth: 111.373,
    mouthOpening: 54,
    mandibularLaterotrusion: 11,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 28.793,
          palpebralFissureHeight: 8.318,
        },
        right: {
          palpebralFissureLength: 28.793,
          palpebralFissureHeight: 8.318,
        },
      },
      intercanthalWidth: 32.692,
      nose: {
        width: 36.091,
        height: 56.594,
        protrusion: 20.998,
      },
      mouth: {
        width: 50.888,
        upperVermilionHeight: 7.499,
        lowerVermilionHeight: 8.699,
      },
    },
    earPair: {
      left: {
        length: 64.658,
        breadth: 30.821,
        protrusion: 24.198,
      },
      right: {
        length: 64.658,
        breadth: 30.821,
        protrusion: 24.198,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        handLength: 193.765,
        palmLength: 116.78,
        handBreadth: 90.41,
        thumbLength: 58.661,
      },
      right: {
        handLength: 193.765,
        palmLength: 116.78,
        handBreadth: 90.41,
        thumbLength: 58.661,
      },
    },
    feet: {
      left: {
        footLength: 269.653,
        footBreadth: 100.594,
        ankleHeight: 67.063,
      },
      right: {
        footLength: 269.653,
        footBreadth: 100.594,
        ankleHeight: 67.063,
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
} as IAutoMovieHumanParameters;

/**
 * A performance of two average men who stand for one second on one floor point,
 * so their bodies occupy the same space and the verdict report holds one
 * partner finding.
 *
 * @param subjects The two performers' subjects.
 * @returns The performance.
 * @evidence contracts/development/common.md#meaningful-documentation States what the performance holds and the one violation it plants.
 * @evidence contracts/development/implementation.md#principled-implementation Prepares one canonical body from the parameters and stands two performers on the origin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the body, place two performers, compose two stands.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body is a prepared Human body, not a stand-in, and the two performers differ only in subject.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body preparation and one composition, both closed form.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both performers share the one prepared body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only the returned performance.
 */
export function overlappingPerformance(
  subjects: readonly [string, string],
): IAutoMovieMotionHumanPerformance {
  const prepared: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(PARAMETERS, {
      mass: 78.365,
      id: "man",
    });
  const body: IAutoMovieMotionHumanBody = createHumanBody(
    prepared.skeleton,
    prepared.profile,
  );
  const [a, b]: readonly [string, string] = subjects;
  return new HumanPerformance({
    seed: "overlap",
    performers: [a, b].map((subject: string) => ({
      subject,
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    composition: HumanChain.subject(a)
      .stand({ hold: 1 })
      .with(HumanChain.subject(b).stand({ hold: 1 })).node,
  });
}
