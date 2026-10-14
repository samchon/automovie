import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonNormalTransportPlan } from "../structures/IAutoMovieHumanPersonNormalTransportPlan";
import type { IAutoMovieHumanPersonNormalTransportValidationProps } from "../structures/IAutoMovieHumanPersonNormalTransportValidationProps";
import type { IAutoMovieHumanPersonSourceWeight } from "../structures/IAutoMovieHumanPersonSourceWeight";
import { validateHumanPersonSourceCoverage } from "./validateHumanPersonSourceCoverage";

/**
 * Admit fixed normal-cell lineage independently of renderer tessellation. Paired halves share identical ordered parent subdivisions; unlisted parents use one implicit raw cell. Fixed cells and emitted cells each pass positive complete source-chart coverage. Dense bindings select actual incident cells and reproduce canonical preimages through exact ordered two-coordinate arithmetic, retaining ancestral normal selectors separately from deformation domains.
 *
 * Both omitted transport records return undefined; partial metadata refuses. IDs/domains/coordinates are dimensionless, and admitted geometric plans/topology are caller premises. Returned cells, dense bindings and coordinate arrays are owned but remain mutable runtime values that consumers must leave unchanged. Actual reference/current finite geometry, differential rank and shading admission belong downstream; metadata proves neither physical embeddedness nor clinical tissue mechanics.
 *
 * @evidence contracts/common.md#principled-implementation Compatible fixed subdivisions and dense incident bindings reproduce canonical preimages, with complete chart coverage admitted first for fixed cells and again for emitted normal-cell partitions.
 * @evidence contracts/common.md#clear-and-simple-design One paired metadata compiler preserves raw-versus-feature cell rules and delegates affine arithmetic/coverage; performed transport owns geometry and reference frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing halves, sparse bindings, nonincident selectors and unequal exact charts refuse; mutable copied lineage is not claimed frozen or physically/clinically validated.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies dimensionless namespaces, implicit raw cells, dense unused slots, owned mutable arrays and downstream actual-geometry limits.
 * @evidence contracts/performance.md#efficient-algorithms Definition/cell/incidence passes scale with stored source/emitted populations; binding checks pay actual preimage/ID-set searches and exact serialization, while both coverage admissions include their edge/interval sorts.
 * @evidence contracts/performance.md#reuse-equivalent-work Parent offsets/listed subdivisions and admitted preimage readers serve all emitted bindings; one shared coverage owner checks both source cell trees without independent fitting equations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary definitions/incidence/incident-chart maps expire after admission; only owned fixed cells and binding charts escape, without source handles, asynchronous tasks or a persistent validator cache.
 */
