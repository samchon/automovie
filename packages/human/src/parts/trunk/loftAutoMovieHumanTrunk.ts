import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkNetwork } from "./IAutoMovieHumanTrunkNetwork";
import { curveAutoMovieHumanPerineum } from "./curveAutoMovieHumanPerineum";
import { emitAutoMovieHumanTrunk } from "./emitAutoMovieHumanTrunk";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
import { networkAutoMovieHumanUpperTrunk } from "./networkAutoMovieHumanUpperTrunk";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";
import { sweepAutoMovieHumanTrunkArm } from "./sweepAutoMovieHumanTrunkArm";
import { sweepAutoMovieHumanTrunkBody } from "./sweepAutoMovieHumanTrunkBody";
import { sweepAutoMovieHumanTrunkThigh } from "./sweepAutoMovieHumanTrunkThigh";

/**
 * Construct the trunk: a horizontal torso sweep from the crotch to the axilla (`sweepAutoMovieHumanTrunkBody`), an anatomical curve network on to the neck-base ring (`networkAutoMovieHumanUpperTrunk`), with the shoulder tubes (`sweepAutoMovieHumanTrunkArm`) leaving openings in its flanks for the mid-upper-arm rings and the hip tubes (`sweepAutoMovieHumanTrunkThigh`) leaving its lower edge on either side of a gusset between the thighs for the mid-thigh rings.
 *
 * Each tube is joined to the trunk by a bridge that leaves the trunk across its edge and arrives along the tube, and its last section is pinned to the ring the neighbouring part shares, so the junction welds coincident vertices. Each hip bridge joins the nonplanar trunk/groin loop directly to the pinned thigh collar with two Hermite rows, then one straight support row reaches the shared ring; the gusset's two Coons strips run under the crotch from the trunk's front midline to its back on either side of a seam, and each hip bridge leaves the trunk's outer half and its groin edge. The trunk's midlines run on into the seam, and the four extra edges the division needs meet at the groin edges' ends, valence five each, where the references' loops turn into the thighs.
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
  const network: IAutoMovieHumanTrunkNetwork = networkOf(
    measurements,
    skeleton,
  );
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: network.value,
    tier: AutoMovieHumanTrunkSweep.TIER,
  });
  return {
    ...emitAutoMovieHumanTrunk(network, sampled),
    construction: IAutoMovieHumanCage.inModel(network.value),
  };
}

/** The gusset's half-width round the trunk at the crotch, one front or back column: the seam's neighbours, where the thighs' tubes leave. */
const GUSSET: number = 1 / 18;

/**
 * The front and back strips' columns at the crotch and above the lower abdomen. Below the abdomen each strip carries two more columns, which the gusset between the thighs needs; a transition band two rows above the buttock level sheds them, where the sweep is gently curved along the spine and the references carry poles in the lower abdomen and the lower back.
 */
const LOWER_COLUMNS: { readonly below: 6; readonly above: 4 } = { below: 6, above: 4 } as const;

/** The row above the buttock level where the transition band starts, and its rows. */
const LOWER_TRANSITION: { readonly row: 2; readonly rows: 2 } = { row: 2, rows: 2 } as const;

/** One straight support row between the pinned thigh collar and shared ring. */
const HIP_ROWS: number = 1;

/**
 * Trunk strips by `v`: front across the anterior midline and back across the posterior one, four columns each, and two on each flank, which the arm openings take. Below the lower abdomen the front and back strips carry six columns each, so the sixteen columns round the trunk give each thigh twelve where the trunk divides: six of the trunk's outer half and six along the gusset between the thighs.
 */
const STRIPS: Array<{ name: string; v: [number, number]; columns: number }> = [
  { name: "front", v: [-1 / 6, 1 / 6], columns: 4 },
  { name: "left", v: [1 / 6, 1 / 3], columns: 2 },
  { name: "back", v: [1 / 3, 2 / 3], columns: 4 },
  { name: "right", v: [2 / 3, 5 / 6], columns: 2 },
];

