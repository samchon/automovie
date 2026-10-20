/**
 * House starting camera and authored observations consumed by the exporter, with world positions in meters and vertical lens angles in degrees.
 *
 * @evidence contracts/common.md#principled-implementation The starting camera and observations match buildHouseScene's camera transport; the exporter retains their tuple coordinates and uses the starting far clip for room observations.
 * @evidence contracts/common.md#clear-and-simple-design A structural camera-only view leaves source geometry and physical lighting with the native production uploader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observation poses and near clips remain authored values; the website adds labels rather than replacement cameras.
 * @evidence contracts/common.md#meaningful-documentation Members state world meters, vertical lens degrees and the fields supplied by each camera representation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased source shape computes no camera projection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type has no runtime cache or effect coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no native payload, renderer or texture lifetime.
 */
export interface ModernSource {
  /** Authored starting world pose, vertical lens degrees and clip distances in meters. */
  camera: {
    /** Starting eye in world XYZ meters. */
    position: [number, number, number];

    /** Starting aim point in world XYZ meters. */
    target: [number, number, number];

    /** Vertical perspective field of view in degrees. */
    fovDeg: number;

    /** Near clipping distance in meters. */
    near: number;

    /** Far clipping distance shared with room observations, in meters. */
    far: number;
  };

  /** Authored world poses and lens settings for the house's observation navigator. */
  observations: {
    /** Authored observation address, also used for readable grouping. */
    id: string;

    /** World eye in XYZ meters. */
    position: [number, number, number];

    /** World aim point in XYZ meters. */
    target: [number, number, number];

    /** Vertical perspective field of view in degrees. */
    fovDeg: number;

    /** Near clipping distance in meters. */
    near: number;
  }[];
}
