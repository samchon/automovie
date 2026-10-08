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
 * @evidence contracts/common.md#principled-implementation Addresses one native field by surface and parsed-content digest while preserving independent file, producer, view and receipt provenance.
 * @evidence contracts/common.md#clear-and-simple-design One explicit subcutaneous registration replaces its independent static compartment owner without adding a general procedural-source factory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field value, fake atlas mesh digest or source vertex alias is duplicated by the record.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes parsed field identity, original bytes, final geometry ownership and limited qualification.
 * @evidence contracts/modeling.md#part-identity-and-grouping The fixed subcutaneousAdipose/adipose identity owns the existing layer constructor's disjoint boundary members.
 * @evidenceExclude contracts/modeling.md#parameter-channels The existing field and body document own the values.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The layer constructor determines the native boundary population.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The addressed field and exterior own metre coordinates and native incidence.
 * @evidence contracts/modeling.md#shared-boundaries One native field and final exterior supply the shared dermal/fascial/rim calculation rather than an independent voxel boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Body and person consumers observe the generated boundary.
 * @evidence contracts/anatomy.md#anatomical-source The addressed field's original anchors and qualification retain measured versus authored quantities and their population limits.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing offset observations and document admission remain authoritative.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline registration exposes no personal vertices or tissue values.
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
