/**
 * The product runtime input the resident page forwards to the numerical worker: the original document text, explicit construction or static encoding operation and whether the face bakes ambient occlusion.
 *
 * @evidence contracts/common.md#principled-implementation Carries original document text and the existing preview/construct/exportConstruction/admit operation plus optional face AO to the unchanged domain runtime.
 * @evidence contracts/common.md#clear-and-simple-design Keeps product numerical input independent of session startup witness and optional preview persistence authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Person alone supports construction export; construct/export bypass preview codec and unsupported operations refuse at ingress rather than silently switching.
 * @evidence contracts/common.md#meaningful-documentation Documents absent operation as preview, serialized schema admission and AO purpose without specifying hidden vertices or photograph-derived anatomy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input performs no parsing; domain admission/build/encoding costs follow document, basis and produced geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Preview reuse additionally requires actual selected document JSON, basis/source key and AO mode; construct/export are effectful owner paths outside preview cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The request owner retains text until reply/cancellation, with no independent size cap here and no renderer/model handle embedded.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalInput {
  /** The document as serialized text, admitted by the runtime. */
  document: string;

  /**
   * Explicit product operation; construction encoding is supported only for Person. Absent means admitted preview.
   */
  operation?: "preview" | "construct" | "exportConstruction" | "admit";

  /** Whether the face producer bakes ambient occlusion. */
  occlusion?: boolean;
}
