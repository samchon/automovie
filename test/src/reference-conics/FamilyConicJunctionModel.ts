import { AutoMovieSolidVector as V } from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type { AutoMovieVector3Tuple as V3 } from "@automovie/interface";

import { FamilyConicFairing as Fairing } from "./FamilyConicFairing";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicJunction as Junction } from "./FamilyConicJunction";
import type { FamilyConicLoft as K } from "./FamilyConicLoft";

/** The shared curve-space model of ordered children joining a host at an end plane. */
export namespace FamilyConicJunctionModel {
  /** Four guide axes and the four phases halfway between them. */
  const FAIR_LINES: number = 8;

  /** Coarse girth probe finer than the loft's minimum phase grid. */
  const FAIR_RING: number = 64;

  /** Fixed source geometry and material role of one child in fan order. */
  export interface IChild {
    /** Source face name in this composition. */
    face: string;
    /** Authoritative stock name, shared by reflected twins. */
    stock: string;
    /** Initial family in millimetres, before reflection. */
    family: K.IStored;
    /** Reduced proximal basis and protected distal material. */
    tail: K.ITailFit;
    /** Child view stations in millimetres, fixed over the fit. */
    stations: readonly number[];
    /** Rail displacement in millimetres along the child's course into its kept end. */
    rail: number;
    /** Sign of the course derivative toward the kept child. */
    into: 1 | -1;
  }

  /** Every invocation's fixed geometry and addresses of its adjustable fields. */
  export interface IRequest {
    /** Owner name used in rows and observation logs. */
    name: string;
    /** Physical end plane in millimetres. */
    plane: Junction.IPlane;
    /** Exact compose's phase count. */
    count: number;
    /** Children in composed order. */
    children: readonly IChild[];
    /** Host's face, its authoritative unreflected family, and its terminal station in millimetres. */
    host: { face: string; stock: string; family: K.IStored; station: number };
    /** Column order: stock and finite-difference step in the field's own units. */
    fields: readonly { stock: string; step: number }[];
    /** Base materials whose layout and course the prepared read uses. */
    seeds: ReadonlyMap<string, K.IStored>;
    /** Exact partial stock construction for a column outside the linear field model. */
    stockAt: (state: readonly number[], stock: string) => K.IStored;
    /** Optional cost and geometry observations. */
    log?: (event: string, detail: object) => void;
  }

