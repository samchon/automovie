import type { IAutoMovieMaterial } from "../material/IAutoMovieMaterial";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * Current texture consumers and host residency facts for one context's closure.
 * The synchronous computation borrows records and returns cost facts, not
 * owners or native allocations. The host remains responsible for accurate
 * lifetimes.
 */
export namespace IAutoMovieMeasureRenderTextureClosure {
  /**
   * Close current and retained consumers over one renderer's texture
   * allocations. Raw uploads share only an actual Source and equivalent upload
   * state. PMREM output and sharp-background cubes share only the actual
   * environment Texture object. PBR DFG lookup and PMREM blur scratch belong to
   * the renderer once. A source disposal releases its environment derivatives,
   * while scratch and lookup survive until their host releases the context or
   * replaces the scratch. Environment factory sampling is an
   * initialization-order union: configured mip-linear uploads and temporary
   * linear conversion uploads can occupy distinct keys even after properties
   * match. Count each possible state once with every equivalent material/source
   * consumer; this is an upper bound, not a census.
   *
   * Missing object identities in a multi-resident closure leave required bytes
   * unknown. Legacy single-shot facts describe a fresh context. Opaque object
   * tokens are used only for equality; stable resident owners identify the
   * result. PMREM bounds follow r186: a half-float atlas is 3_max(cubeSize,112)
   * by 4_cubeSize, cubeSize=power-of-two floor(width/4). The background cube
   * retains six RGBA color faces of the inherited component type and a
   * conservative 32-bit depth face attachment. Raw channel/internal format does
   * not own them. DFG is a 16-by-16 RG half-float texture, with no mip chain.
   * Driver overhead and encoded/CPU source bytes are outside these uncompressed
   * storage bounds.
   */
  export type IProps = {
    /**
     * Current scope's used PBR records; iterable is consumed once into a
     * temporary array.
     */
    materials: Iterable<IAutoMovieMaterial>;
    /**
     * Current cache's actual source facts by asset; contradictory duplicate
     * asset rows throw.
     */
    sources: readonly IAutoMovieRenderTextureSource[];
    /**
     * Current declared environment asset, or null when no environment image is
     * consumed.
     */
    environment: string | null;
    /**
     * Drawn default PBR materials without an authored record; omission acts as
     * false.
     */
    defaultPbr?: boolean;
    /**
     * Required current-scope attachments from the policy resolver; omission
     * means none.
     */
    shadowCasters?: readonly {
      /** Current-scope light id matched against target shadow associations. */
      light: string;
      /** Policy filtering draw count: two for VSM, zero for PCF. */
      filterDraws: number;
    }[];
    /** Current scope's rectangular-light presence; omission acts as false. */
    areaLights?: boolean;
    /**
     * Host-owned live scopes and retained resources. Omission means a fresh
     * context with owner "current"; nonblank unique scope owners are checked by
     * the closure.
     */
    residency?: IAutoMovieRenderTextureResidency;
  };
}
