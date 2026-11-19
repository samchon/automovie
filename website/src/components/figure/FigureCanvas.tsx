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

import { BakedClient } from "../../baked/BakedClient";
import { FigurePoster } from "../../baked/FigurePoster";
import { FigureProjection } from "../../baked/FigureProjection";
import type { IScene } from "../../scenes/structures/IScene";
import type { ITake } from "../../takes/structures/ITake";

/**
 * A baked take drawn flat on a 2D canvas and played in a loop: each figure
 * as the still draws it, with three faint poses a fraction of a second
 * behind it and the last second of its hands' paths, so the motion reads as
 * a moving chronophotograph. It loads no 3D code, so a landing page plays
 * it at once.
 *
 * While out of the window it stops drawing. Under reduced motion it shows
 * the poster still and plays only when asked.
 *
 * @param props What to play and how.
 * @returns The canvas.
 */
export function FigureCanvas(props: FigureCanvas.IProps): ReactElement {
  const canvas: RefObject<HTMLCanvasElement | null> = useRef(null);
  const [state, setState]: [State, Dispatch<SetStateAction<State>>] = useState<State>(
    "loading",
  );
  const playing: RefObject<boolean> = useRef(true);
  const onTime: RefObject<FigureCanvas.IProps["onTime"]> = useRef(props.onTime);
  onTime.current = props.onTime;
  const onLoad: RefObject<FigureCanvas.IProps["onLoad"]> = useRef(props.onLoad);
  onLoad.current = props.onLoad;

  // Draws again after the play state changes; set by the effect.
  const wake: RefObject<() => void> = useRef((): void => undefined);

  useEffect((): (() => void) => {
    const element: HTMLCanvasElement | null = canvas.current;
    if (element === null) return (): void => undefined;
    let alive: boolean = true;
    let frame: number = 0;
    let visible: boolean = true;
    let take: ITake | null = null;
    let fit: IFit | null = null;
    let clock: number = 0;
    let last: number = performance.now();
    const reduced: boolean = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    playing.current = !reduced;
    const camera: FigureProjection.ICamera = FigureProjection.camera(props.view);

    // One frame: advance the clock while playing, paint, and ask for the
    // next frame only while playing and seen, so a paused or hidden canvas
    // costs nothing.
    const draw: (now: number) => void = (now: number): void => {
      frame = 0;
      if (!alive || take === null || fit === null) return;
      if (playing.current) clock += ((now - last) / 1000) * (props.speed ?? 1);
      last = now;
      const from: number = props.from ?? 0;
      const length: number = Math.max(0.1, take.duration - from);
      const seconds: number = from + (clock % length);
      paint(element, take, fit, camera, seconds, from);
      onTime.current?.(seconds, take.duration);
      if (playing.current && visible) frame = requestAnimationFrame(draw);
    };
    const kick: () => void = (): void => {
      if (!alive || frame !== 0) return;
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };
    wake.current = kick;

    BakedClient.take(props.kind, props.id)
      .then((loaded: ITake): void => {
        if (!alive) return;
        take = loaded;
        fit = frame0(loaded, camera, props.from ?? 0);
        onLoad.current?.(loaded);
        clock = reduced ? (props.still ?? 0) : 0;
        setState(reduced ? "paused" : "playing");
        kick();
      })
      .catch((): void => {
        if (alive) setState("failed");
      });
    const observer: IntersectionObserver = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        visible = entries.some((e: IntersectionObserverEntry): boolean => e.isIntersecting);
        if (visible) kick();
      },
    );
    observer.observe(element);

    // A held picture is painted again when the canvas changes size.
    const resized: ResizeObserver = new ResizeObserver(kick);
    resized.observe(element);
    return (): void => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resized.disconnect();
    };
  }, [props.kind, props.id, props.view, props.from, props.speed, props.still]);

  return (
    <div className="am-figure-canvas" data-state={state}>
      {state === "loading" || state === "failed" ? (
        <img
          className="am-figure-canvas-poster"
          src={BakedClient.address(props.kind, props.id, "svg")}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      {props.label === "" ? (
        <canvas ref={canvas} aria-hidden="true" />
      ) : (
        <canvas ref={canvas} role="img" aria-label={props.label} />
      )}
      {state === "playing" || state === "paused" ? (
        <button
          type="button"
          className="am-figure-canvas-toggle"
          onClick={(): void => {
            playing.current = !playing.current;
            setState(playing.current ? "playing" : "paused");
            wake.current();
          }}
        >
          {state === "playing" ? "Pause" : "Play"}
        </button>
      ) : null}
    </div>
  );
}
export namespace FigureCanvas {
  /** What a figure canvas plays. */
  export interface IProps {
    /** Whether the take is a scene's or a motion's. */
    kind: BakedClient.Kind;

    /** The scene's id or the motion's name. */
    id: string;

    /** The view it is seen from. */
    view: IScene.ICamera["view"];

    /** What the canvas shows, for assistive technology; empty when it is decoration beside its own visible name. */
    label: string;

    /** Seconds the loop starts from, such as after a trial's opening stand. */
    from?: number;

    /** Playback rate; 1 when absent. */
    speed?: number;

    /** The second shown, paused, under reduced motion. */
    still?: number;

    /** Called each drawn frame with the second shown and the take's length. */
    onTime?: (seconds: number, duration: number) => void;

    /** Called once with the take when it has loaded. */
    onLoad?: (take: ITake) => void;
  }
}

/** Where a figure canvas is: loading its take, playing, paused, or failed to load. */
type State = "loading" | "playing" | "paused" | "failed";

/** The drawing's fixed framing: the centre and scale every frame is drawn at. */
interface IFit {
  /** The screen point drawn at the middle, metres right. */
  cx: number;

  /** The screen point drawn at the middle, metres up. */
  cy: number;

  /** Metres the drawing's width spans. */
  span: number;
}

/** The framing that holds every figure over the whole take, so the camera does not move. */
function frame0(
  take: ITake,
  camera: FigureProjection.ICamera,
  from: number,
): IFit {
  let x0: number = Infinity;
  let y0: number = Infinity;
  let x1: number = -Infinity;
  let y1: number = -Infinity;
  for (let s: number = from; s <= take.duration; s += 0.25)
    for (const figure of FigureProjection.sample(take, s, camera).figures)
      for (const p of Object.values(figure)) {
        x0 = Math.min(x0, p.x);
        y0 = Math.min(y0, p.y);
        x1 = Math.max(x1, p.x);
        y1 = Math.max(y1, p.y);
      }
  return {
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
    span: Math.max(x1 - x0, (y1 - y0) * 1.3) + 0.6,
  };
}

/** Draw one instant: the floor, the trailing poses, the hands' paths and the figures. */
function paint(
  canvas: HTMLCanvasElement,
  take: ITake,
  fit: IFit,
  camera: FigureProjection.ICamera,
  seconds: number,
  from: number,
): void {
  // Match the backing store to the displayed size.
  const ratio: number = Math.min(2, window.devicePixelRatio || 1);
  const width: number = Math.round(canvas.clientWidth * ratio);
  const height: number = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const g: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (g === null || width === 0 || height === 0) return;
  const scale: number = Math.min(width, height * 1.3) / fit.span;
  const at: (p: FigureProjection.IPoint) => [number, number] = (
    p: FigureProjection.IPoint,
  ): [number, number] => [
    width / 2 + (p.x - fit.cx) * scale,
    height / 2 - (p.y - fit.cy) * scale,
  ];
  g.fillStyle = FigurePoster.COLOUR.ground;
  g.fillRect(0, 0, width, height);

  // The floor, a metre between lines, around the figures' hips.
  const now: FigureProjection.IFrame = FigureProjection.sample(take, seconds, camera);
  g.strokeStyle = FigurePoster.COLOUR.grid;
  g.lineWidth = ratio;
  g.beginPath();
  const xs: number[] = now.hips.map((h: [number, number, number]): number => h[0]);
  const zs: number[] = now.hips.map((h: [number, number, number]): number => h[2]);
  const gx: number = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const gz: number = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
  for (let k: number = -4; k <= 4; k++) {
    for (const [a, b] of [
      [[gx + k, 0, gz - 4], [gx + k, 0, gz + 4]],
      [[gx - 4, 0, gz + k], [gx + 4, 0, gz + k]],
    ] as [number, number, number][][]) {
      const [ax, ay]: [number, number] = at(FigureProjection.project(a!, camera));
      const [bx, by]: [number, number] = at(FigureProjection.project(b!, camera));
      g.moveTo(ax, ay);
      g.lineTo(bx, by);
    }
  }
  g.stroke();

  // Faint poses behind, at a fixed lag.
  for (const [lag, alpha] of [
    [0.36, 0.09],
    [0.24, 0.13],
    [0.12, 0.18],
  ] as const)
    if (seconds - lag >= from)
      figures(g, FigureProjection.sample(take, seconds - lag, camera), at, scale, alpha);

  // The hands' paths over the last second, fading out behind.
  g.lineWidth = 1.6 * ratio;
  g.lineCap = "round";
  for (let f: number = 0; f < now.figures.length; f++)
    for (const bone of ["leftMiddleProximal", "rightMiddleProximal"]) {
      let previous: [number, number] | null = null;
      for (let s: number = Math.max(from, seconds - 1); s <= seconds; s += 1 / 30) {
        const p: FigureProjection.IPoint | undefined = FigureProjection.sample(take, s, camera)
          .figures[f]?.[bone];
        if (p === undefined) continue;
        const point: [number, number] = at(p);
        if (previous !== null) {
          g.strokeStyle = FigurePoster.COLOUR.path;
          g.globalAlpha = 0.15 + 0.6 * (1 - (seconds - s));
          g.beginPath();
          g.moveTo(...previous);
          g.lineTo(...point);
          g.stroke();
        }
        previous = point;
      }
    }
  g.globalAlpha = 1;
  figures(g, now, at, scale, 1);
}

/** Draw every figure of a frame as capsules, farther ones lighter. */
function figures(
  g: CanvasRenderingContext2D,
  frame: FigureProjection.IFrame,
  at: (p: FigureProjection.IPoint) => [number, number],
  scale: number,
  alpha: number,
): void {
  g.lineCap = "round";
  frame.figures.forEach((figure: FigureProjection.IFigure, index: number): void => {
    const colour: string =
      FigurePoster.COLOUR.figures[index % FigurePoster.COLOUR.figures.length]!;
    for (const capsule of FigureProjection.capsules(figure)) {
      g.globalAlpha =
        alpha * (capsule.nearness >= 0.5 ? 1 : 0.72 + 0.56 * capsule.nearness);
      const [ax, ay]: [number, number] = at(capsule.a);
      if (capsule.a === capsule.b) {
        g.fillStyle = colour;
        g.beginPath();
        g.arc(ax, ay, capsule.radius * scale, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      const [bx, by]: [number, number] = at(capsule.b);
      g.strokeStyle = colour;
      g.lineWidth = capsule.radius * 2 * scale;
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(bx, by);
      g.stroke();
    }
  });
  g.globalAlpha = 1;
}
