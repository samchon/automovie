import * as THREE from "three";

import { createAutoMovieResourceRetirement } from "../../../createAutoMovieResourceRetirement.js";
import { reportAutoMovieResourceRetirement } from "../../../reportAutoMovieResourceRetirement.js";
import type { HumanObservationPass } from "./HumanObservationPass.js";
import type { HumanObservationView } from "./HumanObservationView.js";
import type { IHumanObservationHooks } from "./IHumanObservationHooks.js";
import { HumanObservationOutlineMesh } from "./HumanObservationOutlineMesh.js";
import { createHumanObservationAlbedoPass } from "./createHumanObservationAlbedoPass.js";
import { getHumanObservationBounds } from "./getHumanObservationBounds.js";
import { getHumanObservationPassDefinition } from "./getHumanObservationPassDefinition.js";
import { isHumanObservationAuxiliary } from "./isHumanObservationAuxiliary.js";
import { placeHumanObservationCamera } from "./placeHumanObservationCamera.js";

/** Width of the outline pass rim on screen, CSS pixels. */
const RIM_PIXELS: number = 2;
/** Distance used before any subject is displayed, metres. */
const FALLBACK_DISTANCE: number = 0.65;

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
 * Restoration stays synchronous and attempts independent material, hull and
 * visibility reversals even when a disposer fails. Close first withdraws these
 * borrowed changes synchronously, then retires this owner's pass materials
 * with one shared completion. Subject geometry, clay, source textures and GPU
 * context remain borrowed. Callers withdraw drawing before closing this owner.
 * Departed roots restore their material, hull and visibility independently;
 * the still-shown outline population keeps its admitted replacements.
 *
 * @param host The viewport's scene graph and orbit.
 * @param host.scene Scene whose override material carries the pass.
 * @param host.camera Perspective display camera.
 * @param host.orbit Orbit controls whose limits are lifted for exact placement.
 * @param host.roots Displayed subject groups, in the scene.
 * @param host.clay The viewport's grey material, shared with its clay toggle.
 * @param host.height Height of the drawing surface in CSS pixels, which sets the outline's width.
 * @param host.invalidateShadows Notify the viewport when its cached caster display changes.
 * @param host.invalidateDisplay Notify the owning completion producer after explicit camera, pass or visibility changes.
 *
 * @evidence contracts/common.md#principled-implementation Current root meshes and posed world bounds drive canonical camera framing and inspection passes; exact look restores Cartesian values after native orbit synchronization. Finite valid camera/sphere inputs remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design One display owner tracks requested pass/isolation/hiding, borrowing numerical geometry/camera/orbit while helpers own canonical view, bounds and albedo material rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown names refuse before requested state changes and source-hidden meshes remain hidden. Visual-only outline shells implement Three's raycast dispatch in their own Mesh subclass without replacing acquired foreign methods, changing layers or altering render values. These calculations supply no raster observation or physiological acceptance.
 * @evidence contracts/common.md#meaningful-documentation Documents metre/degree framing, root-versus-companion scope, deferred apply/finish, synchronous borrowed-state withdrawal and independently awaited owned material retirement.
 * @evidence contracts/performance.md#efficient-algorithms Mesh collection traverses reached scene nodes and framing samples posed vertices; restoration and shown-population membership use identity Sets rather than repeated array scans. Temporary material/hull work follows changed root population, while native posed/instanced bounds remain their owner's cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed pass materials and canonical view/bounds helpers are shared; mutable root/transform state is reread. Close shares one completion/cause and departed roots restore their own borrowed state without resetting still-shown outline ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns six fixed pass materials plus albedo replacements and input-sized hull/swapped/hidden maps until restoration/close, without a count cap. Close first restores borrowed visibility/material/override synchronously and independently retires owned materials; geometry/source textures/clay/GPU context remain borrowed.
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
  /** Notify the display owner after an explicit view, pass or visibility request. */
  invalidateDisplay?: () => void;
}): {
  hooks: IHumanObservationHooks;
  close: () => Promise<void>;
  settleRetirements: () => Promise<void>;
  restore: () => void;
  override: (clayEnabled: boolean) => THREE.Material | null;
  apply: () => void;
} {
  const { camera, orbit }: Pick<typeof host, "camera" | "orbit"> = host;
  const originalOverride: THREE.Material | null = host.scene.overrideMaterial;
  let closed: boolean = false;
  const requireOpen: () => void = (): void => {
    if (closed) throw new Error("This observation owner has been closed.");
  };
  let pass: HumanObservationPass = "beauty";
  let isolated: Set<string> | null = null;
  const hidden: Set<string> = new Set<string>();
  // the meshes this stage hid, so that it restores only those and never
  // shows a mesh something else hid
  const hiddenByUs: Set<THREE.Mesh> = new Set<THREE.Mesh>();
  // nothing is written to the scene until a hook is used
  let engaged: boolean = false;
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
  const white: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(
    getHumanObservationPassDefinition("outline").parameters,
  );
  const albedo: ReturnType<typeof createHumanObservationAlbedoPass> = createHumanObservationAlbedoPass();
  const swapped: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  // the silhouette rim is the back faces pushed out along their normals
  const rim: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { thickness: { value: 0 } },
    vertexShader: `uniform float thickness;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix *
    vec4(position + normalize(normal) * thickness, 1.0);
}`,
    fragmentShader: "void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }",
  });
  const hulls: Map<THREE.Mesh, THREE.Mesh> = new Map<THREE.Mesh, THREE.Mesh>();
  const ownedMaterials: Set<THREE.Material> = new Set([...Object.values(materials), white, rim]);

  const meshes: () => THREE.Mesh[] = (): THREE.Mesh[] => {
    const found: Set<THREE.Mesh> = new Set<THREE.Mesh>();
    for (const root of host.roots())
      root.traverse((object: THREE.Object3D) : void => {
        const mesh: THREE.Mesh = object as THREE.Mesh;
        if (
          mesh.isMesh === true &&
          !isHull(mesh) &&
          !isHumanObservationAuxiliary(mesh)
        )
          found.add(mesh);
      });
    return [...found];
  };
  const isHull: (mesh: THREE.Mesh) => boolean = (mesh: THREE.Mesh): boolean => mesh.material === rim;
  const subject: () => { center: THREE.Vector3; radius: number } | null = (): { center: THREE.Vector3; radius: number } | null => {
    const box: THREE.Box3 = getHumanObservationBounds(meshes());
    if (box.isEmpty()) return null;
    const sphere: THREE.Sphere = box.getBoundingSphere(new THREE.Sphere());
    return { center: sphere.center, radius: sphere.radius };
  };
  const fitDistance: (radius: number, fov?: number) => number = (radius: number, fov: number = camera.fov): number => {
    const vertical: number = THREE.MathUtils.degToRad(fov / 2);
    const horizontal: number = Math.atan(Math.tan(vertical) * camera.aspect);
    return (1.1 * radius) / Math.sin(Math.min(vertical, horizontal));
  };
  const place: IHumanObservationHooks["look"] = (view: {
    position: readonly [number, number, number];
    target: readonly [number, number, number];
    fov: number;
  }): void => {
    requireOpen();
    orbit.enableDamping = false;
    orbit.minDistance = 0;
    orbit.maxDistance = Infinity;
    orbit.target.set(...view.target);
    camera.position.set(...view.position);
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
    orbit.update();
    // Native orbit synchronization may round the supplied Cartesian placement.
    // This hook owns exact position/target; retain both after synchronization.
    orbit.target.set(...view.target);
    camera.position.set(...view.position);
    camera.lookAt(orbit.target);
    camera.updateMatrixWorld(true);
    host.invalidateDisplay?.();
  };

  const unmatched: (ids: readonly string[] | null) => string[] = (ids: readonly string[] | null): string[] => {
    const names: Set<string> = new Set(meshes().map((mesh: THREE.Mesh) : string => mesh.name));
    return (ids ?? []).filter((id: string) : boolean => !names.has(id));
  };
  const restoreOutline: (selected?: readonly THREE.Mesh[]) => void = (
    selected: readonly THREE.Mesh[] = [...new Set([...swapped.keys(), ...hulls.keys()])],
  ): void => {
    const selectedMeshes: Set<THREE.Mesh> = new Set(selected);
    reportAutoMovieResourceRetirement([
    ...[...swapped].filter(([mesh]: [THREE.Mesh, THREE.Material | THREE.Material[]]) : boolean => selectedMeshes.has(mesh)).map(([mesh, own]: [THREE.Mesh, THREE.Material | THREE.Material[]]) : () => void => () : void => {
      mesh.material = own;
      swapped.delete(mesh);
    }),
    ...[...hulls].filter(([mesh]: [THREE.Mesh, THREE.Mesh]) : boolean => selectedMeshes.has(mesh)).map(([mesh, hull]: [THREE.Mesh, THREE.Mesh]) : () => void => () : void => {
      hull.removeFromParent();
      hulls.delete(mesh);
    }),
    ]);
  };
  const restoreMaterials: () => void = (): void => reportAutoMovieResourceRetirement([
    () : void => albedo.clear(), restoreOutline,
  ]);
  const restoreHidden: (selected?: readonly THREE.Mesh[]) => void = (selected: readonly THREE.Mesh[] = [...hiddenByUs]): void => reportAutoMovieResourceRetirement(
    selected.map((mesh: THREE.Mesh) : () => void => () : void => { mesh.visible = true; hiddenByUs.delete(mesh); }),
  );
  const withdrawalFailures: unknown[] = [];
  const retirement: () => Promise<void> = createAutoMovieResourceRetirement([
    () : void => reportAutoMovieResourceRetirement(withdrawalFailures.map((error: unknown) : () => void => () : void => { throw error; })),
    (): Promise<void> => albedo.close(),
    ...[...ownedMaterials].map((material: THREE.Material) : () => void => () : void => material.dispose()),
  ]);
  const close: () => Promise<void> = (): Promise<void> => {
    const completion: Promise<void> = retirement();
    if (!closed) {
      closed = true;
      try {
        reportAutoMovieResourceRetirement([
          () : void => albedo.restoreBorrowed(), restoreOutline, restoreHidden,
          () : void => {
            if (host.scene.overrideMaterial !== null && ownedMaterials.has(host.scene.overrideMaterial))
              host.scene.overrideMaterial = originalOverride;
          },
        ]);
      } catch (error) { withdrawalFailures.push(error); }
    }
    return completion;
  };
  const hooks: IHumanObservationHooks = {
    /** Actual display camera and orbit target in metres, with vertical field of view in degrees. */
    camera: () : ReturnType<IHumanObservationHooks["camera"]> => ({
      position: camera.position.toArray(),
      target: orbit.target.toArray(),
      fov: camera.fov,
      near: camera.near,
      far: camera.far,
      aspect: camera.aspect,
    }),
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
      const seen: { center: THREE.Vector3; radius: number } | null = subject();
      const fov: number = options.fov ?? camera.fov;
      const center: [number, number, number] =
        seen === null ? [0, 0, 0] : seen.center.toArray();
      const distance: number =
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
      const fov: number = region.fov ?? camera.fov;
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
     * name refuses before changing the prior selection or display state.
     */
    isolate: (ids: readonly string[] | null): string[] => {
      requireOpen();
      const missing: string[] = unmatched(ids);
      if (missing.length !== 0) return missing;
      engaged = true;
      isolated = ids === null ? null : new Set(ids);
      host.invalidateDisplay?.();
      return missing;
    },

    /**
     * Hide the named parts, or show every part this stage hid again with
     * `null`. Unknown names refuse before changing the prior selection.
     */
    hide: (ids: readonly string[] | null): string[] => {
      requireOpen();
      const missing: string[] = unmatched(ids);
      if (missing.length !== 0) return missing;
      engaged = true;
      hidden.clear();
      for (const id of ids ?? []) hidden.add(id);
      host.invalidateDisplay?.();
      return missing;
    },

    /** Choose how the subject is drawn; `beauty` restores the product frame. */
    pass: (next: HumanObservationPass): void => {
      requireOpen();
      getHumanObservationPassDefinition(next);
      engaged = true;
      if (pass !== next) host.invalidateShadows?.();
      pass = next;
      host.invalidateDisplay?.();
    },

    /** The names of the displayed parts, in scene order. */
    parts: (): string[] => meshes().map((mesh: THREE.Mesh) : string => mesh.name),

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
    /** End owned pass materials once, restoring borrowed state before returning the completion. */
    close,
    /** Await actual failed retirements; closing callers share the complete owner result. */
    settleRetirements: (): Promise<void> => closed ? retirement() : albedo.settleRetirements(),
    /** Restore borrowed display state before numerical publication/disposal; keep requested hooks. */
    restore: (): void => {
      reportAutoMovieResourceRetirement([restoreMaterials, restoreHidden]);
    },
    /**
     * The material to draw the scene with: the pass when one is chosen, else
     * the clay material when the viewport's clay toggle is on, else none.
     */
    override: (clayEnabled: boolean): THREE.Material | null => {
      requireOpen();
      if (pass === "beauty") return clayEnabled ? host.clay : null;
      if (pass === "clay") return host.clay;
      if (pass === "outline" || pass === "albedo") return null;
      return materials[pass];
    },

    /** Bring the scene to the hooks' state; called by the viewport before each render. */
    apply: (): void => {
      requireOpen();
      if (!engaged) return;
      const shown: THREE.Mesh[] = meshes();
      const shownMeshes: Set<THREE.Mesh> = new Set(shown);
      const outlineRestore: THREE.Mesh[] = [...new Set([...swapped.keys(), ...hulls.keys()])]
        .filter((mesh: THREE.Mesh) : boolean => pass !== "outline" || !shownMeshes.has(mesh));
      const hiddenRestore: THREE.Mesh[] = [...hiddenByUs].filter((mesh: THREE.Mesh) : boolean => !shownMeshes.has(mesh));
      reportAutoMovieResourceRetirement([
        () : void => { if (pass !== "albedo") albedo.clear(); },
        () : void => restoreOutline(outlineRestore),
        () : void => restoreHidden(hiddenRestore),
      ]);
      requireOpen();
      // Admission precedes visibility mutation so a refused new group remains intact.
      if (pass === "albedo") albedo.apply(shown);
      requireOpen();
      for (const mesh of shown) {
        const wanted: boolean =
          (isolated === null || isolated.has(mesh.name)) &&
          !hidden.has(mesh.name);
        if (!wanted && mesh.visible) {
          mesh.visible = false;
          hiddenByUs.add(mesh);
          host.invalidateShadows?.();
        } else if (wanted && hiddenByUs.has(mesh)) {
          mesh.visible = true;
          hiddenByUs.delete(mesh);
          host.invalidateShadows?.();
        }
      }
      const seen: { center: THREE.Vector3; radius: number } | null = pass === "depth" || pass === "outline" ? subject() : null;
      if (pass === "depth" && seen !== null) {
        const distance: number = camera.position.distanceTo(seen.center);
        const uniforms: THREE.ShaderMaterial["uniforms"] = (materials.depth as THREE.ShaderMaterial).uniforms;
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
      for (const mesh of shown) {
        if (!swapped.has(mesh)) {
          swapped.set(mesh, mesh.material);
          mesh.material = white;
        }
        let hull: THREE.Mesh | undefined = hulls.get(mesh);
        if (hull === undefined) {
          hull = new HumanObservationOutlineMesh(mesh.geometry, rim);
          hulls.set(mesh, hull);
          mesh.add(hull);
        }
        hull.visible = mesh.visible;
      }
    },
  };
}
