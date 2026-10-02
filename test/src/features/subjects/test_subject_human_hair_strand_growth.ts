import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  growHumanFaceHairStrand,
  humanFaceHairContact,
} from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
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
 *    instead, and so does a blend whose stations stand further apart than the
 *    step its guides were integrated with, which has no clearance argument
 *    left between them.
 * 3. That refusal is the contact rule's own, in a slot narrower than the
 *    clearance it must keep.
 * 4. A strand is recognised at its first bad chord: the stations after it are
 *    not projected, and a strand with no bad chord is projected in full.
 * 5. A refusing integrator is called once and its own Error propagates after
 *    a bad chord or projection refusal, including a later refusal that early
 *    placement rejection must never reach.
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
  // 1.5 mm above the apex is nearer the surface than the 2 mm clearance, so
  // the projection moves it out; the station beyond it already stands clear.
  const near = Vector3.create(0, 0.1015, 0);
  const stretched = {
    points: [root, Vector3.create(0, 0.15, 0)],
    length: 0.3,
    clearance: 0.002,
    normal: Vector3.create(0, 1, 0),
  };
  const placed = growHumanFaceHairStrand({
    strand: {
      points: [root, near, Vector3.create(0, 0.1035, 0)],
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
      nclose(placed.points[2].y, 0.1035) &&
      nclose(placed.length, 0.05) &&
      nclose(placed.clearance, contact.clearance - contact.epsilon),
  );
  TestValidator.predicate(
    "a strand whose stations outrun the step is grown",
    growHumanFaceHairStrand({
      strand: {
        points: [root, near, Vector3.create(0, 0.4, 0)],
        length: 0.3,
        normal: Vector3.create(0, 1, 0),
      },
      contact,
      integrate: () => stretched,
    }) === stretched,
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
  TestValidator.predicate(
    "a strand the projection refuses is grown",
    growHumanFaceHairStrand({
      strand: {
        points: [root, Vector3.create(0, 0.05, 0)],
        length: 0.05,
        normal: Vector3.create(0, 1, 0),
      },
      contact: refusing,
      integrate: () => grown,
    }) === grown,
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
  let projected = 0;
  const counting = {
    ...contact,
    project: (point: IAutoMovieVector3) => {
      projected++;
      return contact.project(point);
    },
  };
  const fresh = () => ({
    points: [
      root,
      near,
      Vector3.create(0, 0.4, 0),
      Vector3.create(0, 0.401, 0),
      Vector3.create(0, 0.402, 0),
    ],
    length: 0.3,
    normal: Vector3.create(0, 1, 0),
  });
  let earlyIntegrations = 0;
  const earlyResult = growHumanFaceHairStrand({
    strand: fresh(),
    contact: counting,
    integrate: () => {
      earlyIntegrations++;
      return stretched;
    },
  });
  TestValidator.predicate(
    "the first bad chord grows the strand",
    earlyResult === stretched,
  );
  TestValidator.equals("the first bad chord integrates once", earlyIntegrations, 1);
  TestValidator.equals(
    "no station after the bad chord is projected",
    projected,
    2,
  );
  projected = 0;
  growHumanFaceHairStrand({
    strand: {
      points: [
        root,
        near,
        Vector3.create(0, 0.1035, 0),
        Vector3.create(0, 0.1055, 0),
      ],
      length: 0.05,
      normal: Vector3.create(0, 1, 0),
    },
    contact: counting,
    integrate: () => stretched,
  });
  TestValidator.equals("a placed strand is projected in full", projected, 3);
  for (const mode of ["bad chord", "projection refusal", "later refusal"] as const) {
    const failure = new Error("The integrator owns this refusal.");
    let integrations = 0, projections = 0;
    let caught: unknown;
    try {
      growHumanFaceHairStrand({
        strand: fresh(),
        contact: {
          ...contact,
          project: (point) => {
            projections++;
            if (mode === "projection refusal" || (mode === "later refusal" && projections === 3))
              throw new Error("Projection refuses before integration.");
            return contact.project(point);
          },
        },
        integrate: () => {
          integrations++;
          throw failure;
        },
      });
    } catch (error: unknown) {
      caught = error;
    }
    TestValidator.predicate(mode + " propagates the integrator Error", caught === failure);
    TestValidator.equals(mode + " integrates once", integrations, 1);
    TestValidator.equals(mode + " projects only until placement refuses", projections, mode === "projection refusal" ? 1 : 2);
  }
};
