/**
 * An exterior metric target or an observed scalar with acquisition context.
 *
 * The owning landmark field decides whether this is a girth, straight distance or skin-surface path length. A fictional target has no invented measurement device or scan. Observation uncertainty is omitted when unknown rather than set to zero.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union separates desired exterior size from observed acquisition context using metric scalars.
 * @evidence contracts/common.md#clear-and-simple-design Generic method/posture parameters let the owning landmark narrow protocols without duplicating the observation structure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown uncertainty is omitted rather than fabricated as zero; fictional targets carry no fake acquisition.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify metre units, device/protocol ownership, posture and unknown uncertainty semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Exterior scalar typing runs no girth integration or landmark distance algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The surface-dimension union has no completed exterior measurement work to cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Surface observation records own scalar metadata rather than scan bytes or device handles.
 * @author Samchon
 */
export type AutoMovieHumanBodySurfaceDimension<
  Method extends string,
  Posture extends "standing" | "seated" | "supine" =
    | "standing"
    | "seated"
    | "supine",
> =
  | {
      /** Distinguishes a desired exterior size from an acquisition. */
      readonly kind: "target";

      /** Exterior straight distance, surface path length or girth in metres, interpreted by its owning landmark. */
      readonly metres: number;
    }
  | {
      /** Distinguishes a desired exterior size from an acquisition. */
      readonly kind: "observed";

      /** Exterior straight distance, surface path length or girth in metres, interpreted by its owning landmark. */
      readonly metres: number;

      /** Device/protocol identity permitted by the owning exterior measurement. */
      readonly method: Method;

      /** Body position when the exterior scalar was observed. */
      readonly acquisitionPosture: Posture;

      /** Reported measurement uncertainty in metres; omission means unknown. */
      readonly uncertaintyMetres?: number;
    };
