import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRing } from "../../junction/IAutoMovieHumanRing";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * Loft the trunk: one sweep up the body from the crotch to the neck-base ring, with the shoulder tubes leaving openings in its flanks for the mid-upper-arm rings and the hip tubes leaving its lower edge on either side of a fork curve for the mid-thigh rings.
 *
 * The sweep's sections are the trunk profile's superellipses, read at the profile's own levels (crotch, buttock, iliac crest, waist, costal margin, inframammary fold, chest point, axilla, shoulder line), so the section family is one continuous family from the pelvis through the axilla: between levels the engine interpolates every section parameter monotonically, so no section bulges past its neighbours and no band appears where one family would switch to another. Each tube is a short sweep from inside its opening to its junction ring, joined to the trunk by a bridge that leaves the opening tangent to the trunk, and its last section is pinned to the ring the neighbouring part shares, so the junction welds coincident vertices as before.
 *
 * Topology is fixed by the patch layout alone: twelve columns around the trunk (four in front, two on each flank, four behind), a two-by-two opening on each flank (the eight vertices of the upper-arm ring), and loops of twelve under the pelvis for the thigh rings, so every identity yields the same cage.
 *
 * @param measurements Resolved measurements of the person
 * @param skeleton The person's skeleton
 * @returns The trunk cage in millimetres with its five rings
 */
export function loftAutoMovieHumanTrunk(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanCage {
  const network: INetwork = networkOf(measurements, skeleton);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: network.value,
    tier: TIER,
  });
  return emit(network, sampled);
}

/** The tier the human profile samples; one tier keeps one topology until resolution tiers reach the other parts. */
const TIER = "medium" as const;

/** The same count at every tier. */
const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

/** Where each tube's last row starts: the loop there repeats the ring's section, one row before the ring. */
const COLLAR = { arm: 2 / 3, thigh: 3 / 4 } as const;

/** Trunk strips by `v`, a twelfth of a turn per column: front across the anterior midline, left flank, back, right flank. */
const STRIPS: Array<{
  name: string;
  v: [number, number];
  columns: number;
}> = [
  { name: "front", v: [-1 / 6, 1 / 6], columns: 4 },
  { name: "left", v: [1 / 6, 1 / 3], columns: 2 },
  { name: "back", v: [1 / 3, 2 / 3], columns: 4 },
  { name: "right", v: [2 / 3, 5 / 6], columns: 2 },
];

interface INetwork {
  value: IAutoMovieSurfaceNetwork;
  shapes: Array<{ ring: string; shape: IAutoMovieHumanRingShape }>;
}

