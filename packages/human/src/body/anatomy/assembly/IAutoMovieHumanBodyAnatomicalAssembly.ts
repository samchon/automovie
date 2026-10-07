import type { IAutoMovieHumanBodySourceRig } from "../articulation/rig/IAutoMovieHumanBodySourceRig";
import type { IAutoMovieHumanBodyExteriorBinding } from "../binding/IAutoMovieHumanBodyExteriorBinding";
import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";

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
 * @evidence contracts/common.md#principled-implementation Basis, shape and shared rig generation bind all tissue geometry to one source registration.
 * @evidence contracts/common.md#clear-and-simple-design One immutable assembly owns the graph and its source parts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent bbox carriers and copied tissue primitives cannot supply this shared graph.
 * @evidence contracts/common.md#meaningful-documentation States exact registration, consumer and clinical separation.
 * @evidence contracts/modeling.md#part-identity-and-grouping The source part union derives every closed tissue identity from its maintained catalogue.
 * @evidence contracts/modeling.md#parameter-channels Exact supported shape binds replay; named source joint goals belong to the document and shared rig.
 * @evidence contracts/modeling.md#emitted-geometry Source members supply actual acquired or reproducibly authored boundary surfaces.
 * @evidence contracts/modeling.md#spatial-conventions All meshes and source rest frames share registered right-handed Y-up Z-forward metres.
 * @evidence contracts/modeling.md#shared-boundaries Shared graph sites and offline weights carry source-defined tissue attachment ownership.
 * @evidence contracts/modeling.md#rendered-observation The actual body/person builder consumes this assembly; source registration and appearance remain separately observed responsibilities.
 * @evidence contracts/anatomy.md#anatomical-source Acquired and authored-reference qualification remains with each source part, independent of clinical certification.
 * @evidence contracts/anatomy.md#permitted-range Source joint profiles own supported movement and exact shape refuses unsupported registration.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is immutable offline source; documents contain named measurements and goals only.
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
  /** Reproducible common registration, named references and unresolved limits. */
  registration: string;
}
