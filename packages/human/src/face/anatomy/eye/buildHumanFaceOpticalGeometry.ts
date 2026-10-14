import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFaceOcularCellMetric } from "./HumanFaceOcularCellMetric";
import type { resolveHumanFaceOpticalFrame } from "./resolveHumanFaceOpticalFrame";
import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceOcularCellCorner } from "./structures/IHumanFaceOcularCellCorner";

/**
 * Build one source-registered optical core and its identical closed outer hull.
 *
 * One 64-column lattice samples the anterior profile on 16 radial rings and
 * the posterior sphere in three eight-step latitude intervals: limbus to
 * equator, equator to the aperture's posterior latitude, and that latitude to
 * the posterior pole. Each pole is one point. The exterior has 2,498 points
 * and 4,992 triangles, independent of dimensions. These fixed sampling counts
 * are a rendering resolution, not an anatomical measurement or error bound.
 * The iris is a flat open annulus with eight radial intervals, 576 points and
 * 1,024 triangles; an opening is not patched into iris tissue.
 *
 * Corneal front points and the scleral limbal ring are the very same generated
 * points. The corneal back is the supplied axial offset; an outward rim wall
 * closes that shell. Wall shading duplicates corner attributes with the same
 * physical point IDs. The black interior backing is a reversed finish of the
 * opaque scleral sheet, not a retina, lens or pupil tissue model. This thin
 * opaque backing prevents a clear cap from exposing an empty scene.
 *
 * Physical IDs name points of this constructed core only. The face assembly
 * must bind them to its actual document/source/side instance before publication;
 * this geometry carries no generation-only instance domain. Drawing's
 * outer profile and contact's hull are sampled once, not independently fitted.
 * The deviation reader optionally reports each outer cell only after its actual
 * metric bound returned. Its branch and cell ordinal identify that certificate,
 * not a displayed inner shell or an anatomical validity claim. Observer errors
 * propagate; no timer, geometry buffer or estimated progress is emitted.
 *
 * @evidence contracts/common.md#principled-implementation One fixed polar lattice builds the shared closed exterior and optical sheets from the admitted cap/sphere profile in the qualified source frame.
 * @evidence contracts/common.md#clear-and-simple-design Actual physical point ordinals connect corneal/scleral shading aliases; one hull and cell metric serve drawing and contact consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling is a rendering convention rather than an anatomical error claim; backing is opaque rendering support, and observer errors are not swallowed.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies fixed counts, metric frame, shell offset, instance-domain ownership and certificate limitations.
 * @evidence contracts/performance.md#efficient-algorithms Construction uses fixed 64-column/16-cap-ring and three eight-step sphere intervals; each deviation pass evaluates all 4,992 actual hull triangles.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared limbal points, maps and one captured cell metric reuse exact generating incidence and complete value-keyed corner results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Geometry and its readDeviation closure retain local point/parameter arrays and metric caches for caller lifetime; arbitrary future frames can grow cache entries without an independent limit.
 */
