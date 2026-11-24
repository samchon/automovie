import type { IAutoMovieFilmIndirectRenderer } from "@automovie/render";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * A recording renderer that can also clear and read back, for the film's probe
 * bake: every `render` is logged with the state it ran under (as
 * `createFilmResponseRendererDouble` logs it), every `clear` with the clear
 * colour and alpha in force, and every read-back fills the buffer with the
 * value `texel` gives for the render target and the read count.
 */
export function test_unit_render_draw_createProbeRendererDouble(props: {
  /** The value every read-back texel channel takes, by read index. */
  texel: (read: number) => number;
}): createProbeRendererDouble.IDouble {
  const base: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const clears: createProbeRendererDouble.IClear[] = [];
  const color: THREE.Color = new THREE.Color(0.5, 0.5, 0.5);
  let alpha: number = 1;
  let reads: number = 0;
  // The base double's own object gains the bake members, so its log reads the
  // state the stage sets on this same object.
  const renderer: IAutoMovieFilmIndirectRenderer = Object.assign(
    base.renderer,
    {
      getClearColor: (target: THREE.Color): THREE.Color => target.copy(color),
      getClearAlpha: (): number => alpha,
      setClearColor: (
        next: THREE.ColorRepresentation,
        nextAlpha?: number,
      ): void => {
        color.set(next);
        alpha = nextAlpha ?? 1;
      },
      clear: (): void => {
        clears.push({ color: color.getHex(), alpha });
      },
      readRenderTargetPixels: (
        _target: THREE.WebGLRenderTarget,
        _x: number,
        _y: number,
        _width: number,
        _height: number,
        buffer: Float32Array,
      ): void => {
        buffer.fill(props.texel(reads++));
      },
    },
  );
  return {
    renderer,
    renders: base.renders,
    clears,
    reads: (): number => reads,
  };
}
/** Types of the probe-bake renderer double. */
export namespace createProbeRendererDouble {
  /** The double and its logs. */
  export interface IDouble {
    /** The renderer to hand to the stage. */
    renderer: IAutoMovieFilmIndirectRenderer;

    /** Every render call, in order. */
    renders: createFilmResponseRendererDouble.IRender[];

    /** Every clear, in order. */
    clears: IClear[];

    /** How many read-backs ran. */
    reads: () => number;
  }

  /** One clear and the colour in force. */
  export interface IClear {
    /** Clear colour as a hex number. */
    color: number;

    /** Clear alpha. */
    alpha: number;
  }
}
