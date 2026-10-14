/**
 * Source registration of the body's native subcutaneous boundary calculation.
 *
 * The named skin's layerThickness is the only field value owner. Its parsed content digest is separate from the original Python field-file bytes and producer/view/receipt identities. The body constructs the dermal, fascial and rim members once on its final exterior; this record stores no second mesh, tissue thickness or personal sculpt input. A static source part with the same anatomical identity cannot coexist with this registration. Original field anchors retain their measurement protocols and populations. Registration preserves reported offset refusals and certifies no embedding.
 *
 * @evidence contracts/common.md#principled-implementation Separate parsed-field, original-byte, producer, input-view and receipt digests identify one native skin-owned thickness calculation without storing a second mesh.
 * @evidence contracts/common.md#clear-and-simple-design The registration groups provenance witnesses with the single source surface and logical adipose owner; actual field values remain in that skin's layerThickness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same anatomical identity cannot also appear as a static part, and registration preserves offset refusals rather than claiming valid embedding.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish parsed content from file-byte identity, each provenance digest, native boundary ownership and unresolved anatomical limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Native subcutaneous registration records do not run boundary construction or hash computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Content and producer digests identify dependencies but the record itself shares no completed thickness calculation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This provenance record contains locators and hashes without acquiring a file stream or resident tissue mesh.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyNativeSubcutaneousSource {
  /** Logical anatomical owner of the emitted native boundary. */
  id: "subcutaneousAdipose";

  /** Tissue family retained independently of inspection appearance. */
  tissue: "adipose";

  /** Exact native skin surface whose layerThickness supplies the field. */
  surface: string;

  /** autoMovieRenderDigest(JSON.stringify(field)), including its sha256: prefix. */
  fieldDigest: string;

  /** Actual generated thickness-field resource retained by the publisher. */
  fieldFileUri: string;

  /** SHA-256 of the original field-file bytes, independently of parsed content. */
  fieldFileSha256: string;

  /** SHA-256 of the actual thickness producer read by registration. */
  producerSha256: string;

  /** SHA-256 of the actual native body-view bytes supplied to the producer. */
  inputViewSha256: string;

  /** SHA-256 of the producer's original registration receipt bytes. */
  receiptSha256: string;

  /** Account of native skin incidence and final-exterior boundary ownership. */
  bindingAccount: string;

  /** Source-authored meaning and unresolved anatomical and embedding limits. */
  qualification: string;
}
