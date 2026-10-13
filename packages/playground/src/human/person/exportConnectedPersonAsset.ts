import type { IConnectedPersonAssetExportProps } from "./IConnectedPersonAssetExportProps";

/**
 * Encode the person on screen as a static GLB and hand it to the download
 * sink, or do nothing when another person replaced it meanwhile.
 *
 * Accepted display uses ordinary admitted export. A displayed draft uses construction export with the same encoder guards, then requests GLB and admission-report handoffs under explicit construction names. The subject is the displayed document, not unapplied JSON text; the returned report line distinguishes encoding from model admission.
 *
 * File handoffs are ordered but not atomic: a second sink failure can follow the first handoff, and the function propagates that failure. Neither handoff acknowledges physical disk saving.
 *
 * @evidence contracts/common.md#principled-implementation Explicit accepted-versus-draft display selects ordinary or qualified construction encoding, and current intent/model identity through unchanged gates delivery after asynchronous numerical output.
 * @evidence contracts/common.md#clear-and-simple-design Numerical encoding stays viewport-owned, current display authority stays panel-owned and this helper chooses labelled file handoffs plus the truthful report line.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unapplied editor text is not exported, stale display receives no handoff, construction bytes retain their actual admission sidecar and ordered browser handoffs are not certified atomic saving.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies displayed input, accepted/draft encoding guards, stale suppression, encoding-versus-admission and partial delivery failure.
 * @evidence contracts/performance.md#efficient-algorithms Coordinator work is fixed before encoding; draft delivery additionally serializes a bytes-independent admission wrapper of size a in O(a) time/string storage, while numerical GLB work and browser byte retention belong to actual encoder/sink owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Export is an explicit current-display effect and no previous bytes are cached by this helper; the encoder may own source reuse behind its separate numerical seam.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each pending call retains its borrowed display/viewport until encoding and delivery settle, with no independent concurrency cap here; the page/transport owns cancellation/close and the download sink retires browser object URLs.
 *
 * @author Samchon
 */
export async function exportConnectedPersonAsset<Model>(
  props: IConnectedPersonAssetExportProps<Model>,
): Promise<string | null> {
  const draft: IConnectedPersonAssetExportProps<Model>["draft"] = props.draft;
  if (draft === null) {
    if (props.committed === undefined) return null;
    const bytes: Uint8Array<ArrayBuffer> = await props.viewport.export(props.committed);
    if (props.unchanged())
      props.download(props.committed.id + ".glb", bytes, "model/gltf-binary");
    return null;
  }
  const result: Awaited<ReturnType<IConnectedPersonAssetExportProps<Model>["viewport"]["exportConstruction"]>> = await props.viewport.exportConstruction(draft.document);
  if (!props.unchanged()) return null;
  props.download(
    draft.document.id + ".construction.glb",
    result.glb,
    "model/gltf-binary",
  );
  props.download(
    draft.document.id + ".construction-admission.json",
    JSON.stringify(
      {
        mode: "construction draft",
        document: draft.document.id,
        faceBasis: draft.document.face.basis,
        bodyBasis: draft.document.body.basis,
        admission: result.admission,
      },
      null,
      2,
    ),
    "application/json",
  );
  return (
    "Static encoding passed; model admission remains " +
    (result.admission.accepted
      ? "accepted by its owner."
      : "refused, as recorded beside the asset.")
  );
}
