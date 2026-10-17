import { AutoMovieContourLoftCurves64 as curves } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import { IAutoMovieCurve64 } from "./IAutoMovieCurve64";
import { planAutoMovieContourWalks64 } from "./planAutoMovieContourWalks64";
import { tessellateAutoMovieContourStrip64 } from "./tessellateAutoMovieContourStrip64";

/** Physical mutable vector used only during this generation. */
type V3 = M.V;
/** Local vector operations retain the engine's binary64 arithmetic and input units. */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
/** Physical squared projection used by elementary-tile area and normal accumulation. */
const dot: (a: V3, b: V3) => number = (a: V3, b: V3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Oriented three-dimensional area vector in the supplied common chart. */
const cross: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

interface Observation {
  curve: IAutoMovieCurve64.Cubic;
  winding: number;
}
interface Slice {
  y: number;
  loops: Observation[];
}
interface Incident {
  loop: number;
  winding: number;
}
interface Critical {
  y: number;
  y0: number;
  y1: number;
  point: V3 | null;
  below: Incident[];
  above: Incident[];
  lowerLinkComponents: number;
  upperLinkComponents: number;
  manifoldLink: boolean;
  equalHeightNeighbour: boolean;
}
interface Document {
  slices: Slice[];
  events: Critical[];
}
interface Ring {
  id: string;
  points: V3[];
  winding: number;
  period: number;
}
interface Group {
  a: number[];
  b: number[];
  critical: Critical[];
}
interface Slab {
  k: number;
  groups: Group[];
}

/**
 * Generate an indexed contour loft from actual cubic coefficients and declared signed topology.
 *
 * Cubics are admitted and adaptively subdivided by the engine's Bernstein operator.
 * Ordinary boundaries use greedy nearest geometric continuation; critical incidence overrides it.
 * Oriented slit walks support splits and cavity changes, with a regular exterior seam before
 * fixed-seam minimum-area elementary tiling (Fuchs, Kedem and Uselton 1977,
 * https://www.cs.jhu.edu/~misha/Fall13b/Papers/Fuchs77.pdf).
 * The fixed-seam optimum is not a global cyclic optimum or an injectivity certificate.
 * Only an isolated declared minimum or maximum receives its explicit generating terminal.
 * Finite unmatched contours remain unresolved, and normals come from the emitted triangles.
 * Empty sections exactly at declared critical coordinates have no generating boundary and are omitted;
 * the event's explicitly declared before/after section brackets remain mandatory.
 * Coordinates convert from millimetres to metres exactly once at output publication.
 *
 * @evidence contracts/common.md#principled-implementation Exact Bernstein subdivision preserves the supplied cubic source within a declared chord tolerance; signed event incidence selects topology and a fixed-seam dynamic program minimizes elementary triangle area within each strip.
 * @evidence contracts/common.md#clear-and-simple-design The caller supplies curves and topology only; one operation owns correspondence, shared slit refinement, new mesh emission and its actual construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input surface mesh, source index table, normal field or anatomical identity is consumed; finite unsupported closures are reported instead of filled.
 * @evidence contracts/common.md#meaningful-documentation States curve and surface error distinctions, correspondence, event ownership, fixed-seam limitations, unresolved closures, normals and the output unit conversion.
 * @evidence contracts/performance.md#efficient-algorithms For adjacent loops with n and m evaluated points, a strip uses O(nm) time and temporary storage. Each branch slit compares all segment pairs; nearest ordinary correspondence samples sixteen points against complete opposite boundaries. All retained geometry is linear in emitted vertices/faces and section samples.
 * @evidence contracts/performance.md#reuse-equivalent-work Section tessellation is computed once; both adjacent slabs share every refined slit endpoint before triangulation, and each output sheet vertex is registered once by its declared loop identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-call maps, graph plans, slit state and dynamic-program buffers expire on return; the returned mesh, construction and unresolved-boundary records transfer to the caller with no global cache.
 */
export function tessellateAutoMovieContourLoft64(
  input: IAutoMovieContourLoft64,
): IAutoMovieContourLoft64.IResult {
  if (!Number.isFinite(input.chordToleranceMm) || input.chordToleranceMm <= 0)
    throw new Error("Positive physical curve chord tolerance required");
  if (
    input.sections.some(
      (section: IAutoMovieContourLoft64.ISection, i: number): boolean =>
        !Number.isFinite(section.coordinateMm) ||
        (i > 0 && section.coordinateMm <= input.sections[i - 1]!.coordinateMm),
    )
  )
    throw new Error("Finite increasing section coordinates required");
  const coordinates: Set<number> = new Set(
    input.sections.map(
      (section: IAutoMovieContourLoft64.ISection): number =>
        section.coordinateMm,
    ),
  );
  const names: Set<string> = new Set();
  for (const event of input.events) {
    if (
      !event.name ||
      names.has(event.name) ||
      !Number.isFinite(event.coordinateMm) ||
      !(
        event.beforeMm < event.coordinateMm &&
        event.coordinateMm < event.afterMm
      ) ||
      !coordinates.has(event.beforeMm) ||
      !coordinates.has(event.afterMm)
    )
      throw new Error(
        "A named event must lie between its declared saved sections",
      );
    names.add(event.name);
    if (event.kind !== "saddle" && event.terminal === null)
      throw new Error("An extremum requires its explicit generating terminal");
    if (event.terminal !== null && !event.terminal.every(Number.isFinite))
      throw new Error("Finite event terminal coordinates required");
    if (event.before.length + event.after.length === 0)
      throw new Error("A topology event requires incident contours");
    for (const [coordinate, indices] of [
      [event.beforeMm, event.before],
      [event.afterMm, event.after],
    ] as [number, readonly number[]][]) {
      const section: IAutoMovieContourLoft64.ISection = input.sections.find(
        (candidate: IAutoMovieContourLoft64.ISection): boolean =>
          candidate.coordinateMm === coordinate,
      )!;
      if (
        indices.some(
          (index: number): boolean =>
            !Number.isInteger(index) ||
            index < 0 ||
            index >= section.loops.length,
        )
      )
        throw new Error("Event contour index leaves its declared section");
    }
  }
  const document: Document = {
    slices: input.sections
      .filter(
        (section: IAutoMovieContourLoft64.ISection): boolean =>
          section.loops.length > 0 ||
          !input.events.some(
            (event: IAutoMovieContourLoft64.IEvent): boolean =>
              event.coordinateMm === section.coordinateMm,
          ),
      )
      .map(
        (section: IAutoMovieContourLoft64.ISection): Slice => ({
          y: section.coordinateMm,
          loops: section.loops.map(
            (
              loop: IAutoMovieContourLoft64.ISection["loops"][number],
            ): Observation => ({ curve: loop.curve, winding: loop.winding }),
          ),
        }),
      ),
    events: input.events.map(
      (event: IAutoMovieContourLoft64.IEvent): Critical => ({
        y: event.coordinateMm,
        y0: event.beforeMm,
        y1: event.afterMm,
        point: event.terminal === null ? null : M.clone(event.terminal),
        below: event.before.map(
          (loop: number): Incident => ({
            loop,
            winding: input.sections.find(
              (section: IAutoMovieContourLoft64.ISection): boolean =>
                section.coordinateMm === event.beforeMm,
            )!.loops[loop]!.winding,
          }),
        ),
        above: event.after.map(
          (loop: number): Incident => ({
            loop,
            winding: input.sections.find(
              (section: IAutoMovieContourLoft64.ISection): boolean =>
                section.coordinateMm === event.afterMm,
            )!.loops[loop]!.winding,
          }),
        ),
        lowerLinkComponents: event.kind === "minimum" ? 0 : 1,
        upperLinkComponents: event.kind === "maximum" ? 0 : 1,
        manifoldLink: event.regular,
        equalHeightNeighbour: !event.regular,
      }),
    ),
  };
  const vertices: V3[] = [],
    triangles: [number, number, number][] = [];
  const unresolved: IAutoMovieContourLoft64.IResult["unresolved"] = [];
  const vertexMap: Map<string, number> = new Map();
  const owners: WeakMap<V3, Ring> = new WeakMap();
  const keys: WeakMap<V3, string> = new WeakMap();
  const phases: WeakMap<V3, number> = new WeakMap();
  const sampleToleranceMm: number = input.chordToleranceMm;
  const allRings: Ring[][] = document.slices.map(
    (slice: Slice, si: number): Ring[] =>
      slice.loops.map((loop: Observation, li: number): Ring => {
        const knots: curves.Knot[] = curves.tessellate(
          loop.curve,
          sampleToleranceMm,
        );
        const points: V3[] = knots.map((k: curves.Knot): V3 => k.p);
        const ring: Ring = {
          id: `${loop.curve.name}.section.${si}.loop.${li}`,
          points: loop.winding < 0 ? [...points].reverse() : points,
          winding: loop.winding,
          period: loop.curve.phaseIntervals.reduce(
            (a: number, b: number): number => a + b,
            0,
          ),
        };
        knots.forEach((k: curves.Knot): void => {
          owners.set(k.p, ring);
          phases.set(k.p, k.phase);
          keys.set(k.p, `${ring.id}:phase:${k.phase}`);
        });
        return ring;
      }),
  );

  const index = (p: V3): number => {
    const key: string | undefined = keys.get(p);
    if (key === undefined)
      throw new Error(
        "A generated surface point has no declared curve or terminal identity",
      );
    if (!vertexMap.has(key)) {
      vertexMap.set(key, vertices.length);
      vertices.push(p);
    }
    return vertexMap.get(key)!;
  };
  const triangle = (a: V3, b: V3, c: V3): void => {
    const n: V3 = cross(sub(b, a), sub(c, a));
    const squared: number = dot(n, n);
    if (!Number.isFinite(squared))
      throw new Error("Unresolved contour triangle arithmetic");
    if (squared === 0) return;
    const ia: number = index(a),
      ib: number = index(b),
      ic: number = index(c);
    if (ia !== ib && ib !== ic && ia !== ic) triangles.push([ia, ib, ic]);
  };
  let contourMutable: boolean = true;
  const inserted = (p: V3, a: V3, b: V3, t: number): void => {
    const owner: Ring | undefined = owners.get(a);
    if (!owner || owners.get(b) !== owner)
      throw new Error(
        "A branch slit selected an artificial bridge instead of a generating contour",
      );
    const start: number = phases.get(a)!;
    let end: number = phases.get(b)!;
    if (owner.winding > 0 && end < start) end += owner.period;
    if (owner.winding < 0 && end > start) end -= owner.period;
    const phase: number =
      t === 0
        ? start
        : t === 1
          ? phases.get(b)!
          : (((start + (end - start) * t) % owner.period) + owner.period) %
            owner.period;
    owners.set(p, owner);
    phases.set(p, phase);
    keys.set(p, `${owner.id}:phase:${phase}`);
    if (
      t > 0 &&
      t < 1 &&
      !owner.points.some((q: V3): boolean => keys.get(q) === keys.get(p))
    ) {
      if (!contourMutable)
        throw new Error(
          "Shared branch boundary changed after surface emission started",
        );
      const at: number = owner.points.indexOf(a);
      if (at < 0 || owner.points[(at + 1) % owner.points.length] !== b)
        throw new Error("Generating contour subdivision lost adjacency");
      owner.points.splice(at + 1, 0, p);
    }
  };
  const walks: ReturnType<typeof planAutoMovieContourWalks64<Ring>> =
    planAutoMovieContourWalks64(
      (point: V3): Ring | undefined => owners.get(point),
      (point: V3): string | undefined => keys.get(point),
      inserted,
    );
  const separation = (a: Ring, b: Ring): number => {
    if (a === b) return 0;
    const ap: V3[] = curves.sample(curves.curve(a.points), 16),
      bp: V3[] = curves.sample(curves.curve(b.points), 16);
    const directed = (p: V3[], q: V3[]): number =>
      p.reduce(
        (sum: number, v: V3): number =>
          sum +
          Math.min(
            ...q.map(
              (w: V3, i: number): number =>
                curves.closest(v, w, q[(i + 1) % q.length]).distance,
            ),
          ),
        0,
      ) / p.length;
    return (directed(ap, b.points) + directed(bp, a.points)) / 2;
  };
  const referenceSlice: Map<number, number> = new Map(
    document.slices.map((s: Slice, i: number): [number, number] => [s.y, i]),
  );
  const plans: Slab[] = [];
  for (let k: number = 1; k < document.slices.length; k++) {
    const below: Slice = document.slices[k - 1],
      above: Slice = document.slices[k];
    const a: Ring[] = allRings[k - 1],
      b: Ring[] = allRings[k];
    const parent: number[] = Array.from(
      { length: a.length + b.length },
      (_: unknown, i: number): number => i,
    );
    const root = (i: number): number => {
      while (parent[i] !== i) i = parent[i];
      return i;
    };
    const connect = (i: number, j: number): void => {
      parent[root(j)] = root(i);
    };
    const reserved: Set<number> = new Set();
    const critical: Critical[] = (document.events ?? []).filter(
      (e: Critical): boolean => e.y > below.y && e.y <= above.y,
    );
    const eventNodes: Map<Critical, number[]> = new Map();
    for (const event of critical) {
      const nodes: number[] = [];
      for (const [incidents, refY, current, offset] of [
        [event.below, event.y0, a, 0],
        [event.above, event.y1, b, a.length],
      ] as [Incident[], number, Ring[], number][]) {
        const ref: Ring[] = allRings[referenceSlice.get(refY)!];
        const assigned: Set<number> = new Set();
        for (const incident of incidents) {
          const original: Ring = ref[incident.loop];
          const candidates: { i: number; error: number }[] = current
            .map((r: Ring, i: number): { i: number; error: number } => ({
              i,
              error:
                !assigned.has(i) && r.winding === incident.winding
                  ? separation(original, r)
                  : Infinity,
            }))
            .sort(
              (
                x: { i: number; error: number },
                y: { i: number; error: number },
              ): number => x.error - y.error,
            );
          if (!candidates.length || !Number.isFinite(candidates[0].error))
            throw new Error("Critical-event incident contour cannot be traced");
          assigned.add(candidates[0].i);
          const node: number = candidates[0].i + offset;
          if (!nodes.includes(node)) nodes.push(node);
        }
      }
      for (const n of nodes) {
        reserved.add(n);
        connect(nodes[0], n);
      }
      eventNodes.set(event, nodes);
    }
    const candidates: { i: number; j: number; error: number }[] = [];
    for (let i: number = 0; i < a.length; i++)
      for (let j: number = 0; j < b.length; j++)
        if (
          !reserved.has(i) &&
          !reserved.has(a.length + j) &&
          a[i].winding === b[j].winding
        )
          candidates.push({ i, j, error: separation(a[i], b[j]) });
    candidates.sort(
      (
        x: { i: number; j: number; error: number },
        y: { i: number; j: number; error: number },
      ): number => x.error - y.error,
    );
    const usedA: Set<number> = new Set(),
      usedB: Set<number> = new Set();
    for (const pair of candidates)
      if (!usedA.has(pair.i) && !usedB.has(pair.j)) {
        connect(pair.i, a.length + pair.j);
        usedA.add(pair.i);
        usedB.add(pair.j);
      }
    const groups: Map<number, Group> = new Map();
    for (let i: number = 0; i < parent.length; i++) {
      const key: number = root(i);
      if (!groups.has(key)) groups.set(key, { a: [], b: [], critical: [] });
      if (i < a.length) groups.get(key)!.a.push(i);
      else groups.get(key)!.b.push(i - a.length);
    }
    for (const [event, nodes] of eventNodes)
      if (nodes.length) groups.get(root(nodes[0]))!.critical.push(event);
    plans.push({ k, groups: [...groups.values()] });
  }

  // Subdivide each shared boundary before either adjacent slab is triangulated.
  for (const plan of plans)
    for (const group of plan.groups) {
      if (group.a.length > 1) walks.prepare(allRings[plan.k - 1], group.a);
      if (group.b.length > 1) walks.prepare(allRings[plan.k], group.b);
    }

  contourMutable = false;
  for (const plan of plans)
    for (const group of plan.groups) {
      const a: Ring[] = allRings[plan.k - 1],
        b: Ring[] = allRings[plan.k];
      if (group.a.length && group.b.length)
        tessellateAutoMovieContourStrip64(
          walks.resolve(a, group.a),
          walks.resolve(b, group.b),
          triangle,
        );
      else {
        const upward: boolean = group.a.length > 0;
        const extrema: Critical[] = group.critical.filter(
          (e: Critical): boolean =>
            e.manifoldLink &&
            (upward
              ? e.upperLinkComponents === 0
              : e.lowerLinkComponents === 0),
        );
        const rings: Ring[] = upward
          ? group.a.map((i: number): Ring => a[i])
          : group.b.map((i: number): Ring => b[i]);
        if (extrema.length === 1 && rings.length === 1) {
          const p: V3 = extrema[0].point!;
          keys.set(p, `critical.${document.events!.indexOf(extrema[0])}`);
          for (let i: number = 0; i < rings[0].points.length; i++) {
            const q: V3 = rings[0].points[i],
              r: V3 = rings[0].points[(i + 1) % rings[0].points.length];
            if (upward) triangle(q, r, p);
            else triangle(r, q, p);
          }
        } else
          unresolved.push({
            beforeMm: document.slices[plan.k - 1].y,
            afterMm: document.slices[plan.k].y,
            incoming: group.a.length,
            outgoing: group.b.length,
          });
      }
    }
  const geometricNormals: V3[] = vertices.map((): V3 => [0, 0, 0]);
  for (const t of triangles) {
    const n: V3 = cross(
      sub(vertices[t[1]], vertices[t[0]]),
      sub(vertices[t[2]], vertices[t[0]]),
    );
    for (const i of t) geometricNormals[i] = add(geometricNormals[i], n);
  }
  const normals: number[] = geometricNormals.flatMap((normal: V3): V3 => {
    const length: number = Math.hypot(...normal);
    return length > 0 ? mul(normal, 1 / length) : [0, 0, 0];
  });
  return {
    mesh: {
      positions: vertices.flatMap((p: V3): V3 => mul(p, 0.001)),
      indices: triangles.flat(),
      normals,
      uvs: null,
      skin: null,
    },
    construction: allRings.flatMap(
      (rings: Ring[]): IAutoMovieContourLoft64.IResult["construction"] =>
        rings.map(
          (
            ring: Ring,
          ): IAutoMovieContourLoft64.IResult["construction"][number] => ({
            id: ring.id,
            closed: true,
            points: ring.points.map((p: V3): V3 => mul(p, 0.001)),
          }),
        ),
    ),
    unresolved,
  };
}
