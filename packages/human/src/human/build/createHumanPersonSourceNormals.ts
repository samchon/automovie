import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonPerformedSkin } from "../structures/IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourceNormalInput } from "../structures/IAutoMovieHumanPersonSourceNormalInput";
import type { IAutoMovieHumanPersonSourcePartitionsProps } from "../structures/IAutoMovieHumanPersonSourcePartitionsProps";
import { evaluateHumanPersonSourceCells } from "./evaluateHumanPersonSourceCells";
import { createHumanPersonNormalTransport } from "./createHumanPersonNormalTransport";
import { validateHumanPersonNormalTransport } from "./validateHumanPersonNormalTransport";
import { validateHumanPersonSourcePartitions } from "./validateHumanPersonSourcePartitions";

/**
 * Compile one performed normal field for two complementary source partitions.
 *
 * Each current cell contributes its oriented area vector to its original
 * parent. Complete parent vectors are accumulated at their three original
 * source vertex/domain stars, normalized only where consumed, and interpolated
 * through the frozen cut or two-coordinate refinement table. Each vertex
 * selects an actual incident parent's corner domains. Opposed contact aliases
 * retain distinct stars at the same geometric sample; unselected ambiguous
 * incidence refuses. Both smooth partitions read equivalent weighted stars.
 * Refining a parent's internal triangulation does not independently change the
 * shading field on opposite sides of a cut. This is area-weighted shading,
 * not anatomical tissue geometry or a contact solver.
 *
 * The partition validator owns chart admission. Evaluation checks current
 * coordinates, shared Float32 sample identity, nonzero Double cell areas,
 * nonzero emitted Float32 cells retaining the source direction, positive cell
 * agreement with the complete parent area, and nonzero used source normals.
 * A parent field cannot describe an opposing performed cell; that state refuses
 * instead of giving a folded surface the parent's smooth shading. Missing
 * performed cells or changed populations refuse rather than substituting
 * neutral normals. Posing stays the caller's
 * responsibility: normals are evaluated from those current cells, never baked
 * from the neutral or obtained by commuting skinning through a stencil.
 *
 * When both partitions carry normalTransport, its admitted fixed source-cell
 * incidence selects createHumanPersonNormalTransport instead. That path needs
 * actual final same-shape/pose mouthClose-zero reference geometry and its
 * captured generation. It transports the ancestral reference field through
 * the current differential; absence preserves the current-only behavior above.
 * The transport owner defines transverse extension and source-star density.
 *
 * Both absent records return undefined for the caller's legacy normal path.
 * The compiled plan and returned arrays are owned; caller arrays are read
 * only. Positions use the common metre/Y-up/Z-forward performed frame, area
 * vectors use square metres, and returned shading normals are unit vectors.
 * Unused surface vertices retain zero normals and never reach rendering.
 * Zero-coefficient star slots use finite placeholders in the shared affine
 * evaluator, whose inactive-coordinate branches never consume those fields.
 *
 * @evidence contracts/common.md#principled-implementation Summing a parent's cell cross products retains its oriented area vector; assigning that complete vector to the original vertex star and evaluating the shared affine cut table preserves one source shading field across complementary clipping.
 * @evidence contracts/common.md#clear-and-simple-design Static source admission, vertex normal incidence and weighted star bindings compile once; each call gathers current parent areas and scatters the selected source shading fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No neutral corrective, coordinate welding or generation label replaces the source chart or current geometry, and undefined used normals refuse.
 * @evidence contracts/common.md#meaningful-documentation Explains source versus shading geometry, performed ordering, current-coordinate admission, ownership, units and legacy behavior.
 * @evidence contracts/modeling.md#shared-boundaries One canonical sample normal is supplied to both source partitions, including the cut samples evaluated by the same ordered stencil.
 * @evidence contracts/modeling.md#spatial-conventions Current positions share metres/Y-up/Z-forward; cross products are area vectors and normalization yields dimensionless unit normals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Computes a field over supplied source cells and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits normal arrays for an existing population, without adding or removing a geometric primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person builder owns assembled observation; this transport does not display a part.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Area-weighted shading is not an anatomical quantity or a tissue model.
 * @evidenceExclude contracts/anatomy.md#permitted-range Coordinate admission establishes numerical representability, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes immutable compiler lineage and performed geometry, not personal shaping inputs.
 */
