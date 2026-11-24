import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieContourLoftCurves64,
  IAutoMovieContourLoftEmission64,
  IAutoMovieContourLoftSink64,
  IAutoMovieContourLoftWork64,
  IAutoMovieMeasureContourFace64,
  IAutoMoviePlanContourWalks64Plans,
  IAutoMoviePrepareContourBoundaries64,
  IAutoMoviePrepareContourDocument64Document,
  IAutoMovieSampleContourRing64,
  IAutoMovieSplitContourLeaf64,
} from "@automovie/interface";

import { AutoMovieContourLoftCurves64 as curves } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { measureAutoMovieContourFace64 } from "./measureAutoMovieContourFace64";
import { planAutoMovieContourSlabs64 } from "./planAutoMovieContourSlabs64";
import { planAutoMovieContourWalks64 } from "./planAutoMovieContourWalks64";
import { prepareAutoMovieContourBoundaries64 } from "./prepareAutoMovieContourBoundaries64";
import { prepareAutoMovieContourDocument64 } from "./prepareAutoMovieContourDocument64";
import { sampleAutoMovieContourRing64 } from "./sampleAutoMovieContourRing64";
import { splitAutoMovieContourLeaf64 } from "./splitAutoMovieContourLeaf64";
import { tessellateAutoMovieContourStrip64 } from "./tessellateAutoMovieContourStrip64";

/** Physical mutable vector used only during this generation. */
type V3 = AutoMovieVector3Tuple;
/** Strip work and quality before attaching its slab and group address. */
type StripObservation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;
/** Local document views preserve the preparation owner's structural records. */
type Document = IAutoMoviePrepareContourDocument64Document;
type Slice = Document["slices"][number];
type Observation = Slice["loops"][number];
type Critical = Document["events"][number];
type Ring = IAutoMovieContourLoftWork64.Ring;
type Group = IAutoMovieContourLoftWork64.Group;
type Slab = IAutoMovieContourLoftWork64.Slab;
/**
 * Generate an indexed contour loft from actual cubic coefficients and declared
 * signed topology.
 *
 * Cubics are admitted and adaptively subdivided by the engine's Bernstein
 * operator. Optional complete interval groups supply exact continuation;
 * otherwise ordinary boundaries use legacy greedy nearest geometric
 * continuation. Critical incidence overrides the legacy policy. Unsupported
 * explicit groups remain local gaps without discarding other contours at the
 * same cut. Oriented slit walks support splits and cavity changes, with a
 * regular exterior seam before fixed-seam minimum-area elementary tiling
 * (Fuchs, Kedem and Uselton 1977,
 * https://www.cs.jhu.edu/~misha/Fall13b/Papers/Fuchs77.pdf). The fixed-seam
 * optimum is not a global cyclic optimum or an injectivity certificate. Only an
 * isolated declared minimum or maximum receives its explicit generating
 * terminal. Finite unmatched contours remain unresolved. Output callbacks
 * retain original face order; the sink owns actual normal accumulation and
 * publication. Empty sections exactly at declared critical coordinates have no
 * generating boundary and are omitted; the event's explicitly declared
 * before/after section brackets remain mandatory. Coordinates convert from
 * millimetres to metres exactly once at output publication. Unrepresentable
 * curve boundaries or source identities remain local unresolved groups. Finite
 * positive-area tiles remain displayable when incidence, links or orientation
 * are unqualified. Strip observations distinguish quality diagnostics and
 * computational work from missing geometry. A failed millimetre cubic retains
 * its dense finite endpoint in construction only; an untrusted endpoint leaves
 * empty construction. Addressable malformed events remain local diagnostics. A
 * closest polygon-chord slit selects a source phase; its actual point and child
 * restrictions come from that saved polynomial. Child chord bounds and shared
 * ring interactions are re-established before emission. The final bridge is not
 * certified globally closest, nonintersecting or embedded.
 */
