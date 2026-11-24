import {
  invalidateAutoMovieSceneShadowPrograms,
  renderAutoMovieScenePass,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Exercises public material update notifications when effective shadow policy
 * changes and restores.
 *
 * Scenarios:
 *
 * 1. Empty scenes are accepted and shared/array/override materials each receive
 *    one version update.
 * 2. Changed enablement and filtering update both apply/restore boundaries;
 *    unchanged policy sends no update.
 * 3. An actual owned material subclass rejects updates, preserving both failure
 *    causes and restoring renderer policy.
 */
export function test_unit_render_scene_render_scene_pass(): void {
  const empty: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  invalidateAutoMovieSceneShadowPrograms(empty);
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene(),
    first: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial(),
    second: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(),
    override: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial(),
    geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
  scene.add(
    new THREE.Mesh(geometry, first),
    new THREE.Mesh(geometry, [first, second]),
    new THREE.Line(new THREE.BufferGeometry(), second),
    new THREE.Group(),
  );
  scene.overrideMaterial = override;
  const versions: number[] = [first.version, second.version, override.version];
  invalidateAutoMovieSceneShadowPrograms(scene);
  TestValidator.equals(
    "unique materials and override each change once",
    [first.version, second.version, override.version],
    versions.map((value: number): number => value + 1),
  );
  scene.overrideMaterial = null;
  const renderer: THREE.WebGLRenderer = {
    getRenderTarget: (): null => null,
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    shadowMap: { enabled: true, type: THREE.PCFShadowMap },
    render: (): undefined => undefined,
  } as unknown as THREE.WebGLRenderer;
  const environment: {
    image: null;
    background: null;
    intensity: number;
    rotationDeg: number;
    exposure: number;
    toneMapping: "none";
    shadows: { enabled: boolean; type: "pcf" };
  } = {
    image: null,
    background: null,
    intensity: 1,
    rotationDeg: 0,
    exposure: 1,
    toneMapping: "none" as const,
    shadows: { enabled: false, type: "pcf" as const },
  };
  const before: number = first.version;
  renderAutoMovieScenePass(
    renderer,
    scene,
    new THREE.Camera(),
    environment,
    "beauty",
  );
  TestValidator.equals(
    "changed shadow enablement invalidates apply and restore",
    first.version,
    before + 2,
  );
  const same: number = first.version;
  renderAutoMovieScenePass(
    renderer,
    scene,
    new THREE.Camera(),
    { ...environment, shadows: { enabled: true, type: "pcf" } },
    "beauty",
  );
  TestValidator.equals(
    "unchanged shadow policy sends no material update",
    first.version,
    same,
  );
  renderAutoMovieScenePass(
    renderer,
    scene,
    new THREE.Camera(),
    { ...environment, shadows: { enabled: true, type: "vsm" } },
    "beauty",
  );
  TestValidator.equals(
    "changed filter invalidates both boundaries",
    first.version,
    same + 2,
  );
  const failure: Error = new Error("program update rejected");
  class RejectingMaterial extends THREE.MeshBasicMaterial {
    public override set needsUpdate(value: boolean) {
      if (value) throw failure;
    }
  }
  const failedScene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene(),
    failedMaterial: RejectingMaterial = new RejectingMaterial();
  failedMaterial.needsUpdate = false;
  failedScene.add(new THREE.Mesh(geometry, failedMaterial));
  let caught: unknown;
  try {
    renderAutoMovieScenePass(
      renderer,
      failedScene,
      new THREE.Camera(),
      environment,
      "beauty",
    );
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "apply and restoration update failures remain visible",
    caught instanceof AggregateError &&
      caught.errors[0] === failure &&
      caught.errors[1] === failure,
  );
  TestValidator.equals(
    "failed material update still restores renderer shadow policy",
    [renderer.shadowMap.enabled, renderer.shadowMap.type],
    [true, THREE.PCFShadowMap],
  );
  failedMaterial.dispose();
  first.dispose();
  second.dispose();
  override.dispose();
  geometry.dispose();
}
