import { IAutoMovieProfile } from "../core/IAutoMovieProfile";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieModelLodRecipe } from "./IAutoMovieModelLodRecipe";

/**
 * A bounded primitive model recipe compiled into deterministic model data.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieModelRecipe` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieModelRecipe` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieModelRecipe {
  /**
   * Non-blank stable recipe id, unique under portable case folding.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;
  /**
   * Production role.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `role` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `role` for the narrative intent story design ownership system contract.
   */
  role: "performer" | "mount" | "prop" | "set";
  /**
   * Non-blank id of the registered archetype that builds this recipe.
   *
   * The builder resolves this identifier against the archetype catalogue the
   * production registers and refuses a recipe naming nothing registered. It is
   * opaque here on purpose: which archetypes exist is a decision of that
   * catalogue, not of this contract.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `archetype` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `archetype` for the narrative intent story design ownership system contract.
   */
  archetype: string;
  /**
   * Registered external appearance asset, or omitted for builder-generated
   * primitive geometry. The active production asset ledger must carry one
   * matching `model-recipe` use for this exact recipe id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `asset` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `asset` for the narrative intent story design ownership system contract.
   */
  asset?: string;
  /**
   * Exact archetype-specific parameter map.
   *
   * The registered archetype owns this contract: which keys are required, which
   * are accepted at all, and the value kind and range of each. Read
   * `MODEL_RECIPE`, then the definition itself; an unsupported key is refused
   * rather than stored.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `parameters` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `parameters` for the narrative intent story design ownership system contract.
   */
  parameters: Record<string, number | string | boolean>;
  /**
   * Exactly one named six-digit `#RRGGBB` material color in the foundation
   * builder. Multiple semantic part materials remain unsupported and are
   * refused instead of silently discarded.
   *
   * The value is an sRGB swatch, and the builder decodes it with
   * `srgbHexToLinearColor` on its way into the material's linear `baseColor`.
   * The same swatch written here and in `IAutoMovieInstanceVariation.palette`
   * therefore renders one color, which is the whole reason both go through one
   * decode.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `palette` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `palette` for the narrative intent story design ownership system contract.
   */
  palette: Record<string, string>;
  /**
   * Non-empty unique tiers ordered `hero`, `near`, `far`, with increasing
   * positive distances and an optional unbounded tier only at the end.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `lod` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `lod` for the narrative intent story design ownership system contract.
   */
  lod: IAutoMovieModelLodRecipe[];
  /**
   * Semantic abilities visible to source and review, unique within the recipe.
   *
   * The registered archetype decides which labels are meaningful and the
   * builder refuses any other; declaring one it does implement still leaves
   * source to author the motion that earns it.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `capabilities` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `capabilities` for the narrative intent story design ownership system contract.
   */
  capabilities: string[];
  /**
   * Unique semantic bone sockets.
   *
   * A bone is accepted only when the registered archetype's builder actually
   * materializes it, so an archetype without a builder-owned skeleton accepts
   * none. The materializer does not create attached scene nodes automatically.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `attachments` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `attachments` for the narrative intent story design ownership system contract.
   */
  attachments: Array<{
    /** Non-blank attachment id, unique within the recipe. */
    id: string;
    /** Bone id used as the attachment parent. */
    bone: AutoMovieHumanoidBone;
  }>;
  /**
   * Declarative capability profiles copied onto the builder-owned runtime
   * model. Omitted means that trait-gated engine verbs such as mounting are
   * unavailable.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `profiles` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `profiles` for the narrative intent story design ownership system contract.
   */
  profiles?: IAutoMovieProfile[];
}
