import type { IAutoMovieHumanHeadPrior } from "@automovie/interface";

/**
 * Named constants of the head and ear construction, shared by every person and
 * both sides.
 *
 * The head is built from Farkas landmarks placed by their published
 * definitions and population relations. Lengths taken from a published
 * norm are written in that norm's millimetres and scaled by the person's face
 * height over the norm's (`profile.unit`), so a constant never fixes a size.
 * Values read on the private references rather than published are marked
 * "Observed": each is a mean over the four references in the stated
 * normalisation, checked on each reference held out from the other three,
 * and is to be replaced by a published value or confirmed by the reference
 * section curves.
 */
export namespace AutoMovieHumanHeadPrior {
  /** The population's prior. */
  export const PRIOR: IAutoMovieHumanHeadPrior.IPrior = {
    tilt: [-0.245, 1.3, 0.62, 0.52],
    ratios: {
      neck: 0.5806,
      forward: 0.8043,
    },
    profile: {
      unit: 118.6,
      glabella: 0.14,
      nasion: 1.9,
      subnasale: 6,
      pogonion: 0,
      lips: { upper: 3, lower: 2 },
      sulcus: 4,
      lip: 1 / 3,
      chin: 1 / 3,
      bridge: 0.875,
    },
    frame: {
      tragion: 0.637,
      tragionDrop: 0.07,
      base: 0.962,
      zygion: 0.1,
      arch: 0.25,
      frontal: 0.16,
      plan: 2.5,
      union: 6,
      clear: 6,
    },
    face: {
      profileKnots: [-0.3, 0, 0.2, 0.55, 1, 1.25],
      profile: [0, 0.82, 0.86, 0.6, 0.2, 0],
      dorsum: [0.7, 0.66, 0.6, 0.52, 0.48, 0.5],
      tipBall: [0.8, 0.46, 0.72],
      ala: [11, 0.62, 0.3, 0.25, 0.2, 0.4],
      underside: [0.05, 4],
      nasolabial: [101.25, 3.75],
      crease: [1, 0.5, 1.3],
      fissure: [1.8, 0.9],
      gape: 0.012,
      joint: 0.09,
      philtrum: [0.9, 3.2],
      socket: 3.9,
      eyeRecess: 13.5,
      globeRise: 2.2,
      radius: 11.392,
      margin: [
        [-1.6, 1.27, -3.3, -0.14, -0.7, -0.1],
        [0.28, 1, 0.08, 0.01, 0.08, 0.033],
        [1, 0.03, -0.034, -0.02, 0.062, 0.018],
      ],
      marginForward: 6.26,
      nostrilSize: [0.33, 0.15],
      nostrilCentre: [0.42, 0.5],
      nostrilSweep: 40,
      nostrilTear: 0.35,
    },
    // Frankfort to mandibular plane 25 degrees, steeper in women; gonial angle
    // about 120 in men and 125 in women; a cervicomental angle of about 112.
    mandible: {
      plane: [25, 2.5],
      angle: [122.5, 2.5],
      gonion: 20,
      throatAngle: 100,
      under: 3,
      // 6.2 mm over the bone's edge, which the lower head's layers cross nearly
      // square, and 26 mm into the skin under the jaw, which they cross at about
      // 18 degrees. A circle of 6 mm turned 34 degrees a layer at the underside,
      // and an ellipse of 4.9 and 15.8 mm, the least the 1.27 mm layers carry
      // by a straight estimate, still turned 29. 33 mm ran past the 24 to 30 mm
      // of underside a thick neck leaves before the throat, and rounded the
      // border into it. Stated at no fat: 10 mm at the references' fat of about
      // -0.6.
      round: 13.5,
      fat: 0.5,
      taper: 0.62,
      inset: 1,
      back: 0.5,
      throat: 24,
    },
    ear: {
      lengthRatio: 1.02,
      breadthRatio: 1,
      drop: 0.36,
      forward: -16,
      lean: 0.2,
      egg: 0.12,
      stand: [0.5, 0.155, -0.195],
      lobeFree: 0.04,
      topFree: 0.22,
      splitFree: 0.09,
      roofFree: 0.06,
      root: 0.55,
      rim: 1.7,
      lobeFrom: 0.62,
      lobeBlend: 0.3,
      frontRim: 0.2,
      helix: [2.2, 2.5, 2.2],
      scapha: [-1.8, 6.5, 2.4],
      antihelix: [2.2, 11.5, 2.6],
      concha: [-8.5, 0.34, -0.12, 0.2, 0.34],
      tragus: [2.4, 0.1, -0.2, 0.07, 0.12],
      antitragus: [1.8, 0.42, -0.55, 0.1, 0.1],
    },
  };
}
