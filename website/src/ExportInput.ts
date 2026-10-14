import type { AncientSource } from "./AncientSource";
import type { ModernSource } from "./ModernSource";
import type { FutureSource } from "./FutureSource";

/**
 * Building identity paired with that production's native camera transport; the exporter retains the supplied native object.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union pairs each first-party producer with the camera projection that exportTourData reads; the structural source types describe only fields needed by the exporter.
 * @evidence contracts/common.md#clear-and-simple-design Narrowing the building field chooses one source shape without casts shared across unrelated production representations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every union arm names a shipped producer; it contains no alternative fixture or expected output transport.
 * @evidence contracts/common.md#meaningful-documentation The comment states the pairing and native object retention; the three arms expose their actual producer types.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input union performs no projection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no cache or deduplication policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no native resources or tasks.
 */
export type ExportInput =
  | {
      /** Select the temple lens and observation projection. */
      building: "ancient";

      /** Borrow the temple's complete native transport with the camera fields shown here. */
      native: AncientSource;
    }
  | {
      /** Select the suburban-house starting camera and room projection. */
      building: "modern";

      /** Borrow the house's complete native transport with its camera fields. */
      native: ModernSource;
    }
  | {
      /** Select the citizen-house station projection. */
      building: "future";

      /** Borrow the citizen-house transport with its station fields. */
      native: FutureSource;
    };
