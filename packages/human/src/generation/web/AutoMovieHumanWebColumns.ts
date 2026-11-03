import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebBranch } from "./IAutoMovieHumanWebBranch";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";
import type { IAutoMovieHumanWebColumns } from "./IAutoMovieHumanWebColumns";
import type { IAutoMovieHumanWebCrests } from "./IAutoMovieHumanWebCrests";
import type { IAutoMovieHumanWebInput } from "./IAutoMovieHumanWebInput";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanSeam } from "../../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanWebCurve } from "./AutoMovieHumanWebCurve";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus: add, scale, dot, norm, unit, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sampled, leaving, H }: typeof AutoMovieHumanWebCurve = AutoMovieHumanWebCurve;

/** A column away from the pinches. */
type Plain = Extract<IAutoMovieHumanWebColumn, { kind: "plain" }>;

/**
 * The second stage of a web's build: every child's columns, and how many rows
 * they are drawn in. A column runs from one vertex of the parent's ring to its
 * child's section; each child owns the columns of its arcs and they arrive on
 * its section in proportion to their length along the arc, and each web's two
 * pinch columns are its margin. The rows follow the ring's spacing, the
 * margin's radius and the deepest column.
 */
export namespace AutoMovieHumanWebColumns {
  /** Phases of a child's section read for its angles. */
  const TABLE: number = 2048;

  /**
   * A cell's side about a crest in margin radii: the dihedral across it is about
   * as many radians at the saddle's own radius.
   */
  const CELL: number = 0.35;

  /** An angle brought into (-pi, pi]. */
  function wrapPi(a: number): number {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  /** Draw every child's columns and count the rows.
   *
   * @param input What the web needs from the surface being built.
   * @param crests The first stage's webs and the parent's end ring. */
  export function of(input: IAutoMovieHumanWebInput, crests: IAutoMovieHumanWebCrests): IAutoMovieHumanWebColumns {
    const { down } = input;
    const { webs, webOf, position, outward, parentJet } = crests;

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
    const rhoLeast: number = Math.min(...[...webs.values()].map((w: IAutoMovieHumanWeb): number => w.rho));
    const crestRow: number = Math.max(3, Math.ceil(Math.PI / 2 / CELL));

    // Every child's columns, before the rows are counted.
    const children: IAutoMovieHumanWebBranch[] = input.shares.map((share: IAutoMovieHumanWebInput.IShare): IAutoMovieHumanWebBranch => {
      const child: IAutoMovieHumanLoftChain = input.chain(share.name);
      const sc: number = down ? child.layers[child.layers.length - 1]!.y : child.layers[0]!.y;
      const onChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(child, sc);
      const inChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(child, sc + (down ? -H : H));
      const into = (t: number): Vec3 => unit(sub(inChild(t), onChild(t)));
      // The child's station curve at a phase, entering it from its end ring.
      const deepChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(child, sc + (down ? -2 * H : 2 * H));
      const childJet = (t: number): IAutoMovieHumanSeam.IArcJet => leaving(onChild(t), inChild(t), deepChild(t), 1);
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
      const sequence: { v: number | null; web: IAutoMovieHumanWeb | null }[] = [];
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
        const web: IAutoMovieHumanWeb = sequence[a]!.web!;
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

      const besides: Map<IAutoMovieHumanWeb, IAutoMovieHumanWebChild.IBeside[]> = new Map();
      const columns: IAutoMovieHumanWebColumn[] = [];
      let at: number = 0;
      share.arcs.forEach((arc: number[], k: number): void => {
        const start: number = at;
        const end: number = at + arc.length - 1;
        const before: IAutoMovieHumanWeb = webOf(
          share.arcs[(k + share.arcs.length - 1) % share.arcs.length]![
            share.arcs[(k + share.arcs.length - 1) % share.arcs.length]!.length - 1
          ]!,
          arc[0]!,
        );
        const after: IAutoMovieHumanWeb = webOf(arc[arc.length - 1]!, share.arcs[(k + 1) % share.arcs.length]![0]!);
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

        // The plain column at any length along the arc, the vertices'
        // columns its samples: the parent's phase between the two vertices
        // that bracket the length, the arrival at the same share of the
        // crests' angles, so a web's skin reads as one continuous surface.
        const law = (s: number): Plain => {
          const i: number = Math.min(arc.length - 2, Math.max(0, lengths.findIndex((l: number): boolean => l >= s) - 1));
          const t0: number = input.phase.get(arc[i]!)!;
          const f: number = (s - lengths[i]!) / ((lengths[i + 1]! - lengths[i]!) || 1);
          const tau: number = t0 + f * wrapPi(input.phase.get(arc[i + 1]!)! - t0);
          const phi: number = phaseOf(crestBefore + (s / total) * (crestAfter - crestBefore));
          const fromBefore: boolean = s <= total - s;
          const web: IAutoMovieHumanWeb = fromBefore ? before : after;
          const pinch: number = fromBefore ? arc[0]! : arc[arc.length - 1]!;
          const jet: IAutoMovieHumanSeam.IArcJet = parentJet(tau);

          return {
            kind: "plain",
            v: -1,
            p: [jet.point[0]!, jet.point[1]!, jet.point[2]!],
            o: outward(tau),
            q: onChild(phi),
            d: into(phi),
            from: jet,
            to: childJet(phi),
            phi,
            web,
            side: pinch === web.first ? -1 : 1,
            y: (fromBefore ? s : total - s) / web.rho,
            rho: before.rho + (s / total) * (after.rho - before.rho),
          };
        };

        // The law beside each of the arc's two webs, read from that web's
        // pinch, serving half the arc.
        const ends: [IAutoMovieHumanWeb, number, boolean][] = [
          [before, arc[0]!, true],
          [after, arc[arc.length - 1]!, false],
        ];
        for (const end of ends) {
          const web: IAutoMovieHumanWeb = end[0];
          const fromStart: boolean = end[2];
          const list: IAutoMovieHumanWebChild.IBeside[] = besides.get(web) ?? [];
          list.push({
            side: end[1] === web.first ? -1 : 1,
            law: (y: number): Plain => law(fromStart ? y * web.rho : total - y * web.rho),
            reach: total / 2 / web.rho,
          });
          besides.set(web, list);
        }
        arc.forEach((v: number, i: number): void => {
          if (i === 0 || i === arc.length - 1) {
            columns.push({ kind: "pinch", v, web: i === 0 ? before : after });
            return;
          }
          const theta: number = crestBefore + (lengths[i]! / total) * (crestAfter - crestBefore);
          const phi: number = phaseOf(theta);
          const tau: number = input.phase.get(v)!;
          const fromBefore: boolean = lengths[i]! <= total - lengths[i]!;
          const web: IAutoMovieHumanWeb = fromBefore ? before : after;
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
            from: parentJet(tau),
            to: childJet(phi),
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
        const web: IAutoMovieHumanWeb = e.web;
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
          beside: besides.get(web) ?? [],
          own: sampled(
            (u: number): Vec3 => AutoMovieHumanSeam.hermite(web.S, scale(eta, lateral), q, scale(d, arrive), u) as Vec3,
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

    return { children, rows, crestRow };
  }
}
