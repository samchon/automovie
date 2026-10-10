import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "../structures/IAutoMovieHumanPersonSourcePartitionPlan";
import type { IAutoMovieHumanPersonSourcePartitionsProps } from "../structures/IAutoMovieHumanPersonSourcePartitionsProps";
import { createHumanPersonSourceChart } from "./createHumanPersonSourceChart";
import { createHumanPersonSourcePreimage } from "./createHumanPersonSourcePreimage";
import { validateHumanPersonSourceCoverage } from "./validateHumanPersonSourceCoverage";
import { validateHumanPersonSourceDomain } from "./validateHumanPersonSourceDomain";

/**
 * Admit the two complementary cell charts of a compiled shared skin source.
 *
 * A generation label is checked together with the complete oriented parent
 * tree, ordered cut table, vertex domains and positive source-cell charts.
 * Per-parent directed-edge cancellation leaves only that parent's three
 * original edges. Their sorted affine intervals must cover [0, 1] exactly;
 * common sample identities make interval endpoints identical without an area
 * tolerance. This proves chart coverage, not physical geometry or physiology.
 * The normal evaluator separately reads the current performed coordinates.
 *
 * Both missing records select the legacy path. A partial or incompatible pair
 * refuses. Successful records are copied so later caller mutations cannot
 * change a compiled normal plan. Two-coordinate refinements use the shared
 * scalar affine owner for both geometry preimages and shading. Sparse original
 * namespaces retain safe integer IDs without allocating their extent. Chart
 * and preimage lookups memoize only requested IDs from the captured owned
 * metadata; their returned buffers are borrowed read-only from that plan.
 * No later lookup reads caller arrays. Corner domains and
 * selected normal parents preserve shading incidence separately from geometric
 * coverage; each selected parent must occur in the vertex's actual cells, whose
 * support has already been admitted. Counts, IDs and affine fractions are
 * dimensionless; this operation converts no positions or frames.
 */
export function validateHumanPersonSourcePartitions(
  props: IAutoMovieHumanPersonSourcePartitionsProps,
): IAutoMovieHumanPersonSourcePartitionPlan | undefined {
  const face = props.face.sourcePartition;
  const body = props.body.sourcePartition;
  if (face === undefined && body === undefined) return undefined;
  if (face === undefined || body === undefined)
    throw new Error("Person source partitions need both compiled halves.");
  validateHumanPersonSourceDomain(face, props.face);
  validateHumanPersonSourceDomain(body, props.body);
  if (
    face.generation !== body.generation ||
    face.originalVertices !== body.originalVertices ||
    face.parentTriangles.length !== body.parentTriangles.length ||
    face.parentTriangles.some((id, at) => id !== body.parentTriangles[at]) ||
    (face.refinements?.length ?? 0) !== (body.refinements?.length ?? 0) ||
    (face.refinements ?? []).some(
      (point, at) =>
        point.parent !== body.refinements![at].parent ||
        point.coordinates.some(
          (coordinate, k) =>
            coordinate !== body.refinements![at].coordinates[k],
        ),
    ) ||
    face.parentTriangles.some(
      (_, at) =>
        (face.parentNormalDomains?.[at] ?? 0) !==
        (body.parentNormalDomains?.[at] ?? 0),
    ) ||
    face.intersections.length !== body.intersections.length ||
    face.intersections.some(
      (point, at) =>
        point.a !== body.intersections[at].a ||
        point.b !== body.intersections[at].b ||
        point.t !== body.intersections[at].t,
    )
  )
    throw new Error(
      "Person source partitions name incompatible parent trees or ordered cut tables.",
    );
  const copy = (
    record: IAutoMovieHumanBasisSourcePartition,
  ): IAutoMovieHumanBasisSourcePartition => ({
    generation: record.generation,
    originalVertices: record.originalVertices,
    parentTriangles: [...record.parentTriangles],
    intersections: record.intersections.map((point) => ({ ...point })),
    refinements: record.refinements?.map((point) => ({
      parent: point.parent,
      coordinates: [...point.coordinates] as [number, number],
    })),
    parentNormalDomains:
      record.parentNormalDomains === undefined
        ? undefined
        : [...record.parentNormalDomains],
    normalParents:
      record.normalParents === undefined
        ? undefined
        : [...record.normalParents],
    samples: [...record.samples],
    parents: [...record.parents],
  });
  const captured = [copy(face), copy(body)];
  const source = captured[0];
  const sampleCount =
    source.originalVertices +
    source.intersections.length +
    (source.refinements?.length ?? 0);
  const chart = createHumanPersonSourceChart(source);
  const preimage = createHumanPersonSourcePreimage(chart);
  validateHumanPersonSourceCoverage({
    parentTriangles: face.parentTriangles,
    cells: (
      [
        [props.face, face],
        [props.body, body],
      ] as const
    ).flatMap(([surface, record]) =>
      record.parents.map((parent, cell) => ({
        parent,
        samples: surface.indices
          .slice(cell * 3, cell * 3 + 3)
          .map((vertex) => record.samples[vertex]),
      })),
    ),
    preimage: (_, sample) => preimage(sample),
  });
  for (const [surface, record] of [
    [props.face, face],
    [props.body, body],
  ] as const) {
    if (record.normalParents === undefined) continue;
    const incidence = Array.from(
      { length: record.samples.length },
      () => new Set<number>(),
    );
    surface.indices.forEach((vertex, at) =>
      incidence[vertex].add(record.parents[Math.floor(at / 3)]),
    );
    record.normalParents.forEach((parent, vertex) => {
      if (incidence[vertex].size !== 0 && !incidence[vertex].has(parent))
        throw new Error(
          "Person source normal parent must contain an actual incident source preimage.",
        );
    });
  }
  return {
    face: captured[0],
    body: captured[1],
    sampleCount,
    preimage,
    chart,
  };
}
