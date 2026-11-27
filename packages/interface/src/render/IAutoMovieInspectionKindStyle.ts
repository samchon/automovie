/**
 * Legend text and final sRGB integer color for one mark kind.
 * resolveAutoMovieInspectionColors keys this record by kind in a Map and checks
 * color ownership across kinds and reserved uses; numeric color admission
 * belongs to mark/request producers.
 */
export interface IAutoMovieInspectionKindStyle {
  /** Legend text declared by marks of this kind. */
  label: string;
  /** Final packed sRGB RGB integer after ordered recoloring. */
  color: number;
}
