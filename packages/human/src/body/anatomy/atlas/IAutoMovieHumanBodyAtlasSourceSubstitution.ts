/**
 * The acquired file a part was named for, when its geometry comes from another.
 *
 * An atlas is one asymmetric individual. An offline producer may author a part from its contralateral member reflected across the sagittal plane, so the left member's geometry is the right member's bytes. The enclosing source record then describes those consumed bytes, and this record keeps the file the part's own identity names: its location, digest and organ identifier stay on the rights chain as a receipt although no vertex of it is read. Without this record a part named for the left organ would cite the right organ's file with nothing saying why.
 *
 * The reflection is an authoring choice. It asserts neither that the individual was symmetric nor that a reflected organ is an anatomically valid contralateral organ.
 *
 * @evidence contracts/common.md#principled-implementation A sagittal-mirror receipt distinguishes consumed contralateral geometry from the file/digest/organ the part's own name originally identified.
 * @evidence contracts/common.md#clear-and-simple-design The nested receipt preserves unused named-file rights correspondence without claiming its vertices contributed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reflection certifies neither source symmetry nor anatomical validity of the opposite organ.
 * @evidence contracts/common.md#meaningful-documentation Comments explain operation meaning, unused named-file receipt and unresolved substitution limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The substitution receipt performs no sagittal coordinate reflection itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Replaced-file provenance is bookkeeping rather than cached geometry-generation work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The receipt owns no unused source mesh, mirror workspace or download resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasSourceSubstitution {
  /** How the consumed bytes became this part's geometry. */
  operation: "sagittalMirror";

  /** Direct download location of the file this part's identity names. */
  replacedUri: string;

  /** SHA-256 of that named file, retained as a receipt and not consumed. */
  replacedSha256: string;

  /** Original organ identifier of that named file. */
  replacedAnatomicalIdentity: string;

  /** Why the named file was set aside and what the substitution leaves unverified. */
  account: string;
}
