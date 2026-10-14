import type {
  IAutoMovieDesignLineage,
  IAutoMovieDesignReference,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import { canonicalizeAutoMovieJson } from "./contentIdentity";

/**
 * Merge shared shot documents without losing conflicting stable identities.
 *
 * Equal canonical JSON under one id is one document staged by several shots.
 * Unequal documents under that id are ambiguous and are refused before either
 * can replace the other. The first observed document remains the binding input;
 * a failed compilation cannot publish it as an accepted choice.
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON compares the complete typed document, ignoring object key insertion order and preserving array order and values. Equality permits cross-shot sharing; unequal content under one stable id cannot identify a unique observation or lineage.
 * @evidence contracts/common.md#clear-and-simple-design One compilation-local merge owns both stable document identities and reports their collisions; the existing reference and lineage gates retain byte, citation, coherence, and binding validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No last-writer fallback selects a conflicting document. Both document families use content equality for every id, without fixture or consumer exceptions.
 * @evidence contracts/common.md#meaningful-documentation Explains the equality rule, conflict refusal, retained first value, and failed-publication effect; the input names shot-carried documents and the output names merged documents and refusals.
 * @evidence contracts/performance.md#efficient-algorithms Canonicalizes each carried document once, with the canonicalizer's key sorting cost, and performs map lookups by id. Space is the first document and canonical text per distinct id plus one diagnostic per conflicting occurrence.
 * @evidence contracts/performance.md#reuse-equivalent-work Identical cross-shot documents share one validation input within this compilation. Identity includes every document field; each fresh compilation reconstructs the merge from current shot output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and canonical texts are call-local; returned document references and diagnostics transfer to the compilation, whose shot population bounds their size. No handles or tasks are acquired.
 */
export function productionDesignDocumentDiagnostics(
  shots: Iterable<{
    designReferences?: readonly IAutoMovieDesignReference[];
    designLineages?: readonly IAutoMovieDesignLineage[];
  }>,
): {
  references: IAutoMovieDesignReference[];
  lineages: IAutoMovieDesignLineage[];
  diagnostics: IAutoMovieDiagnostic[];
} {
  const references: Map<string, IAutoMovieDesignReference> = new Map();
  const referenceContent: Map<string, string> = new Map();
  const lineages: Map<string, IAutoMovieDesignLineage> = new Map();
  const lineageContent: Map<string, string> = new Map();
  const diagnostics: IAutoMovieDiagnostic[] = [];
  for (const shot of shots) {
    for (const reference of shot.designReferences ?? []) {
      const content: string = canonicalizeAutoMovieJson(reference);
      const previous: string | undefined = referenceContent.get(reference.id);
      if (previous === undefined) {
        references.set(reference.id, reference);
        referenceContent.set(reference.id, content);
      } else if (previous !== content)
        diagnostics.push({
          code: "design-reference-duplicate",
          category: "error",
          phase: "design",
          target: reference.id,
          path: null,
          message: `Design reference "${reference.id}" has conflicting documents in compiled shots. Keep one observation per stable identity before compiling.`,
        });
    }
    for (const lineage of shot.designLineages ?? []) {
      const content: string = canonicalizeAutoMovieJson(lineage);
      const previous: string | undefined = lineageContent.get(lineage.id);
      if (previous === undefined) {
        lineages.set(lineage.id, lineage);
        lineageContent.set(lineage.id, content);
      } else if (previous !== content)
        diagnostics.push({
          code: "design-lineage-unbound",
          category: "error",
          phase: "compile",
          target: `design-lineage:${lineage.id}`,
          path: null,
          message: `Design lineage "${lineage.id}" has conflicting documents in compiled shots and cannot bind one stable work. Keep one lineage per identity before compiling.`,
        });
    }
  }
  return {
    references: [...references.values()],
    lineages: [...lineages.values()],
    diagnostics,
  };
}
