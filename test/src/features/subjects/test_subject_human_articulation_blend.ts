import { Quaternion, Vector3 } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceRigidMotion,
  createHumanFaceBasisBuilder,
  poseHumanFaceSurface,
  unposeHumanFaceSurface,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  articulatedPositions,
  humanFaceArticulationFixture,
} from "../internal/humanFaceArticulationFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Sparse attachments blend rigid images; the inverse is exact and refuses a
 * singular blend.
 * Scenarios:
 * 1. A half-attached skin vertex lands midway between its rest and its rigid
 *    image, a fully attached vertex on the rigid image, an unattached vertex
 *    stays put.
 * 2. Unposing a posed surface recovers the rest positions exactly, including
 *    the blended vertex.
 * 3. An owner named without a motion throws in both directions.
 * 4. A vertex half attached to a 180 degree turn has a singular blend, which
 *    unposing refuses.
 */
export const test_subject_human_articulation_blend = (): void => {
  const { basis, document } = humanFaceArticulationFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const skin = articulatedPositions(
    build({ ...document, expression: { open: 1 } }),
    "skin/all",
  );
  // Vertex 2 rests at (1, 1, 0); a 90 degree turn about +X plus the coupled
  // translation puts its rigid image at (1, 0, 1.1); half weight is halfway.
  TestValidator.predicate(
    "half-attached vertex is the mean of rest and rigid image",
    vclose({ x: skin[6], y: skin[7], z: skin[8] }, { x: 1, y: 0.5, z: 0.55 }),
  );
  TestValidator.predicate(
    "fully attached vertex is the rigid image",
    vclose({ x: skin[9], y: skin[10], z: skin[11] }, { x: 0, y: 0, z: 1.1 }),
  );
  TestValidator.predicate(
    "unattached vertex keeps its rest plus residual",
    nclose(skin[0], 0) && nclose(skin[1], 0) && nclose(skin[2], 0.01),
  );
  const motions = new Map<string, IAutoMovieHumanFaceRigidMotion>([
    [
      "jaw",
      {
        rotation: Quaternion.fromAxisAngle(Vector3.create(1, 0, 0), 90),
        pivot: Vector3.create(),
        translation: Vector3.create(0, 0, 0.1),
      },
    ],
  ]);
  const rest = basis.surfaces[0].positions;
  const attachments = basis.surfaces[0].attachments!;
  const posed = poseHumanFaceSurface(rest, attachments, motions);
  const recovered = unposeHumanFaceSurface(posed, attachments, motions);
  TestValidator.predicate(
    "unpose inverts pose exactly",
    recovered.every((value, i) => nclose(value, rest[i], 1e-12)),
  );
  TestValidator.predicate(
    "posing without the owner's motion throws",
    throwsError(() => poseHumanFaceSurface(rest, attachments, new Map())) &&
      throwsError(() => unposeHumanFaceSurface(posed, attachments, new Map())),
  );
  // Half a 180 degree turn: `L = (I + R) / 2` is diag(0, 0, 1), the
  // candy-wrapper collapse of linear blending, so no rest position exists.
  const collapse = new Map<string, IAutoMovieHumanFaceRigidMotion>([
    [
      "a",
      {
        rotation: Quaternion.fromAxisAngle(Vector3.create(0, 0, 1), 180),
        pivot: Vector3.create(),
        translation: Vector3.create(),
      },
    ],
  ]);
  TestValidator.predicate(
    "a cancelling blend of rotations refuses to unpose",
    throwsError(
      () =>
        unposeHumanFaceSurface(
          [1, 0, 0],
          [{ owner: "a", rows: [0, 0.5] }],
          collapse,
        ),
      "singular",
    ),
  );
};