export function validateHumanPersonNormalTransport(
  props: IAutoMovieHumanPersonNormalTransportValidationProps,
): IAutoMovieHumanPersonNormalTransportPlan | undefined {
  const { plan }: IAutoMovieHumanPersonNormalTransportValidationProps = props;
  const left: IAutoMovieHumanPersonNormalTransportValidationProps["face"]["transport"] =
    props.face.transport;
  const right: IAutoMovieHumanPersonNormalTransportValidationProps["body"]["transport"] =
    props.body.transport;
  if (left === undefined && right === undefined) return undefined;
  if (left === undefined || right === undefined)
    throw new Error("Person normal transport needs both compiled halves.");
  const valid: (value: number, count: number) => boolean = (
    value: number,
    count: number,
  ): boolean => Number.isSafeInteger(value) && value >= 0 && value < count;
  const parentCount: number = plan.face.parentTriangles.length / 3;
  const definitions: {
    parent: number;
    triangles: number[];
    domains: number[];
  }[][] = [left, right].map(
    (transport: NonNullable<typeof left>): (typeof definitions)[number] => {
      let prior: number = -1;
      return Array.from(
        transport.subdivisions,
        (
          one: (typeof transport.subdivisions)[number],
        ): (typeof definitions)[number][number] => {
          if (
            one === undefined ||
            !valid(one.parent, parentCount) ||
            one.parent <= prior ||
            one.triangles.length === 0 ||
            one.triangles.length % 3 !== 0 ||
            one.domains.length !== one.triangles.length ||
            Array.from(one.triangles).some(
              (id: number): boolean => !valid(id, plan.sampleCount),
            ) ||
            Array.from(one.domains).some(
              (id: number): boolean => !Number.isSafeInteger(id) || id < 0,
            )
          )
            throw new Error(
              "Person normal subdivisions need dense ordered source domains.",
            );
          prior = one.parent;
          return {
            parent: one.parent,
            triangles: [...one.triangles],
            domains: [...one.domains],
          };
        },
      );
    },
  );
  if (JSON.stringify(definitions[0]) !== JSON.stringify(definitions[1]))
    throw new Error("Person normal transport subdivisions disagree.");
  const listed: Map<number, (typeof definitions)[number][number]> = new Map(
    definitions[0].map(
      (one: (typeof definitions)[number][number]): [number, typeof one] => [
        one.parent,
        one,
      ],
    ),
  );
  const offsets: number[] = [];
  const cells: IAutoMovieHumanPersonNormalTransportPlan["cells"] = Array.from(
    { length: parentCount },
    (
      _: unknown,
      parent: number,
    ): IAutoMovieHumanPersonNormalTransportPlan["cells"] => {
      offsets.push(0);
      const one: (typeof definitions)[number][number] | undefined =
        listed.get(parent);
      const triangles: readonly number[] =
        one?.triangles ??
        plan.face.parentTriangles.slice(parent * 3, parent * 3 + 3);
      return Array.from(
        { length: triangles.length / 3 },
        (
          _: unknown,
          cell: number,
        ): IAutoMovieHumanPersonNormalTransportPlan["cells"][number] => ({
          parent,
          samples: triangles.slice(cell * 3, cell * 3 + 3) as [
            number,
            number,
            number,
          ],
          domains: (one?.domains.slice(cell * 3, cell * 3 + 3) ?? [
            0, 0, 0,
          ]) as [number, number, number],
        }),
      );
    },
  ).flat();
  let offset: number = 0;
  for (let parent: number = 0; parent < parentCount; parent++) {
    offsets[parent] = offset;
    offset += (listed.get(parent)?.triangles.length ?? 3) / 3;
  }
  validateHumanPersonSourceCoverage({
    parentTriangles: plan.face.parentTriangles,
    cells,
    preimage: (_: number, sample: number): ReturnType<typeof plan.preimage> =>
      plan.preimage(sample),
  });
  const sides: IAutoMovieHumanPersonNormalTransportValidationProps["face"][] = [
    props.face,
    props.body,
  ];
  const records: (typeof plan.face)[] = [plan.face, plan.body];
  const transports: NonNullable<typeof left>[] = [left, right];
  const bindings: IAutoMovieHumanPersonNormalTransportPlan["bindings"] =
    sides.map(
      (
        side: (typeof sides)[number],
        which: number,
      ): IAutoMovieHumanPersonNormalTransportPlan["bindings"][number] => {
        const record: typeof plan.face = records[which];
        const transport: NonNullable<typeof left> = transports[which];
        if (
          transport.cells.length !== record.parents.length ||
          transport.bindings.length !== record.samples.length
        )
          throw new Error(
            "Person normal cell and binding populations must match the surface.",
          );
        const incidence: Set<number>[] = Array.from(
          { length: record.samples.length },
          (): Set<number> => new Set<number>(),
        );
        side.indices.forEach((vertex: number, at: number): void => {
          const cell: number = Math.floor(at / 3);
          const parent: number = record.parents[cell];
          const local: number = transport.cells[cell];
          if (!valid(local, (listed.get(parent)?.triangles.length ?? 3) / 3))
            throw new Error(
              "Person normal emitted cell names an absent local source cell.",
            );
          incidence[vertex].add(offsets[parent] + local);
        });
        return Array.from(
          transport.bindings,
          (
            binding: (typeof transport.bindings)[number],
            vertex: number,
          ): IAutoMovieHumanPersonNormalTransportPlan["bindings"][number][number] => {
            if (binding === undefined)
              throw new Error("Person normal bindings must be dense.");
            if (incidence[vertex].size === 0) {
              if (binding !== null)
                throw new Error(
                  "An unused normal vertex must have a null binding.",
                );
              return undefined;
            }
            if (binding === null || !valid(binding.parent, parentCount))
              throw new Error(
                "Person normal used vertex needs a source parent binding.",
              );
            if (
              record.normalParents !== undefined &&
              record.normalParents[vertex] !== binding.parent
            )
              throw new Error(
                "Person normal binding changes its ancestral parent selector.",
              );
            if (!listed.has(binding.parent)) {
              if (
                "cell" in binding ||
                "coordinates" in binding ||
                !incidence[vertex].has(offsets[binding.parent])
              )
                throw new Error(
                  "Person raw normal binding must name an incident implicit cell.",
                );
              return { parent: binding.parent };
            }
            if (
              !("cell" in binding) ||
              !valid(
                binding.cell,
                listed.get(binding.parent)!.triangles.length / 3,
              ) ||
              !incidence[vertex].has(offsets[binding.parent] + binding.cell)
            )
              throw new Error(
                "Person feature normal binding must name an incident source cell.",
              );
            if (
              !Array.isArray(binding.coordinates) ||
              binding.coordinates.length !== 2
            )
              throw new Error(
                "Person feature normal binding needs its ordered two-coordinate chart.",
              );
            interpolateHumanBasisSourceTriangle([0, 1, 0], binding.coordinates);
            const cell: (typeof cells)[number] =
              cells[offsets[binding.parent] + binding.cell];
            const ids: Set<number> = new Set(
              cell.samples.flatMap((sample: number): number[] =>
                plan
                  .preimage(sample)
                  .map(
                    (point: IAutoMovieHumanPersonSourceWeight): number =>
                      point.id,
                  ),
              ),
            );
            const expected: ReturnType<typeof plan.preimage> = plan.preimage(
              record.samples[vertex],
            );
            if (
              [...ids].some((id: number): boolean => {
                const value: number = interpolateHumanBasisSourceTriangle(
                  cell.samples.map(
                    (sample: number): number =>
                      plan
                        .preimage(sample)
                        .find(
                          (point: IAutoMovieHumanPersonSourceWeight): boolean =>
                            point.id === id,
                        )?.weight ?? 0,
                  ) as [number, number, number],
                  binding.coordinates,
                );
                return (
                  value !==
                  (expected.find(
                    (point: IAutoMovieHumanPersonSourceWeight): boolean =>
                      point.id === id,
                  )?.weight ?? 0)
                );
              }) ||
              expected.some(
                (point: IAutoMovieHumanPersonSourceWeight): boolean =>
                  !ids.has(point.id),
              )
            )
              throw new Error(
                "Person normal chart disagrees with its canonical geometric sample.",
              );
            return {
              parent: binding.parent,
              cell: offsets[binding.parent] + binding.cell,
              coordinates: [...binding.coordinates] as [number, number],
            };
          },
        );
      },
    );
  const normalParents: number[] = cells.flatMap(
    (cell: (typeof cells)[number]): number[] => cell.samples,
  );
  const incidentCharts: Map<string, IAutoMovieHumanPersonSourceWeight[]> =
    new Map<string, IAutoMovieHumanPersonSourceWeight[]>();
  const emitted: Parameters<
    typeof validateHumanPersonSourceCoverage
  >[0]["cells"][number][] = sides.flatMap(
    (
      side: (typeof sides)[number],
      which: number,
    ): Parameters<
      typeof validateHumanPersonSourceCoverage
    >[0]["cells"][number][] =>
      records[which].parents.map(
        (
          parent: number,
          cell: number,
        ): Parameters<
          typeof validateHumanPersonSourceCoverage
        >[0]["cells"][number] => {
          const normalParent: number =
            offsets[parent] + transports[which].cells[cell];
          const samples: number[] = side.indices
            .slice(cell * 3, cell * 3 + 3)
            .map((vertex: number): number => {
              const sample: number = records[which].samples[vertex];
              const binding: NonNullable<(typeof bindings)[number][number]> =
                bindings[which][vertex]!;
              const weights: IAutoMovieHumanPersonSourceWeight[] = cells[
                normalParent
              ].samples.includes(sample)
                ? [{ id: sample, weight: 1 }]
                : binding.cell === undefined
                  ? [...plan.preimage(sample)]
                  : cells[binding.cell].samples.flatMap(
                      (
                        id: number,
                        corner: number,
                      ): IAutoMovieHumanPersonSourceWeight[] => {
                        const weight: number =
                          interpolateHumanBasisSourceTriangle(
                            [
                              corner === 0 ? 1 : 0,
                              corner === 1 ? 1 : 0,
                              corner === 2 ? 1 : 0,
                            ],
                            binding.coordinates!,
                          );
                        return weight > 0 ? [{ id, weight }] : [];
                      },
                    );
              weights.sort(
                (
                  a: IAutoMovieHumanPersonSourceWeight,
                  b: IAutoMovieHumanPersonSourceWeight,
                ): number => a.id - b.id,
              );
              const key: string = `${normalParent}:${sample}`;
              const prior: IAutoMovieHumanPersonSourceWeight[] | undefined =
                incidentCharts.get(key);
              if (
                prior !== undefined &&
                JSON.stringify(prior) !== JSON.stringify(weights)
              )
                throw new Error(
                  "Person normal coverage has ambiguous incident source charts.",
                );
              incidentCharts.set(key, weights);
              return sample;
            });
          return { parent: normalParent, samples };
        },
      ),
  );
  validateHumanPersonSourceCoverage({
    parentTriangles: normalParents,
    cells: emitted,
    preimage: (
      parent: number,
      sample: number,
    ): IAutoMovieHumanPersonSourceWeight[] =>
      incidentCharts.get(`${parent}:${sample}`)!,
  });
  return { cells, bindings };
}