export function buildHumanFaceOpticalGeometry(
  profile: ReturnType<typeof resolveHumanFaceOpticalProfile>,
  frame: ReturnType<typeof resolveHumanFaceOpticalFrame>,
): { hull: { mesh: IAutoMovieMesh; physicalPoints: number[]; }; parts: { sclera: { mesh: IAutoMovieMesh; physicalPoints: number[]; }; cornea: { mesh: IAutoMovieMesh; physicalPoints: number[]; }; iris: { mesh: IAutoMovieMesh; physicalPoints: number[]; }; apertureBacking: { mesh: IAutoMovieMesh; physicalPoints: number[]; }; }; readDeviation: (currentFrame: ReturnType<typeof resolveHumanFaceOpticalFrame>, progress?: (branch: "cap" | "sphere", cell: number) => void) => number; }  {
  const columns: number = 64 as const,
    capRings: number = 16 as const;
  const positions: number[][] = [],
    normals: number[][] = [],
    local: number[][] = [];
  const capParameters: Map<number, readonly [number, number]> = new Map<number, readonly [number, number]>();
  const sphereParameters: Map<number, readonly [number, number]> = new Map<number, readonly [number, number]>();
  const direction: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3  =>
    Vector3.add(
      Vector3.scale(frame.lateral, x),
      Vector3.add(Vector3.scale(frame.up, y), Vector3.scale(frame.axis, z)),
    );
  const add: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => number = (
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
  ): number  => {
    const p: IAutoMovieVector3 = Vector3.add(frame.center, direction(x, y, z));
    const n: IAutoMovieVector3 = Vector3.normalize(direction(nx, ny, nz));
    if (
      ![p.x, p.y, p.z, n.x, n.y, n.z].every(Number.isFinite) ||
      Vector3.length(n) === 0
    )
      throw new Error(
        "Independent optical geometry is not representable in the source frame.",
      );
    const id: number = positions.length;
    positions.push([p.x, p.y, p.z]);
    normals.push([n.x, n.y, n.z]);
    local.push([x, y, z]);
    return id;
  };
  const ring: (radius: number, z: number, slope: number) => number[] = (radius: number, z: number, slope: number): number[]  =>
    Array.from({ length: columns }, (_: unknown, column: number): number  => {
      const angle: number = (2 * Math.PI * column) / columns;
      const x: number = Math.cos(angle),
        y: number = Math.sin(angle);
      return add(radius * x, radius * y, z, -slope * x, -slope * y, 1);
    });
  const connect: (a: readonly number[], b: readonly number[]) => number[] = (a: readonly number[], b: readonly number[]): number[]  => {
    const triangles: number[] = [];
    for (let column: number = 0; column < columns; column++) {
      const next: number = (column + 1) % columns;
      triangles.push(
        a[column],
        b[column],
        b[next],
        a[column],
        b[next],
        a[next],
      );
    }
    return triangles;
  };
  const frontPole: number = add(0, 0, profile.apex, 0, 0, 1);
  capParameters.set(frontPole, [0, 0]);
  const frontRings: number[][] = Array.from({ length: capRings }, (_: unknown, row: number): number[]  => {
    const r: number = (profile.limbus * (row + 1)) / capRings;
    const ids: number[] = ring(r, profile.height(r), profile.slope(r));
    ids.forEach((id: number, column: number): Map<number, readonly [number, number]>  =>
      capParameters.set(id, [r, (2 * Math.PI * column) / columns]),
    );
    return ids;
  });
  const front: number[] = [];
  for (let column: number = 0; column < columns; column++)
    front.push(
      frontPole,
      frontRings[0][column],
      frontRings[0][(column + 1) % columns],
    );
  for (let row: number = 1; row < capRings; row++)
    front.push(...connect(frontRings[row - 1], frontRings[row]));
  const sphere: number[] = [];
  let previous: number[] = frontRings.at(-1)!;
  let start: number = Math.asin(profile.limbus / profile.radius);
  previous.forEach((id: number, column: number): Map<number, readonly [number, number]>  =>
    sphereParameters.set(id, [start, (2 * Math.PI * column) / columns]),
  );
  const endpoints: number[] = [
    Math.PI / 2,
    Math.PI - Math.asin(profile.aperture / profile.radius),
    Math.PI,
  ];
  for (let interval: number = 0; interval < endpoints.length; interval++) {
    const end: number = endpoints[interval];
    for (let step: number = 1; step <= 8; step++) {
      if (interval === 2 && step === 8) {
        const pole: number = add(0, 0, -profile.radius, 0, 0, -1);
        sphereParameters.set(pole, [Math.PI, 0]);
        for (let column: number = 0; column < columns; column++)
          sphere.push(previous[column], pole, previous[(column + 1) % columns]);
      } else {
        const angle: number = step === 8 ? end : start + ((end - start) * step) / 8;
        const r: number =
          step === 8
            ? interval === 0
              ? profile.radius
              : profile.aperture
            : profile.radius * Math.sin(angle);
        const z: number =
          step === 8
            ? interval === 0
              ? 0
              : -Math.sqrt(profile.radius ** 2 - profile.aperture ** 2)
            : profile.radius * Math.cos(angle);
        const current: number[] = Array.from({ length: columns }, (_: unknown, column: number): number  => {
          const phi: number = (2 * Math.PI * column) / columns;
          const x: number = r * Math.cos(phi),
            y: number = r * Math.sin(phi);
          const id: number = add(
            x,
            y,
            z,
            x / profile.radius,
            y / profile.radius,
            z / profile.radius,
          );
          sphereParameters.set(id, [angle, phi]);
          return id;
        });
        sphere.push(...connect(previous, current));
        previous = current;
      }
    }
    start = end;
  }
  const make: (triangles: readonly number[], inward?: boolean, irisUvs?: boolean) => { mesh: IAutoMovieMesh; physicalPoints: number[]; } = (
    triangles: readonly number[],
    inward: boolean = false,
    irisUvs: boolean = false,
  ): { mesh: IAutoMovieMesh; physicalPoints: number[]; }  => {
    const ids: number[] = [],
      map: Map<number, number> = new Map<number, number>();
    const indices: number[] = triangles.map((id: number): number  => {
      if (!map.has(id)) {
        map.set(id, ids.length);
        ids.push(id);
      }
      return map.get(id)!;
    });
    const mesh: IAutoMovieMesh = {
      positions: ids.flatMap((id: number): number[]  => positions[id]),
      normals: ids.flatMap((id: number): number[]  =>
        inward ? normals[id].map((n: number): number  => -n) : normals[id],
      ),
      indices,
      uvs: irisUvs
        ? ids.flatMap((id: number): number[]  => [
            local[id][0] / (2 * profile.iris) + 0.5,
            local[id][1] / (2 * profile.iris) + 0.5,
          ])
        : null,
      skin: null,
    };
    return { mesh, physicalPoints: ids };
  };
  const reverse: (rows: readonly number[]) => number[] = (rows: readonly number[]): number[]  => {
    const result: number[] = [];
    for (let at: number = 0; at < rows.length; at += 3)
      result.push(rows[at], rows[at + 2], rows[at + 1]);
    return result;
  };
  const hull: { mesh: IAutoMovieMesh; physicalPoints: number[]; } = make([...front, ...sphere]);
  const sclera: { mesh: IAutoMovieMesh; physicalPoints: number[]; } = make(sphere);
  const apertureBacking: { mesh: IAutoMovieMesh; physicalPoints: number[]; } = make(reverse(sphere), true);
  const back: Map<number, number> = new Map<number, number>();
  const frontIds: number[] = [...new Set(front)];
  for (const id of frontIds) {
    const [x, y, z]: number[] = local[id];
    const n: number[] = normals[id];
    const p: IAutoMovieVector3 = Vector3.add(frame.center, direction(x, y, z - profile.thickness));
    const next: number = positions.length;
    positions.push([p.x, p.y, p.z]);
    normals.push(n.map((v: number): number  => -v));
    local.push([x, y, z - profile.thickness]);
    back.set(id, next);
  }
  const cornea: { mesh: IAutoMovieMesh; physicalPoints: number[]; } = make([...front, ...reverse(front).map((id: number): number  => back.get(id)!)]);
  const rim: number[] = frontRings.at(-1)!;
  // The wall owns different shading incidence at the same constructed points.
  for (let column: number = 0; column < columns; column++) {
    const next: number = (column + 1) % columns;
    const corners: number[] = [
      rim[column],
      back.get(rim[column])!,
      back.get(rim[next])!,
      rim[next],
    ];
    const offset: number = cornea.mesh.positions.length / 3;
    for (let i: number = 0; i < corners.length; i++) {
      const id: number = corners[i],
        angle: number = (2 * Math.PI * (i < 2 ? column : next)) / columns;
      const normal: IAutoMovieVector3 = direction(Math.cos(angle), Math.sin(angle), 0);
      cornea.mesh.positions.push(...positions[id]);
      cornea.mesh.normals!.push(normal.x, normal.y, normal.z);
      cornea.physicalPoints.push(id);
    }
    cornea.mesh.indices!.push(
      offset,
      offset + 1,
      offset + 2,
      offset,
      offset + 2,
      offset + 3,
    );
  }
  const irisRings: number[][] = Array.from({ length: 9 }, (_: unknown, row: number): number[]  =>
    ring(
      profile.aperture + ((profile.iris - profile.aperture) * row) / 8,
      profile.irisZ,
      0,
    ),
  );
  const irisTriangles: number[] = [];
  for (let row: number = 1; row < irisRings.length; row++)
    irisTriangles.push(...connect(irisRings[row - 1], irisRings[row]));
  const iris: { mesh: IAutoMovieMesh; physicalPoints: number[]; } = make(irisTriangles, false, true);
  const metric: HumanFaceOcularCellMetric = new HumanFaceOcularCellMetric(profile);
  const hullVertices: Map<number, number> = new Map(hull.physicalPoints.map((id: number, at: number): [number, number]  => [id, at]));
  const readDeviation: (currentFrame: ReturnType<typeof resolveHumanFaceOpticalFrame>, progress?: (branch: "cap" | "sphere", cell: number) => void) => number = (
    currentFrame: ReturnType<typeof resolveHumanFaceOpticalFrame>,
    progress?: (branch: "cap" | "sphere", cell: number) => void,
  ): number => {
    let maximum: number = 0;
    for (const [branch, triangles, parameters] of [
      ["cap", front, capParameters],
      ["sphere", sphere, sphereParameters],
    ] as const)
      for (let at: number = 0; at < triangles.length; at += 3) {
        const ids: number[] = triangles.slice(at, at + 3);
        const rows: number[][] = ids.map((id: number): number[]  => [...parameters.get(id)!]);
        // A pole has no azimuth; use its own incident sector's coordinate.
        const sector: number = ids.findIndex(
          (id: number): boolean  => local[id][0] !== 0 || local[id][1] !== 0,
        );
        for (let corner: number = 0; corner < 3; corner++)
          if (local[ids[corner]][0] === 0 && local[ids[corner]][1] === 0)
            rows[corner][1] = rows[sector][1];
        if (
          Math.max(...rows.map((row: number[]): number  => row[1])) -
            Math.min(...rows.map((row: number[]): number  => row[1])) >
          Math.PI
        )
          for (const row of rows) if (row[1] < Math.PI) row[1] += 2 * Math.PI;
        const corners: IHumanFaceOcularCellCorner[] = ids.map((id: number, corner: number): { meridianParameter: number; azimuthParameter: number; position: number[]; }  => ({
          meridianParameter: rows[corner][0],
          azimuthParameter: rows[corner][1],
          position: hull.mesh.positions.slice(
            3 * hullVertices.get(id)!,
            3 * hullVertices.get(id)! + 3,
          ),
        }));
        maximum = Math.max(
          maximum,
          metric.bound(branch, currentFrame, corners),
        );
        progress?.(branch, at / 3);
      }
    return maximum;
  };
  return {
    hull,
    parts: { sclera, cornea, iris, apertureBacking },
    readDeviation,
  };
}
