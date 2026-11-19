import { SceneTrack } from "../scenes/SceneTrack";
import type { IScene } from "../scenes/structures/IScene";
import type { ITake } from "../takes/structures/ITake";

/**
 * A take's figures seen orthographically from a named view, as flat capsules:
 * the trunk, the limbs, the hands, the feet and the head of the polygon man,
 * each from one joint's placement to another's. The still a card shows and
 * the drawing the landing page animates both come from here, so they draw
 * the same body from the same take.
 */
export namespace FigureProjection {
  /** The screen axes of a view: right, up, and toward the viewer. */
  export interface ICamera {
    /** Screen right, a world unit vector. */
    right: [number, number, number];

    /** Screen up, a world unit vector. */
    up: [number, number, number];

    /** Toward the viewer, a world unit vector; larger depth is nearer. */
    toward: [number, number, number];
  }

  /** A projected joint: screen metres and depth toward the viewer. */
  export interface IPoint {
    /** Metres right of the world origin on the screen. */
    x: number;

    /** Metres up on the screen. */
    y: number;

    /** Metres toward the viewer. */
    depth: number;
  }

  /** One figure at one instant: each drawn joint by bone name, projected, plus `crown` for the head. */
  export type IFigure = Record<string, IPoint>;

  /** Every figure at one instant, with each figure's hip in the world for the floor, and every prop's frame. */
  export interface IFrame {
    /** The figures, in the take's order. */
    figures: IFigure[];

    /** Each figure's hip, world metres. */
    hips: [number, number, number][];

    /** Each prop's frame in the world, in the take's order. */
    props: SceneTrack.IPlacement[];
  }

  /** One capsule ready to draw. */
  export interface ICapsule {
    /** Where it starts on the screen. */
    a: IPoint;

    /** Where it ends; equal to `a` for the head. */
    b: IPoint;

    /** Half its thickness, metres. */
    radius: number;

    /** 0 for the farthest capsule of the figure, 1 for the nearest. */
    nearness: number;
  }

  /** One drawn capsule of a body: from one bone's joint to another's. */
  interface ISegment {
    /** Bone the capsule starts at. */
    from: string;

    /** Bone it ends at. */
    to: string;

    /** Half its thickness, metres. */
    radius: number;
  }

  /** The capsules of the polygon man that are drawn. */
  const SEGMENTS: readonly ISegment[] = [
    { from: "hips", to: "spine", radius: 0.12 },
    { from: "spine", to: "chest", radius: 0.11 },
    { from: "chest", to: "neck", radius: 0.12 },
    { from: "neck", to: "atlas", radius: 0.05 },
    ...(["left", "right"] as const).flatMap(
      (side: "left" | "right"): ISegment[] => [
        { from: "hips", to: `${side}UpperLeg`, radius: 0.085 },
        { from: `${side}UpperLeg`, to: `${side}LowerLeg`, radius: 0.075 },
        { from: `${side}LowerLeg`, to: `${side}Foot`, radius: 0.055 },
        { from: `${side}Foot`, to: `${side}Midfoot`, radius: 0.034 },
        { from: `${side}Midfoot`, to: `${side}HalluxProximal`, radius: 0.028 },
        { from: "chest", to: `${side}UpperArm`, radius: 0.05 },
        { from: `${side}UpperArm`, to: `${side}LowerArm`, radius: 0.046 },
        { from: `${side}LowerArm`, to: `${side}Hand`, radius: 0.038 },
        { from: `${side}Hand`, to: `${side}MiddleProximal`, radius: 0.034 },
      ],
    ),
  ];

  /** Radius of the head, metres. */
  const HEAD: number = 0.1;

  /** The direction each named view looks from, as the 3D player's views do. */
  const VIEWS: Readonly<
    Record<IScene.ICamera["view"], [number, number, number]>
  > = {
    "three-quarter": [0.62, 0.42, 0.66],
    front: [0, 0.28, 1],
    side: [1, 0.28, 0],
    top: [0, 1, 0.02],
  };

  /**
   * The camera of a named view.
   *
   * @param view The view.
   * @returns Its screen axes.
   */
  export function camera(view: IScene.ICamera["view"]): ICamera {
    const toward: [number, number, number] = normalize(VIEWS[view]);

    // A view from straight above keeps world -Z as its up.
    const worldUp: [number, number, number] =
      Math.abs(toward[1]) > 0.95 ? [0, 0, -1] : [0, 1, 0];
    const right: [number, number, number] = normalize(cross(worldUp, toward));
    const up: [number, number, number] = cross(toward, right);
    return { right, up, toward };
  }

