import type * as THREE from "three";

import type { IScene } from "./IScene";

/** A loaded take, ready to be posed at any second and drawn. */
export interface IScenePlayer {
  /** What to draw. */
  scene: THREE.Scene;

  /** The camera, framed on the action. */
  camera: THREE.PerspectiveCamera;

  /** The film's length, seconds. */
  duration: number;

  /** Frames a second the take was baked at. */
  fps: number;

  /** The middle of the action, world metres, which the camera orbits. */
  centre: [number, number, number];

  /**
   * Pose everything at a second.
   *
   * @param seconds The film second; held at the ends outside the film.
   */
  seek(seconds: number): void;

  /**
   * Move the camera to a named view of the action.
   *
   * @param view The view.
   */
  frame(view: IScene.ICamera["view"]): void;

  /** Release what the take holds. */
  dispose(): void;
}
