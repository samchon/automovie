import type { IAutoMovieHumanParameters, IAutoMovieHumanBodyControls } from "@automovie/human";

/**
 * Authored adult dimensions in millimetres; character weight stays metadata.
 * Unknown physical measurements remain null. These inputs establish no measured likeness.
 *
 * @evidence contracts/common.md#implementation-and-ownership One independent record uses public Human controls and explicit fictional dimensions; no mesh-volume mass estimate is made.
 * @evidence contracts/common.md#authoring-interface Height is millimetres; athletic selects authored shape coordinates, not a sex or athlete catalogue.
 */
export function createPersonParameters(height: number, athletic: boolean): IAutoMovieHumanParameters {
  const values: Record<keyof IAutoMovieHumanBodyControls, number | null> = {
    height, fat: athletic ? -0.15 : 0, masculineFeminine: -0.8,
    muscularity: athletic ? 0.9 : 0.3, chest: athletic ? 1060 : 990,
    bustSpan: null, underbust: null, frontInterscyeLength: null,
    neckToWaist: null, acrossShoulder: athletic ? 465 : 440,
    shoulderToApex: null, waist: athletic ? 820 : 840, hip: 980,
    highHip: null, neckBase: null, neck: athletic ? 410 : 390,
    neckLength: 120, upperArmLength: null, lowerArmLength: null,
    bicep: athletic ? 355 : 325, elbow: null, wrist: null, forearm: null,
    inseam: null, thigh: athletic ? 590 : 550, knee: null, calf: null,
    handCircumference: null,
  };
  const controls: IAutoMovieHumanBodyControls = Object.fromEntries(
    Object.entries(values).map(([name, value]: [string, number | null]): [string, { value: number | null; pinned: boolean }] => [name, { value, pinned: value !== null }]),
  ) as unknown as IAutoMovieHumanBodyControls;
  return {
    body: {
      controls,
      measurements: {
        height: null, chest: null, bustSpan: null, underbust: null,
        frontInterscyeLength: null, neckToWaist: null, acrossShoulder: null,
        shoulderToApex: null, waist: null, hip: null, highHip: null,
        neckBase: null, neck: null, neckLength: null, upperArmLength: null,
        lowerArmLength: null, bicep: null, elbow: null, wrist: null,
        forearm: null, inseam: null, thigh: null, knee: null, calf: null,
        handCircumference: null,
      },
      diagnostics: { rise: null, shoulderHeight: null },
    },
    head: {
      length: 195, cephalicIndex: 78, circumference: 575, height: 230,
      faceHeight: 120, faceWidth: 145, mandibularWidth: 110,
      minimumFrontalWidth: 110, mouthOpening: 48, mandibularLaterotrusion: 10,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
          right: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
        },
        intercanthalWidth: 33, nose: { width: 36, height: 52, protrusion: 20 },
        mouth: { width: 50, upperVermilionHeight: 7, lowerVermilionHeight: 9 },
      },
      earPair: {
        left: { length: 66, breadth: 29, protrusion: 18 },
        right: { length: 66, breadth: 29, protrusion: 18 },
      },
    },
  };
}
