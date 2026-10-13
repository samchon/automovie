/**
 * One occurrence's sampling of its material, in the PBR record's own UV
 * transform.
 */
export interface IAutoMoviePatternTextureTransform {
  /** The occurrence this samples for. */
  id: string;
  /** Normalized UV offset. */
  offset: {
    /** Offset along the texture's own U axis. */
    x: number;
    /** Offset along the texture's own V axis. */
    y: number;
  };
  /** Normalized UV scale; a negative `x` is the mirrored piece. */
  scale: {
    /** Scale along the texture's own U axis. */
    x: number;
    /** Scale along the texture's own V axis. */
    y: number;
  };
  /** UV rotation in degrees, within `[-180, 180]`. */
  rotationDeg: number;
}
