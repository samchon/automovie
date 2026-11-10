import { AutoMovieCurveMath64 as M } from "@automovie/engine";

import { AutoMovieHumanLoftMesh as Mesh } from "../../lofting/AutoMovieHumanLoftMesh";
import type { AutoMovieHumanF1Fork } from "../trunk/AutoMovieHumanF1Fork";
import { AutoMovieHumanLegF1Lines as Lines } from "./AutoMovieHumanLegF1Lines";
import { AutoMovieHumanLegF1World as World } from "./AutoMovieHumanLegF1World";
import native from "./AutoMovieHumanLegF1Native.json";

/** Absolute ISB world-mm point or direction, as declared by each caller. */
type V3 = M.V;
/** Existing indexed ordinary-loft output; no source mesh is retained. */
type Context = Mesh.IContext;
/** Ordered measured open section, exit arclengths in mm and geometric phases in radians. */
type Row = { station: number; ids: number[]; ends: [number, number]; phases: number[] };

/**
 * F1's original open proximal sections, in absolute ISB world millimetres.
 * Their ends run on the measured nonparallel s136 rim. They are not closed
 * horizontal sections: closing each chord would fill the thigh's cut plane.
 */
export namespace AutoMovieHumanLegF1Hip {
  /**
   * Loft all 47 observed open curves to the same exact fork and s136 rails.
   * Source curve coordinates remain unchanged; only triangles are generated.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses ordered original section curves and the measured exit boundary, with the original fork collar retained.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a missing boundary correspondence or inconsistent oriented sheet instead of moving a port or importing source triangles.
   */
  export function attach(mesh: Context, side: "left" | "right", fork: AutoMovieHumanF1Fork.IResult): void {
    const source: (typeof native.patches)[number] | undefined = native.patches.find((piece: (typeof native.patches)[number]): boolean => piece.name === `leg.${side}.hip.native`);
    if (source?.info.entry === undefined || source.info.exit === undefined || source.info.start === undefined)
      throw new Error("The measured F1 proximal surface has no original boundary curves");
    const { frame, entry, arcs }: ReturnType<typeof Lines.fixedHip> = Lines.fixedHip(side);
    const boundary: number[] = Mesh.vertices(mesh, World.forkClock(fork[side], frame));
    const start: number[] = Mesh.vertices(mesh, World.forkClock(entry, frame));
    World.fixedCollar(boundary, start, arcs, mesh.positions, mesh.indices);

    /** Scalar product in the unchanged physical world chart. */
    const dot: (a: V3, b: V3) => number = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

    /** Read one existing indexed world-mm position without creating a copy identity. */
    const at: (id: number) => V3 = (id: number): V3 => Mesh.position(mesh, id);

    // The two authored views retain the same 98 source knots but start at
    // different phases. Match this declared boundary, never global vertices.
    const regular: V3[] = source.info.exit.map((_: number[], i: number): V3 => at(i));
    const firstExit: V3 = M.clone(source.info.exit[0]!);
    const starts: number[] = regular.flatMap((p: V3, i: number): number[] =>
      p.every((value: number, axis: number): boolean => value === firstExit[axis]) ? [i] : []);
    if (starts.length !== 1 || new Set(regular.map((p: V3): string => p.join(","))).size !== regular.length)
      throw new Error("The regular F1 s136 boundary has no unique original source start");
    const exit: number[] = source.info.exit.map((_: number[], i: number): number => (starts[0]! + i) % regular.length);
    const points: V3[] = exit.map(at);
    if (source.info.exit.some((p: number[], i: number): boolean => p.some((value: number, axis: number): boolean => value !== points[i]![axis])))
      throw new Error("The regular F1 thigh does not retain the full exact oriented s136 source cycle");
    const distances: number[] = [0];
    for (const [i, p] of points.entries())
      distances.push(distances[i]! + Math.hypot(...M.sub(points[(i + 1) % points.length]!, p)));
    const perimeter: number = distances.at(-1)!;
    const insertions: Map<number, { t: number; id: number }[]> = new Map();
    const ends: { id: number; arc: number }[] = [];

    /** Bind declared source corners exactly; other endpoints must lie on their observed exit segment. */
    const endpoint: (p: V3, station: number) => { id: number; arc: number } = (p: V3, station: number): { id: number; arc: number } => {
      // A corner plane was authored through this declared exit vertex. Its
      // observed copy can round differently; only the explicit contact record,
      // exact stored observation and exact exit identity authorize one index.
      const contacts: NonNullable<typeof source.cornerSections> = (source.cornerSections ?? []).filter(
        (section: NonNullable<typeof source.cornerSections>[number]): boolean => section.station === station &&
          section.loops.some((loop: typeof section.loops[number]): boolean => !loop.closed && loop.contacts.some(
            (contact: typeof loop.contacts[number]): boolean => loop.points[contact.vertex]!.every(
              (value: number, axis: number): boolean => value === p[axis]))));
      if (contacts.length > 1) throw new Error("An F1 hip endpoint has ambiguous declared source-corner ownership");
      if (contacts.length === 1) {
        const corner: typeof contacts[number] = contacts[0]!;
        if (!corner.exact.every((value: number, axis: number): boolean => value === source.info.exit![corner.exit]![axis]))
          throw new Error("A declared F1 source corner no longer identifies its exact exit point");
        const result: { id: number; arc: number } = { id: exit[corner.exit]!, arc: distances[corner.exit]! };
        ends.push(result); return result;
      }
      let best: { edge: number; t: number; distance: number } | undefined;
      for (let i: number = 0; i < points.length; ++i) {
        const a: V3 = points[i]!, d: V3 = M.sub(points[(i + 1) % points.length]!, a);
        const length: number = dot(d, d);
        const t: number = length === 0 ? 0 : Math.max(0, Math.min(1, dot(M.sub(p, a), d) / length));
        const distance: number = Math.hypot(...M.sub(p, M.add(a, M.scale(d, t))));
        if (best === undefined || distance < best.distance) best = { edge: i, t, distance };
      }
      if (best === undefined || best.distance > 1e-8)
        throw new Error("An original open F1 curve does not end on its measured s136 boundary");
      const { edge, t }: { edge: number; t: number; distance: number } = best;
      const a: number = exit[edge]!, b: number = exit[(edge + 1) % exit.length]!;

      // These equalities identify floating-point copies of the same source
      // vertex; they never change a geometrically distinct observed point.
      let id: number;
      if (t === 0) id = a;
      else if (t === 1) id = b;
      else {
        id = Mesh.vertices(mesh, [p])[0]!;
        const list: { t: number; id: number }[] = insertions.get(edge) ?? [];
        list.push({ id, t });
        insertions.set(edge, list);
      }
      const result: { id: number; arc: number } = { id, arc: distances[edge]! + t * (distances[edge + 1]! - distances[edge]!) };
      ends.push(result);
      return result;
    };
    const chart: typeof source.info.guideChart = source.info.guideChart;
    if (chart === undefined || source.guidedRows === undefined || source.cornerSections === undefined || chart.unqualifiedRows.length !== 0)
      throw new Error("The F1 hip lacks complete qualified geometric source guides");

    /** Unwrap the fixed geometric ray chart; these angles are not material labels. */
    const phases: (ids: number[], anchor?: number) => number[] = (ids: number[], anchor?: number): number[] => {
      const values: number[] = ids.map((id: number): number => {
        const d: V3 = M.sub(at(id), M.clone(chart.origin));
        return chart.sign * Math.atan2(dot(d, M.clone(chart.v)), dot(d, M.clone(chart.u)));
      });
      if (anchor !== undefined) values[0] = anchor + Math.atan2(Math.sin(values[0]! - anchor), Math.cos(values[0]! - anchor));
      for (let i: number = 1; i < values.length; ++i)
        values[i] = values[i - 1]! + Math.atan2(Math.sin(values[i]! - values[i - 1]!), Math.cos(values[i]! - values[i - 1]!));
      if (values.some((value: number, i: number): boolean => i > 0 && value < values[i - 1]!))
        throw new Error("An F1 hip boundary reverses its inferred physical ray chart");
      return values;
    };
    const rows: Row[] = source.guidedRows.map(({ station, points: observed, phases: measured, reversals }: NonNullable<typeof source.guidedRows>[number]): Row => {
      if (reversals.length !== 0) throw new Error("An observed F1 hip section has no single-valued geometric chart");
      const raw: V3[] = observed.map(M.clone);
      const first: { id: number; arc: number } = endpoint(raw[0]!, station), last: { id: number; arc: number } = endpoint(raw.at(-1)!, station);
      return { station, ids: [first.id, ...Mesh.vertices(mesh, raw.slice(1, -1)), last.id], ends: [first.arc, last.arc], phases: measured };
    });
    splitExit(mesh, exit, insertions);
    const exitSamples: { id: number; arc: number }[] = [
      ...exit.map((id: number, i: number): { id: number; arc: number } => ({ id, arc: distances[i]! })), ...ends,
    ].sort((a: { id: number; arc: number }, b: { id: number; arc: number }): number => a.arc - b.arc).filter((item: { id: number; arc: number }, i: number, list: { id: number; arc: number }[]): boolean => i === 0 || item.id !== list[i - 1]!.id);

    /** Walk every measured subdivision on the declared s136 boundary direction. */
    const walk: (from: number, to: number, direction: 1 | -1) => number[] = (from: number, to: number, direction: 1 | -1): number[] => {
      let distance: number = direction * (to - from);
      while (distance < 0) distance += perimeter;
      const list: { id: number; arc: number; delta: number }[] = exitSamples.map((item: { id: number; arc: number }): { id: number; arc: number; delta: number } => {
        let delta: number = direction * (item.arc - from);
        while (delta < -1e-9) delta += perimeter;
        return { ...item, delta };
      }).filter((item: { id: number; arc: number; delta: number }): boolean => item.delta > 1e-9 && item.delta < distance - 1e-9)
        .sort((a: { id: number; arc: number; delta: number }, b: { id: number; arc: number; delta: number }): number => a.delta - b.delta);
      return list.map((item: { id: number; arc: number; delta: number }): number => item.id);
    };
    for (let i: number = 1; i < rows.length; ++i)
      for (const end of [0, 1] as const) {
        let delta: number = rows[i]!.ends[end] - rows[i - 1]!.ends[end];
        if (delta > perimeter / 2) delta -= perimeter;
        if (delta < -perimeter / 2) delta += perimeter;
        if ((end === 0 ? delta : -delta) <= 0) throw new Error("The measured F1 exit rails reverse their physical order");
      }
    const pending: number[] = [];
    const first: Row = rows[0]!;
    const initial: number[] = [...first.ids, ...walk(first.ends[1], first.ends[0], 1)];

    /** Check the closed knot cycle's angular ordering and retain its actual cyclic direction. */
    const closed: (raw: number[]) => { ids: number[]; clock: number[] } = (raw: number[]): { ids: number[]; clock: number[] } => {
      const ordered: { id: number; phase: number }[] = raw.map((id: number): { id: number; phase: number } => {
        const d: V3 = M.sub(at(id), M.clone(chart.origin));
        return { id, phase: chart.sign * Math.atan2(dot(d, M.clone(chart.v)), dot(d, M.clone(chart.u))) };
      }).sort((a: { id: number; phase: number }, b: { id: number; phase: number }): number => a.phase - b.phase);
      const ids: number[] = ordered.map((item: { id: number; phase: number }): number => item.id), index: number = raw.indexOf(ids[0]!);
      const step: 1 | -1 = raw[(index + 1) % raw.length] === ids[1] ? 1 : -1;
      if (ids.some((id: number, i: number): boolean => id !== raw[(index + step * i + raw.length) % raw.length]))
        throw new Error("A closed F1 hip support is not single-valued on the source chart");
      return { ids, clock: [...ordered.slice(1).map((item: { id: number; phase: number }): number => item.phase), ordered[0]!.phase + 2 * Math.PI] };
    };
    let previous: { ids: number[]; clock: number[] } = closed(start);

    // The lowest added station is a closed contour touching the exact exit
    // corner once. Keep its closed identity and its observed contact ownership;
    // the ordinary tiler's seam is that same indexed point, not a cut or weld.
    const contacts: typeof source.cornerSections = source.cornerSections.filter((section: typeof source.cornerSections[number]): boolean => section.station < first.station &&
      section.loops.length === 1 && section.loops[0]!.closed);
    for (const section of contacts.sort((a: typeof contacts[number], b: typeof contacts[number]): number => a.station - b.station)) {
      const loop: typeof section.loops[number] = section.loops[0]!;
      if (loop.contacts.length !== 1) throw new Error("A closed F1 hip support has ambiguous boundary contact");
      const contact: typeof loop.contacts[number] = loop.contacts[0]!, contactId: number = exit[section.exit]!;
      const ids: number[] = loop.points.map((point: number[], i: number): number => i === contact.vertex ? contactId : Mesh.vertices(mesh, [M.clone(point)])[0]!);
      const next: { ids: number[]; clock: number[] } = closed(ids);
      World.stitchRows(previous.ids, next.ids, mesh.positions, pending, [previous.clock, next.clock]);
      previous = next;
    }
    const compound: { ids: number[]; clock: number[] } = closed(initial), shared: number[] = previous.ids.filter((id: number): boolean => compound.ids.includes(id));
    if (shared.length === 0) World.stitchRows(previous.ids, compound.ids, mesh.positions, pending, [previous.clock, compound.clock]);
    else {
      if (shared.length !== 1) throw new Error("A critical F1 hip support has more than its observed single contact");

      /** Use the same declared contact as both periodic tiling endpoints. */
      const walkFrom: (ids: number[]) => number[] = (ids: number[]): number[] => {
        const k: number = ids.indexOf(shared[0]!);
        return [...ids.slice(k), ...ids.slice(0, k), shared[0]!];
      };
      const a: number[] = walkFrom(previous.ids), b: number[] = walkFrom(compound.ids), firstPhase: number[] = phases(a);
      ribbon(mesh, a, b, [], [], firstPhase, phases(b, firstPhase[0]), pending);
    }

    // Input phases are an inferred fixed geometric chart. They are not claimed
    // as material identities. Independent .5 mm, normal and crossing gates
    // decide the whole candidate; no source position is changed to pass them.
    for (let i: number = 1; i < rows.length; ++i) {
      const a: Row = rows[i - 1]!, b: Row = rows[i]!;
      ribbon(mesh, a.ids, b.ids, walk(a.ends[0], b.ends[0], 1), walk(a.ends[1], b.ends[1], -1),
        a.phases, b.phases, pending);
    }
    const last: Row = rows.at(-1)!;
    const cap: number[] = [last.ids[0]!, ...walk(last.ends[0], last.ends[1], 1), last.ids.at(-1)!];
    ribbon(mesh, last.ids, cap, [], [], last.phases, phases(cap, last.phases[0]), pending);
    orient(mesh.indices, pending);
    mesh.indices.push(...pending);
  }

