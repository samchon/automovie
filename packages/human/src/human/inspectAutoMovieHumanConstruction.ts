import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepPath,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  frameAutoMovieSweepSpine,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";

/** Points per closed station, per spine or guide, per feature segment and per network curve. */
const SAMPLES: Record<"station" | "line" | "feature" | "curve", number> = {
  station: 96,
  line: 64,
  feature: 24,
  curve: 48,
};

/** Reference normal that frames a network curve's spline for sampling; any direction off the curve serves. */
const CURVE_NORMAL: IAutoMovieVector3 = { x: 0.3, y: 0.5, z: 0.81 };

/**
 * Read the construction net of every lofted part: each sweep's spine, stations, guides and features, the network's curves, the part's rings and its control cage, in the model frame, metres.
 *
 * The sweeps are compiled again from the network each cage keeps (`IAutoMovieHumanCage.construction`) and sampled into polylines; network curves are drawn as the centripetal spline through their end nodes and points, which is how the engine defines them. A part whose cage keeps no network, a part not lofted from one, is skipped.
 *
 * @param cages Every part's cage, as `generateAutoMovieHumanCages` returns them
 * @returns One net per lofted part instance, in the order given
 */
export function inspectAutoMovieHumanConstruction(
  cages: Array<{
    part: AutoMovieHumanPart;
    side: AutoMovieHumanSide | null;
    cage: IAutoMovieHumanCage;
  }>,
): IAutoMovieHumanConstructionNet[] {
  const nets: IAutoMovieHumanConstructionNet[] = [];
  for (const { part, side, cage } of cages) {
    const construction: IAutoMovieHumanCage.IConstruction | undefined =
      cage.construction;
    if (construction === undefined) continue;
    nets.push({
      part,
      side,
      curves: [
        ...networkCurves(construction),
        ...ringCurves(cage),
        ...(construction.relief ?? []).map(
          (r: IAutoMovieHumanCage.IRelief): IAutoMovieHumanConstructionNet.ICurve => ({
            kind: "relief",
            name: r.name,
            closed: r.closed,
            points: r.points.flatMap((p: IAutoMovieVector3): number[] => [
              p.x / 1000,
              p.y / 1000,
              p.z / 1000,
            ]),
          }),
        ),
      ],
      cage: cageEdges(cage),
    });
  }
  return nets;
}

/** Every sweep's spine, stations, guides and features and every network curve, in the model frame, metres. */
function networkCurves(
  construction: IAutoMovieHumanCage.IConstruction,
): IAutoMovieHumanConstructionNet.ICurve[] {
  const network: IAutoMovieSurfaceNetwork = construction.network;
  const model = (p: IAutoMovieVector3): number[] => [
    (construction.origin.x +
      construction.x.x * p.x +
      construction.y.x * p.y +
      construction.z.x * p.z) /
      1000,
    (construction.origin.y +
      construction.x.y * p.x +
      construction.y.y * p.y +
      construction.z.y * p.z) /
      1000,
    (construction.origin.z +
      construction.x.z * p.x +
      construction.y.z * p.y +
      construction.z.z * p.z) /
      1000,
  ];
  const curve = (
    kind: IAutoMovieHumanConstructionNet.Kind,
    name: string,
    closed: boolean,
    count: number,
    at: (t: number) => IAutoMovieVector3,
  ): IAutoMovieHumanConstructionNet.ICurve => {
    const points: number[] = [];
    const last: number = closed ? count - 1 : count;
    for (let i: number = 0; i <= last; ++i)
      points.push(...model(at(i / count)));
    return { kind, name, closed, points };
  };
  const curves: IAutoMovieHumanConstructionNet.ICurve[] = [];
  const surfaces: Record<string, IAutoMovieSweepSurface> = {};
  for (const [name, sweep] of Object.entries(network.sweeps)) {
    const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(sweep);
    surfaces[name] = surface;
    curves.push(
      curve("spine", name, false, SAMPLES.line, (t: number) =>
        surface.path.point(t),
      ),
    );
    for (const station of sweep.stations)
      curves.push(
        curve("station", name, true, SAMPLES.station, (t: number) =>
          surface.point(station.at, t),
        ),
      );
    for (const guide of sweep.guides ?? [])
      curves.push(
        curve("guide", name, false, SAMPLES.line, (t: number) =>
          surface.point(t, guide.angle / (2 * Math.PI)),
        ),
      );
    for (const feature of sweep.features ?? [])
      curves.push(featureCurve(name, feature, surface, model));
  }
  const node = (key: string): IAutoMovieVector3 => {
    const n: IAutoMovieSurfaceNetwork.INode = network.nodes![key]!;
    return n.type === "point" ? n.position : surfaces[n.sweep]!.point(n.u, n.v);
  };
  for (const [name, c] of Object.entries(network.curves ?? {})) {
    const path: IAutoMovieSweepPath = frameAutoMovieSweepSpine({
      points: [node(c.from), ...(c.through ?? []), node(c.to)],
      normal: CURVE_NORMAL,
    });
    curves.push(
      curve("curve", name, false, SAMPLES.curve, (t: number) => path.point(t)),
    );
  }
  return curves;
}

/** A feature's polyline: each pair of its points joined across the sweep's surface, the turn taking the short way round. */
function featureCurve(
  name: string,
  feature: IAutoMovieSweep.IFeature,
  surface: IAutoMovieSweepSurface,
  model: (p: IAutoMovieVector3) => number[],
): IAutoMovieHumanConstructionNet.ICurve {
  const points: number[] = [];
  for (let j: number = 0; j + 1 < feature.points.length; ++j) {
    const a: IAutoMovieSweep.IFeaturePoint = feature.points[j]!;
    const b: IAutoMovieSweep.IFeaturePoint = feature.points[j + 1]!;
    let turn: number = b.angle - a.angle;
    turn -= 2 * Math.PI * Math.round(turn / (2 * Math.PI));
    for (let i: number = j === 0 ? 0 : 1; i <= SAMPLES.feature; ++i) {
      const t: number = i / SAMPLES.feature;
      points.push(
        ...model(
          surface.point(
            a.at + (b.at - a.at) * t,
            (a.angle + turn * t) / (2 * Math.PI),
          ),
        ),
      );
    }
  }
  return { kind: "feature", name, closed: false, points };
}

/** The cage's open rings as closed polylines through their vertices, metres. */
function ringCurves(
  cage: IAutoMovieHumanCage,
): IAutoMovieHumanConstructionNet.ICurve[] {
  return cage.rings.map((ring: IAutoMovieHumanCage["rings"][number]) => ({
    kind: "ring" as const,
    name: ring.side === null ? ring.site : `${ring.site}.${ring.side}`,
    closed: true,
    points: ring.vertices.flatMap((v: number): number[] => {
      const p: IAutoMovieVector3 = cage.vertices[v]!.position;
      return [p.x / 1000, p.y / 1000, p.z / 1000];
    }),
  }));
}

/** The cage's vertices and its edges, each once, metres. */
function cageEdges(
  cage: IAutoMovieHumanCage,
): IAutoMovieHumanConstructionNet.ICage {
  const seen: Set<string> = new Set();
  const edges: number[] = [];
  for (const face of cage.faces)
    for (let k: number = 0; k < 4; ++k) {
      const a: number = face.vertices[k]!;
      const b: number = face.vertices[(k + 1) % 4]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(a, b);
    }
  return {
    positions: cage.vertices.flatMap(
      (v: IAutoMovieHumanCage.IVertex): number[] => [
        v.position.x / 1000,
        v.position.y / 1000,
        v.position.z / 1000,
      ],
    ),
    edges,
  };
}
