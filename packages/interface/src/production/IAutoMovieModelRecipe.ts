import { IAutoMovieProfile } from "../core/IAutoMovieProfile";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieModelLodRecipe } from "./IAutoMovieModelLodRecipe";

/**
 * A bounded registered-archetype recipe compiled into deterministic model data, with an optional adopted external appearance.
 *
 * @evidence contracts/common.md#principled-implementation The registered archetype admits its own parameter and capability vocabulary and builds deterministic geometry and supported bones; production validation additionally checks recipe identity, external asset use, one sRGB palette color, LOD edges and attachment sockets.
 * @evidence contracts/common.md#clear-and-simple-design Recipe data owns reusable construction and semantic declarations, while archetype implementations own parameter meaning and source authors own actual motion and scene attachment instances.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered archetypes, unsupported parameters or capabilities and multiple palette materials refuse; external appearance requires an exact model-recipe ledger use and does not infer collision or rig semantics.
 * @evidence contracts/common.md#meaningful-documentation Defines portable identity, archetype ownership, adopted asset selection, palette encoding, LOD ordering, attachment limits and optional declarative profiles.
 * @author Samchon
 */
export interface IAutoMovieModelRecipe {
  /** Non-blank stable recipe id, unique under portable case folding. */
  id: string;

  /** Production role. */
  role: "performer" | "mount" | "prop" | "set";

  /**
   * Non-blank id of the registered archetype that builds this recipe.
   *
   * The builder resolves this identifier against the archetype catalogue the production registers and refuses a recipe naming nothing registered. It is opaque here on purpose: which archetypes exist is a decision of that catalogue, not of this contract.
   */
  archetype: string;

  /**
   * Registered external appearance asset, or omitted for builder-generated primitive geometry. The active production asset ledger must carry one matching `model-recipe` use for this exact recipe id.
   */
  asset?: string;

  /**
   * Exact archetype-specific parameter map.
   *
   * The registered archetype owns this contract: which keys are required, which are accepted at all, and the value kind and range of each. Read `MODEL_RECIPE`, then the definition itself; an unsupported key is refused rather than stored.
   */
  parameters: Record<string, number | string | boolean>;

  /**
   * Exactly one named six-digit `#RRGGBB` material color in the foundation builder. Multiple semantic part materials remain unsupported and are refused instead of silently discarded.
   *
   * The value is an sRGB swatch, and the builder decodes it with `srgbHexToLinearColor` on its way into the material's linear `baseColor`. The same swatch written here and in `IAutoMovieInstanceVariation.palette` therefore renders one color, which is the whole reason both go through one decode.
   */
  palette: Record<string, string>;

  /**
   * Non-empty unique tiers ordered `hero`, `near`, `far`, with increasing positive distances and an optional unbounded tier only at the end.
   */
  lod: IAutoMovieModelLodRecipe[];

  /**
   * Semantic abilities visible to source and review, unique within the recipe.
   *
   * The registered archetype decides which labels are meaningful and the builder refuses any other; declaring one it does implement still leaves source to author the motion that earns it.
   */
  capabilities: string[];

  /**
   * Unique semantic bone sockets.
   *
   * A bone is accepted only when the registered archetype's builder actually materializes it, so an archetype without a builder-owned skeleton accepts none. The materializer does not create attached scene nodes automatically.
   */
  attachments: Array<{
    /** Non-blank attachment id, unique within the recipe. */
    id: string;

    /** Bone id used as the attachment parent. */
    bone: AutoMovieHumanoidBone;
  }>;

  /**
   * Declarative capability profiles copied onto the builder-owned runtime model. Omitted means that trait-gated engine verbs such as mounting are unavailable.
   */
  profiles?: IAutoMovieProfile[];
}
