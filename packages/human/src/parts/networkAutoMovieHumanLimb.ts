import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";
import { measureAutoMovieHumanLimbRow } from "./measureAutoMovieHumanLimbRow";
import { patchAutoMovieHumanLimb } from "./patchAutoMovieHumanLimb";

/** The tier the human profile samples; one tier keeps one topology until resolution tiers reach every part. */
const TIER = "medium" as const;

/**
 * Rounds that rescale each station until its row keeps its girth. Relief and the neighbouring stations change a row's girth by a few percent, and a round divides that error by about twenty, the coupling through the sampling filter and the scale profile between rows, so four rounds leave well under a tenth of a millimetre. Grade: numerical.
 */
const GIRTH_ROUNDS: number = 4;

const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;

/**
 * Build a limb's surface network: one sweep along the bone chain through the plan's station centres, divided into rows of quads around the limb, which `loftAutoMovieHumanLimb` samples into the limb's cage.
 *
 * The sweep's spine runs through the stations' centres, so it bends through the elbow or knee with the bones; its parameter `u` is the centres' chord-length share. Each station places its section in the plane across its own `axis`, turned so the section's first axis is its `anterior`, and between stations the engine interpolates every direction's radius monotonically, so no lump appears that no station has. The surface is the limb's gross form only: its relief is laid on the subdivided skin by `fieldAutoMovieHumanLimbRelief`.
 *
 * The four junction stations keep the rings exactly. The proximal and distal rings are pinned to the shared ring shapes of `shapeAutoMovieHumanRing`, vertex for vertex, so the trunk and the hand or foot weld onto them; each collar, the row one step into the limb, is pinned to its ring carried along the ring's axis to the collar's centre, so the rows on both sides of a ring cancel radially and the joined limit girth along the ring is the ring's own. Both junction stations take their ring's limit curve, the closed B-spline of its control points, as their section, so the surface leaves each collar as the ring's straight continuation.
 *
 * Every other station's row is held to its girth: the sweep's scale profile has a knot at each station, 1 at the junction stations, and each round samples the network without fitting, measures each row's limit girth with `measureAutoMovieHumanLimbRow` and rescales that station's knot by the ratio of its girth to the measured one. The girths therefore hold on the limit surface, and the relief, whose every row averages to nothing, keeps them; the sections' own girths only start the iteration.
 *
 * @param plan The limb's stations, relief and rings
 * @returns The calibrated network, the chart address of every patch corner and the junction rings
 * @throws {Error} When the plan has fewer than five stations, a junction station carries a section or an inner one lacks one, or the engine refuses the network
 */
