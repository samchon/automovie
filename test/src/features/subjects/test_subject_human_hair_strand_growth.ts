import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  growHumanFaceHairStrand,
  humanFaceHairContact,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Placement preserves a completed canonical stem and admits only its remainder.
 * Scenarios:
 * 1. An interpolated early station is skipped by actual arc coordinate; a later
 *    supported station retains canonical geometry and the measured total.
 * 2. A duplicate graft point spends no chord or row, and an overlong chord or
 *    changed total metric resumes the walk once instead of copying old length.
 * 3. Projection refusal resumes once; a refusing resumed walker preserves its
 *    exact Error. Rejection may return undefined to continue a resident walk.
 * 4. Sparse completed-stem metadata refuses before placement or resume and
 *    preserves its holes; the adjacent dense stem remains supported.
 */
export const test_subject_human_hair_strand_growth = (): void => {
  const layer = { samplingStep: 0.002, clearance: 0.001 };
  const root = Vector3.create(0, 0.1, 0);
  const query = createAutoMovieSignedMeshQuery({
    ...createSignedOctahedron(),
    positions: createSignedOctahedron().positions.map((value) => value * 0.1),
  });
  const contact = humanFaceHairContact({ layer, root, length: 0.0035, query });
  const launch = contact.project(Vector3.create(0, 0.1015, 0));
  const travelled = launch.y - root.y;
  const rooted = {
    points: [root, launch],
    freeFrom: 1,
    travelled,
    targetLength: 0.0035,
    clearance: contact.clearance - contact.epsilon,
    normal: Vector3.create(0, 1, 0),
  };
  const strand = {
    points: [root, Vector3.create(0, 0.1015, 0), Vector3.create(0, 0.1035, 0)],
    length: 0.0035,
    normal: rooted.normal,
  };
  const sparse = new Array<typeof root>(rooted.points.length);
  let invalidResumes = 0;
  TestValidator.predicate(
    "sparse canonical stem refuses before resume",
    throwsError(
      () =>
        growHumanFaceHairStrand({
          strand,
          contact,
          rooted: { ...rooted, points: sparse },
          integrate: () => {
            invalidResumes++;
            return undefined;
          },
        }),
      "canonical rooted transition metadata",
    ),
  );
  TestValidator.equals("invalid stem never resumes", invalidResumes, 0);
  TestValidator.predicate(
    "invalid stem preserves caller holes",
    !(0 in sparse) && !(1 in sparse),
  );
  const placed = growHumanFaceHairStrand({
    strand,
    contact,
    rooted,
    integrate: () => {
      throw new Error("Supported placement must not resume.");
    },
  });
  TestValidator.predicate(
    "canonical stem and exact remainder metric survive placement",
    placed !== undefined &&
      placed.freeFrom === 1 &&
      vclose(placed.points[1], launch) &&
      nclose(placed.length, 0.0035) &&
      placed.points[0] !== root,
  );
  const duplicate = growHumanFaceHairStrand({
    strand: { ...strand, points: [root, launch, Vector3.create(0, 0.1035, 0)] },
    contact,
    rooted,
    integrate: () => undefined,
  });
  TestValidator.predicate(
    "duplicate canonical graft emits no extra row",
    duplicate !== undefined && duplicate.points.length === 3,
  );
  for (const mode of ["chord", "metric", "projection"] as const) {
    let resumes = 0;
    const result = growHumanFaceHairStrand({
      strand:
        mode === "chord"
          ? { ...strand, points: [root, launch, Vector3.create(0, 0.4, 0)] }
          : strand,
      rooted: mode === "metric" ? { ...rooted, targetLength: 0.05 } : rooted,
      contact:
        mode === "projection"
          ? {
              ...contact,
              project: () => {
                throw new Error("Projection refuses.");
              },
            }
          : contact,
      integrate: () => {
        resumes++;
        return undefined;
      },
    });
    TestValidator.equals(mode + " rejects placement", result, undefined);
    TestValidator.equals(mode + " resumes once", resumes, 1);
  }
  const failure = new Error("The metric walker owns this refusal.");
  let resumes = 0;
  let caught: unknown;
  try {
    growHumanFaceHairStrand({
      strand,
      rooted,
      contact: {
        ...contact,
        project: () => {
          throw new Error("Placement refuses.");
        },
      },
      integrate: () => {
        resumes++;
        throw failure;
      },
    });
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "resumed walker Error propagates unchanged",
    caught === failure,
  );
  TestValidator.equals("a refusing walker is resumed once", resumes, 1);
};
