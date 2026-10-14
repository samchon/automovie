/**
 * Crown-to-floor stature desired or measured in an erect standing posture.
 *
 * This is the ordinary body-editor height input, not a body-mesh Y bound or the length of a vertebral chain. A supine CT table length is not the same measurement. Missing uncertainty remains unknown.
 *
 * @evidence contracts/common.md#principled-implementation Standing stature separates target metres from supported erect-standing acquisition provenance and uncertainty.
 * @evidence contracts/common.md#clear-and-simple-design One height input owns crown-to-floor meaning without duplicating rig-chain or mesh-bound dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supine CT table length and mesh Y extent do not silently become an individual's standing stature.
 * @evidence contracts/common.md#meaningful-documentation Members identify metre units, standing methods and omitted uncertainty; prose distinguishes other height proxies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Stature typing executes no body-bound traversal, vertebral integration or surface-scan calibration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The height union retains no evaluated scan measurement needing cross-request equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Stature metadata acquires no stadiometer session, surface scan or body mesh.
 * @author Samchon
 */
export type IAutoMovieHumanBodyStandingStature =
  | {
      /** Desired stature or an actual erect-standing observation. */
      readonly kind: "target";

      /** Crown-to-floor standing stature in metres, excluding supine table length. */
      readonly metres: number;
    }
  | {
      /** Desired stature or an actual erect-standing observation. */
      readonly kind: "observed";

      /** Crown-to-floor standing stature in metres, excluding supine table length. */
      readonly metres: number;

      /** Standing stadiometer or independently qualified surface-scan protocol. */
      readonly method: "stadiometer" | "surface-scan";

      /** Reported absolute stature uncertainty in metres; omission remains unknown. */
      readonly uncertaintyMetres?: number;
    };
