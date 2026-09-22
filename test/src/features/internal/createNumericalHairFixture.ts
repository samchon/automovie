import type { IAutoMovieHumanFaceHair } from "@automovie/human";

/**
 * Small complete numerical hairstyle for document/field tests. Uniform 50 mm
 * lengths, a 1 mm ribbon and 2 mm numerical intervals are authored test inputs,
 * not biological defaults. Each call owns every nested array and object.
 */
export const createNumericalHairFixture = (): IAutoMovieHumanFaceHair => ({
  layers: [
    {
      id: "population",
      surface: "head",
      domain: "scalp",
      count: 2,
      seed: 0,
      hairline: {
        front: Math.PI,
        left: Math.PI,
        right: Math.PI,
        back: Math.PI,
      },
      lengthAxes: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
      lengthVariation: 0,
      width: 0.001,
      samplingStep: 0.002,
      clearance: 0.001,
      flow: [0, -1, -0.3],
      lift: { strength: 0.2, reach: 0.02 },
      curl: { mode: "wave", angle: 0, wavelength: 0.016, reach: 0.02 },
      taper: { tipWidth: 0.3, start: 0.7 },
      finish: {
        color: [0.1, 0.05, 0.02],
        roughness: 0.7,
        fibres: 8,
        coverage: 0.8,
        normal: 0.2,
        shade: 1,
      },
    },
  ],
});
