/**
 * Explicit collision primitive admitted for an external model and materialized as its engine proxy geometry.
 *
 * @evidence contracts/common.md#principled-implementation Recipe discrimination binds capsule radius and cylindrical height or box full extents to the exact primitive parameters; productionAssetInventory requires finite positive dimensions rather than inferring collision from appearance bytes.
 * @evidence contracts/common.md#clear-and-simple-design Two closed recipe arms carry only the dimensions their primitive consumes, and external asset resolution and runtime model materialization remain outside this data contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered collision geometry is the explicit engine proxy; no missing proxy falls back to a guessed visual-mesh envelope. Capsule tessellation currently uses a cylinder, a separate documented geometry limitation.
 * @evidence contracts/common.md#meaningful-documentation Defines explicit proxy ownership, supported recipes, meter units, full box extents and the capsule's cylindrical-body height.
 * @author Samchon
 */
export type IAutoMovieGeneratedCollisionProxy =
  | {
      /** Capsule used by deterministic collision and mass queries. */
      recipe: "capsule-v1";

      /** Positive radius and cylindrical-body height in production meters. */
      parameters: {
        /** Capsule and cylindrical-body radius in meters. */
        radius: number;

        /** Cylindrical-body height excluding spherical caps, in meters. */
        height: number;
      };
    }
  | {
      /** Axis-aligned box used by deterministic collision and mass queries. */
      recipe: "box-v1";

      /** Positive full extents in production meters. */
      parameters: {
        /** Full local-X extent in meters. */
        width: number;

        /** Full local-Y extent in meters. */
        height: number;

        /** Full local-Z extent in meters. */
        depth: number;
      };
    };
