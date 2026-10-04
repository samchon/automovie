import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import { assertDirection } from "../../common/mesh/assertDirection";
import { triangleAreaVector } from "../../common/mesh/triangleAreaVector";
import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Subdivide one posed skin region onto the common face/body neck polyline.
 *
 * The canonical boundary is the face loop plus every body-loop projection on
 * its edges. Both sides insert that same sorted union. A body edge spanning a
 * face corner follows the corner rather than its old chord, so the meeting
 * has no intervening ribbon of numerically collinear triangles. Boundary
 * points and unit normals come from the evaluated face loop on both sides.
 * UVs, colour and relief remain the region's own, interpolated along its edge.
 * Boundary samples with exactly equal Float32 XYZ values share one parameter,
 * with face corners registered first. This owns the renderer's precision
 * partition before subdividing: distinct samples that the output format
 * cannot distinguish must not create a tiny triangle that rounding collapses.
 * A skin triangle whose boundary corners become the same shared point has
 * no surface and is omitted, just as welded pole triangles carry no surface.
 *
 * Face triangles are split along their existing edges, producing one extra
 * triangle per inserted sample and no redundant interior vertex. A body
 * triangle whose replacement boundary bends through a face corner retains
 * its original interior centroid and interpolated attributes; its perimeter
 * is a fan around that point. This preserves the body's original interior
 * instead of choosing a diagonal that changes the surface through it.
 * A boundary needing no inserted point retains its original triangle.
 * The collar's replaced perimeter must remain star-shaped about that
 * centroid; each fan face must retain a positive oriented-area dot product
 * with the original triangle, so a folded subdivision refuses. This is a
 * geometric admission condition of the assembled neck, not a guarantee for
 * arbitrary mismatched documents. The downstream model and Float32 gates
 * still judge the emitted surface. A direction refusal reports the side and
 * original/emitted coordinates, so a caller can distinguish a posed fold
 * from precision loss without weakening either admission gate. Supplying the
 * body's source positions before collar alignment adds native/member/follow
 * and band provenance to that refusal only; valid output is unchanged.
 *
 * This stage follows posing: the mesh must be static, and `sources` maps
 * each region vertex to its connected skin source. It copies all arrays;
 * every result is in metres in the shared Y-up, Z-forward frame. Changing
 * the seam or either basis invalidates the region's subdivision.
 * Registered meshes require the face boundary's explicit source pairs.
 * Existing endpoint pairs must agree, and metadata is copied independently.
 * A new edge point or centroid needs a registration owner this stage does
 * not supply, so correspondence-present subdivision refuses that case.
 *
 * @evidence contracts/common.md#principled-implementation A union of the two ordered edge partitions gives both surfaces identical segments; interpolating each shared point from the same face edge avoids a floating-point definition on each side, and centroid fans subdivide the incident skins rather than emitting degenerate joining faces.
 * @evidence contracts/common.md#clear-and-simple-design One canonical ordered boundary feeds region-local edge subdivision and attribute interpolation; the person builder supplies the already posed surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No area threshold exempts a face from precision admission; shared positions are derived from boundary identity, and no basis or subject is singled out.
 * @evidence contracts/common.md#meaningful-documentation States the canonical boundary, attribute ownership, stage order, centroid assumption, precision gate and mutation rule.
 * @evidence contracts/modeling.md#spatial-conventions Positions remain metres in the shared frame; parameters are dimensionless positions along the face's numbered edges.
 * @evidence contracts/modeling.md#shared-boundaries Both skins use the union of the face vertices and projected body vertices, with one position and normal calculation for every boundary sample.
 * @evidence contracts/modeling.md#emitted-geometry Face edge subdivision emits one additional triangle per inserted point, the minimum polygon triangulation without an interior vertex. A nonplanar body perimeter retains the old triangle centroid, requiring one fan triangle per perimeter segment; neither path adds geometry when there is no inserted sample.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Subdivides an existing material region and creates no new part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored shape channel.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical measurement or tissue model; it joins already evaluated skin boundaries.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical document admission precedes this mesh stage.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The inputs are internal evaluated meshes and their source identities, not user sculpting controls.
 */
