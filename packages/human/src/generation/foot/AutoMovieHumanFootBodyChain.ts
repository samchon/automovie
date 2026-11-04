import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanSeamStation } from "../../lofting/AutoMovieHumanSeamStation";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import { AutoMovieHumanFootReflection } from "./AutoMovieHumanFootReflection";

/**
 * The body's loft chain `foot.<side>`, from the web ring (station 0) to the
 * ankle ring, the leg's start: each layer the body's section at its station
 * with slopes by central differences, the side's reflection applied, and the
 * malleoli's relief windows on it. The ankle ring is horizontal at
 * `AutoMovieHumanFootPrior.PRIOR.ring` lateral malleolus heights, a fitted
 * constant kept until the ankle girth is solved at its own site.
 */
export namespace AutoMovieHumanFootBodyChain {
  /** The body's chain for a side. */
  export function of(
    body: AutoMovieHumanFootBody.IBody,
    name: string,
    sign: 1 | -1,
    reliefs: IAutoMovieHumanRelief[],
  ): IAutoMovieHumanLoftChain {
    const order: number = AutoMovieHumanFootBody.ORDER;
    const last: number = body.stations.length - 1;
    const sided = (station: number): AutoMovieHumanLimbFrame.ISample =>
      AutoMovieHumanFootReflection.sample(body.sample(station), sign);
    const layers: IAutoMovieHumanLoftChain.ILayer[] = body.stations.map(
      (station: number, j: number): IAutoMovieHumanLoftChain.ILayer => {
        const here: AutoMovieHumanLimbFrame.ISample = sided(station);
        const lo: number = j === 0 ? station : station - STEP;
        const hi: number = j === last ? station : station + STEP;
        const h: Controls = AutoMovieHumanLimbFrame.controls(here, order);
        const a: Controls = AutoMovieHumanLimbFrame.controls(sided(lo), order);
        const b: Controls = AutoMovieHumanLimbFrame.controls(sided(hi), order);
        const slope = (p: readonly number[], q: readonly number[]): number[] =>
          p.map((v: number, i: number): number => (q[i]! - v) / (hi - lo));
        return {
          y: station,
          frame: here.frame,
          coefficients: h.coefficients,
          slopes: slope(a.coefficients, b.coefficients),
          lift: h.lift,
          liftSlopes: slope(a.lift, b.lift),
        };
      },
    );
    // Along its stations the chain takes the shared C2 rule: every
    // coefficient, lift and plane component the natural spline through its
    // layers, so the hand-over from the yaw fan to the turn fan at the square
    // plane is a C2 change of plane, not a switch.
    return AutoMovieHumanSeamStation.continuous({ name, basis: "spline", order, samples: order, rule: "arclength", layers, reliefs });
  }
}

/** A section's spline controls and lift. */
type Controls = ReturnType<typeof AutoMovieHumanLimbFrame.controls>;

/** Station step of the body's slopes, mm. */
const STEP: number = 0.02;