const networkOf = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): INetwork => {
  const frame: IAutoMovieHumanTrunkFrame = measureAutoMovieHumanTrunkFrame(
    measurements,
    skeleton,
    "left",
  );
  const profile: profileAutoMovieHumanTrunk.IProfile =
    profileAutoMovieHumanTrunk(frame, IAutoMovieHumanTrunkTune.neutral());
  const ring = (
    site: "neckBase" | "upperArm" | "thigh",
    side: AutoMovieHumanSide | null,
  ): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({
      skeleton,
      measurements,
      site,
      side,
      part: "trunk",
    });
  const neck: IAutoMovieHumanRingShape = ring("neckBase", null);
  const arms: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape> = {
    left: ring("upperArm", "left"),
    right: ring("upperArm", "right"),
  };
  const thighs: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape> = {
    left: ring("thigh", "left"),
    right: ring("thigh", "right"),
  };

  // trunk stations at the profile's levels, millimetres, increasing in height
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const shoulderLine: number = frame.acromion.y;
  const levels: number[] = [
    L.crotch,
    L.buttock,
    frame.iliocristale.y,
    L.waist,
    L.costal,
    L.fold,
    L.chestPoint,
    L.axilla,
    shoulderLine,
  ]
    .sort((a: number, b: number): number => a - b)
    .filter(
      (y: number, k: number, all: number[]): boolean =>
        k === 0 || y - all[k - 1]! > 12,
    );
  const sections: Array<{ centre: IAutoMovieVector3; section: IAutoMovieSweepSection }> =
    levels.map((y: number) => {
      const widest: number = profile.widest(y);
      const half: number =
        y >= shoulderLine - 1
          ? Math.max(profile.half(L.axilla), frame.acromion.x - 15)
          : profile.half(y);
      const square = squareness(profile, y);
      return {
        centre: AutoMovieHumanVector.of(0, y, widest),
        section: {
          type: "superellipse",
          right: metres(Math.max(20, profile.front(y) - widest)),
          up: metres(half),
          left: metres(Math.max(20, widest - profile.back(y))),
          down: metres(half),
          exponents: [square.front, square.back, square.back, square.front],
        },
      };
    });
  // the trapezius slope from the shoulder line to the neck base, then the neck ring itself
  const shoulder = sections[sections.length - 1]!;
  const neckOrigin: IAutoMovieVector3 = neck.frame.origin;
  const slopeY: number = shoulderLine + 0.45 * (neckOrigin.y - shoulderLine);
  const neckHalf: number = (neck.radii[3]! + neck.radii[9]!) / 2;
  sections.push({
    centre: AutoMovieHumanVector.of(
      0,
      slopeY,
      (shoulder.centre.z + neckOrigin.z) / 2,
    ),
    section: {
      type: "superellipse",
      right: metres(Math.max(25, profile.front(slopeY) - (shoulder.centre.z + neckOrigin.z) / 2)),
      up: metres(neckHalf + 0.45 * (millimetres((shoulder.section as IAutoMovieSweepSection.ISuperellipse).up) - neckHalf)),
      left: metres(Math.max(25, (shoulder.centre.z + neckOrigin.z) / 2 - profile.back(slopeY))),
      down: metres(neckHalf + 0.45 * (millimetres((shoulder.section as IAutoMovieSweepSection.ISuperellipse).up) - neckHalf)),
      exponents: [2.2, 2.2, 2.2, 2.2],
    },
  });
  sections.push({ centre: neckOrigin, section: ringSection(neck, 0) });

  const spinePoints: IAutoMovieVector3[] = sections.map((s) => toMetres(s.centre));
  const ats: number[] = chordShares(spinePoints);
  const trunk: IAutoMovieSweep = {
    spine: { points: spinePoints, normal: { x: 0, y: 0, z: 1 } },
    stations: sections.map((s, k: number): IAutoMovieSweep.IStation => ({
      at: ats[k]!,
      section: s.section,
      ...(k === sections.length - 1 ? { rotation: ringRotation(neck, 0) } : {}),
    })),
  };
  // the station nearest the axilla opens the shoulder band, which ends at the shoulder line
  const axillaIndex: number = levels.reduce(
    (best: number, y: number, k: number): number =>
      Math.abs(y - L.axilla) < Math.abs(levels[best]! - L.axilla) ? k : best,
    0,
  );
  const uAxilla: number = ats[Math.min(axillaIndex, levels.length - 2)]!;
  const uShoulder: number = ats[levels.length - 1]!;

  // each tube's spine length, which spaces its collar loop one row before its ring
  const lengths: Record<string, number> = {};
  // shoulder tubes from inside each opening to the upper-arm ring
  const armTube = (side: AutoMovieHumanSide): IAutoMovieSweep => {
    const shape: IAutoMovieHumanRingShape = arms[side];
    const sign: number = side === "left" ? 1 : -1;
    const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
      sign * (frame.acromion.x + 0.3 * frame.deltoid),
      frame.shoulder.y,
      frame.shoulder.z,
    );
    lengths[`upperArm.${side}`] = AutoMovieHumanVector.distance(start, shape.frame.origin);
    const r0: number = (1.2 * frame.armGirth) / (2 * Math.PI);
    return {
      spine: {
        points: [toMetres(start), toMetres(shape.frame.origin)],
        normal: shape.directions[0]!,
      },
      // the last row repeats the ring, so the loop next to it sits at the ring's own radii and the joined girth is the ring's
      stations: [
        { at: 0, section: circle(r0) },
        { at: COLLAR.arm, section: ringSection(shape, 0), rotation: ringRotation(shape, 0) },
        { at: 1, section: ringSection(shape, 0), rotation: ringRotation(shape, 0) },
      ],
    };
  };

  // hip tubes from under the pelvis to the mid-thigh ring; their first axis faces back, so the ring starts half a turn round
  const thighTube = (side: AutoMovieHumanSide): IAutoMovieSweep => {
    const shape: IAutoMovieHumanRingShape = thighs[side];
    const sign: number = side === "left" ? 1 : -1;
    const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
      sign * Math.abs(frame.hip.x),
      L.crotch - 40,
      frame.hip.z,
    );
    lengths[`thigh.${side}`] = AutoMovieHumanVector.distance(start, shape.frame.origin);
    const r0: number = frame.thighGirth / (2 * Math.PI);
    return {
      spine: {
        points: [toMetres(start), toMetres(shape.frame.origin)],
        normal: { x: 0, y: 0, z: -1 },
      },
      stations: [
        { at: 0, section: circle(r0) },
        {
          at: COLLAR.thigh,
          section: ringSection(shape, shape.count / 2),
          rotation: ringRotation(shape, shape.count / 2),
        },
        {
          at: 1,
          section: ringSection(shape, shape.count / 2),
          rotation: ringRotation(shape, shape.count / 2),
        },
      ],
    };
  };

  const sweeps: Record<string, IAutoMovieSweep> = {
    trunk,
    leftShoulder: armTube("left"),
    rightShoulder: armTube("right"),
    leftHip: thighTube("left"),
    rightHip: thighTube("right"),
  };

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const bands: Array<{ u: [number, number]; rows: number }> = [
    { u: [0, uAxilla], rows: 10 },
    { u: [uAxilla, uShoulder], rows: 2 },
    { u: [uShoulder, 1], rows: 3 },
  ];
  for (const band of bands)
    for (const strip of STRIPS) {
      if (band === bands[1] && strip.columns === 2) continue;
      patches.push({
        type: "sweep",
        name: `trunk.${strip.name}.${patches.length}`,
        sweep: "trunk",
        u: band.u,
        v: strip.v,
        rows: fixed(band.rows),
        columns: fixed(strip.columns),
      });
    }
  for (const name of ["leftShoulder", "rightShoulder"])
    patches.push({
      type: "sweep",
      name,
      sweep: name,
      u: [0, 1],
      v: [0, 1],
      rows: fixed(3),
      columns: fixed(8),
    });
  // hip tube strips by v, matched to the pieces of the loop they meet: half the back strip, the flank, half the front strip, the fork curve
  // a twelfth of a turn per column, so the tube ends on the ring's twelve directions with the anterior one at v 0.5
  const hipLeft: Array<{ v: [number, number]; columns: number }> = [
    { v: [-1 / 12, 1 / 12], columns: 2 },
    { v: [1 / 12, 3 / 12], columns: 2 },
    { v: [3 / 12, 5 / 12], columns: 2 },
    { v: [5 / 12, 11 / 12], columns: 6 },
  ];
  const hipStrips: Record<string, typeof hipLeft> = {
    leftHip: hipLeft,
    rightHip: [...hipLeft].reverse().map((s) => ({
      v: [1 - s.v[1], 1 - s.v[0]] as [number, number],
      columns: s.columns,
    })),
  };
  for (const name of ["leftHip", "rightHip"])
    hipStrips[name]!.forEach((s, k: number): void => {
      patches.push({
        type: "sweep",
        name: `${name}.${k}`,
        sweep: name,
        u: [0, 1],
        v: s.v,
        rows: fixed(4),
        columns: fixed(s.columns),
      });
    });

  const [u0, u1] = bands[1]!.u;
  const start = (name: string): IAutoMovieSurfaceNetwork.IEdge[] => [
    edge(name, [0, 0], [0, 1], 8),
  ];
  patches.push(
    {
      type: "bridge",
      name: "joinLeftShoulder",
      from: {
        edges: [
          edge("trunk", [u0, 1 / 6], [u0, 1 / 3], 2),
          edge("trunk", [u0, 1 / 3], [u1, 1 / 3], 2),
          edge("trunk", [u1, 1 / 3], [u1, 1 / 6], 2),
          edge("trunk", [u1, 1 / 6], [u0, 1 / 6], 2),
        ],
        tangent: "across",
      },
      to: { edges: start("leftShoulder"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.8,
    },
    {
      type: "bridge",
      name: "joinRightShoulder",
      from: {
        edges: [
          edge("trunk", [u0, 5 / 6], [u1, 5 / 6], 2),
          edge("trunk", [u1, 5 / 6], [u1, 2 / 3], 2),
          edge("trunk", [u1, 2 / 3], [u0, 2 / 3], 2),
          edge("trunk", [u0, 2 / 3], [u0, 5 / 6], 2),
        ],
        tangent: "across",
      },
      to: { edges: start("rightShoulder"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.8,
    },
  );
  const hipStart = (name: string): IAutoMovieSurfaceNetwork.IEdge[] =>
    hipStrips[name]!.map(
      (s): IAutoMovieSurfaceNetwork.IEdge =>
        edge(name, [0, s.v[0]], [0, s.v[1]], s.columns),
    );
  patches.push(
    {
      type: "bridge",
      name: "joinLeftHip",
      from: {
        edges: [
          edge("trunk", [0, 0.5], [0, 1 / 3], 2),
          edge("trunk", [0, 1 / 3], [0, 1 / 6], 2),
          edge("trunk", [0, 1 / 6], [0, 0], 2),
          { type: "curve", curve: "fork" },
        ],
        tangent: "across",
      },
      to: { edges: hipStart("leftHip"), tangent: "forward" },
      rows: fixed(3),
    },
    {
      type: "bridge",
      name: "joinRightHip",
      from: {
        edges: [
          { type: "curve", curve: "fork", reverse: true },
          edge("trunk", [0, 1], [0, 5 / 6], 2),
          edge("trunk", [0, 5 / 6], [0, 2 / 3], 2),
          edge("trunk", [0, 2 / 3], [0, 0.5], 2),
        ],
        tangent: "across",
      },
      to: { edges: hipStart("rightHip"), tangent: "forward" },
      rows: fixed(3),
    },
  );

  const crotchFront: number = profile.front(L.crotch);
  const crotchBack: number = profile.back(L.crotch);
  const value: IAutoMovieSurfaceNetwork = {
    sweeps,
    nodes: {
      forkFront: { type: "sweep", sweep: "trunk", u: 0, v: 0 },
      forkBack: { type: "sweep", sweep: "trunk", u: 0, v: 0.5 },
    },
    curves: {
      fork: {
        from: "forkFront",
        to: "forkBack",
        through: [
          toMetres(
            AutoMovieHumanVector.of(
              0,
              L.crotch - 18,
              crotchFront - 0.3 * (crotchFront - crotchBack),
            ),
          ),
          toMetres(
            AutoMovieHumanVector.of(
              0,
              L.crotch - 20,
              crotchBack + 0.3 * (crotchFront - crotchBack),
            ),
          ),
        ],
        segments: fixed(6),
        normal: { x: 0, y: -1, z: 0 },
      },
    },
    patches,
    rings: [
      {
        name: "neckBase",
        edges: [
          edge("trunk", [1, 0], [1, 1 / 6], 2),
          edge("trunk", [1, 1 / 6], [1, 1 / 3], 2),
          edge("trunk", [1, 1 / 3], [1, 2 / 3], 4),
          edge("trunk", [1, 2 / 3], [1, 5 / 6], 2),
          edge("trunk", [1, 5 / 6], [1, 1], 2),
        ],
        positions: neck.positions.map(toMetres),
      },
      ...(["left", "right"] as const).flatMap((side) => [
        {
          name: `upperArm.${side}`,
          edges: [edge(`${side}Shoulder`, [1, 0], [1, 1], 8)],
          positions: arms[side].positions.map(toMetres),
        },
        {
          name: `thigh.${side}`,
          edges: [edge(`${side}Hip`, [1, 0.5], [1, 1.5], 12)],
          positions: thighs[side].positions.map(toMetres),
        },
        // the loop one row before each ring, pinned to the ring moved back along its axis, so the trunk's share of the joined girth is the ring's own
        {
          name: `upperArm.${side}.collar`,
          edges: [edge(`${side}Shoulder`, [COLLAR.arm, 0], [COLLAR.arm, 1], 8)],
          positions: collarOf(arms[side], (1 - COLLAR.arm) * lengths[`upperArm.${side}`]!),
        },
        {
          name: `thigh.${side}.collar`,
          edges: [edge(`${side}Hip`, [COLLAR.thigh, 0.5], [COLLAR.thigh, 1.5], 12)],
          positions: collarOf(thighs[side], (1 - COLLAR.thigh) * lengths[`thigh.${side}`]!),
        },
      ]),
    ],
  };
  return {
    value,
    shapes: [
      { ring: "neckBase", shape: neck },
      { ring: "upperArm.left", shape: arms.left },
      { ring: "upperArm.right", shape: arms.right },
      { ring: "thigh.left", shape: thighs.left },
      { ring: "thigh.right", shape: thighs.right },
    ],
  };
};

/** Front and back squareness of the profile's section at a height. */
const squareness = (
  profile: profileAutoMovieHumanTrunk.IProfile,
  y: number,
): { front: number; back: number } => {
  // the profile's section is a superellipse quadrant each side of the widest point; columns 3 and 9 sit at
  // parameter 45 degrees, where x = half * (1 / sqrt 2)^(2 / n), so n = 2 ln(1 / sqrt 2) / ln(x / half)
  const half: number = Math.max(1e-6, profile.half(y));
  const read = (column: number): number => {
    const ratio: number = Math.min(
      0.999,
      Math.max(0.001, Math.abs(profile.section(column, y).x) / half),
    );
    return Math.min(20, Math.max(1.2, (2 * Math.log(Math.SQRT1_2)) / Math.log(ratio)));
  };
  return { front: read(3), back: read(9) };
};

/** The ring's control positions moved `distance` millimetres back along its axis, into the part, in metres. */
const collarOf = (
  shape: IAutoMovieHumanRingShape,
  distance: number,
): IAutoMovieVector3[] => {
  const n: IAutoMovieVector3 = AutoMovieHumanVector.normalize(shape.frame.normal);
  return shape.positions.map((p: IAutoMovieVector3) =>
    toMetres(AutoMovieHumanVector.offset(p, [n, -distance])),
  );
};

/** A circle of radius `r` millimetres. */
const circle = (r: number): IAutoMovieSweepSection => ({
  type: "superellipse",
  right: metres(r),
  up: metres(r),
  left: metres(r),
  down: metres(r),
  exponents: [2, 2, 2, 2],
});

/** The ring's section as a superellipse with its first axis along vertex `first`. */
const ringSection = (
  shape: IAutoMovieHumanRingShape,
  first: number,
): IAutoMovieSweepSection => {
  const n: number = shape.count;
  const r = (k: number): number => metres(shape.radii[(first + k) % n]!);
  return {
    type: "superellipse",
    right: r(0),
    up: r(n / 4),
    left: r(n / 2),
    down: r((3 * n) / 4),
    exponents: [2, 2, 2, 2],
  };
};

/** Rotation taking `+X` to the ring direction of vertex `first`, `+Z` to the ring's normal. */
const ringRotation = (
  shape: IAutoMovieHumanRingShape,
  first: number,
): IAutoMovieQuaternion => {
  const z: IAutoMovieVector3 = AutoMovieHumanVector.normalize(shape.frame.normal);
  const raw: IAutoMovieVector3 = shape.directions[first % shape.count]!;
  const x: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(raw, [z, -AutoMovieHumanVector.dot(raw, z)]),
  );
  const y: IAutoMovieVector3 = AutoMovieHumanVector.cross(z, x);
  return quaternionOf(x, y, z);
};

/** The unit quaternion of the rotation whose matrix columns are `x`, `y`, `z`. */
const quaternionOf = (
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const m00 = x.x, m10 = x.y, m20 = x.z;
  const m01 = y.x, m11 = y.y, m21 = y.z;
  const m02 = z.x, m12 = z.y, m22 = z.z;
  const trace: number = m00 + m11 + m22;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return { w: s / 4, x: (m21 - m12) / s, y: (m02 - m20) / s, z: (m10 - m01) / s };
  }
  if (m00 > m11 && m00 > m22) {
    const s: number = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return { w: (m21 - m12) / s, x: s / 4, y: (m01 + m10) / s, z: (m02 + m20) / s };
  }
  if (m11 > m22) {
    const s: number = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return { w: (m02 - m20) / s, x: (m01 + m10) / s, y: s / 4, z: (m12 + m21) / s };
  }
  const s: number = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return { w: (m10 - m01) / s, x: (m02 + m20) / s, y: (m12 + m21) / s, z: s / 4 };
};

const edge = (
  sweep: string,
  from: [number, number],
  to: [number, number],
  segments: number,
): IAutoMovieSurfaceNetwork.ISweepEdge => ({
  type: "sweep",
  sweep,
  from: { u: from[0], v: from[1] },
  to: { u: to[0], v: to[1] },
  segments: fixed(segments),
});

/** Each point's share of the polyline's chord length, 0 at the first and 1 at the last. */
const chordShares = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(
      lengths[k - 1]! + AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

const metres = (mm: number): number => mm / 1000;
const millimetres = (m: number): number => m * 1000;
const toMetres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** Turn the sampled network into the trunk cage: millimetres, chart addresses and rings. */
const emit = (
  network: INetwork,
  sampled: IAutoMovieSurfaceCage,
): IAutoMovieHumanCage => {
  const positions: number[] = sampled.cage.positions;
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < positions.length; k += 3)
    vertices.push({
      position: {
        x: millimetres(positions[k]!),
        y: millimetres(positions[k + 1]!),
        z: millimetres(positions[k + 2]!),
      },
    });
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = network.value.patches;
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): IAutoMovieHumanCage.IFace => {
      const corners = sampled.corners[f]!;
      const raw = corners.map((c: IAutoMovieSurfaceCoordinate) =>
        addressOf(patches[c.patch]!, c.s, c.t),
      );
      return {
        vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
        coordinates: unwrap(raw) as IAutoMovieHumanCage.IFace["coordinates"],
      };
    },
  );
  const rings: IAutoMovieHumanRing[] = network.shapes.map(
    ({ ring, shape }): IAutoMovieHumanRing => ({
      site: shape.site,
      side: shape.side,
      vertices: sampled.rings[ring]!,
      start: shape.start,
      frame: shape.frame,
    }),
  );
  return { vertices, faces, creases: [], rings };
};

