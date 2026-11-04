import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The body's section planes from the web line: the yaw fan, the turn fan and
 * their hand-over, and the inverse (the station of the plane through a point).
 *
 * The yaw's rate and the turn's are handed over across a window about the
 * square plane by the quintic smoothstep `S`, so the plane's frame is C2 in
 * the station (a switch at the square plane turned the planes' rotation axis
 * through a right angle there, and every constant-phase line kinked):
 *
 * ```text
 * phi'   = -yaw / square (1 - S),   theta' = S / turnLever
 * ```
 *
 * The window is symmetric and `S` integrates to half of it, so outside the
 * window both angles are the switch's own and the ring stays where it was. The
 * rotation axis inside the window, `|phi'| y - theta' lateral`, points up and
 * medially from the shared point, above the foot, so the planes still meet
 * only outside it.
 */
export namespace AutoMovieHumanFootFan {
  /** The plane at a station. */
  export function plane(line: AutoMovieHumanFootWebLine.IWebLine, station: number): AutoMovieHumanLoftFrame.IFrame {
    const turn: { phi: number; theta: number } = angles(line, station);
    const phi: number = turn.phi;
    const theta: number = turn.theta;
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);

    // The turn about the lateral axis, then the yaw about the vertical.
    const lateral: Vec3 = G.plus(G.scale(line.lateral, c), G.scale(line.back, s));
    const back: Vec3 = G.sub(G.scale(line.back, c), G.scale(line.lateral, s));

    return {
      origin: line.origin,
      u: G.plus([0, Math.cos(theta), 0], G.scale(back, -Math.sin(theta))),
      v: lateral,
    };
  }

  /** The station of the plane through a point. */
  export function station(line: AutoMovieHumanFootWebLine.IWebLine, p: Vec3): number {
    const r: Vec3 = G.sub(p, line.origin);
    const b: number = G.dot(r, line.back);

    // Outside the window the planes are the switch's, read directly.
    const direct: number =
      b < 0
        ? line.square * (1 - Math.atan2(-b, -G.dot(r, line.lateral)) / line.yaw)
        : line.square + line.turnLever * Math.atan2(b, -r[1]);
    const w: number = window(line);
    if (direct <= line.square - w || direct >= line.square + w) return direct;

    // Inside it, the side of the plane a point is on changes once.
    const side = (s: number): number => {
      const f: AutoMovieHumanLoftFrame.IFrame = plane(line, s);
      return G.dot(r, G.cross(f.u, f.v));
    };
    let lo: number = line.square - w;
    let hi: number = line.square + w;
    const sign: number = Math.sign(side(lo));
    for (let i: number = 0; i < BISECTIONS; i++) {
      const m: number = 0.5 * (lo + hi);
      if (Math.sign(side(m)) === sign) lo = m;
      else hi = m;
    }

    return 0.5 * (lo + hi);
  }

  /** The yaw and turn angles at a station. */
  function angles(line: AutoMovieHumanFootWebLine.IWebLine, station: number): { phi: number; theta: number } {
    const w: number = window(line);

    // The integral of the smoothstep's share over the window up to here.
    const x: number = Math.min(1, Math.max(0, (station - line.square + w) / (2 * w)));
    const turned: number =
      station <= line.square - w ? 0 : 2 * w * (x ** 6 - 3 * x ** 5 + 2.5 * x ** 4) + Math.max(0, station - line.square - w);
    const yawed: number = station - turned;

    return {
      phi: line.yaw * (1 - yawed / line.square),
      theta: turned / line.turnLever,
    };
  }

  /** Half the hand-over window: {@link HANDOVER} of the yaw fan's stations. */
  function window(line: AutoMovieHumanFootWebLine.IWebLine): number {
    return HANDOVER * line.square;
  }
}

/** Half the yaw-to-turn hand-over window, as a share of the yaw fan's stations. Convention. */
const HANDOVER: number = 0.5;

/** Bisections that close a station inside the hand-over window. */
const BISECTIONS: number = 44;
