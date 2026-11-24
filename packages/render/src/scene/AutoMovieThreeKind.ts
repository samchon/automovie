import type * as THREE from "three";

import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

import type { AutoMovieSkinnedMesh } from "./AutoMovieSkinnedMesh.js";

/**
 * The literal class flags three.js sets on each instance (`Mesh.isMesh`,
 * `MeshStandardMaterial.isMeshStandardMaterial`, ...), declared on the base
 * class as absent-or-true. three's own declarations put each flag only on the
 * subclass, so a value held at its base type could not read it; declaring it
 * on the base, where every subclass instance either carries it or does not,
 * lets the narrowing functions of {@link AutoMovieThreeKind} read the flag as
 * three's renderer does.
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
    readonly isLight?: true;
    readonly isDirectionalLight?: true;
    readonly isPointLight?: true;
    readonly isSpotLight?: true;
    readonly isRectAreaLight?: true;
    readonly isCamera?: true;
    readonly isOrthographicCamera?: true;
    readonly isPerspectiveCamera?: true;
  }

  interface Material {
    readonly isMeshStandardMaterial?: true;
    readonly isMeshPhongMaterial?: true;
    readonly isMeshLambertMaterial?: true;
    readonly isMeshBasicMaterial?: true;
    readonly isMeshToonMaterial?: true;
    readonly isShaderMaterial?: true;
    readonly isRawShaderMaterial?: true;
  }

  interface Texture {
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
    readonly isWebGLRenderTarget?: true;
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

/**
 * Narrow three.js objects by the literal type flags three.js sets on each
 * class, the discriminants three's own renderer reads, instead of `instanceof`.
 * An object of another class has no such flag, so the check is false. Typed
 * arrays are told apart by their declared `Symbol.toStringTag` literal.
 */
export namespace AutoMovieThreeKind {
  /** Whether an object is a mesh, skinned and instanced meshes included. */
  export function isMesh(object: THREE.Object3D): object is THREE.Mesh {
    return object.isMesh === true;
  }

  /** Whether an object is a skinned mesh. */
  export function isSkinnedMesh(
    object: THREE.Object3D,
  ): object is THREE.SkinnedMesh {
    return object.isSkinnedMesh === true;
  }

  /** Whether an object is this package's skinned mesh. */
  export function isAutoMovieSkinnedMesh(
    object: THREE.Object3D,
  ): object is AutoMovieSkinnedMesh {
    return object.isAutoMovieSkinnedMesh === true;
  }

  /** Whether an object is an instanced mesh. */
  export function isInstancedMesh(
    object: THREE.Object3D,
  ): object is THREE.InstancedMesh {
    return object.isInstancedMesh === true;
  }

  /** Whether an object is a batched mesh. */
  export function isBatchedMesh(
    object: THREE.Object3D,
  ): object is THREE.BatchedMesh {
    return object.isBatchedMesh === true;
  }

  /** Whether an object is a screen-space line, one widened quad per segment. */
  export function isLineSegments2(
    object: THREE.Object3D,
  ): object is LineSegments2 {
    return object.isLineSegments2 === true;
  }

  /** Whether an object is a line, segments and loops included. */
  export function isLine(object: THREE.Object3D): object is THREE.Line {
    return object.isLine === true;
  }

  /** Whether an object is a point cloud. */
  export function isPoints(object: THREE.Object3D): object is THREE.Points {
    return object.isPoints === true;
  }

  /** Whether an object is a sprite. */
  export function isSprite(object: THREE.Object3D): object is THREE.Sprite {
    return object.isSprite === true;
  }

  /** Whether an object is a skeleton bone. */
  export function isBone(object: THREE.Object3D): object is THREE.Bone {
    return object.isBone === true;
  }

  /** Whether an object is a light. */
  export function isLight(object: THREE.Object3D): object is THREE.Light {
    return object.isLight === true;
  }

  /** Whether an object is a directional light. */
  export function isDirectionalLight(
    object: THREE.Object3D,
  ): object is THREE.DirectionalLight {
    return object.isDirectionalLight === true;
  }

  /** Whether an object is a point light. */
  export function isPointLight(
    object: THREE.Object3D,
  ): object is THREE.PointLight {
    return object.isPointLight === true;
  }

  /** Whether an object is a spot light. */
  export function isSpotLight(
    object: THREE.Object3D,
  ): object is THREE.SpotLight {
    return object.isSpotLight === true;
  }

  /** Whether an object is a rectangular area light. */
  export function isRectAreaLight(
    object: THREE.Object3D,
  ): object is THREE.RectAreaLight {
    return object.isRectAreaLight === true;
  }

  /** Whether an object is a camera. */
  export function isCamera(object: THREE.Object3D): object is THREE.Camera {
    return object.isCamera === true;
  }

  /** Whether a camera or object is an orthographic camera. */
  export function isOrthographicCamera(
    object: THREE.Object3D,
  ): object is THREE.OrthographicCamera {
    return object.isOrthographicCamera === true;
  }

  /** Whether a camera or object is a perspective camera. */
  export function isPerspectiveCamera(
    object: THREE.Object3D,
  ): object is THREE.PerspectiveCamera {
    return object.isPerspectiveCamera === true;
  }

