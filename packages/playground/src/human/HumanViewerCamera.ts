import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { HumanCaptureCamera } from "./HumanCaptureCamera";

/**
 * The interactive camera of the Human page: a perspective and an orthographic
 * camera sharing one OrbitControls, with the key light following the view.
 *
 * {@link HumanViewerCamera.place} positions whichever projection the
 * descriptor asks for with {@link HumanCaptureCamera.place}, the rule PNG
 * captures use, so a view set on the page and the same URL fetched as a PNG
 * show the same framing apart from the viewport aspect. Orbiting keeps the
 * key light at the capture rule's camera-relative offset. `onChange` reports
 * every camera movement so the page can draw on demand.
 *
 * @evidence contracts/common.md#principled-implementation Delegates placement to HumanCaptureCamera.place and moves OrbitControls between the two cameras by its public `object` field, so orbit, pan and zoom keep working in both projections.
 * @evidence contracts/common.md#clear-and-simple-design Owns cameras, controls and light following; scene, renderer and model stay with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No projection-specific framing constants beyond the capture rule.
 * @evidence contracts/common.md#meaningful-documentation States the shared rule, the light behaviour and the change callback.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per placement, resize or light update.
 * @evidence contracts/performance.md#reuse-equivalent-work Two cameras and one controls instance serve the page's whole life.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the controls' DOM listeners; dispose removes them.
 */
export class HumanViewerCamera {
  private readonly perspective: THREE.PerspectiveCamera =
    new THREE.PerspectiveCamera(HumanCaptureCamera.fov, 1, 0.01, 100);
  private readonly orthographic: THREE.OrthographicCamera =
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  private readonly controls: OrbitControls;
  private aspect: number = 1;

  /**
   * Create both cameras and attach orbit controls to the canvas.
   *
   * @param canvas Element receiving pointer input.
   * @param onChange Called after every camera movement.
   */
  public constructor(canvas: HTMLCanvasElement, onChange: () => void) {
    this.perspective.position.set(4, 1, 4);
    this.controls = new OrbitControls(this.perspective, canvas);
    this.controls.addEventListener("change", onChange);
  }

  /** The camera currently driven by the controls; rendering and picking read it here. */
  public get active(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.controls.object as
      | THREE.PerspectiveCamera
      | THREE.OrthographicCamera;
  }

  /**
   * Place the projection the descriptor selects and orbit around its target.
   *
   * @param key Key light to place with the camera.
   * @param descriptor Camera direction, region and overrides.
   * @param whole Whole-model surface bounds.
   * @returns The placement facts.
   *
   * @evidence contracts/common.md#principled-implementation Uses the capture placement with the viewport aspect, then hands the placed camera to the controls with the placement target.
   * @evidence contracts/common.md#clear-and-simple-design The only way the page moves its camera to a named or free view.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Placement errors propagate unchanged.
   * @evidence contracts/common.md#meaningful-documentation States the aspect difference from captures.
   * @evidence contracts/performance.md#efficient-algorithms One placement.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses both cameras.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires nothing.
   */
  public place(
    key: THREE.DirectionalLight,
    descriptor: HumanCaptureCamera.IDescriptor,
    whole: THREE.Box3,
  ): HumanCaptureCamera.IPlacement {
    const camera: THREE.PerspectiveCamera | THREE.OrthographicCamera =
      descriptor.orthographic === true ? this.orthographic : this.perspective;
    const placement: HumanCaptureCamera.IPlacement = HumanCaptureCamera.place(
      camera,
      key,
      descriptor,
      whole,
      this.aspect,
    );
    this.controls.object = camera;
    this.controls.target.fromArray(placement.target);
    this.controls.update();
    return placement;
  }

  /**
   * Adapt both projections to a new viewport aspect.
   *
   * @param aspect Viewport width over height.
   *
   * @evidence contracts/common.md#principled-implementation Perspective takes the aspect directly; orthographic keeps its half height and rescales its width.
   * @evidence contracts/common.md#clear-and-simple-design Called by the page's resize check.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Both cameras stay consistent even when inactive.
   * @evidence contracts/common.md#meaningful-documentation States each projection's rule.
   * @evidence contracts/performance.md#efficient-algorithms Constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Updates the existing cameras.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires nothing.
   */
  public resize(aspect: number): void {
    this.aspect = aspect;
    this.perspective.aspect = aspect;
    this.perspective.updateProjectionMatrix();
    const half: number = this.orthographic.top;
    this.orthographic.left = -half * aspect;
    this.orthographic.right = half * aspect;
    this.orthographic.updateProjectionMatrix();
  }

  /**
   * Advance the controls and keep the key light at the capture offset.
   *
   * @param key Key light to move.
   * @param diagonal Whole-model diagonal in metres, the light offset scale.
   *
   * @evidence contracts/common.md#principled-implementation Applies the capture rule's (1, 1.4, 0.7) camera-space offset times the diagonal around the orbit target.
   * @evidence contracts/common.md#clear-and-simple-design Called once per drawn frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Same offset as captures, so interactive shading matches PNGs.
   * @evidence contracts/common.md#meaningful-documentation States the offset source.
   * @evidence contracts/performance.md#efficient-algorithms Constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the light.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires nothing.
   */
  public follow(key: THREE.DirectionalLight, diagonal: number): void {
    this.controls.update();
    const camera: THREE.Camera = this.active;
    camera.updateMatrixWorld();
    key.position
      .copy(this.controls.target)
      .add(
        new THREE.Vector3(1, 1.4, 0.7)
          .applyQuaternion(camera.quaternion)
          .multiplyScalar(diagonal),
      );
    key.target.position.copy(this.controls.target);
    key.target.updateMatrixWorld();
  }

  /**
   * Remove the controls' listeners.
   *
   * @evidence contracts/common.md#principled-implementation OrbitControls.dispose removes every listener it added.
   * @evidence contracts/common.md#clear-and-simple-design Part of the page teardown.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Errors propagate.
   * @evidence contracts/common.md#meaningful-documentation States what is released.
   * @evidence contracts/performance.md#efficient-algorithms Constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Nothing survives.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Leaves no listener.
   */
  public dispose(): void {
    this.controls.dispose();
  }
}
