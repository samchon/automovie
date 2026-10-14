import {
  type IAutoMovieMesh,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { type IAutoMovieMeshSeparationResult } from "@automovie/engine";
import { type IAutoMovieTriangleAttachmentContactBound } from "@automovie/engine";
import { boundAutoMovieTriangleAttachmentContact } from "@automovie/engine";
import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { interpolateAutoMovieTrianglePoint } from "@automovie/engine";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * A non-axis-aligned plane's rounded vertices and rounded canonical seat differ.
 * Shallow emergence amplifies the resulting registration contact travel, so a
 * scalar root displacement cannot substitute for the complete fan cap.
 * Scenarios:
 * 1. Three source corners lie on x+y+z=1; binary64 weighted seat is (.375,.375,.25).
 * 2. Rounded support's XY-affine height is above that rounded seat.
 * 3. Shallower exterior corners produce a larger contact cap under unchanged
 *    canonical metadata, while source/F32 inputs and metadata remain unchanged.
 * 4. Invalid arity/nonfinite/overflow support arithmetic refuses by name.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs barycentric interpolation, primitive contact bounds and a Float32 separation query; checks the rounded support's height, certification, increasing cap extent, consumed caller budget and unchanged caller inputs, with named refusals for incomplete or overflowing support arithmetic.
 * @evidence contracts/testing.md#independent-expectations Weighted source corners give (.375,.375,.25), and a separate XY-affine determinant solve evaluates the rounded plane's height. Reducing outward rise from 0.01 to 1e-6 must amplify this fixture's cap by more than 100. This local comparison does not prove a universal error ratio or pixel contact.
 * @evidence contracts/testing.md#distinguishing-cases Keeps both rise magnitudes, source versus rounded support, ownership checks, incomplete fan/support, NaN, sparse input and overflow. The ordinary registered-plane and obstacle decisions belong to attachment-contact; this case isolates representation-dependent emergence.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry invokes actual portable source and independent scalar plane arithmetic using the existing data. It creates no Human asset or new case and starts no process, browser, GPU or native build; no dynamic case registration is involved.
 */
export function test_geometry_attachment_representation(): void {
  const support: IAutoMovieVector3[] = [
    { x: 0.1, y: 0.2, z: 0.7 },
    { x: 0.6, y: 0.3, z: 0.1 },
    { x: 0.2, y: 0.7, z: 0.1 },
  ];
  const weights: number[] = [0.25, 0.5, 0.25];
  const root: IAutoMovieVector3 = interpolateAutoMovieTrianglePoint(
    support,
    weights,
  );
  TestValidator.predicate(
    "independent weighted plane seat",
    vclose(root, { x: 0.375, y: 0.375, z: 0.25 }, 1e-15),
  );
  const rounded: IAutoMovieVector3[] = support.map(
    (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: Math.fround(p.x),
      y: Math.fround(p.y),
      z: Math.fround(p.z),
    }),
  );
  // Solve the support's affine z(x,y) in the XY plane, independently of the
  // projection/cap owner and of its approximate normal direction.
  const [a, b, c]: IAutoMovieVector3[] = rounded;
  const determinant: number =
    (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const u: number =
    ((root.x - a.x) * (c.y - a.y) - (c.x - a.x) * (root.y - a.y)) / determinant;
  const v: number =
    ((b.x - a.x) * (root.y - a.y) - (root.x - a.x) * (b.y - a.y)) / determinant;
  const height: number = a.z + u * (b.z - a.z) + v * (c.z - a.z);
  TestValidator.predicate(
    "actual rounded support lies above canonical rounded seat",
    height > root.z,
  );
  const mesh: IAutoMovieMesh = {
    positions: support.flatMap((p: IAutoMovieVector3): number[] => [
      p.x,
      p.y,
      p.z,
    ]),
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const query: IAutoMovieMeshSeparationQuery =
    createAutoMovieMeshSeparationQuery(mesh, "float32");
  const attachment: {
    triangle: number;
    weights: number[];
    supports: number[];
  } = { triangle: 0, weights, supports: [0] };
  const caps: number[] = [];
  for (const rise of [0.01, 1e-6]) {
    const fan: IAutoMovieVector3[] = [
      root,
      { x: root.x + 0.01, y: root.y - 0.01, z: root.z + rise },
      { x: root.x + 0.0101, y: root.y - 0.0101, z: root.z + rise },
    ].map(
      (p: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: Math.fround(p.x),
        y: Math.fround(p.y),
        z: Math.fround(p.z),
      }),
    );
    const before: unknown = structuredClone({
      fan,
      attachment,
      positions: mesh.positions,
    });
    const budget: { remaining: number } = { remaining: 1000 };
    const result: IAutoMovieMeshSeparationResult = query(fan, {
      clearance: 0,
      budget,
      attachment,
    });
    TestValidator.equals(
      "complete registered rounded fan contact",
      result.certified,
      true,
    );
    TestValidator.predicate(
      "caller inputs/metadata stay unchanged",
      equalGeometryTestValues(
        { fan, attachment, positions: mesh.positions },
        before,
      ),
    );
    TestValidator.predicate(
      "caller work is consumed without reset",
      budget.remaining < 1000 && budget.remaining >= 0,
    );
    caps.push(result.attachmentCaps[0].cap);
  }
  TestValidator.predicate(
    "shallow emergence amplifies root-contact extent",
    caps[0] > 0 && caps[1] > 100 * caps[0],
  );
  const fan: IAutoMovieVector3[] = [
    root,
    { ...root, z: root.z + 0.01 },
    { ...root, x: root.x + 0.01, z: root.z + 0.01 },
  ];
  for (const [badFan, badSupport] of [
    [fan.slice(1), support],
    [fan, support.slice(1)],
    [[{ ...root, x: NaN }, ...fan.slice(1)], support],
    [new Array(3), support],
  ] as const)
    TestValidator.predicate(
      "attachment primitive requires complete finite coordinates",
      throwsError(
        (): IAutoMovieTriangleAttachmentContactBound =>
          boundAutoMovieTriangleAttachmentContact(badFan, badSupport),
        "complete finite",
      ),
    );
  TestValidator.predicate(
    "overflowed support differences refuse",
    throwsError(
      (): IAutoMovieTriangleAttachmentContactBound =>
        boundAutoMovieTriangleAttachmentContact(fan, [
          { x: -Number.MAX_VALUE, y: 0, z: 0 },
          { x: Number.MAX_VALUE, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ]),
      "differences",
    ),
  );
}
