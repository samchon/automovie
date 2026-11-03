import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanDigitStations } from "./AutoMovieHumanDigitStations";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, norm, unit }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sidedFrame, reflect }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * A digit's chain: its sections square to its line and their frames carried
 * along it from the root, from the tip up.
 */
export namespace AutoMovieHumanHandDigitChain {
  /** Station step of a digit's carried frame, mm of the form. */
  const DIGIT_CARRY: number = 0.25;

  /** Parameter step of a layer's slopes. */
  const SLOPE_STEP: number = 0.05;

  /** Step of a tube's tangent, mm. */
  const STEP: number = 0.2;

  /**
   * A digit's chain, its sections square to its line and their frames
   * carried along it from the root, from the tip up.
   */
  export function fingerOf(
    d: IAutoMovieHumanHandDigit,
    index: number,
    f: IAutoMovieHumanHandFinger,
    side: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieHumanLoftChain {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const source: AutoMovieHumanArmPrior.IDigit = prior.digits[index]!;
    const at = (s: number): Vec3 => f.line.at(s);
    const normalAt = (s: number): Vec3 =>
      unit(sub(at(Math.max(0, s - STEP)), at(Math.min(f.cap, s + STEP))));

    // The reference's section density is a floor: see the stations' rule.
    const kept: number[] = AutoMovieHumanDigitStations.of(f.first, f.cap, f.line.joints.slice(0, -1), f.windows);

    // The in-plane axis carried from the root toward the tip.
    const root: number = kept[0]!;
    const grid: { s: number; n: Vec3; u: Vec3 }[] = [
      { s: root, n: normalAt(root), u: [...prior.through] },
    ];
    for (let s: number = root + DIGIT_CARRY; s < f.cap + DIGIT_CARRY; s += DIGIT_CARRY) {
      const last = grid[grid.length - 1]!;
      const n: Vec3 = normalAt(Math.min(f.cap, s));
      grid.push({ s, n, u: AutoMovieHumanLimbFrame.carry(last.u, last.n, n) });
    }
    const axisAt = (s: number): Vec3 => {
      const i: number = Math.min(grid.length - 1, Math.max(0, Math.floor((s - root) / DIGIT_CARRY)));
      const g = grid[i]!;
      return AutoMovieHumanLimbFrame.carry(g.u, g.n, normalAt(s));
    };
    const sample = (s: number): { ring: Vec3[]; frame: AutoMovieHumanLoftFrame.IFrame } => ({
      ring: f.ring(s),
      frame: AutoMovieHumanLimbFrame.frame(at(s), normalAt(s), axisAt(s)),
    });

    // Stations from the tip up: the length of the centre line.
    const ordered: number[] = [...kept].reverse();
    const own = ordered.map(sample);
    const along: number[] = [0];
    for (let k: number = 1; k < own.length; k++)
      along.push(along[k - 1]! + norm(sub(own[k]!.frame.origin, own[k - 1]!.frame.origin)));
    const layers: IAutoMovieHumanLoftChain.ILayer[] = ordered.map(
      (s: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
        const here = own[k]!;
        const mine: AutoMovieHumanLimbFrame.ISample = {
          station: along[k]!,
          frame: sidedFrame(here.frame, sign),
          ring: reflect(here.ring, sign),
        };
        const at_ = (ds: number): AutoMovieHumanLimbFrame.ISample => {
          const t = sample(s + ds);
          return {
            station: along[k]! - Math.sign(ds) * norm(sub(t.frame.origin, here.frame.origin)),
            frame: sidedFrame(t.frame, sign),
            ring: reflect(t.ring, sign),
          };
        };
        return AutoMovieHumanLimbFrame.layer(
          mine,
          s + SLOPE_STEP <= f.cap ? at_(SLOPE_STEP) : mine,
          at_(-SLOPE_STEP),
          d.angles.length,
        );
      },
    );
    return {
      name: source.name.replace("{side}", side),
      basis: "spline",
      order: source.order,
      samples: source.samples,
      rule: "polar",
      layers,
    };
  }
}
