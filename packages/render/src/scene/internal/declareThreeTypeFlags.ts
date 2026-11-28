import type {} from "three";
import type { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind";

/**
 * The literal class flags three.js sets on each instance (`Mesh.isMesh`,
 * `MeshStandardMaterial.isMeshStandardMaterial`, ...), declared on the base
 * class as optional, with the type the subclass declares (`true` or `boolean`).
 * three's own declarations put each flag only on the subclass, so a value held
 * at its base type could not read it; declaring it on the base, where every
 * subclass instance either carries it or does not, lets the narrowing functions
 * of {@link AutoMovieRenderThreeKind} read the flag as three's renderer does.
 */
declare module "three" {
  interface Object3D {
    readonly isMesh?: true;
    readonly isSkinnedMesh?: true;
    readonly isAutoMovieSkinnedMesh?: true;
    readonly isInstancedMesh?: true;
    readonly isBatchedMesh?: true;
    readonly isLineSegments2?: true;
    readonly isLine?: true;
    readonly isPoints?: true;
    readonly isSprite?: true;
    readonly isBone?: true;
    readonly isLight?: boolean;
    readonly isDirectionalLight?: boolean;
    readonly isPointLight?: boolean;
    readonly isSpotLight?: boolean;
    readonly isRectAreaLight?: boolean;
    readonly isCamera?: boolean;
    readonly isOrthographicCamera?: boolean;
    readonly isPerspectiveCamera?: boolean;
  }

  interface Material {
    readonly isMeshStandardMaterial?: boolean;
    readonly isMeshPhysicalMaterial?: boolean;
    readonly isMeshDepthMaterial?: boolean;
    readonly isMeshDistanceMaterial?: boolean;
    readonly isMeshNormalMaterial?: boolean;
    readonly isMeshPhongMaterial?: boolean;
    readonly isMeshLambertMaterial?: boolean;
    readonly isMeshBasicMaterial?: boolean;
    readonly isPointsMaterial?: boolean;
    readonly isMeshToonMaterial?: boolean;
    readonly isShaderMaterial?: boolean;
    readonly isRawShaderMaterial?: boolean;
  }

  interface Texture {
    readonly isColor?: never;
    readonly isDataTexture?: true;
    readonly isDataArrayTexture?: true;
    readonly isData3DTexture?: true;
    readonly isFramebufferTexture?: true;
    readonly isDepthTexture?: true;
    readonly isCompressedTexture?: true;
    readonly isCompressedArrayTexture?: true;
    readonly isCubeTexture?: true;
  }

  interface RenderTarget {
    readonly isWebGLRenderTarget?: boolean;
  }

  interface BufferAttribute {
    readonly isInterleavedBufferAttribute?: never;
  }

  interface InterleavedBufferAttribute {
    readonly isBufferAttribute?: never;
  }

  interface Vector3 {
    readonly isVector4?: never;
  }
}
