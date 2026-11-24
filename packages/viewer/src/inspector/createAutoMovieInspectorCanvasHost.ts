import * as THREE from "three";

import { playAutoMovieSoundtrack } from "../audio/playAutoMovieSoundtrack.js";
import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";

/**
 * The browser's scene host for one canvas: a `WebGLRenderer` drawing into it,
 * the window's animation frames, the canvas's layout size with the device pixel
 * ratio, and sound.
 *
 * Each `createRenderer` call makes a new renderer on the same canvas, which
 * reuses the canvas's context, so a mount after a dispose draws; the mount
 * disposes each renderer without losing the context. A canvas that has no
 * layout size yet reports zero, and the mount skips drawing until it has one.
 *
 * Sound reads a production-relative file by fetching it from the page's own
 * origin, where the production's development server serves its root, and
 * decodes a master in a new `AudioContext`, which `playAutoMovieSoundtrack`
 * plays; each play resumes the context, which a browser holds suspended until a
 * gesture such as the play button.
 */
export function createAutoMovieInspectorCanvasHost(
  canvas: HTMLCanvasElement,
): IAutoMovieInspectorSceneHost {
  const view: Window = canvas.ownerDocument.defaultView ?? window;
  return {
    createRenderer: (): IAutoMovieInspectorSceneHost.IRenderer =>
      new THREE.WebGLRenderer({ canvas, antialias: true }),
    requestFrame: (callback: (nowMs: number) => void): number =>
      view.requestAnimationFrame(callback),
    cancelFrame: (handle: number): void => view.cancelAnimationFrame(handle),
    size: (): IAutoMovieInspectorSceneHost.ISize => ({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      pixelRatio: view.devicePixelRatio,
    }),
    sound: {
      read: async (file: string): Promise<Uint8Array> => {
        const response: Response = await view.fetch(
          new URL(file, `${view.location.origin}/`),
        );
        if (!response.ok)
          throw new Error(`No sound file "${file}" (${response.status})`);
        return new Uint8Array(await response.arrayBuffer());
      },
      load: async (
        wav: Uint8Array,
      ): Promise<IAutoMovieInspectorSceneHost.ISoundtrack> => {
        const context: AudioContext = new AudioContext();
        const master: AudioBuffer = await context.decodeAudioData(
          wav.slice().buffer,
        );
        let stop: () => void = (): void => {};
        return {
          play: (seconds: number, rate: number): void => {
            stop();
            void context.resume();
            stop = playAutoMovieSoundtrack(context, master, seconds, rate);
          },
          stop: (): void => {
            stop();
            stop = (): void => {};
          },
          dispose: (): void => {
            stop();
            void context.close();
          },
        };
      },
    },
  };
}
