import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepPath,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  frameAutoMovieSweepSpine,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/**
 * The upper trunk as a curve network between the horizontal axilla and the shared neck ring.
 *
 * The front and back meridians connect their own endpoints; each lateral meridian passes through its acromion. Intermediate meridians are sampled from the ruled axilla-to-neck surface plus the lateral meridian's residual times the squared sine of the loop angle, which is zero on both midlines and one at the side. The two longitudinal bands meet at the acromia's common logical parameter, independent of the different physical lengths of the front, back and sides. Coons patches fill the network; the shoulder openings share their boundary curves with the arm bridges.
 *
 * All boundary points are evaluated from the axillary sweep, the shared neck controls and the skeleton's acromia. No control vertex is authored independently.
 *
 * @param props The measured lower trunk, neck ring and mirrored-side anatomical frames
 * @returns The upper patch graph, shoulder opening loops and chart bounds
 */
export function networkAutoMovieHumanUpperTrunk(props: {
  trunk: IAutoMovieSweep;
  neck: IAutoMovieHumanRingShape;
  frame: IAutoMovieHumanTrunkFrame;
  rightFrame: IAutoMovieHumanTrunkFrame;
}): networkAutoMovieHumanUpperTrunk.IOutput {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(props.trunk);
  const count: number = 12;
  if (props.neck.count !== count)
    throw new Error("the human upper trunk needs twelve shared neck controls");
  const side: Record<
    "left" | "right",
    { path: IAutoMovieSweepPath; at: number }
  > = {
    left: lateral(0.25, props.frame.acromion),
    right: lateral(0.75, {
      ...props.rightFrame.acromion,
      x: -props.rightFrame.acromion.x,
    }),
  };
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const charts: Record<string, networkAutoMovieHumanUpperTrunk.IChart> = {};
  const lowerRows: number = S.LOWER_ROWS.reduce(
    (sum: number, rows: number): number => sum + rows,
    0,
  );
  // Each of the two upper bands has two rows; chart spacing follows topology, not body dimensions.
  const chartAxilla: number = lowerRows / (lowerRows + 2 * 2);
  const node: (row: number, column: number) => string = (
    row: number,
    column: number,
  ): string => `upper.node.${row}.${wrap(column)}`;
  const along: (band: number, column: number) => string = (
    band: number,
    column: number,
  ): string => `upper.along.${band}.${wrap(column)}`;
  const around: (row: number, column: number) => string = (
    row: number,
    column: number,
  ): string => `upper.around.${row}.${wrap(column)}`;
  const curveEdge: (
    curve: string,
    reverse?: boolean,
  ) => IAutoMovieSurfaceNetwork.ICurveEdge = (
    curve: string,
    reverse: boolean = false,
  ): IAutoMovieSurfaceNetwork.ICurveEdge => ({ type: "curve", curve, reverse });

  for (let k: number = 0; k < count; ++k) {
    const v: number = k / count;
    nodes[node(0, k)] = { type: "sweep", sweep: "trunk", u: 1, v };
    nodes[node(1, k)] = { type: "point", position: point(0.5, v) };
    nodes[node(2, k)] = {
      type: "point",
      position: S.toMetres(props.neck.positions[k]!),
    };
    for (let band: number = 0; band < 2; ++band)
      curves[along(band, k)] = {
        from: node(band, k),
        to: node(band + 1, k),
        through: [point((band + 0.5) / 2, v)],
        segments: S.fixed(2),
        normal: normal((band + 0.5) / 2, v),
      };
    curves[around(1, k)] = {
      from: node(1, k),
      to: node(1, k + 1),
      through: [point(0.5, (k + 0.5) / count)],
      segments: S.fixed(1),
      normal: normal(0.5, (k + 0.5) / count),
    };
    curves[around(2, k)] = {
      from: node(2, k),
      to: node(2, k + 1),
      segments: S.fixed(1),
    };
    for (let band: number = 0; band < 2; ++band) {
      // The two flank columns on each side remain the shoulder openings.
      if (band === 0 && ((k >= 2 && k < 4) || (k >= 8 && k < 10))) continue;
      const name: string = `upper.patch.${band}.${k}`;
      patches.push({
        type: "coons",
        name,
        sides: [
          band === 0
            ? S.edge("trunk", [1, v], [1, (k + 1) / count], 1)
            : curveEdge(around(1, k)),
          curveEdge(along(band, k + 1)),
          curveEdge(around(band + 1, k), true),
          curveEdge(along(band, k), true),
        ],
      });
      charts[name] = {
        u: [
          chartAxilla + ((1 - chartAxilla) * band) / 2,
          chartAxilla + ((1 - chartAxilla) * (band + 1)) / 2,
        ],
        v: [v, (k + 1) / count],
      };
    }
  }
  return {
    nodes,
    curves,
    patches,
    charts,
    chartAxilla,
    neckEdges: Array.from(
      { length: count },
      (_: unknown, k: number): IAutoMovieSurfaceNetwork.IEdge =>
        curveEdge(around(2, k)),
    ),
    shoulders: {
      left: [
        S.edge("trunk", [1, 2 / count], [1, 4 / count], 2),
        curveEdge(along(0, 4)),
        curveEdge(around(1, 3), true),
        curveEdge(around(1, 2), true),
        curveEdge(along(0, 2), true),
      ],
      right: [
        curveEdge(along(0, 10)),
        curveEdge(around(1, 9), true),
        curveEdge(around(1, 8), true),
        curveEdge(along(0, 8), true),
        S.edge("trunk", [1, 8 / count], [1, 10 / count], 2),
      ],
    },
  };

  /** Neck controls interpolated on their control polygon, in metres. */
  function neck(v: number): IAutoMovieVector3 {
    const index: number = (((v % 1) + 1) % 1) * count;
    const k: number = Math.floor(index);
    return mix(
      S.toMetres(props.neck.positions[k % count]!),
      S.toMetres(props.neck.positions[(k + 1) % count]!),
      index - k,
    );
  }

  /** One lateral anatomical guide, with the acromion's native chord share. */
  function lateral(
    v: number,
    acromion: IAutoMovieVector3,
  ): { path: IAutoMovieSweepPath; at: number } {
    const points: IAutoMovieVector3[] = [
      surface.point(1, v),
      S.toMetres(acromion),
      neck(v),
    ];
    return {
      path: frameAutoMovieSweepSpine({
        points,
        normal: { x: 0, y: 0, z: 1 },
      }),
      at: S.chordShares(points)[1]!,
    };
  }

  /** The transfinite curve field; its two bands meet on the acromia. */
  function point(t: number, v: number): IAutoMovieVector3 {
    const sine: number = Math.sin(2 * Math.PI * v);
    const which: "left" | "right" = sine >= 0 ? "left" : "right";
    const cardinal: number = which === "left" ? 0.25 : 0.75;
    const guide: { path: IAutoMovieSweepPath; at: number } = side[which];
    const at: number =
      t <= 0.5 ? 2 * t * guide.at : guide.at + (2 * t - 1) * (1 - guide.at);
    const actual: IAutoMovieVector3 = guide.path.point(at);
    const ruled: IAutoMovieVector3 = mix(surface.point(1, v), neck(v), t);
    const baseline: IAutoMovieVector3 = mix(
      surface.point(1, cardinal),
      neck(cardinal),
      t,
    );
    const weight: number = sine * sine;
    return {
      x: ruled.x + weight * (actual.x - baseline.x),
      y: ruled.y + weight * (actual.y - baseline.y),
      z: ruled.z + weight * (actual.z - baseline.z),
    };
  }

  /** Outward normal of the curve field, using the sweep's derivative step. */
  function normal(t: number, v: number): IAutoMovieVector3 {
    const h: number = surface.step;
    const across: IAutoMovieVector3 = AutoMovieHumanVector.offset(
      point(t, v + h),
      [point(t, v - h), -1],
    );
    const up: IAutoMovieVector3 = AutoMovieHumanVector.offset(
      point(Math.min(1, t + h), v),
      [point(Math.max(0, t - h), v), -1],
    );
    return AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.cross(across, up),
    );
  }

  function wrap(k: number): number {
    return ((k % count) + count) % count;
  }
}