export function networkAutoMovieHumanLimb(
  plan: IAutoMovieHumanLimbPlan,
): networkAutoMovieHumanLimb.IOutput {
  const stations: IAutoMovieHumanLimbPlan.IStation[] = plan.stations;
  const n: number = stations.length;
  if (n < 5) throw new Error(`a limb needs at least five stations, not ${n}`);
  stations.forEach((s: IAutoMovieHumanLimbPlan.IStation, i: number): void => {
    const junction: boolean = i <= 1 || i >= n - 2;
    if (junction !== (s.section === null) || junction !== (s.girth === null))
      throw new Error(
        `limb station ${s.name} ${junction ? "lies on a junction and takes its ring's section" : "needs a section and a girth"}`,
      );
  });
  const at: number[] = chordShares(
    stations.map(
      (s: IAutoMovieHumanLimbPlan.IStation): IAutoMovieVector3 => s.centre,
    ),
  );
  const layout: patchAutoMovieHumanLimb.IOutput = patchAutoMovieHumanLimb({
    sweep: "limb",
    at,
    columns: stations.map(
      (s: IAutoMovieHumanLimbPlan.IStation): number => s.columns,
    ),
    rows: stations.map((s: IAutoMovieHumanLimbPlan.IStation): number => s.rows),
  });
  const ends: IEnd[] = [
    end(plan.proximal, stations[0]!, stations[1]!, 0, 1),
    end(plan.distal, stations[n - 1]!, stations[n - 2]!, n - 1, n - 2),
  ];
  const sections: IAutoMovieSweepSection[] = stations.map(
    (s: IAutoMovieHumanLimbPlan.IStation, i: number): IAutoMovieSweepSection =>
      s.section !== null
        ? metresOf(s.section)
        : ends.find((e: IEnd): boolean => e.stations.includes(i))!.section,
  );


  const network = (scales: number[]): IAutoMovieSurfaceNetwork => ({
    sweeps: {
      limb: {
        spine: {
          points: stations.map(
            (s: IAutoMovieHumanLimbPlan.IStation): IAutoMovieVector3 =>
              toMetres(s.centre),
          ),
          normal: stations[0]!.anterior,
        },
        stations: stations.map(
          (
            s: IAutoMovieHumanLimbPlan.IStation,
            i: number,
          ): IAutoMovieSweep.IStation => ({
            at: at[i]!,
            section: sections[i]!,
            rotation: rotationOf(s),
          }),
        ),
        scale: scales.map(
          (value: number, i: number): IAutoMovieSweep.IKnot => ({
            at: at[i]!,
            value,
          }),
        ),
      },
    },
    patches: layout.patches,
    rings: [
      ...ends.flatMap((e: IEnd): IAutoMovieSurfaceNetwork.IRing[] => [
        {
          name: `ring.${e.stations[0]}`,
          edges: [e.edge(at[e.stations[0]]!)],
          positions: e.ring,
        },
        {
          name: `ring.${e.stations[1]}`,
          edges: [e.edge(at[e.stations[1]]!)],
          positions: e.collar,
        },
      ]),
      // every other station's row, reported so its girth can be measured
      ...stations.flatMap(
        (
          s: IAutoMovieHumanLimbPlan.IStation,
          i: number,
        ): IAutoMovieSurfaceNetwork.IRing[] =>
          s.girth === null
            ? []
            : [
                {
                  name: `row.${i}`,
                  edges: [
                    {
                      type: "sweep",
                      sweep: "limb",
                      from: { u: at[i]!, v: 0 },
                      to: { u: at[i]!, v: 1 },
                      segments: fixed(s.columns),
                    },
                  ],
                },
              ],
      ),
    ],
  });

  // hold every row to its girth on the limit surface
  const scales: number[] = stations.map((): number => 1);
  for (let round: number = 0; round < GIRTH_ROUNDS; ++round) {
    const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
      network: network(scales),
      tier: TIER,
      fit: false,
    });
    stations.forEach((s: IAutoMovieHumanLimbPlan.IStation, i: number): void => {
      if (s.girth === null) return;
      const row: IAutoMovieVector3[] = sampled.rings[`row.${i}`]!.map(
        (k: number): IAutoMovieVector3 => ({
          x: millimetres(sampled.targets[3 * k]!),
          y: millimetres(sampled.targets[3 * k + 1]!),
          z: millimetres(sampled.targets[3 * k + 2]!),
        }),
      );
      scales[i]! *= s.girth / measureAutoMovieHumanLimbRow(row);
    });
  }
  return {
    value: network(scales),
    domains: layout.domains,
    rings: ends.map(
      (e: IEnd): networkAutoMovieHumanLimb.IRing => ({
        name: `ring.${e.stations[0]}`,
        shape: e.shape,
      }),
    ),
  };
}
/** Output types of {@link networkAutoMovieHumanLimb}. */
export namespace networkAutoMovieHumanLimb {
  /**
   * A limb's surface network, calibrated, with what its cage needs beside it.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The network, its sweep named `limb`, its scale profile holding every station's girth. */
    value: IAutoMovieSurfaceNetwork;

    /** For each patch, the sweep domain point at patch coordinates `(s, t)`, the chart address of its corners. */
    domains: Array<(s: number, t: number) => patchAutoMovieHumanLimb.IDomain>;

    /** The junction rings the network reports, proximal first. */
    rings: IRing[];
  }

  /**
   * One junction ring of the network.
   *
   * @author Samchon
   */
  export interface IRing {
    /** Name of the ring in the network. */
    name: string;

    /** The shared ring shape it is pinned to. */
    shape: IAutoMovieHumanRingShape;
  }
}

/** One end of the limb: its ring, its two junction stations, the ring's section and the pinned positions of both rows. */
interface IEnd {
  shape: IAutoMovieHumanRingShape;
  /** The ring's station, then its collar's. */
  stations: [number, number];
  section: IAutoMovieSweepSection;
  /** The ring's control positions, metres, in loop order. */
  ring: IAutoMovieVector3[];
  /** The collar's control positions, metres, in loop order. */
  collar: IAutoMovieVector3[];
  /** The loop of one row at `u`, ordered as the ring's layout. */
  edge: (u: number) => IAutoMovieSurfaceNetwork.ISweepEdge;
}

/**
 * Read one junction: the ring's section in its station's plane and the loops of the ring and its collar.
 *
 * The ring runs counterclockwise about its own normal, which points out of the part: along the limb's distal axis at the distal ring and against it at the proximal one. Vertex `k` of the ring therefore lies at `v = k / count` at the distal end and `v = -k / count` at the proximal end, the loop the ring's edge walks in layout order.
 */
