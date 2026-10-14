import { IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieFilmTimeline, IAutoMovieProductionMediaProbe, IAutoMovieProductionRenderManifest, IAutoMovieProductionRenderReceipt, IAutoMovieShotContract, type IAutoMovieProductionDeliverable, type IAutoMovieProductionRenderReceiptFile, type IAutoMovieProductionRenderedDeliverable } from "@automovie/interface";
import { type IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { readAutoMovieFilmTimeline } from "./filmTimeline";
import { probeProductionMedia } from "./probeProductionMedia";
import { errorMessage } from "./productionBuildDiagnostics";
import { AutoMovieProductionRenderLedgerSchemaError, parseProductionRenderManifestBytes, parseProductionRenderReceiptBytes } from "./productionRenderLedgerRecords";
import { assertProductionRenderPublicationCurrent, isPortableProductionPublicationPath, parseProductionRenderPublicationIdentity } from "./productionRenderPublicationIdentity";
import { classifyAutoMovieProductionDeliverableSemanticMask, type AutoMovieProductionDeliverableSemanticMaskFinding } from "./semanticMaskEvidence";




import type { IProductionDeliveryObservedFile } from "./IProductionDeliveryObservedFile";
import { productionDeliveryValidationAppendRenditionDiagnostics } from "./productionDeliveryValidationAppendRenditionDiagnostics";
import { productionDeliveryValidationAppendTimelineDiagnostics } from "./productionDeliveryValidationAppendTimelineDiagnostics";
import { productionDeliveryValidationCanonicalizeProbe } from "./productionDeliveryValidationCanonicalizeProbe";
import { productionDeliveryValidationDiagnostic } from "./productionDeliveryValidationDiagnostic";

/**
 * Review final publication manifests, owner receipts, resident bytes, and current media facts without publishing or repairing them. A null production returns no diagnostics; other callers must supply the current render plan. File reads are sequential and do not form an atomic filesystem snapshot.
 *
 * @evidence contracts/common.md#principled-implementation The final review joins declared deliverables, strict ledger schemas, current plan provenance, and case-insensitive portable file identities before digest and probe comparisons. Reader ancestry fences protect each read; later file changes remain possible. Receipt validity and semantic coverage precede timeline and rendition checks.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator preserves manifest order and delegates rendition, timeline, canonical probe, and diagnostic construction to separate owners. reviewAutoMovieProductionBuild invokes it only for final scope, appending findings without publishing bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or stale receipts are refused rather than reconstructed. Unsafe tracked manifest reads retain the existing invalid-manifest sentinel, and no fixture-specific success or fallback media is supplied. Validation of declared facts does not independently remeasure PCM or certify visual quality.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies final-only review, the current-plan premise, null production, read-only effects, and the limit of sequential resident-byte observations. Returned diagnostics may coexist with later filesystem mutations.
 * @evidence contracts/performance.md#efficient-algorithms Manifest and receipt parsing, canonical hashes, and full media probes dominate total resident byte size; maps and path sets require space proportional to declared and recorded files. Timeline is read once here, while applicable feature rendition checks reread it and selected clips.
 * @evidence contracts/performance.md#reuse-equivalent-work The current timeline and lookup maps are shared within this call. Every resident file is reread and reprobed against its receipt because fingerprint equality cannot establish unchanged bytes; no previous review result is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call retains ledger bytes, lookup records, findings, and all observed byte buffers for the current deliverable until its checks finish; no byte or file-population quota is imposed. Project readers acquire and close their own descriptors, and this function owns no workers or persistent cache.
 */
export const finalDeliverableDiagnostics: (project: AutoMovieProductionProject, production: ReturnType<AutoMovieProductionProject["graph"]>["production"], inputFingerprint: string, contracts: ReadonlyMap<string, IAutoMovieShotContract>, compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>, currentPlan?: IAutoMovieProductionRenderJobPlan) => IAutoMovieDiagnostic[] = (
  project: AutoMovieProductionProject,
  production: ReturnType<AutoMovieProductionProject["graph"]>["production"],
  inputFingerprint: string,
  contracts: ReadonlyMap<string, IAutoMovieShotContract>,
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  currentPlan?: IAutoMovieProductionRenderJobPlan,
): IAutoMovieDiagnostic[] => {
  if (production === null) return [];
  let bytes: Uint8Array | null;
  try {
    bytes = project.readTrackedStateFile("render-manifest.json");
  } catch {
    bytes = Buffer.from("unsafe tracked render manifest");
  }
  if (bytes === null)
    return [
      {
        code: "render-deliverable-missing",
        category: "error",
        phase: "render",
        target: production.id,
        path: `automovie/productions/${encodeAutoMoviePathSegment(project.productionId)}/render-manifest.json`,
        message:
          "Required deliverables have no current render manifest. Run the project render command before final compilation.",
      },
    ];
  // A publication proves only that some plan generation produced it. Whether
  // that generation is the one currently planned is a comparison with the
  // final plan, and a caller that supplies none has asked a question this gate
  // cannot answer; it says so rather than trusting the manifest's own claim.
  if (currentPlan === undefined)
    return [
      productionDeliveryValidationDiagnostic(
        "render-deliverable-stale",
        production.id,
        "Final delivery verification requires the current final render plan to compare the publication against. Run the project verify command, which supplies the current final plan generation.",
      ),
    ];
  const manifestDigest: string = digestAutoMovieBytes(bytes);
  let receipt: IAutoMovieProductionRenderReceipt | null = null;
  try {
    const receiptBytes: Uint8Array<ArrayBufferLike> | null = project.readTrackedStateFile(
      "render-manifest-receipt.json",
    );
    if (receiptBytes !== null)
      receipt = parseProductionRenderReceiptBytes(receiptBytes);
  } catch {
    receipt = null;
  }
  if (
    receipt === null ||
    receipt.version !== 4 ||
    receipt.manifestDigest !== manifestDigest
  )
    return [
      productionDeliveryValidationDiagnostic(
        "render-deliverable-unowned",
        production.id,
        "The aggregate render manifest lacks the matching renderer-owned receipt. Recreate it through the production render command instead of editing tracked state directly.",
      ),
    ];
  let manifest: IAutoMovieProductionRenderManifest;
  try {
    manifest = parseProductionRenderManifestBytes(bytes);
  } catch (error) {
    return [
      productionDeliveryValidationDiagnostic(
        "render-deliverable-invalid",
        production.id,
        error instanceof AutoMovieProductionRenderLedgerSchemaError
          ? `The active production render manifest does not satisfy the aggregate render-ledger schema: ${error.violations.join("; ")}. Recreate it through the production render command.`
          : "The aggregate render manifest is not valid JSON. Recreate it through the production render command.",
      ),
    ];
  }
  let publication: ReturnType<typeof parseProductionRenderPublicationIdentity>;
  try {
    publication = assertProductionRenderPublicationCurrent({
      identity: manifest.publication,
      plan: currentPlan,
    });
  } catch (error) {
    return [
      productionDeliveryValidationDiagnostic(
        "render-deliverable-invalid",
        production.id,
        `${errorMessage(error)} Recreate the final publication from the current render plan.`,
      ),
    ];
  }
  if (
    publication.productionId !== production.id ||
    publication.tier.kind !== "final" ||
    publication.compileFingerprint !== manifest.compileFingerprint ||
    receipt.publicationFingerprint !== publication.fingerprint
  )
    return [
      productionDeliveryValidationDiagnostic(
        "render-deliverable-stale",
        production.id,
        "The final manifest and renderer-owned receipt do not carry one matching final-tier render-plan identity. Replan and republish the current production.",
      ),
    ];
  if (manifest.compileFingerprint !== inputFingerprint)
    return [
      productionDeliveryValidationDiagnostic(
        "render-deliverable-stale",
        production.id,
        "Required deliverables are not bound to the current compile fingerprint. Re-render the current production and replace the aggregate render manifest.",
      ),
    ];
  const diagnostics: IAutoMovieDiagnostic[] = [];
  let timeline: IAutoMovieFilmTimeline | null = null;
  try {
    timeline = readAutoMovieFilmTimeline(project, inputFingerprint);
  } catch (error) {
    diagnostics.push(
      productionDeliveryValidationDiagnostic(
        "render-deliverable-stale",
        production.id,
        `${errorMessage(error)} Final delivery cannot be joined to the current compiled film timeline.`,
      ),
    );
  }
  const declared: Map<string, IAutoMovieProductionDeliverable> = new Map(
    production.deliverables.map((deliverable: IAutoMovieProductionDeliverable) : [string, IAutoMovieProductionDeliverable] => [deliverable.id, deliverable]),
  );
  const resident: Map<string, IAutoMovieProductionRenderedDeliverable> = new Map<
    string,
    IAutoMovieProductionRenderManifest["deliverables"][number]
  >();
  const filePaths: Set<string> = new Set<string>();
  const receiptByPath: Map<string, IAutoMovieProductionRenderReceiptFile> = new Map(
    receipt.files.flatMap((file: IAutoMovieProductionRenderReceiptFile) : (readonly [string, IAutoMovieProductionRenderReceiptFile])[] =>
      isPortableProductionPublicationPath(file.path)
        ? [[file.path.toLowerCase(), file] as const]
        : [],
    ),
  );
  if (receiptByPath.size !== receipt.files.length)
    diagnostics.push(
      productionDeliveryValidationDiagnostic(
        "render-deliverable-unowned",
        production.id,
        "The renderer-owned receipt repeats a physical file path or spells one outside the canonical portable form. Recreate it through the production render command.",
      ),
    );
  const witnessedReceiptPaths: Set<string> = new Set<string>();
  for (const deliverable of manifest.deliverables) {
    if (resident.has(deliverable.id))
      diagnostics.push(
        productionDeliveryValidationDiagnostic(
          "render-deliverable-invalid",
          deliverable.id,
          `Deliverable "${deliverable.id}" is duplicated in the aggregate render manifest. Keep one byte-exact record.`,
        ),
      );
    else resident.set(deliverable.id, deliverable);
    const contract: IAutoMovieProductionDeliverable | undefined = declared.get(deliverable.id);
    if (contract === undefined || contract.kind !== deliverable.kind)
      diagnostics.push(
        productionDeliveryValidationDiagnostic(
          "render-deliverable-invalid",
          deliverable.id,
          `Deliverable "${deliverable.id}" kind "${deliverable.kind}" does not match current production design. Remove it or restore the exact declared id and kind.`,
        ),
      );
    if (deliverable.files.length === 0)
      diagnostics.push(
        productionDeliveryValidationDiagnostic(
          "render-deliverable-incomplete",
          deliverable.id,
          `Deliverable "${deliverable.id}" has no output file. Render at least one owned byte artifact and record its digest and size.`,
        ),
      );
    const observed: IProductionDeliveryObservedFile[] = [];
    for (const file of deliverable.files) {
      if (isPortableProductionPublicationPath(file.path) === false) {
        diagnostics.push(
          productionDeliveryValidationDiagnostic(
            "render-deliverable-invalid",
            deliverable.id,
            `Render file "${file.path}" is not one canonical portable relative path. Rebuild the manifest without legacy path aliases.`,
            file.path,
          ),
        );
        continue;
      }
      const portablePath: string = file.path.toLowerCase();
      if (filePaths.has(portablePath))
        diagnostics.push(
          productionDeliveryValidationDiagnostic(
            "render-deliverable-invalid",
            deliverable.id,
            `Render file "${file.path}" is claimed more than once. Give each owned output one deliverable owner.`,
            file.path,
          ),
        );
      filePaths.add(portablePath);
      witnessedReceiptPaths.add(portablePath);
      if (
        Number.isInteger(file.bytes) === false ||
        file.bytes <= 0 ||
        file.mediaType.trim().length === 0
      ) {
        diagnostics.push(
          productionDeliveryValidationDiagnostic(
            "render-deliverable-invalid",
            deliverable.id,
            `Render file "${file.path}" needs a positive integer byte size and non-empty media type. Rebuild its ledger entry.`,
            file.path,
          ),
        );
        continue;
      }
      try {
        const actual: Uint8Array<ArrayBufferLike> = project.readRenderFile(file.path);
        if (
          actual.length !== file.bytes ||
          digestAutoMovieBytes(actual) !== file.digest
        )
          diagnostics.push(
            productionDeliveryValidationDiagnostic(
              "render-deliverable-stale",
              deliverable.id,
              `Render file "${file.path}" bytes do not match its recorded size and digest. Re-render the current deliverable.`,
              file.path,
            ),
          );
        const receiptFile: IAutoMovieProductionRenderReceiptFile | undefined = receiptByPath.get(portablePath);
        if (
          receiptFile === undefined ||
          receiptFile.deliverable !== deliverable.id ||
          receiptFile.digest !== file.digest ||
          receiptFile.bytes !== file.bytes ||
          receiptFile.mediaType !== file.mediaType ||
          Buffer.from(
            canonicalAutoMovieJsonBytes(receiptFile.semanticMask ?? null),
          ).equals(
            Buffer.from(canonicalAutoMovieJsonBytes(file.semanticMask ?? null)),
          ) === false
        )
          diagnostics.push(
            productionDeliveryValidationDiagnostic(
              "render-deliverable-unowned",
              deliverable.id,
              `Render file "${file.path}" lacks one exact renderer-owned byte and media-probe receipt. Recreate the aggregate manifest through the production render command.`,
              file.path,
            ),
          );
        else {
          let probe: IAutoMovieProductionMediaProbe;
          try {
            probe = probeProductionMedia({
              kind: deliverable.kind,
              mediaType: file.mediaType,
              bytes: actual,
            });
          } catch (error) {
            diagnostics.push(
              productionDeliveryValidationDiagnostic(
                "render-deliverable-invalid",
                deliverable.id,
                `Render file "${file.path}" failed current media probing: ${errorMessage(error)} Re-render a valid declared medium.`,
                file.path,
              ),
            );
            continue;
          }
          if (productionDeliveryValidationCanonicalizeProbe(probe) !== productionDeliveryValidationCanonicalizeProbe(receiptFile.probe))
            diagnostics.push(
              productionDeliveryValidationDiagnostic(
                "render-deliverable-unowned",
                deliverable.id,
                `Render file "${file.path}" current media facts differ from its renderer-owned receipt. Recreate the aggregate manifest.`,
                file.path,
              ),
            );
          else {
            // One classifier decides a sidecar's standing for the final gate,
            // the terminal commit, and the proxy preflight alike, so a
            // receipt that records incomplete runtime coverage is refused
            // here exactly as the other two boundaries refuse it.
            const semantic: AutoMovieProductionDeliverableSemanticMaskFinding = classifyAutoMovieProductionDeliverableSemanticMask(
              {
                deliverable,
                file,
                probe,
                bytes: actual,
                plan: currentPlan,
              },
            );
            if (
              semantic.status === "media" ||
              semantic.status === "semantic-mask"
            )
              observed.push({ file, bytes: actual, probe });
            else
              diagnostics.push(
                productionDeliveryValidationDiagnostic(
                  semantic.status === "unreceipted"
                    ? "render-deliverable-unowned"
                    : "render-deliverable-stale",
                  deliverable.id,
                  semantic.status === "stale"
                    ? `${semantic.reason} Recreate the semantic sidecar from its current mask frame.`
                    : semantic.reason,
                  file.path,
                ),
              );
          }
        }
      } catch (error) {
        diagnostics.push(
          productionDeliveryValidationDiagnostic(
            "render-deliverable-missing",
            deliverable.id,
            `${errorMessage(error)} Re-render the missing owned output.`,
            file.path,
          ),
        );
      }
    }
    productionDeliveryValidationAppendTimelineDiagnostics(
      diagnostics,
      production,
      inputFingerprint,
      contracts,
      compiled,
      timeline,
      deliverable,
      observed,
    );
    productionDeliveryValidationAppendRenditionDiagnostics(
      diagnostics,
      project,
      production,
      inputFingerprint,
      deliverable,
    );
  }
  for (const file of receipt.files)
    if (witnessedReceiptPaths.has(file.path.toLowerCase()) === false)
      diagnostics.push(
        productionDeliveryValidationDiagnostic(
          "render-deliverable-unowned",
          file.deliverable,
          `Renderer receipt file "${file.path}" is not owned by the current aggregate manifest. Recreate the manifest and receipt together.`,
          file.path,
        ),
      );
  for (const deliverable of production.deliverables)
    if (deliverable.required && resident.has(deliverable.id) === false)
      diagnostics.push(
        productionDeliveryValidationDiagnostic(
          "render-deliverable-missing",
          deliverable.id,
          `Required ${deliverable.kind} deliverable "${deliverable.id}" is absent from the aggregate render manifest. Render and record it before final compilation.`,
        ),
      );
  return diagnostics;
};