/** Types of the upper trunk's patch graph. */
export namespace networkAutoMovieHumanUpperTrunk {
  /**
   * The part chart rectangle represented by a patch.
   *
   * @author Samchon
   */
  export interface IChart {
    /** Longitudinal chart bounds, increasing within zero to one. */
    u: [number, number];
    /** Angular chart bounds in turns. */
    v: [number, number];
  }

  /**
   * Upper patches and the exact boundary loops their neighbors share.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Shared curve endpoints, in metres. */
    nodes: Record<string, IAutoMovieSurfaceNetwork.INode>;
    /** Generated boundary curves in the model frame, metres. */
    curves: Record<string, IAutoMovieSurfaceNetwork.ICurve>;
    /** Coons patches above the axilla, omitting the two shoulder openings. */
    patches: IAutoMovieSurfaceNetwork.IPatch[];
    /** Trunk chart rectangle of each upper patch. */
    charts: Record<string, IChart>;
    /** Axillary chart boundary, fixed by the lower and upper topology row counts. */
    chartAxilla: number;
    /** Neck boundary in the shared ring's control order. */
    neckEdges: IAutoMovieSurfaceNetwork.IEdge[];
    /** Eight-vertex opening loops in each arm bridge's winding order. */
    shoulders: Record<"left" | "right", IAutoMovieSurfaceNetwork.IEdge[]>;
  }
}

/** Affine interpolation, shared by the ruled field and its lateral residual. */
const mix: (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
) => IAutoMovieVector3 = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});
