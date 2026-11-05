import type { AutoMovieLoftFrame, IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanHandSide } from "../hand/AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanArmLaw } from "./IAutoMovieHumanArmLaw";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { dot, mean, norm, scale, sub, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * The arm's chain `arm.<side>` from its law: one layer per parameter of the
 * law, each the ring its plane cuts at the chain's uniform phases, in a frame
 * whose in-plane axis is carried down from the level shoulder ring by the
 * least rotation between neighbouring planes (`AutoMovieHumanLimbFrame.carry`),
 * so the frames turn only as the bones bend. Station slopes are the planes'
 * own, read a twentieth of a millimetre either side. The right side is the
 * left's mirror, its phase reversed.
 */
export namespace AutoMovieHumanArmLayers {
  /** Parameter step of the carried frame. */
  const CARRY: number = 0.5;

  /** Parameter step of a layer's slopes. */
  const SLOPE_STEP: number = 0.05;

  /**
   * The chain of a side.
   *
   * @param law The arm's sections in the left frame.
   * @param side Side.
   * @param sign 1 for the left, -1 for the right.
   * @returns The chain.
   */
  export function of(law: IAutoMovieHumanArmLaw, side: "left" | "right", sign: 1 | -1): IAutoMovieLoftChain {
    const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
    const order: number = prior.order;
    const phases: number[] = Array.from({ length: order }, (_: unknown, m: number): number => (TWO_PI * m) / order);
    const ring = (q: number): Vec3[] => phases.map((t: number): Vec3 => law.point(q, t));

    // The in-plane axis carried down from the level shoulder ring.
    const layers: number[] = law.layers;
    const top: number = layers[layers.length - 1]!;
    const bottom: number = layers[0]!;
    const grid: { q: number; n: Vec3; u: Vec3 }[] = [{ q: top, n: law.normal(top), u: [1, 0, 0] }];
    for (let q: number = top - CARRY; q > bottom - 2 * CARRY; q -= CARRY) {
      const last: { q: number; n: Vec3; u: Vec3 } = grid[grid.length - 1]!;
      const n: Vec3 = law.normal(q);
      grid.push({ q, n, u: AutoMovieHumanLimbFrame.carry(last.u, last.n, n) });
    }
    const axisAt = (q: number): Vec3 => {
      const i: number = Math.min(grid.length - 1, Math.max(0, Math.floor((top - q) / CARRY)));
      const g: { q: number; n: Vec3; u: Vec3 } = grid[i]!;
      return AutoMovieHumanLimbFrame.carry(g.u, g.n, law.normal(q));
    };

    // A section in its own frame, its origin the centre of its ring.
    const sample = (q: number): { ring: Vec3[]; frame: AutoMovieLoftFrame.IFrame } => {
      const points: Vec3[] = ring(q);
      const n: Vec3 = law.normal(q);
      const c: Vec3 = [mean(points, 0), mean(points, 1), mean(points, 2)];
      const o: Vec3 = sub(c, scale(n, dot(sub(c, law.anchor(q)), n)));
      return { ring: points, frame: AutoMovieHumanLimbFrame.frame(o, n, axisAt(q)) };
    };
    const samples: { ring: Vec3[]; frame: AutoMovieLoftFrame.IFrame }[] = layers.map(sample);
    const stations: number[] = [0];
    for (let k: number = 1; k < samples.length; k++) stations.push(stations[k - 1]! + norm(sub(samples[k]!.frame.origin, samples[k - 1]!.frame.origin)));

    const made: IAutoMovieLoftChain.ILayer[] = layers.map((q: number, k: number): IAutoMovieLoftChain.ILayer => {
      const own: { ring: Vec3[]; frame: AutoMovieLoftFrame.IFrame } = samples[k]!;
      const at = (dq: number): AutoMovieHumanLimbFrame.ISample => {
        const s: { ring: Vec3[]; frame: AutoMovieLoftFrame.IFrame } = sample(q + dq);
        const step: number = norm(sub(s.frame.origin, own.frame.origin));
        return {
          station: stations[k]! + Math.sign(dq) * step,
          frame: AutoMovieHumanHandSide.sidedFrame(s.frame, sign),
          ring: AutoMovieHumanHandSide.reflect(s.ring, sign),
        };
      };
      return AutoMovieHumanLimbFrame.layer(
        { station: stations[k]!, frame: AutoMovieHumanHandSide.sidedFrame(own.frame, sign), ring: AutoMovieHumanHandSide.reflect(own.ring, sign) },
        at(-SLOPE_STEP),
        at(SLOPE_STEP),
        order,
      );
    });

    return { name: `arm.${side}`, basis: "spline", order, samples: prior.samples, rule: prior.rule, layers: made };
  }
}
