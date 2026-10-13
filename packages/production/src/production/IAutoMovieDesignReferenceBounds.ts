/**
 * The source-space extent of one design reference, or an honest statement that
 * this host cannot measure it.
 *
 * The admitted PDF profile does not read page boxes, and the DXF profile
 * does not sweep entity extents. Reporting `unsupported` keeps the declared
 * frame unverified rather than replacing it with a guessed measurement.
 *
 * @evidence requirements/external-inputs/media-families-and-declared-facts.md#external-media-image-video Carries the source-space extent reported by the parsed image container rather than a filename-derived size.
 * @evidence requirements/external-inputs/media-families-and-declared-facts.md#external-media-spatial-data Separates a measured drawing extent from an explicit unsupported fact without assigning a scene coordinate frame.
 * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-image-video-inspection Types the parsed raster extent that the design-reference inspector returns.
 * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-design-drawing-inspection Preserves the drawing inspector's measured-or-unsupported source-space extent boundary.
 * @author Samchon
 */
export type IAutoMovieDesignReferenceBounds =
  | {
      /** The container states its own extent and this host read it. */
      status: "measured";

      /** Extent along the source x axis, in the container's own units. */
      width: number;

      /** Extent along the source y axis, in the container's own units. */
      height: number;
    }
  | {
      /** This host cannot derive the extent from these bytes. */
      status: "unsupported";

      /** What is missing, stated rather than approximated. */
      reason: string;
    };
