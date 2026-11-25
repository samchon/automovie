import type { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";

/**
 * Explicit collision proxy selected from manifest bytes or a deterministic
 * recipe. Appearance geometry never supplies an inferred proxy when this
 * declaration is missing.
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
