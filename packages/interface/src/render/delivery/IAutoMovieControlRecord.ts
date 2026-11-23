import type { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass.js";
import type { IAutoMovieSemanticMaskEntry } from "../IAutoMovieSemanticMaskEntry.js";
import type { IAutoMovieDeliveryContentAudit } from "./IAutoMovieDeliveryContentAudit.js";

/**
 * The record `automovie render --passes` writes as `controls/record.json`
 * beside a film's control frames: which film and attempt drew them, each
 * channel's convention, and the SHA-256 of every frame file.
 *
 * A generation request names this one file as its conditioning input, and the
 * media manifest records its SHA-256; that digest seals every frame digest
 * listed here, so a request conditioned on hundreds of frames lists one file.
 * The record describes the frames beside it only when the render report beside
 * the film has `status` `published` and its `source.sha256` equals both the
 * film's SHA-256 and this record's `film.sha256`: a blocked or failed attempt
 * installs its own report but keeps the previous film and `controls/`.
 *
 * Every digest is 64 lowercase hexadecimal characters with no prefix, the form
 * the report's `source.sha256` takes. The pair (`pass`, `index`) is unique
 * within one record.
 */
export interface IAutoMovieControlRecord {
  /** The film the channels were drawn from, the render's subject name. */
  film: string;

  /**
   * The source revision of the render attempt, as its report records it: a
   * commit, the commit with `+changes`, or `unrecorded`.
   */
  revision: string;

  /** The drawing backend of the attempt, as its report records it. */
  backend: string;

  /** The frame clock and raster every channel shares with the film. */
  clock: IAutoMovieControlRecord.IClock;

  /**
   * SHA-256 of the `film.mp4` drawn in the same attempt, equal to the report's
   * `source.sha256`.
   */
  filmSha256: string;

  /** One entry per requested pass, in request order. */
  channels: IAutoMovieControlRecord.IChannel[];
}

/** Companion types of the control record. */
export namespace IAutoMovieControlRecord {
  /** The output frame grid of the film and its channels. */
  export interface IClock {
    /** Exact frames per second as a ratio, the rate the film was encoded at. */
    frameRate: IAutoMovieDeliveryContentAudit.Ratio;

    /** Frames of each channel, the film's frame count. */
    frameCount: number;

    /** Raster width in pixels. */
    width: number;

    /** Raster height in pixels. */
    height: number;
  }

  /** One pass's frames, as written under `controls/`. */
  export interface IChannel {
    /** The guide pass drawn; never `beauty`, which is the film itself. */
    pass: Exclude<AutoMovieGuidePass, "beauty">;

    /** What the pass's pixel values mean, as the pass drew them. */
    convention: Convention;

    /**
     * FFmpeg-style input pattern of the frame files, relative to the record's
     * folder, such as `frame_%05d.depth.png`.
     */
    inputPattern: string;

    /** Frames written, equal to the clock's frame count. */
    frameCount: number;

    /**
     * SHA-256 of the frame digests in index order, each written as its 64
     * hexadecimal characters followed by a line feed; one value that changes
     * when any frame does.
     */
    sequenceSha256: string;

    /** Every frame, in index order. */
    frames: IFrame[];
  }

  /** One frame file of a channel. */
  export interface IFrame {
    /**
     * Output frame index from 0, shared with the film's frame at the same
     * index.
     */
    index: number;

    /** Output second the frame was drawn at, `index / fps`. */
    seconds: number;

    /** SHA-256 of the PNG file's bytes. */
    sha256: string;
  }

  /**
   * The pixel convention of one channel, tagged by `pass` and `kind`, so a
   * later convention is a new variant beside the one that ships.
   */
  export type Convention =
    | IDepthLinear
    | IMaskSemantic
    | IMaskPositional
    | INormalCamera
    | IOutlineHull
    | IPoseSegments
    | IAlbedoBaseColour
    | IGraphicsPlate;

  /**
   * Depth as grey linear in camera distance: `clamp(1 - viewZ / rangeMetres, 0,
   * 1)`, near bright, black at and beyond the range and for the background.
   */
  export interface IDepthLinear {
    /** The pass. */
    pass: "depth";

    /** Linear normalization over a fixed metric range. */
    kind: "linear";

    /** Camera-space distance in metres that maps to black. */
    rangeMetres: number;
  }

  /**
   * A segmentation mask whose colours are the attached semantic palette's, so a
   * colour names an entity across rebuilds.
   */
  export interface IMaskSemantic {
    /** The pass. */
    pass: "mask";

    /** Colours from a semantic palette. */
    kind: "semantic";

    /** The palette's digest, which seals its entries. */
    digest: string;

    /**
     * The palette's entries, each with its exact colour; black is the
     * background.
     */
    entries: IAutoMovieSemanticMaskEntry[];
  }

  /**
   * A segmentation mask coloured by top-level scene child position, readable as
   * coverage and silhouette but not as identity.
   */
  export interface IMaskPositional {
    /** The pass. */
    pass: "mask";

    /** Colours by child index. */
    kind: "positional";
  }

  /**
   * Unit camera-space normals written as `rgb = n * 0.5 + 0.5`, +x right, +y up
   * and +z toward the camera, with no colour conversion; the background is
   * black.
   */
  export interface INormalCamera {
    /** The pass. */
    pass: "normal";

    /** Camera-space normals, half-offset into RGB. */
    kind: "camera";
  }

  /**
   * White contours of back-face shells extruded along vertex normals over black
   * fills, on black.
   */
  export interface IOutlineHull {
    /** The pass. */
    pass: "outline";

    /** Inverted-hull contours. */
    kind: "inverted-hull";

    /**
     * Model-space extrusion of the shells; object scale and projection change
     * the drawn line weight.
     */
    edgeWidth: number;
  }

  /**
   * Every bone-to-child segment of the scene's skeletons drawn as a line over
   * black, meshes hidden.
   */
  export interface IPoseSegments {
    /** The pass. */
    pass: "pose";

    /** Bone segments. */
    kind: "bone-segments";
  }

  /**
   * Each surface's unlit base colour, factor times base-colour texture, encoded
   * to sRGB once, on black.
   */
  export interface IAlbedoBaseColour {
    /** The pass. */
    pass: "albedo";

    /** Unlit base colour. */
    kind: "base-colour";
  }

  /**
   * The surface graphics alone as the beauty pass draws them, every other mesh
   * held out by depth, written as RGBA with straight alpha: the compositing
   * plate for legible screens and lettering.
   */
  export interface IGraphicsPlate {
    /** The pass. */
    pass: "graphics";

    /** Straight-alpha colour over a transparent background. */
    kind: "straight-alpha";
  }
}
