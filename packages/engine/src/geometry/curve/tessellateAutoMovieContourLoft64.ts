import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourLoftCurves64 as curves } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMovieContourLoftWork64 } from "./IAutoMovieContourLoftWork64";
import { IAutoMovieCurve64 } from "./IAutoMovieCurve64";
import { planAutoMovieContourSlabs64 } from "./planAutoMovieContourSlabs64";
import { planAutoMovieContourWalks64 } from "./planAutoMovieContourWalks64";
import { prepareAutoMovieContourBoundaries64 } from "./prepareAutoMovieContourBoundaries64";
import { prepareAutoMovieContourDocument64 } from "./prepareAutoMovieContourDocument64";
import { tessellateAutoMovieContourStrip64 } from "./tessellateAutoMovieContourStrip64";

/** Physical mutable vector used only during this generation. */
type V3 = M.V;
/** Strip work and quality before attaching its slab and group address. */
type StripObservation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;
/** Local vector operations retain the engine's binary64 arithmetic and input units. */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
/** Oriented three-dimensional area vector in the supplied common chart. */
const cross: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
/** Local document views preserve the preparation owner's structural records. */
type Document = ReturnType<typeof prepareAutoMovieContourDocument64>;
type Slice = Document["slices"][number];
type Observation = Slice["loops"][number];
type Critical = Document["events"][number];
type Ring = IAutoMovieContourLoftWork64.Ring;
type Group = IAutoMovieContourLoftWork64.Group;
type Slab = IAutoMovieContourLoftWork64.Slab;
/**
 * Generate an indexed contour loft from actual cubic coefficients and declared signed topology.
 *
 * Cubics are admitted and adaptively subdivided by the engine's Bernstein operator.
 * Optional complete interval groups supply exact continuation; otherwise ordinary boundaries use legacy greedy nearest geometric continuation. Critical incidence overrides the legacy policy. Unsupported explicit groups remain local gaps without discarding other contours at the same cut.
 * Oriented slit walks support splits and cavity changes, with a regular exterior seam before
 * fixed-seam minimum-area elementary tiling (Fuchs, Kedem and Uselton 1977,
 * https://www.cs.jhu.edu/~misha/Fall13b/Papers/Fuchs77.pdf).
 * The fixed-seam optimum is not a global cyclic optimum or an injectivity certificate.
 * Only an isolated declared minimum or maximum receives its explicit generating terminal.
 * Finite unmatched contours remain unresolved, and normals come from the emitted triangles.
 * Empty sections exactly at declared critical coordinates have no generating boundary and are omitted;
 * the event's explicitly declared before/after section brackets remain mandatory.
 * Coordinates convert from millimetres to metres exactly once at output publication.
 * Unrepresentable curve boundaries or source identities remain local unresolved groups.
 * Finite positive-area tiles remain displayable when incidence, links or orientation are unqualified.
 * Strip observations distinguish quality diagnostics and computational work from missing geometry.
 * A failed curve representation retains its finite generating endpoint in construction only.
 *
 * @evidence contracts/common.md#principled-implementation Original Bernstein leaves retain their source restrictions; interaction-driven subdivision reaches one shared preparation state before slit selection. Signed incidence and conflict-constrained tiling seek qualified connectivity. Interior phases advance within the actual source leaf, including constant-interval quotients. Source identity failures remain unresolved; finite tiles survive quality failures with actual primitive ranges and separate work observations.
 * @evidence contracts/common.md#clear-and-simple-design The caller supplies curves and topology only; one operation owns correspondence, shared slit refinement, new mesh emission and its actual construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, source index table, normal field, coordinate weld or anatomical identity is consumed. Nonmanifold or oriented-edge quality cannot discard finite tiles. Unrenderable primitives are omitted with explicit counts and reasons; unsupported source identities retain diagnostics and construction instead of fabricated geometry.
 * @evidence contracts/common.md#meaningful-documentation States curve and surface error distinctions, source restriction, shared interaction preparation, event ownership, fixed-seam limits, geometry versus qualification, actual emission ownership, separate observations, normals and one output unit conversion.
 * @evidence contracts/performance.md#efficient-algorithms Each strip DP solve costs O(nm) time and storage plus linear admission; slit conflict search can be exponential. Source interaction preparation adds the sum of observed chord-pair visits across refinement passes and its constant-degree splits, as owned by the preparation helper. Branch slits compare segment pairs; legacy correspondence samples sixteen points against opposite boundaries. Primitive ranges and retained geometry grow linearly with emitted groups and faces.
 * @evidence contracts/performance.md#reuse-equivalent-work Section sampling runs once. Compact original half paths materialize controls only for contacted leaves. All adjacent slabs share the final source refinements and slit endpoints before emission, and each output sheet vertex uses one declared identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-call maps, graph plans, slit state and dynamic-program buffers expire on return; the returned mesh, construction and unresolved-boundary records transfer to the caller with no global cache.
 */
