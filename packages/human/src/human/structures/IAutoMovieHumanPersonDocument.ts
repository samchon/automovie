import type { IAutoMovieHumanBodyBasisDocument } from "../../body/structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadShape } from "./IAutoMovieHumanPersonHeadShape";

/**
 * One person: a face document and a body document, each against its own
 * immutable basis, evaluated together and joined at the neck.
 *
 * The two documents keep their own vocabularies and their own basis
 * revisions, so a person document is not a third coordinate system; it is the
 * pairing, plus the relations that make the pair one person:
 *
 * - The skin colour is one value. The body colours its skin by anatomical
 *   site from the cheek albedo the face wears, so the person's cheek is the
 *   face's resolved skin base colour and the body document must not state its
 *   own (`skinColour` is derived, and a body document that carries it is
 *   refused, because two values for one person's colour would disagree).
 * - Age and sex can be stated once (`population`), which makes the head the age
 *   and sex of the body.
 * - A legacy pair meets at its source-defined neck seam. A registered source
 *   generation owns one shared skin across that partition, including head and
 *   cervical traits. The body's pose carries the face on its `head` joint.
 * - `headShape` belongs to the person: source-unit exterior differences may
 *   affect both partitions. Its registered body channel supplies the one
 *   endpoint owner; neither inner document independently reconstructs it.
 *
 * Identities are the person's own; the inner documents keep theirs. The
 * document holds no photograph, mesh or image. Anatomy-specific values remain
 * in the inner documents; shared source-head differences stay in headShape.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonDocument {
  /** Stable identity of this person. */
  id: string;

  /** Display name, independent of either basis. */
  name: string;

  /** The face, against the face basis the person builder was compiled with. */
  face: IAutoMovieHumanFaceBasisDocument;

  /** The body, against the body basis the person builder was compiled with, with no `skinColour` of its own. */
  body: IAutoMovieHumanBodyBasisDocument;

  /**
   * Source-neutral anatomical exterior differences in registered mm/degrees.
   * Each present field, including zero, needs the shared source's one actual
   * body-channel registration. This saved request supplies no personal mesh
   * and remains separate from clinical observations and raw shape weights.
   */
  headShape?: IAutoMovieHumanPersonHeadShape;

  /**
   * How the person's age and sex are stated. Omission keeps the two documents
   * independent: the face takes whatever `globalAgeStructure` and
   * `globalSexualDimorphism` it states and the body whatever `macroAge` and
   * `macroGender` it states, which can make a child's body carry an adult's
   * head. `"linked"` states them once, in the body (its macros are the
   * person's), and derives the face's two axes from them by the shared macro
   * scale (`deriveHumanPersonFace`), so a face document that states either is
   * refused rather than overridden.
   */
  population?: "linked";
}