  /**
   * Ordinary source-curve loft on an explicitly inferred physical ray chart.
   * Every tile advances an adjacent observed knot; guide corners are actual
   * source-plane events, not phase-0/1 fans. Shared cap/contact endpoints keep
   * the same indices and only repeated-index zero-domain tiles are omitted.
   * Coordinates are world mm; phases are radians. This does not certify G1.
   */
  function ribbon(mesh: Context, lower: number[], upper: number[], left: number[], right: number[],
    a: number[], b: number[], indices: number[]): void {
    const begin: number = indices.length;

    /** Omit only a repeated-index zero-domain tile, never a distinct measured point. */
    const emit: (x: number, y: number, z: number) => void = (x: number, y: number, z: number): void => {
      if (x === y || y === z || z === x) return;
      const u: V3 = M.sub(Mesh.position(mesh, y), Mesh.position(mesh, x)), v: V3 = M.sub(Mesh.position(mesh, z), Mesh.position(mesh, x));
      if (!(Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) > 0))
        throw new Error("Distinct source hip knots collapse their ordinary loft tile");
      indices.push(x, y, z);
    };
    let i: number = 0, j: number = 0;
    while (i + 1 < lower.length || j + 1 < upper.length) {
      const x: number = lower[i]!, y: number = upper[j]!;
      if ((a[i + 1] ?? Infinity) <= (b[j + 1] ?? Infinity)) emit(x, lower[++i]!, y);
      else emit(x, upper[++j]!, y);
    }

