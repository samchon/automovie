import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

import { humanBodyBasisFixture } from "./humanBodyBasisFixture";

/**
 * Analytic skeleton with mirrored A-pose arms, a movable shoulder girdle and
 * an articulated elbow. Geometry remains the fixture's closed box; bone
 * endpoints test kinematics independently of its skin triangles.
 */
export function humanBodyShoulderFixture(coupled = false): {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
} {
  const fixture = humanBodyBasisFixture();
  const basis = fixture.basis;
  basis.id = "analytic-shoulders/tt";
  fixture.document.basis = basis.id;
  const point = (id: string, x: number, y: number, z: number): void => {
    basis.landmarks.ids.push(id);
    basis.landmarks.positions.push(x, y, z);
  };
  point("thorax", 0, 3, 0);
  basis.joints.push({
    bone: "upperChest",
    parent: "spine",
    head: "joint-spine-2",
    tail: "thorax",
    reference: [0, 0, 1],
    signs: { flexion: 1, abduction: -1, twist: 1 },
    neutral: { flexion: 0, abduction: 0, twist: 0 },
    constraint: {
      flexion: { min: -30, max: 30 },
      abduction: { min: -30, max: 30 },
      twist: { min: -30, max: 30 },
    },
  });
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const shoulderBone = `${side}Shoulder` as "leftShoulder" | "rightShoulder";
    const upperBone = `${side}UpperArm` as "leftUpperArm" | "rightUpperArm";
    const lowerBone = `${side}LowerArm` as "leftLowerArm" | "rightLowerArm";
    point(`${side}-shoulder`, sign * 0.2, 3, 0);
    point(`${side}-elbow`, sign * 0.4, 2.8, 0);
    point(`${side}-wrist`, sign * 0.4, 2.5, 0);
    basis.joints.push({
      bone: shoulderBone,
      parent: "upperChest",
      head: "thorax",
      tail: `${side}-shoulder`,
      reference: [0, 0, 1],
      signs: { flexion: 1, abduction: sign, twist: null },
      neutral: { flexion: 0, abduction: 0, twist: 0 },
      constraint: {
        flexion: { min: -15, max: 30 },
        abduction: { min: -10, max: 40 },
        twist: null,
      },
    });
    basis.joints.push({
      bone: upperBone,
      parent: shoulderBone,
      head: `${side}-shoulder`,
      tail: `${side}-elbow`,
      reference: [0, 0, 1],
      signs: { flexion: 1, abduction: null, twist: null },
      neutral: { flexion: 0, abduction: 0, twist: 0 },
      constraint: { flexion: null, abduction: null, twist: null },
      shoulder: {
        coordinates: "thorax-tt",
        neutral: { plane: 0, elevation: 45, axialRotation: 0 },
        range: {
          elevation: { min: 0, max: 180 },
          axialRotation: { min: -90, max: 90 },
        },
      },
    });
    basis.joints.push({
      bone: lowerBone,
      parent: upperBone,
      head: `${side}-elbow`,
      tail: `${side}-wrist`,
      reference: [0, 0, 1],
      signs: { flexion: 1, abduction: null, twist: null },
      neutral: { flexion: 0, abduction: 0, twist: 0 },
      constraint: {
        flexion: { min: 0, max: 140 },
        abduction: null,
        twist: null,
      },
    });
    if (coupled) {
      basis.couplings ??= [];
      basis.couplings.push({
        id: `${side}Rhythm`,
        source: { bone: upperBone, measure: "elevation" },
        output: { bone: shoulderBone, axis: "abduction" },
        curve: [
          [45, 0],
          [180, 11],
        ],
      });
    }
  }
  return fixture;
}
