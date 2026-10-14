import type {
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceBasisCorrective as IAutoMovieHumanFaceBasisCorrectiveImported,
  IAutoMovieHumanFaceBasisCorrectiveInput as IAutoMovieHumanFaceBasisCorrectiveInputImported,
} from "../../index";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * The control state one document asks of one admitted facial basis.
 *
 * This is the boundary between a document and the geometry: channel weights
 * checked against their envelopes and corrective activations computed from
 * those weights. It reads both inputs and mutates neither. The builder
 * applies the result, the articulation reads the same weights for its joint
 * angles, and offline preparation calls it so an endpoint decomposed at
 * weight one is exactly the endpoint the builder evaluates at weight one.
 *
 * The activation is a product of the clamped driving sides times the
 * authored gain, capped at one: present only when every driver is present, a
 * quarter when two unit-gain drivers are at half. A sum
 * here would fire a corrective on one driver alone, which is the pose it was
 * authored to leave untouched. An input with a peak under one is an
 * in-between: its factor is a tent over the driver, one at the peak and zero
 * at either end of its span, which is the whole envelope unless the input
 * names one. A corrective is shape-only when every driver is a shape channel,
 * which is what lets landmarks and identity read it.
 *
 * @evidence contracts/common.md#principled-implementation Resident channel kind/range admission builds one weight map; each corrective multiplies its signed, clamped driver tents and authored gain, so any inactive driver removes its contribution. Current builder and preparation callers use an already admitted basis, including valid peak/span denominators and referenced channels.
 * @evidence contracts/common.md#clear-and-simple-design One boundary produces weights plus target/activation/shape-only records for rest and articulation consumers; geometry rows and joint transforms retain their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown, wrong-kind, nonfinite and out-of-envelope requests refuse rather than clamp. Driver factors are clamped by the authored activation definition; they do not relax input admission or certify simultaneous poses as anatomical motion.
 * @evidence contracts/common.md#meaningful-documentation Prose gives signed sides, product activation, optional in-between tents, immutable inputs and the all-shape distinction used for identity references.
 * @evidence contracts/performance.md#efficient-algorithms One O(C) channel map supports O(W) supplied-weight admission and O(D) corrective driver work, using expected constant lookups; output storage follows admitted weights and corrective count.
 * @evidence contracts/performance.md#reuse-equivalent-work The same channel map admits weights, classifies corrective drivers and evaluates their factors. One returned state serves rest, articulation and pose identity; this function caches no result across documents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and activation records are per-call and transfer to the evaluating stage; no basis/document mutation, request history, task or external handle is retained.
 */
export function humanFaceBasisWeights(
  basis: IAutoMovieHumanFaceBasis,
  document: Pick<IAutoMovieHumanFaceBasisDocument, "shape" | "expression">,
): {
  weights: Map<string, number>;
  activations: { target: string; activation: number; shapeOnly: boolean }[];
} {
  const channels: Map<string, IAutoMovieHumanFaceBasisChannelImported> =
    new Map(
      basis.channels.map(
        (
          channel: IAutoMovieHumanFaceBasisChannelImported,
        ): [string, IAutoMovieHumanFaceBasisChannelImported] => [
          channel.id,
          channel,
        ],
      ),
    );
  const weights: Map<string, number> = new Map<string, number>();
  for (const kind of ["shape", "expression"] as const)
    for (const [name, weight] of Object.entries(document[kind])) {
      const channel: IAutoMovieHumanFaceBasisChannelImported | undefined =
        channels.get(name);
      if (
        channel === undefined ||
        channel.kind !== kind ||
        !Number.isFinite(weight) ||
        weight < channel.minimum ||
        weight > channel.maximum
      )
        throw new Error(
          "Unsupported or out-of-domain facial control: " + kind + "." + name,
        );
      weights.set(name, weight);
    }
  const activations: {
    target: string;
    shapeOnly: boolean;
    activation: number;
  }[] = (basis.correctives ?? []).map(
    (
      corrective: IAutoMovieHumanFaceBasisCorrectiveImported,
    ): { target: string; shapeOnly: boolean; activation: number } => ({
      target: corrective.target,
      shapeOnly: corrective.inputs.every(
        (input: IAutoMovieHumanFaceBasisCorrectiveInputImported): boolean =>
          channels.get(input.channel)!.kind === "shape",
      ),
      activation: Math.min(
        1,
        corrective.inputs.reduce(
          (
            total: number,
            input: IAutoMovieHumanFaceBasisCorrectiveInputImported,
          ): number => {
            const weight: number = weights.get(input.channel) ?? 0;
            const driver: number = input.side === "negative" ? -weight : weight;
            const peak: number = input.peak ?? 1;
            const [below, above]: [number, number] = input.between ?? [0, 1];
            const factor: number =
              driver <= peak
                ? (driver - below) / (peak - below)
                : above > peak
                  ? (above - driver) / (above - peak)
                  : 1;
            return total * Math.min(1, Math.max(0, factor));
          },
          corrective.weight,
        ),
      ),
    }),
  );
  return { weights, activations };
}
