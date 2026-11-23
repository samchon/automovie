import type { AutoMovieProductionPngColor } from "./AutoMovieProductionPngColor";

/** Parser-observed PNG picture facts after datastream framing and image decode. */
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
    | {
        /** No non-square physical aspect declaration. */
        kind: "square";
      }
    | {
        /** Parsed pHYs physical aspect declaration. */
        kind: "explicit";

        /** Horizontal pixels per declared unit. */
        x: number;

        /** Vertical pixels per declared unit. */
        y: number;

        /** Zero means unspecified unit, one means meters. */
        unit: 0 | 1;
      };

  /** Presence of orientation metadata that could transform presentation. */
  orientation: "upright" | "metadata-present";
}
