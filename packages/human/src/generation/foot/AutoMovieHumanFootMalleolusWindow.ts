import type { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootMalleolusBump } from "./AutoMovieHumanFootMalleolusBump";

type Vec3 = G.Vec3;

/**
 * Where a malleolus's relief window stands on the body's chain: the stations
 * and phases it covers, from the border's guide, the section's perimeter and
 * the malleolus's radius.
 *
 * The window is centred where the border's guide reaches the malleolus's
 * height (found by bisection over the turn fan's stations); its reach is
 * {@link AutoMovieHumanFootMalleolusBump.WINDOW} radii. In stations the reach
 * is the radius over the guide's pace (mm of guide per station there); in
 * phase it is the radius over the section's perimeter times a whole turn,
 * about the border's own phase. The right foot's phases are reversed.
 */
export namespace AutoMovieHumanFootMalleolusWindow {
  /** What a window's place reads. */
  export interface IInput {
    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** The body whose guide the malleolus stands on. */
    body: AutoMovieHumanFootBody.IBody;

    /** Which border. */
    which: "lateral" | "medial";

    /** The malleolus's centre height, lateral malleolus heights. */
    height: number;

    /** The malleolus's radius, mm. */
    radius: number;

    /** 1 for the left foot, -1 for the right's reflection. */
    sign: 1 | -1;
  }

  /** A window's place. */
  export interface IPlace {
    /** The stations the window covers, lowest first. */
    stations: [number, number];

    /** The phases it covers, in the side's ring order. */
    phases: [number, number];
  }

  /** The place of a malleolus's window. */
  export function of(input: IInput): IPlace {
    const body: AutoMovieHumanFootBody.IBody = input.body;
    const height: number = input.height * input.frame.H;

    // The station where the border's guide reaches the malleolus's height.
    let lo: number = body.fan.square;
    let hi: number = body.fan.end;
    for (let i: number = 0; i < BISECTIONS; i++) {
      const mid: number = 0.5 * (lo + hi);
      if (body.guide(input.which, mid)[1] < height) lo = mid;
      else hi = mid;
    }
    const station: number = 0.5 * (lo + hi);

    // The guide's pace there, to turn the window's reach into stations.
    const at: Vec3 = body.guide(input.which, station);
    const near: Vec3 = body.guide(input.which, Math.min(body.fan.end, station + 1));
    const perMm: number = 1 / Math.max(1e-3, Math.hypot(...G.sub(near, at)));

    // The reach round the section, in phase, from the section's perimeter.
    const section: AutoMovieHumanFootBody.ISection = body.section(station);
    const ring: Vec3[] = section.ring;
    let perimeter: number = 0;
    ring.forEach((p: Vec3, i: number): void => {
      perimeter += Math.hypot(...G.sub(ring[(i + 1) % ring.length]!, p));
    });
    const reach: number = AutoMovieHumanFootMalleolusBump.WINDOW * input.radius;
    const centre: number = input.which === "lateral" ? section.lateral : section.medial;
    const half: number = (reach / perimeter) * G.TWO_PI;
    const left: [number, number] = [G.wrap(centre - half), G.wrap(centre + half)];

    return {
      stations: [station - reach * perMm, station + reach * perMm],
      phases: input.sign === 1 ? left : [G.wrap(G.TWO_PI - left[1]), G.wrap(G.TWO_PI - left[0])],
    };
  }
}

/** Bisections that close the station where a border reaches a height. */
const BISECTIONS: number = 48;
