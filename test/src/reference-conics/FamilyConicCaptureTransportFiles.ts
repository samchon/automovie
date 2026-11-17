import path from "node:path";

import { FamilyConicCaptureBaseline as Baseline } from "./FamilyConicCaptureBaseline";
import { FamilyConicCaptureFileIO as FileIO } from "./FamilyConicCaptureFileIO";
import type { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicCaptureTransport as Transport } from "./FamilyConicCaptureTransport";
import { FamilyConicCaseSelection as Selection } from "./FamilyConicCaseSelection";
import { FamilyConicRecordedInputTransport as Recorded } from "./FamilyConicRecordedInputTransport";

/** Exact-file transport of completed observations; no model, solver or renderer is imported. */
export namespace FamilyConicCaptureTransportFiles {
  /** Share the unchanged containment implementation. */
  const inside: typeof FileIO.inside = FileIO.inside;
  /** Share the unchanged checked byte reader. */
  const checked: typeof FileIO.checked = FileIO.checked;
  /**
   * Loaded operator-input layer, never a current live geometry evaluation.
   *
   *
   * @evidence contracts/development/design.md#principled-representation One source-only observation contains metre display curves and explicit unavailable evidence; null denotes a direct preflight without a recorded layer.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SourceCapture borrows this result and retains the exact historical/current packet provenance.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result is an observation, not a second family, law or current live operator surface.
   * @evidence contracts/development/common.md#meaningful-documentation Members state recorded-input scope and the null direct-input case.
   */
  export interface ILayer {
    /** Actual submitted samples, or null for a direct same-generation preflight. */
    submitted: Transport.ISubmitted | null;
    /** Historical/current provenance is retained without a same-generation claim. */
    evidence: unknown;
  }

  /**
   * Load an exact current-generation observation or an explicitly historical source-only packet after unchanged input guards.
   * Current observations reuse exact case/fields/complete-source admission. Historical packets additionally bind original bytes and both separately identified generations.
   * No geometry is constructed; historical source-only scope is refused by the full consumer and missing observation evidence is refused by the source-only consumer.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact artifact/preflight bytes, both scopes, original catalog case and actual per-case bytes bind the recorded input before display.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scope refusal precedes packet loading; provenance and case/index identity checks precede point extraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No solver, source evaluation, geometry import, forced alias or same-generation promotion occurs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sequential file hashing plus one actual case parse costs the referenced bytes and current case point count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared Identity, Selection and Transport owners provide the same admission and point boundary.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the one-case sampled layer and bounded provenance escape; awaited reads release file handles and actual receipt buffers leave scope.
   * @evidence contracts/development/common.md#meaningful-documentation The comment describes exact-byte admission, source-only scope and absent live geometry evaluation.
   */
  export async function load(
    input: Input.IInput,
    sourceOnly: boolean,
  ): Promise<ILayer> {
    const bytes: Buffer = await checked(input.root, {
      file: input.preflight.file,
      byteHash: input.preflight.sha256,
    });
    const report: Record<string, unknown> = Transport.record(
      JSON.parse(bytes.toString("utf8")),
    );
    const artifact: unknown = JSON.parse(
      (
        await checked(input.root, {
          file: input.artifact.file,
          byteHash: input.artifact.sha256,
        })
      ).toString("utf8"),
    );
    Transport.restrict(report, sourceOnly, artifact);
    if (report.operatorInputObservation !== undefined) {
      if (report.evidenceScope === "recorded-input-source-only")
        throw new Error(
          "Current-generation and historical recorded-input observations cannot be combined",
        );
      const pointer: { file: string; sha256: string } =
        report.operatorInputObservation as { file: string; sha256: string };
      Selection.sourcePaths({ [pointer.file]: pointer.sha256 });
      if (!pointer.file.startsWith("packages/human/.shots/"))
        throw new Error(
          "Operator input observation must be repo-relative human/.shots data",
        );
      const file: string = await inside(
        path.join(input.root, "packages/human/.shots"),
        path.resolve(input.root, pointer.file),
      );
      const observed: Transport.IClaim & {
        actualBands: unknown[];
        actualSeams: unknown[];
      } = JSON.parse(
        (
          await checked(input.root, { file, byteHash: pointer.sha256 })
        ).toString("utf8"),
      );
      Selection.preflight(observed, input.selected, input.sourceHashes);
      if (
        !Array.isArray(observed.actualBands) ||
        !Array.isArray(observed.actualSeams)
      )
        throw new Error(
          "Current observation lacks actual prepared operator input arrays",
        );
      return {
        submitted: Transport.submitted(
          observed.actualBands,
          observed.actualSeams,
        ),
        evidence: {
          scope: "actual-submitted-operator-input",
          generation: "same-generation",
          observation: { file, sha256: pointer.sha256 },
          id: observed.id,
          fieldsHash: observed.fieldsHash,
          sourceHashes: observed.sourceHashes,
          qualification:
            "Exact current case/fields/source identity and recorded prepared input points; no continuous world-loop, current capture-time evaluation or realized-skin certificate.",
        },
      };
    }
    if (report.evidenceScope !== "recorded-input-source-only") {
      if (sourceOnly)
        throw new Error(
          "Source-only capture requires the matching operator input observation",
        );
      return { submitted: null, evidence: null };
    }
    return Recorded.load(input, report);
  }

  /**
   * Export exact completed case records against the separately recorded current observation fingerprint.
   * Reads one actual case at a time; it never reapplies a law, creates geometry or publishes a forced alias.
   * The final catalog is written last, so a partial export cannot supply an admitted case catalog.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Completed original records are admitted against the separately recorded current fingerprint and exact observation receipts, preserving every original field.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Provenance/current checks precede sequential case reports; producer/bundle and receipt finish before final catalog publication.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fields, resolution, geometry or solver are recomputed; unresolved entries remain unresolved and noncatalog forced ids are excluded.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two complete current fingerprint reads bracket sequential per-case byte work; retained indexes scale with catalog size rather than receipt totals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing canonical identity and pure admission are reused; the producer references exact prior observations instead of rerunning them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One actual case receipt is scoped to each loop iteration; only catalog and file identities persist, all writes are awaited with no overwrite.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states historical versus current scope, one-case retention and final publication behavior.
   */
  export const run: typeof Recorded.run = Recorded.run;

  /**
   * Load one explicit archived F1 framing reference without admitting it as current generation evidence.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The known original-definition schema, exact f1 identity/field digest, full scope, world-mm axis convention, finite frame and archived producer bundle bind world-metre comparison samples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One absolute CLI file is contained under human/.shots, checked as a fixed F1 original record, then reduced to comparison curves and provenance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Historical source hashes are retained as provenance and never compared to or substituted for current admission; no reference recovery, alignment or geometry evaluation occurs.
   * @evidence contracts/development/implementation.md#efficient-algorithms One reference JSON parse and linear curve/point validation retain only the fixed samples and bounded provenance needed by the camera plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All cases and passes read the same explicit file bytes and the existing Identity/Selection validators.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited reads release handles; only one fixed comparison catalog and its identity escape, with no actual case collection or running task.
   * @evidence contracts/development/common.md#meaningful-documentation States absolute input, fixed F1 scope, world units, original provenance and the separate current-generation role.
   */
  export const baseline: typeof Baseline.baseline = Baseline.baseline;
}
