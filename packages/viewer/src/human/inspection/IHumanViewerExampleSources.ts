import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IReadHumanViewerStandardPeopleProps } from "./IReadHumanViewerStandardPeopleProps.js";
import type { IReadHumanViewerSubjectPeopleProps } from "./IReadHumanViewerSubjectPeopleProps.js";

/**
 * Application-owned example inputs and document factories. The inspection service supplies current basis and source authority, while the application chooses every named example and its parameters; the library owns neither.
 *
 * @evidence contracts/common.md#principled-implementation The Playground supplies named example parameter documents while Viewer supplies current source/basis authority and Human owns their numerical admission.
 * @evidence contracts/common.md#clear-and-simple-design Keeps finished example content in the application, with file paths and three factories borrowed by the generic catalogue service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Example ids never bypass ordinary admission; parameter factories supply no fitted vertices and photograph camera metadata does not enter numerical cache keys.
 * @evidence contracts/common.md#meaningful-documentation Documents optional generation subjects, application-owned body/face inputs and observation cameras, with explicit basis arguments for each factory.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bindings perform no parse/build; their catalogue/application producers read files and compose/hash input-sized parameter records.
 * @evidence contracts/performance.md#reuse-equivalent-work Factories use supplied current basis/source dependencies; source memo keys include reference parameters, and document names alone cannot establish numerical equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The source owner retains bindings/current catalogue until replacement; factories return parameter data without acquiring workers, GPU residents or reference image bytes.
 *
 * @author Samchon
 */
export interface IHumanViewerExampleSources {
  /** Application-authored face document array. */
  documentsFile: string;

  /**
   * Application-authored people on the published generation; absent means
   * the subject people derived from the face documents.
   */
  subjectPeopleFile?: string;

  /** Application-authored body parameter sets. */
  bodyExamplesFile: string;

  /**
   * Application-authored observation camera poses, read only as display metadata.
   */
  cameraPosesFile: string;

  /**
   * Create the application's reference document on the supplied actual face basis.
   *
   * @evidence contracts/common.md#principled-implementation Creates the application's connected neutral reference parameter document on the supplied actual face opening id.
   * @evidence contracts/common.md#clear-and-simple-design Leaves the example's identity/empty shape-expression choices in Playground instead of embedding them in the Viewer library.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Constructing empty parameter maps does not certify anatomical or visual validity; the numerical owner still admits the document.
   * @evidence contracts/common.md#meaningful-documentation The basis argument supplies id and byte authority, though the reference document names its id and downstream keys include the digest.
   * @evidence contracts/performance.md#efficient-algorithms The current application factory creates a constant-size record and two independent empty maps; subsequent numerical geometry is outside this callback.
   * @evidence contracts/performance.md#reuse-equivalent-work Fresh maps keep independently editable examples separate; catalogue face memo equality also includes serialized reference parameters.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned parameter objects live with the catalogue and retain no worker/frame; factory inputs are borrowed and no native resource is acquired.
   */
  reference: (face: IHumanViewerBasisIdentity) => IHumanViewerReferenceFaceDocument;

  /**
   * Create the application's standard person examples with the supplied published generation.
   *
   * @evidence contracts/common.md#principled-implementation Composes the application's reference/standard body states on the supplied published one-skin generation and canonical person token/key inputs.
   * @evidence contracts/common.md#clear-and-simple-design Keeps example selection and linked-population parameter composition in Playground while Human owns whole-person construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Named states remain ordinary admitted documents, and missing generation cannot be repaired by inventing a legacy basis fallback.
   * @evidence contracts/common.md#meaningful-documentation The props carry actual generation view ids/digests, reference face, authored body examples and numerical source digests.
   * @evidence contracts/performance.md#efficient-algorithms For n examples and d serialized document characters, composition/hash costs O(n+d) and returns n+1 entries, sharing face references.
   * @evidence contracts/performance.md#reuse-equivalent-work Downstream keys include full composed parameters, both view digests and face/body/person sources; this factory retains no result cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Catalogue entries own ordinary parameter wrappers/references until publication replacement, with no numerical or GPU task started here.
   */
  standardPeople: (props: IReadHumanViewerStandardPeopleProps) => IHumanViewerCatalogueEntry[];

  /**
   * Create the application's subject examples with the supplied legacy paired bases.
   *
   * @evidence contracts/common.md#principled-implementation Pairs supplied subject face parameters with neutral body parameters on the legacy published face/body bases and canonical person keys.
   * @evidence contracts/common.md#clear-and-simple-design Keeps macro-compatible subject example composition with the application rather than migrating numerical bases inside the catalogue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied face JSON stays unexamined here and subject names cannot bypass Person admission or create clinical evidence.
   * @evidence contracts/common.md#meaningful-documentation The props name both actual published basis ids/digests and all numerical sources; generation-subject files are a distinct preferred path when available.
   * @evidence contracts/performance.md#efficient-algorithms Mapping n subjects plus serializing/hashing d composed characters costs O(n+d), without deep-copying the supplied face documents.
   * @evidence contracts/performance.md#reuse-equivalent-work Document, both basis digests and all three source digests decide downstream reuse; this callback owns no local cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned wrappers retain supplied face references until catalogue replacement and acquire neither worker, numerical geometry nor native renderer.
   */
  subjectPeople: (props: IReadHumanViewerSubjectPeopleProps) => IHumanViewerCatalogueEntry[];
}
