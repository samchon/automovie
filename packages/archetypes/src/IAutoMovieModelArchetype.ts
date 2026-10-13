import { AutoMovieHumanoidBone } from "@automovie/interface";
import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";
import { IAutoMovieArchetypeBuildInput } from "./IAutoMovieArchetypeBuildInput";
import { IAutoMovieArchetypeGeometry } from "./IAutoMovieArchetypeGeometry";
import { IAutoMovieArchetypeParameter } from "./IAutoMovieArchetypeParameter";
import { IAutoMovieArchetypeParameterPlan } from "./IAutoMovieArchetypeParameterPlan";
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
 * @evidence contracts/common.md#principled-implementation An archetype is a strategy object, static schema data plus three pure functions, which lets the gate, the radius table and the materializer stay ignorant of every catalogue member while remaining deterministic across hosts.
 * @evidence contracts/common.md#clear-and-simple-design Each member serves one consumer: `capabilities`, `bones`, `parameters` and `plan` the design gate, `bones` also the asset inventory, `projectionRadius` the radius table, and `build` the materializer; there is no lifecycle or option beyond those.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface names no catalogue member, and an empty `bones` list is the documented contract for a skeletonless builder rather than a check against a particular id.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the registry seam and the determinism obligation; the members give the id matching rule, what an empty bone list refuses and binds, and each function's caller, input trust and failure behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface declares no runtime code; the algorithmic cost of its function members is answered on `plan`, `projectionRadius` and `build`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A definition is shared by reference through a registry and coordinates no work itself; whether a consumer reuses a member's result is that consumer's decision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shipped definitions are module constants and a host's registry holds them by reference; the interface acquires no state, handle or task of its own.
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
   * @evidence contracts/common.md#principled-implementation A plan is a pure function of the raw map that tolerates missing or mistyped values because the gate calls it before any kind check; primitive-prop reads `shape` through a `typeof` guard for that reason.
   * @evidence contracts/common.md#clear-and-simple-design The function returns facts and leaves the wording of missing and unsupported keys to the gate, so an archetype implements only the discrimination it alone knows.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusing through the returned list instead of throwing keeps one malformed recipe from hiding the gate's other diagnostics, and the contract special-cases no recipe or archetype id.
   * @evidence contracts/common.md#meaningful-documentation The comment says when the gate calls the plan, what state the map may be in, and that a problem becomes a refusal rather than a throw.
   * @evidence contracts/performance.md#efficient-algorithms The gate calls a plan once per model recipe per validation, and the shipped plans do one `typeof` read and a table lookup, then copy key lists no longer than the archetype's schema, so time and space are linear in that schema size.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges a distinct recipe's map, and the gate runs once per build, so there is no repeated equivalent plan to cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A plan returns fresh short lists the gate discards after one recipe, and the shipped plans hold no state between calls.
   */
  plan: (
    parameters: AutoMovieArchetypeParameters,
  ) => IAutoMovieArchetypeParameterPlan;

  /**
   * Conservative model-root projection radius in metres for accepted parameters.
   *
   * The production builder tabulates it per recipe, after the design gate
   * accepted the graph, for population members whose framing boxes and render
   * bounds need a radius before any geometry exists. The production package
   * also exports that table to scripts that may run without the gate, so the
   * shipped readers substitute zero for missing or nonfinite dimensions.
   * A malformed map's result is a placeholder, not a bound, and large finite
   * out-of-range dimensions can overflow arithmetic. Generated geometry must
   * stay within this model-root sphere under its supported bone rotations.
   *
   * @evidence contracts/common.md#principled-implementation Primitive-prop uses its selected shape's enclosing-radius formula; stickman measures the same generated parts using ancestral rest-offset lengths plus part offsets and enclosing radii, bounding all unit bone rotations around the model root. Ungated finite extremes can still overflow later arithmetic.
   * @evidence contracts/common.md#clear-and-simple-design Measurement lives on the archetype that knows its own proportions, so the radius table and the engine population kernels never restate a catalogue member's shape math.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ungated zero substitution remains a placeholder and never admits a recipe; accepted geometry uses the actual build owner's primitive dimensions instead of a height-only radius that ignores independent head and limb parameters.
   * @evidence contracts/common.md#meaningful-documentation States metre units, model-root centre and supported bone-rotation enclosure, population-table consumers and the limits of ungated placeholder arithmetic.
   * @evidence contracts/performance.md#efficient-algorithms Primitive-prop evaluates fixed arithmetic over at most three dimensions; stickman creates its fixed thirteen-bone/part geometry and performs two linear scans over those records, computed once per recipe in the population radius table without a persistent cache.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The production radius table already computes every recipe's radius once and hands that table to every consumer, so the function itself has nothing further to share.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns a number and keeps no reference to the parameter map, so it owns no retained state.
   */
  projectionRadius: (parameters: AutoMovieArchetypeParameters) => number;

  /**
   * Build deterministic geometry from one accepted parameter map.
   *
   * The materializer calls this once per generated recipe after the design gate
   * accepted the map. Shipped builders read values through unchecked casts, so a
   * map that skipped the gate yields unchecked geometry rather than an error.
   *
   * @evidence contracts/common.md#principled-implementation Building is a pure function from the accepted map and compiler-owned ids to fresh skeleton and part objects, so the same recipe compiles to identical geometry on every host.
   * @evidence contracts/common.md#clear-and-simple-design The builder takes one input record and returns only geometry; validation stays in the gate and model assembly in the materializer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The unchecked casts rest on the builder materializing only after every design diagnostic clears, and the comment states that a map which skipped the gate yields unchecked geometry instead of claiming a guarantee.
   * @evidence contracts/common.md#meaningful-documentation The comment states the caller, the precondition that the gate accepted the map, and the consequence of breaking that precondition.
   * @evidence contracts/performance.md#efficient-algorithms Cost is one allocation per part and bone, linear in the archetype's fixed part count, one primitive for primitive-prop and thirteen parts on thirteen bones for stickman, paid once per generated recipe.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The materializer must give each compiled model its own unshared geometry, so the result of one build cannot be reused for another recipe even when the parameters match.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned skeleton and parts transfer to the compiled model at return, the builder retains nothing, and the population grows by one geometry per generated recipe in the build.
   */
  build: (input: IAutoMovieArchetypeBuildInput) => IAutoMovieArchetypeGeometry;
}