/** The chart address of a patch point: the trunk's main chart, or the branch chart of a shoulder or hip tube and its bridge. */
const addressOf = (
  patch: IAutoMovieSurfaceNetwork.IPatch,
  s: number,
  t: number,
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> => {
  const lerp = (r: [number, number], x: number): number => r[0] + (r[1] - r[0]) * x;
  const wrap = (v: number): number => ((v % 1) + 1) % 1;
  const branchOf = (name: string): AutoMovieHumanBranch<"trunk"> | null =>
    name.startsWith("leftShoulder") || name === "joinLeftShoulder"
      ? "leftShoulder"
      : name.startsWith("rightShoulder") || name === "joinRightShoulder"
        ? "rightShoulder"
        : name.startsWith("leftHip") || name === "joinLeftHip"
          ? "leftHip"
          : name.startsWith("rightHip") || name === "joinRightHip"
            ? "rightHip"
            : null;
  if (patch.type === "sweep") {
    const branch = branchOf(patch.name);
    if (branch === null)
      return { part: "trunk", side: null, branch: null, u: lerp(patch.u, t), v: wrap(lerp(patch.v, s)) };
    const hip: boolean = branch === "leftHip" || branch === "rightHip";
    return {
      part: "trunk",
      side: null,
      branch,
      u: 0.3 + 0.7 * lerp(patch.u, t),
      v: wrap(lerp(patch.v, s) - (hip ? 0.5 : 0)),
    };
  }
  return {
    part: "trunk",
    side: null,
    branch: branchOf(patch.name),
    u: 0.3 * t,
    v: wrap(s),
  };
};

/** Keep one face's corners within half a turn: a face across the wrap meridian writes 1 where it would write 0. */
const unwrap = (
  corners: IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[],
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[] => {
  const vs: number[] = corners.map((c) => c.v);
  if (Math.max(...vs) - Math.min(...vs) <= 0.5) return corners;
  return corners.map((c) => (c.v < 0.5 ? { ...c, v: c.v + 1 > 1 ? 1 : c.v + 1 } : c));
};
