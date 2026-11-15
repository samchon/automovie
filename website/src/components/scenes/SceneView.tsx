"use client";

import {
  type Dispatch,
  type ReactElement,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { SCENE_REFUSAL } from "../../scenes/SCENE_REFUSAL";
import type { SceneClock } from "../../scenes/SceneClock";
import { loadScenePlayer } from "../../scenes/loadScenePlayer";
import type { IScene } from "../../scenes/structures/IScene";
import type { IScenePlayer } from "../../scenes/structures/IScenePlayer";
import { SharedStage } from "../../stage/SharedStage";

/**
 * One baked take drawn in a canvas through the page's shared renderer and
 * posed by a clock, fetched when the view first comes near the window. With
 * `orbit`, a drag or the arrow keys turn the camera about the action, the
 * wheel while the view has focus or plus and minus zoom, and a double-click
 * or the 0 key frames it again.
 *
 * While a take loads, the view says so; a take the packages refuse shows
 * their refusal, and one that fails to load its error. Each note is cleared
 * when the scene or the take changes. A decorative view, as in a card's
 * link, keeps its notes out of assistive technology, so they do not become
 * the link's name and a grid of cards raises no alert per card.
 *
 * @param props The scene, the take, the clock and whether the view orbits.
 * @returns The view.
 */
export function SceneView(props: SceneView.IProps): ReactElement {
  const canvas: RefObject<HTMLCanvasElement | null> = useRef(null);
  const [state, setState]: [string, Dispatch<SetStateAction<string>>] =
    useState<string>("loading");
  const [refusal, setRefusal]: [
    string | null,
    Dispatch<SetStateAction<string | null>>,
  ] = useState<string | null>(null);
  const { scene, take, clock, orbit }: SceneView.IProps = props;
  const name: string =
    props.label === undefined ? scene.title : `${scene.title}, ${props.label}`;

  // The latest callback is called, so a new function each render does not
  // load the take again.
  const callback: RefObject<SceneView.IProps["onLoad"]> = useRef(props.onLoad);
  callback.current = props.onLoad;

  useEffect((): (() => void) => {
    // A new take starts from loading, with no note of the one before.
    setState("loading");
    setRefusal(null);

    let alive: boolean = true;
    let player: IScenePlayer | null = null;
    let registration: SharedStage.IRegistration | null = null;
    let detach: (() => void) | null = null;
    // The take is fetched only when its view comes near the window, so a
    // page of cards loads the cards it shows.
    let cancel: () => void = (): void => undefined;
    const near: Promise<void> = new Promise((resolve: () => void): void => {
      if (canvas.current === null) return resolve();
      cancel = SharedStage.near(canvas.current, resolve);
    });
    near
      .then((): Promise<IScenePlayer> => loadScenePlayer(scene, take))
      .then((loaded: IScenePlayer): void => {
        if (!alive || canvas.current === null) {
          loaded.dispose();
          return;
        }
        player = loaded;
        let shown: number = -1;
        const registered: SharedStage.IRegistration = SharedStage.register({
          canvas: canvas.current,
          scene: loaded.scene,
          camera: loaded.camera,
          tick: (now: number): boolean => {
            const time: number = clock.advance(now);
            if (time === shown) return false;
            shown = time;
            loaded.seek(time);
            return true;
          },
        });
        registration = registered;
        const redraw: () => void = (): void => registered.invalidate();
        if (orbit === true)
          detach = attachOrbit(canvas.current, loaded, redraw);

        // A toolbar that moves the camera redraws through the registration,
        // since a paused clock draws nothing by itself.
        callback.current?.(loaded, redraw);
        setState("ready");
      })
      .catch((error: unknown): void => {
        if (!alive) return;
        if (error instanceof Error && error.name === SCENE_REFUSAL)
          setRefusal(error.message);
        setState(error instanceof Error ? error.message : String(error));
      });
    return (): void => {
      alive = false;
      cancel();
      detach?.();
      registration?.release();
      player?.dispose();
    };
  }, [scene, take, clock, orbit]);

  // A decorative view's notes are shown but not announced.
  const quiet: boolean = props.decorative === true;
  return (
    <div className="am-scene-view" aria-busy={state === "loading"}>
      <canvas
        ref={canvas}
        tabIndex={orbit === true ? 0 : -1}
        role={quiet ? undefined : orbit === true ? "application" : "img"}
        aria-hidden={quiet ? true : undefined}
        aria-label={
          quiet
            ? undefined
            : orbit === true
              ? `${name}: drag or the arrow keys turn it, the wheel or plus and minus zoom, 0 or a double-click frames it again`
              : name
        }
      />
      {state === "loading" ? (
        <p
          className="am-scene-view-note"
          role={quiet ? undefined : "status"}
          aria-hidden={quiet ? true : undefined}
        >
          Loading the take.
        </p>
      ) : state === "ready" ? null : refusal !== null ? (
        <p
          className="am-scene-view-note am-scene-view-refusal"
          role={quiet ? undefined : "note"}
          aria-hidden={quiet ? true : undefined}
        >
          Refused today
          {scene.refusedUntil === undefined
            ? ""
            : `, until #${scene.refusedUntil}`}
          : {refusal}
        </p>
      ) : (
        <p
          className="am-scene-view-note am-danger-text"
          role={quiet ? undefined : "alert"}
          aria-hidden={quiet ? true : undefined}
        >
          {state}
        </p>
      )}
    </div>
  );
}
export namespace SceneView {
  /** What a view draws. */
  export interface IProps {
    /** The scene's record. */
    scene: IScene;

    /** The take's index. */
    take: number;

    /** The clock that poses it. */
    clock: SceneClock;

    /** Whether a drag turns the camera. */
    orbit?: boolean;

    /** The take's label, named with the scene's title; the title alone when absent. */
    label?: string;

    /** Whether the picture is decoration beside its own visible name, as in a card's link, and so hidden from assistive technology with its notes. */
    decorative?: boolean;

    /**
     * Called with the loaded take, for a toolbar that moves its camera, and
     * with what redraws the view after such a move.
     */
    onLoad?: (player: IScenePlayer, redraw: () => void) => void;
  }
}

/** Turn and zoom a take's camera about the action with the pointer and the wheel. */
function attachOrbit(
  canvas: HTMLCanvasElement,
  player: IScenePlayer,
  changed: () => void,
): () => void {
  const centre: THREE.Vector3 = new THREE.Vector3(...player.centre);
  const offset: THREE.Vector3 = new THREE.Vector3();
  const spherical: THREE.Spherical = new THREE.Spherical();
  let from: { x: number; y: number } | null = null;

  const apply: (dAzimuth: number, dPolar: number, scale: number) => void = (
    dAzimuth: number,
    dPolar: number,
    scale: number,
  ): void => {
    offset.copy(player.camera.position).sub(centre);
    spherical.setFromVector3(offset);
    spherical.theta -= dAzimuth;
    spherical.phi = Math.min(
      Math.PI / 2 - 0.02,
      Math.max(0.05, spherical.phi - dPolar),
    );
    spherical.radius = Math.min(60, Math.max(1, spherical.radius * scale));
    player.camera.position.copy(centre).add(offset.setFromSpherical(spherical));
    player.camera.lookAt(centre);
    changed();
  };
  const down: (event: PointerEvent) => void = (event: PointerEvent): void => {
    from = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  };
  const move: (event: PointerEvent) => void = (event: PointerEvent): void => {
    if (from === null) return;
    apply(
      (event.clientX - from.x) * 0.008,
      (event.clientY - from.y) * 0.008,
      1,
    );
    from = { x: event.clientX, y: event.clientY };
  };
  const up: () => void = (): void => {
    from = null;
  };
  const wheel: (event: WheelEvent) => void = (event: WheelEvent): void => {
    // The wheel scrolls the page unless the view has focus or a key is held.
    if (document.activeElement !== canvas && !event.ctrlKey && !event.metaKey)
      return;
    event.preventDefault();
    apply(0, 0, Math.exp(event.deltaY * 0.001));
  };
  const double: () => void = (): void => {
    player.frame("three-quarter");
    changed();
  };
  const key: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
    // 0 frames the view again, as a double-click does.
    if (event.key === "0") {
      event.preventDefault();
      double();
      return;
    }
    const turns: Record<string, [number, number, number]> = {
      ArrowLeft: [-0.1, 0, 1],
      ArrowRight: [0.1, 0, 1],
      ArrowUp: [0, -0.08, 1],
      ArrowDown: [0, 0.08, 1],
      "+": [0, 0, 0.9],
      "=": [0, 0, 0.9],
      "-": [0, 0, 1.1],
    };
    const turn: [number, number, number] | undefined = turns[event.key];
    if (turn === undefined) return;
    event.preventDefault();
    apply(...turn);
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("dblclick", double);
  canvas.addEventListener("keydown", key);
  return (): void => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("wheel", wheel);
    canvas.removeEventListener("dblclick", double);
    canvas.removeEventListener("keydown", key);
  };
}
