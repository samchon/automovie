import { AutoMovieHumanStationHermite } from "../lofting/AutoMovieHumanStationHermite";

/** One neutral digit axis and its skin share the same transported construction. */
export namespace AutoMovieHumanStraightDigit {
  /** World millimetres or a unit direction in that frame. */
  export type Vec3 = [number, number, number];

  /** Source centreline and its common anatomical destination axis. */
  export interface IInput {
    /** Metacarpophalangeal centre, retained by both skeleton and skin. */
    joint: Vec3;
    /** Actual wrist-to-middle-MCP direction, not an independent prior axis. */
    axis: Vec3;
    /** Last source section station. */
    cap: number;
    /** Existing centreline sampling pitch in source units. */
    step: number;
    /** Mapped curved source centreline. */
    centre: (station: number) => Vec3;
  }

  /** The same field transforms centres, sections, pole and derivative observations. */
  export interface IOutput {
    /** Centreline on the owned MCP/hand axis. */
    centre: (station: number) => Vec3;
    /** Transport any source section point at its own station. */
    point: (station: number, point: Vec3) => Vec3;
  }

  /**
   * Straighten the curved centreline by its arc while keeping transverse flesh
   * in a rigidly transported frame at every station. Positive quintic spans
   * through the existing fine chord-length samples give a C2 centre coordinate.
   * Callers read neighbouring transformed sections to emit their complete jets;
   * rotating an old derivative alone would omit the varying rotation's terms.
   */
  export function create(input: IInput): IOutput {
    const length: number = Math.hypot(...input.axis);
    if (![length, input.cap, input.step, ...input.joint].every(Number.isFinite) || !(length > 0 && input.cap > 0 && input.step > 0)) throw new Error("A straight digit needs an axis and positive source extent");
    const axis: Vec3 = scale(input.axis, 1 / length);
    const count: number = Math.ceil(input.cap / input.step);
    const stations: number[] = Array.from({ length: count + 1 }, (_: unknown, i: number): number => input.cap * i / count);
    const points: Vec3[] = stations.map(input.centre);
    const distances: number[] = [0];
    for (let i: number = 1; i < points.length; i++) distances.push(distances[i - 1]! + Math.hypot(...sub(points[i]!, points[i - 1]!)));
    const secants: number[] = stations.slice(1).map((station: number, i: number): number => (distances[i + 1]! - distances[i]!) / (station - stations[i]!));
    if (!secants.every((slope: number): boolean => Number.isFinite(slope) && slope > 0)) throw new Error("A straight digit needs a finite, advancing source centreline");
    const slopes: number[] = stations.map((_: number, i: number): number => Math.min(secants[Math.max(0, i - 1)]!, secants[Math.min(count - 1, i)]!));
    const arc: (station: number) => number = (station: number): number => {
      if (station <= 0) return slopes[0]! * station;
      if (station >= input.cap) return distances[count]! + slopes[count]! * (station - input.cap);
      const i: number = Math.min(count - 1, Math.floor(station * count / input.cap));
      const span: number = stations[i + 1]! - stations[i]!;
      const t: number = (station - stations[i]!) / span;
      const weights: number[] = AutoMovieHumanStationHermite.weights(t, span, 0, true);
      return distances[i]! + weights[1]! * slopes[i]! + weights[4]! * slopes[i + 1]! + weights[5]! * (distances[i + 1]! - distances[i]!);
    };
    const offset: number = dot(sub(points[0]!, input.joint), axis);
    const centre: (station: number) => Vec3 = (station: number): Vec3 => add(input.joint, scale(axis, offset + arc(station)));
    const frames: Map<number, { rotation: Vec3; cosine: number; sine: number }> = new Map();
    return {
      centre,
      point: (station: number, point: Vec3): Vec3 => {
        let frame: { rotation: Vec3; cosine: number; sine: number } | undefined = frames.get(station);
        if (frame === undefined) {
          const delta: Vec3 = sub(input.centre(station + input.step / 5), input.centre(station - input.step / 5));
          const speed: number = Math.hypot(...delta);
          if (!(Number.isFinite(speed) && speed > 0)) throw new Error("A straight digit cannot transport a degenerate tangent");
          const from: Vec3 = scale(delta, 1 / speed);
          let rotation: Vec3 = cross(from, axis);
          const sine: number = Math.hypot(...rotation);
          const cosine: number = Math.max(-1, Math.min(1, dot(from, axis)));
          if (sine > 1e-12) rotation = scale(rotation, 1 / sine);
          else if (cosine < 0) {
            rotation = cross(from, Math.abs(from[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1]);
            rotation = scale(rotation, 1 / Math.hypot(...rotation));
          }
          frame = { rotation, sine, cosine };
          frames.set(station, frame);
        }
        const relative: Vec3 = sub(point, input.centre(station));
        const rotated: Vec3 = frame.sine <= 1e-12 && frame.cosine > 0 ? relative : add(
          add(scale(relative, frame.cosine), scale(cross(frame.rotation, relative), frame.sine)),
          scale(frame.rotation, dot(frame.rotation, relative) * (1 - frame.cosine)),
        );
        return add(centre(station), rotated);
      },
    };
  }
}

/** Cartesian vector sum. */
function add(a: AutoMovieHumanStraightDigit.Vec3, b: AutoMovieHumanStraightDigit.Vec3): AutoMovieHumanStraightDigit.Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
/** Cartesian vector difference. */
function sub(a: AutoMovieHumanStraightDigit.Vec3, b: AutoMovieHumanStraightDigit.Vec3): AutoMovieHumanStraightDigit.Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
/** Scalar multiple in the same frame. */
function scale(a: AutoMovieHumanStraightDigit.Vec3, s: number): AutoMovieHumanStraightDigit.Vec3 { return [a[0] * s, a[1] * s, a[2] * s]; }
/** Euclidean dot product. */
function dot(a: AutoMovieHumanStraightDigit.Vec3, b: AutoMovieHumanStraightDigit.Vec3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
/** Right-handed vector product. */
function cross(a: AutoMovieHumanStraightDigit.Vec3, b: AutoMovieHumanStraightDigit.Vec3): AutoMovieHumanStraightDigit.Vec3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