export function generateAutoMovieContourLoft64(
  input: IAutoMovieContourLoft64,
  sink: IAutoMovieContourLoftSink64,
): IAutoMovieContourLoftEmission64 {
  const document: IAutoMoviePrepareContourDocument64Document =
    prepareAutoMovieContourDocument64(input);
  const events: IAutoMovieContourLoft64.IEvent[] = document.declaredEvents;
  let vertexCount: number = 0,
    triangleCount: number = 0,
    outputFailed: boolean = false;
  let outputFailure: unknown;
  const deliver: (operation: () => void) => void = (
    operation: () => void,
  ): void => {
    try {
      operation();
    } catch (primary: unknown) {
      outputFailed = true;
      outputFailure = primary;
      throw primary;
    }
  };
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
  const phases: WeakMap<
    Readonly<AutoMovieVector3Tuple>,
    number
  > = new WeakMap();
  const leaves: WeakMap<V3, IAutoMovieContourLoftCurves64.Leaf> = new WeakMap();
  const register: (
    ring: Ring,
    knot: IAutoMovieContourLoftCurves64.Knot,
  ) => void = (ring: Ring, knot: IAutoMovieContourLoftCurves64.Knot): void => {
    owners.set(knot.p, ring);
    phases.set(knot.p, knot.phase);
    keys.set(knot.p, `${ring.id}:phase:${knot.phase}`);
    if (knot.leaf !== undefined) leaves.set(knot.p, knot.leaf);
  };
  const sampleToleranceMm: number = input.chordToleranceMm;
  const allRings: Ring[][] = document.slices.map(
    (slice: Slice, si: number): Ring[] =>
      slice.loops.map((loop: Observation, li: number): Ring => {
        const sampled: IAutoMovieSampleContourRing64.IResult =
          sampleAutoMovieContourRing64(loop.curve, sampleToleranceMm);
        const { knots, unsupported }: typeof sampled = sampled;
        const points: V3[] = knots.map(
          (knot: IAutoMovieContourLoftCurves64.Knot): V3 => knot.p,
        );
        const ring: Ring = {
          id: `${sampled.name || "unresolved"}.section.${si}.loop.${li}`,
          points: loop.winding < 0 ? [...points].reverse() : points,
          winding: loop.winding,
          period: sampled.period,
          ...(unsupported === undefined ? {} : { unsupported }),
        };
        knots.forEach((k: IAutoMovieContourLoftCurves64.Knot): void =>
          register(ring, k),
        );
        return ring;
      }),
  );

  const index: (p: V3) => number = (p: V3): number => {
    const key: string | undefined = keys.get(p);
    if (key === undefined)
      throw new Error(
        "A generated surface point has no declared curve or terminal identity",
      );
    if (!vertexMap.has(key)) {
      deliver((): void => sink.vertex(vertexCount, p));
      vertexMap.set(key, vertexCount);
      vertexCount++;
    }
    return vertexMap.get(key)!;
  };
  const triangle: (a: V3, b: V3, c: V3) => void = (
    a: V3,
    b: V3,
    c: V3,
  ): void => {
    const ia: number = index(a),
      ib: number = index(b),
      ic: number = index(c);
    deliver((): void => sink.triangle(ia, ib, ic));
    triangleCount++;
  };
  let contourMutable: boolean = true;
  const inserted: (p: V3, a: V3, b: V3, t: number) => void = (
    p: V3,
    a: V3,
    b: V3,
    t: number,
  ): void => {
    const owner: Ring | undefined = owners.get(a);
    if (!owner || owners.get(b) !== owner)
      throw new Error(
        "A branch slit selected an artificial bridge instead of a generating contour",
      );
    const positiveStart: V3 = owner.winding > 0 ? a : b;
    const source: IAutoMovieContourLoftCurves64.Leaf | undefined =
      leaves.get(positiveStart);
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
    if (t > 0 && t < 1 && existing === undefined) {
      if (!contourMutable)
        throw new Error(
          "Shared branch boundary changed after surface emission started",
        );
      const at: number = owner.points.indexOf(a);
      if (at < 0 || owner.points[(at + 1) % owner.points.length] !== b)
        throw new Error("Generating contour subdivision lost adjacency");
      if (source === undefined)
        throw new Error(
          "Interior source slit has no retained polynomial restriction",
        );
      const split: IAutoMovieSplitContourLeaf64.IResult =
        splitAutoMovieContourLeaf64(source, unwrapped, sampleToleranceMm);
      // join owns this fresh point. Its chord fraction chooses a phase, while
      // the source restriction owns the physical point used by every incident walk.
      for (let axis: number = 0; axis < 3; axis++) p[axis] = split.point[axis];
      const children: IAutoMovieContourLoftCurves64.Leaf[] = [
        ...split.before,
        ...split.after,
      ];
      const knots: IAutoMovieContourLoftCurves64.Knot[] = children.slice(1).map(
        (
          child: IAutoMovieContourLoftCurves64.Leaf,
        ): IAutoMovieContourLoftCurves64.Knot => ({
          p: child.start === unwrapped ? p : M.clone(curves.controls(child)[0]),
          phase: child.start,
          leaf: child,
        }),
      );
      for (const knot of knots) {
        const previous: V3 | undefined = owner.points.find(
          (point: V3): boolean =>
            keys.get(point) === `${owner.id}:phase:${knot.phase}`,
        );
        if (previous !== undefined)
          throw new Error(
            "Source slit child phase already has a distinct contour occurrence",
          );
      }
      leaves.set(positiveStart, children[0]);
      for (const knot of knots) register(owner, knot);
      owner.points.splice(
        at + 1,
        0,
        ...(owner.winding > 0 ? knots : [...knots].reverse()).map(
          (knot: IAutoMovieContourLoftCurves64.Knot): V3 => knot.p,
        ),
      );
    } else {
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
    }
  };
  const walks: IAutoMoviePlanContourWalks64Plans<Ring> =
    planAutoMovieContourWalks64(
      (point: V3): Ring | undefined => owners.get(point),
      (point: V3): string | undefined => keys.get(point),
      inserted,
    );
  const plans: Slab[] = planAutoMovieContourSlabs64({
    slices: document.slices,
    rings: allRings,
    events: document.events,
    declaredEvents: events,
    intervals: input.intervals,
  });

  const prepared: IAutoMoviePrepareContourBoundaries64.IResult<Group> =
    prepareAutoMovieContourBoundaries64(
      plans,
      allRings,
      document.slices.map((slice: Slice): number => slice.y),
      (p: V3): IAutoMovieContourLoftCurves64.Leaf | undefined => leaves.get(p),
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
      const stage: (p: V3, q: V3, r: V3) => void = (
        p: V3,
        q: V3,
        r: V3,
      ): void => {
        const ids: (string | undefined)[] = [
          keys.get(p),
          keys.get(q),
          keys.get(r),
        ];
        const area: IAutoMovieMeasureContourFace64.IResult =
          measureAutoMovieContourFace64(p, q, r);
        if (
          ids.some((id: string | undefined): boolean => id === undefined) ||
          new Set(ids).size !== 3 ||
          !(area.millimetresSquared > 0) ||
          !(area.metresSquared > 0)
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
        const firstTriangle: number = triangleCount;
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
                events[document.events.indexOf(event)].name,
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
        if (outputFailed) throw outputFailure;
        unresolved.push({
          beforeMm: document.slices[plan.k - 1].y,
          afterMm: document.slices[plan.k].y,
          incoming: group.a.length,
          outgoing: group.b.length,
          reason: `Contour group tiling unresolved: ${failure instanceof Error ? failure.message : String(failure)}`,
        });
      }
    }
  for (const rings of allRings)
    for (const ring of rings)
      deliver((): void =>
        sink.construction(
          ring.id,
          ring.points,
          (point: Readonly<AutoMovieVector3Tuple>): number =>
            phases.get(point)!,
        ),
      );
  return {
    vertices: vertexCount,
    triangles: triangleCount,
    primitiveRanges,
    interactionObservations: prepared.observations,
    stripObservations,
    unresolved,
  };
}
