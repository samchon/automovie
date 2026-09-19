import { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";

/**
 * A deterministic collision proxy reference with no inferred fallback.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `IAutoMovieCollisionProxyReference` as the portable data boundary for the asset semantic enrichment requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `IAutoMovieCollisionProxyReference` for the asset spec element consumer links system contract.
 */
export type IAutoMovieCollisionProxyReference =
  | {
      /** Manifest-owned proxy bytes. */
      kind: "asset";

      /** Exact path of a typed JSON proxy asset in this manifest. */
      asset: string;
    }
  | ({
      /** Compiler-owned deterministic proxy recipe. */
      kind: "generated";
    } & IAutoMovieGeneratedCollisionProxy);
