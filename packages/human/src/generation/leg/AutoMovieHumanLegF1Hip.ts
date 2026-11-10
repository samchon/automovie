import { AutoMovieCurveMath64 as M } from "@automovie/engine";

import { AutoMovieHumanLoftMesh as Mesh } from "../../lofting/AutoMovieHumanLoftMesh";
import type { AutoMovieHumanF1Fork } from "../trunk/AutoMovieHumanF1Fork";
import { AutoMovieHumanLegF1Lines as Lines } from "./AutoMovieHumanLegF1Lines";
import { AutoMovieHumanLegF1World as World } from "./AutoMovieHumanLegF1World";
import inputs from "./AutoMovieHumanLegF1HipCurves.json";

/** Existing indexed ordinary-loft buffers, in absolute ISB world mm. */
type Context = Mesh.IContext;
/** One measured angular column of the fixed F1 proximal surface. */
type Column = (typeof inputs.records)[number]["rails"][number];
/** An unchanged owned boundary and its increasing angular parameters. */
type Rail = { ids: number[]; phases: number[] };

/**
 * The F1 proximal surface from saved complete longitudinal cubic curves.
 *
 * The rejected two-boundary Hermite patch lost the buttock's intermediate
 * volume and produced the broad dark collar in the 16:53 GPU back views.
 * The old 47 open arcs also followed that artifact. They remain observations
 * in Native JSON, rather than interpolation constraints for this surface.
 *
 * HipCurves holds numerical controls measured offline from the reference,
 * with every original external fork/CROTCH and distal-thigh point retained.
 * The fork is nonplanar: its child rail departs up to 31.59 mm from the parent
 * plane. Each longitudinal curve therefore starts at its own actual rail
 * height, rather than incorrectly replacing the branch by a planar cap.
 *
 * Both ends and all interior curves use one angular chart per side. Its
 * centre was selected inside the two projected boundaries' shared visibility
 * kernel; that parameter-map choice moves neither the anatomical axis nor
 * the world coordinates. Runtime needs only these saved curves and the
 * existing loft operators, never the external reference mesh.
 */
export namespace AutoMovieHumanLegF1Hip {
  /**
   * Join the actual shared fork to the existing first regular thigh ring.
   *
   * Common transverse rows evaluate the saved piecewise cubic columns. Their
   * offline 0.05 mm control-hull chord bound and two-degree derivative cone
   * apply to every final common longitudinal interval. The saved source
   * coefficients and both ports are unchanged. These are display bounds,
   * not a global source-error or smooth-junction certificate; the assembled
   * surface still needs crossing and visual inspection.
   */
  export function attach(mesh: Context, side: "left" | "right", fork: AutoMovieHumanF1Fork.IResult): void {
    const recipe: (typeof inputs.records)[number] | undefined = inputs.records.find(
      (record: (typeof inputs.records)[number]): boolean => record.side === side);
    if (recipe === undefined) throw new Error("The fixed F1 hip has no saved complete curve family");
    const sections: Lines.IFixedSection[] = Lines.fixed(side).rows;
    const original: M.V[] = sections[0]!.points;
    const ownedFork: M.V[] = World.forkClock(fork[side], sections[0]!.frame);

    // Port values are independently shared with trunk and thigh. A changed
    // owner must invalidate this fixed recipe instead of stretching it to fit.
    const forkKeys: Set<string> = new Set(ownedFork.map((p: M.V): string => p.join(",")));
    if (ownedFork.length !== recipe.upper.points.length || recipe.upper.points.some(
      (p: number[]): boolean => !forkKeys.has(p.join(","))))
      throw new Error("The saved F1 hip curves no longer share the actual fork");
    const ids: Map<string, number> = new Map(original.map((p: M.V, i: number): [string, number] => [p.join(","), i]));
    const lower: Rail = { phases: recipe.lower.phases, ids: recipe.lower.points.map((p: number[]): number => {
      const id: number | undefined = ids.get(p.join(","));
      if (id === undefined || Mesh.position(mesh, id).some((v: number, k: number): boolean => v !== p[k]))
        throw new Error("The saved F1 hip curves lost their exact distal thigh index");
      return id;
    }) };
    const upper: Rail = { ids: Mesh.vertices(mesh, recipe.upper.points as M.V[]), phases: recipe.upper.phases };
    const phases: number[] = recipe.rails.map((column: Column): number => column.phase);
    const pending: number[] = [];
    let previous: Rail = upper;

    // Use the identical physical angular map for every row. Independent
    // perimeter normalization would shift the buttock's material columns.
    for (const t of recipe.times) if (t > 0 && t < 1) {
      const row: Rail = { ids: Mesh.vertices(mesh, recipe.rails.map((column: Column): M.V => evaluate(column, t))), phases };
      connect(previous, row, mesh.positions, pending);
      previous = row;
    }
    connect(previous, lower, mesh.positions, pending);

    // The unchanged thigh owns the absolute material orientation. Reverse
    // the complete patch once when needed; never flip selected triangles.
    const a: number = lower.ids[0]!, b: number = lower.ids[1]!;
    const prior: number = sense(mesh.indices, a, b), current: number = sense(pending, a, b);
    if (Math.abs(prior) !== 1 || Math.abs(current) !== 1)
      throw new Error("The saved F1 hip does not expose one reciprocal distal edge");
    for (let i: number = 0; i < pending.length; i += 3)
      mesh.indices.push(pending[i]!, pending[i + (prior === current ? 2 : 1)]!, pending[i + (prior === current ? 1 : 2)]!);
  }

  /** Evaluate one saved cubic column in its normalized proximal-to-distal domain. */
  function evaluate(column: Column, t: number): M.V {
    const span: Column["spans"][number] = column.spans.find(
      (piece: Column["spans"][number]): boolean => t <= piece.to)!;
    return M.cubic(span.controls as M.Span, (t - span.from) / (span.to - span.from));
  }

  /** Tessellate two complete rows under their common cyclic physical chart. */
  function connect(a: Rail, b: Rail, positions: number[], indices: number[]): void {
    World.stitchRows(a.ids, b.ids, positions, indices,
      [[...a.phases.slice(1), a.phases[0]! + 1], [...b.phases.slice(1), b.phases[0]! + 1]]);
  }

  /** Count the directed use of one unchanged indexed boundary edge. */
  function sense(indices: readonly number[], a: number, b: number): number {
    let total: number = 0;
    for (let i: number = 0; i < indices.length; i += 3) for (let j: number = 0; j < 3; ++j) {
      if (indices[i + j] === a && indices[i + (j + 1) % 3] === b) ++total;
      if (indices[i + j] === b && indices[i + (j + 1) % 3] === a) --total;
    }
    return total;
  }
}
