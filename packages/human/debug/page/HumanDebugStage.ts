import { applyAutoMovieSectionPlanes } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import { placeHumanDebugCamera } from "./placeHumanDebugCamera";

/**
 * Scene, cameras, lights, section plane and axes of the page.
 *
 * Framing is `placeHumanDebugCamera`. Lighting follows the camera on every draw. `reference` keeps
 * the person capture's key at camera-space (1, 1.4, 0.7) times the focus diagonal with key 2.2 and
 * hemisphere 0.6. `raking` places the key in camera space at (cos e, 0, sin e) turned toward the
 * chosen screen side, e being `lightEl` above the screen plane, with hemisphere 0.08: the usual
 * grazing inspection light. Neither is a measured quantity. The section removes the half-space on
 * the + side of its axis (the - side with `sectionFlip`) through `sectionAt` or the focus centre.
 */
export class HumanDebugStage {
  /** Scene holding lights, axes and the content. */
  public readonly scene: THREE.Scene = new THREE.Scene();

  /** Root the owner adds content to; the section clips everything under it. */
  public readonly content: THREE.Group = new THREE.Group();

  /** Orbit, pan and zoom on the active camera. */
  public readonly orbit: OrbitControls;

  private readonly perspective: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);
  private readonly orthographic: THREE.OrthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 100);
  private readonly key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
  private readonly hemisphere: THREE.HemisphereLight = new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 0.6);
  private readonly axes: THREE.AxesHelper = new THREE.AxesHelper(1);
  private light: Pick<IHumanDebugOptions, "light" | "lightSide" | "lightEl"> = {
    light: "reference",
    lightSide: "left",
    lightEl: 10,
  };
  private diagonal: number = 1;

  /**
   * Create the scene and attach orbit controls.
   *
   * @param canvas Element receiving pointer input.
   * @param changed Called after every camera movement, so the owner draws on demand.
   */
  public constructor(canvas: HTMLCanvasElement, changed: () => void) {
    this.scene.add(this.hemisphere, this.key, this.key.target, this.content, this.axes);
    this.orbit = new OrbitControls(this.perspective, canvas);
    this.orbit.addEventListener("change", changed);
  }

  /** The camera the orbit drives and the renderer draws. */
  public get camera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.orbit.object as THREE.PerspectiveCamera | THREE.OrthographicCamera;
  }

  /**
   * Place the camera on the focus box and record the lighting.
   *
   * @param options Frame options; camera, light, background and axes fields are read.
   * @param focus Box to frame in metres, not empty.
   * @param aspect Drawing-buffer width over height.
   * @returns The placement facts.
   */
  public frame(options: IHumanDebugOptions, focus: THREE.Box3, aspect: number): Record<string, unknown> {
    const [az, el]: readonly [number, number] = HUMAN_DEBUG_CAMERAS[options.camera];
    const camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = options.ortho ? this.orthographic : this.perspective;
    this.perspective.fov = options.fov;
    const placement: Record<string, unknown> = placeHumanDebugCamera(
      camera,
      THREE.MathUtils.degToRad(options.az ?? az),
      THREE.MathUtils.degToRad(options.el ?? el),
      focus,
      aspect,
      options.target === null ? null : new THREE.Vector3(...options.target).divideScalar(1000),
      options.dist === null ? null : options.dist / 1000,
    );
    this.orbit.object = camera;
    this.orbit.target.fromArray(placement.target as number[]);
    this.orbit.update();
    this.style(options, focus);
    return { ...placement, name: options.camera };
  }

  /**
   * Set the lighting, background and axes without moving the camera.
   *
   * @param options Frame options.
   * @param focus Focus box in metres; the light distance and axes size scale with its diagonal.
   */
  public style(options: IHumanDebugOptions, focus: THREE.Box3): void {
    if (!focus.isEmpty()) this.diagonal = focus.getSize(new THREE.Vector3()).length();
    this.light = { light: options.light, lightSide: options.lightSide, lightEl: options.lightEl };
    this.scene.background = new THREE.Color("#" + options.bg);
    this.axes.visible = options.axes;
    if (!focus.isEmpty()) this.axes.position.copy(focus.min);
    this.axes.scale.setScalar(Math.max(1e-3, 0.25 * this.diagonal));
  }

  /**
   * Clip the content by the options' section plane, or release clipping.
   *
   * @param options Frame options; the section fields are read.
   * @param focus Focus box in metres, whose centre is the default plane position.
   * @param renderer Renderer whose local clipping switch is set.
   * @returns The plane position in mm, or null without a section.
   */
  public section(options: IHumanDebugOptions, focus: THREE.Box3, renderer: THREE.WebGLRenderer): number | null {
    if (options.section === "none") {
      applyAutoMovieSectionPlanes({ renderer, root: this.content, planes: [] });
      return null;
    }
    const axis: number = { x: 0, y: 1, z: 2 }[options.section];
    const at: number = options.sectionAt ?? focus.getCenter(new THREE.Vector3()).getComponent(axis) * 1000;
    const normal: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    normal[options.section] = options.sectionFlip ? -1 : 1;
    const point: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    point[options.section] = at / 1000;
    applyAutoMovieSectionPlanes({ renderer, root: this.content, planes: [{ normal, point }] });
    return at;
  }

  /** Advance the orbit and place the key light for the recorded profile; call before every draw. */
  public follow(): void {
    this.orbit.update();
    const camera: THREE.Camera = this.camera;
    camera.updateMatrixWorld();
    const e: number = THREE.MathUtils.degToRad(this.light.lightEl);
    const side: Record<IHumanDebugOptions["lightSide"], THREE.Vector3> = {
      left: new THREE.Vector3(-Math.cos(e), 0, Math.sin(e)),
      right: new THREE.Vector3(Math.cos(e), 0, Math.sin(e)),
      top: new THREE.Vector3(0, Math.cos(e), Math.sin(e)),
      bottom: new THREE.Vector3(0, -Math.cos(e), Math.sin(e)),
    };
    const offset: THREE.Vector3 =
      this.light.light === "reference" ? new THREE.Vector3(1, 1.4, 0.7) : side[this.light.lightSide];
    this.key.position
      .copy(this.orbit.target)
      .add(offset.applyQuaternion(camera.quaternion).multiplyScalar(Math.max(this.diagonal, 1e-3)));
    this.key.target.position.copy(this.orbit.target);
    this.key.target.updateMatrixWorld();
    this.key.intensity = 2.2;
    this.hemisphere.intensity = this.light.light === "reference" ? 0.6 : 0.08;
  }

  /**
   * Fit both projections to a new drawing-buffer aspect without moving the camera.
   *
   * @param aspect Width over height.
   */
  public resize(aspect: number): void {
    this.perspective.aspect = aspect;
    this.perspective.updateProjectionMatrix();
    const half: number = this.orthographic.top;
    this.orthographic.left = -half * aspect;
    this.orthographic.right = half * aspect;
    this.orthographic.updateProjectionMatrix();
  }

  /** Remove the orbit listeners and release the axes helper. */
  public dispose(): void {
    this.orbit.dispose();
    this.axes.dispose();
  }
}
