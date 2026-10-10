/**
 * Source registration of the body's native subcutaneous boundary calculation.
 *
 * The named skin's layerThickness is the only field value owner. Its parsed
 * content digest is separate from the original Python field-file bytes and
 * producer/view/receipt identities. The body constructs the dermal, fascial
 * and rim members once on its final exterior; this record stores no second
 * mesh, tissue thickness or personal sculpt input. A static source part with
 * the same anatomical identity cannot coexist with this registration.
 * Original field anchors retain their measurement protocols and populations.
 * Registration preserves reported offset refusals and certifies no embedding.
 *
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
