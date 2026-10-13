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
 * @evidence contracts/common.md#principled-implementation The schema reuses JavaScript's own `typeof` names as the kind, so the gate checks a value with one `typeof` comparison and needs no parallel type vocabulary; bounds are inclusive and meaningless for a string or boolean kind.
 * @evidence contracts/common.md#clear-and-simple-design A kind plus two optional numeric limits is the whole rule; the unit is left to the owning archetype's documentation instead of a unit field nothing would read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The kind union is closed to the three JSON scalar kinds a recipe parameter map can hold, which is a contract-defined discriminant rather than a special case.
 * @evidence contracts/common.md#meaningful-documentation The prose says how the gate applies kind, finiteness and bounds and where the unit comes from; each optional limit says what its absence means.
 * @evidenceExclude contracts/performance.md#cost-and-resources This interface is a type-only parameter rule with no runtime code, so it computes and retains nothing.
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
 * @evidence contracts/common.md#principled-implementation A refusal carries only the code and sentence the gate cannot derive itself; the gate adds target and file, and maps an unregistered code to `model-parameter-invalid` instead of trusting the archetype's string.
 * @evidence contracts/common.md#clear-and-simple-design Two strings keep the archetype free of the diagnostic catalogue type, so a catalogue package does not depend on the production diagnostic union to refuse a value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The open `code` string is a deliberate seam the gate checks against its registered code set, not a bypass of it, and no code value is special-cased here.
 * @evidence contracts/common.md#meaningful-documentation The `code` member states both the verbatim and the fallback reporting paths, and `message` states that it must carry the correction.
 * @evidenceExclude contracts/performance.md#cost-and-resources This interface only shapes two strings an archetype's plan returns, so it holds no computation or resource.
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
 * @evidence contracts/common.md#principled-implementation Required and accepted key lists are computed per map so a discriminating value such as primitive-prop's `shape` can narrow both, while the gate keeps the kind and bound checks against the static schema.
 * @evidence contracts/common.md#clear-and-simple-design Three fields cover the gate's three key checks, and `accepted: null` lets an undiscriminated archetype such as stickman defer to its schema instead of restating every key.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan reports facts and never diagnostics, so no archetype formats gate output or special-cases a recipe; the null sentinel is the documented absence of a narrowing.
 * @evidence contracts/common.md#meaningful-documentation The prose says why the plan depends on the map and lists exactly what the gate reports from it; `accepted` documents what null means.
 * @evidenceExclude contracts/performance.md#cost-and-resources This interface is the type of a plan's return value and runs nothing; the cost of producing one belongs to `IAutoMovieModelArchetype.plan`.
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
 * @evidence contracts/common.md#principled-implementation The compiler decides the material and skeleton ids and hands them in, so every builder references ids that match the compiled model's material list and runtime skeleton id instead of inventing its own.
 * @evidence contracts/common.md#clear-and-simple-design The input carries only the recipe id, the accepted map, and the two compiler-owned ids; palette decoding and model naming stay with the materializer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `recipe` is passed although the shipped builders ignore it, which the member documents as an unread field rather than a value any builder branches on.
 * @evidence contracts/common.md#meaningful-documentation Each member says who owns the value and how a builder must use it, including that `material` is named after the first palette swatch in code-unit order and that a skeletonless builder ignores `skeleton`.
 * @evidenceExclude contracts/performance.md#cost-and-resources This interface types the argument the materializer builds per recipe and executes nothing itself.
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
 * @evidence contracts/common.md#principled-implementation The geometry reuses the interface package's model skeleton and part types, so the materializer stores a builder's result in the compiled model without converting it.
 * @evidence contracts/common.md#clear-and-simple-design Only the skeleton and parts come from the builder; id, name, materials and profiles of the compiled model stay with the materializer that owns them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The external-model path replacing parts with a collision proxy is a documented materializer contract, not a special case inside this type.
 * @evidence contracts/common.md#meaningful-documentation The prose states the no-copy ownership rule that forces fresh objects and what the materializer keeps for an external model; members state the null-skeleton condition and part ordering.
 * @evidenceExclude contracts/performance.md#cost-and-resources This interface only types a builder's return value; the allocation it implies is counted under `IAutoMovieModelArchetype.build`.
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
 * @evidence contracts/common.md#principled-implementation An archetype is a strategy object: static schema data plus three pure functions, which is what lets the gate, the radius table and the materializer stay ignorant of any catalogue member while staying deterministic across hosts.
 * @evidence contracts/common.md#clear-and-simple-design Each member serves one consumer: `capabilities`, `bones`, `parameters` and `plan` the design gate, `projectionRadius` the radius table, and `build` the materializer; there is no lifecycle or option beyond those.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface names no catalogue member, and the empty `bones` list is the documented contract for a skeletonless builder rather than a check against a particular id.
 * @evidence contracts/common.md#meaningful-documentation The prose states the registry seam and the determinism obligation; members state id matching rules, what an empty bone list refuses and binds, and each function's caller, input trust and failure behavior.
 * @evidenceExclude contracts/performance.md#cost-and-resources This interface declares no runtime code of its own; the cost obligations of its function members are answered on `plan`, `projectionRadius` and `build`.
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
   *
   * @evidence contracts/common.md#principled-implementation A plan is a pure function of the raw map that must tolerate missing or mistyped values, because the gate calls it before any kind check; primitive-prop reads `shape` through a `typeof` guard for that reason.
   * @evidence contracts/common.md#clear-and-simple-design The function returns facts and leaves wording of missing and unsupported keys to the gate, so an archetype implements only the discrimination it alone knows.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusing through the returned list instead of throwing keeps one malformed recipe from hiding the gate's other diagnostics; no recipe or archetype id is special-cased in the contract.
   * @evidence contracts/common.md#meaningful-documentation The documentation states when the gate calls the plan, what state the map may be in, and that problems become refusals rather than throws.
   * @evidence contracts/performance.md#cost-and-resources The gate calls a plan once per model recipe per validation, and the shipped plans allocate a few short key lists proportional to the archetype's schema size; nothing is cached or retained.
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
   *
   * @evidence contracts/common.md#principled-implementation The radius is a closed-form bound over the parameters, such as half the stickman height or half the box diagonal, read through `numberOf` so a missing or non-finite value yields zero instead of NaN.
   * @evidence contracts/common.md#clear-and-simple-design Measurement lives on the archetype that knows its own proportions, so the radius table and engine population kernels never restate a catalogue member's shape math.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The finite placeholder for a malformed map is a documented contract of a function that runs outside the gate, not a fallback that hides a refusal, since the gate still refuses that map.
   * @evidence contracts/common.md#meaningful-documentation The documentation gives the unit, who reads the radius and when, and that a refused map's result is a placeholder rather than a bound.
   * @evidence contracts/performance.md#cost-and-resources The shipped radii are constant-time arithmetic over at most three parameters with no allocation beyond a closure, computed once per recipe when the builder fills its radius table.
   */
  projectionRadius: (parameters: AutoMovieArchetypeParameters) => number;

  /**
   * Build deterministic geometry from one accepted parameter map.
   *
   * The materializer calls this once per generated recipe after the design gate
   * accepted the map. Shipped builders read values through unchecked casts, so a
   * map that skipped the gate yields unchecked geometry rather than an error.
   *
   * @evidence contracts/common.md#principled-implementation Building is a pure function from the accepted map and compiler ids to fresh skeleton and part objects, so the same recipe compiles to identical geometry on every host.
   * @evidence contracts/common.md#clear-and-simple-design The builder receives one input object and returns only geometry; validation stays in the gate and model assembly in the materializer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The unchecked casts are justified only by the gate running first, and the documentation states that a map which skipped the gate yields unchecked geometry instead of claiming a guarantee.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the caller, the precondition that the gate accepted the map, and the consequence of violating it.
   * @evidence contracts/performance.md#cost-and-resources Cost is one allocation per part and bone, linear in the archetype's fixed part count (one primitive for primitive-prop, thirteen parts and thirteen bones for stickman), paid once per generated recipe; the result is owned by the compiled model and nothing is cached.
   */
  build: (input: IAutoMovieArchetypeBuildInput) => IAutoMovieArchetypeGeometry;
}
