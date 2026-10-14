import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import { triangleAreaVector } from "../../common/mesh/triangleAreaVector";
import type { IAutoMovieHumanPersonBoundarySample } from "../structures/IAutoMovieHumanPersonBoundarySample";
import type { IAutoMovieHumanPersonBoundaryStitchProps } from "../structures/IAutoMovieHumanPersonBoundaryStitchProps";
import type { IAutoMovieHumanPersonEdgeSplit } from "../structures/IAutoMovieHumanPersonEdgeSplit";
import { assertHumanPersonSubdivision } from "./assertHumanPersonSubdivision";

/**
 * Subdivide one posed skin region onto the common face/body neck polyline.
 *
 * Face corner parameters and body projections form one sorted union. Body edge paths can pass through face corners instead of an old chord; both sides read actual face-loop positions and normalized interpolated normals. UV/colour/relief stay region-owned and an optional scalar receipt reads each appended point's same parent weights. Body projection keys use exact Float32 XYZ, first seeding face corners; repeated face-key insertion retains the last corner parameter, while the original face corner population itself remains present. Existing consumer gates still admit the emitted Float32 triangles.
 *
 * Face triangles split existing boundary edges without an interior vertex. A body triangle with inserted perimeter points uses its current interior centroid and interpolated attributes as a fan. Each new piece must retain positive original-area direction. Without inserted points the original triangle remains; exactly coincident current boundary corners omit its zero-surface triangle. This local orientation admission is not full star-shapedness, manifoldness, collision or clinical neck-fit proof. Failure-only original/body-collar/band provenance remains with the shared subdivision checker.
 *
 * Inputs are already posed static metre/Y-up/Z-forward mesh arrays with admitted finite source/loop/field populations; output buffers and physical records are copied. Registered endpoints must match explicit face source pairs, and any new edge point or centroid refuses because this owner supplies no new canonical registration. Nonzero interpolated normal admission retains its existing arithmetic premise; final resident/output checks remain downstream. Changing basis/seam invalidates subdivision correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Common face/body parameter union retains actual face-loop coordinates and shared unit normals; exact parent attribute weights and positive emitted-piece orientation preserve local source subdivision meaning.
 * @evidence contracts/common.md#clear-and-simple-design This owner composes parameter/edge splits and body fans while scalar area/orientation, canonical alias admission and failure provenance use their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered unowned inserts refuse, Float32 body-key behavior remains explicit, and local orientation is not claimed a global topology, clearance or clinical neck-fit certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, face/body splitting differences, actual export-key ordering, copied ownership and source/normal premises.
 * @evidence contracts/performance.md#efficient-algorithms Union sorting costs O(U log U); each boundary edge filters/sorts the U parameters and appends actual points. Face split ownership searches growing piece lists, body fans cost emitted perimeter size, and failure diagnostics pay their actual source-neighbour cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One common parameter map and face-loop normal reader serve both split paths; aligned attributes and optional scalar receipts use the same actual append weights rather than independent geometry reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Union/maps/split receipts are call-local; copied output arrays/metadata belong to the caller, with output growth driven by actual parameter intersections and no retained subdivision cache or task.
 */