  /**
   * Prepare fairing on exposed ring and guide curves and compose guards on their end-plane cuts.
   * Pair and host rows use active-segment distance differentials (Schulman et al. 2014).
   * Grouped columns move one ordinate of each independent stock (Curtis, Powell and Reid 1974).
   */
  export function prepare({ name, plane, count, children, host, fields, seeds, stockAt, log = () => {} }: IRequest) {
    type P = [number, number];
    const family = (families: ReadonlyMap<string, K.IStored>, face: string, stock: string): K.IStored => {
      const own: K.IStored | undefined = families.get(stock) ?? (host.stock === stock ? host.family : undefined);
      if (own === undefined) throw new Error("the junction has no family for " + stock);
      return face === stock ? own : AutoMovieHumanConicLoft.mirror(own, face);
    };
    // The stations each child is read at, fixed from the base sources: its rings over its root stretch, its lines two stations past
    // it, and the four stations of its base view that bracket the end plane (the course point's height over the plane changes sign).
    const height = (p: readonly number[]): number => V.dot(V.sub(p as V3, plane.origin), plane.z);
    const layout = children.map((child) => {
      const member: IChild = child;
      const stations: number[] = member.stations.filter((s: number): boolean => s >= member.tail.knots[0]!);
      const rings: number[] = child.face === child.stock ? stations.filter((s: number): boolean => s <= member.tail.mark) : [];
      // The cut's bracket: from the last station whose whole ring lies on the plane's near side to the first whose whole ring lies past
      // it, one more each way. A splayed digit's side can cross the plane outside the interval around its course crossing.
      const all: readonly number[] = member.stations;
      const own = family(new Map([[child.stock, member.family]]), child.face, child.stock);
      const probe = Junction.read({ face: child.face, family: own, rings: all, lines: [], guides: [], bracket: [], cut: [],
        phases: Array.from({ length: FAIR_RING }, (_, j: number): number => (2 * Math.PI * j) / FAIR_RING) }, plane, Junction.sections());
      const sides = probe.rings.map((ringPoints: V3[]): number => {
        const h = ringPoints.map(height);
        return Math.max(...h) < 0 ? -1 : Math.min(...h) > 0 ? 1 : 0;
      });
      const below: number = sides.lastIndexOf(-1), above: number = sides.indexOf(1);
      const bracket: number[] = all.slice(Math.max(0, below - 1), above < 0 ? all.length : Math.min(all.length, above + 2));
      const coarse = Junction.read({ face: child.face, family: own,
        rings: [rings.length > 0 ? rings[0]! : bracket[0]!], lines: [], phases: Array.from({ length: FAIR_RING }, (_, j: number): number => (2 * Math.PI * j) / FAIR_RING),
        guides: [], bracket: [], cut: [] }, plane, Junction.sections());
      const girth: number = coarse.rings[0]!.reduce((sum: number, p: V3, j: number, ring: V3[]): number => sum + V.norm(V.sub(ring[(j + 1) % ring.length]!, p)), 0);
      const ringCount: number = AutoMovieHumanConicLoft.phaseCount(member.family, girth);
      const phases: number[] = Array.from({ length: ringCount }, (_, j: number): number => (2 * Math.PI * j) / ringCount);
      const span: number = rings.length < 2 ? 1 : rings.at(-1)! - rings[0]!;
      const weights: number[] = rings.map((_, i: number): number => rings.length < 2 ? 1 : ((rings[Math.min(i + 1, rings.length - 1)]! - rings[Math.max(i - 1, 0)]!) / 2) / span);
      // The cut at twice the owner's count, as the seal reads the actual cuts (`terminalIncidence`: non-neighbour overlap and the forks'
      // crossing directions on 2 x count-gons), finer than the composition's count; the wedge's lines through every station of the
      // child's view from the bracket's start to its domain's end, as the skin cut walks them.
      const childRail: number = child.rail;
      // The wedge's stations end one past the first whose whole ring stands past the end plane by more than the rail: the planes move
      // by the rail along the child's axis, so rise at most the rail over the primary plane. The truncated grid is a conservative filter.
      const past: number = probe.rings.findIndex((ringPoints: V3[]): boolean => Math.min(...ringPoints.map(height)) > childRail);
      return { child, rings, lines: stations.slice(0, rings.length + 2), phases, weights, bracket,
        guides: Array.from({ length: FAIR_LINES }, (_, j: number): number => (2 * Math.PI * j) / FAIR_LINES),
        cutPhases: Array.from({ length: 2 * count }, (_, j: number): number => (2 * Math.PI * j) / (2 * count)),
        wedge: all.slice(Math.max(0, below - 1), past < 0 ? all.length : Math.min(all.length, past + 2)), railMm: childRail };
    });
    const railMm: number = Math.min(...children.map((child): number => child.rail));
    const { face: hostFace, stock: hostStock, station } = host;
    const hostFamily = (families: ReadonlyMap<string, K.IStored>): K.IStored => family(families, hostFace, hostStock);
    // Match the composed split's sampling for both seam crossings and its host rail test.
    const hostPhases: number[] = Array.from({ length: 8 * count }, (_, j: number): number => (2 * Math.PI * j) / (8 * count));
    const into: number[] = layout.map(({ child }): number => child.into);
    const byStock = new Map<string, number[]>();
    fields.forEach(({ stock }, index): void => { const list = byStock.get(stock); if (list === undefined) byStock.set(stock, [index]); else list.push(index); });
    const columnGroups: number = Math.max(0, ...[...byStock.values()].map((list): number => list.length));

    // The reduced prefix basis is fixed at the fit's knot addresses. At and beyond the protected mark its influence is zero.
    const scopes = layout.map((entry) => {
      const { face, stock } = entry.child;
      const tail: K.ITailFit = entry.child.tail;
      const cardinal = F.basisOf(tail.knots);
      const held: number[] = tail.free.map((): number => 0);
      const controls = (byStock.get(stock) ?? []).map((i: number, k: number) => (
        { field: Math.floor(k / tail.free.length), knot: k % tail.free.length, step: fields[i]!.step }));
      // A mirrored feature run can change several fields together by the nonlinear chord address. Keep its exact construction.
      return Junction.prepareMember({ face, family: family(seeds, face, stock), rings: entry.rings,
        lines: entry.rings.length > 0 ? entry.lines : [], phases: entry.phases, guides: entry.rings.length > 0 ? entry.guides : [],
        bracket: entry.bracket, cut: entry.cutPhases, wedge: entry.wedge }, plane,
      face === stock && tail.free.length > 0 ? { controls, weights: (s: number): number[] => s < tail.mark ? tail.basis(cardinal(s)) : held } : undefined);
    });
    const hostScope = Junction.prepareMember({ face: hostFace, family: hostFamily(seeds), rings: [station], lines: [], phases: hostPhases,
      guides: [], bracket: [], cut: [] }, plane);
    const readHost = (families: ReadonlyMap<string, K.IStored>, provider: Junction.ISections) => {
      const ring: V3[] = hostScope.read(hostFamily(families), provider).rings[0]!;
      // The outline's closest piece can change between consecutive ring points. Read every sample used by exact admission.
      const host: P[] = ring.map((p: V3): P => { const q = V.sub(p, plane.origin); return [V.dot(q, plane.x), V.dot(q, plane.y)]; });
      return { ring, host };
    };
    const fixedHost = byStock.has(hostStock) ? undefined : readHost(seeds, Junction.sections());
    const hostCurves = (families: ReadonlyMap<string, K.IStored>, provider: Junction.ISections): ReturnType<typeof readHost> =>
      fixedHost ?? readHost(families, provider);
    const readChild = (families: ReadonlyMap<string, K.IStored>, provider: Junction.ISections, c: number): Junction.IRead => {
      const { face, stock } = layout[c]!.child;
      return scopes[c]!.read(family(families, face, stock), provider);
    };
    const polygon = (cut: readonly (P | null)[]): P[] => cut.filter((p): p is P => p !== null);
    /**
     * Each child's rail wedge depth by cut phase as rows, minus (`Junction.wedge`): the end plane and the child's seam planes, turned
     * toward the child, moved along its axis by its rail, as the split cuts its rail (`derive`, "the child face's rail"); the rail's
     * wedge lies inside the unshifted one, so its row implies the boundary's ("the child face's boundary in the composition"). No rows
     * stand while the seams are refused.
     */
    const wedgeOf = (r: Junction.IRead, seams: Junction.ISeams, c: number): number[] => {
      if (r.axis === null) return r.wedgeLines.map((): number => 0);
      const planes: { point: V3; normal: V3 }[] = [{ point: plane.origin, normal: plane.z }];
      if (c > 0) planes.push(seams.planes[c - 1]!);
      if (c < seams.planes.length) planes.push({ point: seams.planes[c]!.point, normal: V.scale(seams.planes[c]!.normal, -1) });
      return Junction.wedge(r.wedgeLines, planes, V.scale(r.axis, into[c]! * layout[c]!.railMm)).map((depth: number): number => -depth);
    };
    /** The seams on the host's end ring from members' cuts, axes and the host ring, as the split derives them. */
    const axisOf = (r: Junction.IRead, i: number): V3 | null => r.axis === null ? null : V.scale(r.axis, into[i]!);
    const seamsOf = (children: readonly Junction.IRead[], ring: readonly V3[]) => Junction.prepareSeams({ plane,
      cuts: children.map((r) => r.cut), axes: children.map(axisOf), host: ring });

    // The rows of one reading of the curves, with the visible-arc masks of the base (held for its columns).
    type Rows = { fairing: number[]; fairingOwner: number[]; pairs: { value: number; a: number; b: number; ia: number; ib: number; seg: number; t: number; u: P; kind: "overlap" | "clearance" | "exclusion"; inA: boolean }[];
      host: { value: number; c: number; k: number; k1: number; t: number; u: P; h: number }[]; crossing: string | null;
      nesting: { model: ReturnType<typeof seamsOf>; radius: number; values: number[] };
      transversal: { value: number; c: number; k: number }[]; wedges: number[] };
    type Curves = ReturnType<typeof hostCurves> & { children: Junction.IRead[] };
    const visible = (read: Curves): boolean[][] => layout.map((entry, i): boolean[] => {
      const own = read.children[i]!.cut, n = own.length;
      const others: P[][] = [i - 1, i + 1].filter((j) => j >= 0 && j < layout.length).map((j) => polygon(read.children[j]!.cut));
      // A ring phase's cut point is the cut phase nearest it (the cut is read at 2 x count phases, the ring at the figure's count).
      return entry.phases.map((_, k: number): boolean => {
        const p = own[Math.round((k * n) / entry.phases.length) % n];
        return p === null || p === undefined || !others.some((o) => o.length > 2 && Junction.inside(p, o));
      });
    });
    /** The fairing residuals of one reading, each with its owner: all a grouped column needs of its moved reading. */
    const fairingOf = (read: Curves, masks: boolean[][]): { fairing: number[]; fairingOwner: number[] } => {
      const fairing: number[] = [], fairingOwner: number[] = [];
      layout.forEach((entry, i): void => {
        const r = read.children[i]!, mask = masks[i]!;
        const before: number = fairing.length;
        r.rings.forEach((ring: V3[], j: number): void => {
          if (mask.every(Boolean)) { fairing.push(...Fairing.residuals(ring, true, r.normals[j], entry.weights[j])); return; }
          // Each visible run of the ring, open, in phase order round the ring.
          const start = mask.findIndex((m) => !m);
          let run: V3[] = [];
          for (let n = 1; n <= mask.length; ++n) {
            const k = (start + n) % mask.length;
            if (mask[k]) run.push(ring[k]!);
            if (!mask[k] || n === mask.length) { if (run.length >= 4) fairing.push(...Fairing.residuals(run, false, r.normals[j], entry.weights[j])); run = []; }
          }
        });
        r.lines.forEach((line: V3[], g: number): void => {
          const k = Math.round((entry.guides[g]! / (2 * Math.PI)) * mask.length) % mask.length;
          if (mask[k]) fairing.push(...Fairing.residuals(line, false));
        });
        for (let n = before; n < fairing.length; ++n) fairingOwner.push(i);
      });
      return { fairing, fairingOwner };
    };
    const rowsOf = (read: Curves, masks: boolean[][]): Rows => {
      const { fairing, fairingOwner } = fairingOf(read, masks);
      const cuts: P[][] = read.children.map((r) => polygon(r.cut));
      const seamModel = seamsOf(read.children, read.ring);
      const pairs: Rows["pairs"] = [];
      let crossing: string | null = null;
      for (let a = 0; a < cuts.length; ++a) for (let b = a + 1; b < cuts.length; ++b) {
        const [A, B] = [cuts[a]!, cuts[b]!];
        if (A.length < 3 || B.length < 3) { crossing = children[a]!.face + " or " + children[b]!.face + " has no closed cut in the end plane"; continue; }
        const neighbours: boolean = b === a + 1;
        if (neighbours) {
          const n: number = seamModel.crossings[a]!;
          if (n !== 2 && crossing === null) crossing = "the sections of " + children[a]!.face + " and " + children[b]!.face + " cross " + n + " times in the end plane, not twice";
        }
        // The deepest point of either inside the other (penetration), else the closest approach (separation, negative depth).
        // Neighbours also keep each cut partly outside the other: a cut wholly inside its neighbour satisfies the overlap row and crosses
        // it zero times. That row is the
        // least depth of one cut's points in the other, at most zero when one point stands on or outside it, with the clearance row's rate.
        const ways = [[A, B, true], [B, A, false]] as const;
        const both = ways.map(([P0, Q0, inA]) => ({ inA, ...Junction.depths(P0, Q0) }));
        const deepest = both[0]!.deepest.depth >= both[1]!.deepest.depth ? both[0]! : both[1]!;
        const d = deepest.deepest;
        pairs.push({ value: neighbours ? -d.depth : d.depth, a, b, ia: d.k, ib: -1, seg: d.segment, t: d.t, u: d.u,
          kind: neighbours ? "overlap" : "clearance", inA: deepest.inA });
        if (neighbours) for (const way of both)
          pairs.push({ value: way.least.depth, a, b, ia: way.least.k, ib: -1, seg: way.least.segment, t: way.least.t, u: way.least.u, kind: "exclusion", inA: way.inA });
        // One overlap interval per neighbour pair and direction (`Junction.secondRun`): two cuts that cross four times hold the overlap
        // and non-containment rows and are refused by the composition. The row is the active
        // point's depth with its sign, so its rate is a depth row's: a maximum's like the non-containment row, a minimum's like overlap.
        if (neighbours) for (const [P0, Q0, inA] of ways) {
          const run = Junction.secondRun(P0, Q0);
          pairs.push({ value: run.value, a, b, ia: run.at.k, ib: -1, seg: run.at.segment, t: run.at.t, u: run.at.u,
            kind: run.sign > 0 ? "exclusion" : "overlap", inA });
        }
      }
      // The composed outline as the compose makes it: each cut's segments outside every other cut, a segment that enters another cut
      // clipped at the fork where it crosses that cut's boundary. The host ring's distance to it less the shortest rail; the row's rate
      // follows the nearest point along its segment, so the row stays continuous across a fork.
      // One row per host ring point, each linearized on its active segment (as sequential convex collision avoidance does per active
      // pair, Schulman et al. 2014), so a fork switch changes which segment is active instead of making a row jump.
      const segments = Junction.outline(read.children.map((r) => r.cut));
      const host: Rows["host"] = read.host.map((h: P, index: number) => {
        const near = Junction.onOutline(h, segments), g = near.segment;
        const u: P = near.distance > 0 ? [(h[0] - near.at[0]) / near.distance, (h[1] - near.at[1]) / near.distance] : [0, 0];
        return { value: near.distance - railMm, c: g?.c ?? -1, k: g?.k0 ?? -1, k1: g?.k1 ?? -1, t: near.t, u, h: index };
      });
      // The seams' nesting on the host's end ring, the split's own test (`AutoMovieConstructionSplitCompose.derive`), as rows: each margin
      // in mm along the ring at its mean radius (its girth over the turn), minus, so a row is satisfied at or below zero as the others.
      const seams: Junction.ISeams = seamModel.base;
      if (seams.refusal !== null && crossing === null) crossing = seams.refusal;
      const radius: number = read.ring.reduce((sum: number, p: V3, k: number, all: V3[]): number => sum + V.norm(V.sub(all[(k + 1) % all.length]!, p)), 0) / (2 * Math.PI);
      // Each cut phase's line crosses the end plane transversally (the skin cut's "tangent to the cut" and the seal's station advance):
      // the unit station tangent's rate across the plane, kept positive.
      const transversal = read.children.flatMap((r, c: number) => r.crossing.flatMap((x, k: number) => (x === null ? [] : [{ value: -x, c, k }])));
      return { fairing, fairingOwner, pairs, host, crossing, nesting: { model: seamModel, radius, values: seams.margins.flat().map((x: number): number => -x * radius) },
        transversal, wedges: seams.refusal === null ? read.children.flatMap((r, c: number): number[] => wedgeOf(r, seams, c)) : [] };
    };

    /** The model's own reading of the host ring, the cuts and the composed outline, for comparison with the split's admission. */
    const probe = (families: ReadonlyMap<string, K.IStored>) => {
      const provider = Junction.sections();
      const read = { ...hostCurves(families, provider), children: scopes.map((_, c: number) => readChild(families, provider, c)) };
      return { ring: read.ring, host: read.host, segments: Junction.outline(read.children.map((r) => r.cut)), railMm, station: station, plane };
    };

    /** One reading: the rows and, with derivatives, their rates from the grouped columns. */
    return Object.assign((state: readonly number[], derivatives: boolean, candidates: ReadonlyMap<string, K.IStored>, hard: F.IGroupRow[], inside: F.IGroupRow[]) => {
      const started: number = performance.now();
      const provider = Junction.sections();
      const readings = layout.map(({ child }, c: number) => derivatives
        ? scopes[c]!.reading(family(candidates, child.face, child.stock), provider)
        : { base: readChild(candidates, provider, c), moved: null });
      const base: Curves = { ...hostCurves(candidates, provider), children: readings.map(({ base }): Junction.IRead => base) };
      const masks = visible(base);
      const rows = rowsOf(base, masks);
      const knotColumn: number[] = fields.map((): number => -1);
      for (const order of byStock.values()) order.forEach((index: number, k: number): void => { knotColumn[index] = k; });
      const expanded = new Set(layout.flatMap(({ child }, c: number): string[] => readings[c]!.moved === null ? [child.stock] : []));
      expanded.add(hostStock);
      const cutPhases = base.children.map(({ cut }): number[] => cut.flatMap((p, k: number): number[] => p === null ? [] : [k]));
      const wedgeFirst: number[] = [];
      let wedgeCount: number = 0;
      for (const { wedgeLines } of base.children) {
        wedgeFirst.push(wedgeCount);
        wedgeCount += wedgeLines.length;
      }
      const gradients = {
        fairing: rows.fairing.map(() => new Map<number, number>()),
        pairs: rows.pairs.map(() => new Map<number, number>()),
        host: rows.host.map(() => new Map<number, number>()),
        nesting: rows.nesting.values.map(() => new Map<number, number>()),
        transversal: rows.transversal.map(() => new Map<number, number>()),
        wedges: rows.wedges.map(() => new Map<number, number>()),
      };
      if (derivatives) for (let g = 0; g < columnGroups; ++g) {
        const changed = [...state];
        const moved = new Map<string, number>();
        for (const [stock, list] of byStock) if (g < list.length) { const index = list[g]!; changed[index]! += fields[index]!.step; moved.set(stock, index); }
        // Only sources outside the reduced field model need a new family. Every other column touches its own member's station data.
        const families = new Map([...moved.keys()].filter((stock: string): boolean => expanded.has(stock))
          .map((stock: string): [string, K.IStored] => [stock, stockAt(changed, stock)]));
        const children = layout.map(({ child }, c: number): Junction.IRead => {
          const index: number | undefined = moved.get(child.stock);
          if (index === undefined) return base.children[c]!;
          const column = readings[c]!.moved;
          return column === null ? readChild(families, provider, c) : column(knotColumn[index]!);
        });
        const hostIndex: number | undefined = moved.get(hostStock);
        const next: Curves = { ...(hostIndex === undefined ? { ring: base.ring, host: base.host } : hostCurves(families, provider)), children };
        // Fairing rows belong to one member's curves; their order follows the members, so each member's rows are read with only its
        // own values moved, all members at once.
        // A member's fairing rows depend on its own curves only, so with every member moved at once each row's change is its own
        // member's: the row's rate goes to that member's moved column.
        const residuals = fairingOf(next, masks).fairing;
        rows.fairing.forEach((value: number, r: number): void => {
          const member = rows.fairingOwner[r]!;
          const index = moved.get(layout[member]!.child.stock);
          if (index !== undefined) gradients.fairing[r]!.set(index, (residuals[r]! - value) / fields[index]!.step);
        });
        // The pair and host rows by the chain rule from the members' own point velocities.
        const velocity = (c: number, k: number): P | null => {
          const index = moved.get(layout[c]!.child.stock);
          const p = base.children[c]!.cut[k], q = next.children[c]!.cut[k];
          if (index === undefined || p === null || p === undefined || q === null || q === undefined) return null;
          return [(q[0] - p[0]) / fields[index]!.step, (q[1] - p[1]) / fields[index]!.step];
        };
        rows.pairs.forEach((row, r: number): void => {
          const [own, other] = row.inA ? [row.a, row.b] : [row.b, row.a];
          // Polygon indices back to cut phases: a polygon holds a cut's crossing phases in order.
          const vOwn = velocity(own, cutPhases[own]![row.ia]!);
          const others: number[] = cutPhases[other]!;
          const k0 = others[row.seg]!, k1 = others[(row.seg + 1) % others.length]!;
          const v0 = velocity(other, k0), v1 = velocity(other, k1);
          // `u` is minus the depth's rate in the own point and its rate in the boundary point: the overlap row (minus the depth) moves
          // by `u` in the own point, the clearance row (the depth) by minus `u`, and the boundary point the other way.
          const sign = row.kind === "overlap" ? 1 : -1;
          const add = (c: number, v: P | null, weight: number): void => {
            const index = moved.get(layout[c]!.child.stock);
            if (index === undefined || v === null) return;
            const d = (v[0] * row.u[0] + v[1] * row.u[1]) * weight;
            gradients.pairs[r]!.set(index, (gradients.pairs[r]!.get(index) ?? 0) + sign * d);
          };
          add(own, vOwn, 1);
          add(other, v0, -(1 - row.t));
          add(other, v1, -row.t);
        });
        rows.host.forEach((row, r: number): void => {
          if (row.c < 0) return;
          const v0 = velocity(row.c, row.k), v1 = velocity(row.c, row.k1);
          const index = moved.get(layout[row.c]!.child.stock);
          const gradient = gradients.host[r]!;
          if (index !== undefined && v0 !== null && v1 !== null) {
            const v: P = [(1 - row.t) * v0[0] + row.t * v1[0], (1 - row.t) * v0[1] + row.t * v1[1]];
            gradient.set(index, -(v[0] * row.u[0] + v[1] * row.u[1]));
          }
          if (hostIndex !== undefined) {
            const a: P = base.host[row.h]!, b: P = next.host[row.h]!;
            const rate: number = ((b[0] - a[0]) * row.u[0] + (b[1] - a[1]) * row.u[1]) / fields[hostIndex]!.step;
            gradient.set(hostIndex, (gradient.get(hostIndex) ?? 0) + rate);
          }
        });
        // A stock moves its own faces together. When its neighbours hold, only the incident seam pairs and the children meeting
        // those planes can change their wedge rows. The host ring changes nesting phases but leaves the wedge planes fixed.
        if (rows.nesting.model.base.refusal === null) for (const [stock, index] of moved) {
          const affected: number[] = layout.flatMap(({ child }, c: number): number[] => child.stock === stock ? [c] : []);
          const changes = affected.map((c: number) => ({ index: c, cut: next.children[c]!.cut, axis: axisOf(next.children[c]!, c) }));
          const seams: Junction.ISeams = rows.nesting.model.moved(changes, stock === hostStock ? next.ring : base.ring);
          if (seams.refusal !== null) continue;
          seams.margins.flat().forEach((x: number, r: number): void => {
            const d: number = (-x * rows.nesting.radius - rows.nesting.values[r]!) / fields[index]!.step;
            if (d !== 0) gradients.nesting[r]!.set(index, d);
          });
          if (rows.wedges.length > 0) layout.forEach((_, c: number): void => {
            if (!affected.some((j: number): boolean => Math.abs(c - j) <= 1)) return;
            const child: Junction.IRead = affected.includes(c) ? next.children[c]! : base.children[c]!;
            wedgeOf(child, seams, c).forEach((v: number, k: number): void => {
              const r: number = wedgeFirst[c]! + k;
              const d: number = (v - rows.wedges[r]!) / fields[index]!.step;
              if (d !== 0) gradients.wedges[r]!.set(index, d);
            });
          });
        }
        // A transversality row reads one member's own line, so its rate goes to that member's moved column.
        rows.transversal.forEach((row, r: number): void => {
          const index = moved.get(layout[row.c]!.child.stock), x = next.children[row.c]!.crossing[row.k];
          if (index !== undefined && x !== null && x !== undefined) gradients.transversal[r]!.set(index, (-x - row.value) / fields[index]!.step);
        });
      }
      log("family-body-junction-cost", { owner: name, derivatives, sections: provider.count, columnGroups: derivatives ? columnGroups : 0,
        fairingRows: rows.fairing.length, pairRows: rows.pairs.length, hostRows: rows.host.length,
        pairs: rows.pairs.map((row) => ({ kind: row.kind, a: children[row.a]!.face, b: children[row.b]!.face, value: row.value })),
        worstHost: Math.max(-Infinity, ...rows.host.map((row) => row.value)), crossing: rows.crossing,
        seams: rows.nesting.model.base.seams, nested: rows.nesting.model.base.nested, nestingRows: rows.nesting.values,
        nestingRates: gradients.nesting.map((g): number => Math.max(0, ...[...g.values()].map(Math.abs))),
        worstTransversal: Math.max(-Infinity, ...rows.transversal.map((row) => row.value)), worstWedge: Math.max(-Infinity, ...rows.wedges),
        wedgeRows: rows.wedges.length,
        pairRates: gradients.pairs.map((g): number => Math.max(0, ...[...g.values()].map(Math.abs))), elapsedMs: performance.now() - started });
      const measured: F.IGroupRow[] = rows.fairing.map((value, r) => ({ value, gradient: gradients.fairing[r]! }));
      const pairRows: F.IGroupRow[] = rows.pairs.map((row, r) => ({ value: row.value, gradient: gradients.pairs[r]! }));
      const hostRows: F.IGroupRow[] = rows.host.map((row, r) => ({ value: row.value, gradient: gradients.host[r]! }));
      const nestingRows: F.IGroupRow[] = rows.nesting.values.map((value, r) => ({ value, gradient: gradients.nesting[r]! }));
      const transversalRows: F.IGroupRow[] = rows.transversal.map((row, r) => ({ value: row.value, gradient: gradients.transversal[r]! }));
      const wedgeRows: F.IGroupRow[] = rows.wedges.map((value, r) => ({ value, gradient: gradients.wedges[r]! }));
      const key: string = name + "/junction";
      // The host-rail rows are read on every state as inside rows: the ring's distance to the cuts' outline is defined while a pair
      // crosses wrongly too. Keep the same distance rows during outline recovery.
      const outline: F.IGroupOutline = rows.crossing !== null ? { kind: "refused", key, detail: rows.crossing } : { kind: "formed", key, rows: [] };
      // The pair rows are restorable as the ownership rows are (a start may hold a non-neighbour overlap, as the foot's does), and once
      // satisfied they are kept with them (`preservation`).
      const preservation: F.IGroupPreservation[] = outline.kind === "formed" ? [
        { name: "child ownership", rows: inside }, { name: "neighbour overlap and separation", rows: pairRows },
        { name: "host outline rail", rows: hostRows }, { name: "seam nesting", rows: nestingRows },
        { name: "cut transversality", rows: transversalRows }, { name: "child rail wedge", rows: wedgeRows }] : [];
      return F.readGroup(state, derivatives, [{ rows: () => ({ measured, incidence: [],
        inside: [...inside, ...pairRows, ...nestingRows, ...hostRows, ...transversalRows, ...wedgeRows], hard }) }], outline, preservation);
    }, { probe });
  }
}
