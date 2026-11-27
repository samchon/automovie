import type { IAutoMovieRenderMaterialShaderSource } from "./IAutoMovieRenderMaterialShaderSource.js";

/**
 * One named change to a material's compiled shader. Each operation reads and
 * edits only the program's shader source and uniforms, so three's complete
 * program parameters and a caller's bare source both serve.
 */
export interface IAutoMovieRenderMaterialShaderPatch {
  /** Part of the cache key that distinguishes patched and plain programs. */
  key: string;

  /**
   * Edits the program's source and uniforms in registration order. A thrown
   * error stops subsequent operations without rolling back prior edits.
   */
  apply: (shader: IAutoMovieRenderMaterialShaderSource) => void;
}
