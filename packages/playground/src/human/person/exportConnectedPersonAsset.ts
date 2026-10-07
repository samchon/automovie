import type { IConnectedPersonAssetExportProps } from "./IConnectedPersonAssetExportProps";

/**
 * Encode the person on screen as a static GLB and hand it to the download
 * sink, or do nothing when another person replaced it meanwhile.
 *
 * The accepted person is encoded by the admitted export. A draft is encoded
 * through the same exporter guards as a construction and is always saved with
 * its admission report beside it, under names that say it is a draft, so a
 * successful encoding never reads as acceptance. The subject is the displayed
 * person's own document; unapplied document text is never encoded. Returns
 * the line to report, or null when there is nothing to say.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Exports the displayed person, and a refused draft only together with its admission report.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Discards the encoded bytes when the displayed person changed during encoding.
 * @author Samchon
 */
export async function exportConnectedPersonAsset<Model>(
  props: IConnectedPersonAssetExportProps<Model>,
): Promise<string | null> {
  const draft = props.draft;
  if (draft === null) {
    if (props.committed === undefined) return null;
    const bytes = await props.viewport.export(props.committed);
    if (props.unchanged())
      props.download(props.committed.id + ".glb", bytes, "model/gltf-binary");
    return null;
  }
  const result = await props.viewport.exportConstruction(draft.document);
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