export function stitchHumanPersonBoundary(
  props: IAutoMovieHumanPersonBoundaryStitchProps,
): IAutoMovieMesh {
  const {
    mesh,
    sources,
    side,
    seam,
    face,
    faceNormals,
  }: IAutoMovieHumanPersonBoundaryStitchProps = props;
  if (mesh.skin !== null)
    throw new Error(
      "Person boundary subdivision requires an already posed mesh.",
    );
  const count: number = seam.faceLoop.length;
  if (mesh.physicalVertices !== undefined) {
    resolveAutoMovieMeshPhysicalVertices(mesh);
    if (
      props.physicalBoundary === undefined ||
      props.physicalBoundary.length !== count
    )
      throw new Error(
        "Person physical registration needs the complete registered face boundary.",
      );
  }
  const pointAt: (parameter: number) => number[] = (
    parameter: number,
  ): number[] => {
    const edge: number = Math.floor(parameter);
    const fraction: number = parameter - edge;
    const a: number = seam.faceLoop[edge];
    const b: number = seam.faceLoop[(edge + 1) % count];
    return [0, 1, 2].map(
      (axis: number): number =>
        face[a * 3 + axis] * (1 - fraction) + face[b * 3 + axis] * fraction,
    );
  };
  const precisionKey: (parameter: number) => string = (
    parameter: number,
  ): string => pointAt(parameter).map(Math.fround).join(":");
  const represented: Map<string, number> = new Map(
    seam.faceLoop.map((_: number, edge: number): [string, number] => [
      precisionKey(edge),
      edge,
    ]),
  );
  const bodyParameters: number[] = seam.collar.follow
    .map(
      ({ edge, fraction }: (typeof seam.collar.follow)[number]): number =>
        (edge + fraction) % count,
    )
    .map((parameter: number): number => {
      const key: string = precisionKey(parameter);
      const existing: number | undefined = represented.get(key);
      if (existing !== undefined) return existing;
      represented.set(key, parameter);
      return parameter;
    });
  const parameters: number[] = [
    ...new Set([
      ...seam.faceLoop.map((_: number, edge: number): number => edge),
      ...bodyParameters,
    ]),
  ].sort((a: number, b: number): number => a - b);
  const loop: readonly number[] =
    side === "face" ? seam.faceLoop : seam.bodyLoop;
  const localParameters: number[] =
    side === "face"
      ? loop.map((_: number, edge: number): number => edge)
      : bodyParameters;
  const parameterOf: Map<number, number> = new Map(
    loop.map((source: number, k: number): [number, number] => [
      source,
      localParameters[k],
    ]),
  );
  const edges: Set<string> = new Set(
    loop.map(
      (source: number, k: number): string =>
        source + ":" + loop[(k + 1) % loop.length],
    ),
  );
  const output: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.slice(),
    normals: mesh.normals?.slice() ?? null,
    uvs: mesh.uvs?.slice() ?? null,
    ...(mesh.colors === undefined ? {} : { colors: mesh.colors.slice() }),
    ...(mesh.reliefWeights === undefined
      ? {}
      : { reliefWeights: mesh.reliefWeights.slice() }),
    indices: [],
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources.map(
              (
                source: NonNullable<
                  IAutoMovieMesh["physicalVertices"]
                >["sources"][number],
              ): NonNullable<
                IAutoMovieMesh["physicalVertices"]
              >["sources"][number] => ({
                ...source,
              }),
            ),
            vertices: mesh.physicalVertices.vertices.slice(),
          },
        }),
  };
  const canonical: (
    parameter: number,
  ) => IAutoMovieHumanPersonBoundarySample = (
    parameter: number,
  ): IAutoMovieHumanPersonBoundarySample => {
    const edge: number = Math.floor(parameter);
    const fraction: number = parameter - edge;
    const a: number = seam.faceLoop[edge];
    const b: number = seam.faceLoop[(edge + 1) % count];
    const interpolate: (values: readonly number[]) => number[] = (
      values: readonly number[],
    ): number[] =>
      [0, 1, 2].map(
        (axis: number): number =>
          values[a * 3 + axis] * (1 - fraction) +
          values[b * 3 + axis] * fraction,
      );
    const normal: number[] = interpolate(faceNormals);
    const length: number = Math.hypot(...normal);
    if (!(length > 0))
      throw new Error(
        "A shared person boundary needs a nonzero interpolated normal.",
      );
    return {
      point: pointAt(parameter),
      normal: normal.map((value: number): number => value / length),
    };
  };
  sources.forEach((source: number, vertex: number): void => {
    const parameter: number | undefined = parameterOf.get(source);
    if (parameter === undefined) return;
    if (output.physicalVertices !== undefined) {
      const reference: number | null = output.physicalVertices.vertices[vertex];
      const actual:
        | NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"][number]
        | undefined =
        reference === null
          ? undefined
          : output.physicalVertices.sources[reference];
      const expected:
        | NonNullable<
            IAutoMovieHumanPersonBoundaryStitchProps["physicalBoundary"]
          >[number]
        | undefined = Number.isInteger(parameter)
        ? props.physicalBoundary![parameter]
        : undefined;
      if (
        actual === undefined ||
        expected === undefined ||
        actual.domain !== expected.domain ||
        actual.id !== expected.id
      )
        throw new Error(
          "Person physical registration needs matching registered boundary endpoint identities.",
        );
    }
    const value: IAutoMovieHumanPersonBoundarySample = canonical(parameter);
    output.positions.splice(vertex * 3, 3, ...value.point);
    output.normals?.splice(vertex * 3, 3, ...value.normal);
  });
  const append: (
    vertices: readonly number[],
    weights: readonly number[],
    parameter?: number,
  ) => number = (
    vertices: readonly number[],
    weights: readonly number[],
    parameter?: number,
  ): number => {
    if (output.physicalVertices !== undefined)
      throw new Error(
        "Person physical registration does not support an unregistered boundary point or centroid.",
      );
    const vertex: number = output.positions.length / 3;
    const weighted: (values: readonly number[], width: number) => number[] = (
      values: readonly number[],
      width: number,
    ): number[] =>
      Array.from({ length: width }, (_: unknown, axis: number): number =>
        vertices.reduce(
          (sum: number, source: number, k: number): number =>
            sum + values[source * width + axis] * weights[k],
          0,
        ),
      );
    const shared: IAutoMovieHumanPersonBoundarySample | undefined =
      parameter === undefined ? undefined : canonical(parameter);
    output.positions.push(...(shared?.point ?? weighted(output.positions, 3)));
    if (output.normals !== null) {
      const normal: readonly number[] =
        shared?.normal ?? weighted(output.normals, 3);
      const length: number = Math.hypot(...normal);
      if (!(length > 0))
        throw new Error(
          "A person subdivision centroid needs a nonzero normal.",
        );
      output.normals.push(
        ...normal.map((value: number): number => value / length),
      );
    }
    if (output.uvs !== null) output.uvs.push(...weighted(output.uvs, 2));
    if (output.colors !== undefined)
      output.colors.push(...weighted(output.colors, 3));
    if (output.reliefWeights !== undefined)
      output.reliefWeights.push(...weighted(output.reliefWeights, 1));
    props.appendSourceScalar?.(vertex, vertices, weights);
    return vertex;
  };
  const edgePoints: (a: number, b: number) => number[] | undefined = (
    a: number,
    b: number,
  ): number[] | undefined => {
    const from: number = sources[a];
    const to: number = sources[b];
    const forward: boolean = edges.has(from + ":" + to);
    if (!forward && !edges.has(to + ":" + from)) return undefined;
    const start: number = parameterOf.get(from)!;
    const finish: number = parameterOf.get(to)!;
    const direction: number = (side === "face" ? 1 : -1) * (forward ? 1 : -1);
    const distance: number = (direction * (finish - start) + count) % count;
    const inside: { parameter: number; distance: number }[] = parameters
      .map((parameter: number): { parameter: number; distance: number } => ({
        parameter,
        distance: (direction * (parameter - start) + count) % count,
      }))
      .filter(
        (point: (typeof inside)[number]): boolean =>
          point.distance > 0 && point.distance < distance,
      )
      .sort(
        (a: (typeof inside)[number], b: (typeof inside)[number]): number =>
          a.distance - b.distance,
      );
    const added: number[] = inside.map(
      (point: (typeof inside)[number]): number =>
        append(
          [a, b],
          [1 - point.distance / distance, point.distance / distance],
          point.parameter,
        ),
    );
    return added;
  };
  const indices: number[] =
    mesh.indices ?? sources.map((_: number, vertex: number): number => vertex);
  for (let at: number = 0; at < indices.length; at += 3) {
    const triangle: number[] = indices.slice(at, at + 3);
    const perimeter: number[] = [];
    const splits: IAutoMovieHumanPersonEdgeSplit[] = [];
    let touched: boolean = false;
    for (let k: number = 0; k < 3; k++) {
      const a: number = triangle[k];
      const b: number = triangle[(k + 1) % 3];
      const added: number[] | undefined = edgePoints(a, b);
      touched ||= added !== undefined;
      if (added !== undefined) splits.push({ from: a, to: b, added });
      perimeter.push(a, ...(added ?? []));
    }
    if (!touched) output.indices!.push(...triangle);
    else {
      const repeated: boolean = triangle.some(
        (vertex: number, k: number): boolean =>
          [0, 1, 2].every(
            (axis: number): boolean =>
              output.positions[vertex * 3 + axis] ===
              output.positions[triangle[(k + 1) % 3] * 3 + axis],
          ),
      );
      if (repeated) continue;
      if (perimeter.length === 3) {
        output.indices!.push(...triangle);
        continue;
      }
      const before: ReturnType<typeof triangleAreaVector> = triangleAreaVector(
        output.positions,
        triangle,
        0,
      );
      if (side === "face") {
        const pieces: number[][] = [triangle];
        for (const split of splits) {
          let from: number = split.from;
          for (const vertex of split.added) {
            // Earlier splits leave every unprocessed boundary segment in
            // exactly one piece, with its original directed edge.
            const owner: number = pieces.findIndex((piece: number[]): boolean =>
              piece.some(
                (corner: number, k: number): boolean =>
                  corner === from && piece[(k + 1) % 3] === split.to,
              ),
            );
            const piece: number[] = pieces[owner];
            const third: number = piece[(piece.indexOf(from) + 2) % 3];
            pieces.splice(
              owner,
              1,
              [from, vertex, third],
              [vertex, split.to, third],
            );
            from = vertex;
          }
        }
        for (const corners of pieces) {
          assertHumanPersonSubdivision({
            stitch: props,
            emitted: output.positions,
            indices,
            before,
            original: triangle,
            corners,
            triangle: at / 3,
            perimeter,
          });
          output.indices!.push(...corners);
        }
        continue;
      }
      const centre: number = append(triangle, [1 / 3, 1 / 3, 1 / 3]);
      for (let k: number = 0; k < perimeter.length; k++) {
        const corners: number[] = [
          centre,
          perimeter[k],
          perimeter[(k + 1) % perimeter.length],
        ];
        assertHumanPersonSubdivision({
          stitch: props,
          emitted: output.positions,
          indices,
          before,
          original: triangle,
          corners,
          triangle: at / 3,
          perimeter,
        });
        output.indices!.push(...corners);
      }
    }
  }
  if (output.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
