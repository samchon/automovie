import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A lofted chain read as a solid surface: `u` its station in mm, `v` its phase
 * in radians with period `2 pi`.
 *
 * The derivatives are the chain's exact ones (`AutoMovieLoftJet.at`, the
 * product rule over the quintic station factors and the periodic cubic
 * section), so a chain qualifies only when every layer carries its plane, the
 * plane's station derivatives and the coefficients' second derivatives
 * (`AutoMovieLoftJet.carries`). A chain without them has a curvature step
 * at every layer under the cubic station rule, and differences across a step
 * would throw the intersection's curvature and the blend's G2 edge, so such a
 * chain is refused (null) and its owner records the diagnostic.
 *
 * The outward side is read once: at the chain's middle station and phase 0
 * the sign of `S_u x S_v` against the direction from the section's centre to
 * the point. A chain that bounds a hole (`mirrored`, its sections clockwise)
 * keeps its body on the other side, so its sign is turned.
 *
 * @evidence contracts/common.md#principled-implementation A lofted chain becomes a solid surface with station as `u` and phase as `v`, its jets the chain's own and its outward sign read once on a regular point.
 * @evidence contracts/common.md#clear-and-simple-design Two functions: the framed twin of a chain and its surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Past the layers the surface continues by its end jet's Taylor expansion and its domain reports any point found there.
 * @evidence contracts/common.md#meaningful-documentation States the chart, the orientation rule, the domain and the extension past the ends.
 * @evidence contracts/performance.md#efficient-algorithms One chain jet evaluation per surface jet.
 * @evidence contracts/performance.md#reuse-equivalent-work A chain that already carries its jets is returned as it is by `framed`.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The surface keeps a reference to the chain and nothing else.
 */
export namespace AutoMovieSolidChain {
  /**
   * The chain's twin that carries jets, so a host built without them (the
   * trunk's and the neck's horizontal layers, an arm chain not made C2) reads
   * as a solid surface.
   *
   * Each unframed layer takes its own plane, the level plane at its height
   * (`AutoMovieLoftFrame.horizontal`), which is where the chain already
   * draws it. A chain whose layers all carry their coefficients' curvatures
   * and are all unframed keeps every coefficient jet, and its planes take
   * their exact station derivatives (the origin rising 1 mm per mm, the axes
   * fixed), so the twin is the same surface. Otherwise every coefficient and
   * plane is made C2 by its natural spline through the layers
   * (`AutoMovieSeamStation.continuous`): the principal sections stay,
   * and between layers the twin is the C2 surface through them.
   *
   * @param chain The chain; never modified.
   * @returns The twin, which {@link surface} accepts.
   */
  export function framed(chain: IAutoMovieLoftChain): IAutoMovieLoftChain {
    if (AutoMovieLoftJet.carries(chain)) return chain;
    const exact: boolean = chain.layers.every((l: IAutoMovieLoftChain.ILayer): boolean => l.frame === undefined && l.curvatures !== undefined);
    if (exact)
      return {
        ...chain,
        layers: chain.layers.map(
          (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
            ...l,
            frame: AutoMovieLoftFrame.horizontal(l.y),
            frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
            frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
          }),
        ),
      };
    return AutoMovieSeamStation.continuous({
      ...chain,
      layers: chain.layers.map(
        (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
          ...l,
          frame: l.frame ?? AutoMovieLoftFrame.horizontal(l.y),
        }),
      ),
    });
  }

  /**
   * The chain as a solid surface, or null when it does not carry jets or its
   * middle section is degenerate (its point at its centre).
   *
   * @param chain The chain; never modified, and the surface keeps reading it.
   * @returns The surface.
   */
  export function surface(chain: IAutoMovieLoftChain): IAutoMovieSolidSurface | null {
    if (!AutoMovieLoftJet.carries(chain)) return null;

    // The outward sign at one regular point; a smooth closed tube keeps it
    // everywhere, since its normal never passes through zero.
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const middle: number = (first + last) / 2;
    const j: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, middle, 0);
    const out: AutoMovieSolidVector.Vec3 = AutoMovieSolidVector.sub(j.p, AutoMovieLoftChain.axis(chain, middle));
    const facing: number = AutoMovieSolidVector.dot(AutoMovieSolidVector.cross(j.s, j.t), out);
    if (!(Math.abs(facing) > 0)) return null;
    const sign: 1 | -1 = (facing > 0) !== (chain.mirrored === true) ? 1 : -1;

    return {
      name: chain.name,
      period: 2 * Math.PI,
      domain: [first, last],
      orientation: sign,
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
        // Past an end layer the surface continues by its end jet's Taylor
        // expansion in station, so a solve that steps past the layers walks
        // back on a smooth surface instead of failing; the domain (`beyond`)
        // reports any point that ends there.
        const at: number = Math.min(last, Math.max(first, u));
        const d: number = u - at;
        const q: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, at, v);
        if (d === 0) return { p: q.p, u: q.s, v: q.t, uu: q.ss, uv: q.st, vv: q.tt };
        const step = (a: number[], b: number[], k: number): AutoMovieSolidVector.Vec3 => [a[0]! + k * b[0]!, a[1]! + k * b[1]!, a[2]! + k * b[2]!];
        return {
          p: step(step(q.p, q.s, d), q.ss, (d * d) / 2),
          u: step(q.s, q.ss, d),
          v: step(q.t, q.st, d),
          uu: q.ss,
          uv: q.st,
          vv: q.tt,
        };
      },
    };
  }
}
