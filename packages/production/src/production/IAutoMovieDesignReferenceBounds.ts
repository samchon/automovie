/**
 * The source-space extent of one design reference, or an honest statement that
 * this host cannot measure it.
 *
 * The admitted PDF profile does not read page boxes, and the DXF profile
 * does not sweep entity extents. Reporting `unsupported` keeps the declared
 * frame unverified rather than replacing it with a guessed measurement.
 *
 * @evidence contracts/common.md#principled-implementation The discriminant separates parser-read source extents from containers whose extent the admitted parser cannot measure; unsupported bounds carry a reason instead of a fabricated dimension.
 * @evidence contracts/common.md#clear-and-simple-design The design reference inspector returns this one extent decision and the production frame gate compares dimensions only on the measured branch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts PDF and DXF limitations reflect their parser profiles; no asset id or declared expected extent is substituted for a measurement.
 * @evidence contracts/common.md#meaningful-documentation Gives source-axis units, the two outcomes and why the unmeasured containers remain unsupported.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union declares the extent result; container parsing and frame comparisons belong to their owning functions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The value coordinates no computation; one inspection result is read by its reference's frame checks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This result contains only scalar extent data or a reason string and acquires no resource or retained state.
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
