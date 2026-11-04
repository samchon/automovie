import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSeamStation } from "../../lofting/AutoMovieHumanSeamStation";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootReflection } from "./AutoMovieHumanFootReflection";
import { AutoMovieHumanFootToeSection } from "./AutoMovieHumanFootToeSection";
import type { AutoMovieHumanFootToeSpan } from "./AutoMovieHumanFootToeSpan";
import { AutoMovieHumanFootToeStations } from "./AutoMovieHumanFootToeStations";

type Vec3 = G.Vec3;

/**
 * A toe's loft chain: its sections ({@link AutoMovieHumanFootToeSection})
 * square to its line, from the tip up, at the toe's own stations
 * ({@link AutoMovieHumanFootToeStations}); the plane's normal points toward the
 * root, the side's reflection applied by {@link AutoMovieHumanFootReflection}.
 */
export namespace AutoMovieHumanFootToeChain {
  /** A toe's chain for a side. */
  export function of(t: AutoMovieHumanFootToeSpan.IToe, name: string, sign: 1 | -1): IAutoMovieHumanLoftChain {
    // The section's axes: along the line, the foot's lateral made square to it,
    // up from the two, and across from up and the line.
    const lateral: Vec3 = G.unit(G.sub(t.lateral, G.scale(t.tangent, G.dot(t.lateral, t.tangent))));
    const dorsal: Vec3 = G.cross(t.tangent, lateral);
    const up: Vec3 = dorsal[1] >= 0 ? dorsal : G.scale(dorsal, -1);
    const across: Vec3 = G.cross(up, t.tangent);
    const side: Vec3 = G.dot(across, lateral) >= 0 ? across : G.scale(across, -1);
    const ringAt = (s: number): Vec3[] => {
      const c: Vec3 = G.plus(t.head, G.scale(t.tangent, s));
      const size: [number, number, number] = t.size(s);

      return AutoMovieHumanFootToeSection.of(size[0], size[1], size[2], t.order).map((q: G.Vec2): Vec3 =>
        G.plus(c, G.plus(G.scale(side, q[0]), G.scale(up, q[1]))),
      );
    };
    const normal: Vec3 = G.scale(t.tangent, -1);
    const frameAt = (s: number): AutoMovieHumanLoftFrame.IFrame =>
      AutoMovieHumanLimbFrame.frame(G.plus(t.head, G.scale(t.tangent, s)), normal, up);
    const sample = (s: number, station: number): AutoMovieHumanLimbFrame.ISample =>
      AutoMovieHumanFootReflection.sample({ station, frame: frameAt(s), ring: ringAt(s) }, sign);

    // Layers from the tip up; each one's slopes by a central difference of
    // the section's own construction over a short step along the line.
    const kept: number[] = AutoMovieHumanFootToeStations.of(t, t.sections);
    const layers: IAutoMovieHumanLoftChain.ILayer[] = [...kept].reverse().map(
      (s: number): IAutoMovieHumanLoftChain.ILayer => {
        const station: number = t.cap - s;
        const here: AutoMovieHumanLimbFrame.ISample = sample(s, station);
        const before: AutoMovieHumanLimbFrame.ISample =
          s + SLOPE_STEP <= t.cap ? sample(s + SLOPE_STEP, station - SLOPE_STEP) : here;
        const after: AutoMovieHumanLimbFrame.ISample = sample(s - SLOPE_STEP, station + SLOPE_STEP);

        return AutoMovieHumanLimbFrame.layer(here, before, after, t.order);
      },
    );

    return AutoMovieHumanSeamStation.continuous({ name, basis: "spline", order: t.order, samples: t.order, rule: "polar", layers });
  }

  /**
   * A toe's nail plate on its chain: the chain's station is the length back
   * from the cap, and the plate lies on the section's dorsal side, its `up`.
   *
   * @param t The toe's span.
   * @param name The toe chain's name for the side.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function nail(t: AutoMovieHumanFootToeSpan.IToe, name: string, sign: 1 | -1): IAutoMovieHumanBodyCalibration.INail {
    const lateral: Vec3 = G.unit(G.sub(t.lateral, G.scale(t.tangent, G.dot(t.lateral, t.tangent))));
    const dorsal: Vec3 = G.cross(t.tangent, lateral);
    const up: Vec3 = dorsal[1] >= 0 ? dorsal : G.scale(dorsal, -1);
    return {
      chain: name,
      root: t.cap - t.nail.root,
      edge: Math.max(0, t.cap - t.nail.edge),
      width: t.nail.width,
      dorsal: G.sided(up, sign),
    };
  }
}

/** Length step of a toe's layers' slopes, mm. */
const SLOPE_STEP: number = 0.05;
