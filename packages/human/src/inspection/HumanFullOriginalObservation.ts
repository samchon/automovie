import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { HumanTorsoArmObservation } from "./HumanTorsoArmObservation";
import { HumanTorsoObservation } from "./HumanTorsoObservation";

/** The modeler's currently available composed original and known-arm candidates, evaluated once before image IO. */
export namespace HumanFullOriginalObservation {
  /** Exact buffers and source facts; native-bank originals remain separately owned by their canonical provider. */
  export interface IOutput {
    /** Stable groups, retaining each original producer's camera and source IDs. */
    selections: readonly HumanTorsoObservation.ISelection[];
    /** Named source failures, without a replacement curve. */
    diagnostics: HumanTorsoObservation.IOutput["diagnostics"];
    /** Actual source/clock/constraint and independent arm/port ownership. */
    provenance: Record<string, unknown>;
  }

  /** Share the caller's same-input S00 with the arm-port owner; a first image may already have consumed its exact buffers, without rebuilding any source. */
  export function create(
    parameters: IAutoMovieHumanParameters,
    observed?: HumanTorsoObservation.IOutput,
  ): IOutput {
    const torso: HumanTorsoObservation.IOutput =
      observed ?? HumanTorsoObservation.create(parameters);
    let arms: HumanTorsoArmObservation.IOutput | null = null;
    const diagnostics: { id: string; detail: string }[] = [
      ...torso.diagnostics,
    ];
    try {
      arms = HumanTorsoArmObservation.create(parameters, torso);
    } catch (error: unknown) {
      diagnostics.push({
        id: "S00.arm-original-candidates",
        detail:
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error),
      });
    }
    return {
      selections: [...torso.selections, ...(arms?.selections ?? [])],
      diagnostics: [...diagnostics, ...(arms?.diagnostics ?? [])],
      provenance: {
        torso: torso.provenance,
        arms: arms?.provenance ?? { state: "producer-refused" },
        ownership:
          "One actual S00 shared with its explicit arm/port candidate owner. The existing native-bank arm/digit provider is a separate lineage, not certified identical or counted as a new composed source.",
        raw: "not-requested",
        finalRealization: "not-run",
      },
    };
  }
}
