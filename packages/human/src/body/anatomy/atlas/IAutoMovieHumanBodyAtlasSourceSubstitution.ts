/**
 * The acquired file a part was named for, when its geometry comes from another.
 *
 * An atlas is one asymmetric individual. An offline producer may author a
 * part from its contralateral member reflected across the sagittal plane, so
 * the left member's geometry is the right member's bytes. The enclosing
 * source record then describes those consumed bytes, and this record keeps
 * the file the part's own identity names: its location, digest and organ
 * identifier stay on the rights chain as a receipt although no vertex of it
 * is read. Without this record a part named for the left organ would cite
 * the right organ's file with nothing saying why.
 *
 * The reflection is an authoring choice. It asserts neither that the
 * individual was symmetric nor that a reflected organ is an anatomically
 * valid contralateral organ.
 *
 * @evidence contracts/common.md#principled-implementation The consumed bytes and the replaced nominal bytes are separate identities, so each keeps its own digest.
 * @evidence contracts/common.md#clear-and-simple-design One optional record on the source receipt; a part authored from its own file omits it.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts This record transports provenance.
 * @evidence contracts/common.md#meaningful-documentation States which file is consumed, which is only a receipt, and what the reflection does not claim.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The enclosing resource names the part.
 * @evidenceExclude contracts/modeling.md#parameter-channels No authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No emitted geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The registered resource owns coordinates and the producer owns the reflection plane.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No constructed boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The resource consumer observes the surface.
 * @evidence contracts/anatomy.md#anatomical-source Keeps the acquired file of the named organ distinct from the reflected contralateral source and claims no symmetry of the individual.
 * @evidenceExclude contracts/anatomy.md#permitted-range No physiological admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline source, never personal mesh input.
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
