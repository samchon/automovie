

/**
 * House starting camera and authored observations consumed by the exporter, with world positions in meters and vertical lens angles in degrees.
 *
 * @author Samchon
 */
export interface ModernSource {
  /** Authored starting world pose, vertical lens degrees and clip distances in meters. */
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fovDeg: number;
    near: number;
    far: number;
  };

  /** Authored world poses and lens settings for the house's observation navigator. */
  observations: {
    id: string;
    position: [number, number, number];
    target: [number, number, number];
    fovDeg: number;
    near: number;
  }[];
}
