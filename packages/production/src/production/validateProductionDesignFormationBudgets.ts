import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { AUTOMOVIE_MAX_FORMATION_MEMBERS } from "./AUTOMOVIE_MAX_FORMATION_MEMBERS";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { AUTOMOVIE_FORMATION_INSTANCE_BYTES } from "./AUTOMOVIE_FORMATION_INSTANCE_BYTES";
import { AUTOMOVIE_FORMATION_INSTANCE_BUFFER_BUDGET_BYTES } from "./AUTOMOVIE_FORMATION_INSTANCE_BUFFER_BUDGET_BYTES";
import { AUTOMOVIE_FORMATION_RUNTIME_BUDGET_BYTES } from "./AUTOMOVIE_FORMATION_RUNTIME_BUDGET_BYTES";
import { IAutoMovieDiagnostic, IAutoMovieFormationDesign, IAutoMovieModelLodRecipe, IAutoMovieShotContract, IAutoMovieShotParticipant } from "@automovie/interface";

/**
 * Aggregate original member counts, anonymous LOD matrix/phase bytes and estimated compact runtime payload before individual formation validation.
 *
 * @evidence contracts/common.md#principled-implementation Payload estimates retain fixed per-formation/chunk/hero conventions and shot occurrence searches; they are admission estimates rather than measured output bytes.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignFormationBudgets owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms F formations search model LOD and shot participant populations, encode their declared payloads and retain transient iteration/serialization arrays; no actual instance matrices are allocated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export function validateProductionDesignFormationBudgets(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, sharedRoot: string): void {
const formationMemberCount: number = [...graph.formations.values()].reduce(
    (sum: number, formation: IAutoMovieFormationDesign): number => sum + formation.count,
    0,
  );
if (
    Number.isSafeInteger(formationMemberCount) === false ||
    formationMemberCount > AUTOMOVIE_MAX_FORMATION_MEMBERS
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      "formations",
      `${sharedRoot}/formations`,
      `The production declares ${formationMemberCount} formation members, above the compact-runtime limit ${AUTOMOVIE_MAX_FORMATION_MEMBERS}. Reduce the total; unlimited crowds are not supported.`,
    );
const formationInstanceBytes: number = [...graph.formations.values()].reduce(
    (bytes: number, formation: IAutoMovieFormationDesign): number => {
      const anonymousTiers: number =
        graph.models
          .get(formation.modelRecipe)
          ?.lod.filter((lod: IAutoMovieModelLodRecipe): boolean => lod.tier !== "hero").length ?? 0;
      return (
        bytes +
        (formation.count - formation.heroOverrides.length) *
          Math.max(1, anonymousTiers) *
          AUTOMOVIE_FORMATION_INSTANCE_BYTES
      );
    },
    0,
  );
if (
    Number.isSafeInteger(formationInstanceBytes) === false ||
    formationInstanceBytes > AUTOMOVIE_FORMATION_INSTANCE_BUFFER_BUDGET_BYTES
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      "formations",
      `${sharedRoot}/formations`,
      `Formation LOD matrices and phase attributes require ${formationInstanceBytes} bytes, above the ${AUTOMOVIE_FORMATION_INSTANCE_BUFFER_BUDGET_BYTES}-byte viewer budget. Reduce count or LOD tiers.`,
    );
const formationRuntimeBytes: number = [...graph.formations.values()].reduce(
    (bytes: number, formation: IAutoMovieFormationDesign): number => {
      const occurrences: number = [...graph.shots.values()].filter((shot: IAutoMovieShotContract): boolean =>
        shot.participants.some(
          (participant: IAutoMovieShotParticipant): boolean =>
            participant.kind === "formation" && participant.id === formation.id,
        ),
      ).length;
      const variableBytes: number = Buffer.byteLength(
        JSON.stringify({
          id: formation.id,
          modelRecipe: formation.modelRecipe,
          layout: formation.layout,
          heroes: formation.heroOverrides,
          lod: graph.models.get(formation.modelRecipe)?.lod ?? [],
        }),
        "utf8",
      );
      const runtimeBytes: number =
        4_096 +
        variableBytes +
        Math.ceil(formation.count / 1_024) * 1_024 +
        formation.heroOverrides.length * 1_024;
      return bytes + runtimeBytes * Math.max(1, occurrences);
    },
    0,
  );
if (
    Number.isSafeInteger(formationRuntimeBytes) === false ||
    formationRuntimeBytes > AUTOMOVIE_FORMATION_RUNTIME_BUDGET_BYTES
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      "formations",
      `${sharedRoot}/formations`,
      `Estimated compact formation runtime is ${formationRuntimeBytes} bytes, above the ${AUTOMOVIE_FORMATION_RUNTIME_BUDGET_BYTES}-byte generated payload budget. Reduce count or hero overrides.`,
    );
}
