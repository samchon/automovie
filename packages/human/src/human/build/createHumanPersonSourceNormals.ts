import type { IAutoMovieHumanPersonPerformedSkin } from "../structures/IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourceNormalInput } from "../structures/IAutoMovieHumanPersonSourceNormalInput";
import type { IAutoMovieHumanPersonSourcePartitionsProps } from "../structures/IAutoMovieHumanPersonSourcePartitionsProps";
import type { IAutoMovieHumanPersonSourceStarBinding } from "../structures/IAutoMovieHumanPersonSourceStarBinding";
import { createHumanPersonNormalTransport } from "./createHumanPersonNormalTransport";
import { createHumanPersonReferenceField } from "./createHumanPersonReferenceField";
import { evaluateHumanPersonSourceCells } from "./evaluateHumanPersonSourceCells";
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
    face: {
      indices: faceIndices,
      transport: props.face.sourcePartition?.normalTransport,
    },
    body: {
      indices: bodyIndices,
      transport: props.body.sourcePartition?.normalTransport,
    },
  });
  const used = [faceIndices, bodyIndices].map((indices) => new Set(indices));
  const bindingAt = (
    sample: number,
    parent: number,
  ): IAutoMovieHumanPersonSourceStarBinding => {
    const record = plan.face;
    const corners = record.parentTriangles.slice(parent * 3, parent * 3 + 3);
    const weights = plan
      .preimage(sample)
      .map((point) => ({
        key: `${point.id}:${record.parentNormalDomains?.[parent * 3 + corners.indexOf(point.id)] ?? 0}`,
        weight: point.weight,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
    const chart = plan.chart(sample);
    return {
      weights,
      identity: JSON.stringify(weights),
      coordinates: chart.coordinates,
      keys: chart.originals.map(
        (id) =>
          `${id}:${record.parentNormalDomains?.[parent * 3 + corners.indexOf(id)] ?? 0}`,
      ),
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
      const selected =
        record.normalParents?.[vertex] ??
        transport?.bindings[side][vertex]?.parent;
      const result = bindingAt(sample, selected ?? parents[0]);
      if (
        selected === undefined &&
        parents.some(
          (parent) => bindingAt(sample, parent).identity !== result.identity,
        )
      )
        throw new Error(
          "Person source normal incidence is ambiguous without a selected parent.",
        );
      return result;
    });
  });
  const referenceField = (parentAreas: readonly number[]) =>
    createHumanPersonReferenceField({ plan, bindings, bindingAt, parentAreas });
  const legacy = (input: IAutoMovieHumanPersonPerformedSkin): number[] => {
    const { parentAreas } = evaluateHumanPersonSourceCells({
      plan,
      faceIndices,
      bodyIndices,
      input,
    });
    return referenceField(parentAreas).normals;
  };
  return transport === undefined
    ? legacy
    : createHumanPersonNormalTransport({
        evaluation: { plan, faceIndices, bodyIndices },
        transport,
        referenceField,
        identity: (sample, parent) => bindingAt(sample, parent).identity,
      });
}
