import {
  AutoMovieEngineGeometry,
  AutoMovieEngineSweep,
} from "@automovie/engine";
import type {
  IAutoMovieSubdivisionParameter,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../../internal/sweepBottle";
import { throwsError } from "../../internal/throwsError";

/**
 * Prepared offsets and cage layout inputs must publish complete finite surface
 * addresses. A transition inverse must actually recover its chart coordinate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes placement, regular and singular lookup, finite narrow charts, dense output and atomic layout preflight.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual frame placement, surface inverse, vertex lookup and cage layout owners with shaped malformed and positive controls. Checks wrapped geometry and UV seams and verifies rejected emissions preserve earlier buffers.
 * @evidence contracts/development/testing.md#independent-expectations The warped chart has s=u(1+v)/2 and t=v. A narrow rectangle scales back to the same unit coordinates, while a line has no regular two-dimensional inverse. An affine UV midpoint between opposite endpoints is zero. A seam can reuse a geometry vertex while owning separate UV slots.
 */
export function test_engine_geometry_surface_lookup_admission(): void {
  const geometry = AutoMovieEngineGeometry;
  const sweep = AutoMovieEngineSweep;
  const points: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ];
  const frame = geometry.prepareSurfaceFrame(points);
  TestValidator.equals(
    "finite prepared roundtrip",
    geometry.placeSurfaceFrame(frame, frame.frame),
    points,
  );
  const sparse: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] = [
    { ...frame.offsets[0] },
    { ...frame.offsets[1] },
    { ...frame.offsets[2] },
  ];
  Reflect.deleteProperty(sparse, 1);
  TestValidator.predicate(
    "missing prepared offset",
    throwsError(
      () =>
        geometry.placeSurfaceFrame({ ...frame, offsets: sparse }, frame.frame),
      "complete finite offsets",
    ),
  );
  TestValidator.predicate(
    "nonfinite prepared offset",
    throwsError(
      () =>
        geometry.placeSurfaceFrame(
          {
            ...frame,
            offsets: [
              { x: NaN, y: 0, z: 0 },
              frame.offsets[1],
              frame.offsets[2],
            ],
          },
          frame.frame,
        ),
      "complete finite offsets",
    ),
  );

  type Chart = IAutoMovieSurfaceCage["corners"][number];
  const chart = (
    a: readonly [number, number],
    b: readonly [number, number],
    c: readonly [number, number],
    d: readonly [number, number],
  ): Chart => {
    const corner = ([s, t]: readonly [number, number]) => ({ patch: 0, s, t });
    return [corner(a), corner(b), corner(c), corner(d)];
  };
  const unit = chart([0, 0], [1, 0], [1, 1], [0, 1]);
  const collapsed = chart([0, 0], [0, 0], [0, 0], [0, 0]);
  const cage = (
    corners: Chart[],
    grid: boolean = false,
    columns: number = 1,
  ): IAutoMovieSurfaceCage => ({
    tier: "lowest",
    cage: {
      positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      faces: corners.map(() => [0, 1, 2, 3]),
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      uvFaces: corners.map(() => [0, 1, 2, 3]),
    },
    targets: [],
    pinned: [],
    limitTargetMask: [],
    corners,
    patches: [
      {
        name: "flat",
        grid,
        columns,
        rows: 1,
        faces: corners.map((_, index) => index),
      },
    ],
    rings: {},
    residual: 0,
  });
  const locate = (
    surface: IAutoMovieSurfaceCage,
    s: number,
    t: number,
  ): IAutoMovieSubdivisionParameter =>
    sweep.locateSurfaceCoordinate({
      cage: surface,
      coordinate: { patch: 0, s, t },
    });
  const at: IAutoMovieSubdivisionParameter = {
    face: 0,
    corner: null,
    u: 0.25,
    v: 0.75,
  };
  TestValidator.equals(
    "ordinary transition",
    locate(cage([unit]), 0.25, 0.75),
    at,
  );
  const warped = chart([0, 0], [0.5, 0], [1, 1], [0, 1]);
  TestValidator.equals(
    "warped chart inverse",
    locate(cage([warped]), 0.21875, 0.75),
    at,
  );
  TestValidator.equals(
    "collapsed face does not steal another face",
    locate(cage([collapsed, unit]), 0.25, 0.75),
    { ...at, face: 1 },
  );
  for (const invalid of [
    collapsed,
    chart([0, 0], [0.5, 0.5], [1, 1], [0.5, 0.5]),
    chart([0, 0], [1, 1], [0, 1], [1, 0]),
  ])
    TestValidator.predicate(
      "singular or folded candidate has no regular inverse",
      throwsError(() => locate(cage([invalid]), 0.5, 0.5), "lies on no face"),
    );
  const tiny = 1e-200;
  const thin = chart([0, 0], [tiny, 0], [tiny, tiny], [0, tiny]);
  const found = locate(cage([thin]), tiny / 4, (tiny * 3) / 4);
  TestValidator.predicate(
    "representable narrow chart keeps its true coordinates",
    found.face === 0 &&
      Math.abs(found.u - 0.25) < 1e-15 &&
      Math.abs(found.v - 0.75) < 1e-15,
  );
  TestValidator.equals(
    "upper grid boundary has last-face coordinates",
    locate(cage([unit], true), 1, 1),
    { face: 0, corner: null, u: 1, v: 1 },
  );
  TestValidator.predicate(
    "regular grid may not publish a missing face",
    throwsError(
      () => locate(cage([unit], true, 2), 0.75, 0.25),
      "incomplete regular grid",
    ),
  );

  const bottle = sweepBottle();
  const cap = bottle.patches.find((patch) => patch.type === "coons")!;
  const patch = {
    ...cap,
    name: "flat",
    uv: { s: { atZero: 0, atOne: 1 }, t: { atZero: 0, atOne: 1 } },
  };
  const network: IAutoMovieSurfaceNetwork = { ...bottle, patches: [patch] };
  const locateVertices = (
    surface: IAutoMovieSurfaceCage,
    parameters: readonly IAutoMovieSubdivisionParameter[],
  ) => sweep.locateSurfaceVertices({ network, cage: surface, parameters });
  TestValidator.equals(
    "empty vertex request",
    locateVertices(cage([unit]), []),
    [],
  );
  TestValidator.equals(
    "one genuine chart lookup",
    locateVertices(cage([unit]), [at]),
    [{ coordinate: { patch: 0, s: 0.25, t: 0.75 }, name: "flat", sweep: null }],
  );
  TestValidator.predicate(
    "missing vertex parameter cannot publish a hole",
    throwsError(
      () =>
        locateVertices(
          cage([unit]),
          new Array<IAutoMovieSubdivisionParameter>(1),
        ),
      "no incident-face parameter",
    ),
  );
  const badCorners: Chart[] = [
    [unit[0], unit[1], unit[2], { ...unit[3], t: NaN }],
    [unit[0], unit[1], unit[2], { ...unit[3], patch: 1 }],
  ];
  for (const invalid of badCorners)
    TestValidator.predicate(
      "nonfinite or cross-patch corners refuse",
      throwsError(
        () => locateVertices(cage([invalid]), [at]),
        "invalid chart coordinates",
      ),
    );

  const quad: [number, number, number][] = [
    [0, 0, 0],
    [1, 1, 0],
    [2, 1, 1],
    [3, 0, 1],
  ];
  const writer = sweep.layoutSurfacePatches(network);
  writer.emitFaces(0, [quad], 1, 1);
  const capture = () => [
    writer.faces.length,
    writer.uvFaces.length,
    writer.uvs.length,
    writer.corners.length,
    writer.grids[0]!.faces.length,
  ];
  const initial = capture();
  TestValidator.equals("prepared explicit quad", initial, [1, 1, 8, 1, 1]);
  TestValidator.predicate(
    "reject a later nonquad before appending the first",
    throwsError(
      () => writer.emitFaces(0, [quad, quad.slice(0, 3)], 1, 1),
      "four chart corners",
    ),
  );
  TestValidator.predicate(
    "reject a missing regular vertex before UV writes",
    throwsError(
      () =>
        writer.emit(
          0,
          [
            [0, 1],
            [2, 3],
          ],
          2,
          1,
          false,
        ),
      "grid row 0 is incomplete",
    ),
  );
  TestValidator.predicate(
    "reject nonfinite chart coordinates",
    throwsError(
      () =>
        writer.emitFaces(
          0,
          [[quad[0]!, quad[1]!, [2, NaN, 1], quad[3]!]],
          1,
          1,
        ),
      "finite chart coordinates",
    ),
  );
  TestValidator.equals(
    "invalid operations release every buffer",
    capture(),
    initial,
  );
  writer.check();

  const wrap = sweep.layoutSurfacePatches(network);
  wrap.emit(
    0,
    [
      [0, 1, 2],
      [3, 4, 5],
    ],
    3,
    1,
    true,
  );
  wrap.check();
  TestValidator.equals("wrapped faces in original order", wrap.faces, [
    [0, 1, 4, 3],
    [1, 2, 5, 4],
    [2, 0, 3, 5],
  ]);
  TestValidator.predicate(
    "same geometry with separate UV seam slots",
    wrap.faces[0]![0] === wrap.faces[2]![1] &&
      wrap.uvFaces[0]![0] !== wrap.uvFaces[2]![1],
  );
  const empty = sweep.layoutSurfacePatches(network);
  empty.emitFaces(0, [], 0, 0);
  empty.check();
  TestValidator.equals(
    "empty explicit patch retained",
    empty.grids[0]!.faces,
    [],
  );

  const wide = sweep.layoutSurfacePatches({
    ...network,
    patches: [
      { ...patch, uv: { ...patch.uv, s: { atZero: -1e308, atOne: 1e308 } } },
    ],
  });
  wide.emit(
    0,
    [
      [0, 1, 2],
      [3, 4, 5],
    ],
    2,
    1,
    false,
  );
  TestValidator.equals(
    "finite large UV aperture",
    wide.uvs,
    [-1e308, 0, 0, 0, 1e308, 0, -1e308, 1, 0, 1, 1e308, 1],
  );
}
