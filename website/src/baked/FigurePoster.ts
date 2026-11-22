import type { SceneTrack } from "../scenes/SceneTrack";
import type { IScene } from "../scenes/structures/IScene";
import type { ITake } from "../takes/structures/ITake";
import { FigureProjection } from "./FigureProjection";
import type { PropShapes } from "./PropShapes";

/**
 * Draws a take as a still in the manner of a chronophotograph: each figure's
 * most extended pose solid, a few poses around it faint behind it, and the
 * paths its hands travel as thin lines. Every line comes from the take's own
 * bone placements through `FigureProjection`, so the still shows the
 * performance the player plays without drawing it in WebGL.
 *
 * The output is SVG text with fixed colours on its own ground, because an
 * image does not read the page's theme.
 */
export namespace FigurePoster {
  /** Width of the drawing, in its own units. */
  export const WIDTH: number = 480;

  /** Height of the drawing. */
  export const HEIGHT: number = 360;

  /** The colours of a still: its ground, the floor lines, each performer in turn, and the paths. */
  export const COLOUR: {
    ground: string;
    grid: string;
    figures: readonly string[];
    path: string;
  } = {
    ground: "#e9e7e1",
    grid: "#d5d1c7",
    figures: ["#262a31", "#46597a", "#7a5a3a", "#3f6b5a"],
    path: "#d0861b",
  };

  /** What to draw and how. */
  export interface IOptions {
    /** The view the scene opens with. */
    view: IScene.ICamera["view"];

    /** Seconds before which nothing is drawn, such as a trial's opening stand. */
    from?: number;

    /** Faint poses drawn behind each figure's key pose. */
    ghosts?: number;

    /**
     * Seconds around the key pose that the faint poses and the paths cover;
     * the whole drawn take when absent. A long scene keeps them near the key
     * pose, so a walk across the floor does not scatter them.
     */
    window?: number;

    /** The props' meshes, in the take's prop order; none drawn when absent. */
    props?: readonly PropShapes.IShape[];
  }

  /** The joints whose paths are drawn: the hands. */
  const PATHS: readonly string[] = [
    "leftMiddleProximal",
    "rightMiddleProximal",
  ];

  /** Each limb end and the joint its reach is measured from, which choose the key pose. */
  const REACH: readonly [string, string][] = [
    ["leftMiddleProximal", "chest"],
    ["rightMiddleProximal", "chest"],
    ["leftFoot", "hips"],
    ["rightFoot", "hips"],
  ];

  /** A box on the screen. */
  interface IBox {
    /** Left edge, screen metres. */
    x0: number;

    /** Bottom edge. */
    y0: number;

    /** Right edge. */
    x1: number;

    /** Top edge. */
    y1: number;
  }

  /**
   * Draw a take.
   *
   * @param take The take.
   * @param options The view and what to draw.
   * @returns The SVG text.
   */
  export function draw(take: ITake, options: IOptions): string {
    const from: number = Math.min(options.from ?? 0, take.duration);
    const ghosts: number = options.ghosts ?? 4;
    const camera: FigureProjection.ICamera = FigureProjection.camera(
      options.view,
    );

    // Sample the take at its own rate from the first drawn second.
    const frames: FigureProjection.IFrame[] = [];
    for (let k: number = 0; k < take.track.frames; k++) {
      const seconds: number = Math.min(take.duration, k / take.track.fps);
      if (seconds + 1e-9 >= from)
        frames.push(FigureProjection.sample(take, seconds, camera));
    }
    if (frames.length === 0)
      frames.push(FigureProjection.sample(take, from, camera));

    // The key frame is where the limbs reach farthest from the trunk; the
    // ghosts and paths cover the window around it.
    const key: number = extreme(frames);
    const half: number =
      options.window === undefined
        ? frames.length
        : Math.round((options.window * take.track.fps) / 2);
    const lo: number = Math.max(0, key - half);
    const hi: number = Math.min(frames.length - 1, key + half);
    const span: FigureProjection.IFrame[] = frames.slice(lo, hi + 1);
    const chosen: number[] = spread(span.length, key - lo, ghosts).map(
      (k: number): number => k + lo,
    );

    // Fit every drawn point.
    const box: IBox = {
      x0: Infinity,
      y0: Infinity,
      x1: -Infinity,
      y1: -Infinity,
    };
    const shapes: readonly PropShapes.IShape[] = options.props ?? [];
    for (const index of [...chosen, key]) {
      for (const figure of frames[index]!.figures)
        for (const point of Object.values(figure)) grow(box, point);
      for (const polygon of outlines(frames[index]!, shapes, camera))
        for (const point of polygon.points) grow(box, point);
    }
    for (const frame of span)
      for (const figure of frame.figures)
        for (const bone of PATHS)
          if (figure[bone] !== undefined) grow(box, figure[bone]!);
    const margin: number = 0.25;
    const scale: number =
      Math.min(
        WIDTH / (box.x1 - box.x0 + margin * 2),
        HEIGHT / (box.y1 - box.y0 + margin * 2),
      ) * 0.92;
    const cx: number = (box.x0 + box.x1) / 2;
    const cy: number = (box.y0 + box.y1) / 2;
    const px: (p: FigureProjection.IPoint) => [string, string] = (
      p: FigureProjection.IPoint,
    ): [string, string] => [
      round(WIDTH / 2 + (p.x - cx) * scale),
      round(HEIGHT / 2 - (p.y - cy) * scale),
    ];

    const out: string[] = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
      `<rect width="${WIDTH}" height="${HEIGHT}" fill="${COLOUR.ground}"/>`,
      grid(frames[key]!, camera, px),
    ];

