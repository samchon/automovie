import type { IAutoMovieHumanBodySourceRig } from "../articulation/rig/IAutoMovieHumanBodySourceRig";
import type { IAutoMovieHumanBodyExteriorBinding } from "../binding/IAutoMovieHumanBodyExteriorBinding";
import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "./IAutoMovieHumanBodyNativeSubcutaneousSource";

/**
 * One registered anatomical source graph and its coarse tissue geometry.
 *
 * The publisher binds this source generation to one actual body basis and exact
 * supported neutral shape. Every surface uses that graph's common rest frame.
 * Parts remain independently named, and acquired/authored geometry does not
 * change the clinical independently-validated resolution report. The source
 * assembly is consumed by the actual body builder and carried into person and
 * static export; it is not a personal document's mesh cache.
 * A neutral-only assembly is usable before public motion projection exists:
 * its real held source frames/sites and the native unperformed skin share the
 * canonical frame, without asserting anatomical skin/joint registration.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalAssembly {
  /**
   * Explicit held-source replay without motion registration. Neutral-only
   * sources retain their real bone rest and attachment sites while the skin
   * retains its native unperformed rest. Any requested performance refuses.
   * Omission selects the existing fully registered anatomical articulation.
   */
  mode?: "neutral-only";

  /** Immutable source generation shared by geometry, sites and the anatomical rig. */
  generation: string;
  /** Exact body basis revision to which this rest source is registered. */
  basis: string;
  /** Exact source shape; omitted channel weights mean zero. */
  shape: Readonly<Record<string, number>>;
  /**
   * Present when the parts follow the skin as the body is shaped away from
   * the registered shape. The registered shape must then be the basis's
   * neutral, because the displacement is taken from the neutral skin.
   * Omission keeps the exact-shape rule: any other shape refuses.
   */
  exteriorBinding?: IAutoMovieHumanBodyExteriorBinding;
  /** Registered parent graph in common metres; its generation must match this assembly. */
  rig: IAutoMovieHumanBodySourceRig;
  /** Actual acquired/authored boundary members, retaining each closed id/tissue pair. */
  parts: readonly IAutoMovieHumanBodySourcePart[];

  /**
   * Registered native field owning the subcutaneous boundary on the final
   * exterior. Its logical identity must not also occur in static parts.
   * Omission preserves the earlier independently supplied static parts.
   */
  nativeSubcutaneous?: IAutoMovieHumanBodyNativeSubcutaneousSource;

  /** Reproducible common registration, named references and unresolved limits. */
  registration: string;
}
