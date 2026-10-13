/**
 * One named part of the displayed human, with the meshes that draw it and the
 * document that shows it.
 *
 * `meshes` are exact names the viewport reports through `/parts`, which the
 * anatomical `label` stands for. The gallery page opens each bookmark
 * isolated, and marks one whose mesh the document no longer reports, so a
 * renamed mesh shows up at once instead of as a silent blank frame.
 *
 * @evidence contracts/common.md#principled-implementation Exact reported mesh names bind an isolated bookmark to its supplied document, and a missing name remains an explicit gallery observation.
 * @evidence contracts/common.md#clear-and-simple-design One bookmark record owns label, region, document identity and the mesh group displayed together; rendering remains with the viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A human-readable anatomical label cannot supply nonexistent geometry; the gallery checks the supplied mesh identities rather than inventing a part.
 * @evidence contracts/common.md#meaningful-documentation States identity and grouping fields, exact mesh matching and the visible consequence of renamed or absent meshes.
 * @author Samchon
 */
export interface IHumanViewerPartBookmark {
  /** Stable identity of the bookmark. */
  id: string;

  /** Heading the bookmark is listed under. */
  region: string;

  /** Anatomical name. */
  label: string;

  /** Published document that carries these meshes. */
  doc: string;

  /** Exact mesh names, isolated together. */
  meshes: string[];
}