  /**
   * Whether a mesh's material slot holds one material rather than a list: a
   * single material is the only value its one-element flattening starts with.
   */
  export function isMaterial(
    value: THREE.Material | readonly THREE.Material[],
  ): value is THREE.Material {
    return [value].flat()[0] === value;
  }

  /** Whether a material is a standard (or physical) material. */
  export function isMeshStandardMaterial(
    material: THREE.Material,
  ): material is THREE.MeshStandardMaterial {
    return material.isMeshStandardMaterial === true;
  }

  /** Whether a material is a Phong material. */
  export function isMeshPhongMaterial(
    material: THREE.Material,
  ): material is THREE.MeshPhongMaterial {
    return material.isMeshPhongMaterial === true;
  }

  /** Whether a material is a Lambert material. */
  export function isMeshLambertMaterial(
    material: THREE.Material,
  ): material is THREE.MeshLambertMaterial {
    return material.isMeshLambertMaterial === true;
  }

  /** Whether a material is a basic material. */
  export function isMeshBasicMaterial(
    material: THREE.Material,
  ): material is THREE.MeshBasicMaterial {
    return material.isMeshBasicMaterial === true;
  }

  /** Whether a material is a toon material. */
  export function isMeshToonMaterial(
    material: THREE.Material,
  ): material is THREE.MeshToonMaterial {
    return material.isMeshToonMaterial === true;
  }

  /** Whether a material is a shader material, raw shaders included. */
  export function isShaderMaterial(
    material: THREE.Material,
  ): material is THREE.ShaderMaterial {
    return material.isShaderMaterial === true;
  }

  /** Whether a material is a raw shader material. */
  export function isRawShaderMaterial(
    material: THREE.Material,
  ): material is THREE.RawShaderMaterial {
    return material.isRawShaderMaterial === true;
  }

  /** Whether a geometry attribute owns its own array. */
  export function isBufferAttribute(
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  ): attribute is THREE.BufferAttribute {
    return attribute.isBufferAttribute === true;
  }

  /** Whether a geometry attribute reads an interleaved buffer. */
  export function isInterleavedBufferAttribute(
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  ): attribute is THREE.InterleavedBufferAttribute {
    return attribute.isInterleavedBufferAttribute === true;
  }

  /** Whether a vector is four-dimensional. */
  export function isVector4(
    value: THREE.Vector3 | THREE.Vector4,
  ): value is THREE.Vector4 {
    return value.isVector4 === true;
  }

  /** Whether a render target is a cube target: its texture is a cube texture. */
  export function isWebGLCubeRenderTarget(
    target: THREE.RenderTarget,
  ): target is THREE.WebGLCubeRenderTarget {
    return target.texture.isCubeTexture === true;
  }

  /** Whether a render target is a WebGL render target. */
  export function isWebGLRenderTarget(
    target: THREE.RenderTarget,
  ): target is THREE.WebGLRenderTarget {
    return target.isWebGLRenderTarget === true;
  }

  /** Whether a typed array holds 32-bit floats. */
  export function isFloat32Array(
    array: THREE.TypedArray,
  ): array is Float32Array {
    return array[Symbol.toStringTag] === "Float32Array";
  }

  /** Whether a typed array holds unsigned 16-bit integers. */
  export function isUint16Array(array: THREE.TypedArray): array is Uint16Array {
    return array[Symbol.toStringTag] === "Uint16Array";
  }

  /**
   * Whether an object draws with materials: a mesh, line, point cloud or
   * sprite.
   */
  export function isDrawn(
    object: THREE.Object3D,
  ): object is THREE.Mesh | THREE.Line | THREE.Points | THREE.Sprite {
    return (
      isMesh(object) || isLine(object) || isPoints(object) || isSprite(object)
    );
  }

  /** Whether a texture holds raw data. */
  export function isDataTexture(
    texture: THREE.Texture,
  ): texture is THREE.DataTexture {
    return texture.isDataTexture === true;
  }

  /** Whether a texture is a layered raw-data texture. */
  export function isDataArrayTexture(
    texture: THREE.Texture,
  ): texture is THREE.DataArrayTexture {
    return texture.isDataArrayTexture === true;
  }

  /** Whether a texture is a volume raw-data texture. */
  export function isData3DTexture(
    texture: THREE.Texture,
  ): texture is THREE.Data3DTexture {
    return texture.isData3DTexture === true;
  }

  /** Whether a texture is a framebuffer copy. */
  export function isFramebufferTexture(
    texture: THREE.Texture,
  ): texture is THREE.FramebufferTexture {
    return texture.isFramebufferTexture === true;
  }

  /** Whether a texture is a depth texture. */
  export function isDepthTexture(
    texture: THREE.Texture,
  ): texture is THREE.DepthTexture {
    return texture.isDepthTexture === true;
  }

  /** Whether a texture is block-compressed. */
  export function isCompressedTexture(
    texture: THREE.Texture,
  ): texture is THREE.CompressedTexture {
    return texture.isCompressedTexture === true;
  }

  /** Whether a texture is a layered block-compressed texture. */
  export function isCompressedArrayTexture(
    texture: THREE.Texture,
  ): texture is THREE.CompressedArrayTexture {
    return texture.isCompressedArrayTexture === true;
  }
}