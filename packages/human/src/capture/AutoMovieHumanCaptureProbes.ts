import { AutoMovieViewChain, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1,
  IAutoMovieLoftSectionFrame,
  IAutoMovieMark,
  IAutoMovieMesh,
  IAutoMovieMeshWinding,
  IAutoMovieVector3,
  IAutoMovieViewAxis,
} from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../generation/conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../generation/conic/AutoMovieHumanConicSection";
import type { AutoMovieHumanEmptyProbes } from "../generation/conic/AutoMovieHumanEmptyProbes";

/** Builds empty-probe inspection marks for a Human capture figure. */
export namespace AutoMovieHumanCaptureProbes {
  /** The generated figure inputs used to evaluate every empty probe. */
  export interface IInput {
    /** The person's name and scene path. */
    person: string;

    /** The person's probes in millimetres. */
    probes: readonly AutoMovieHumanEmptyProbes.IProbe[];

    /** The authored families used to build the convex hull. */
    members: readonly IAutoMovieHumanF1.IMember[];

    /** The generated pieces, in metres in the figure's frame. */
    pieces: readonly IAutoMovieHumanF1.IPiece[];
  }

  /** The generated empty-probe inspection marks. */
  export type IOutput = IAutoMovieMark[];

  /**
   * The person's empty probes as inspection marks, each measured against the
   * generated skin and against the figure's convex hull.
   *
   * Every placed probe becomes one `points` mark at `<person>/probe/<name>`, its
   * point converted from millimetres to metres in the pieces' frame, anchored to
   * the person's object as its curves are. Its kind is the first state that
   * applies:
   *
   * - `probe/outside-hull`, flagged, when the point lies outside the convex hull of
   *   the families' stored course and section points, since such a probe tests
   *   open air and must be moved;
   * - `probe/filled`, flagged, when the winding query
   *   (`createAutoMovieMeshWindingQuery`) over the union of the generated pieces
   *   finds the point inside the skin or on it;
   * - `probe/empty`, unflagged, otherwise.
   *
   * The hull is built by `buildAutoMovieConvexHull` from every member family's
   * course point and section anchor points at each of its knots, and a mirrored
   * family's reflected in the median plane, never from the realized skin, whose
   * vertex count the hull's extent step would pay for twice over. A probe the law
   * could not place has no mark; its reason stays in the listing. Without a
   * generated piece every placed probe is empty.
   *
   * @param input The person, its probes, its authored families, and its generated pieces.
   * @returns One mark per placed probe, in listing order.
   */
  export function mark(input: IInput): IOutput {
    const { person, probes, members, pieces } = input;
    const placed: AutoMovieHumanEmptyProbes.IPlaced[] = probes.filter(
      (
        probe: AutoMovieHumanEmptyProbes.IProbe,
      ): probe is AutoMovieHumanEmptyProbes.IPlaced => "point" in probe,
    );
    if (placed.length === 0) return [];
    const hull: (point: readonly number[]) => IAutoMovieMeshWinding =
      AutoMovieEngineGeometry.createMeshWindingQuery(
        AutoMovieEngineGeometry.buildConvexHull(hullPoints(members)),
      );
    const skin: ((point: readonly number[]) => IAutoMovieMeshWinding) | null =
      union(pieces);
    return placed.map(
      (probe: AutoMovieHumanEmptyProbes.IPlaced): IAutoMovieMark => {
        const point: number[] = probe.point.map(
          (value: number): number => value / 1000,
        );
        const enclosed: IAutoMovieMeshWinding = hull(point);
        const filled: IAutoMovieMeshWinding | null =
          skin === null ? null : skin(point);
        const state: keyof typeof STATES =
          !enclosed.inside && !enclosed.surface
            ? "outside-hull"
            : filled !== null && (filled.inside || filled.surface)
              ? "filled"
              : "empty";
        return {
          path: `${person}/probe/${probe.name}`,
          kind: `probe/${state}`,
          label: STATES[state].label,
          color: STATES[state].color,
          shape: { type: "points", points: point },
          flagged: STATES[state].flagged,
          anchor: person,
        };
      },
    );
  }
}


/**
 * Legend text, colour and flag of each probe state, in the order they are
 * tested.
 */
const STATES: Readonly<
  Record<
    "outside-hull" | "filled" | "empty",
    { label: string; color: number; flagged: boolean }
  >
> = {
  "outside-hull": {
    label: "probe outside hull",
    color: 0xff9800,
    flagged: true,
  },
  filled: { label: "filled probe", color: 0xe53935, flagged: true },
  empty: { label: "empty probe", color: 0x00c853, flagged: false },
};

/**
 * Every member family's course point and section anchor points at each of its
 * knots, metres in the pieces' frame, with a mirrored family's reflected in the
 * median plane `z = 0`. A knot whose section chain the engine refuses gives its
 * course point alone.
 */
function hullPoints(
  members: readonly IAutoMovieHumanF1.IMember[],
): IAutoMovieVector3[] {
  const points: IAutoMovieVector3[] = [];
  for (const { family, mirrored } of members) {
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
    const read: (s: number) => number[] =
      AutoMovieHumanConicLoft.reader(family);
    for (const knot of family.knots) {
      const frame: IAutoMovieLoftSectionFrame = axis.at(knot);
      const chain: IAutoMovieHumanConicSection.IChain =
        AutoMovieHumanConicSection.resolve(read(knot), family.layout);
      const own: number[][] = [
        [...frame.origin],
        ...(AutoMovieViewChain.of(chain.input).fault !== null
          ? []
          : chain.input.points.map((p: readonly number[]): number[] =>
              [0, 1, 2].map(
                (c: number): number =>
                  frame.origin[c]! + p[0]! * frame.u[c]! + p[1]! * frame.v[c]!,
              ),
            )),
      ];
      for (const p of own) {
        points.push({ x: p[0]! / 1000, y: p[1]! / 1000, z: p[2]! / 1000 });
        if (mirrored)
          points.push({ x: p[0]! / 1000, y: p[1]! / 1000, z: -p[2]! / 1000 });
      }
    }
  }
  return points;
}

/**
 * The winding query over all generated pieces as one triangle surface, or null
 * when none has a triangle.
 */
function union(
  pieces: readonly IAutoMovieHumanF1.IPiece[],
): ((point: readonly number[]) => IAutoMovieMeshWinding) | null {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const piece of pieces) {
    if (piece.indices.length === 0) continue;
    const offset: number = positions.length / 3;
    for (const value of piece.positions) positions.push(value);
    for (const index of piece.indices) indices.push(index + offset);
  }
  if (indices.length === 0) return null;
  const mesh: IAutoMovieMesh = {
    positions,
    normals: null,
    uvs: null,
    indices,
    skin: null,
  };
  return AutoMovieEngineGeometry.createMeshWindingQuery(mesh);
}
