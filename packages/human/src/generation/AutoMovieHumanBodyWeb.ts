import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/**
 * The skin between a parent's ring and children that start apart from it: the
 * webs of a hand.
 *
 * A child that inherits its parent's arcs keeps their corners in its own
 * sections for as long as it takes to round them, and two children that part at
 * a pair of pinches meet across a chord that leaves the parent's surface at a
 * right angle. Here each child starts from its own section past its webs, round
 * from its first ring, and the skin from the parent's ring to those sections is
 * built here as one surface with a saddle at every web.
 *
 * The surface is meshed in rows and columns. A row is a level of depth on the
 * way from the parent's ring (row 0) to the children's sections (the last row);
 * a column runs down that way from one vertex of the parent's ring to its
 * child's section, the steepest line of the rows. Each child owns the columns
 * of its arcs, and they arrive on its section in proportion to their length
 * along the arc. At a web the two pinches' columns are the web's margin: a
 * quarter round from each pinch, leaving it along the parent's own surface, to
 * the web's crest S, which stands half the pinches' chord past their middle, so
 * the margin is round across the hand. Above the crest's row the two children
 * are one sheet, the parent continued, and the pinches' columns are its lips;
 * from S each child's own column runs down to the point of its section that is
 * level with the crest across the margin, leaving S across the web. Those four
 * separatrices cross at S, eight cells meet there, and the skin about S is the
 * saddle `x^2 - y^2`.
 *
 * Near a web a column's level and its distance along the ring from the pinch
 * are the chart `z = x + i y` of the saddle at S: x the level from the crest's
 * row in margin radii, y the distance over the margin's radius. The branch
 * point is `w = u + i v = sqrt(z)`. A column there is the translational surface
 * of the web's separatrices, `F(u, v) = D(u) + lip(v) - S`, which near S is the
 * saddle `S + alpha u E_eta + beta v E_xi + rho (u^2 - v^2) E_a` and on the
 * chart's axes the separatrices themselves, so the columns about a pinch stay
 * ordered however close they run; its ends are moved onto its own ring vertex
 * and arrival in proportion to the level. Away from the web a column is the
 * Hermite from the parent's surface to the child's, leaving the ring along the
 * parent's station derivative and arriving along the child's, and the two blend
 * over {@link FADE} margin radii.
 *
 * The mesh is even in w, not z, about every crest: the rows' levels close on
 * the crest as the square of the row, and the parent's ring takes phases about
 * each pinch at distances growing as the square of their count
 * (`AutoMovieHumanBodySurface`), so the cells about S are as small as the
 * margin's radius needs. Even in z they stretched there by the square root, to
 * edges of 4 mm across a 2.5 mm saddle.
 */
export namespace AutoMovieHumanBodyWeb {
  /** One child's share of the parent's ring. */
  export interface IShare {
    /** Child chain name. */
    name: string;

    /** Its arcs as parent ring vertices, inclusive, in ring order. */
    arcs: number[][];
  }

  /** What a web needs from the surface being built. */
  export interface IInput {
    /** Skin buffers. */
    mesh: AutoMovieHumanLoftMesh.IContext;

    /** Loft coordinates of every vertex, grown with each new vertex. */
    coordinates: number[];

    /** Chain by name. */
    chain: (name: string) => IAutoMovieHumanLoftChain;

    /** Calibration index of a chain. */
    index: (name: string) => number;

    /** Parent chain. */
    parent: IAutoMovieHumanLoftChain;

    /** Whether the children lie below the parent's bottom ring. */
    down: boolean;

    /** Parent phase of each vertex of its ring. */
    phase: Map<number, number>;

    /** Every child's share. */
    shares: IShare[];
  }

  /** A built web. */
  export interface IResult {
    /** Each child's adjacent end: the vertices of its section, in ring order. */
    rings: Map<string, number[]>;

    /** The webs' separatrices, the lips and each child's own column, as the surface sampled them. */
    construction: IAutoMovieHumanConstructionPath[];
  }

