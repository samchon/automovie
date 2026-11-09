import { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";

/**
 * Explicit collision proxy selected from manifest bytes or a deterministic recipe. Appearance geometry never supplies an inferred proxy when this declaration is missing.
 *
 * @evidence contracts/development/design.md#principled-representation The kind separates an authored proxy asset path from inline primitive dimensions within external-model provenance. The production proxy resolver is retired; this pure union performs no byte lookup, generator invocation or geometry materialization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The asset arm carries one manifest path and the generated arm reuses the existing generated-proxy fields, keeping proxy selection independent of visual appearance provenance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No absent or invalid proxy falls back to a guessed imported mesh hull; only the explicitly adopted asset or deterministic recipe can supply its collision representation.
 * @evidence contracts/development/common.md#meaningful-documentation Names the two proxy sources, typed JSON asset ownership and the absence of an inferred appearance-based fallback.
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
