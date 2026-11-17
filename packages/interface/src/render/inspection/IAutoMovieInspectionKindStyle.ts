/**
 * Legend text and final sRGB integer color for one mark kind. resolveAutoMovieInspectionColors keys this record by kind in a Map and checks color ownership across kinds and reserved uses; numeric color admission belongs to mark/request producers.
 *
 * @evidence contracts/development/design.md#principled-representation Legend text and final sRGB integer color for one mark kind. resolveAutoMovieInspectionColors keys this record by kind in a Map and checks color ownership across kinds and reserved uses; numeric color admission belongs to mark/request producers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieInspectionColors exchanges label, color; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Legend text and final sRGB integer color for one mark kind. resolveAutoMovieInspectionColors keys this record by kind in a Map and checks color ownership across kinds and reserved uses; numeric color admission belongs to mark/request producers.
 * @evidence contracts/development/common.md#meaningful-documentation Legend text and final sRGB integer color for one mark kind. resolveAutoMovieInspectionColors keys this record by kind in a Map and checks color ownership across kinds and reserved uses; numeric color admission belongs to mark/request producers. The prose and members document how resolveAutoMovieInspectionColors interprets and admits these values.
 */
export interface IAutoMovieInspectionKindStyle {
  /** Legend text declared by marks of this kind. */
  label: string;
  /** Final packed sRGB RGB integer after ordered recoloring. */
  color: number;
}
