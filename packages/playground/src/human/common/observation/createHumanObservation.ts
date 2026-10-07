import * as THREE from "three";

import type { HumanObservationPass } from "./HumanObservationPass";
import type { HumanObservationView } from "./HumanObservationView";
import { createHumanObservationAlbedoPass } from "./createHumanObservationAlbedoPass";
import { getHumanObservationBounds } from "./getHumanObservationBounds";
import { getHumanObservationPassDefinition } from "./getHumanObservationPassDefinition";
import { isHumanObservationAuxiliary } from "./isHumanObservationAuxiliary";
import { placeHumanObservationCamera } from "./placeHumanObservationCamera";

/** Width of the outline pass rim on screen, CSS pixels. */
const RIM_PIXELS = 2;
/** Distance used before any subject is displayed, metres. */
const FALLBACK_DISTANCE = 0.65;

/**
 * The review hooks of one human viewport: exact camera placement, named
 * views, region framing, part isolation and hiding, and structural passes.
 *
 * Everything here changes what the display shows and nothing about the
 * document. The hooks never touch the numerical document, the worker's build,
 * the history or the export; they move the display camera, flip mesh
 * visibility and choose a material override, so a frame taken through them is
 * of the same body the panel would export. The viewport calls `apply` before
 * each render, which is where isolation, hiding and the pass reach the scene:
 * a newly published group therefore obeys the current isolation without the
 * caller reapplying it. Until a hook has been called nothing here writes to
 * the scene, so an editor that never uses them draws exactly as before.
 *
 * `roots` names the displayed subject groups. A companion drawn beside the
 * subject, the face seated on a body, is not a root: it is neither isolated,
 * hidden nor measured for framing. A part is a mesh of a root, addressed by
 * its name, which for the body editor is the model part id and for the face
 * editor the id its decoded glTF gives the mesh.
 *
 * Views are framed on the roots' bounding sphere with the same fit the
 * on-screen buttons use, so a hook and a button at the same view agree.
 * Nothing here needs a GPU: the caller owns the renderer and calls `finish`
 * after a hook to complete the frame.
 * Visibility and material-pass transitions notify the viewport's shadow owner;
 * a camera-only or unchanged display leaves static shadow maps resident.
 *
 * @param host The viewport's scene graph and orbit.
 * @param host.scene Scene whose override material carries the pass.
 * @param host.camera Perspective display camera.
 * @param host.orbit Orbit controls whose limits are lifted for exact placement.
 * @param host.roots Displayed subject groups, in the scene.
 * @param host.clay The viewport's grey material, shared with its clay toggle.
 * @param host.height Height of the drawing surface in CSS pixels, which sets the outline's width.
 * @param host.invalidateShadows Notify the viewport when its cached caster display changes.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Provides current-source camera, geometry and material observations independently of asset edits.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps auxiliary instruments out of subject bounds and restores display changes before source publication.
 */
