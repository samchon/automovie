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
 * Current cells contribute oriented parent-area vectors, accumulated at original vertex/domain stars and normalized only where consumed. Ordered source charts interpolate those stars. Each used vertex selects its incident normal parent; opposed aliases retain distinct stars, and unselected unequal weighted identities refuse. This field is area-weighted shading, not tissue geometry or contact.
 *
 * Partition admission owns complete source chart coverage. Current evaluation owns finite coordinates, shared Float32 identity, nonzero Double cells, positive emitted direction and agreement with the complete parent area. Required zero/nonfinite source normals refuse downstream. Changed populations or opposed cells do not receive neutral normals. Caller-owned posing precedes this evaluation.
 *
 * Paired normalTransport records select fixed-cell differential transport instead of current-only shading. Its caller must supply actual final same-shape/pose mouthClose-zero reference geometry and matching generation; the transport owner defines transverse extension and source-star density. Both absent source partitions return undefined for the legacy path; a partial pair refuses.
 *
 * The compiler owns admitted copied source metadata and topology. Caller coordinates remain unchanged in common metre/Y-up/Z-forward frame; areas use square metres and returned normal vectors are dimensionless. Unused slots stay zero. Inactive chart coefficients use finite placeholders without consuming their absent stars. Compiled plans must remain unchanged and no current GPU/clinical acceptance follows from shading admission.
 *
 * @evidence contracts/common.md#principled-implementation Admitted complementary charts produce incident weighted vertex/domain-star identity and one reference-field owner; paired fixed-cell registration selects the actual differential transport path.
 * @evidence contracts/common.md#clear-and-simple-design Partition, cell geometry, reference shading and differential transport keep separate owners; this compiler supplies their common incidence and dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial registration and ambiguous unselected stars refuse; current coordinates remain authoritative and no neutral geometry hides a performed fold.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes current-only versus actual-reference transport, metre/area/normal units, unused slots and source ownership.
 * @evidence contracts/performance.md#efficient-algorithms Compilation pays both complete chart/transport admissions, index copies, vertex incidence and actual preimage/weighted-key sorting; ambiguous-parent checks cost their incident degree. Each call pays full geometry plus its selected shading/transport owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Copied source plans, dense bindings and used topology compile once; one reference-field factory serves current-only and transported shading without duplicating source identity rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains copied plans/topology/bindings and queried chart caches until dropped; per-call area/normal buffers escape only through owned results, with no external task.
 */
export function createHumanPersonSourceNormals(
  props: IAutoMovieHumanPersonSourcePartitionsProps,
): ((input: IAutoMovieHumanPersonSourceNormalInput) => number[]) | undefined {
  const plan: ReturnType<typeof validateHumanPersonSourcePartitions> =
    validateHumanPersonSourcePartitions(props);
  if (plan === undefined) return undefined;
  const faceIndices: number[] = [...props.face.indices];
  const bodyIndices: number[] = [...props.body.indices];
  const transport: ReturnType<typeof validateHumanPersonNormalTransport> =
    validateHumanPersonNormalTransport({
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
  const used: Set<number>[] = [faceIndices, bodyIndices].map(
    (indices: number[]): Set<number> => new Set(indices),
  );
  const bindingAt: (
    sample: number,
    parent: number,
  ) => IAutoMovieHumanPersonSourceStarBinding = (
    sample: number,
    parent: number,
  ): IAutoMovieHumanPersonSourceStarBinding => {
    const record: typeof plan.face = plan.face;
    const corners: number[] = record.parentTriangles.slice(
      parent * 3,
      parent * 3 + 3,
    );
    const weights: IAutoMovieHumanPersonSourceStarBinding["weights"] = plan
      .preimage(sample)
      .map(
        (
          point: ReturnType<typeof plan.preimage>[number],
        ): IAutoMovieHumanPersonSourceStarBinding["weights"][number] => ({
          key: `${point.id}:${record.parentNormalDomains?.[parent * 3 + corners.indexOf(point.id)] ?? 0}`,
          weight: point.weight,
        }),
      )
      .sort(
        (
          a: IAutoMovieHumanPersonSourceStarBinding["weights"][number],
          b: IAutoMovieHumanPersonSourceStarBinding["weights"][number],
        ): number => a.key.localeCompare(b.key),
      );
    const chart: ReturnType<typeof plan.chart> = plan.chart(sample);
    return {
      weights,
      identity: JSON.stringify(weights),
      coordinates: chart.coordinates,
      keys: chart.originals.map(
        (id: number): string =>
          `${id}:${record.parentNormalDomains?.[parent * 3 + corners.indexOf(id)] ?? 0}`,
      ),
    };
  };
  const bindings: (IAutoMovieHumanPersonSourceStarBinding | undefined)[][] = [
    props.face,
    props.body,
  ].map(
    (
      surface: IAutoMovieHumanPersonSourcePartitionsProps["face"],
      side: number,
    ): (IAutoMovieHumanPersonSourceStarBinding | undefined)[] => {
      const record: typeof plan.face = side === 0 ? plan.face : plan.body;
      const incidence: Set<number>[] = Array.from(
        { length: record.samples.length },
        (): Set<number> => new Set<number>(),
      );
      surface.indices.forEach(
        (vertex: number, at: number): Set<number> =>
          incidence[vertex].add(record.parents[Math.floor(at / 3)]),
      );
      return record.samples.map(
        (
          sample: number,
          vertex: number,
        ): IAutoMovieHumanPersonSourceStarBinding | undefined => {
          if (!used[side].has(vertex)) return undefined;
          const parents: number[] = [...incidence[vertex]];
          const selected: number | undefined =
            record.normalParents?.[vertex] ??
            transport?.bindings[side][vertex]?.parent;
          const result: IAutoMovieHumanPersonSourceStarBinding = bindingAt(
            sample,
            selected ?? parents[0],
          );
          if (
            selected === undefined &&
            parents.some(
              (parent: number): boolean =>
                bindingAt(sample, parent).identity !== result.identity,
            )
          )
            throw new Error(
              "Person source normal incidence is ambiguous without a selected parent.",
            );
          return result;
        },
      );
    },
  );
  const referenceField: (
    parentAreas: readonly number[],
  ) => ReturnType<typeof createHumanPersonReferenceField> = (
    parentAreas: readonly number[],
  ): ReturnType<typeof createHumanPersonReferenceField> =>
    createHumanPersonReferenceField({ plan, bindings, bindingAt, parentAreas });
  const legacy: (input: IAutoMovieHumanPersonPerformedSkin) => number[] = (
    input: IAutoMovieHumanPersonPerformedSkin,
  ): number[] => {
    const { parentAreas }: ReturnType<typeof evaluateHumanPersonSourceCells> =
      evaluateHumanPersonSourceCells({
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
        identity: (sample: number, parent: number): string =>
          bindingAt(sample, parent).identity,
      });
}