export function createHumanPersonSourceNormals(
  props: IAutoMovieHumanPersonSourcePartitionsProps,
): ((input: IAutoMovieHumanPersonSourceNormalInput) => number[]) | undefined {
  const plan = validateHumanPersonSourcePartitions(props);
  if (plan === undefined) return undefined;
  const faceIndices = [...props.face.indices];
  const bodyIndices = [...props.body.indices];
  const transport = validateHumanPersonNormalTransport({
    plan,
    face: { indices: faceIndices, transport: props.face.sourcePartition?.normalTransport },
    body: { indices: bodyIndices, transport: props.body.sourcePartition?.normalTransport },
  });
  const used = [faceIndices, bodyIndices].map((indices) => new Set(indices));
  const bindingAt = (sample: number, parent: number) => {
    const record = plan.face;
    const corners = record.parentTriangles.slice(parent * 3, parent * 3 + 3);
    const weights = plan.preimage(sample).map((point) => ({
      key: `${point.id}:${record.parentNormalDomains?.[parent * 3 + corners.indexOf(point.id)] ?? 0}`,
      weight: point.weight,
    })).sort((a, b) => a.key.localeCompare(b.key));
    const chart = plan.chart(sample);
    return {
      weights,
      identity: JSON.stringify(weights),
      coordinates: chart.coordinates,
      keys: chart.originals.map((id) => `${id}:${record.parentNormalDomains?.[parent * 3 + corners.indexOf(id)] ?? 0}`),
    };
  };
  const bindings = [props.face, props.body].map((surface, side) => {
    const record = side === 0 ? plan.face : plan.body;
    const incidence = Array.from(
      { length: record.samples.length },
      () => new Set<number>(),
    );
    surface.indices.forEach((vertex, at) =>
      incidence[vertex].add(record.parents[Math.floor(at / 3)]),
    );
    return record.samples.map((sample, vertex) => {
      if (!used[side].has(vertex)) return undefined;
      const parents = [...incidence[vertex]];
      const selected = record.normalParents?.[vertex] ?? transport?.bindings[side][vertex]?.parent;
      const result = bindingAt(sample, selected ?? parents[0]);
      if (
        selected === undefined &&
        parents.some(
          (parent) =>
            bindingAt(sample, parent).identity !== result.identity,
        )
      )
        throw new Error(
          "Person source normal incidence is ambiguous without a selected parent.",
        );
      return result;
    });
  });
  const unit = (vector: number[]): number[] => {
    const length = Math.hypot(...vector);
    if (!(length > 0))
      throw new Error("Person source shading needs a nonzero used normal.");
    return vector.map((value) => value / length);
  };
  const referenceField = (parentAreas: readonly number[]) => {
    const original = new Map<string, number[]>();
    for (let at = 0; at < plan.face.parentTriangles.length; at += 3)
      for (let k = 0; k < 3; k++) {
        const key = `${plan.face.parentTriangles[at + k]}:${plan.face.parentNormalDomains?.[at + k] ?? 0}`;
        const vector = original.get(key) ?? [0, 0, 0];
        for (let axis = 0; axis < 3; axis++)
          vector[axis] += parentAreas[at + axis];
        original.set(key, vector);
      }
    const normalized = new Map<string, number[]>();
    const star = (key: string): number[] => {
      let vector = normalized.get(key);
      if (vector === undefined) {
        vector = unit(original.get(key)!);
        normalized.set(key, vector);
      }
      return vector;
    };
    const normalAt = (binding: ReturnType<typeof bindingAt>): number[] => {
      const required = new Set(binding.weights.map((weight) => weight.key));
      return unit(
        [0, 1, 2].map((axis) =>
          interpolateHumanBasisSourceTriangle(
            binding.keys.map((key) =>
              required.has(key) ? star(key)[axis] : 0,
            ) as [number, number, number],
            binding.coordinates,
          ),
        ),
      );
    };
    const points = new Map<string, number[]>();
    return {
      normals: bindings.flatMap((side) => side.flatMap((binding) => binding === undefined ? [0, 0, 0] : normalAt(binding))),
      at: (sample: number, parent: number): number[] => {
        const binding = bindingAt(sample, parent);
        const key = `${sample}:${binding.identity}`;
        let normal = points.get(key);
        if (normal === undefined) {
          normal = normalAt(binding);
          points.set(key, normal);
        }
        return normal;
      },
    };
  };
  const legacy = (input: IAutoMovieHumanPersonPerformedSkin): number[] => {
    const { parentAreas } = evaluateHumanPersonSourceCells({ plan, faceIndices, bodyIndices, input });
    return referenceField(parentAreas).normals;
  };
  return transport === undefined ? legacy : createHumanPersonNormalTransport({
    evaluation: { plan, faceIndices, bodyIndices },
    transport,
    referenceField,
    identity: (sample, parent) => bindingAt(sample, parent).identity,
  });
}
