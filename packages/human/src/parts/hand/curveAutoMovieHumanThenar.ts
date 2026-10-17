import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSurface,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { patchAutoMovieHumanDigit } from "../patchAutoMovieHumanDigit";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * Guide the thenar saddle from its shared palm cut to the free thumb tube.
 *
 * The proximal meridians pass the metacarpal belly; the distal meridians run
 * directly to the first web. The belly is an anatomical section of the same
 * thumb axis and pad frame, not another intersecting tube. A guide whose palm
 * end already lies beyond the belly receives no backward detour. Eight Coons
 * strips resolve the belly and meet a shared anatomical loop at the
 * actual MCP section of the same thumb sweep, independent of sampling rows.
 * The next band reaches its first-web cut on that sweep.
 *
 * @param props Shared palm hole, thumb surfaces and hand measurements
 * @returns Named shared guides, nodes and the bridge's patches and addresses
 */
export function curveAutoMovieHumanThenar(props: {
  loop: IAutoMovieSurfaceNetwork.ISweepEdge[];
  palm: IAutoMovieSweepSurface;
  thumb: IAutoMovieSweepSurface;
  hand: readAutoMovieHumanHand.IHand;
  breadth: number;
  share: number;
  /** Free-tube cut on the same MCP-to-tip sweep. */
  root: number;
}): {
  nodes: Record<string, IAutoMovieSurfaceNetwork.INode>;
  curves: Record<string, IAutoMovieSurfaceNetwork.ICurve>;
  patches: IAutoMovieSurfaceNetwork.ICoonsPatch[];
  places: patchAutoMovieHumanDigit.IPlace[];
} {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const T: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.thumb =
    AUTOMOVIE_HUMAN_HAND_SHAPE.thumb;
  const cmc: IAutoMovieVector3 = metres(props.hand.thumb.points[0]!);
  const mcp: IAutoMovieVector3 = metres(props.hand.thumb.points[1]!);
  const axis: IAutoMovieVector3 = V.normalize(V.offset(mcp, [cmc, -1]));
  const pad: IAutoMovieVector3 = props.hand.thumb.pad;
  const across: IAutoMovieVector3 = V.cross(axis, pad);
  const centre: IAutoMovieVector3 = V.offset(cmc, [
    V.offset(mcp, [cmc, -1]),
    0.5,
  ]);
  const first: IAutoMovieVector3 = V.normalize(
    V.offset(props.thumb.point(0, 0), [props.thumb.frame(0).origin, -1]),
  );
  const phase: number = Math.atan2(V.dot(first, across), V.dot(first, pad));
  const width: number =
    (AUTOMOVIE_HUMAN_HAND_FORM.thumb.ip * props.breadth) / 1000;
  const depth: number = AUTOMOVIE_HUMAN_HAND_FORM.depth.thumb * width;
  const starts: IAutoMovieVector3[] = props.loop.map(
    (edge: IAutoMovieSurfaceNetwork.ISweepEdge): IAutoMovieVector3 =>
      props.palm.point(edge.from.u, edge.from.v),
  );
  const projection: (point: IAutoMovieVector3) => number = (
    point: IAutoMovieVector3,
  ): number => V.dot(V.offset(point, [cmc, -1]), axis);
  const belly: number = projection(centre);
  const proximal: number = Math.min(...starts.map(projection));
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const patches: IAutoMovieSurfaceNetwork.ICoonsPatch[] = [];
  const places: patchAutoMovieHumanDigit.IPlace[] = [];
  const count: number = props.loop.length;
  for (let i: number = 0; i < count; i++) {
    const edge: IAutoMovieSurfaceNetwork.ISweepEdge = props.loop[i]!;
    const from: string = `thenar.palm.${i}`;
    const to: string = `thenar.thumb.${i}`;
    nodes[from] = { type: "sweep", sweep: "palm", ...edge.from };
    nodes[to] = { type: "sweep", sweep: "thumb", u: 0, v: i / count };
    const start: IAutoMovieVector3 = starts[i]!;
    const end: IAutoMovieVector3 = props.thumb.point(0, i / count);
    const amount: number = Math.max(
      0,
      Math.min(1, (belly - projection(start)) / (belly - proximal)),
    );
    const t: number = Math.max(
      0,
      Math.min(
        1,
        (belly - projection(start)) / (projection(end) - projection(start)),
      ),
    );
    const plain: IAutoMovieVector3 = V.offset(start, [
      V.offset(end, [start, -1]),
      t,
    ]);
    const angle: number = phase + (2 * Math.PI * i) / count;
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    const mass: IAutoMovieVector3 = V.offset(
      centre,
      [
        pad,
        (c >= 0 ? width * T.thenar : depth * 0.5) *
          Math.sign(c) *
          Math.pow(Math.abs(c), 2 / T.massSquare),
      ],
      [
        across,
        ((width * T.mass) / 2) *
          Math.sign(s) *
          Math.pow(Math.abs(s), 2 / T.massSquare),
      ],
    );
    curves[`thenar.guide.${i}`] = {
      from,
      to,
      segments: TWO,
      ...(amount === 0
        ? {}
        : {
            through: [V.offset(plain, [V.offset(mass, [plain, -1]), amount])],
          }),
    };
  }
  for (let i: number = 0; i < count; i++) {
    patches.push({
      type: "coons",
      name: `thumb.thenar.${i}.0`,
      sides: [
        props.loop[i]!,
        { type: "curve", curve: `thenar.guide.${(i + 1) % count}` },
        {
          type: "sweep",
          sweep: "thumb",
          from: { u: 0, v: (i + 1) / count },
          to: { u: 0, v: i / count },
          segments: ONE,
        },
        { type: "curve", curve: `thenar.guide.${i}`, reverse: true },
      ],
    });
    places.push((s: number, t: number): { u: number; v: number } => ({
      u: (props.share * t) / 2,
      v: (i + s) / count,
    }));
    patches.push({
      type: "coons",
      name: `thumb.thenar.${i}.1`,
      sides: [
        {
          type: "sweep",
          sweep: "thumb",
          from: { u: 0, v: i / count },
          to: { u: 0, v: (i + 1) / count },
          segments: ONE,
        },
        {
          type: "sweep",
          sweep: "thumb",
          from: { u: 0, v: (i + 1) / count },
          to: { u: props.root, v: (i + 1) / count },
          segments: ONE,
        },
        {
          type: "sweep",
          sweep: "thumb",
          from: { u: props.root, v: (i + 1) / count },
          to: { u: props.root, v: i / count },
          segments: ONE,
        },
        {
          type: "sweep",
          sweep: "thumb",
          from: { u: props.root, v: i / count },
          to: { u: 0, v: i / count },
          segments: ONE,
        },
      ],
    });
    places.push((s: number, t: number): { u: number; v: number } => ({
      u: (props.share * (1 + t)) / 2,
      v: (i + s) / count,
    }));
  }
  return { nodes, curves, patches, places };
}

const TWO: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 2,
  low: 2,
  medium: 2,
  high: 2,
};
const ONE: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 1,
  low: 1,
  medium: 1,
  high: 1,
};
const metres: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
  point: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: point.x / 1000,
  y: point.y / 1000,
  z: point.z / 1000,
});
