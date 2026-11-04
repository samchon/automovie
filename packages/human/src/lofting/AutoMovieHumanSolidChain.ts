import { AutoMovieHumanLoftChain } from "./AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import { AutoMovieHumanLoftJet } from "./AutoMovieHumanLoftJet";
import { AutoMovieHumanSeamStation } from "./AutoMovieHumanSeamStation";
import { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";

/**
 * A lofted chain read as a solid surface: `u` its station in mm, `v` its phase
 * in radians with period `2 pi`.
 *
 * The derivatives are the chain's exact ones (`AutoMovieHumanLoftJet.at`, the
 * product rule over the quintic station factors and the periodic cubic
 * section), so a chain qualifies only when every layer carries its plane, the
 * plane's station derivatives and the coefficients' second derivatives
 * (`AutoMovieHumanLoftJet.carries`). A chain without them has a curvature step
 * at every layer under the cubic station rule, and differences across a step
 * would throw the intersection's curvature and the blend's G2 edge, so such a
 * chain is refused (null) and its owner records the diagnostic.
 *
 * The outward side is read once: at the chain's middle station and phase 0
 * the sign of `S_u x S_v` against the direction from the section's centre to
 * the point. A chain that bounds a hole (`mirrored`, its sections clockwise)
 * keeps its body on the other side, so its sign is turned.
 */
export namespace AutoMovieHumanSolidChain {
  /**
   * The chain's twin that carries jets, so a host built without them (the
   * trunk's and the neck's horizontal layers, an arm chain not made C2) reads
   * as a solid surface.
   *
   * Each unframed layer takes its own plane, the level plane at its height
   * (`AutoMovieHumanLoftFrame.horizontal`), which is where the chain already
   * draws it. A chain whose layers all carry their coefficients' curvatures
   * and are all unframed keeps every coefficient jet, and its planes take
   * their exact station derivatives (the origin rising 1 mm per mm, the axes
   * fixed), so the twin is the same surface. Otherwise every coefficient and
   * plane is made C2 by its natural spline through the layers
   * (`AutoMovieHumanSeamStation.continuous`): the principal sections stay,
   * and between layers the twin is the C2 surface through them.
   *
   * @param chain The chain; never modified.
   * @returns The twin, which {@link surface} accepts.
   */
  export function framed(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain {
    if (AutoMovieHumanLoftJet.carries(chain)) return chain;
    const exact: boolean = chain.layers.every((l: IAutoMovieHumanLoftChain.ILayer): boolean => l.frame === undefined && l.curvatures !== undefined);
    if (exact)
      return {
        ...chain,
        layers: chain.layers.map(
          (l: IAutoMovieHumanLoftChain.ILayer): IAutoMovieHumanLoftChain.ILayer => ({
            ...l,
            frame: AutoMovieHumanLoftFrame.horizontal(l.y),
            frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
            frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
          }),
        ),
      };
    return AutoMovieHumanSeamStation.continuous({
      ...chain,
      layers: chain.layers.map(
        (l: IAutoMovieHumanLoftChain.ILayer): IAutoMovieHumanLoftChain.ILayer => ({
          ...l,
          frame: l.frame ?? AutoMovieHumanLoftFrame.horizontal(l.y),
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
  export function surface(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanSolidSurface | null {
    if (!AutoMovieHumanLoftJet.carries(chain)) return null;

    // The outward sign at one regular point; a smooth closed tube keeps it
    // everywhere, since its normal never passes through zero.
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const middle: number = (first + last) / 2;
    const j: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.at(chain, middle, 0);
    const out: AutoMovieHumanSolidVector.Vec3 = AutoMovieHumanSolidVector.sub(j.p, AutoMovieHumanLoftChain.axis(chain, middle));
    const facing: number = AutoMovieHumanSolidVector.dot(AutoMovieHumanSolidVector.cross(j.s, j.t), out);
    if (!(Math.abs(facing) > 0)) return null;
    const sign: 1 | -1 = (facing > 0) !== (chain.mirrored === true) ? 1 : -1;

    return {
      name: chain.name,
      period: 2 * Math.PI,
      orientation: sign,
      jet: (u: number, v: number): IAutoMovieHumanSolidSurface.IJet => {
        const q: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.at(chain, u, v);
        return { p: q.p, u: q.s, v: q.t, uu: q.ss, uv: q.st, vv: q.tt };
      },
    };
  }
}
