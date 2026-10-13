import {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

/**
 * One archetype parameter's accepted value kind and inclusive bounds.
 *
 * The design gate compares `kind` with the value's `typeof`, refuses any
 * non-finite number, and applies the bounds only to a `number` parameter, in
 * the unit the archetype documents (the shipped catalogue measures in meters).
 *
 * @evidence contracts/common.md#principled-implementation Mirrors JavaScript's `typeof` names for the three JSON scalar kinds a recipe can carry, so the gate checks a value with one `typeof` comparison and a closed inclusive interval.
 * @evidence contracts/common.md#clear-and-simple-design Holds only a kind and two optional bounds; an enumerated string such as primitive-prop's `shape` is refused by that archetype's `plan`, so the schema needs no enum field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no archetype or recipe; a bound declared on a `string` or `boolean` parameter is silently ignored by the gate, and this type does not prevent declaring one.
 * @evidence contracts/common.md#meaningful-documentation States the `typeof` comparison, the non-finite refusal, that bounds are inclusive and apply only to numbers, and that an absent bound leaves that side open.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A static schema entry chooses no algorithm; the gate spends one `typeof` test and at most two comparisons on it per supplied key.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Entries are literal constants in an archetype's `parameters` table and produce no result a later caller could share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each entry is at most three scalar fields inside a module-level archetype constant; it owns no handle and grows with nothing.
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
 * @evidence contracts/common.md#principled-implementation Pairs a diagnostic code with a complete sentence, so the archetype owns what is wrong while the gate owns the diagnostic list, target and file.
 * @evidence contracts/common.md#clear-and-simple-design Two strings with no severity, target or file field, because the gate attaches the recipe's location itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `code` is typed `string` although this package already depends on `@automovie/interface`, which exports the closed `AutoMovieDiagnosticCode` union; a misspelled code is caught only at runtime, where the gate substitutes `model-parameter-invalid`.
 * @evidence contracts/common.md#meaningful-documentation States when the code is reported verbatim, what replaces an unregistered code, and that the message carries its own correction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A two-string record chooses no algorithm; the gate's registered-code test is one Set lookup per refusal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A refusal is one plan call's verdict on one recipe map and is consumed in that same validation pass.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds two strings that live inside the returned plan until the gate copies them into a diagnostic.
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
 * @evidence contracts/common.md#principled-implementation Computes the key sets from the map itself because a discriminating value, such as primitive-prop's `shape`, decides which dimensions are meaningful; `accepted: null` is the sentinel for the whole declared schema.
 * @evidence contracts/common.md#clear-and-simple-design Three fields feed the gate's three diagnostics (missing, refused, unsupported), keeping wording in the gate and key facts in the archetype as the prose states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `accepted: null` is a contract default that stickman's fixed schema uses, not a consumer special case; nothing checks that every `required` key also appears in the schema.
 * @evidence contracts/common.md#meaningful-documentation States the null meaning, that a listed key must still be in the schema, and which diagnostic each field feeds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record; the gate converts `accepted` to a Set once per recipe so each key test is constant time.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each plan answers one map in one validation pass and is dropped after the gate reads it; no other phase asks for it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds three short arrays owned by the gate call that requested them, released when that call returns.
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
 * @evidence contracts/common.md#principled-implementation Hands compiler-owned material and skeleton ids to the builder, so a pure function can reference them without deriving names of its own.
 * @evidence contracts/common.md#clear-and-simple-design The accepted map plus three materializer-owned identities; `recipe` is read by neither shipped builder, so it serves only a builder a host registers itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no catalogue-specific field; the materializer fills `skeleton` with `productionRuntimeSkeletonId(recipe)` for every archetype, and a builder without a rig ignores it.
 * @evidence contracts/common.md#meaningful-documentation States who fills each field, that the map is already accepted, which palette swatch becomes the material, and when the skeleton id is ignored.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Four references assembled once per generated recipe; the record performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One input describes one recipe's build, and its material and skeleton ids are recipe-specific, so no two builds share it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References the recipe's own parameter map and three strings for the duration of one `build` call.
 * @author Samchon
 */
export interface IAutoMovieArchetypeBuildInput {
  /** Id of the recipe being materialized; the shipped builders do not read it. */
  recipe: string;

  /** Exact recipe parameter map, already accepted by the design gate. */
  parameters: Readonly<Record<string, number | string | boolean>>;

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
 * @evidence contracts/common.md#principled-implementation Reuses the model's own `skeleton` and `IAutoMovieModelPart` types, so builder output drops into `IAutoMovieModel` with no conversion step.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, exactly the part of `IAutoMovieModel` an archetype decides; ids, materials, origin and profiles stay with the materializer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `skeleton: null` is the contract state for a static archetype such as primitive-prop, matching its empty `bones` list; no field serves one consumer.
 * @evidence contracts/common.md#meaningful-documentation States the uncopied ownership transfer, the part order, the null skeleton meaning, and what an external-model recipe keeps.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record; the cost of constructing its parts belongs to the archetype's `build`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The geometry becomes one model's mutable state, so sharing it between recipes would alias that state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ownership passes to the compiled model at return; the record holds no handle, and its size is the builder's fixed part count.
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
 * @evidence contracts/common.md#principled-implementation A plain record of schema data and pure functions that the gate, the materializer and the radius table call by id; the determinism premise above binds implementations, and neither TypeScript nor any runtime check enforces it.
 * @evidence contracts/common.md#clear-and-simple-design One interface carries the schema and the three operations its consumers call, with no class hierarchy or lifecycle hook; the registry type and its factory live in their own module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty `bones` list is the contract discriminant for "no builder-owned skeleton", which the gate uses to refuse every bone attachment; no member names a consumer or fixture.
 * @evidence contracts/common.md#meaningful-documentation States the registry seam and the determinism premise here, and on members the exact-id match, the empty-bones meaning, plan timing, radius unit and the build precondition.
 * @evidence contracts/performance.md#efficient-algorithms `capabilities` and `bones` are arrays the gate scans with `includes` once per claim or attachment, so checks cost claims times list length; lists are catalogue-sized (13 stickman bones) and keep the declaration order diagnostics print.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The definition coordinates no work; one constant object serves every recipe naming its id, and each member call's result belongs to the caller that made it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds schema data and function references in module-level constants for the process lifetime; it acquires no handle, worker or growing state.
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
   * @evidence contracts/common.md#principled-implementation A pure function of the raw map, so a discriminating value can narrow the key sets before any value is judged; primitive-prop reads `shape` through a `typeof` test for exactly this reason.
   * @evidence contracts/common.md#clear-and-simple-design Returns required keys, accepted keys and refusals together, so the gate makes one call per recipe instead of three.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports an unsupported value as data with a contract diagnostic code, as primitive-prop does with `model-parameter-invalid` for an unknown shape, instead of throwing or substituting a default.
   * @evidence contracts/common.md#meaningful-documentation States the call timing relative to kind and bound checks, the unvalidated input a plan must tolerate, and the refusal-not-throw rule.
   * @evidence contracts/performance.md#efficient-algorithms The gate calls it once per model recipe; shipped plans are constant (stickman) or one lookup in primitive-prop's `DIMENSIONS` table, so cost is the length of the returned key lists.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The design gate is the only caller and consumes each plan in the pass that requested it, so no second consumer asks for the same map's plan.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns fresh short arrays owned by the gate call; a plan retains nothing between calls.
   */
  plan: (
    parameters: Readonly<Record<string, number | string | boolean>>,
  ) => IAutoMovieArchetypeParameterPlan;

  /**
   * Conservative projection radius in meters for one accepted parameter map.
   *
   * Selection and culling read this before any geometry exists, so it answers
   * for a malformed map with a finite number rather than a throw. For a map the
   * design gate will refuse, that number is a placeholder, not a bound.
   *
   * @evidence contracts/common.md#principled-implementation Derives a radius from the declared dimensions alone (half the stickman height; for primitive-prop the half-diagonal of a box or plane, a sphere's radius, a capsule's radius plus half height, or `hypot(radius, height / 2)` for a cylinder or cone), read through `numberOf`, so measurement needs no geometry build.
   * @evidence contracts/common.md#clear-and-simple-design One number per map, which `productionProjectionRadii` stores in a table; the kernels' fallback for an unregistered archetype stays with them.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The zero that `numberOf` substitutes keeps a malformed map finite; its basis is that the design gate later refuses that recipe, so the placeholder never reaches an accepted build.
   * @evidence contracts/common.md#meaningful-documentation States the unit, the call before geometry exists, the no-throw rule, and that a malformed map's value is a placeholder.
   * @evidence contracts/performance.md#efficient-algorithms Shipped implementations do constant work per recipe: a shape read, at most three dimension reads and one `Math.hypot`.
   * @evidence contracts/performance.md#reuse-equivalent-work `productionProjectionRadii` calls it once per recipe id and stores the value in a Map the population kernels read, so measurement is not repeated per frame or instance; the value depends only on the map, so the recipe id within one table decides equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a number and retains nothing; the table holding the results belongs to the production builder.
   */
  projectionRadius: (
    parameters: Readonly<Record<string, number | string | boolean>>,
  ) => number;

  /**
   * Build deterministic geometry from one accepted parameter map.
   *
   * The materializer calls this once per generated recipe after the design gate
   * accepted the map. Shipped builders read values through unchecked casts, so a
   * map that skipped the gate yields unchecked geometry rather than an error.
   *
   * @evidence contracts/common.md#principled-implementation A pure constructor from accepted dimensions to parts (stickman derives every proportion from `height`) that relies on the gate's kind and bound checks instead of validating again.
   * @evidence contracts/common.md#clear-and-simple-design Takes one input record and returns one geometry record; ids and the material arrive in the input, so the builder decides only shapes, bones and local transforms.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shipped builders read through `numberParameter` and `stringParameter` casts premised on the gate's acceptance; that is the stated ordering contract, and nothing in `build` re-checks it.
   * @evidence contracts/common.md#meaningful-documentation States the once-per-recipe call, the acceptance precondition, and the unchecked result of violating it.
   * @evidence contracts/performance.md#efficient-algorithms Cost is linear in a fixed part count per archetype (one primitive for primitive-prop, one rig of primitives for stickman); for a recipe backed by an external model the materializer still builds the parts and then replaces them with a collision proxy, so that part list is allocated and discarded.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each generated recipe is built once per materialization and its geometry is adopted by that recipe's model alone, so no second consumer requests the same build.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns freshly allocated geometry whose ownership passes to the compiled model; the builder keeps nothing between calls.
   */
  build: (input: IAutoMovieArchetypeBuildInput) => IAutoMovieArchetypeGeometry;
}
