/**
 * The trunk's landmarks, left side canonical, calibration millimetres in the
 * body frame: heights of the stations the tapes and courses are taken at, the
 * points the shoulder and the breast stand on, and the column's axis for the
 * skeleton. Placed from the inputs before any skin.
 */
export interface IAutoMovieHumanTrunkLandmarks {
  /** Crotch height. */
  crotch: number;

  /** Cervicale height (back neck point, ISO 8559-1 3.1.6). */
  cervicale: number;

  /** Buttock point height: the hip tape's site. */
  buttock: number;

  /** Iliocristale height. */
  iliocristale: number;

  /** Omphalion height. */
  omphalion: number;

  /** Natural waist height. */
  waist: number;

  /** Inframammary fold height: the underbust tape's site. */
  fold: number;

  /** Bust point height: the chest tape's site. */
  bust: number;

  /** Axilla height: the trunk's top layer. */
  axilla: number;

  /** Shoulder point (acromion projected to the skin, ISO 8559-1 3.1.1), `[x, y, z]`. */
  shoulder: [number, number, number];

  /** Glenohumeral centre, `[x, y, z]`. */
  glenohumeral: [number, number, number];

  /** Bust point, `[x, y, z]`. */
  bustPoint: [number, number, number];

  /**
   * The column's axis on the midline, `[height, forward place]` from the
   * crotch to the neck's ring every few millimetres: the middle of each
   * section's depth, where the skeleton stands the vertebral column's
   * joints (a convention: the vertebral bodies lie near the trunk's sagittal
   * middle, Gray 1918).
   */
  axis: [number, number][];
}
