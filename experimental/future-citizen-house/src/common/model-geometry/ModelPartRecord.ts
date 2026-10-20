/**
 * One authored local part recipe consumed by ModelRepresentation. Bounds are metres and remain caller-owned; a shape token chooses a draft recipe rather than proving design-face or contact completion.
 */
export interface ModelPartRecord {
  /** Local identity copied into the model part and used to find optional state recipe data. */
  id: string;

  /** Primary recipe; optional state data can select a more specific hollow, radial or silhouette path. */
  shape: "box" | "cylinder" | "curved" | "hollow" | "mitered-box";

  /** Authored local X minimum and maximum in metres. */
  x: [number, number];

  /** Authored local Y minimum and maximum in metres. */
  y: [number, number];

  /** Authored local Z minimum and maximum in metres. */
  z: [number, number];
}
