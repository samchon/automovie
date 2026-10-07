import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonNormalTransportPlan } from "../structures/IAutoMovieHumanPersonNormalTransportPlan";
import type { IAutoMovieHumanPersonNormalTransportValidationProps } from "../structures/IAutoMovieHumanPersonNormalTransportValidationProps";
import type { IAutoMovieHumanPersonSourceWeight } from "../structures/IAutoMovieHumanPersonSourceWeight";
import { validateHumanPersonSourceCoverage } from "./validateHumanPersonSourceCoverage";

/**
 * Admit fixed source normal cells independently of renderer tessellation.
 * Both complementary skins share the same parent-local subdivision tree.
 * Geometric and normal-cell partitions each retain complete positive chart
 * coverage. Dense vertex bindings select actual incident cells and reproduce
 * their canonical geometric preimages; raw bindings retain the existing
 * ordered source chart. Ancestral normal domains remain separate from these
 * deformation-side domains. Returned cells and binding charts are owned.
 * This establishes immutable lineage, not performed source validity or a
 * reference frame. The normal consumer admits those actual coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Admits both the complete source subdivision and its emitted-cell coverage through one shared chart-coverage owner before transporting a field.
 * @evidence contracts/common.md#clear-and-simple-design Parent-local declarations compile to one global fixed-cell table with side-local owned vertex bindings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects partial trees, unsupported incidence and mismatching geometric charts rather than inferring a neutral or opposite-edge binding.
 * @evidence contracts/common.md#meaningful-documentation Defines index namespaces, chart ownership and the distinct performed-coordinate responsibility.
 * @evidence contracts/modeling.md#shared-boundaries Raw bindings preserve the canonical ordered cut stencil; both halves compile equivalent source cells and normal incidence.
 * @evidence contracts/modeling.md#spatial-conventions Cell/sample/domain identifiers and affine charts are dimensionless; no physical coordinates are converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Compiles supplied incidence without defining a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Admits existing cells without emitting geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly consumer owns rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Incidence carries no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Index/chart domains are not physiological ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiler lineage is not a personal vertex editing input.
 */
