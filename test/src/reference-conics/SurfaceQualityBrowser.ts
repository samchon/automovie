import * as THREE from "three";
import { mountViewer } from "../../../packages/viewer/src/mountViewer";
import type { IAutoMovieViewerHandle } from "../../../packages/viewer/src/IAutoMovieViewerHandle";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";

/** Stored independently generated geometry and its real generating curves, already in native-frame metres. */
interface Scene {
  /** Disclosed local source cohort. */
  roi: string;
  /** Sampling/correspondence condition and old/new identity. */
  name: string;
  /** Borrowed unchanged positions and shared triangle indices. */
  mesh: N.Mesh;
  /** Curves evaluated from the same stored coefficients. */
  curves: N.Curve[];
  /** Original CPU camera basis and fitted physical viewport scale. */
  cameras: N.Camera[];
}

/** Single retained viewer context; this module is loaded only by the dedicated diagnostic browser page. */
let handle: IAutoMovieViewerHandle | undefined;
/** Scene resources are caller-owned and retired before each controlled frame. */
let previous: THREE.Object3D[] = [];
/** The mounted scene is reused across sequential frames, avoiding competing capture contexts. */
const world: THREE.Scene = new THREE.Scene();
/** A single perspective projection is identical for old/new and flat/smooth comparisons. */
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 1, 0.01, 20);
/** Byte-unchanged local meshes are cached once, rather than fetched for each frame. */
let data: Scene[] | undefined;

/** Render the actual cached mesh through public viewer mounting; only the named shading and display stage vary. */
export async function SurfaceQualityBrowser(url: string, index: number, view: number, flat: boolean, stage: "clay" | "curves" | "overlay"): Promise<object> {
  data ??= await (await fetch(url)).json() as Scene[];
  const record: Scene = data[index]!;
  const saved: N.Camera = record.cameras[view]!;
  const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
  if (handle === undefined) {
    world.background = new THREE.Color(0xffffff);
    world.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.1));
    handle = mountViewer(canvas, world, camera, (): void => {}, { preserveDrawingBuffer: true, pixelRatio: 1, antialias: false });
  }
  for (const object of previous) {
    world.remove(object);
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) { object.geometry.dispose(); const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material]; for (const material of materials) material.dispose(); }
  }
  previous = [];
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
  light.position.set(saved.back[0] + saved.up[0] + saved.right[0], saved.back[1] + saved.up[1] + saved.right[1], saved.back[2] + saved.up[2] + saved.right[2]);
  world.add(light); previous.push(light);
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(record.mesh.positions, 3)); geometry.setIndex([...record.mesh.indices]); geometry.computeVertexNormals();
  let float32MaximumPositionErrorMetres: number = 0;
  const attribute: THREE.BufferAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i: number = 0; i < record.mesh.positions.length; ++i) float32MaximumPositionErrorMetres = Math.max(float32MaximumPositionErrorMetres, Math.abs(Number(attribute.array[i]) - record.mesh.positions[i]!));
  if (stage !== "curves") {
    const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(...record.mesh.colour), roughness: 1, metalness: 0, side: THREE.DoubleSide, flatShading: flat });
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material); world.add(mesh); previous.push(mesh);
  } else geometry.dispose();
  if (stage !== "clay") for (const curve of record.curves) {
    const points: THREE.Vector3[] = curve.points.map((p: N.Point): THREE.Vector3 => new THREE.Vector3(...p));
    if (curve.closed) points.push(points[0]!.clone());
    const lineGeometry: THREE.BufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line: THREE.Line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#" + (curve.colour ?? "316a99"), depthTest: true }));
    world.add(line); previous.push(line);
  }
  const distance: number = 5;
  camera.position.set(saved.target[0] + distance * saved.back[0], saved.target[1] + distance * saved.back[1], saved.target[2] + distance * saved.back[2]);
  camera.up.set(...saved.up); camera.lookAt(...saved.target);
  camera.fov = 2 * Math.atan(saved.height / (2 * saved.scale * distance)) * 180 / Math.PI;
  camera.aspect = 1; camera.updateProjectionMatrix();
  handle.renderer.render(world, camera); handle.completeFrame(0);
  const gl: WebGLRenderingContext | WebGL2RenderingContext = handle.renderer.getContext();
  const extension: WEBGL_debug_renderer_info | null = gl.getExtension("WEBGL_debug_renderer_info");
  return { roi: record.roi, condition: record.name, flatShading: flat, stage, camera: { position: camera.position.toArray(), up: camera.up.toArray(), target: saved.target, fov: camera.fov, aspect: camera.aspect, near: camera.near, far: camera.far }, sourceCpuCamera: saved, triangles: record.mesh.indices.length / 3, normals: "Indexed BufferGeometry.computeVertexNormals, own geometry, unchanged shared indices", float32MaximumPositionErrorMetres, renderer: extension === null ? gl.getParameter(gl.RENDERER) as unknown : gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) as unknown, projectionLimit: "Same GPU projection for all conditions; finite-distance perspective is not identical to CPU orthographic projection." };
}

/** This diagnostic page owns its callback; static Vite module loading avoids serializing a transpiler's dynamic-import helper into Playwright. */
const host: { surfaceQuality: typeof SurfaceQualityBrowser } = window as unknown as { surfaceQuality: typeof SurfaceQualityBrowser };
host.surfaceQuality = SurfaceQualityBrowser;
