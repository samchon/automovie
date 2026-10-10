/** Existing live temple controls retain their current source and GPU observation qualification. */
export interface IAncientTempleViewer {
  ready: boolean;
  renderer: string;
  error: string | null;
  stations: string[];
  sectionPieces: number | null;
  sectionKey: string | null;
  select(id: string): boolean;
  look(position: number[], target: number[]): boolean;
}