    // Ghosts, faintest first, then the paths, then the key pose on top.
    chosen.forEach((index: number, order: number): void => {
      const opacity: number = 0.1 + (0.14 * (order + 1)) / chosen.length;
      out.push(
        `<g opacity="${round(opacity, 2)}">${scene(frames[index]!, shapes, camera, px, scale)}</g>`,
      );
    });
    out.push(paths(span, px));
    out.push(scene(frames[key]!, shapes, camera, px, scale));
    out.push("</svg>");
    return out.join("");
  }

  /** The frame whose hands and feet reach farthest from the trunk on the screen, summed over the figures. */
  function extreme(frames: FigureProjection.IFrame[]): number {
    let best: number = 0;
    let most: number = -1;
    frames.forEach((frame: FigureProjection.IFrame, k: number): void => {
      let sum: number = 0;
      for (const figure of frame.figures)
        for (const [end, root] of REACH) {
          const a: FigureProjection.IPoint | undefined = figure[end];
          const b: FigureProjection.IPoint | undefined = figure[root];
          if (a !== undefined && b !== undefined)
            sum += Math.hypot(a.x - b.x, a.y - b.y);
        }
      if (sum > most) {
        most = sum;
        best = k;
      }
    });
    return best;
  }

  /** Ghost frames spread over a span, leaving out those next to the key frame. */
  function spread(count: number, key: number, ghosts: number): number[] {
    if (count < 3 || ghosts <= 0) return [];
    const out: Set<number> = new Set<number>();
    for (let i: number = 0; i < ghosts; i++) {
      const k: number = Math.round(((i + 0.5) / ghosts) * (count - 1));
      if (Math.abs(k - key) > count / (ghosts * 3)) out.add(k);
    }
    return [...out].sort((a: number, b: number): number => a - b);
  }

  /** One drawn piece of a frame, a prop's mesh or a whole figure, with its depth toward the viewer. */
  interface IDrawn {
    /** Metres toward the viewer; larger is drawn later. */
    depth: number;

    /** Its SVG text. */
    text: string;
  }

  /** One outlined mesh of a prop on the screen. */
  interface IOutline {
    /** Its colour. */
    colour: string;

    /** Its opacity. */
    opacity: number;

    /** Its hull, in order around it. */
    points: FigureProjection.IPoint[];

    /** Its mean depth toward the viewer. */
    depth: number;
  }

  /** Every prop mesh of a frame, outlined by the hull of its projected points. */
  function outlines(
    frame: FigureProjection.IFrame,
    shapes: readonly PropShapes.IShape[],
    camera: FigureProjection.ICamera,
  ): IOutline[] {
    const out: IOutline[] = [];
    shapes.forEach((shape: PropShapes.IShape, i: number): void => {
      const placed: SceneTrack.IPlacement | undefined = frame.props[i];
      if (placed === undefined) return;
      for (const part of shape.parts) {
        const projected: FigureProjection.IPoint[] = [];
        for (let k: number = 0; k + 2 < part.points.length; k += 3)
          projected.push(
            FigureProjection.project(
              FigureProjection.place(
                [part.points[k]!, part.points[k + 1]!, part.points[k + 2]!],
                placed,
              ),
              camera,
            ),
          );
        if (projected.length < 2) continue;
        out.push({
          colour: part.colour,
          opacity: part.opacity,
          points: hull(projected),
          depth:
            projected.reduce((sum: number, p): number => sum + p.depth, 0) /
            projected.length,
        });
      }
    });
    return out;
  }

  /** The convex hull of points on the screen, by the monotone chain. */
  function hull(points: FigureProjection.IPoint[]): FigureProjection.IPoint[] {
    const sorted: FigureProjection.IPoint[] = [...points].sort(
      (a: FigureProjection.IPoint, b: FigureProjection.IPoint): number =>
        a.x - b.x || a.y - b.y,
    );
    const cross: (
      o: FigureProjection.IPoint,
      a: FigureProjection.IPoint,
      b: FigureProjection.IPoint,
    ) => number = (
      o: FigureProjection.IPoint,
      a: FigureProjection.IPoint,
      b: FigureProjection.IPoint,
    ): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: FigureProjection.IPoint[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0)
        lower.pop();
      lower.push(p);
    }
    const upper: FigureProjection.IPoint[] = [];
    for (const p of sorted.reverse()) {
      while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0)
        upper.pop();
      upper.push(p);
    }
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }

  /** A frame's props and figures in painter's order: whatever is farther first. */
  function scene(
    frame: FigureProjection.IFrame,
    shapes: readonly PropShapes.IShape[],
    camera: FigureProjection.ICamera,
    px: (p: FigureProjection.IPoint) => [string, string],
    scale: number,
  ): string {
    const drawn: IDrawn[] = [
      ...outlines(frame, shapes, camera).map(
        (outline: IOutline): IDrawn => ({
          depth: outline.depth,
          text: `<path d="M${outline.points.map((p: FigureProjection.IPoint): string => px(p).join(" ")).join("L")}Z" fill="${outline.colour}" stroke="${outline.colour}" stroke-width="1.5" stroke-linejoin="round"${outline.opacity < 1 ? ` opacity="${round(outline.opacity, 2)}"` : ""}/>`,
        }),
      ),
      ...figures(frame, px, scale).map(
        (text: string, f: number): IDrawn => ({
          depth: frame.figures[f]?.["hips"]?.depth ?? 0,
          text,
        }),
      ),
    ];
    return drawn
      .sort((a: IDrawn, b: IDrawn): number => a.depth - b.depth)
      .map((d: IDrawn): string => d.text)
      .join("");
  }

  /** Every figure of a frame, each in its colour, farther capsules lighter. */
  function figures(
    frame: FigureProjection.IFrame,
    px: (p: FigureProjection.IPoint) => [string, string],
    scale: number,
  ): string[] {
    return frame.figures.map(
      (figure: FigureProjection.IFigure, index: number): string => {
        const colour: string = COLOUR.figures[index % COLOUR.figures.length]!;
        const parts: string[] = FigureProjection.capsules(figure).map(
          (capsule: FigureProjection.ICapsule): string => {
            const [ax, ay]: [string, string] = px(capsule.a);
            const [bx, by]: [string, string] = px(capsule.b);
            const shape: string =
              capsule.a === capsule.b
                ? `<circle cx="${ax}" cy="${ay}" r="${round(capsule.radius * scale)}" fill="${colour}" stroke="none"/>`
                : `<path d="M${ax} ${ay}L${bx} ${by}" stroke-width="${round(capsule.radius * 2 * scale)}"/>`;
            return capsule.nearness >= 0.5
              ? shape
              : `<g opacity="${round(0.72 + 0.56 * capsule.nearness, 2)}">${shape}</g>`;
          },
        );
        return `<g stroke="${colour}" stroke-linecap="round" fill="none">${parts.join("")}</g>`;
      },
    );
  }

  /** The paths of every figure's hands over a span. */
  function paths(
    span: FigureProjection.IFrame[],
    px: (p: FigureProjection.IPoint) => [string, string],
  ): string {
    const out: string[] = [];
    const count: number = span[0]!.figures.length;
    for (let f: number = 0; f < count; f++)
      for (const bone of PATHS) {
        const points: string[] = span
          .map(
            (
              frame: FigureProjection.IFrame,
            ): FigureProjection.IPoint | undefined => frame.figures[f]?.[bone],
          )
          .filter(
            (
              p: FigureProjection.IPoint | undefined,
            ): p is FigureProjection.IPoint => p !== undefined,
          )
          .map((p: FigureProjection.IPoint): string => px(p).join(" "));
        if (points.length > 1) out.push(`<path d="M${points.join("L")}"/>`);
      }
    return `<g stroke="${COLOUR.path}" stroke-width="1.4" fill="none" stroke-linejoin="round" opacity="0.75">${out.join("")}</g>`;
  }

  /** Floor lines a metre apart around the key frame's figures. */
  function grid(
    frame: FigureProjection.IFrame,
    camera: FigureProjection.ICamera,
    px: (p: FigureProjection.IPoint) => [string, string],
  ): string {
    const xs: number[] = frame.hips.map(
      (p: [number, number, number]): number => p[0],
    );
    const zs: number[] = frame.hips.map(
      (p: [number, number, number]): number => p[2],
    );
    const x0: number = Math.floor(Math.min(...xs)) - 2;
    const x1: number = Math.ceil(Math.max(...xs)) + 2;
    const z0: number = Math.floor(Math.min(...zs)) - 2;
    const z1: number = Math.ceil(Math.max(...zs)) + 2;
    const at: (x: number, z: number) => string = (
      x: number,
      z: number,
    ): string => px(FigureProjection.project([x, 0, z], camera)).join(" ");
    const lines: string[] = [];
    for (let x: number = x0; x <= x1; x++)
      lines.push(`M${at(x, z0)}L${at(x, z1)}`);
    for (let z: number = z0; z <= z1; z++)
      lines.push(`M${at(x0, z)}L${at(x1, z)}`);
    return `<path d="${lines.join("")}" stroke="${COLOUR.grid}" stroke-width="1" fill="none"/>`;
  }

  /** Widen a box to hold a point. */
  function grow(box: IBox, p: FigureProjection.IPoint): void {
    box.x0 = Math.min(box.x0, p.x);
    box.y0 = Math.min(box.y0, p.y);
    box.x1 = Math.max(box.x1, p.x);
    box.y1 = Math.max(box.y1, p.y);
  }

  /** A number with few decimals, so the text stays short. */
  function round(value: number, digits: number = 1): string {
    return Number(value.toFixed(digits)).toString();
  }
}
