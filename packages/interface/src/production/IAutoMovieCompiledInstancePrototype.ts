import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";

/**
 * One engine-compiled reusable prototype in a general instance set. Weight participates in seeded per-slot selection; projectionRadius is an unscaled source-radius estimate rather than a certified geometry bound.
 *
 * @evidence contracts/common.md#principled-implementation Stable prototype identity and positive weight define seeded choices; compiled tiers and the maximum applicable radius estimate supply LOD/culling inputs. Missing estimates use base then 0.5m with a 0.01m floor, without proving root-centered model enclosure.
 * @evidence contracts/common.md#clear-and-simple-design Prototype-specific model, weight, tiers and radius live once in the compiled table instead of repeating model definitions and selection parameters on each generated slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototype selection uses the declared weighted seeded law rather than instance labels, and per-slot scale must act on the stored source radius rather than silently treating every instance as unit sized.
 * @evidence contracts/common.md#meaningful-documentation Defines engine compilation, positive deterministic weight, LOD ordering, model group ownership and the radius's metre units before slot scaling.
 */
export interface IAutoMovieCompiledInstancePrototype {
  /** Stable source prototype id. */
  id: string;

  /** Model group id the source prototype names. */
  model: string;

  /** Positive deterministic selection weight. */
  weight: number;

  /** Ordered automatic LOD representations for this prototype. */
  lod: IAutoMovieCompiledFormationLod[];

  /** Supplied or fallback source-radius estimate in metres before slot scaling; model root offset and complete geometry coverage are separate producer premises. */
  projectionRadius: number;
}
