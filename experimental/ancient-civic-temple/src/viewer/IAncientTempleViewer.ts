/** Existing live temple controls retain their current source and GPU observation qualification. */
export interface IAncientTempleViewer {
  /** Whether the current payload is loaded and drawn. */
  ready: boolean;
  /** Name of the GPU renderer. */
  renderer: string;
  /** Last failure message, or null. */
  error: string | null;
  /** Identities of the loaded payload's observation stations. */
  stations: string[];
  /** Number of pieces in the section shown, or null without one. */
  sectionPieces: number | null;
  /** Axis, offset and side of the section shown, or null without one. */
  sectionKey: string | null;
  /** Show station `id`; false when it does not exist or has no pose. */
  select(id: string): boolean;
  /**
   * Place the camera at `position` looking at `target`, both `[x, y, z]`, leaving station mode;
   * false when either is not three numbers.
   */
  look(position: number[], target: number[]): boolean;
}
