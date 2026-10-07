/**
 * The page behind `capture-articulation.ts`: draw one exported face model on
 * the GPU with fixed lights and screenshot the canvas.
 *
 * The runner serves this module through vite and calls `window.show(model,
 * options)` once per frame; `window.RENDERER` is the unmasked graphics device
 * string, which the runner judges before accepting a frame. A hand-typed
 * red/green marker pair beside the head fixes the reading convention: red sits
 * at +X (the subject's anatomical left, which appears on the viewer's right in
 * the front view) and green at +Y. The key light is a directional lamp from the
 * upper left so planes read; `clay` swaps every material for one untextured
 * grey. `hairMask` keeps the same camera and geometry but writes visible hair
 * white and everything else black, the hair texture's alpha still cutting its
 * fibres before depth testing. The lights and materials are the review's own
 * and are enough for geometry (landmarks, silhouettes), not for appearance,
 * which the product editor's stage draws (`human-viewer/capture-face-references.mts`).
 */
import * as THREE from "three";

import type {
  IPortraitWebModel,
  IPortraitWebOptions,
} from "./IPortraitWebModel";
import { portraitWebAlphaTest } from "./portraitWebAlphaTest";
import { portraitWebHairMaskPart } from "./portraitWebHairMaskPart";
import { portraitWebHairMaskPixels } from "./portraitWebHairMaskPixels";

declare global {
  interface Window {
    RENDERER: string;
    show: (
      model: IPortraitWebModel,
      options: IPortraitWebOptions,
    ) => Promise<{ renderer: string; parts: number }>;
  }
}

const canvas = document.getElementById("view") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(900, 900, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const gl = renderer.getContext();
const debug = gl.getExtension("WEBGL_debug_renderer_info");
window.RENDERER = String(
  debug
    ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER),
);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202830);
const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(-1, 1.4, 1.8);
scene.add(key);
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x3a3f46, 0.55));
const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
const loader = new THREE.TextureLoader();
let group: THREE.Group | null = null;
const markers = new THREE.Group();
const marker = (
  color: number,
  position: [number, number, number],
): THREE.Mesh => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.006, 12, 12),
    new THREE.MeshBasicMaterial({ color }),
  );
  mesh.position.set(...position);
  return mesh;
};
markers.add(
  marker(0xff3030, [0.11, 0.03, 0.12]),
  marker(0x30ff30, [0, 0.16, 0.12]),
);
scene.add(markers);

/** The exported materials as three.js materials, by id. */
async function buildMaterials(
  model: IPortraitWebModel,
  clay: boolean,
): Promise<Map<string, THREE.MeshStandardMaterial>> {
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  for (const material of model.materials) {
    const built = new THREE.MeshStandardMaterial({
      color: clay
        ? 0xb8b0a4
        : new THREE.Color(
            material.baseColor.r,
            material.baseColor.g,
            material.baseColor.b,
          ),
      roughness: clay ? 0.85 : material.roughness,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    if (!clay && material.texture) {
      const texture = await loader.loadAsync(material.texture);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      built.map = texture;
      // The material's own alpha mode and cutoff, as the product viewer
      // applies them; a hard-coded cut thinned brows and lashes.
      built.alphaTest = portraitWebAlphaTest(material);
      built.transparent = Object.hasOwn(material, "alphaMode")
        ? material.alphaMode === "blend"
        : true;
    }
    materials.set(material.id, built);
  }
  return materials;
}

/** White-on-black replacement of a part's material for the hair ID pass. */
function maskMaterialOf(
  hair: boolean,
  source: THREE.MeshStandardMaterial,
  finish: IPortraitWebModel["materials"][number] | undefined,
): THREE.MeshBasicMaterial {
  const mask = new THREE.MeshBasicMaterial({
    color: hair ? 0xffffff : 0x000000,
    side: THREE.DoubleSide,
  });
  if (hair && source.map) {
    const image = source.map.image as CanvasImageSource & {
      width: number;
      height: number;
    };
    const alphaCanvas = document.createElement("canvas");
    alphaCanvas.width = image.width;
    alphaCanvas.height = image.height;
    const context = alphaCanvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height);
    pixels.data.set(portraitWebHairMaskPixels(pixels.data));
    context.putImageData(pixels, 0, 0);
    mask.map = new THREE.CanvasTexture(alphaCanvas);
    mask.map.flipY = false;
    mask.alphaTest = portraitWebAlphaTest(finish ?? {});
  }
  return mask;
}

/** The part's indexed mesh with the export's normals, uvs and vertex colours. */
function buildGeometry(
  mesh: NonNullable<IPortraitWebModel["parts"][number]["mesh"]>,
  colours: boolean,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(mesh.positions, 3),
  );
  if (mesh.normals)
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(mesh.normals, 3),
    );
  if (mesh.uvs)
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(mesh.uvs, 2));
  if (mesh.indices) geometry.setIndex(mesh.indices);
  // Vertex colours (pigmentation, scalp tint) multiply the finish, as they
  // do in the exported glTF; a clay view ignores them.
  if (mesh.colors && colours)
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(mesh.colors, 3),
    );
  return geometry;
}

window.show = async (model, options) => {
  if (group !== null) scene.remove(group);
  group = new THREE.Group();
  const clay = options.clay === true;
  const hairMask = options.hairMask === true;
  (scene.background as THREE.Color).set(hairMask ? 0x000000 : 0x202830);
  markers.visible = !hairMask;
  const materials = await buildMaterials(model, clay);
  for (const part of model.parts) {
    if (part.mesh === null) continue;
    if (
      options.only !== undefined &&
      !options.only.some((prefix) => part.id.startsWith(prefix))
    )
      continue;
    const geometry = buildGeometry(part.mesh, !clay);
    let material: THREE.Material = materials.get(part.material)!;
    if (part.mesh.colors && !clay) {
      material = material.clone();
      (material as THREE.MeshStandardMaterial).vertexColors = true;
    }
    if (options.normal === true)
      material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    if (hairMask)
      material = maskMaterialOf(
        portraitWebHairMaskPart(part.id),
        material as THREE.MeshStandardMaterial,
        model.materials.find((one) => one.id === part.material),
      );
    group.add(new THREE.Mesh(geometry, material));
  }
  scene.add(group);
  const target = new THREE.Vector3(...(options.target ?? [0, 0, 0.06]));
  const distance = options.distance ?? 0.62;
  const yaw = ((options.yaw ?? 0) * Math.PI) / 180;
  const pitch = ((options.pitch ?? 0) * Math.PI) / 180;
  camera.position.set(
    target.x + distance * Math.sin(yaw) * Math.cos(pitch),
    target.y + distance * Math.sin(pitch),
    target.z + distance * Math.cos(yaw) * Math.cos(pitch),
  );
  camera.lookAt(target);
  // A measured pose may carry a longer lens; omission is the review's
  // historical 28 degree vertical field.
  camera.fov = options.fov ?? 28;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  gl.finish();
  return { renderer: window.RENDERER, parts: group.children.length };
};
