import { AutoMovieEngineMath, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieMeshSeparationResult,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * An attachment fan's seat on a non-axis-aligned triangle differs once both are
 * rounded; the contact cap (`boundTriangleAttachmentContact`, read
 * through a float32 separation query) bounds that registration travel.
 *
 * Fixture: the support (0.1, 0.2, 0.7), (0.6, 0.3, 0.1), (0.2, 0.7, 0.1) on the
 * plane x + y + z = 1, weights (0.25, 0.5, 0.25).
 *
 * Scenarios:
 *
 * 1. The binary64 seat (`interpolateTrianglePoint`) is (0.375, 0.375,
 *    0.25) within 1e-15.
 * 2. The Float32-rounded support's affine height over the seat's (x, y) stands
 *    above the seat.
 * 3. Fans rising 0.01 and 1e-6 from the seat (Float32-rounded) are certified with
 *    their canonical metadata, leave their inputs unchanged and spend some
 *    budget; the shallower one's cap is over 100 times the steeper one's.
 * 4. A fan or support missing a point ("complete fan") and a support whose
 *    differences overflow ("differences") are refused.
 */
export function test_engine_geometry_triangle_attachment_contact(): void {
  const support: IAutoMovieVector3[] = [
    { x: 0.1, y: 0.2, z: 0.7 },
    { x: 0.6, y: 0.3, z: 0.1 },
    { x: 0.2, y: 0.7, z: 0.1 },
  ];
  const weights: number[] = [0.25, 0.5, 0.25];
  const round = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: Math.fround(p.x),
    y: Math.fround(p.y),
    z: Math.fround(p.z),
  });

  // 1.
  const seat: IAutoMovieVector3 = AutoMovieEngineMath.interpolateTrianglePoint(
    support,
    weights,
  );
  TestValidator.predicate(
    "seat",
    vclose(seat, { x: 0.375, y: 0.375, z: 0.25 }, 1e-15),
  );

  // 2.
  const rounded: IAutoMovieVector3[] = support.map(round);
  const a: IAutoMovieVector3 = rounded[0]!;
  const b: IAutoMovieVector3 = rounded[1]!;
  const c: IAutoMovieVector3 = rounded[2]!;
  const det: number = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const u: number =
    ((seat.x - a.x) * (c.y - a.y) - (c.x - a.x) * (seat.y - a.y)) / det;
  const v: number =
    ((b.x - a.x) * (seat.y - a.y) - (seat.x - a.x) * (b.y - a.y)) / det;
  TestValidator.predicate(
    "rounded support above",
    a.z + u * (b.z - a.z) + v * (c.z - a.z) > seat.z,
  );

  // 3.
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
    AutoMovieEngineGeometry.createMeshSeparationQuery(mesh, "float32");
  const attachment = { triangle: 0, weights, supports: [0] };
  const caps: number[] = [];
  for (const rise of [0.01, 1e-6]) {
    const fan: IAutoMovieVector3[] = [
      seat,
      { x: seat.x + 0.01, y: seat.y - 0.01, z: seat.z + rise },
      { x: seat.x + 0.0101, y: seat.y - 0.0101, z: seat.z + rise },
    ].map(round);
    const before: string = JSON.stringify({
      fan,
      attachment,
      positions: mesh.positions,
    });
    const budget = { remaining: 1000 };
    const result: IAutoMovieMeshSeparationResult = query(fan, {
      clearance: 0,
      budget,
      attachment,
    });
    TestValidator.equals(`${rise} certified`, result.certified, true);
    TestValidator.equals(
      `${rise} inputs kept`,
      JSON.stringify({ fan, attachment, positions: mesh.positions }),
      before,
    );
    TestValidator.predicate(
      `${rise} work`,
      budget.remaining < 1000 && budget.remaining >= 0,
    );
    caps.push(result.attachmentCaps[0]!.cap);
  }
  TestValidator.predicate(
    "shallow amplifies",
    caps[0]! > 0 && caps[1]! > 100 * caps[0]!,
  );

  // 4.
  const fan: IAutoMovieVector3[] = [
    seat,
    { ...seat, z: seat.z + 0.01 },
    { ...seat, x: seat.x + 0.01, z: seat.z + 0.01 },
  ];
  for (const [label, f, s] of [
    ["short fan", fan.slice(1), support],
    ["short support", fan, support.slice(1)],
  ] satisfies [string, IAutoMovieVector3[], IAutoMovieVector3[]][])
    TestValidator.predicate(
      label,
      throwsError(
        (): unknown => AutoMovieEngineGeometry.boundTriangleAttachmentContact(f, s),
        "complete fan",
      ),
    );
  TestValidator.predicate(
    "overflow",
    throwsError(
      (): unknown =>
        AutoMovieEngineGeometry.boundTriangleAttachmentContact(fan, [
          { x: -Number.MAX_VALUE, y: 0, z: 0 },
          { x: Number.MAX_VALUE, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ]),
      "differences",
    ),
  );
}