  /** Build the skin from the parent's ring to its children's sections. */
  export function build(input: IInput): IResult {
    const { mesh, parent, down } = input;
    const position = (v: number): Vec3 => AutoMovieHumanLoftMesh.position(mesh, v);
    const sp: number = down ? parent.layers[0]!.y : parent.layers[parent.layers.length - 1]!.y;
    const onParent: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(parent, sp);
    const inParent: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(parent, sp + (down ? H : -H));
    const outward = (t: number): Vec3 => unit(sub(onParent(t), inParent(t)));

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
      const inChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(child, sc + (down ? -H : H));
      const into = (t: number): Vec3 => unit(sub(inChild(t), onChild(t)));
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
        const xi: Vec3 = unit(sub(web.xi, scale(eta, dot(web.xi, eta))));
        // The saddle's own column is its parabola `S + g u E_eta + depth u^2
        // E_a` in the chart's u, leaving the crest across the web as far as the
        // child's wall stands from it and arriving along the child, no faster
        // than its chord since that need not be the chart's own direction.
        const lateral: number = Math.max(0, dot(run, eta));
        const depth: number = Math.max(0.25 * web.rho, dot(run, web.ea));
        const d: Vec3 = into(phi);
        const arrive: number = Math.min(
          norm(add(scale(eta, lateral), scale(web.ea, 2 * depth))),
          norm(run),
        );
        web.children.set(share.name, {
          phi,
          q,
          d,
          eta,
          xi,
          depth,
          own: sampled(
            (u: number): Vec3 => hermite(web.S, scale(eta, lateral), q, scale(d, arrive), u),
            web.ea,
          ),
          rows: [],
        });
      }
      return { name: share.name, chain: child, station: sc, columns };
    });

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

    // A row's level in the chart: -1 at the ring, 0 at the crests, and a
    // child's own column's depth over the margin's radius at its section.
    // The levels close on the crest as the square of the row, so the rows run
    // evenly in the chart's `w = sqrt(z)` along the separatrices, where even
    // levels would stretch the cells about the crest by the square root. Below
    // the crest's first rows they run on evenly in depth, or the last row
    // before a child's section would span a fifth of the web.
    const levelOf = (r: number, own: IWebChild, web: IWeb): number =>
      r <= crestRow ? -((1 - r / crestRow) ** 2) : (own.depth / web.rho) * lower(r);
    const ramp: number = CREST_ROWS / (rows - crestRow);
    const lower = (r: number): number => {
      const t: number = (r - crestRow) / (rows - crestRow);
      return (Math.hypot(t, ramp) - ramp) / (Math.hypot(1, ramp) - ramp);
    };

    // A margin's lip at a depth past the ring, as a share of its radius; past
    // the pinch above the ring for a share below zero.
    const lip = (web: IWeb, side: number, share: number): Vec3 => {
      const theta: number = Math.asin(Math.min(1, Math.max(-1, share)));
      return add(
        scale(add(web.A, web.B), 0.5),
        add(scale(web.xi, side * web.rho * Math.cos(theta)), scale(web.ea, web.rho * Math.sin(theta))),
      );
    };

    // A column near a web: the translational surface of the web's two
    // separatrices met at its crest, `F(u, v) = D(u) + lip(v) - S`, at
    // `w = u + i v = sqrt(x + i y)`. Near the crest that is the saddle
    // `S + alpha u E_eta + beta v E_xi + rho (u^2 - v^2) E_a`, and on its axes
    // it is the separatrices themselves; its ends are moved onto the column's
    // own ring vertex and arrival in proportion to the level.
    const chart = (col: Extract<IColumn, { kind: "plain" }>, own: IWebChild, r: number): Vec3 => {
      const at = (x: number): Vec3 => {
        const h: number = Math.hypot(x, col.y);
        const u: number = Math.sqrt(Math.max(0, (h + x) / 2));
        const v: number = Math.sign(col.side) * Math.sqrt(Math.max(0, (h - x) / 2));
        return add(sub(own.own(col.web.rho * u * u), col.web.S), lip(col.web, Math.sign(v) || col.side, 1 - v * v));
      };
      const top: number = levelOf(0, own, col.web);
      const bottom: number = levelOf(rows, own, col.web);
      const x: number = levelOf(r, own, col.web);
      const f: number = (x - top) / (bottom - top);
      return add(
        at(x),
        add(scale(sub(col.p, at(top)), 1 - f), scale(sub(col.q, at(bottom)), f)),
      );
    };

    // A column away from the webs: the Hermite from the parent's surface to
    // the child's, its rows at the same depths as the chart's levels.
    const plainAt = (col: Extract<IColumn, { kind: "plain" }>): ((r: number) => Vec3) => {
      const L: number = norm(sub(col.q, col.p));
      const curve = sampled((u: number): Vec3 => hermite(col.p, scale(col.o, L), col.q, scale(col.d, L), u), col.o);
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
      // A lip is the margin's quarter round, its rows at even depths, so they
      // close on the crest as the chart's square root.
      for (const [pinch, P, toward] of [
        [web.first, web.A, -1],
        [web.second, web.B, 1],
      ] as const) {
        const ids: number[] = [pinch];
        const points: Vec3[] = [P];
        for (let r: number = 1; r < crestRow; r++) {
          const p: Vec3 = lip(web, toward, 1 - (1 - r / crestRow) ** 2);
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
          const p: Vec3 = r === rows ? own.q : own.own(web.rho * levelOf(r, own, web));
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
        const w: number = 1 - smooth(Math.abs(col.y) / FADE);
        for (let r: number = 1; r < rows; r++) {
          const a: Vec3 = plain(r);
          const p: Vec3 = w === 0 ? a : add(a, scale(sub(chart(col, own, r), a), w));
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

  /** A web between two children. */
  interface IWeb {
    /** Its pinches, lower vertex first. */
    first: number;
    second: number;
    A: Vec3;
    B: Vec3;

    /** Unit from the first pinch to the second. */
    xi: Vec3;

    /** Unit along the parent's surface past the pinches, square to xi. */
    ea: Vec3;

    /** Radius of the round margin, half the pinches' chord. */
    rho: number;

    /** The crest. */
    S: Vec3;

    /** Each pinch's lip vertices from the pinch to the crest. */
    lips: Map<number, number[]>;

    /** The crest's vertex. */
    crest: number;

    /** Each child's own column. */
    children: Map<string, IWebChild>;
  }

  /** A web's column down one child. */
  interface IWebChild {
    /** Phase where it meets the child's section. */
    phi: number;
    q: Vec3;
    d: Vec3;

    /** Unit from the crest toward the child, across the web, along its own column. */
    eta: Vec3;

    /** Unit along the margin from the first pinch toward the second, square to `eta`. */
    xi: Vec3;

    /** Depth of its arrival past the crest. */
    depth: number;

    /** Its point at a depth past the crest. */
    own: (depth: number) => Vec3;

    /** Its vertices from the crest to the section. */
    rows: number[];
  }

  /** A column down a child. */
  type IColumn =
    | { kind: "pinch"; v: number; web: IWeb }
    | {
        kind: "plain";
        v: number;
        p: Vec3;
        o: Vec3;
        q: Vec3;
        d: Vec3;
        phi: number;
        web: IWeb;
        side: number;
        y: number;
        rho: number;
      };

  /** A child and its columns. */
  interface IChild {
    name: string;
    chain: IAutoMovieHumanLoftChain;
    station: number;
    columns: IColumn[];
  }
}

type Vec3 = [number, number, number];

/**
 * A curve read by its depth along a direction from its start: the point where
 * it first reaches a depth, so a web's rows are level sets of that depth. A
 * curve that leaves its start across the direction (a saddle's own column)
 * reaches its first depths at their square root. Past its ends it runs on
 * along its end tangents.
 */
function sampled(curve: (u: number) => Vec3, direction: Vec3): (depth: number) => Vec3 {
  const samples: Vec3[] = Array.from({ length: LEVEL_SAMPLES + 1 }, (_: unknown, i: number): Vec3 => curve(i / LEVEL_SAMPLES));
  const start: Vec3 = samples[0]!;
  const depth: number[] = samples.map((p: Vec3): number => dot(sub(p, start), direction));
  // Depth never falls back along a column: hold its running maximum.
  for (let i: number = 1; i <= LEVEL_SAMPLES; i++) depth[i] = Math.max(depth[i]!, depth[i - 1]!);
  const end: number = depth[LEVEL_SAMPLES]!;
  const along = (i: number, j: number): Vec3 => unit(sub(samples[j]!, samples[i]!));
  return (goal: number): Vec3 => {
    if (goal <= 0) return start;
    if (goal >= end) {
      const t: Vec3 = along(LEVEL_SAMPLES - 1, LEVEL_SAMPLES);
      return add(samples[LEVEL_SAMPLES]!, scale(t, (goal - end) / Math.max(0.2, dot(t, direction))));
    }
    let lo: number = 0;
    let hi: number = LEVEL_SAMPLES;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (depth[mid]! < goal) lo = mid;
      else hi = mid;
    }
    const f: number = (goal - depth[lo]!) / ((depth[hi]! - depth[lo]!) || 1);
    return add(samples[lo]!, scale(sub(samples[hi]!, samples[lo]!), f));
  };
}

/** Cubic Hermite from a to b with end tangents ta, tb, at u in [0, 1]. */
function hermite(a: Vec3, ta: Vec3, b: Vec3, tb: Vec3, u: number): Vec3 {
  const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10: number = u ** 3 - 2 * u ** 2 + u;
  const h01: number = -2 * u ** 3 + 3 * u ** 2;
  const h11: number = u ** 3 - u ** 2;
  return [0, 1, 2].map(
    (k: number): number => h00 * a[k]! + h10 * ta[k]! + h01 * b[k]! + h11 * tb[k]!,
  ) as Vec3;
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function unit(a: Vec3): Vec3 {
  return scale(a, 1 / (norm(a) || 1));
}

/** Smoothstep on [0, 1], clamped. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** An angle brought into (-pi, pi]. */
function wrapPi(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** Station step of a surface derivative, mm. */
const H: number = 0.05;

/** Phases of a child's section read for its angles. */
const TABLE: number = 2048;

/** Margin radii from a pinch over which a column leaves the saddle's chart. */
const FADE: number = 3;

/**
 * A cell's side about a crest in margin radii: the dihedral across it is about
 * as many radians at the saddle's own radius.
 */
const CELL: number = 0.35;

/** Rows below a crest over which its levels close as the square of the row. */
const CREST_ROWS: number = 2;

/** Samples of a column read for its levels. */
const LEVEL_SAMPLES: number = 256;
