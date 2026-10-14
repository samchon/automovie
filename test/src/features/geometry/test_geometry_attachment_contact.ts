import {
  type IAutoMovieMeshSeparationQuery,
  type IAutoMovieMeshSeparationResult,
  boundAutoMovieTriangleAttachmentContact,
  createAutoMovieMeshSeparationQuery,
} from "@automovie/engine";
import {
  type IAutoMovieMesh,
  type IAutoMovieMeshPhysicalVertices,
  type IAutoMovieMeshSkin,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A root contact qualifies only its original support manifold; a second host
 * piercing the same fan remains unproved even though its minimum includes root0.
 * Scenarios:
 * 1. A registered barycentric plane-root fan has positive corner gaps and a tiny
 *    bounded registration cap in source and actual Float32 coordinate frames.
 * 2. Moving the root or supplying unrelated supports cannot expand attachment.
 * 3. A second plane intersects the fan away from its root and certification fails.
 * 4. Inward/tangent corners and collapsed supports leave the fan proof false.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes primitive contact bounds and resident separation queries, asserting bounded certification only for the registered outward fan, zero global gap, a small reported cap, and refusal or unproved status for moved roots, unrelated supports and piercing hosts.
 * @evidence contracts/testing.md#independent-expectations The authored plane and barycentric root place the fan at zero support gap with outward corners at z=0.1; a second plane at z=0.05 pierces it away from that root. Source and Math.fround coordinates exercise actual representation inputs. The 1e-12 cap ceiling is this fixture's numerical bound, not a physical or visual contact tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves source/Float32 frames, moved root, second host, unrelated or malformed supports, positive clearance, invalid weights, tangent/inward corners, and collapsed/collinear primitive supports. General float-frame amplification is owned by the representation test; no arbitrary surface safety follows from these plane cases.
 * @evidence contracts/testing.md#execution-ownership The named entry calls portable geometry source with existing synthetic vectors and buffers, observing output and exception names without a browser, GPU, host process or native build. No Human asset, new geometry case or dynamically registered test is introduced.
 */
export function test_geometry_attachment_contact(): void {
  const p: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => ({ x, y, z });
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const fan: IAutoMovieVector3[] = [
    p(0.5, 0.5, 0),
    p(0.4, 0.5, 0.1),
    p(0.6, 0.5, 0.1),
  ];
  const attachment: {
    triangle: number;
    weights: number[];
    supports: number[];
  } = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };
  for (const mode of ["source", "float32"] as const) {
    const query: IAutoMovieMeshSeparationQuery =
      createAutoMovieMeshSeparationQuery(mesh, mode);
    const points: IAutoMovieVector3[] =
      mode === "source"
        ? fan
        : fan.map(
            (v: IAutoMovieVector3): IAutoMovieVector3 =>
              p(Math.fround(v.x), Math.fround(v.y), Math.fround(v.z)),
          );
    const result: IAutoMovieMeshSeparationResult = query(points, {
      clearance: 0,
      budget: { remaining: 100 },
      attachment,
    });
    TestValidator.equals(
      "bounded complete registered fan contact",
      result.certified,
      true,
    );
    TestValidator.predicate(
      "attachment never reports positive global gap",
      nclose(result.lowerBound, 0, 0),
    );
    TestValidator.predicate(
      "cap is numerical, not a whole face exemption",
      result.attachmentCaps.length === 1 &&
        result.attachmentCaps[0].cap < 1e-12,
    );
    TestValidator.predicate(
      "root authority mismatch refuses",
      throwsError(
        (): IAutoMovieMeshSeparationResult =>
          query([{ ...points[0], z: 0.01 }, ...points.slice(1)], {
            clearance: 0,
            budget: { remaining: 100 },
            attachment,
          }),
        "canonical source seat",
      ),
    );
  }
  const obstacle: {
    positions: number[];
    indices: number[];
    physicalVertices?: IAutoMovieMeshPhysicalVertices;
    normals: number[] | null;
    uvs: number[] | null;
    colors?: number[];
    reliefWeights?: number[];
    skin: IAutoMovieMeshSkin | null;
  } = {
    ...mesh,
    positions: [
      ...mesh.positions,
      0.2,
      0.2,
      0.05,
      0.8,
      0.2,
      0.05,
      0.2,
      0.8,
      0.05,
    ],
    indices: [0, 1, 2, 3, 4, 5],
  };
  const obstructed: IAutoMovieMeshSeparationQuery =
    createAutoMovieMeshSeparationQuery(obstacle);
  TestValidator.equals(
    "another host piercing cannot hide behind root0",
    obstructed(fan, { clearance: 0, budget: { remaining: 1000 }, attachment })
      .certified,
    false,
  );
  TestValidator.predicate(
    "unrelated support metadata refuses",
    throwsError(
      (): IAutoMovieMeshSeparationResult =>
        obstructed(fan, {
          clearance: 0,
          budget: { remaining: 1000 },
          attachment: { ...attachment, supports: [0, 1] },
        }),
      "original sampler feature",
    ),
  );
  for (const invalid of [
    null,
    { ...attachment, triangle: 9 },
    { ...attachment, supports: [] },
  ] as const)
    TestValidator.predicate(
      "malformed attachment admission",
      throwsError(
        (): IAutoMovieMeshSeparationResult =>
          obstructed(fan, {
            clearance: 0,
            budget: { remaining: 1000 },
            attachment: invalid as unknown as typeof attachment,
          }),
        "attachment",
      ),
    );
  TestValidator.predicate(
    "positive gap cannot authorize root contact",
    throwsError(
      (): IAutoMovieMeshSeparationResult =>
        obstructed(fan, {
          clearance: 0.1,
          budget: { remaining: 1000 },
          attachment,
        }),
      "zero clearance",
    ),
  );
  TestValidator.predicate(
    "invalid weights keep seating admission",
    throwsError(
      (): IAutoMovieMeshSeparationResult =>
        obstructed(fan, {
          clearance: 0,
          budget: { remaining: 1000 },
          attachment: { ...attachment, weights: [1, 1, 1] },
        }),
      "seating",
    ),
  );
  const support: IAutoMovieVector3[] = [p(0, 0, 0), p(2, 0, 0), p(0, 2, 0)];
  for (const z of [0, -0.1]) {
    const invalidFan: IAutoMovieVector3[] = [fan[0], p(0.4, 0.5, z), fan[2]];
    TestValidator.equals(
      "tangent/inward corner proof false",
      boundAutoMovieTriangleAttachmentContact(invalidFan, support).proved,
      false,
    );
    const unproved: IAutoMovieMeshSeparationResult =
      createAutoMovieMeshSeparationQuery(mesh)(invalidFan, {
        clearance: 0,
        budget: { remaining: 1000 },
        attachment,
      });
    TestValidator.equals(
      "resident fan cannot admit an unproved cap",
      unproved.certified,
      false,
    );
    TestValidator.equals(
      "unproved original support remains named",
      unproved.triangle,
      0,
    );
    TestValidator.predicate(
      "unproved attachment reports no positive bound",
      nclose(unproved.lowerBound, 0, 0),
    );
  }
  TestValidator.equals(
    "collapsed support proof false",
    boundAutoMovieTriangleAttachmentContact(fan, [
      support[0],
      support[0],
      support[0],
    ]).proved,
    false,
  );
  TestValidator.equals(
    "collinear support proof false",
    boundAutoMovieTriangleAttachmentContact(fan, [
      p(0, 0, 0),
      p(1, 0, 0),
      p(2, 0, 0),
    ]).proved,
    false,
  );
}
