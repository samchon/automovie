import { AutoMovieProductionPngColor } from "./AutoMovieProductionPngColor";

/** Complete parser-observed PNG picture facts. */
export interface IAutoMovieProductionPngPicture {
  /** Decoded pixel width. */
  width: number;

  /** Decoded pixel height. */
  height: number;

  /** Decoded sample precision. */
  bitDepth: number;

  /** Decoded channel population. */
  color: AutoMovieProductionPngColor;

  /** Decoded alpha relation. */
  alpha: "none" | "straight";

  /** Decoded scan organization. */
  interlace: "none" | "adam7";

  /** Color meaning explicitly carried by the datastream. */
  colorSpace: "srgb" | "icc" | "gamma" | "unidentified";

  /** Implicit or explicit pixel aspect carried by the datastream. */
  pixelAspect:
    | { kind: "square" }
    | { kind: "explicit"; x: number; y: number; unit: 0 | 1 };

  /** Presence of orientation metadata that could transform presentation. */
  orientation: "upright" | "metadata-present";
}
