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
 * Both source halves must agree on generation, original count, ordered parent triangles/cuts/refinements and ancestral corner normal domains. Shared coverage admission checks positive source charts, directed cancellation and exact [0,1] boundary intervals across their combined cells. Explicit normal-parent selectors must occur in used vertices' actual incident parents. This admits dimensionless correspondence, not physical coordinates or physiology.
 *
 * Both absent records return undefined for the supported legacy path; a partial or incompatible pair refuses. Successful metadata is copied, including nested refinement coordinates. Later lookups read these owned copies and memoize only queried IDs without allocating sparse original namespace extent. Returned record/cache arrays have mutable runtime representations and must remain unchanged; copying isolates caller originals but does not freeze the plan. Performed geometry admission remains downstream.
 *
 * @evidence contracts/common.md#principled-implementation Compatible ordered canonical trees and complete positive combined chart coverage produce one owned plan; actual incidence admits selected normal parents separately from geometric IDs.
 * @evidence contracts/common.md#clear-and-simple-design Domain/coverage/chart/preimage owners share exact source rules while this paired validator owns compatibility, copied capture and selector incidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial registrations, incompatible trees and nonincident selectors refuse without spatial fitting; owned copied metadata is not claimed frozen or a clinical/embeddedness proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states dimensionless ordering, legacy omission, caller-copy isolation, mutable-plan purity and downstream geometry ownership.
 * @evidence contracts/performance.md#efficient-algorithms Domain/compatibility/copy passes follow source arrays; combined coverage pays actual chart/edge/interval sorting, and explicit selector incidence adds O(V+T) storage/work. Sparse lookup maps allocate only queried IDs.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured chart/preimage pair serves both halves and all later source-normal evaluations; normal selectors read existing emitted-parent incidence rather than rebuilding spatial correspondence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned copies/readers and their distinct-query maps follow plan lifetime; temporary coverage/incidence buffers expire, with no original caller arrays captured by lookup closures or active task.
 */
export function validateHumanPersonSourcePartitions(
  props: IAutoMovieHumanPersonSourcePartitionsProps,
): IAutoMovieHumanPersonSourcePartitionPlan | undefined {
  const face: IAutoMovieHumanBasisSourcePartition | undefined =
    props.face.sourcePartition;
  const body: IAutoMovieHumanBasisSourcePartition | undefined =
    props.body.sourcePartition;
  if (face === undefined && body === undefined) return undefined;
  if (face === undefined || body === undefined)
    throw new Error("Person source partitions need both compiled halves.");
  validateHumanPersonSourceDomain(face, props.face);
  validateHumanPersonSourceDomain(body, props.body);
  if (
    face.generation !== body.generation ||
    face.originalVertices !== body.originalVertices ||
    face.parentTriangles.length !== body.parentTriangles.length ||
    face.parentTriangles.some(
      (id: number, at: number): boolean => id !== body.parentTriangles[at],
    ) ||
    (face.refinements?.length ?? 0) !== (body.refinements?.length ?? 0) ||
    (face.refinements ?? []).some(
      (
        point: NonNullable<
          IAutoMovieHumanBasisSourcePartition["refinements"]
        >[number],
        at: number,
      ): boolean =>
        point.parent !== body.refinements![at].parent ||
        point.coordinates.some(
          (coordinate: number, k: number): boolean =>
            coordinate !== body.refinements![at].coordinates[k],
        ),
    ) ||
    face.parentTriangles.some(
      (_: number, at: number): boolean =>
        (face.parentNormalDomains?.[at] ?? 0) !==
        (body.parentNormalDomains?.[at] ?? 0),
    ) ||
    face.intersections.length !== body.intersections.length ||
    face.intersections.some(
      (
        point: IAutoMovieHumanBasisSourcePartition["intersections"][number],
        at: number,
      ): boolean =>
        point.a !== body.intersections[at].a ||
        point.b !== body.intersections[at].b ||
        point.t !== body.intersections[at].t,
    )
  )
    throw new Error(
      "Person source partitions name incompatible parent trees or ordered cut tables.",
    );
  const copy: (
    record: IAutoMovieHumanBasisSourcePartition,
  ) => IAutoMovieHumanBasisSourcePartition = (
    record: IAutoMovieHumanBasisSourcePartition,
  ): IAutoMovieHumanBasisSourcePartition => ({
    generation: record.generation,
    originalVertices: record.originalVertices,
    parentTriangles: [...record.parentTriangles],
    intersections: record.intersections.map(
      (
        point: IAutoMovieHumanBasisSourcePartition["intersections"][number],
      ): IAutoMovieHumanBasisSourcePartition["intersections"][number] => ({
        ...point,
      }),
    ),
    refinements: record.refinements?.map(
      (
        point: NonNullable<
          IAutoMovieHumanBasisSourcePartition["refinements"]
        >[number],
      ): NonNullable<
        IAutoMovieHumanBasisSourcePartition["refinements"]
      >[number] => ({
        parent: point.parent,
        coordinates: [...point.coordinates] as [number, number],
      }),
    ),
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
  const captured: IAutoMovieHumanBasisSourcePartition[] = [
    copy(face),
    copy(body),
  ];
  const source: IAutoMovieHumanBasisSourcePartition = captured[0];
  const sampleCount: number =
    source.originalVertices +
    source.intersections.length +
    (source.refinements?.length ?? 0);
  const chart: ReturnType<typeof createHumanPersonSourceChart> =
    createHumanPersonSourceChart(source);
  const preimage: ReturnType<typeof createHumanPersonSourcePreimage> =
    createHumanPersonSourcePreimage(chart);
  validateHumanPersonSourceCoverage({
    parentTriangles: face.parentTriangles,
    cells: (
      [
        [props.face, face],
        [props.body, body],
      ] as const
    ).flatMap(
      ([surface, record]: readonly [
        IAutoMovieHumanPersonSourcePartitionsProps["face"],
        IAutoMovieHumanBasisSourcePartition,
      ]): Parameters<
        typeof validateHumanPersonSourceCoverage
      >[0]["cells"][number][] =>
        record.parents.map(
          (
            parent: number,
            cell: number,
          ): Parameters<
            typeof validateHumanPersonSourceCoverage
          >[0]["cells"][number] => ({
            parent,
            samples: surface.indices
              .slice(cell * 3, cell * 3 + 3)
              .map((vertex: number): number => record.samples[vertex]),
          }),
        ),
    ),
    preimage: (_: number, sample: number): ReturnType<typeof preimage> =>
      preimage(sample),
  });
  for (const [surface, record] of [
    [props.face, face],
    [props.body, body],
  ] as const) {
    if (record.normalParents === undefined) continue;
    const incidence: Set<number>[] = Array.from(
      { length: record.samples.length },
      (): Set<number> => new Set<number>(),
    );
    surface.indices.forEach(
      (vertex: number, at: number): Set<number> =>
        incidence[vertex].add(record.parents[Math.floor(at / 3)]),
    );
    record.normalParents.forEach((parent: number, vertex: number): void => {
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
