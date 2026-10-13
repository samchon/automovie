import {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieArchetypeParameters } from "./parameterValues";

/**
 * One archetype parameter's accepted value kind and inclusive bounds.
 *
 * The design gate compares `kind` with the value's `typeof`, refuses any
 * non-finite number, and applies the bounds only to a `number` parameter, in
 * the unit the archetype documents (the shipped catalogue measures in meters).
 *
 * @author Samchon
 */
export interface IAutoMovieArchetypeParameter {
  /** JavaScript `typeof` name the value must have. */
  kind: "number" | "string" | "boolean";

  /** Inclusive minimum of a `number` parameter; absent leaves no lower bound. */
  minimum?: number;

  /** Inclusive maximum of a `number` parameter; absent leaves no upper bound. */
  maximum?: number;
}

/**
 * One archetype-owned refusal raised while planning a parameter map.
 *
 * The design gate turns each refusal into one diagnostic on the recipe; the
 * archetype supplies its identity and wording.
 *
 * @author Samchon
 */
export interface IAutoMovieArchetypeRefusal {
  /**
   * Diagnostic code, reported verbatim when it is a registered AutoMovie
   * diagnostic code; any other string is reported as `model-parameter-invalid`
   * with this code named before the message.
   */
  code: string;

  /** Complete operator-facing sentence, including the correction. */
  message: string;
}

/**
 * The exact keys one parameter map must carry and may carry.
 *
 * A plan is computed from the parameters themselves because an archetype may
 * take a discriminating parameter whose value decides which other keys are
 * meaningful. The design gate owns the diagnostics; the archetype owns only the
 * facts they are derived from.
 *
 * The gate reports every `required` key the map lacks, every refusal, and every
 * present key that is outside the archetype's `parameters` schema or, when
 * `accepted` is a list, outside that list.
 *
 * @author Samchon
 */
export interface IAutoMovieArchetypeParameterPlan {
  /** Keys that must be present. */
  required: readonly string[];

  /** Keys accepted at all, or null when every declared schema key is. */
  accepted: readonly string[] | null;

  /** Archetype-owned refusals, such as an unsupported discriminating value. */
  refusals: readonly IAutoMovieArchetypeRefusal[];
}

/**
 * Everything a geometry builder needs beyond the recipe's own parameters.
 *
 * The materializer supplies it once per generated recipe, after the design gate
 * has accepted the parameter map.
 *
 * @author Samchon
 */
export interface IAutoMovieArchetypeBuildInput {
  /** Id of the recipe being materialized; the shipped builders do not read it. */
  recipe: string;

  /** Exact recipe parameter map, already accepted by the design gate. */
  parameters: AutoMovieArchetypeParameters;

  /**
   * Compiler-owned id of the model's only material, named after the recipe
   * palette's first swatch in code-unit order; every generated part references
   * it.
   */
  material: string;

  /**
   * Compiler-owned skeleton id for this recipe; an articulated builder uses it
   * as its skeleton id, and a builder returning no skeleton ignores it.
   */
  skeleton: string;
}

/**
 * Deterministic geometry one archetype builds for one recipe.
 *
 * The materializer stores both fields in the compiled model without copying,
 * so a builder returns objects created for this call rather than shared
 * constants. For a recipe backed by an external model the materializer keeps
 * the skeleton and replaces the parts with a collision proxy.
 *
 * @author Samchon
 */
export interface IAutoMovieArchetypeGeometry {
  /** Builder-owned skeleton, or null for an archetype whose `bones` is empty. */
  skeleton: IAutoMovieModel["skeleton"];

  /** Visible parts in deterministic order, each referencing the input material. */
  parts: IAutoMovieModelPart[];
}

/**
 * One registered model archetype: its parameter contract and its builder.
 *
 * The production core keeps the shape of a model recipe and never the
 * catalogue. It resolves `archetype` through a registry of these definitions,
 * so which figures, props, or shells a production can build is a decision that
 * belongs to the catalogue it registers, not to the builder.
 *
 * Every member is data or a pure function of that data: the same parameters
 * must always plan the same keys, measure the same radius, and build the same
 * geometry, on every host and in every process.
 *
 * @author Samchon
 */
export interface IAutoMovieModelArchetype {
  /** Non-blank, exact, case-sensitive identifier a model recipe names. */
  id: string;

  /** Semantic capabilities a recipe may declare; the gate refuses any other. */
  capabilities: readonly string[];

  /**
   * Humanoid bones the builder's skeleton materializes.
   *
   * An empty list means the builder owns no skeleton at all, which is what
   * refuses a bone attachment and what binds a static external appearance. A
   * non-empty list is the set an attachment's bone must belong to.
   */
  bones: readonly AutoMovieHumanoidBone[];

  /**
   * Accepted value kind and bounds of every parameter, keyed by name; a key
   * absent here is unsupported.
   */
  parameters: Readonly<Record<string, IAutoMovieArchetypeParameter>>;

  /**
   * Plan which keys one parameter map must carry, may carry, and cannot.
   *
   * The design gate calls this before it checks kinds and bounds, so the map
   * may lack keys or hold wrongly typed values; a plan reads them defensively
   * and reports a problem as a refusal rather than a throw.
   */
  plan: (
    parameters: AutoMovieArchetypeParameters,
  ) => IAutoMovieArchetypeParameterPlan;

  /**
   * Conservative projection radius in meters for one accepted parameter map.
   *
   * The production builder tabulates it per recipe for population members,
   * whose framing boxes and render bounds read it before any geometry exists,
   * so it answers for a malformed map with a finite number rather than a throw.
   * For a map the design gate will refuse, that number is a placeholder, not a
   * bound.
   */
  projectionRadius: (parameters: AutoMovieArchetypeParameters) => number;

  /**
   * Build deterministic geometry from one accepted parameter map.
   *
   * The materializer calls this once per generated recipe after the design gate
   * accepted the map. Shipped builders read values through unchecked casts, so a
   * map that skipped the gate yields unchecked geometry rather than an error.
   */
  build: (input: IAutoMovieArchetypeBuildInput) => IAutoMovieArchetypeGeometry;
}
