import { IAutoMovieSurfaceCage, IAutoMovieSurfaceNetwork, IAutoMovieSweep, sampleAutoMovieSurfaceNetwork } from "@automovie/engine";

import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkNetwork } from "./IAutoMovieHumanTrunkNetwork";
import { emitAutoMovieHumanTrunk } from "./emitAutoMovieHumanTrunk";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";
import { sweepAutoMovieHumanTrunkArm } from "./sweepAutoMovieHumanTrunkArm";
import { sweepAutoMovieHumanTrunkBody } from "./sweepAutoMovieHumanTrunkBody";
import { sweepAutoMovieHumanTrunkThigh } from "./sweepAutoMovieHumanTrunkThigh";

/**
 * Loft the trunk: one sweep up the body from the crotch to the neck-base ring (`sweepAutoMovieHumanTrunkBody`), with the shoulder tubes (`sweepAutoMovieHumanTrunkArm`) leaving openings in its flanks for the mid-upper-arm rings and the hip tubes (`sweepAutoMovieHumanTrunkThigh`) leaving its lower edge on either side of a fork curve for the mid-thigh rings.
 *
 * Each tube is joined to the trunk by a bridge that leaves the trunk across its edge and arrives along the tube, and its last section is pinned to the ring the neighbouring part shares, so the junction welds coincident vertices. The hip bridges are one trunk row tall, so the subdivided surface meets no change of row spacing at the hips; the fork curve runs under the crotch from the trunk's front midline to its back, and each hip bridge meets the tube's outer half direction for direction and its medial half along the fork.
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
  const network: IAutoMovieHumanTrunkNetwork = networkOf(measurements, skeleton);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: network.value,
    tier: AutoMovieHumanTrunkSweep.TIER,
  });
  return emitAutoMovieHumanTrunk(network, sampled);
}

/** The fork curve under the crotch: its two inner points lie `drop` trunk rows below the crotch and `inset` of the crotch depth in from the front and the back, so the thighs part in a cleft about as deep as the MakeHuman references' just below the crotch. */
const FORK = { drop: 0.8, inset: 0.3 } as const;

/** Trunk strips by `v`, a twelfth of a turn per column: front across the anterior midline, left flank, back, right flank. */
const STRIPS: Array<{ name: string; v: [number, number]; columns: number }> = [
  { name: "front", v: [-1 / 6, 1 / 6], columns: 4 },
  { name: "left", v: [1 / 6, 1 / 3], columns: 2 },
  { name: "back", v: [1 / 3, 2 / 3], columns: 4 },
  { name: "right", v: [2 / 3, 5 / 6], columns: 2 },
];

/**
 * The left hip tube's strips by `v`, matched to the pieces of the loop they meet: half the back strip, the flank, half the front strip, the fork curve. The tube's `v` runs from the back (0) through the left (1/4) to the front (1/2), a twelfth of a turn per column, so the tube ends on the ring's twelve directions with the anterior one at `v` 0.5; the right tube's strips mirror these.
 */
const HIP_LEFT: Array<{ v: [number, number]; columns: number }> = [
  { v: [0, 2 / 12], columns: 2 },
  { v: [2 / 12, 4 / 12], columns: 2 },
  { v: [4 / 12, 6 / 12], columns: 2 },
  { v: [6 / 12, 12 / 12], columns: 6 },
];

