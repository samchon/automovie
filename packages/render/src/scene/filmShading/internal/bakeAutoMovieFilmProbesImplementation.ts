import { AutoMovieEngineFilmShading } from "@automovie/engine";
import type {
  IAutoMovieFilmShading,
  IAutoMovieIrradianceProbe,
  IAutoMovieIrradianceVolume,
  IAutoMovieProjectIrradianceProbe,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieFilmIndirectRenderer } from "../../IAutoMovieFilmIndirectRenderer.js";

/** Texels along each side of a probe's cube face. */
const FACE: number = 32;

/**
 * The six cube faces: view direction and up, a right-handed set covering every
 * direction once.
 */
const FACES: readonly IFace[] = [
  { forward: [1, 0, 0], up: [0, 1, 0] },
  { forward: [-1, 0, 0], up: [0, 1, 0] },
  { forward: [0, 1, 0], up: [0, 0, -1] },
  { forward: [0, -1, 0], up: [0, 0, 1] },
  { forward: [0, 0, 1], up: [0, 1, 0] },
  { forward: [0, 0, -1], up: [0, 1, 0] },
];

/**
 * Bake a film's irradiance probes: for each grid point of `probes`, draw the
 * static `layer` into six 32-texel cube faces and project them with
 * `projectAutoMovieIrradianceProbe`.
 *
 * Each face is a 90° perspective camera at the probe whose layer mask is
 * `layer` alone, so only the static set and the lights on that layer draw, with
 * their shadows, emission and the scene's image lighting on surfaces. The six
 * faces render side by side into one 192 × 32 float target, cleared to black
 * with the scene's background off, so texels that see no geometry add nothing
 * and the sky, which image lighting already brings to every material, is not
 * counted twice. A second render of the same faces with a double-sided material
 * that writes one on back faces marks the texels that look into a solid. Both
 * are read back and handed to the projection, which marks the probe invalid
 * when more than a quarter of its texels see back faces.
 *
 * The renderer's target, clear colour and alpha, clear policy, tone curve and
 * exposure, and the scene's background and override material are restored
 * before it returns or throws. Nothing earlier than this call is read, so a
 * bake depends only on the scene as it stands: one bounce.
 *
 * @throws When the renderer cannot clear or read back a target.
 */
