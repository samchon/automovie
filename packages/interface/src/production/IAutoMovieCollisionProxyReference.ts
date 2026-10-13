import { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";

/**
 * Explicit collision proxy selected from manifest bytes or a deterministic recipe. Appearance geometry never supplies an inferred proxy when this declaration is missing.
 *
 * @evidence contracts/common.md#principled-implementation The kind separates a typed JSON proxy asset from a compiler-owned generator; production materialization resolves the selected owner instead of deriving collision meaning from an imported visual mesh.
 * @evidence contracts/common.md#clear-and-simple-design The asset arm carries one manifest path and the generated arm reuses the existing generated-proxy fields, keeping proxy selection independent of visual appearance provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absent or invalid proxy falls back to a guessed imported mesh hull; only the explicitly adopted asset or deterministic recipe can supply its collision representation.
 * @evidence contracts/common.md#meaningful-documentation Names the two proxy sources, typed JSON asset ownership and the absence of an inferred appearance-based fallback.
 * @author Samchon
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