const networkOf = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanTrunkNetwork => {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const { fixed, edge, toMetres } = S;
  const frame: IAutoMovieHumanTrunkFrame = measureAutoMovieHumanTrunkFrame(measurements, skeleton, "left");
  const profile: profileAutoMovieHumanTrunk.IProfile = profileAutoMovieHumanTrunk(frame);
  const ring = (site: "neckBase" | "upperArm" | "thigh", side: AutoMovieHumanSide | null): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({ skeleton, measurements, site, side, part: "trunk" });
  const neck: IAutoMovieHumanRingShape = ring("neckBase", null);
  const arms: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape> = {
    left: ring("upperArm", "left"),
    right: ring("upperArm", "right"),
  };
  const thighs: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape> = {
    left: ring("thigh", "left"),
    right: ring("thigh", "right"),
  };
  const body: sweepAutoMovieHumanTrunkBody.IOutput = sweepAutoMovieHumanTrunkBody({
    frame,
    profile,
    neck,
    thighs: [thighs.left, thighs.right],
  });
  const tube: Record<"arm" | "thigh", Record<AutoMovieHumanSide, { sweep: IAutoMovieSweep; length: number }>> = {
    arm: {
      left: sweepAutoMovieHumanTrunkArm({ frame, ring: arms.left, side: "left" }),
      right: sweepAutoMovieHumanTrunkArm({ frame, ring: arms.right, side: "right" }),
    },
    thigh: {
      left: sweepAutoMovieHumanTrunkThigh({ frame, ring: thighs.left, side: "left", furrow: body.furrow }),
      right: sweepAutoMovieHumanTrunkThigh({ frame, ring: thighs.right, side: "right", furrow: body.furrow }),
    },
  };
  const sweeps: Record<string, IAutoMovieSweep> = {
    trunk: body.sweep,
    leftShoulder: tube.arm.left.sweep,
    rightShoulder: tube.arm.right.sweep,
    leftHip: tube.thigh.left.sweep,
    rightHip: tube.thigh.right.sweep,
  };

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const bands: Array<{ u: [number, number]; rows: number }> = [
    { u: [0, body.axilla], rows: S.LOWER_ROWS },
    { u: [body.axilla, body.shoulder], rows: 2 },
    // one row from the shoulder line to the neck ring: the leaning shoulder plane comes within a few millimetres of the
    // ring at the front and back, so more rows there would crowd into a crease
    { u: [body.shoulder, 1], rows: 1 },
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
    patches.push({ type: "sweep", name, sweep: name, u: [0, 1], v: [0, 1], rows: fixed(3), columns: fixed(8) });
  const hipStrips: Record<string, typeof HIP_LEFT> = {
    leftHip: HIP_LEFT,
    rightHip: [...HIP_LEFT].reverse().map((s) => ({ v: [1 - s.v[1], 1 - s.v[0]] as [number, number], columns: s.columns })),
  };
  for (const name of ["leftHip", "rightHip"])
    hipStrips[name]!.forEach((s, k: number): void => {
      patches.push({
        type: "sweep",
        name: `${name}.${k}`,
        sweep: name,
        u: [0, 1],
        v: s.v,
        rows: fixed(2),
        columns: fixed(s.columns),
      });
    });

  const [u0, u1] = bands[1]!.u;
  const start = (name: string): IAutoMovieSurfaceNetwork.IEdge[] => [edge(name, [0, 0], [0, 1], 8)];
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
    hipStrips[name]!.map((s): IAutoMovieSurfaceNetwork.IEdge => edge(name, [0, s.v[0]], [0, s.v[1]], s.columns));
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
      rows: fixed(1),
      tension: 0.6,
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
      rows: fixed(1),
      tension: 0.6,
    },
  );

  // the fork runs under the crotch section as lofted
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const front: number = body.crotch.centre + body.crotch.depth;
  const back: number = body.crotch.centre - body.crotch.depth;
  const forkY: number = L.crotch - (FORK.drop * (L.axilla - L.crotch)) / S.LOWER_ROWS;
  const collar = (shape: IAutoMovieHumanRingShape, share: number, length: number): IAutoMovieVector3[] =>
    S.collarOf(shape, (1 - share) * length);
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
          toMetres(AutoMovieHumanVector.of(0, forkY, front - FORK.inset * (front - back))),
          toMetres(AutoMovieHumanVector.of(0, forkY, back + FORK.inset * (front - back))),
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
          edges: [edge(`${side}Shoulder`, [S.COLLAR.arm, 0], [S.COLLAR.arm, 1], 8)],
          positions: collar(arms[side], S.COLLAR.arm, tube.arm[side].length),
        },
        {
          name: `thigh.${side}.collar`,
          edges: [edge(`${side}Hip`, [S.COLLAR.thigh, 0.5], [S.COLLAR.thigh, 1.5], 12)],
          positions: collar(thighs[side], S.COLLAR.thigh, tube.thigh[side].length),
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