export function createHumanObservation(host: {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: {
    target: THREE.Vector3;
    enableDamping: boolean;
    minDistance: number;
    maxDistance: number;
    update: () => unknown;
  };
  roots: () => THREE.Object3D[];
  clay: THREE.Material;
  height: () => number;
  /** Invalidate the viewport's cached shadows when caster display state changes. */
  invalidateShadows?: () => void;
}) {
  const { camera, orbit } = host;
  let pass: HumanObservationPass = "beauty";
  let isolated: Set<string> | null = null;
  const hidden = new Set<string>();
  // the meshes this stage hid, so that it restores only those and never
  // shows a mesh something else hid
  const hiddenByUs = new Set<THREE.Mesh>();
  // nothing is written to the scene until a hook is used
  let engaged = false;
  const materials: Record<
    Exclude<HumanObservationPass, "beauty" | "clay" | "outline" | "albedo">,
    THREE.Material
  > = {
    normal: new THREE.MeshNormalMaterial(
      getHumanObservationPassDefinition("normal").parameters,
    ),
    // grey, nearer lighter, linear over the subject's own depth range: the
    // hardware depth is nonlinear in the clip planes and reads as flat black
    depth: new THREE.ShaderMaterial({
      ...getHumanObservationPassDefinition("depth").parameters,
      uniforms: { near: { value: 0 }, far: { value: 1 } },
      vertexShader: `varying float viewDepth;
void main() {
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  viewDepth = -view.z;
  gl_Position = projectionMatrix * view;
}`,
      fragmentShader: `uniform float near;
uniform float far;
varying float viewDepth;
void main() {
  float t = clamp((viewDepth - near) / max(far - near, 1e-6), 0.0, 1.0);
  gl_FragColor = vec4(vec3(1.0 - t), 1.0);
}`,
    }),
    flat: new THREE.MeshStandardMaterial(
      getHumanObservationPassDefinition("flat").parameters,
    ),
    wire: new THREE.MeshBasicMaterial(
      getHumanObservationPassDefinition("wire").parameters,
    ),
  };
  // the outline pass swaps each mesh's own material for this white one, since
  // a scene-wide override would repaint the rim as well
  const white = new THREE.MeshBasicMaterial(
    getHumanObservationPassDefinition("outline").parameters,
  );
  const albedo = createHumanObservationAlbedoPass();
  const swapped = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  // the silhouette rim is the back faces pushed out along their normals
  const rim = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { thickness: { value: 0 } },
    vertexShader: `uniform float thickness;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix *
    vec4(position + normalize(normal) * thickness, 1.0);
}`,
    fragmentShader: "void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }",
  });
  const hulls = new Map<THREE.Mesh, THREE.Mesh>();

  const meshes = (): THREE.Mesh[] => {
    const found = new Set<THREE.Mesh>();
    for (const root of host.roots())
      root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (
          mesh.isMesh === true &&
          !isHull(mesh) &&
          !isHumanObservationAuxiliary(mesh)
        )
          found.add(mesh);
      });
    return [...found];
  };
  const isHull = (mesh: THREE.Mesh): boolean => mesh.material === rim;
  const subject = (): { center: THREE.Vector3; radius: number } | null => {
    const box = getHumanObservationBounds(meshes());
    if (box.isEmpty()) return null;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    return { center: sphere.center, radius: sphere.radius };
  };
  const fitDistance = (radius: number, fov = camera.fov): number => {
    const vertical = THREE.MathUtils.degToRad(fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    return (1.1 * radius) / Math.sin(Math.min(vertical, horizontal));
  };
  const place = (view: {
    position: readonly [number, number, number];
    target: readonly [number, number, number];
    fov: number;
  }): void => {
    orbit.enableDamping = false;
    orbit.minDistance = 0;
    orbit.maxDistance = Infinity;
    orbit.target.set(...view.target);
    camera.position.set(...view.position);
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
    orbit.update();
  };

  const unmatched = (ids: readonly string[] | null): string[] => {
    const names = new Set(meshes().map((mesh) => mesh.name));
    return (ids ?? []).filter((id) => !names.has(id));
  };
  const restoreMaterials = (): void => {
    albedo.clear();
    for (const [mesh, own] of swapped) mesh.material = own;
    swapped.clear();
    for (const hull of hulls.values()) hull.removeFromParent();
    hulls.clear();
  };
  const hooks = {
    /**
     * Place the display camera exactly: position and target in metres,
     * vertical field of view in degrees. Lifts the orbit's distance limits
     * and damping so the placement is not pulled back.
     */
    look: place,

    /**
     * Look at the whole subject from a named direction, framed as the
     * on-screen fit frames it. `distance` in metres and `fov` in degrees
     * replace the fitted values.
     */
    view: (
      name: HumanObservationView,
      options: { distance?: number; fov?: number; pitch?: number } = {},
    ): void => {
      const seen = subject();
      const fov = options.fov ?? camera.fov;
      const center: [number, number, number] =
        seen === null ? [0, 0, 0] : seen.center.toArray();
      const distance =
        options.distance ??
        (seen === null ? FALLBACK_DISTANCE : fitDistance(seen.radius, fov));
      place({
        ...placeHumanObservationCamera(name, center, distance, options.pitch),
        fov,
      });
    },

    /**
     * Frame a sphere of the displayed space, given as a centre and radius in
     * metres, from a named direction (front by default). This is the
     * zoom of a region review: the same call at a larger `fov`-independent
     * radius frames a joint or a seam, and a capture at a high pixel ratio
     * crops it after `finish`.
     */
    frame: (region: {
      center: readonly [number, number, number];
      radius: number;
      view?: HumanObservationView;
      fov?: number;
      pitch?: number;
    }): void => {
      const fov = region.fov ?? camera.fov;
      place({
        ...placeHumanObservationCamera(
          region.view ?? "front",
          region.center,
          fitDistance(region.radius, fov),
          region.pitch,
        ),
        fov,
      });
    },

    /**
     * Show only the named parts, or every part this stage hid again with
     * `null`. Returns the names no displayed part carries, so a misspelled
     * name shows as an unmatched entry and not as a blank frame.
     */
    isolate: (ids: readonly string[] | null): string[] => {
      engaged = true;
      isolated = ids === null ? null : new Set(ids);
      return unmatched(ids);
    },

    /**
     * Hide the named parts, or show every part this stage hid again with
     * `null`. Returns the names no displayed part carries.
     */
    hide: (ids: readonly string[] | null): string[] => {
      engaged = true;
      hidden.clear();
      for (const id of ids ?? []) hidden.add(id);
      return unmatched(ids);
    },

    /** Choose how the subject is drawn; `beauty` restores the product frame. */
    pass: (next: HumanObservationPass): void => {
      getHumanObservationPassDefinition(next);
      engaged = true;
      if (pass !== next) host.invalidateShadows?.();
      pass = next;
    },

    /** The names of the displayed parts, in scene order. */
    parts: (): string[] => meshes().map((mesh) => mesh.name),

    /** The current display state of the hooks. */
    state: (): {
      pass: HumanObservationPass;
      isolated: string[] | null;
      hidden: string[];
    } => ({
      pass,
      isolated: isolated === null ? null : [...isolated],
      hidden: [...hidden],
    }),
  };
  return {
    /** The hooks a review page exposes. */
    hooks,
    /** Restore borrowed display state before numerical publication/disposal; keep requested hooks. */
    restore: (): void => {
      restoreMaterials();
      for (const mesh of hiddenByUs) mesh.visible = true;
      hiddenByUs.clear();
    },
    /**
     * The material to draw the scene with: the pass when one is chosen, else
     * the clay material when the viewport's clay toggle is on, else none.
     */
    override: (clayEnabled: boolean): THREE.Material | null => {
      if (pass === "beauty") return clayEnabled ? host.clay : null;
      if (pass === "clay") return host.clay;
      if (pass === "outline" || pass === "albedo") return null;
      return materials[pass];
    },

    /** Bring the scene to the hooks' state; called by the viewport before each render. */
    apply: (): void => {
      if (!engaged) return;
      const shown = meshes();
      if (pass !== "albedo") albedo.clear();
      if (pass !== "outline") {
        for (const [mesh, own] of swapped) mesh.material = own;
        swapped.clear();
        for (const hull of hulls.values()) hull.removeFromParent();
        hulls.clear();
      }
      // Admission precedes visibility mutation so a refused new group remains intact.
      if (pass === "albedo") albedo.apply(shown);
      for (const mesh of shown) {
        const wanted =
          (isolated === null || isolated.has(mesh.name)) &&
          !hidden.has(mesh.name);
        if (!wanted && mesh.visible) {
          mesh.visible = false;
          hiddenByUs.add(mesh);
          host.invalidateShadows?.();
        } else if (wanted && hiddenByUs.delete(mesh)) {
          mesh.visible = true;
          host.invalidateShadows?.();
        }
      }
      // a mesh that left the roots is not this stage's to keep hidden
      for (const mesh of hiddenByUs)
        if (!shown.includes(mesh)) {
          mesh.visible = true;
          hiddenByUs.delete(mesh);
        }
      const seen = pass === "depth" || pass === "outline" ? subject() : null;
      if (pass === "depth" && seen !== null) {
        const distance = camera.position.distanceTo(seen.center);
        const uniforms = (materials.depth as THREE.ShaderMaterial).uniforms;
        uniforms.near.value = Math.max(0, distance - seen.radius);
        uniforms.far.value = distance + seen.radius;
      }
      // leave the outline pass: give every mesh its own material back and
      // drop the rims, including those of groups since replaced
      if (pass !== "outline") {
        return;
      }
      // the rim is a world-space shell, so its thickness for a constant screen
      // width is the world size of RIM_PIXELS at the subject's distance
      if (seen !== null)
        rim.uniforms.thickness.value =
          (RIM_PIXELS *
            2 *
            camera.position.distanceTo(seen.center) *
            Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) /
          Math.max(1, host.height());
      for (const mesh of [...hulls.keys(), ...swapped.keys()])
        if (!shown.includes(mesh)) {
          // a mesh that left the roots gets its own material back, so no
          // state of this stage outlives what it tracks
          const own = swapped.get(mesh);
          if (own !== undefined) mesh.material = own;
          hulls.get(mesh)?.removeFromParent();
          hulls.delete(mesh);
          swapped.delete(mesh);
        }
      for (const mesh of shown) {
        if (!swapped.has(mesh)) {
          swapped.set(mesh, mesh.material);
          mesh.material = white;
        }
        let hull = hulls.get(mesh);
        if (hull === undefined) {
          hull = new THREE.Mesh(mesh.geometry, rim);
          hull.raycast = () => {};
          hulls.set(mesh, hull);
          mesh.add(hull);
        }
        hull.visible = mesh.visible;
      }
    },
  };
}