export function validateHumanPersonNormalTransport(
  props: IAutoMovieHumanPersonNormalTransportValidationProps,
): IAutoMovieHumanPersonNormalTransportPlan | undefined {
  const { plan } = props;
  const left = props.face.transport;
  const right = props.body.transport;
  if (left === undefined && right === undefined) return undefined;
  if (left === undefined || right === undefined)
    throw new Error("Person normal transport needs both compiled halves.");
  const valid = (value: number, count: number): boolean =>
    Number.isSafeInteger(value) && value >= 0 && value < count;
  const parentCount = plan.face.parentTriangles.length / 3;
  const definitions = [left, right].map((transport) => {
    let prior = -1;
    return Array.from(transport.subdivisions, (one) => {
      if (
        one === undefined ||
        !valid(one.parent, parentCount) ||
        one.parent <= prior ||
        one.triangles.length === 0 ||
        one.triangles.length % 3 !== 0 ||
        one.domains.length !== one.triangles.length ||
        Array.from(one.triangles).some((id) => !valid(id, plan.sampleCount)) ||
        Array.from(one.domains).some(
          (id) => !Number.isSafeInteger(id) || id < 0,
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
    });
  });
  if (JSON.stringify(definitions[0]) !== JSON.stringify(definitions[1]))
    throw new Error("Person normal transport subdivisions disagree.");
  const listed = new Map(definitions[0].map((one) => [one.parent, one]));
  const offsets: number[] = [];
  const cells = Array.from({ length: parentCount }, (_, parent) => {
    offsets.push(0);
    const one = listed.get(parent);
    const triangles =
      one?.triangles ??
      plan.face.parentTriangles.slice(parent * 3, parent * 3 + 3);
    return Array.from({ length: triangles.length / 3 }, (_, cell) => ({
      parent,
      samples: triangles.slice(cell * 3, cell * 3 + 3) as [
        number,
        number,
        number,
      ],
      domains: (one?.domains.slice(cell * 3, cell * 3 + 3) ?? [0, 0, 0]) as [
        number,
        number,
        number,
      ],
    }));
  }).flat();
  let offset = 0;
  for (let parent = 0; parent < parentCount; parent++) {
    offsets[parent] = offset;
    offset += (listed.get(parent)?.triangles.length ?? 3) / 3;
  }
  validateHumanPersonSourceCoverage({
    parentTriangles: plan.face.parentTriangles,
    cells,
    preimage: (_, sample) => plan.preimage(sample),
  });
  const sides = [props.face, props.body];
  const records = [plan.face, plan.body];
  const transports = [left, right];
  const bindings = sides.map((side, which) => {
    const record = records[which];
    const transport = transports[which];
    if (
      transport.cells.length !== record.parents.length ||
      transport.bindings.length !== record.samples.length
    )
      throw new Error(
        "Person normal cell and binding populations must match the surface.",
      );
    const incidence = Array.from(
      { length: record.samples.length },
      () => new Set<number>(),
    );
    side.indices.forEach((vertex, at) => {
      const cell = Math.floor(at / 3);
      const parent = record.parents[cell];
      const local = transport.cells[cell];
      if (!valid(local, (listed.get(parent)?.triangles.length ?? 3) / 3))
        throw new Error(
          "Person normal emitted cell names an absent local source cell.",
        );
      incidence[vertex].add(offsets[parent] + local);
    });
    return Array.from(transport.bindings, (binding, vertex) => {
      if (binding === undefined)
        throw new Error("Person normal bindings must be dense.");
      if (incidence[vertex].size === 0) {
        if (binding !== null)
          throw new Error("An unused normal vertex must have a null binding.");
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
      const cell = cells[offsets[binding.parent] + binding.cell];
      const ids = new Set(
        cell.samples.flatMap((sample) =>
          plan.preimage(sample).map((point) => point.id),
        ),
      );
      const expected = plan.preimage(record.samples[vertex]);
      if (
        [...ids].some((id) => {
          const value = interpolateHumanBasisSourceTriangle(
            cell.samples.map(
              (sample) =>
                plan.preimage(sample).find((point) => point.id === id)
                  ?.weight ?? 0,
            ) as [number, number, number],
            binding.coordinates,
          );
          return (
            value !== (expected.find((point) => point.id === id)?.weight ?? 0)
          );
        }) ||
        expected.some((point) => !ids.has(point.id))
      )
        throw new Error(
          "Person normal chart disagrees with its canonical geometric sample.",
        );
      return {
        parent: binding.parent,
        cell: offsets[binding.parent] + binding.cell,
        coordinates: [...binding.coordinates] as [number, number],
      };
    });
  });
  const normalParents = cells.flatMap((cell) => cell.samples);
  const incidentCharts = new Map<string, IAutoMovieHumanPersonSourceWeight[]>();
  const emitted = sides.flatMap((side, which) =>
    records[which].parents.map((parent, cell) => {
      const normalParent = offsets[parent] + transports[which].cells[cell];
      const samples = side.indices
        .slice(cell * 3, cell * 3 + 3)
        .map((vertex) => {
          const sample = records[which].samples[vertex];
          const binding = bindings[which][vertex]!;
          const weights = cells[normalParent].samples.includes(sample)
            ? [{ id: sample, weight: 1 }]
            : binding.cell === undefined
              ? [...plan.preimage(sample)]
              : cells[binding.cell].samples.flatMap((id, corner) => {
                  const weight = interpolateHumanBasisSourceTriangle(
                    [
                      corner === 0 ? 1 : 0,
                      corner === 1 ? 1 : 0,
                      corner === 2 ? 1 : 0,
                    ],
                    binding.coordinates!,
                  );
                  return weight > 0 ? [{ id, weight }] : [];
                });
          weights.sort((a, b) => a.id - b.id);
          const key = `${normalParent}:${sample}`;
          const prior = incidentCharts.get(key);
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
    }),
  );
  validateHumanPersonSourceCoverage({
    parentTriangles: normalParents,
    cells: emitted,
    preimage: (parent, sample) => incidentCharts.get(`${parent}:${sample}`)!,
  });
  return { cells, bindings };
}
