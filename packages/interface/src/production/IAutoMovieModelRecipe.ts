import { IAutoMovieProfile } from "../core/IAutoMovieProfile";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieModelLodRecipe } from "./IAutoMovieModelLodRecipe";

/**
 * A bounded registered-archetype recipe compiled into deterministic model data, with an optional adopted external appearance.
 *
 * @evidence contracts/common.md#principled-implementation Engine population compilation reads LOD references and hashes the complete canonical recipe, while worldBlock can author a primitive box recipe. Archetype definitions own parameter/build semantics, but the production recipe validator and materializer are retired; no surviving whole-recipe gate establishes palette, asset, capability or socket admission automatically.
 * @evidence contracts/common.md#clear-and-simple-design Recipe data owns reusable construction and semantic declarations, while archetype implementations own parameter meaning and source authors own actual motion and scene attachment instances.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registry membership, supported parameters/capabilities, one valid palette entry and asset/socket consistency are host premises. Population compilation hashes missing/unencodable references as explicit markers instead of constructing or admitting missing geometry; external appearance metadata confers no collision or rig semantics.
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
   * A host resolves this opaque identifier against its registered archetype definitions. This contract and the Engine population compiler do not perform registry lookup or instantiate its geometry.
   */
  archetype: string;

  /**
   * Registered external appearance asset, or omitted for builder-generated primitive geometry. The active production asset ledger must carry one matching `model-recipe` use for this exact recipe id.
   */
  asset?: string;

  /**
   * Exact archetype-specific parameter map.
   *
   * The registered archetype owns required/accepted keys and each value kind/range. Hosts must read its parameter schema and plan before calling build; the retired production gate no longer refuses unsupported keys automatically.
   */
  parameters: Record<string, number | string | boolean>;

  /**
   * Intended foundation palette of one named six-digit `#RRGGBB` color. The production materializer that enforced cardinality is retired; hosts own color admission and material construction.
   *
   * The value is an sRGB swatch. A host constructing linear material baseColor must decode it with `srgbHexToLinearColor`, matching instance variation palette decoding; storing this recipe alone performs no conversion.
   */
  palette: Record<string, string>;

  /**
   * Non-empty unique tiers ordered `hero`, `near`, `far`, with increasing positive distances and an optional unbounded tier only at the end.
   */
  lod: IAutoMovieModelLodRecipe[];

  /**
   * Semantic abilities visible to source and review, unique within the recipe.
   *
   * The registered archetype decides which labels are meaningful. No surviving recipe gate checks membership here; source still authors the motion and hosts own capability admission.
   */
  capabilities: string[];

  /**
   * Unique semantic bone sockets.
   *
   * The intended socket must exist in the host-built skeleton; a skeletonless archetype provides none. This recipe field performs no bone admission or attached-node creation after production materializer retirement.
   */
  attachments: Array<{
    /** Non-blank attachment id, unique within the recipe. */
    id: string;

    /** Bone id used as the attachment parent. */
    bone: AutoMovieHumanoidBone;
  }>;

  /**
   * Declarative capability profiles intended for an explicitly constructed runtime model. This recipe field no longer has an automatic production copying host; engine verbs inspect the runtime model's actual profiles.
   */
  profiles?: IAutoMovieProfile[];
}