  /**
   * Every figure's drawn joints at a second.
   *
   * @param take The take.
   * @param seconds The film second.
   * @param view The camera.
   * @returns The projected frame.
   */
  export function sample(take: ITake, seconds: number, view: ICamera): IFrame {
    const groups: SceneTrack.IPlacement[][] = SceneTrack.sample(
      take.track,
      seconds,
    );
    const m: number[] = take.reflection;
    const hips: [number, number, number][] = [];
    const figures: IFigure[] = take.figures.map(
      (_figure: ITake.IFigure, f: number): IFigure => {
        const out: IFigure = {};
        for (const placed of groups[f]!) {
          const [x, y, z]: [number, number, number] = placed.position;

          // Human's own frame to the world, by the column-major reflection.
          const p: [number, number, number] = [
            m[0]! * x + m[4]! * y + m[8]! * z + m[12]!,
            m[1]! * x + m[5]! * y + m[9]! * z + m[13]!,
            m[2]! * x + m[6]! * y + m[10]! * z + m[14]!,
          ];
          if (placed.bone === "hips") hips.push(p);
          out[placed.bone] = project(p, view);
        }

        // The head's centre, a head's radius past the atlas along the neck.
        const atlas: IPoint | undefined = out["atlas"];
        const neck: IPoint | undefined = out["neck"];
        if (atlas !== undefined && neck !== undefined) {
          const dx: number = atlas.x - neck.x;
          const dy: number = atlas.y - neck.y;
          const length: number = Math.hypot(dx, dy) || 1;
          const reach: number = HEAD * Math.min(1, length / 0.08);
          out["crown"] = {
            x: atlas.x + (dx / length) * reach,
            y: atlas.y + (dy / length) * reach,
            depth: atlas.depth,
          };
        }
        return out;
      },
    );
    const props: SceneTrack.IPlacement[] = take.props.map(
      (_subject: string, i: number): SceneTrack.IPlacement =>
        groups[take.figures.length + i]![0]!,
    );
    return { figures, hips, props };
  }

  /**
   * A point of a prop's own frame in the world, by the prop's placement.
   *
   * @param point The point, prop metres.
   * @param frame The prop's world placement.
   * @returns World metres.
   */
  export function place(
    point: readonly [number, number, number],
    frame: SceneTrack.IPlacement,
  ): [number, number, number] {
    const [x, y, z]: readonly [number, number, number] = point;
    const [qx, qy, qz, qw]: [number, number, number, number] = frame.rotation;

    // Rotate by the unit quaternion, then translate.
    const tx: number = 2 * (qy * z - qz * y);
    const ty: number = 2 * (qz * x - qx * z);
    const tz: number = 2 * (qx * y - qy * x);
    return [
      x + qw * tx + (qy * tz - qz * ty) + frame.position[0],
      y + qw * ty + (qz * tx - qx * tz) + frame.position[1],
      z + qw * tz + (qx * ty - qy * tx) + frame.position[2],
    ];
  }

  /**
   * One figure's capsules in painter's order, farthest first.
   *
   * @param figure The figure.
   * @returns Its capsules.
   */
  export function capsules(figure: IFigure): ICapsule[] {
    const out: (ICapsule & { depth: number })[] = [];
    for (const segment of SEGMENTS) {
      const a: IPoint | undefined = figure[segment.from];
      const b: IPoint | undefined = figure[segment.to];
      if (a === undefined || b === undefined) continue;
      out.push({
        a,
        b,
        radius: segment.radius,
        nearness: 0,
        depth: (a.depth + b.depth) / 2,
      });
    }
    const crown: IPoint | undefined = figure["crown"];
    if (crown !== undefined)
      out.push({
        a: crown,
        b: crown,
        radius: HEAD,
        nearness: 0,
        depth: crown.depth,
      });
    out.sort((l: ICapsule & { depth: number }, r: ICapsule & { depth: number }): number => l.depth - r.depth);
    const near: number = out.at(-1)?.depth ?? 0;
    const far: number = out[0]?.depth ?? 0;
    return out.map(
      ({ depth, ...capsule }): ICapsule => ({
        ...capsule,
        nearness: near === far ? 1 : (depth - far) / (near - far),
      }),
    );
  }

  /**
   * A world point on the screen of a camera.
   *
   * @param p World metres.
   * @param view The camera.
   * @returns The projected point.
   */
  export function project(
    p: readonly [number, number, number],
    view: ICamera,
  ): IPoint {
    return {
      x: dot(p, view.right),
      y: dot(p, view.up),
      depth: dot(p, view.toward),
    };
  }

  /** The dot product of two 3-vectors. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** The cross product of two 3-vectors. */
  function cross(
    a: [number, number, number],
    b: [number, number, number],
  ): [number, number, number] {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** A 3-vector scaled to unit length; a zero vector stays zero. */
  function normalize(v: [number, number, number]): [number, number, number] {
    const length: number = Math.hypot(...v) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  }
}
