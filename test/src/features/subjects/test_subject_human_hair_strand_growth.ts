import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  growHumanFaceHairStrand,
  humanFaceHairContact,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  createSignedOctahedron,
  createSignedVoxelUnion,
} from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A strand is placed by projection, or grown when that refuses.
 * Scenarios:
 * 1. Stations are projected to the contact clearance, the root is left where
 *    it is, and the strand keeps its own length and clearance.
 * 2. A contact whose projection refuses grows the strand by the integrator
 *    instead.
 * 3. That refusal is the contact rule's own, in a slot narrower than the
 *    clearance it must keep.
 */
export const test_subject_human_hair_strand_growth = (): void => {
  const layer = {
    samplingStep: 0.002,
    clearance: 0.001,
  };
  const query = createAutoMovieSignedMeshQuery({
    ...createSignedOctahedron(),
    positions: createSignedOctahedron().positions.map((value) => value * 0.1),
  });
  const root = Vector3.create(0, 0.1, 0);
  const contact = humanFaceHairContact({ layer, root, length: 0.05, query });
  const inside = Vector3.create(0, 0.05, 0);
  const placed = growHumanFaceHairStrand({
    strand: {
      points: [root, inside, Vector3.create(0, 0.2, 0)],
      length: 0.05,
      normal: Vector3.create(0, 1, 0),
    },
    contact,
    integrate: () => {
      throw new Error("The integrator must not run when projection places.");
    },
  });
  TestValidator.predicate(
    "stations are projected and the root is kept",
    placed.points[0] === root &&
      nclose(
        query([placed.points[1].x, placed.points[1].y, placed.points[1].z])
          .signedDistance,
        contact.clearance,
      ) &&
      nclose(placed.points[2].y, 0.2) &&
      nclose(placed.length, 0.05) &&
      nclose(placed.clearance, contact.clearance - contact.epsilon),
  );
  const grown = {
    points: [root, Vector3.create(0, 0.3, 0)],
    length: 0.2,
    clearance: 0.5,
    normal: Vector3.create(0, 1, 0),
  };
  const refusing = {
    ...contact,
    project: () => {
      throw new Error("Numerical hair contact did not converge.");
    },
  };
  TestValidator.equals(
    "a strand the projection refuses is grown",
    growHumanFaceHairStrand({
      strand: {
        points: [root, inside],
        length: 0.05,
        normal: Vector3.create(0, 1, 0),
      },
      contact: refusing,
      integrate: () => grown,
    }),
    grown,
  );
  // Two walls 20 mm apart cannot hold a 21 mm clearance: a point in the slot
  // between them is pushed into the opposite wall until the contact refuses.
  const slot = createSignedVoxelUnion([
    [0, 0, 0],
    [2, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [2, 1, 0],
  ]);
  const narrow = humanFaceHairContact({
    layer: { samplingStep: 0.001, clearance: 0.0205 },
    root: Vector3.create(),
    length: 0.05,
    query: createAutoMovieSignedMeshQuery({
      ...slot,
      positions: slot.positions.map((value) => value * 0.02),
    }),
  });
  TestValidator.predicate(
    "a slot too narrow for the clearance refuses",
    throwsError(
      () => narrow.project(Vector3.create(0.03, 0.01, 0.01)),
      "did not converge",
    ),
  );
};
