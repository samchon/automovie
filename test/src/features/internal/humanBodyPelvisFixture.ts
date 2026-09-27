import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

import { humanBodyBasisFixture } from "./humanBodyBasisFixture";

/**
 * The analytic box of `humanBodyBasisFixture` with two thighs hanging from
 * the root and a declared pelvifemoral rhythm.
 *
 * The hip centres sit at (+-0.1, -0.2, 0) and the knees one metre below
 * them; each thigh flexes toward +Z (reference [0, 0, 1]), so every rest
 * frame is axis-aligned and a trunk-relative flexion `f` points the thigh at
 * `(0, -cos f, sin f)`. The rhythm `pelvifemoral` drives the lumbar joint
 * `spine` along `[[0, 0], [100, 20]]`: the tilt is one fifth of the larger
 * leg flexion up to 100 and 20 past it. The thighs carry no skin; the box
 * keeps its hips/spine binding. Every expected number in the scenarios is
 * hand-derived from these figures.
 */
export function humanBodyPelvisFixture(): {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
} {
  const fixture = humanBodyBasisFixture();
  const basis = fixture.basis;
  basis.id = "analytic-pelvis/1";
  fixture.document.basis = basis.id;
  for (const [side, x] of [
    ["left", 0.1],
    ["right", -0.1],
  ] as const) {
    basis.landmarks.ids.push(`${side}-hip`, `${side}-knee`);
    basis.landmarks.positions.push(x, -0.2, 0, x, -1.2, 0);
    basis.joints.push({
      bone: side === "left" ? "leftUpperLeg" : "rightUpperLeg",
      parent: "hips",
      head: `${side}-hip`,
      tail: `${side}-knee`,
      reference: [0, 0, 1],
      signs: {
        flexion: 1,
        abduction: side === "left" ? 1 : -1,
        twist: side === "left" ? -1 : 1,
      },
      neutral: { flexion: 0, abduction: 0, twist: 0 },
      constraint: {
        flexion: { min: -30, max: 125 },
        abduction: { min: -10, max: 45 },
        twist: { min: -45, max: 45 },
      },
    });
  }
  basis.pelvifemoral = {
    id: "pelvifemoral",
    lumbar: "spine",
    curve: [
      [0, 0],
      [100, 20],
    ],
  };
  return fixture;
}
