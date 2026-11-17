import type { IAutoMovieHumanFootPrior } from "@automovie/interface";

/**
 * Named constants of the foot construction that are not one piece's own, in
 * normalised foot coordinates shared by every person: the frame's, the toes'
 * and the malleoli's. A guide's knots and the heel's corner live in the files
 * of the pieces that own them (`AutoMovieHumanFoot...Guide`,
 * `AutoMovieHumanFootHeelCorner`).
 *
 * Coordinates: `a` along the foot axis from the rearmost point of the heel, in
 * foot lengths; `u` across it from the forefoot's medial extreme (0) to its
 * lateral extreme (1), in foot breadths; heights over the floor either in foot
 * lengths or in lateral malleolus heights. Each constant names its basis:
 *
 * - Published: ANSUR II (Gordon 2014) ratios and lines, Maestro's metatarsal
 *   cascade (reference means of the reliability study, J Foot Ankle Res 2018),
 *   ISO 8559-1 and IBV measurement definitions, Gray 1918 for the form.
 * - Reference median, awaiting a published value: the median over the four
 *   reference bodies f1, f2, m1 and m2, read by exact plane cuts of their left
 *   feet, each also read with one person left out (`docs/anatomy/foot.md`).
 * - Convention: a choice with no measurement yet, stated as such.
 */
export namespace AutoMovieHumanFootPrior {
  /** Foot length Maestro's millimetres are read at, mm (adult mean of ANSUR II women and men). */
  export const CASCADE_FOOT: number = 258.75;

  /** The constants. */
  export const PRIOR: IAutoMovieHumanFootPrior.IPrior = {
    yaw: 0.171,
    expected: {
      length: [0.151, 0.154],
      breadth: [0.377, 0.376],
      ankle: [
        [6.0, 0.0348],
        [5.0, 0.0387],
      ],
    },
    ring: 1.4621,
    ankle: [0.211, 0.393],
    first: 0.74,
    cascade: [0, 3.3, 6.5, 12],
    clefts: [
      [0.84, 0.315],
      [0.84, 0.52],
      [0.81, 0.687],
      [0.76, 0.836],
    ],
    toes: [
      {
        name: "toe.{side}.1",
        tip: [1, 0.2],
        head: 0.139,
        height: 0.06,
        breadth: 0.274,
        depth: 0.75,
        pulp: 1.1,
        joints: [0.5],
        order: 64,
        sections: 29,
      },
      {
        name: "toe.{side}.2",
        tip: [0.985, 0.455],
        head: 0.39,
        height: 0.055,
        breadth: 0.177,
        depth: 0.95,
        pulp: 1.02,
        joints: [0.5, 0.75],
        order: 32,
        sections: 29,
      },
      {
        name: "toe.{side}.3",
        tip: [0.945, 0.63],
        head: 0.586,
        height: 0.05,
        breadth: 0.157,
        depth: 0.95,
        pulp: 1.02,
        joints: [0.5, 0.75],
        order: 32,
        sections: 25,
      },
      {
        name: "toe.{side}.4",
        tip: [0.89, 0.775],
        head: 0.75,
        height: 0.044,
        breadth: 0.153,
        depth: 0.95,
        pulp: 1.02,
        joints: [0.5, 0.75],
        order: 32,
        sections: 21,
      },
      {
        name: "toe.{side}.5",
        tip: [0.82, 0.885],
        head: 0.95,
        height: 0.036,
        breadth: 0.139,
        depth: 0.95,
        pulp: 1.02,
        joints: [0.5, 0.75],
        order: 32,
        sections: 19,
      },
    ],
    malleoli: {
      lateral: { height: 1, prominence: 3, radius: 14 },
      medial: { height: 1.1, prominence: 2.5, radius: 16 },
    },
    toeDorsal: 0.55,
  };
}
