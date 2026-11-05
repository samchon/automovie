import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebCrests } from "./IAutoMovieHumanWebCrests";
import type { IAutoMovieHumanWebInput } from "./IAutoMovieHumanWebInput";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import { AutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanWebCurve } from "./AutoMovieHumanWebCurve";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus: add, scale, dot, norm, unit }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { leaving, H }: typeof AutoMovieHumanWebCurve = AutoMovieHumanWebCurve;

/**
 * The first stage of a web's build: every web the parent's ring parts at. A
 * web is the saddle where two children part at a pair of pinches (the ring
 * vertices where their arcs meet); its crest stands half the pinches' chord
 * past their middle along the parent's own surface, so the margin is round
 * across the hand. The stage also reads the parent's surface at its end ring:
 * its outward direction and its station jet, which every later stage copies.
 */
export namespace AutoMovieHumanWebCrest {
  /** Find the webs of a parent's ring and read the parent's surface at its end ring.
   *
   * @param input What the web needs from the surface being built. */
  export function of(input: IAutoMovieHumanWebInput): IAutoMovieHumanWebCrests {
    const { mesh, parent, down } = input;
    const position = (v: number): Vec3 => AutoMovieHumanLoftMesh.position(mesh, v);
    const sp: number = down ? parent.layers[0]!.y : parent.layers[parent.layers.length - 1]!.y;
    const onParent: (t: number) => Vec3 = AutoMovieLoftChain.sampler(parent, sp);
    const inParent: (t: number) => Vec3 = AutoMovieLoftChain.sampler(parent, sp + (down ? H : -H));
    const outward = (t: number): Vec3 => unit(sub(onParent(t), inParent(t)));
    // The parent's station curve at a phase, leaving its ring outward: its
    // first and second derivatives by the one-sided three-point rule, the jet
    // a column copies so it leaves the parent G2 (`AutoMovieHumanSeam`, J1).
    const deepParent: (t: number) => Vec3 = AutoMovieLoftChain.sampler(parent, sp + (down ? 2 * H : -2 * H));
    const parentJet = (t: number): IAutoMovieHumanSeam.IArcJet => leaving(onParent(t), inParent(t), deepParent(t), -1);

    // The webs: every pair of pinches two children part at.
    const webs: Map<string, IAutoMovieHumanWeb> = new Map();
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
    const webOf = (a: number, b: number): IAutoMovieHumanWeb => webs.get(key(a, b))!;

    return { webs, webOf, position, outward, parentJet };
  }
}