    // Consecutive corner planes partition the original exit guide into one
    // straight source edge. Retain all prior subdivision points on that edge,
    // without replacing it with a chord across a bent boundary.
    /** Retain the observed intermediate knots of one straight declared exit edge. */
    const subdivide: (from: number, to: number, middle: number[]) => void = (from: number, to: number, middle: number[]): void => {
      if (middle.length === 0) return;
      const p: V3 = Mesh.position(mesh, from), d: V3 = M.sub(Mesh.position(mesh, to), p), l2: number = d.reduce((sum: number, v: number): number => sum + v * v, 0);
      for (const id of middle) {
        const q: V3 = Mesh.position(mesh, id), along: number = M.sub(q, p).reduce((sum: number, v: number, k: number): number => sum + v * d[k]!, 0) / l2;
        if (along < 0 || along > 1 || Math.hypot(...M.sub(q, M.add(p, M.scale(d, along)))) > 1e-8)
          throw new Error("An F1 exit guide still contains an unrepresented physical corner");
      }
      for (let f: number = begin; f < indices.length; f += 3) for (let k: number = 0; k < 3; ++k) {
        const x: number = indices[f + k]!, y: number = indices[f + (k + 1) % 3]!;
        if (!((x === from && y === to) || (x === to && y === from))) continue;
        const z: number = indices[f + (k + 2) % 3]!, walk: number[] = x === from ? [from, ...middle, to] : [to, ...middle.slice().reverse(), from];
        const replacement: number[] = [];
        for (let n: number = 1; n < walk.length; ++n) replacement.push(walk[n - 1]!, walk[n]!, z);
        indices.splice(f, 3, ...replacement); return;
      }
      throw new Error("An observed F1 guide has no ordinary boundary edge");
    };
    subdivide(lower[0]!, upper[0]!, left);
    subdivide(lower.at(-1)!, upper.at(-1)!, right);
  }

  /** Split only the existing s136 boundary triangles at exact measured rail endpoints. */
  function splitExit(mesh: Context, exit: number[], insertions: Map<number, { id: number; t: number }[]>): void {
    for (const [edge, values] of insertions) {
      const a: number = exit[edge]!, b: number = exit[(edge + 1) % exit.length]!;
      const row: number[] = [a, ...values.sort((x: { id: number; t: number }, y: { id: number; t: number }): number => x.t - y.t).map(({ id }: { id: number; t: number }): number => id), b];
      let found: boolean = false;
      for (let i: number = 0; i < mesh.indices.length; i += 3)
        for (let j: number = 0; j < 3; ++j) {
          const p: number = mesh.indices[i + j]!, q: number = mesh.indices[i + (j + 1) % 3]!;
          if (!((p === a && q === b) || (p === b && q === a))) continue;
          if (found) throw new Error("The original F1 s136 boundary is not free");
          found = true;
          const c: number = mesh.indices[i + (j + 2) % 3]!;
          const ordered: number[] = p === a ? row : row.slice().reverse();
          const triangles: number[] = [];
          for (let k: number = 1; k < ordered.length; ++k) triangles.push(ordered[k - 1]!, ordered[k]!, c);
          mesh.indices.splice(i, 3, ...triangles);
          i += triangles.length - 3;
          break;
        }
      if (!found) throw new Error("An exact F1 exit rail has no existing regular-thigh boundary edge");
    }
  }

  /** Orient the new measured sheet by reciprocal index ownership at its retained rails. */
  function orient(existing: readonly number[], pending: number[]): void {
    /** Undirected indexed identity; no coordinate comparison joins separate points. */
    const edge: (a: number, b: number) => string = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    const outside: Map<string, number> = new Map();
    for (let i: number = 0; i < existing.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = existing[i + j]!, b: number = existing[i + (j + 1) % 3]!;
        const k: string = edge(a, b);
        outside.set(k, (outside.get(k) ?? 0) + (a < b ? 1 : -1));
      }
    const uses: Map<string, { face: number; direction: number }[]> = new Map();
    for (let i: number = 0; i < pending.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = pending[i + j]!, b: number = pending[i + (j + 1) % 3]!;
        const k: string = edge(a, b), list: { face: number; direction: number }[] = uses.get(k) ?? [];
        list.push({ face: i / 3, direction: a < b ? 1 : -1 });
        uses.set(k, list);
      }
    const signs: Map<number, number> = new Map();
    const queue: number[] = [];

    /** Propagate coherent orientation from reciprocal external edge uses. */
    const admit: (face: number, sign: number) => void = (face: number, sign: number): void => {
      const old: number | undefined = signs.get(face);
      if (old !== undefined && old !== sign) throw new Error("The measured F1 ribbon has inconsistent oriented boundary ownership");
      if (old === undefined) { signs.set(face, sign); queue.push(face); }
    };
    for (const [k, list] of uses) {
      if (list.length > 2) throw new Error("The measured F1 ribbon repeats a physical edge");
      if (list.length === 1) {
        const direction: number = outside.get(k) ?? 0;
        if (Math.abs(direction) !== 1) throw new Error("The measured F1 ribbon leaves an unmatched boundary");
        admit(list[0]!.face, -direction * list[0]!.direction);
      }
    }
    for (let q: number = 0; q < queue.length; ++q) {
      const face: number = queue[q]!, sign: number = signs.get(face)!;
      for (let j: number = 0; j < 3; ++j) {
        const a: number = pending[3 * face + j]!, b: number = pending[3 * face + (j + 1) % 3]!;
        const list: { face: number; direction: number }[] = uses.get(edge(a, b))!;
        if (list.length !== 2) continue;
        const mine: { face: number; direction: number } = list.find((item: { face: number; direction: number }): boolean => item.face === face)!, other: { face: number; direction: number } = list.find((item: { face: number; direction: number }): boolean => item.face !== face)!;
        admit(other.face, -sign * mine.direction * other.direction);
      }
    }
    if (signs.size !== pending.length / 3) throw new Error("A measured F1 ribbon is detached from both retained rails");
    for (const [face, sign] of signs)
      if (sign < 0) [pending[3 * face + 1], pending[3 * face + 2]] = [pending[3 * face + 2]!, pending[3 * face + 1]!];
  }
}

