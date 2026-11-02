import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import { AutoMovieHumanWebBoundary as Boundary } from "./AutoMovieHumanWebBoundary";
import { AutoMovieHumanWebGeometry as Geometry } from "./AutoMovieHumanWebGeometry";
import { AutoMovieHumanWebDomain as Domain } from "./AutoMovieHumanWebDomain";
import { AutoMovieHumanWebPatch as Patch } from "./AutoMovieHumanWebPatch";

/** World-space Cartesian point in millimetres. */
type Vec3 = Geometry.Vec3;
/** One saddle shared by adjacent child chains. */
type IWeb = Geometry.IWeb;
/** A saddle's path toward one child. */
type IWebChild = Geometry.IWebChild;
/** One interior or shared separatrix column. */
type IColumn = Geometry.IColumn;
/** One child surface and its ordered columns. */
type IChild = Geometry.IChild;
/** Arithmetic and sampling owned by the shared web geometry. */
const { add, sub, scale, dot, norm, unit, smooth, wrapPi, sampled, TWO_PI, TABLE, CELL, CREST_ROWS, FADE }: typeof Geometry = Geometry;

/** Shared saddle webs whose ring positions, tangents and curvatures follow their neighbours. */
export namespace AutoMovieHumanBodyWeb {
  /** One child's directed parent arcs. */
  export type IShare = Geometry.IShare;
  /** Consumer-owned skin and chain boundaries. */
  export type IInput = Geometry.IInput;
  /** Child rings and construction paths emitted by the web. */
  export type IResult = Geometry.IResult;
  /** Build the skin from the parent's ring to its children's sections. */
  export function build(input: IInput): IResult {
    const { mesh, parent, down }: IInput = input;
    const position: (v: number) => Vec3 = (v: number): Vec3 => AutoMovieHumanLoftMesh.position(mesh, v);
    const sp: number = down ? parent.layers[0]!.y : parent.layers[parent.layers.length - 1]!.y;
    const parentJet: (phase: number) => Patch.IJet = Boundary.sampler(parent, sp, down ? -1 : 1);
    const outward: (t: number) => Vec3 = (t: number): Vec3 => unit(parentJet(t).first);

    // The webs: every pair of pinches two children part at.
    const webs: Map<string, IWeb> = new Map();
    const key = (a: number, b: number): string => `${Math.min(a, b)}:${Math.max(a, b)}`;
    for (const share of input.shares)
      share.arcs.forEach((arc: number[], k: number): void => {
        const next: number[] = share.arcs[(k + 1) % share.arcs.length]!;
        const a: number = arc[arc.length - 1]!;
        const b: number = next[0]!;
        if (webs.has(key(a, b))) return;
        const first: number = Math.min(a, b);
        const second: number = Math.max(a, b);
        const A: Vec3 = position(first);
        const B: Vec3 = position(second);
        const xi: Vec3 = unit(sub(B, A));
        const rho: number = norm(sub(B, A)) / 2;
        const mean: Vec3 = add(outward(input.phase.get(first)!), outward(input.phase.get(second)!));
        const ea: Vec3 = unit(sub(mean, scale(xi, dot(mean, xi))));
        webs.set(key(a, b), {
          first,
          second,
          A,
          B,
          xi,
          ea,
          rho,
          S: add(scale(add(A, B), 0.5), scale(ea, rho)),
          lips: new Map(),
          crest: -1,
          children: new Map(),
          lip: new Map(),
        });
      });
    const webOf = (a: number, b: number): IWeb => webs.get(key(a, b))!;

    // The ring's spacing sets the rows.
    let spacing: number = 0;
    let steps: number = 0;
    for (const share of input.shares)
      for (const arc of share.arcs)
        for (let i: number = 1; i < arc.length; i++) {
          spacing += norm(sub(position(arc[i]!), position(arc[i - 1]!)));
          steps++;
        }
    spacing /= Math.max(1, steps);

    // The crest's rows: a lip, a quarter round, in steps of CELL radii.
    const rhoLeast: number = Math.min(...[...webs.values()].map((w: IWeb): number => w.rho));
    const crestRow: number = Math.max(3, Math.ceil(Math.PI / 2 / CELL));

    // Every child's columns, before the rows are counted.
    const children: IChild[] = input.shares.map((share: IShare): IChild => {
      const child: IAutoMovieHumanLoftChain = input.chain(share.name);
      const sc: number = down ? child.layers[child.layers.length - 1]!.y : child.layers[0]!.y;
      const onChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(child, sc);
      const childJet: (phase: number) => Patch.IJet = Boundary.sampler(child, sc, down ? -1 : 1);
      const into: (t: number) => Vec3 = (t: number): Vec3 => unit(childJet(t).first);
      const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(child, sc);
      const O: Vec3 = AutoMovieHumanLoftChain.axis(child, sc);
      const angle = (p: Vec3): number => Math.atan2(dot(sub(p, O), f.v), dot(sub(p, O), f.u));

      // The section's angle at every phase, unwrapped in the sense phase turns.
      const table: number[] = [];
      for (let k: number = 0; k <= TABLE; k++) {
        const theta: number = angle(onChild((TWO_PI * k) / TABLE));
        if (k === 0) table.push(theta);
        else table.push(table[k - 1]! + wrapPi(theta - table[k - 1]!));
      }
      const sense: number = Math.sign(table[TABLE]! - table[0]!) || 1;
      const phaseOf = (theta: number): number => {
        // Bring the angle into the table's turn, then interpolate.
        let x: number = theta;
        const lo: number = Math.min(table[0]!, table[TABLE]!);
        while (x < lo) x += TWO_PI;
        while (x >= lo + TWO_PI) x -= TWO_PI;
        let a: number = 0;
        let b: number = TABLE;
        for (let i: number = 0; i < 40 && b - a > 1; i++) {
          const m: number = (a + b) >> 1;
          if ((table[m]! - x) * sense <= 0) a = m;
          else b = m;
        }
        const span: number = table[b]! - table[a]!;
        const f2: number = span === 0 ? 0 : (x - table[a]!) / span;
        return (TWO_PI * (a + Math.min(1, Math.max(0, f2)))) / TABLE;
      };

      // Angles round the child along its share, unwrapped in the child's sense.
      // Each web's own column arrives on the child's side of the web level
      // with the crest across the margin, between its two pinches' angles, so
      // it descends straight from the crest and its neighbours straddle it.
      const sequence: { v: number | null; web: IWeb | null }[] = [];
      share.arcs.forEach((arc: number[], k: number): void => {
        for (const v of arc) sequence.push({ v, web: null });
        const next: number[] = share.arcs[(k + 1) % share.arcs.length]!;
        sequence.push({ v: null, web: webOf(arc[arc.length - 1]!, next[0]!) });
      });
      const turned: number[] = [];
      sequence.forEach((e, i: number): void => {
        if (e.v === null) {
          turned.push(NaN);
          return;
        }
        const theta: number = angle(position(e.v));
        if (i === 0) turned.push(theta);
        else {
          const before: number = Number.isNaN(turned[i - 1]!) ? turned[i - 2]! : turned[i - 1]!;
          const step: number = wrapPi(theta - before);
          turned.push(before + (step * sense < 0 ? 0 : step));
        }
      });
      const close = (a: number): number => {
        // The gap from a pinch's angle onward to the next pinch's, the long way
        // round for a child with a single arc.
        const from: number = turned[a - 1]!;
        let to: number = a + 1 < turned.length ? turned[a + 1]! : turned[0]! + sense * TWO_PI;
        while ((to - from) * sense <= 0) to += sense * TWO_PI;
        const web: IWeb = sequence[a]!.web!;
        const level = (theta: number): number => dot(sub(onChild(phaseOf(theta)), web.S), web.xi);
        const side: number = Math.sign(level(to) - level(from)) || 1;
        let lo: number = from;
        let hi: number = to;
        for (let i: number = 0; i < 50; i++) {
          const mid: number = (lo + hi) / 2;
          if (level(mid) * side < 0) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      };
      sequence.forEach((e, i: number): void => {
        if (e.v === null) turned[i] = close(i);
      });

      const columns: IColumn[] = [];
      let at: number = 0;
      share.arcs.forEach((arc: number[], k: number): void => {
        const start: number = at;
        const end: number = at + arc.length - 1;
        const before: IWeb = webOf(
          share.arcs[(k + share.arcs.length - 1) % share.arcs.length]![
            share.arcs[(k + share.arcs.length - 1) % share.arcs.length]!.length - 1
          ]!,
          arc[0]!,
        );
        const after: IWeb = webOf(arc[arc.length - 1]!, share.arcs[(k + 1) % share.arcs.length]![0]!);
        // The crest before this arc, unwrapped to precede it.
        const crestAfter: number = turned[end + 1]!;
        let crestBefore: number = start === 0 ? turned[turned.length - 1]! - sense * TWO_PI : turned[start - 1]!;
        if ((crestAfter - crestBefore) * sense <= 0) crestBefore = crestAfter - sense * TWO_PI;

        // Length along the arc: the chart spaces a column's arrival at the child
        // as its distance along the ring from the web, so the arc's columns
        // arrive in proportion to it. An angle about the child's axis would
        // crowd them at a pinch seen edge on from an oblique child.
        const lengths: number[] = [0];
        for (let i: number = 1; i < arc.length; i++)
          lengths.push(lengths[i - 1]! + norm(sub(position(arc[i]!), position(arc[i - 1]!))));
        const total: number = lengths[lengths.length - 1]!;
        arc.forEach((v: number, i: number): void => {
          if (i === 0 || i === arc.length - 1) {
            columns.push({ kind: "pinch", v, web: i === 0 ? before : after });
            return;
          }
          const theta: number = crestBefore + (lengths[i]! / total) * (crestAfter - crestBefore);
          const phi: number = phaseOf(theta);
          const tau: number = input.phase.get(v)!;
          const fromBefore: boolean = lengths[i]! <= total - lengths[i]!;
          const web: IWeb = fromBefore ? before : after;
          const pinch: number = fromBefore ? arc[0]! : arc[arc.length - 1]!;
          const flow: number = fromBefore ? lengths[i]! : total - lengths[i]!;
          const fraction: number = lengths[i]! / total;
          columns.push({
            kind: "plain",
            v,
            p: position(v),
            o: outward(tau),
            q: onChild(phi),
            d: into(phi),
            phi,
            web,
            side: pinch === web.first ? -1 : 1,
            y: flow / web.rho,
            rho: before.rho + fraction * (after.rho - before.rho),
            parentJet: parentJet(tau),
            childJet: childJet(phi),
          });
        });
        at = end + 2;
      });

      // Where each web's own column meets this child's section.
      for (const [i, e] of sequence.entries()) {
        if (e.web === null) continue;
        const web: IWeb = e.web;
        // The chart's axes for this child: across the web along its own column,
        // which runs from the crest to its arrival, and along the margin square
        // to that, so its own column lies in the chart's real axis even where
        // the child's section stands no point level with the crest.
        const phi: number = phaseOf(turned[i]!);
        const q: Vec3 = onChild(phi);
        const run: Vec3 = sub(q, web.S);
        const flat: Vec3 = sub(run, scale(web.ea, dot(run, web.ea)));
        const toward: Vec3 = sub(O, web.S);
        const eta: Vec3 =
          norm(flat) > 1e-3 * web.rho
            ? unit(flat)
            : unit(sub(sub(toward, scale(web.ea, dot(toward, web.ea))), scale(web.xi, dot(toward, web.xi))));
        // The saddle's own column is its parabola `S + g u E_eta + depth u^2
        // E_a` in the chart's u, leaving the crest across the web as far as the
        // child's wall stands from it and arriving along the child, no faster
        // than its chord since that need not be the chart's own direction.
        const lateral: number = Math.max(0, dot(run, eta));
        const depth: number = Math.max(0.25 * web.rho, dot(run, web.ea));
        const arrive: number = Math.min(
          norm(add(scale(eta, lateral), scale(web.ea, 2 * depth))),
          norm(run),
        );
        web.children.set(share.name, {
          phi,
          q,
          depth,
          own: (u: number): Vec3 => Patch.curve(
            { value: web.S, first: scale(eta, lateral), second: scale(web.ea, 2 * depth) },
            Boundary.geometric(childJet(phi), arrive), u,
          ),
          jet: childJet(phi),
          rows: [],
        });
      }
      return { name: share.name, chain: child, station: sc, columns };
    });

    // Both sides of a saddle share one tangent plane and one normal curvature.
    // The least-squares parabola through the child walls owns that curvature.
    for (const web of webs.values()) {
      const own: IWebChild[] = [...web.children.values()];
      const flat: Vec3[] = own.map((child: IWebChild): Vec3 => {
        const run: Vec3 = sub(child.q, web.S);
        return sub(run, scale(web.ea, dot(run, web.ea)));
      });
      const eta: Vec3 = unit(sub(flat[0]!, flat[1]!));
      const along: number[] = flat.map((point: Vec3): number => dot(point, eta));
      const divisor: number = along.reduce((sum: number, value: number): number => sum + value ** 4, 0);
      const curvature: number = 2 * own.reduce((sum: number, child: IWebChild, i: number): number => sum + along[i]! ** 2 * child.depth, 0) / divisor;
      own.forEach((child: IWebChild, i: number): void => {
        const from: Patch.IJet = { value: web.S, first: scale(eta, along[i]!), second: scale(web.ea, curvature * along[i]! ** 2) };
        const to: Patch.IJet = Boundary.geometric(child.jet, norm(sub(child.q, web.S)));
        child.own = (u: number): Vec3 => Patch.curve(from, to, u);
      });
    }

    // Rows below the crest: as many as the deepest plain column needs at the
    // ring's spacing, and as each web's own column needs in steps of CELL radii.
    let below: number = 2;
    for (const c of children)
      for (const col of c.columns)
        if (col.kind === "plain")
          below = Math.max(below, Math.ceil((dot(sub(col.q, col.p), col.o) - col.rho) / spacing));
    for (const web of webs.values())
      for (const own of web.children.values())
        below = Math.max(below, Math.ceil(norm(sub(own.q, web.S)) / (CELL * rhoLeast)));
    const rows: number = crestRow + below;

    // The finite chart's boundary rows are -1 at the parent, zero at the
    // crests and +1 at the child, independently of either boundary's tilt.
    // The levels close on the crest as the square of the row, so the rows run
    // evenly in the chart's `w = sqrt(z)` along the separatrices, where even
    // levels would stretch the cells about the crest by the square root. Below
    // the crest's first rows they run on evenly in depth, or the last row
    // before a child's section would span a fifth of the web.
    const levelOf = (r: number): number =>
      r <= crestRow ? -((1 - r / crestRow) ** 2) : lower(r);
    const ramp: number = CREST_ROWS / (rows - crestRow);
    const lower = (r: number): number => {
      const t: number = (r - crestRow) / (rows - crestRow);
      return (Math.hypot(t, ramp) - ramp) / (Math.hypot(1, ramp) - ramp);
    };

    // Each child copies the same bounded lip with physical parent curvature.
    for (const web of webs.values()) {
      for (const [pinch, side] of [[web.first, -1], [web.second, 1]] as const) {
        const length: number = norm(sub(web.S, position(pinch)));
        const from: Patch.IJet = Boundary.geometric(parentJet(input.phase.get(pinch)!), length);
        const to: Patch.IJet = { value: web.S, first: scale(web.xi, -side * length), second: scale(web.ea, -2 * web.rho) };
        web.lip.set(side, (t: number): Vec3 => Patch.curve(from, to, t));
      }
    }
    const lip: (web: IWeb, side: number, parameter: number) => Vec3 = (web: IWeb, side: number, parameter: number): Vec3 => web.lip.get(side)!(parameter);

    // The two shared separatrices define a bounded saddle chart. Its finite
    // parent/child rows replace depth inversion, so neither curve is extended
    // beyond its own interval even when a child wall is parallel to depth.
    const chart = (col: Extract<IColumn, { kind: "plain" }>, own: IWebChild): ((r: number) => Vec3) => {
      const at = (x: number): Vec3 => {
        const coordinate: Domain.IPoint = Domain.point(x, col.y);
        return add(sub(own.own(coordinate.own), col.web.S), lip(col.web, col.side, 1 - coordinate.lip));
      };
      return (r: number): Vec3 => at(levelOf(r));
    };

    // A column away from the webs: the Hermite from the parent's surface to
    // the child's, its rows at the same depths as the chart's levels.
    const plainAt = (col: Extract<IColumn, { kind: "plain" }>): ((r: number) => Vec3) => {
      const L: number = norm(sub(col.q, col.p));
      const from: Patch.IJet = { value: col.p, first: scale(col.o, L), second: scale(col.parentJet.second, L * L / dot(col.parentJet.first, col.parentJet.first)) };
      const to: Patch.IJet = { value: col.q, first: scale(col.d, L), second: scale(col.childJet.second, L * L / dot(col.childJet.first, col.childJet.first)) };
      const curve = sampled((u: number): Vec3 => Patch.curve(from, to, u), col.o);
      const total: number = dot(sub(col.q, col.p), col.o);
      const crest: number = Math.min(col.rho, (total * crestRow) / rows);
      return (r: number): Vec3 =>
        curve(
          r <= crestRow
            ? crest * (1 - (1 - r / crestRow) ** 2)
            : crest + (total - crest) * lower(r),
        );
    };
    // Vertices: the lips and crest of every web, shared by its two children.
    const vertex = (p: Vec3, coordinates: [number, number, number] = [NaN, NaN, NaN]): number => {
      input.coordinates.push(...coordinates);
      return AutoMovieHumanLoftMesh.vertices(mesh, [p])[0]!;
    };
    const construction: IAutoMovieHumanConstructionPath[] = [];
    for (const web of webs.values()) {
      web.crest = vertex(web.S);
      // Copy the same lip vertices to both children; each lip owns its parent
      // station jet and the common saddle's tangent and curvature.
      for (const [pinch, P, toward] of [
        [web.first, web.A, -1],
        [web.second, web.B, 1],
      ] as const) {
        const ids: number[] = [pinch];
        const points: Vec3[] = [P];
        for (let r: number = 1; r < crestRow; r++) {
          const p: Vec3 = lip(web, toward, r / crestRow);
          points.push(p);
          ids.push(vertex(p));
        }
        ids.push(web.crest);
        points.push(web.S);
        web.lips.set(pinch, ids);
        construction.push({ id: `${input.parent.name}/web-${pinch}`, points, closed: false });
      }
    }

    // Each child's columns as vertices, its own web columns after its crests.
    const rings: Map<string, number[]> = new Map();
    for (const c of children) {
      const index: number = input.index(c.name);
      for (const web of webs.values()) {
        const own: IWebChild | undefined = web.children.get(c.name);
        if (own === undefined) continue;
        const ids: number[] = [web.crest];
        const points: Vec3[] = [web.S];
        for (let r: number = crestRow + 1; r <= rows; r++) {
          const p: Vec3 = r === rows ? own.q : own.own(Math.sqrt(levelOf(r)));
          points.push(p);
          ids.push(r === rows ? vertex(p, [index, c.station, own.phi]) : vertex(p));
        }
        own.rows = ids;
        construction.push({ id: `${c.name}/web-${web.crest}`, points, closed: false });
      }
      const lists: number[][] = c.columns.map((col: IColumn): number[] => {
        if (col.kind === "pinch") return [...col.web.lips.get(col.v)!, ...col.web.children.get(c.name)!.rows.slice(1)];
        const ids: number[] = [col.v];
        const own: IWebChild = col.web.children.get(c.name)!;
        const plain: (r: number) => Vec3 = plainAt(col);
        const near: (r: number) => Vec3 = chart(col, own);
        const w: number = 1 - smooth(Math.abs(col.y) / FADE);
        const reference: (r: number) => Vec3 = (r: number): Vec3 => {
          const a: Vec3 = plain(r);
          return w === 0 ? a : add(a, scale(sub(near(r), a), w));
        };
        const upperReference: (t: number) => Vec3 = (t: number): Vec3 => reference(t * crestRow);
        const lowerReference: (t: number) => Vec3 = (t: number): Vec3 => reference(crestRow + t * (rows - crestRow));
        const upperOriginal: [Patch.IJet, Patch.IJet] = [Boundary.jet(upperReference, 0), Boundary.jet(upperReference, 1)];
        const lowerOriginal: [Patch.IJet, Patch.IJet] = [Boundary.jet(lowerReference, 0), Boundary.jet(lowerReference, 1)];

        // Close the two remaining boundaries after mixing the reference
        // charts. The correction vanishes with two derivatives at the crest.
        const upper: (t: number) => Vec3 = Patch.constrain(upperReference, upperOriginal, [Boundary.geometric(col.parentJet, norm(sub(reference(crestRow), col.p))), upperOriginal[1]]);
        const endRun: number = norm(sub(col.q, reference(crestRow)));
        const z: number = Math.hypot(1, ramp) - ramp;
        const slope: number = 1 / (z * Math.hypot(1, ramp));
        const acceleration: number = ramp * ramp / (z * Math.hypot(1, ramp) ** 3);
        const endSpeed: number = 0.5 * slope;
        const endAcceleration: number = 0.5 * acceleration - 0.25 * slope * slope;
        const lowerCurve: (t: number) => Vec3 = Patch.constrain(lowerReference, lowerOriginal, [lowerOriginal[0], Boundary.geometric(col.childJet, endRun * endSpeed, endRun * endAcceleration)]);
        for (let r: number = 1; r < rows; r++) {
          const p: Vec3 = r <= crestRow ? upper(r / crestRow) : lowerCurve((r - crestRow) / (rows - crestRow));
          ids.push(vertex(p));
        }
        ids.push(vertex(col.q, [index, c.station, col.phi]));
        return ids;
      });

      // Cells between neighbouring columns; none between a web's two pinch
      // columns, which part above the crest and are one below it.
      AutoMovieHumanLoftMesh.group(mesh, `${c.name}/${down ? c.chain.layers.length - 2 : 0}`);
      const n: number = lists.length;
      for (let i: number = 0; i < n; i++) {
        const X: IColumn = c.columns[i]!;
        const Y: IColumn = c.columns[(i + 1) % n]!;
        if (X.kind === "pinch" && Y.kind === "pinch" && X.web === Y.web) continue;
        const x: number[] = lists[i]!;
        const y: number[] = lists[(i + 1) % n]!;
        for (let r: number = 0; r < rows; r++) {
          const tri = (a: number, b: number, d: number): void => {
            if (a === b || b === d || a === d) return;
            if (down) mesh.indices.push(a, b, d);
            else mesh.indices.push(a, d, b);
          };
          tri(x[r + 1]!, x[r]!, y[r + 1]!);
          tri(y[r + 1]!, x[r]!, y[r]!);
        }
      }

      // The child's end: the last row, each web's own column once.
      const ring: number[] = [];
      lists.forEach((ids: number[]): void => {
        const v: number = ids[rows]!;
        if (ring[ring.length - 1] !== v) ring.push(v);
      });
      if (ring.length > 1 && ring[0] === ring[ring.length - 1]) ring.pop();
      rings.set(c.name, ring);
    }
    return { rings, construction };
  }

}