export function stitchHumanPersonBoundary(props: {
  mesh: IAutoMovieMesh;
  sources: readonly number[];
  side: "face" | "body";
  seam: IAutoMovieHumanPersonSeam;
  face: readonly number[];
  faceNormals: readonly number[];
  /** Body source positions after rig posing, before collar alignment; failure provenance only. */
  bodyBeforeCollar?: readonly number[];
  /** Canonical physical pairs aligned with the registered face loop. */
  physicalBoundary?: readonly { domain: string; id: number }[];
}): IAutoMovieMesh {
  const { mesh, sources, side, seam, face, faceNormals, bodyBeforeCollar } = props;
  if (mesh.skin !== null)
    throw new Error("Person boundary subdivision requires an already posed mesh.");
  const count = seam.faceLoop.length;
  if (mesh.physicalVertices !== undefined) {
    resolveAutoMovieMeshPhysicalVertices(mesh);
    if (props.physicalBoundary === undefined || props.physicalBoundary.length !== count)
      throw new Error("Person physical registration needs the complete registered face boundary.");
  }
  const pointAt = (parameter: number): number[] => {
    const edge = Math.floor(parameter);
    const fraction = parameter - edge;
    const a = seam.faceLoop[edge];
    const b = seam.faceLoop[(edge + 1) % count];
    return [0, 1, 2].map(
      (axis) => face[a * 3 + axis] * (1 - fraction) + face[b * 3 + axis] * fraction,
    );
  };
  const precisionKey = (parameter: number): string =>
    pointAt(parameter).map(Math.fround).join(":");
  const represented = new Map(seam.faceLoop.map((_, edge) => [precisionKey(edge), edge]));
  const bodyParameters = seam.collar.follow.map(
    ({ edge, fraction }) => (edge + fraction) % count,
  ).map((parameter) => {
    const key = precisionKey(parameter);
    const existing = represented.get(key);
    if (existing !== undefined) return existing;
    represented.set(key, parameter);
    return parameter;
  });
  const parameters = [...new Set([
    ...seam.faceLoop.map((_, edge) => edge),
    ...bodyParameters,
  ])].sort((a, b) => a - b);
  const loop = side === "face" ? seam.faceLoop : seam.bodyLoop;
  const localParameters = side === "face"
    ? loop.map((_, edge) => edge)
    : bodyParameters;
  const parameterOf = new Map(loop.map((source, k) => [source, localParameters[k]]));
  const edges = new Set(loop.map((source, k) => source + ":" + loop[(k + 1) % loop.length]));
  const output: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.slice(),
    normals: mesh.normals?.slice() ?? null,
    uvs: mesh.uvs?.slice() ?? null,
    ...(mesh.colors === undefined ? {} : { colors: mesh.colors.slice() }),
    ...(mesh.reliefWeights === undefined ? {} : { reliefWeights: mesh.reliefWeights.slice() }),
    indices: [],
    ...(mesh.physicalVertices === undefined ? {} : {
      physicalVertices: {
        sources: mesh.physicalVertices.sources.map((source) => ({ ...source })),
        vertices: mesh.physicalVertices.vertices.slice(),
      },
    }),
  };
  const canonical = (parameter: number): { point: number[]; normal: number[] } => {
    const edge = Math.floor(parameter);
    const fraction = parameter - edge;
    const a = seam.faceLoop[edge];
    const b = seam.faceLoop[(edge + 1) % count];
    const interpolate = (values: readonly number[]) => [0, 1, 2].map(
      (axis) => values[a * 3 + axis] * (1 - fraction) + values[b * 3 + axis] * fraction,
    );
    const normal = interpolate(faceNormals);
    const length = Math.hypot(...normal);
    if (!(length > 0))
      throw new Error("A shared person boundary needs a nonzero interpolated normal.");
    return { point: pointAt(parameter), normal: normal.map((value) => value / length) };
  };
  sources.forEach((source, vertex) => {
    const parameter = parameterOf.get(source);
    if (parameter === undefined) return;
    if (output.physicalVertices !== undefined) {
      const reference = output.physicalVertices.vertices[vertex];
      const actual = reference === null ? undefined : output.physicalVertices.sources[reference];
      const expected = Number.isInteger(parameter) ? props.physicalBoundary![parameter] : undefined;
      if (actual === undefined || expected === undefined ||
          actual.domain !== expected.domain || actual.id !== expected.id)
        throw new Error("Person physical registration needs matching registered boundary endpoint identities.");
    }
    const value = canonical(parameter);
    output.positions.splice(vertex * 3, 3, ...value.point);
    output.normals?.splice(vertex * 3, 3, ...value.normal);
  });
  const append = (vertices: readonly number[], weights: readonly number[], parameter?: number): number => {
    if (output.physicalVertices !== undefined)
      throw new Error("Person physical registration does not support an unregistered boundary point or centroid.");
    const vertex = output.positions.length / 3;
    const weighted = (values: readonly number[], width: number): number[] =>
      Array.from({ length: width }, (_, axis) => vertices.reduce(
        (sum, source, k) => sum + values[source * width + axis] * weights[k], 0,
      ));
    const shared = parameter === undefined ? undefined : canonical(parameter);
    output.positions.push(...(shared?.point ?? weighted(output.positions, 3)));
    if (output.normals !== null) {
      const normal = shared?.normal ?? weighted(output.normals, 3);
      const length = Math.hypot(...normal);
      if (!(length > 0)) throw new Error("A person subdivision centroid needs a nonzero normal.");
      output.normals.push(...normal.map((value) => value / length));
    }
    if (output.uvs !== null) output.uvs.push(...weighted(output.uvs, 2));
    if (output.colors !== undefined) output.colors.push(...weighted(output.colors, 3));
    if (output.reliefWeights !== undefined) output.reliefWeights.push(...weighted(output.reliefWeights, 1));
    return vertex;
  };
  const edgePoints = (a: number, b: number): number[] | undefined => {
    const from = sources[a];
    const to = sources[b];
    const forward = edges.has(from + ":" + to);
    if (!forward && !edges.has(to + ":" + from)) return undefined;
    const start = parameterOf.get(from)!;
    const finish = parameterOf.get(to)!;
    const direction = (side === "face" ? 1 : -1) * (forward ? 1 : -1);
    const distance = (direction * (finish - start) + count) % count;
    const inside = parameters.map((parameter) => ({
      parameter,
      distance: (direction * (parameter - start) + count) % count,
    })).filter((point) => point.distance > 0 && point.distance < distance)
      .sort((a, b) => a.distance - b.distance);
    const added = inside.map((point) => append(
      [a, b], [1 - point.distance / distance, point.distance / distance], point.parameter,
    ));
    return added;
  };
  const indices = mesh.indices ?? sources.map((_, vertex) => vertex);
  const assertSubdivision = (
    before: ReturnType<typeof triangleAreaVector>,
    original: number[],
    corners: number[],
    triangle: number,
    perimeter: number[],
  ): void => {
    try {
      assertDirection(before, triangleAreaVector(output.positions, corners, 0), triangle, "person boundary subdivision");
    } catch (error) {
      const points = (vertices: number[]): number[][] => vertices.map(
        (vertex) => output.positions.slice(vertex * 3, vertex * 3 + 3),
      );
      const input = original.map((vertex) => mesh.positions.slice(vertex * 3, vertex * 3 + 3));
      const sourceIds = original.map((vertex) => sources[vertex]);
      const attributes = (values: readonly number[] | null | undefined, width: number, vertices: number[]): number[][] | null =>
        values === undefined || values === null ? null : vertices.map(
          (vertex) => values.slice(vertex * width, vertex * width + width),
        );
      const neighbours = [];
      for (let start = 0; start < indices.length; start += 3) {
        if (start / 3 === triangle) continue;
        const vertices = indices.slice(start, start + 3);
        if (vertices.filter((vertex) => sourceIds.includes(sources[vertex])).length < 2) continue;
        neighbours.push({
          triangle: start / 3,
          corners: vertices,
          sources: vertices.map((vertex) => sources[vertex]),
          positions: attributes(mesh.positions, 3, vertices),
          normals: attributes(mesh.normals, 3, vertices),
          uvs: attributes(mesh.uvs, 2, vertices),
          colors: attributes(mesh.colors, 3, vertices),
          reliefWeights: attributes(mesh.reliefWeights, 1, vertices),
        });
      }
      const target = (loop: number): number[] => {
        const follow = seam.collar.follow[loop];
        return pointAt((follow.edge + follow.fraction) % count);
      };
      const lineage = bodyBeforeCollar === undefined ? null : [
        ...new Set([...original, ...neighbours.flatMap((one) => one.corners)]),
      ].map((vertex) => {
        const source = sources[vertex];
        const loop = seam.bodyLoop.indexOf(source);
        const band = seam.collar.band.find((one) => one.vertex === source);
        const before = (id: number): number[] => bodyBeforeCollar.slice(id * 3, id * 3 + 3);
        return {
          source,
          nativePosed: before(source),
          collarInput: mesh.positions.slice(vertex * 3, vertex * 3 + 3),
          loop: loop < 0 ? null : { index: loop, follow: seam.collar.follow[loop], target: target(loop) },
          band: band === undefined ? null : {
            ...band,
            lowSource: seam.bodyLoop[band.low],
            highSource: seam.bodyLoop[band.high],
            lowNative: before(seam.bodyLoop[band.low]),
            highNative: before(seam.bodyLoop[band.high]),
            lowTarget: target(band.low),
            highTarget: target(band.high),
          },
        };
      });
      throw new Error(`${String(error)} Side=${side}; original=${JSON.stringify(points(original))}; emitted=${JSON.stringify(points(corners))}; input=${JSON.stringify(input)}; perimeter=${JSON.stringify(points(perimeter))}; sources=${JSON.stringify(sourceIds)}; neighbours=${JSON.stringify(neighbours)}; lineage=${JSON.stringify(lineage)}.`);
    }
  };
  for (let at = 0; at < indices.length; at += 3) {
    const triangle = indices.slice(at, at + 3);
    const perimeter: number[] = [];
    const splits: { from: number; to: number; added: number[] }[] = [];
    let touched = false;
    for (let k = 0; k < 3; k++) {
      const a = triangle[k];
      const b = triangle[(k + 1) % 3];
      const added = edgePoints(a, b);
      touched ||= added !== undefined;
      if (added !== undefined) splits.push({ from: a, to: b, added });
      perimeter.push(a, ...(added ?? []));
    }
    if (!touched) output.indices!.push(...triangle);
    else {
      const repeated = triangle.some((vertex, k) => [0, 1, 2].every(
        (axis) => output.positions[vertex * 3 + axis] ===
          output.positions[triangle[(k + 1) % 3] * 3 + axis],
      ));
      if (repeated) continue;
      if (perimeter.length === 3) {
        output.indices!.push(...triangle);
        continue;
      }
      const before = triangleAreaVector(output.positions, triangle, 0);
      if (side === "face") {
        const pieces = [triangle];
        for (const split of splits) {
          let from = split.from;
          for (const vertex of split.added) {
            // Earlier splits leave every unprocessed boundary segment in
            // exactly one piece, with its original directed edge.
            const owner = pieces.findIndex((piece) => piece.some(
              (corner, k) => corner === from && piece[(k + 1) % 3] === split.to,
            ));
            const piece = pieces[owner];
            const third = piece[(piece.indexOf(from) + 2) % 3];
            pieces.splice(owner, 1, [from, vertex, third], [vertex, split.to, third]);
            from = vertex;
          }
        }
        for (const corners of pieces) {
          assertSubdivision(before, triangle, corners, at / 3, perimeter);
          output.indices!.push(...corners);
        }
        continue;
      }
      const centre = append(triangle, [1 / 3, 1 / 3, 1 / 3]);
      for (let k = 0; k < perimeter.length; k++) {
        const corners = [centre, perimeter[k], perimeter[(k + 1) % perimeter.length]];
        assertSubdivision(before, triangle, corners, at / 3, perimeter);
        output.indices!.push(...corners);
      }
    }
  }
  if (output.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
