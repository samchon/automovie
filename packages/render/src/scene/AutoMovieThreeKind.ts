import type * as THREE from "three";

import type { AutoMovieSkinnedMesh } from "./AutoMovieSkinnedMesh.js";

/**
 * Narrow three.js objects by the literal type flags three.js declares on each
 * class (`Mesh.isMesh: true`, `Material.isMaterial: true`, ...), the
 * discriminants three's own renderer reads, instead of `instanceof`. A flag is
 * read from the narrower declaration of the object it is asked about; an
 * object of another class has no such flag, so the check is false. Typed
 * arrays are told apart by their declared `Symbol.toStringTag` literal.
 */
export namespace AutoMovieThreeKind {
  /** Whether an object is a mesh, skinned and instanced meshes included. */
  export function isMesh(object: THREE.Object3D): object is THREE.Mesh {
    return (object as THREE.Mesh).isMesh === true;
  }

  /** Whether an object is a skinned mesh. */
  export function isSkinnedMesh(
    object: THREE.Object3D,
  ): object is THREE.SkinnedMesh {
    return (object as THREE.SkinnedMesh).isSkinnedMesh === true;
  }

  /** Whether an object is this package's skinned mesh. */
  export function isAutoMovieSkinnedMesh(
    object: THREE.Object3D,
  ): object is AutoMovieSkinnedMesh {
    return (object as AutoMovieSkinnedMesh).isAutoMovieSkinnedMesh === true;
  }

  /** Whether an object is an instanced mesh. */
  export function isInstancedMesh(
    object: THREE.Object3D,
  ): object is THREE.InstancedMesh {
    return (object as THREE.InstancedMesh).isInstancedMesh === true;
  }

  /** Whether an object is a line, segments and loops included. */
  export function isLine(object: THREE.Object3D): object is THREE.Line {
    return (object as THREE.Line).isLine === true;
  }

  /** Whether an object is a point cloud. */
  export function isPoints(object: THREE.Object3D): object is THREE.Points {
    return (object as THREE.Points).isPoints === true;
  }

  /** Whether an object is a sprite. */
  export function isSprite(object: THREE.Object3D): object is THREE.Sprite {
    return (object as THREE.Sprite).isSprite === true;
  }

  /** Whether an object is a light. */
  export function isLight(object: THREE.Object3D): object is THREE.Light {
    return (object as THREE.Light).isLight === true;
  }

  /** Whether an object is a directional light. */
  export function isDirectionalLight(
    object: THREE.Object3D,
  ): object is THREE.DirectionalLight {
    return (object as THREE.DirectionalLight).isDirectionalLight === true;
  }

  /** Whether an object is a point light. */
  export function isPointLight(
    object: THREE.Object3D,
  ): object is THREE.PointLight {
    return (object as THREE.PointLight).isPointLight === true;
  }

  /** Whether an object is a spot light. */
  export function isSpotLight(
    object: THREE.Object3D,
  ): object is THREE.SpotLight {
    return (object as THREE.SpotLight).isSpotLight === true;
  }

  /** Whether an object is a rectangular area light. */
  export function isRectAreaLight(
    object: THREE.Object3D,
  ): object is THREE.RectAreaLight {
    return (object as THREE.RectAreaLight).isRectAreaLight === true;
  }

  /** Whether a camera or object is an orthographic camera. */
  export function isOrthographicCamera(
    object: THREE.Object3D,
  ): object is THREE.OrthographicCamera {
    return (object as THREE.OrthographicCamera).isOrthographicCamera === true;
  }

  /** Whether a camera or object is a perspective camera. */
  export function isPerspectiveCamera(
    object: THREE.Object3D,
  ): object is THREE.PerspectiveCamera {
    return (object as THREE.PerspectiveCamera).isPerspectiveCamera === true;
  }

  /** Whether a value is a material. */
  export function isMaterial(value: object): value is THREE.Material {
    return (value as THREE.Material).isMaterial === true;
  }

  /** Whether a material is a standard (or physical) material. */
  export function isMeshStandardMaterial(
    material: THREE.Material,
  ): material is THREE.MeshStandardMaterial {
    return (
      (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
    );
  }

  /** Whether a material is a Phong material. */
  export function isMeshPhongMaterial(
    material: THREE.Material,
  ): material is THREE.MeshPhongMaterial {
    return (material as THREE.MeshPhongMaterial).isMeshPhongMaterial === true;
  }

  /** Whether a material is a Lambert material. */
  export function isMeshLambertMaterial(
    material: THREE.Material,
  ): material is THREE.MeshLambertMaterial {
    return (
      (material as THREE.MeshLambertMaterial).isMeshLambertMaterial === true
    );
  }

  /** Whether a material is a basic material. */
  export function isMeshBasicMaterial(
    material: THREE.Material,
  ): material is THREE.MeshBasicMaterial {
    return (material as THREE.MeshBasicMaterial).isMeshBasicMaterial === true;
  }

  /** Whether a material is a toon material. */
  export function isMeshToonMaterial(
    material: THREE.Material,
  ): material is THREE.MeshToonMaterial {
    return (material as THREE.MeshToonMaterial).isMeshToonMaterial === true;
  }

  /** Whether a material is a shader material, raw shaders included. */
  export function isShaderMaterial(
    material: THREE.Material,
  ): material is THREE.ShaderMaterial {
    return (material as THREE.ShaderMaterial).isShaderMaterial === true;
  }

  /** Whether a geometry attribute owns its own array. */
  export function isBufferAttribute(
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  ): attribute is THREE.BufferAttribute {
    return (attribute as THREE.BufferAttribute).isBufferAttribute === true;
  }

  /** Whether a geometry attribute reads an interleaved buffer. */
  export function isInterleavedBufferAttribute(
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  ): attribute is THREE.InterleavedBufferAttribute {
    return (
      (attribute as THREE.InterleavedBufferAttribute)
        .isInterleavedBufferAttribute === true
    );
  }

  /** Whether a value is a texture. */
  export function isTexture(value: object): value is THREE.Texture {
    return (value as THREE.Texture).isTexture === true;
  }

  /** Whether a value is a colour. */
  export function isColor(value: object): value is THREE.Color {
    return (value as THREE.Color).isColor === true;
  }

  /** Whether a vector is four-dimensional. */
  export function isVector4(value: object): value is THREE.Vector4 {
    return (value as THREE.Vector4).isVector4 === true;
  }

  /** Whether a render target is a cube target. */
  export function isWebGLCubeRenderTarget(
    target: object,
  ): target is THREE.WebGLCubeRenderTarget {
    return (
      (target as THREE.WebGLCubeRenderTarget).isWebGLCubeRenderTarget === true
    );
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
}
