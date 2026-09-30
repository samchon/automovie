/**
 * One named part of the displayed human, with the meshes that draw it and the
 * document that shows it.
 *
 * `meshes` are exact names the viewport reports through `/parts`, which the
 * anatomical `label` stands for. The gallery page opens each bookmark
 * isolated, and marks one whose mesh the document no longer reports, so a
 * renamed mesh shows up at once instead of as a silent blank frame.
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
