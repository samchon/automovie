/**
 * Explicit intended collision primitive retained in external-model provenance.
 *
 * @evidence contracts/common.md#principled-implementation Recipe discrimination describes capsule radius/cylindrical height or box full extents as explicit provenance metadata. Finite positive dimensions remain caller premises; the production asset-inventory validator and proxy materializer are retired, so this record creates no engine collision geometry.
 * @evidence contracts/common.md#clear-and-simple-design Two closed recipe arms carry only the dimensions their primitive consumes, and external asset resolution and runtime model materialization remain outside this data contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record declares no visual-mesh inference or substitute proxy. Its presence establishes neither materialization nor physical collision correctness; an explicit host must construct and validate any geometry it adopts.
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
