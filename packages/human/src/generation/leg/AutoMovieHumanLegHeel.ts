import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanLegCourse } from "./AutoMovieHumanLegCourse";
import type { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import type { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The heel's bound on the leg's posterior line through the ankle turn.
 *
 * The bisection section's posterior guide point lies on the heel's back line
 * through the pternion, where the bisection ray meets it (the heel's back is
 * vertical about the pternion, the heel's most posterior point; its height
 * over the floor is an input gap, read here as that meeting). The common
 * extent is that distance unstretched and re-referred to IM.
 *
 * Inside the ankle turn the posterior line is bounded by the heel's sagittal
 * profile, an exact construction in the femur frame's sagittal plane: the
 * floor forward of the heel's contact; the heel's corner as the quarter
 * circle tangent to the back line at the pternion and to the floor (radius
 * the pternion's height, the arc the anatomy calls for at a fat-padded
 * corner, declared); and above the pternion the cubic from the pternion to
 * the Achilles point at the ankle minimum with vertical tangents at both ends
 * (the pternion is the heel's most posterior point; the posterior line is
 * stationary at the ankle minimum), handles a third of the rise (a cubic with
 * handles at the chord's thirds reproduces a straight chord exactly). Five
 * stations in each half of the turn, by the course's own in-turn station map
 * (distance from the joint), read their planes' posterior rays against that
 * profile with its slope, so no rotating section carries the heel beyond its
 * back line or under the floor.
 */
export namespace AutoMovieHumanLegHeel {
  /** What the heel reads. */
  export interface IInput {
    /** Neutral frames. */
    frames: AutoMovieHumanLegSegmentFrames.IOutput;

    /** Neutral landmarks. */
    landmarks: AutoMovieHumanLegLandmarks.IOutput;

    /** The neutral course. */
    course: AutoMovieHumanLegCourse.IOutput;

    /** The Achilles point in the femur frame's sagittal plane (x, y): the ankle tape's posterior extent at the ankle minimum's level. */
    achilles: [number, number];

    /**
     * The person's own heel back line in the femur frame's sagittal plane
     * (x, y), bottom up, below the Achilles point (f1: her traced heel,
     * `AutoMovieHumanLegF1Lines.heel`). Present, it replaces the constructed
     * back line, pternion corner and Achilles cubic; absent, the construction
     * stands.
     */
    profile?: readonly [number, number][];
  }

  /** One posterior datum inside the turn: its value and slope in the walk station. */
  export interface IDatum {
    /** Site name. */
    site: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** The posterior extent on that station's plane, mm. */
    value: number;

    /** Its derivative in the walk station. */
    slope: number;

    /** The datum's rule. */
    rule: string;
  }

  /** The heel's datums. */
  export interface IOutput {
    /** The heel's extent on the ankle bisection plane: the bisection ray to the pternion's back line, mm. */
    reach: number;

    /** Datums on the turn's upper half, proximal to distal. */
    upper: IDatum[];

    /** Datums on the turn's lower half, proximal to distal. */
    lower: IDatum[];

    /** Constructor notes. */
    diagnostics: string[];
  }

  /** Read the heel's bound for the posterior line. */
  export function create(input: IInput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const { frames, landmarks, course, achilles }: IInput = input;
    const m: 1 | -1 = frames.medial;
    const imWalk: number = landmarks.course.im;
    const diagnostics: string[] = [];
    const heelPoint: Vec3 = S.apply(frames.chain(frames.foot.name, S.IDENTITY), landmarks.foot.heel);
    const ray: (station: number, hull: [number, number][][]) => number = (station: number, hull: [number, number][][]): number => {
      if (course.axis === null) return NaN;
      const plane: { origin: Vec3; v: Vec3 } = course.axis.at(station);
      const w: Vec3 = scale(plane.v, m);
      let best: number = Infinity;
      for (const [a, b] of hull) {
        // Solve origin + s w = a + r (b - a) in the sagittal (x, y) plane, s > 0, r in [0, 1].
        const ex: number = b![0] - a![0];
        const ey: number = b![1] - a![1];
        const det: number = w[0] * -ey - w[1] * -ex;
        if (Math.abs(det) < 1e-12) continue;
        const rx: number = a![0] - plane.origin[0];
        const ry: number = a![1] - plane.origin[1];
        const s: number = (rx * -ey - ry * -ex) / det;
        const r: number = (w[0] * ry - w[1] * rx) / det;
        if (s > 0 && r >= -1e-9 && r <= 1 + 1e-9) best = Math.min(best, s);
      }
      return best;
    };
    const floorY: number = heelPoint[1];
    const far: number = 10 * (landmarks.course.web - imWalk);
    const mid: number = AutoMovieHumanLegCourse.midpoint(course, 2);
    const tibiaLink: number = imWalk - landmarks.course.knee;
    const shares: number[] = [5 / 6, 4 / 6, 3 / 6, 2 / 6, 1 / 6];
    const upperWalks: number[] = course.runs.length > 2 ? shares.map((g: number): number => imWalk - g * (tibiaLink - course.runs[1]!.to)) : [];
    const lowerWalks: number[] = course.runs.length > 2 ? [...shares].reverse().map((g: number): number => imWalk + g * course.runs[2]!.from) : [];
    // Five stations in each half of the ankle turn read their planes' posterior rays against the heel's profile.
    const turnDatums: (hull: [number, number][][]) => { upper: IDatum[]; lower: IDatum[] } = (hull: [number, number][][]): { upper: IDatum[]; lower: IDatum[] } => {
      const read: (walks: number[], name: string) => IDatum[] = (walks: number[], name: string): IDatum[] =>
        walks.map((walk: number, k: number): IDatum => {
          const value: number = ray(course.station(walk), hull);
          // The profile's own slope in the walk station (central difference over 0.25 mm), so the outline meets the profile tangentially (G1) at each datum.
          const slope: number = (ray(course.station(walk + 0.25), hull) - ray(course.station(walk - 0.25), hull)) / 0.5;
          if (!Number.isFinite(value)) diagnostics.push(`heel: the ${name} ray ${k} misses the heel profile`);
          return { site: `heel ${name} ${k + 1}`, walk, value, slope, rule: `value and slope (heel profile on the turn's ${name} plane ${k + 1})` };
        });
      return { upper: read(upperWalks, "upper"), lower: read(lowerWalks, "lower") };
    };
    if (input.profile !== undefined && input.profile.length >= 2) {
      // The person's heel: her back line up to the Achilles point, x a Catmull-Rom cubic in height through her knots (one sample per mm), closed to the floor by the circle tangent to the line's lowest point and to the floor (radius y0 / (1 - cos a), a the line's inclination from the floor there), then the floor forward.
      const knots: [number, number][] = [...input.profile.filter((p: readonly [number, number]): boolean => p[1] < achilles[1] - 1).map((p: readonly [number, number]): [number, number] => [p[0], p[1]]), [achilles[0], achilles[1]]];
      const xAt: (y: number) => number = (y: number): number => {
        let i: number = 0;
        while (i < knots.length - 2 && y > knots[i + 1]![1]) ++i;
        const [y0, y1]: [number, number] = [knots[i]![1], knots[i + 1]![1]];
        const slope: (k: number) => number = (k: number): number => (k <= 0 ? (knots[1]![0] - knots[0]![0]) / (knots[1]![1] - knots[0]![1]) : k >= knots.length - 1 ? (knots[k]![0] - knots[k - 1]![0]) / (knots[k]![1] - knots[k - 1]![1]) : (knots[k + 1]![0] - knots[k - 1]![0]) / (knots[k + 1]![1] - knots[k - 1]![1]));
        const h: number = y1 - y0;
        const t: number = (y - y0) / h;
        return (2 * t ** 3 - 3 * t * t + 1) * knots[i]![0] + (t ** 3 - 2 * t * t + t) * h * slope(i) + (-2 * t ** 3 + 3 * t * t) * knots[i + 1]![0] + (t ** 3 - t * t) * h * slope(i + 1);
      };
      const bottom: [number, number] = knots[0]!;
      const profile: [number, number][] = [];
      for (let y: number = achilles[1]; y > bottom[1]; y -= 1) profile.push([xAt(y), y]);
      profile.push(bottom);
      // The corner: the line leaves its lowest knot going down and forward at the slope dx/dy there; the tangent circle's centre stands r above the floor.
      const dxdy: number = (knots[1]![0] - knots[0]![0]) / (knots[1]![1] - knots[0]![1]);
      const incline: number = Math.atan2(1, Math.abs(dxdy));
      const height: number = bottom[1] - floorY;
      const radius: number = height / (1 - Math.cos(incline));
      const centre: [number, number] = [bottom[0] + radius * Math.sin(incline), floorY + radius];
      const start: number = Math.atan2(bottom[1] - centre[1], bottom[0] - centre[0]);
      for (let k: number = 1; k <= 24; ++k) {
        const a: number = start + (k / 24) * (-Math.PI / 2 - start);
        profile.push([centre[0] + radius * Math.cos(a), centre[1] + radius * Math.sin(a)]);
      }
      profile.push([centre[0] + far, floorY]);
      const hull: [number, number][][] = profile.slice(1).map((p: [number, number], k: number): [number, number][] => [profile[k]!, p]);
      const reach: number = ray(mid, hull);
      if (!(reach > 0) || !(radius > 0)) diagnostics.push(`heel: her heel line does not close to the floor (reach ${reach}, corner radius ${radius})`);
      return { reach, ...turnDatums(hull), diagnostics };
    }
    const backX: number = heelPoint[0];
    const reach: number = ray(mid, [[[backX, floorY], [backX, floorY + far]], [[backX - far, floorY], [backX + far, floorY]]]);
    const pternion: [number, number] = course.axis === null ? [NaN, NaN] : [backX, course.axis.at(mid).origin[1] + reach * scale(course.axis.at(mid).v, m)[1]];
    const corner: number = pternion[1] - floorY;
    const profile: [number, number][] = [];
    for (let k: number = 0; k <= 32; ++k) {
      const t: number = k / 32;
      const rise: number = (achilles[1] - pternion[1]) / 3;
      const c: [number, number][] = [achilles, [achilles[0], achilles[1] - rise], [pternion[0], pternion[1] + rise], pternion];
      const b: number[] = [(1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3];
      profile.push([0, 1].map((j: number): number => c.reduce((s: number, p: [number, number], i: number): number => s + b[i]! * p[j]!, 0)) as [number, number]);
    }
    for (let k: number = 1; k <= 24; ++k) {
      const a: number = Math.PI + (k / 24) * (Math.PI / 2);
      profile.push([pternion[0] + corner + corner * Math.cos(a), floorY + corner + corner * Math.sin(a)]);
    }
    profile.push([backX + far, floorY]);
    const hull: [number, number][][] = profile.slice(1).map((p: [number, number], k: number): [number, number][] => [profile[k]!, p]);
    if (!(reach > 0 && corner > 0)) diagnostics.push(`heel: the bisection ray does not meet the heel's back line above the floor (reach ${reach}, pternion height ${corner})`);
    return { reach, ...turnDatums(hull), diagnostics };
  }
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
