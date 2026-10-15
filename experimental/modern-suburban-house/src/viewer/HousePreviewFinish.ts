
/** Display finish of a house part in the viewer. */
export interface HousePreviewFinish {
  /** Finish identity. */
  id: string;
  /** sRGB colour as a 24-bit number. */
  color: number;
  /** Surface roughness from 0 to 1. */
  roughness: number;
  /** Metalness from 0 to 1. */
  metalness: number;
  /** Tile file and world metres per repeat. Missing maps use color/roughness. */
  texture?: { file: string; metres: readonly [number, number]; projection: "wall" | "ground" | "roof" | "local"; };
}
