import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Parser-observed video track, presentation, and picture facts.
 *
 * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-stream-duration-interleave Retains the observed timing, presentation, and coded-stream facts of the final video track read from delivery bytes.
 * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the observed facts compared fieldwise with the selected delivery profile.
 */
export interface IAutoMovieProductionVideoProbe {
  /**
   * Parsed media class.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-supported-combinations Identifies one final video track within the delivered container and codec combination.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the video inventory kind.
   */
  kind: "video";

  /**
   * Parsed container family.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-container-metadata Preserves the final container identity.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed container.
   */
  container: "mp4";

  /**
   * Parsed coded-stream family.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-supported-combinations Preserves the observed video codec of the final stream.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed codec.
   */
  codec: "h264";

  /**
   * Compatibility width projected from coded facts.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-container-metadata Keeps the delivered raster observable.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the compatibility width.
   */
  width: number;

  /**
   * Compatibility height projected from coded facts.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-container-metadata Keeps the delivered raster observable.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the compatibility height.
   */
  height: number;

  /**
   * Parsed presentation runtime.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-stream-synchronization Preserves the final picture duration.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Supplies the picture runtime projection.
   */
  runtimeSeconds: number;

  /**
   * Parsed resident picture-sample count.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-time-boundary-count Preserves the final frame population.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Supplies the parsed frame count.
   */
  frameCount: number;

  /**
   * Compatibility rate projected from the raw sample clock.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-rational-frame-rate Keeps the legacy display rate beside its exact source facts.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Supplies the display-rate projection.
   */
  fps: number;

  /**
   * Canonical reduced rate parsed from the sample clock.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-rational-frame-rate Preserves the exact final picture rate instead of only its decimal projection.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Supplies the canonical parsed numerator and denominator.
   */
  frameRate: IAutoMovieProductionFrameRate;

  /**
   * Parsed major and compatible brands.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-container-metadata Preserves the final container brands.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed brand set.
   */
  brands: { major: string; compatible: string[] };

  /**
   * Parsed coded sample-entry raster.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-container-metadata Preserves coded dimensions independently of display transforms.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the coded raster.
   */
  coded: { width: number; height: number };

  /**
   * Parsed fixed-point track display raster.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-refusal Makes stretch-producing display metadata observable.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the track presentation raster.
   */
  trackDisplay: { width16_16: number; height16_16: number };

  /**
   * Parsed fixed-point track presentation matrix.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-refusal Makes rotation, reflection, and translation observable.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the complete track matrix.
   */
  trackMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  /**
   * Parsed pixel-aspect declaration.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-refusal Makes non-square presentation metadata observable.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the pixel-aspect fact.
   */
  pixelAspect:
    | { kind: "implicit-square" }
    | { kind: "explicit"; hSpacing: number; vSpacing: number };

  /**
   * Raw movie/media clocks and edit list.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-stream-synchronization Preserves the integer presentation timeline.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Supplies the exact presentation clock.
   */
  presentation: {
    movieTimescale: number;
    mediaTimescale: number;
    movieDuration: number;
    mediaDuration: number;
    edits: Array<{
      segmentDuration: number;
      mediaTime: number;
      mediaRateInteger: number;
      mediaRateFraction: number;
    }>;
  };

  /**
   * Raw constant-sample clock and boundary facts.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-time-boundary-count Preserves the actual first, last, and exclusive sample boundary.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Supplies the exact media sample clock.
   */
  samples: {
    count: number;
    duration: number;
    timescale: number;
    firstDts: number;
    lastDts: number;
    firstCts: number;
    lastCts: number;
  };

  /**
   * Container-declared and resolved picture color identity.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-scene-display-picture Preserves the container-declared and resolved display-referred color identity so a conflicting interpretation is refused rather than inferred.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the final color facts.
   */
  color: {
    container:
      | {
          kind: "nclx";
          primaries: number;
          transfer: number;
          matrix: number;
          fullRange: boolean;
        }
      | { kind: "absent" };
    resolved: { kind: "srgb"; source: "container" } | { kind: "absent" };
  };
}
