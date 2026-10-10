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
