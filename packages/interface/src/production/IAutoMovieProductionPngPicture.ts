import { AutoMovieProductionPngColor } from "./AutoMovieProductionPngColor";

/**
 * Parser-observed PNG picture facts after datastream framing and image decode.
 *
 * @evidence contracts/common.md#principled-implementation probeProductionPngPicture walks complete PNG chunks and decodes image data, then reports IHDR, color declaration, physical pixel aspect and EXIF-presence facts; cICP and mDCV color chunks are currently unread.
 * @evidence contracts/common.md#clear-and-simple-design The record describes observed picture identity while delivery acceptance belongs to assertProductionPngPicture, preserving the distinction between a valid PNG and the supported delivery profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contradictory or repeated color declarations refuse; EXIF presence does not claim decoded orientation, and unidentified color remains explicit instead of being assumed sRGB.
 * @evidence contracts/common.md#meaningful-documentation Defines raster precision, channel and alpha form, scan mode, color identity, pixel-aspect metadata and the limited orientation observation.
 * @author Samchon
 */
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