export function bakeAutoMovieFilmProbesImplementation(props: {
  /** The renderer, with its read-back members. */
  renderer: IAutoMovieFilmIndirectRenderer;

  /** The scene placed at the drawn second. */
  scene: THREE.Scene;

  /** The admitted probes request. */
  probes: IAutoMovieFilmShading.IProbes;
}): IAutoMovieIrradianceVolume {
  const { renderer, scene, probes }: typeof props = props;
  if (
    renderer.readRenderTargetPixels === undefined ||
    renderer.clear === undefined ||
    renderer.setClearColor === undefined ||
    renderer.getClearColor === undefined ||
    renderer.getClearAlpha === undefined
  )
    throw new Error(
      "Film shading probes need a renderer that can clear and read back targets",
    );
  const grid: ReturnType<typeof AutoMovieEngineFilmShading.autoMovieIrradianceGrid> =
    AutoMovieEngineFilmShading.autoMovieIrradianceGrid(probes);
  const target: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(
    6 * FACE,
    FACE,
    {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
    },
  );
  const backFaces: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader:
      "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }",
    fragmentShader:
      "void main() { gl_FragColor = vec4( gl_FrontFacing ? 0.0 : 1.0 ); }",
  });
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    1,
    0.01,
    1000,
  );
  camera.layers.set(probes.layer);
  const prior: {
    target: THREE.WebGLRenderTarget | null;
    clearColor: THREE.Color;
    clearAlpha: number;
    autoClear: boolean;
    toneMapping: THREE.ToneMapping;
    exposure: number;
    background: THREE.Scene["background"];
    override: THREE.Material | null;
  } = {
    target: renderer.getRenderTarget(),
    clearColor: renderer.getClearColor(new THREE.Color()),
    clearAlpha: renderer.getClearAlpha(),
    autoClear: renderer.autoClear,
    toneMapping: renderer.toneMapping,
    exposure: renderer.toneMappingExposure,
    background: scene.background,
    override: scene.overrideMaterial,
  };
  const radiance: Float32Array = new Float32Array(6 * FACE * FACE * 4);
  const back: Float32Array = new Float32Array(6 * FACE * FACE * 4);
  const probesBaked: IAutoMovieIrradianceProbe[] = [];
  try {
    scene.background = null;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 0);
    const draw: (
      override: THREE.Material | null,
      into: Float32Array,
    ) => IAutoMovieVector3[][] = (
      override: THREE.Material | null,
      into: Float32Array,
    ): IAutoMovieVector3[][] => {
      scene.overrideMaterial = override;
      target.viewport.set(0, 0, 6 * FACE, FACE);
      renderer.setRenderTarget(target);
      renderer.clear!();
      renderer.autoClear = false;
      const frames: IAutoMovieVector3[][] = [];
      FACES.forEach((face: IFace, index: number): void => {
        camera.up.set(...face.up);
        camera.lookAt(
          camera.position.x + face.forward[0],
          camera.position.y + face.forward[1],
          camera.position.z + face.forward[2],
        );
        camera.updateMatrixWorld(true);
        const right: THREE.Vector3 = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          0,
        );
        const up: THREE.Vector3 = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          1,
        );
        frames.push([
          { x: face.forward[0], y: face.forward[1], z: face.forward[2] },
          { x: right.x, y: right.y, z: right.z },
          { x: up.x, y: up.y, z: up.z },
        ]);
        target.viewport.set(index * FACE, 0, FACE, FACE);
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
      });
      renderer.readRenderTargetPixels!(target, 0, 0, 6 * FACE, FACE, into);
      return frames;
    };
    for (const position of grid.positions) {
      camera.position.set(...position);
      const frames: IAutoMovieVector3[][] = draw(prior.override, radiance);
      draw(backFaces, back);
      const faces: IAutoMovieProjectIrradianceProbe.IFace[] = frames.map(
        (
          [forward, right, up]: IAutoMovieVector3[],
          index: number,
        ): IAutoMovieProjectIrradianceProbe.IFace => {
          const own: Float32Array = new Float32Array(FACE * FACE * 4);
          const flags: Uint8Array = new Uint8Array(FACE * FACE);
          for (let j: number = 0; j < FACE; ++j)
            for (let i: number = 0; i < FACE; ++i) {
              const from: number = 4 * (j * 6 * FACE + index * FACE + i);
              own.set(radiance.subarray(from, from + 4), 4 * (j * FACE + i));
              flags[j * FACE + i] = back[from]! > 0.5 ? 1 : 0;
            }
          return {
            forward: forward!,
            right: right!,
            up: up!,
            radiance: own,
            backFaces: flags,
          };
        },
      );
      probesBaked.push(AutoMovieEngineFilmShading.projectAutoMovieIrradianceProbe({ size: FACE, faces }));
    }
  } finally {
    scene.background = prior.background;
    scene.overrideMaterial = prior.override;
    renderer.setRenderTarget(prior.target);
    renderer.setClearColor(prior.clearColor, prior.clearAlpha);
    renderer.autoClear = prior.autoClear;
    renderer.toneMapping = prior.toneMapping;
    renderer.toneMappingExposure = prior.exposure;
    target.dispose();
    backFaces.dispose();
  }
  return {
    min: grid.min,
    spacing: grid.spacing,
    counts: grid.counts,
    probes: probesBaked,
  };
}

/** One cube face's view direction and up direction. */
interface IFace {
  /** World direction the face looks along. */
  forward: [number, number, number];

  /** World direction of the face's up. */
  up: [number, number, number];
}