export function tessellateAutoMovieContourLoft64(
  input: IAutoMovieContourLoft64,
): IAutoMovieContourLoft64.IResult {
  const document: ReturnType<typeof prepareAutoMovieContourDocument64> =
    prepareAutoMovieContourDocument64(input);
  const vertices: V3[] = [],
    triangles: [number, number, number][] = [];
  const unresolved: IAutoMovieContourLoft64.IResult["unresolved"] = [];
  const primitiveRanges: NonNullable<
    IAutoMovieContourLoft64.IResult["primitiveRanges"]
  > = [];
  const stripObservations: NonNullable<
    IAutoMovieContourLoft64.IResult["stripObservations"]
  > = [];
  const vertexMap: Map<string, number> = new Map();
  const owners: WeakMap<V3, Ring> = new WeakMap();
  const keys: WeakMap<V3, string> = new WeakMap();
  const phases: WeakMap<V3, number> = new WeakMap();
  const leaves: WeakMap<V3, curves.Leaf> = new WeakMap();
  const register = (ring: Ring, knot: curves.Knot): void => {
    owners.set(knot.p, ring);
    phases.set(knot.p, knot.phase);
    keys.set(knot.p, `${ring.id}:phase:${knot.phase}`);
    if (knot.leaf !== undefined) leaves.set(knot.p, knot.leaf);
  };
  const sampleToleranceMm: number = input.chordToleranceMm;
  const allRings: Ring[][] = document.slices.map(
    (slice: Slice, si: number): Ring[] =>
      slice.loops.map((loop: Observation, li: number): Ring => {
        let knots: curves.Knot[];
        let unsupported: string | undefined;
        try {
          knots = curves.tessellate(loop.curve, sampleToleranceMm);
        } catch (failure: unknown) {
          const endpoint: IAutoMovieCurve64.Vector | undefined =
            loop.curve.spans[0]?.[0];
          if (endpoint === undefined || !endpoint.every(Number.isFinite))
            throw failure;
          knots = [{ p: M.clone(endpoint), phase: 0 }];
          unsupported = `Generating curve representation unresolved: ${failure instanceof Error ? failure.message : String(failure)}`;
        }
        const points: V3[] = knots.map((k: curves.Knot): V3 => k.p);
        try {
          if (
            unsupported === undefined &&
            (!curves.hasArea(points) ||
              points.some((p: V3, i: number): boolean =>
                p.every(
                  (x: number, k: number): boolean =>
                    x === points[(i + 1) % points.length][k],
                ),
              ))
          )
            unsupported =
              "Generating closed curve has no noncollapsed two-dimensional sampled boundary";
        } catch (failure: unknown) {
          unsupported = `Generating curve rank unresolved: ${failure instanceof Error ? failure.message : String(failure)}`;
        }
        const ring: Ring = {
          id: `${loop.curve.name}.section.${si}.loop.${li}`,
          points: loop.winding < 0 ? [...points].reverse() : points,
          winding: loop.winding,
          period: loop.curve.phaseIntervals.reduce(
            (a: number, b: number): number => a + b,
            0,
          ),
          ...(unsupported === undefined ? {} : { unsupported }),
        };
        knots.forEach((k: curves.Knot): void => register(ring, k));
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
    const ia: number = index(a),
      ib: number = index(b),
      ic: number = index(c);
    triangles.push([ia, ib, ic]);
  };
  let contourMutable: boolean = true;
  const inserted = (p: V3, a: V3, b: V3, t: number): void => {
    const owner: Ring | undefined = owners.get(a);
    if (!owner || owners.get(b) !== owner)
      throw new Error(
        "A branch slit selected an artificial bridge instead of a generating contour",
      );
    const positiveStart: V3 = owner.winding > 0 ? a : b;
    const source: curves.Leaf | undefined = leaves.get(positiveStart);
    const start: number =
      source === undefined
        ? phases.get(a)!
        : owner.winding > 0
          ? source.start
          : source.end;
    let end: number =
      source === undefined
        ? phases.get(b)!
        : owner.winding > 0
          ? source.end
          : source.start;
    if (source === undefined && owner.winding > 0 && end < start)
      end += owner.period;
    if (source === undefined && owner.winding < 0 && end > start)
      end -= owner.period;
    const unwrapped: number = start + (end - start) * t;
    if (
      t > 0 &&
      t < 1 &&
      !(unwrapped > Math.min(start, end) && unwrapped < Math.max(start, end))
    )
      throw new Error(
        "Interior contour slit exceeds the scalar phase representation",
      );
    const remainder: number = unwrapped % owner.period;
    const phase: number =
      t === 0
        ? start
        : t === 1
          ? phases.get(b)!
          : remainder < 0
            ? remainder + owner.period
            : remainder;
    if (!(phase >= 0 && phase < owner.period))
      throw new Error(
        "Interior contour slit exceeds the canonical scalar phase range",
      );
    const key: string = `${owner.id}:phase:${phase}`;
    const existing: V3 | undefined = owner.points.find(
      (q: V3): boolean => keys.get(q) === key,
    );
    if (
      existing !== undefined &&
      existing.some((x: number, k: number): boolean => x !== p[k])
    )
      throw new Error(
        "One contour source phase has conflicting physical slit points",
      );
    owners.set(p, owner);
    phases.set(p, phase);
    keys.set(p, key);
    if (t > 0 && t < 1 && existing === undefined) {
      if (!contourMutable)
        throw new Error(
          "Shared branch boundary changed after surface emission started",
        );
      const at: number = owner.points.indexOf(a);
      if (at < 0 || owner.points[(at + 1) % owner.points.length] !== b)
        throw new Error("Generating contour subdivision lost adjacency");
      if (source !== undefined) {
        const halves: ReturnType<typeof S.split> = S.split(
          curves.controls(source),
          owner.winding > 0 ? t : 1 - t,
        );
        leaves.set(positiveStart, {
          net: halves[0],
          start: source.start,
          end: unwrapped,
          depth: source.depth + 1,
        });
        leaves.set(p, {
          net: halves[1],
          start: unwrapped,
          end: source.end,
          depth: source.depth + 1,
        });
      }
      owner.points.splice(at + 1, 0, p);
    }
  };
  const walks: ReturnType<typeof planAutoMovieContourWalks64<Ring>> =
    planAutoMovieContourWalks64(
      (point: V3): Ring | undefined => owners.get(point),
      (point: V3): string | undefined => keys.get(point),
      inserted,
    );
  const plans: Slab[] = planAutoMovieContourSlabs64({
    slices: document.slices,
    rings: allRings,
    events: document.events,
    declaredEvents: input.events,
    intervals: input.intervals,
  });

  const prepared: ReturnType<
    typeof prepareAutoMovieContourBoundaries64<Ring, Group>
  > = prepareAutoMovieContourBoundaries64(
    plans,
    allRings,
    document.slices.map((slice: Slice): number => slice.y),
    (p: V3): curves.Leaf | undefined => leaves.get(p),
    register,
    walks.prepare,
    sampleToleranceMm,
    input.observeWork ?? false,
  );

  contourMutable = false;
  for (const plan of plans)
    for (const [groupIndex, group] of plan.groups.entries()) {
      const a: Ring[] = allRings[plan.k - 1],
        b: Ring[] = allRings[plan.k];
      if (group.unsupported !== undefined) {
        unresolved.push({
          beforeMm: document.slices[plan.k - 1]!.y,
          afterMm: document.slices[plan.k]!.y,
          incoming: group.a.length,
          outgoing: group.b.length,
          reason: group.unsupported,
        });
        continue;
      }
      const pending: [V3, V3, V3][] = [];
      const quality: Set<string> = new Set();
      let omitted: number = 0;
      let observation: StripObservation | undefined;
      const pendingFaces: Set<string> = new Set();
      const pendingEdges: Map<string, { uses: number; orientation: number }> =
        new Map();
      const stage = (p: V3, q: V3, r: V3): void => {
        const ids: (string | undefined)[] = [
          keys.get(p),
          keys.get(q),
          keys.get(r),
        ];
        const normal: V3 = cross(sub(q, p), sub(r, p));
        const length: number = Math.hypot(...normal);
        const output: V3[] = [p, q, r].map(
          (point: V3): V3 => mul(point, 0.001),
        );
        const publishedArea: number = Math.hypot(
          ...cross(sub(output[1], output[0]), sub(output[2], output[0])),
        );
        if (
          ids.some((id: string | undefined): boolean => id === undefined) ||
          new Set(ids).size !== 3 ||
          !(length > 0 && Number.isFinite(length)) ||
          !(publishedArea > 0 && Number.isFinite(publishedArea))
        ) {
          omitted++;
          quality.add(
            "Unrenderable tile omitted: unresolved identity, repeated index, or nonpositive/nonfinite published area",
          );
          return;
        }
        const face: string = JSON.stringify(
          [...ids].sort(
            (a: string | undefined, b: string | undefined): number =>
              a! < b! ? -1 : a! > b! ? 1 : 0,
          ),
        );
        if (pendingFaces.has(face))
          quality.add("Displayable contour group repeats a sheet face");
        pendingFaces.add(face);
        for (let i: number = 0; i < 3; i++) {
          const a: string = ids[i]!,
            b: string = ids[(i + 1) % 3]!;
          const key: string = JSON.stringify(a < b ? [a, b] : [b, a]);
          if (!pendingEdges.has(key))
            pendingEdges.set(key, { uses: 0, orientation: 0 });
          const edge: { uses: number; orientation: number } =
            pendingEdges.get(key)!;
          edge.uses++;
          edge.orientation += a < b ? 1 : -1;
          if (edge.uses > 2 || (edge.uses === 2 && edge.orientation !== 0))
            quality.add(
              "Displayable contour group has unqualified oriented edge incidence",
            );
        }
        pending.push([p, q, r]);
      };
      try {
        if (group.a.length && group.b.length)
          tessellateAutoMovieContourStrip64(
            walks.resolve(a, group.a),
            walks.resolve(b, group.b),
            stage,
            (point: V3): string | undefined => keys.get(point),
            (record: StripObservation): void => {
              observation = record;
            },
            input.observeWork ?? false,
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
              if (upward) stage(q, r, p);
              else stage(r, q, p);
            }
          } else
            unresolved.push({
              beforeMm: document.slices[plan.k - 1].y,
              afterMm: document.slices[plan.k].y,
              incoming: group.a.length,
              outgoing: group.b.length,
            });
        }
        // Geometry publication is independent of incidence and shading qualification.
        const firstTriangle: number = triangles.length;
        for (const tile of pending) triangle(...tile);
        if (pending.length)
          primitiveRanges.push({
            firstTriangle,
            triangleCount: pending.length,
            beforeMm: document.slices[plan.k - 1].y,
            afterMm: document.slices[plan.k].y,
            group: groupIndex,
            kind: group.a.length && group.b.length ? "strip" : "cap",
            eventNames: group.critical.map(
              (event: Critical): string =>
                input.events[document.events.indexOf(event)].name,
            ),
          });
        if (observation !== undefined || quality.size) {
          const record: StripObservation = observation ?? {
            n: group.a.reduce(
              (sum: number, i: number): number => sum + a[i].points.length,
              0,
            ),
            m: group.b.reduce(
              (sum: number, i: number): number => sum + b[i].points.length,
              0,
            ),
            dpCalls: 0,
            expandedConflicts: 0,
            peakQueue: 0,
            elapsedMs: null,
            qualified: true,
            diagnostics: [],
          };
          stripObservations.push({
            beforeMm: document.slices[plan.k - 1].y,
            afterMm: document.slices[plan.k].y,
            group: groupIndex,
            ...record,
            qualified:
              record.qualified &&
              quality.size === 0 &&
              prepared.interactions.get(group)?.qualified !== false,
            diagnostics: [
              ...record.diagnostics,
              ...(prepared.interactions.get(group)?.diagnostics ?? []),
              ...quality,
              ...(omitted
                ? [
                    `Unrenderable primitive count: ${omitted}; retained finite tile count: ${pending.length}`,
                  ]
                : []),
            ],
          });
        }
      } catch (failure: unknown) {
        unresolved.push({
          beforeMm: document.slices[plan.k - 1].y,
          afterMm: document.slices[plan.k].y,
          incoming: group.a.length,
          outgoing: group.b.length,
          reason: `Contour group tiling unresolved: ${failure instanceof Error ? failure.message : String(failure)}`,
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
    primitiveRanges,
    interactionObservations: prepared.observations,
    stripObservations,
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
            phases: ring.points.map((p: V3): number => phases.get(p)!),
          }),
        ),
    ),
    unresolved,
  };
}