/**
 * The left hip tube's strips by `v`, matched to the pieces of the loop they meet: two columns of the back strip, the flank, two columns of the front strip, the groin edge. The tube's `v` runs from the back (0) through the left (1/4) to the front (1/2), a twelfth of a turn per column, so the tube ends on the ring's twelve directions with the anterior one at `v` 0.5; the right tube's strips mirror these.
 */
const HIP_LEFT: Array<{ v: [number, number]; columns: number }> = [
  { v: [0, 2 / 12], columns: 2 },
  { v: [2 / 12, 4 / 12], columns: 2 },
  { v: [4 / 12, 6 / 12], columns: 2 },
  { v: [6 / 12, 12 / 12], columns: 6 },
];

const networkOf: (measurements: IAutoMovieHumanMeasurements, skeleton: IAutoMovieHumanSkeleton) => IAutoMovieHumanTrunkNetwork = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanTrunkNetwork => {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const { fixed, edge, toMetres }: typeof S = S;
  const frame: IAutoMovieHumanTrunkFrame = measureAutoMovieHumanTrunkFrame(
    measurements,
    skeleton,
    "left",
  );
  const profile: profileAutoMovieHumanTrunk.IProfile =
    profileAutoMovieHumanTrunk(frame);
  const ring: (site: "neckBase" | "upperArm" | "thigh", side: AutoMovieHumanSide | null) => IAutoMovieHumanRingShape = (
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
  const body: sweepAutoMovieHumanTrunkBody.IOutput =
    sweepAutoMovieHumanTrunkBody({
      frame,
      profile,
      thighs: [thighs.left, thighs.right],
    });
  const upper: networkAutoMovieHumanUpperTrunk.IOutput =
    networkAutoMovieHumanUpperTrunk({
      trunk: body.sweep,
      neck,
      frame,
      rightFrame: measureAutoMovieHumanTrunkFrame(measurements, skeleton, "right"),
    });
  const tube: {
    arm: Record<AutoMovieHumanSide, ReturnType<typeof sweepAutoMovieHumanTrunkArm>>;
    thigh: Record<AutoMovieHumanSide, ReturnType<typeof sweepAutoMovieHumanTrunkThigh>>;
  } = {
    arm: {
      left: sweepAutoMovieHumanTrunkArm({
        frame,
        ring: arms.left,
        side: "left",
      }),
      right: sweepAutoMovieHumanTrunkArm({
        frame,
        ring: arms.right,
        side: "right",
      }),
    },
    thigh: {
      left: sweepAutoMovieHumanTrunkThigh({
        frame,
        ring: thighs.left,
        side: "left",
        furrow: body.furrow,
        row: body.row,
      }),
      right: sweepAutoMovieHumanTrunkThigh({
        frame,
        ring: thighs.right,
        side: "right",
        furrow: body.furrow,
        row: body.row,
      }),
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
  const lower: number = LOWER_TRANSITION.row;
  const transition: { u: [number, number]; rows: number } = {
    u: [body.rows[lower]!, body.rows[lower + LOWER_TRANSITION.rows]!],
    rows: LOWER_TRANSITION.rows,
  };
  const bands: Array<{ u: [number, number]; rows: number }> = [
    ...body.rows
      .slice(1)
      .map((u: number, k: number): { u: [number, number]; rows: number } => ({
        u: [body.rows[k]!, u],
        rows: 1,
      }))
      .filter(
        (band: { u: [number, number] }): boolean =>
          band.u[1] <= transition.u[0] || band.u[0] >= transition.u[1],
      ),
    transition,
  ];
  for (const band of bands)
    for (const strip of STRIPS) {
      const wide: boolean = strip.columns === LOWER_COLUMNS.above;
      if (band === transition && wide) {
        // the lower abdomen and the lower back shed the two columns of the front and back strips the gusset needs
        patches.push({
          type: "transition",
          name: `trunk.${strip.name}.${patches.length}`,
          sweep: "trunk",
          u: band.u,
          v: strip.v,
          start: fixed(LOWER_COLUMNS.below),
          end: fixed(LOWER_COLUMNS.above),
          rows: fixed(band.rows),
        });
        continue;
      }
      patches.push({
        type: "sweep",
        name: `trunk.${strip.name}.${patches.length}`,
        sweep: "trunk",
        u: band.u,
        v: strip.v,
        rows: fixed(band.rows),
        columns: fixed(
          wide && band.u[1] <= transition.u[0]
            ? LOWER_COLUMNS.below
            : strip.columns,
        ),
      });
    }
  const charts: IAutoMovieHumanTrunkNetwork["charts"] = { ...upper.charts };
  for (const patch of patches) {
    if (patch.type !== "sweep" && patch.type !== "transition")
      throw new Error("the lower trunk chart requires sweep patches");
    charts[patch.name] = {
      u: [
        (upper.chartAxilla * body.rows.indexOf(patch.u[0])) /
          (body.rows.length - 1),
        (upper.chartAxilla * body.rows.indexOf(patch.u[1])) /
          (body.rows.length - 1),
      ],
      v: patch.v,
    };
  }
  patches.push(...upper.patches);
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
  const hipStrips: Record<string, typeof HIP_LEFT> = {
    leftHip: HIP_LEFT,
    rightHip: [...HIP_LEFT].reverse().map((s: { v: [number, number]; columns: number }): { v: [number, number]; columns: number } => ({
      v: [1 - s.v[1], 1 - s.v[0]] as [number, number],
      columns: s.columns,
    })),
  };
  for (const name of ["leftHip", "rightHip"])
    hipStrips[name]!.forEach((s: { v: [number, number]; columns: number }, k: number): void => {
      patches.push({
        type: "sweep",
        name: `${name}.${k}`,
        sweep: name,
        u: [0, 1],
        v: s.v,
        rows: fixed(HIP_ROWS),
        columns: fixed(s.columns),
      });
    });

  // The opening starts at its anterior lower corner, one eighth-turn from the tube's anterior axis.
  const start: (side: AutoMovieHumanSide) => IAutoMovieSurfaceNetwork.IEdge[] = (side: AutoMovieHumanSide): IAutoMovieSurfaceNetwork.IEdge[] => {
    const name: string = `${side}Shoulder`;
    const phase: number = S.SHOULDER_PHASE[side];
    return [edge(name, [0, phase], [0, 1 + phase], 8)];
  };
  patches.push(
    {
      type: "bridge",
      name: "joinLeftShoulder",
      from: {
        edges: upper.shoulders.left,
        tangent: "across",
      },
      to: { edges: start("left"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.8,
    },
    {
      type: "bridge",
      name: "joinRightShoulder",
      from: {
        edges: upper.shoulders.right,
        tangent: "across",
      },
      to: { edges: start("right"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.8,
    },
  );
  const hipStart: (name: string) => IAutoMovieSurfaceNetwork.IEdge[] = (name: string): IAutoMovieSurfaceNetwork.IEdge[] =>
    hipStrips[name]!.map(
      (s: { v: [number, number]; columns: number }): IAutoMovieSurfaceNetwork.IEdge =>
        edge(name, [0, s.v[0]], [0, s.v[1]], s.columns),
    );
  patches.push(
    {
      type: "bridge",
      name: "joinLeftHip",
      from: {
        edges: [
          edge("trunk", [0, 0.5 - GUSSET], [0, 1 / 3], 2),
          edge("trunk", [0, 1 / 3], [0, 1 / 6], 2),
          edge("trunk", [0, 1 / 6], [0, GUSSET], 2),
          { type: "curve", curve: "groinLeft" },
        ],
        tangent: "across",
      },
      to: { edges: hipStart("leftHip"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.6,
    },
    {
      type: "bridge",
      name: "joinRightHip",
      from: {
        edges: [
          { type: "curve", curve: "groinRight", reverse: true },
          edge("trunk", [0, 1 - GUSSET], [0, 5 / 6], 2),
          edge("trunk", [0, 5 / 6], [0, 2 / 3], 2),
          edge("trunk", [0, 2 / 3], [0, 0.5 + GUSSET], 2),
        ],
        tangent: "across",
      },
      to: { edges: hipStart("rightHip"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.6,
    },
  );

  // the gusset between the thighs: its seam runs under the crotch section as lofted from the front midline to the back, and
  // each side's edge from one column off the front midline to one column off the back, beside the seam; the thighs'
  // tubes leave the edges, so the trunk's front and back midlines run on into the seam unbroken and the four extra edges
  // the division needs meet at the edges' ends, one each, where the references' loops turn into the thighs
  patches.push(
    {
      type: "coons",
      name: "gussetLeft",
      sides: [
        { type: "curve", curve: "seam" },
        edge("trunk", [0, 0.5], [0, 0.5 - GUSSET], 1),
        { type: "curve", curve: "groinLeft", reverse: true },
        edge("trunk", [0, GUSSET], [0, 0], 1),
      ],
    },
    {
      type: "coons",
      name: "gussetRight",
      sides: [
        edge("trunk", [0, 1], [0, 1 - GUSSET], 1),
        { type: "curve", curve: "groinRight" },
        edge("trunk", [0, 0.5 + GUSSET], [0, 0.5], 1),
        { type: "curve", curve: "seam", reverse: true },
      ],
    },
  );
  const collar: (shape: IAutoMovieHumanRingShape, share: number, length: number) => IAutoMovieVector3[] = (
    shape: IAutoMovieHumanRingShape,
    share: number,
    length: number,
  ): IAutoMovieVector3[] => S.collarOf(shape, (1 - share) * length);
  const value: IAutoMovieSurfaceNetwork = {
    sweeps,
    nodes: {
      ...upper.nodes,
      seamFront: { type: "sweep", sweep: "trunk", u: 0, v: 0 },
      seamBack: { type: "sweep", sweep: "trunk", u: 0, v: 0.5 },
      groinLeftFront: { type: "sweep", sweep: "trunk", u: 0, v: GUSSET },
      groinLeftBack: { type: "sweep", sweep: "trunk", u: 0, v: 0.5 - GUSSET },
      groinRightFront: { type: "sweep", sweep: "trunk", u: 0, v: 1 - GUSSET },
      groinRightBack: { type: "sweep", sweep: "trunk", u: 0, v: 0.5 + GUSSET },
    },
    curves: {
      ...upper.curves,
      ...curveAutoMovieHumanPerineum({
        crotch: body.crotch,
        height: frame.levels.crotch,
        row: body.row,
      }),
    },
    patches,
    rings: [
      // the measured girths, held exactly by the limit surface along their rows
      ...body.girths.map(
        ({ row, girth }: { row: number; girth: number }, k: number): IAutoMovieSurfaceNetwork.IRing => {
          const u: number = body.rows[row]!;
          const columns: (strip: { columns: number }) => number = (strip: { columns: number }): number =>
            strip.columns === LOWER_COLUMNS.above && u <= transition.u[0]
              ? LOWER_COLUMNS.below
              : strip.columns;
          return {
            name: `girth.${k}`,
            edges: STRIPS.map(
              (strip: { v: [number, number]; columns: number }): IAutoMovieSurfaceNetwork.ISweepEdge =>
                edge("trunk", [u, strip.v[0]], [u, strip.v[1]], columns(strip)),
            ),
            perimeter: S.metres(girth),
          };
        },
      ),
      {
        name: "neckBase",
        edges: upper.neckEdges,
        positions: neck.positions.map(toMetres),
      },
      ...(["left", "right"] as const).flatMap((side: AutoMovieHumanSide): IAutoMovieSurfaceNetwork.IRing[] => [
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
          edges: [
            edge(`${side}Shoulder`, [S.COLLAR.arm, 0], [S.COLLAR.arm, 1], 8),
          ],
          positions: collar(arms[side], S.COLLAR.arm, tube.arm[side].length),
        },
        {
          name: `thigh.${side}.collar`,
          edges: [
            edge(
              `${side}Hip`,
              [0, 0.5],
              [0, 1.5],
              12,
            ),
          ],
          positions: S.collarOf(thighs[side], tube.thigh[side].collar),
        },
      ]),
    ],
  };
  return {
    value,
    charts,
    shapes: [
      { ring: "neckBase", shape: neck },
      { ring: "upperArm.left", shape: arms.left },
      { ring: "upperArm.right", shape: arms.right },
      { ring: "thigh.left", shape: thighs.left },
      { ring: "thigh.right", shape: thighs.right },
    ],
  };
};