const end = (
  shape: IAutoMovieHumanRingShape,
  ring: IAutoMovieHumanLimbPlan.IStation,
  collar: IAutoMovieHumanLimbPlan.IStation,
  ringIndex: number,
  collarIndex: number,
): IEnd => {
  const sign: number = V.dot(shape.frame.normal, ring.axis) > 0 ? 1 : -1;
  const across: IAutoMovieVector3 = V.cross(ring.axis, ring.anterior);
  const points: IAutoMovieSweepSection.IPoint[] = shape.positions
    .map((p: IAutoMovieVector3): IAutoMovieSweepSection.IPoint => {
      const d: IAutoMovieVector3 = V.offset(p, [ring.centre, -1]);
      return {
        x: metres(V.dot(d, ring.anterior)),
        y: metres(V.dot(d, across)),
      };
    })
    .sort(
      (
        a: IAutoMovieSweepSection.IPoint,
        b: IAutoMovieSweepSection.IPoint,
      ): number => turn(a) - turn(b),
    );
  const shift: IAutoMovieVector3 = V.offset(collar.centre, [ring.centre, -1]);
  return {
    shape,
    stations: [ringIndex, collarIndex],
    section: { type: "bspline", points },
    ring: shape.positions.map(toMetres),
    collar: shape.positions.map(
      (p: IAutoMovieVector3): IAutoMovieVector3 =>
        toMetres(V.offset(p, [shift, 1])),
    ),
    edge: (u: number): IAutoMovieSurfaceNetwork.ISweepEdge => ({
      type: "sweep",
      sweep: "limb",
      from: { u, v: 0 },
      to: { u, v: sign },
      segments: fixed(shape.count),
    }),
  };
};

/** Polar angle of a section point within one turn from 0. */
const turn = (p: IAutoMovieSweepSection.IPoint): number => {
  const a: number = Math.atan2(p.y, p.x);
  return a < -1e-12 ? a + 2 * Math.PI : Math.max(0, a);
};

/** Rotation taking `+X` to the station's anterior, `+Y` to its axis crossed with that and `+Z` to its axis. */
const rotationOf = (
  s: IAutoMovieHumanLimbPlan.IStation,
): IAutoMovieQuaternion =>
  quaternionOf(s.anterior, V.cross(s.axis, s.anterior), s.axis);

/** The unit quaternion of the rotation whose matrix columns are `x`, `y`, `z`, read from the matrix's largest diagonal term for stability. */
const quaternionOf = (
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const trace: number = x.x + y.y + z.z;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return {
      w: s / 4,
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
    };
  }
  if (x.x > y.y && x.x > z.z) {
    const s: number = Math.sqrt(1 + x.x - y.y - z.z) * 2;
    return {
      w: (y.z - z.y) / s,
      x: s / 4,
      y: (y.x + x.y) / s,
      z: (z.x + x.z) / s,
    };
  }
  if (y.y > z.z) {
    const s: number = Math.sqrt(1 + y.y - x.x - z.z) * 2;
    return {
      w: (z.x - x.z) / s,
      x: (y.x + x.y) / s,
      y: s / 4,
      z: (z.y + y.z) / s,
    };
  }
  const s: number = Math.sqrt(1 + z.z - x.x - y.y) * 2;
  return {
    w: (x.y - y.x) / s,
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: s / 4,
  };
};

/** A section given in millimetres, in metres. */
const metresOf = (section: IAutoMovieSweepSection): IAutoMovieSweepSection => {
  const point = (
    p: IAutoMovieSweepSection.IPoint,
  ): IAutoMovieSweepSection.IPoint => ({
    x: metres(p.x),
    y: metres(p.y),
  });
  switch (section.type) {
    case "superellipse":
      return {
        ...section,
        right: metres(section.right),
        up: metres(section.up),
        left: metres(section.left),
        down: metres(section.down),
        ...(section.centre !== undefined
          ? { centre: point(section.centre) }
          : {}),
      };
    case "radial":
      return { type: "radial", radii: section.radii.map(metres) };
    case "bspline":
      return { type: "bspline", points: section.points.map(point) };
    case "bezier":
      return { type: "bezier", points: section.points.map(point) };
    case "polygon":
      return { type: "polygon", points: section.points.map(point) };
  }
};

/** Each point's share of the polyline's chord length, 0 at the first and 1 at the last. */
const chordShares = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(lengths[k - 1]! + V.distance(points[k - 1]!, points[k]!));
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

/** The same count at every tier. */
const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

const metres = (mm: number): number => mm / 1000;
const millimetres = (m: number): number => m * 1000;
const toMetres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: metres(p.x),
  y: metres(p.y),
  z: metres(p.z),
});
