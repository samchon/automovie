import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonDraft } from "./IConnectedPersonDraft";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Inputs of `exportConnectedPersonAsset`: the person on screen, the viewport whose worker encodes it, and the test that the same person is still displayed when the bytes arrive.
 *
 * Accepted export uses the committed document only; displayed refused drafts use construction export and retain a separate admission report. Unchanged must test current intent and displayed model identity, not merely a repeated document name. Unapplied JSON text is outside this input.
 *
 * @evidence contracts/common.md#principled-implementation Explicit committed-versus-draft state selects admitted or construction encoding, and current intent plus model identity gates file delivery after asynchronous bytes arrive.
 * @evidence contracts/common.md#clear-and-simple-design The export helper receives display provenance and file seams while the viewport owns numerical encoding and the panel owns which model is currently displayed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused draft bytes remain qualified by their admission report and names, and unapplied editor text or matching labels do not substitute for the displayed document/model.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies accepted/draft selection, sidecar qualification, unchanged identity requirements and exclusion of unapplied text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This export input type chooses no GLB encoding or file delivery algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current display identity authorizes delivery but declares no encoded-byte or numerical cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema borrows viewport and display state; the encoder and sink own temporary numerical models and browser resources.
 *
 * @author Samchon
 */
export interface IConnectedPersonAssetExportProps<Model> {
  /** The viewport whose resident worker encodes the file. */
  viewport: Pick<
    IConnectedPersonViewport<never>,
    "export" | "exportConstruction"
  >;

  /** The refused construction on screen, or null when the accepted person is. */
  draft: IConnectedPersonDraft<Model> | null;

  /** The committed document, used when no draft is displayed. */
  committed: IAutoMovieHumanPersonDocument | undefined;

  /**
   * Whether reserved intent and displayed model identity still match the person captured for export.
   *
   * @evidence contracts/common.md#principled-implementation The panel predicate combines intent authority and accepted/draft model reference identity before export side effects.
   * @evidence contracts/common.md#clear-and-simple-design The exporter asks one display-owner predicate without importing session or history internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal document ids or similar geometry alone do not authorize stale file delivery.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies both intent and captured model identity dependencies.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This predicate signature chooses no history or model lookup algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Delivery authority is an effect guard rather than encoded-result cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The predicate borrows current state and acquires no model, worker or native handle.
   */
  unchanged: () => boolean;

  /**
   * Deliver user-requested GLB or admission JSON under its explicit filename and MIME type.
   *
   * @evidence contracts/common.md#principled-implementation Qualified bytes are delivered only after display identity still authorizes the export's side effects.
   * @evidence contracts/common.md#clear-and-simple-design One sink serves static asset and paired report delivery while keeping browser URL implementation outside the exporter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts File delivery does not certify clinical or numerical acceptance beyond the owner's preserved report.
   * @evidence contracts/common.md#meaningful-documentation The member names GLB/report payloads and accompanying file/media metadata.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This sink type selects no Blob, JSON or GLB implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Download is an explicit user effect and promises no byte-identity sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary anchor and object URL lifetime belongs to the supplied sink implementation.
   */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
