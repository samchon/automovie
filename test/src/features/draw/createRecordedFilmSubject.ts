import { sequenceTimeline } from "@automovie/engine";
import type {
  IAutoMovieFilmOptics,
  IAutoMovieSequence,
  IAutoMovieShot,
  IAutoMovieTransition,
} from "@automovie/interface";
import type { IAutoMovieDrawScene } from "@automovie/render";
import * as THREE from "three";

/**
 * A draw subject of two shots that records every placement and every reader
 * asked of it, in order: shot A, trimmed to its seconds 1 to 3 so its clock
 * runs one second ahead of the output clock, then shot B through `transition`
 * at 1 s, or through a hard cut at 2 s when it is null.
 *
 * `seek` records `seek` with its second, `seekShot` records `seekShot` with the
 * shot and its shot-local time and second, `beforeDraw` records `beforeDraw`
 * with its second, and `optics`, when asked, records `optics` with its second
 * and answers a 180° shutter over two samples. The scene has a backdrop so a
 * pass that removes it is observed, and one box, `hero`, five metres down −Z at
 * x = −1 while shot A is placed and x = 1 while shot B is, so a trail or a
 * framing box tells which shot each placement showed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A double for the draw film tests; it asserts nothing itself.
 * @evidence contracts/development/testing.md#independent-expectations The cut is hand-laid: A from 0 to 2 s on its clock 1 + t, and B from 1 s through the transition or from 2 s at a hard cut, its clock starting at 0.
 * @evidence contracts/development/testing.md#distinguishing-cases The caller chooses the transition, whether `seekShot` and `optics` exist, so a subject that cannot place a shot or has no optics is told apart.
 * @evidence contracts/development/testing.md#execution-ownership In-memory only; no renderer or GPU starts.
 */
export function createRecordedFilmSubject(props: {
  /** The transition into shot B, or null for a hard cut. */
  transition: IAutoMovieTransition | null;

  /** Whether the subject supplies `seekShot`. */
  seekShot: boolean;

  /** Whether the subject supplies `optics`. */
  optics: boolean;
}): createRecordedFilmSubject.IDouble {
  const calls: createRecordedFilmSubject.ICall[] = [];
  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: null,
    fps: 24,
    shots: [
      { shot: "shot:a", trim: { start: 1, duration: 2 }, transition: null },
      { shot: "shot:b", trim: null, transition: props.transition },
    ],
  };
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0x203040);
  const hero: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshBasicMaterial(),
  );
  hero.name = "hero";
  hero.position.set(-1, 0, -5);
  scene.add(hero);
  const start: number = props.transition === null ? 2 : 1;
  const show: (shot: string) => void = (shot: string): void => {
    hero.position.x = shot === "shot:a" ? -1 : 1;
    scene.updateMatrixWorld(true);
  };
  const subject: IAutoMovieDrawScene = {
    scene,
    camera: new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100),
    durationSeconds: props.transition === null ? 6 : 5,
    fps: 24,
    width: 64,
    height: 36,
    sequence,
    cut: sequenceTimeline(sequence, [shot("shot:a", 3), shot("shot:b", 4)]),
    seek: async (seconds: number): Promise<void> => {
      calls.push({ name: "seek", shot: null, numbers: [seconds] });
      show(seconds < start ? "shot:a" : "shot:b");
    },
    ...(props.seekShot
      ? {
          seekShot: async (
            name: string,
            time: number,
            seconds: number,
          ): Promise<void> => {
            calls.push({
              name: "seekShot",
              shot: name,
              numbers: [time, seconds],
            });
            show(name);
          },
        }
      : {}),
    beforeDraw: (_renderer: THREE.WebGLRenderer, seconds: number): void => {
      calls.push({ name: "beforeDraw", shot: null, numbers: [seconds] });
    },
    ...(props.optics
      ? {
          optics: (seconds: number): IAutoMovieFilmOptics => {
            calls.push({ name: "optics", shot: null, numbers: [seconds] });
            return {
              ev100: 10,
              toneMapping: "none",
              samples: 2,
              shutter: { angle: 180 },
            };
          },
        }
      : {}),
    dispose: (): void => {},
  };
  return { subject, calls };
}

/** An authored empty-motion shot of the given id and length. */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-room",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}

/** Types of the recording film subject. */
export namespace createRecordedFilmSubject {
  /** The subject and what was asked of it. */
  export interface IDouble {
    /** The draw subject. */
    subject: IAutoMovieDrawScene;

    /** Every placement and reading, in order. */
    calls: ICall[];
  }

  /** One recorded call. */
  export interface ICall {
    /** `seek`, `seekShot`, `beforeDraw` or `optics`. */
    name: string;

    /** The shot `seekShot` placed, or null for any other call. */
    shot: string | null;

    /**
     * The numeric arguments: the second, or for `seekShot` the shot-local time
     * and the second.
     */
    numbers: number[];
  }
}
