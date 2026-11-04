import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanNailClosure } from "./AutoMovieHumanNailClosure";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * A closed nail plate on its digit chain's own surface.
 *
 * The plate is a window of the digit chain (`IAutoMovieHumanBodyCalibration.INail`):
 * from the plate's root station to its free edge, and across it, at every
 * station, the stretch of the chain's ring whose offset from the ring's
 * dorsal point along the plate's lateral axis is within half the plate's
 * width. Each bed point is the chain evaluated at its station and at the
 * phase that offset solves for on that ring; the top is the bed lifted by
 * the plate's thickness along the chain's own normal. Nothing is read from
 * the skin's triangles.
 *
 * The grid follows the cuticle arc, the lateral folds and the rounded free
 * edge of the nail image's outline, and the plate's thickness fades to zero
 * over a seating band at the cuticle and the lateral folds, where the plate
 * enters the skin; only the free edge keeps its thickness. Thickness,
 * outline and band are conventions, not measurements.
 */
export namespace AutoMovieHumanNailPlate {
  /** Plate mesh in mm. */
  export interface IOutput {
    /** Flat positions in mm. */
    positions: number[];

    /** Flat unit normals. */
    normals: number[];

    /** Flat normalized coordinates: u across, v from cuticle to free edge. */
    uvs: number[];

    /** Triangle indices. */
    indices: number[];
  }

  /** Plate height above the skin in mm: a convention. */
  const THICKNESS: number = 0.45;

  /** Width of the seating band at the cuticle and the lateral folds, mm: a convention. */
  const SEATING: number = 0.8;

  /** Rows of one plate, cuticle to free edge. */
  const ALONG: number = 14;

  /** Columns of one plate, edge to edge. */
  const AROUND: number = 11;

  /** Station and phase step of the surface's numerical derivatives. */
  const STEP: number = 1e-3;

  /**
   * One nail's plate on its digit chain.
   *
   * @param chain The digit chain, calibration mm.
   * @param nail The plate's window on it.
   * @returns The closed plate mesh in mm.
   */
  export function generate(chain: IAutoMovieLoftChain, nail: IAutoMovieHumanBodyCalibration.INail): IOutput {
    const out: IOutput = { positions: [], normals: [], uvs: [], indices: [] };
    const length: number = Math.abs(nail.root - nail.edge);
    const bed: number[] = [];
    const bedNormals: Vec3[] = [];
    const coordinates: [number, number][] = [];
    for (let i: number = 0; i < ALONG; ++i)
      for (let j: number = 0; j < AROUND; ++j) {
        // The image's outline: the cuticle arc, the lateral folds and the
        // rounded free edge, in the plate's own coordinates.
        const t: number = 0.88 * (-1 + (2 * j) / (AROUND - 1));
        const proximal: number = 0.04 + 0.2 * t * t;
        const free: number = 0.99 - 0.16 * Math.abs(t) ** 2.5;
        const v: number = proximal + ((free - proximal) * i) / (ALONG - 1);
        const station: number = nail.root + v * (nail.edge - nail.root);
        const phase: number = across(chain, station, nail.dorsal, (t * nail.width) / 2);
        const p: Vec3 = point(chain, station, phase);
        bed.push(...p);
        bedNormals.push(outward(chain, station, phase, nail.dorsal));
        coordinates.push([(t + 1) / 2, v]);
      }

    // The top: the bed lifted along its normal, the lift fading to zero over
    // the seating band at the cuticle and the lateral folds.
    for (let i: number = 0; i < ALONG; ++i)
      for (let j: number = 0; j < AROUND; ++j) {
        const k: number = i * AROUND + j;
        const proximalDistance: number = (i / (ALONG - 1)) * length;
        const lateralDistance: number = (Math.min(j, AROUND - 1 - j) * 0.88 * nail.width) / (AROUND - 1);
        const seating: number = V.smooth(Math.min(proximalDistance, lateralDistance) / SEATING);
        const n: Vec3 = bedNormals[k]!;
        out.positions.push(...V.add(V.at(bed, k), V.scale(n, seating * THICKNESS)));
        out.normals.push(...n);
        out.uvs.push(...coordinates[k]!);
      }

    // Counter-clockwise seen from outside: a quad wound across, then along,
    // faces along (across x along), which the surface's own derivatives at
    // the plate's centre compare with its outward normal once.
    const centre: number = Math.floor(ALONG / 2) * AROUND + Math.floor(AROUND / 2);
    const acrossRate: Vec3 = V.sub(V.at(bed, centre + 1), V.at(bed, centre - 1));
    const alongRate: Vec3 = V.sub(V.at(bed, centre + AROUND), V.at(bed, centre - AROUND));
    const forward: boolean = V.dot(V.cross(acrossRate, alongRate), bedNormals[centre]!) >= 0;
    for (let i: number = 0; i + 1 < ALONG; ++i)
      for (let j: number = 0; j + 1 < AROUND; ++j) {
        const a: number = i * AROUND + j;
        const b: number = a + 1;
        const c: number = a + AROUND;
        const d: number = c + 1;
        if (forward) out.indices.push(a, b, c, c, b, d);
        else out.indices.push(a, c, b, c, d, b);
      }
    AutoMovieHumanNailClosure.append(out, bed, ALONG, AROUND);
    return out;
  }

  /**
   * The phase of the chain's ring at a station whose point stands `offset`
   * from the ring's dorsal point along the plate's lateral axis, on the
   * dorsal half: bracketed between the dorsal phase and a quarter turn to
   * the side the offset's sign names, then closed by the Illinois rule.
   */
  function across(chain: IAutoMovieLoftChain, station: number, dorsal: Vec3, offset: number): number {
    const sample: (t: number) => Vec3 = AutoMovieLoftChain.sampler(chain, station);
    const frame: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, station);
    const centre: Vec3 = AutoMovieLoftChain.axis(chain, station);
    const axisNormal: Vec3 = V.normalize(V.cross(frame.v, frame.u));
    const up: Vec3 = V.normalize(V.sub(dorsal, V.scale(axisNormal, V.dot(dorsal, axisNormal))));
    const lateral: Vec3 = V.normalize(V.cross(axisNormal, up));

    // The polar rule's phase is the angle about the axis in the frame.
    const start: number = phaseToward(sample, centre, up, Math.atan2(V.dot(up, frame.v), V.dot(up, frame.u)));
    if (offset === 0) return start;
    const apex: Vec3 = sample(start);
    const g: (t: number) => number = (t: number): number => V.dot(V.sub(sample(t), apex), lateral) - offset;
    let a: number = start;
    let b: number = start + Math.PI / 2;
    if (Math.sign(g(b)) === Math.sign(g(a))) b = start - Math.PI / 2;
    let ga: number = g(a);
    let gb: number = g(b);
    let side: number = 0;
    for (let k: number = 0; k < 60 && Math.abs(b - a) > 1e-9; k++) {
      const c: number = (a * gb - b * ga) / (gb - ga);
      const gc: number = g(c);
      if (Math.abs(gc) < 1e-6) return c;
      if (Math.sign(gc) === Math.sign(gb)) {
        b = c;
        gb = gc;
        if (side === -1) ga /= 2;
        side = -1;
      } else {
        a = c;
        ga = gc;
        if (side === 1) gb /= 2;
        side = 1;
      }
    }
    return (a + b) / 2;
  }

  /**
   * The phase near `guess` whose point lies farthest along `up` from the
   * axis: the ring's dorsal point, by Newton's rule on the height's phase
   * derivative from the polar guess.
   */
  function phaseToward(sample: (t: number) => Vec3, centre: Vec3, up: Vec3, guess: number): number {
    const height: (t: number) => number = (t: number): number => V.dot(V.sub(sample(t), centre), up);
    let t: number = guess;
    for (let k: number = 0; k < 20; k++) {
      const d1: number = (height(t + STEP) - height(t - STEP)) / (2 * STEP);
      const d2: number = (height(t + STEP) - 2 * height(t) + height(t - STEP)) / (STEP * STEP);
      if (!(d2 < 0)) break;
      const step: number = -d1 / d2;
      t += Math.max(-0.2, Math.min(0.2, step));
      if (Math.abs(step) < 1e-9) break;
    }
    return t;
  }

  /** The chain's point at a station and phase. */
  function point(chain: IAutoMovieLoftChain, station: number, phase: number): Vec3 {
    return AutoMovieLoftChain.ring(chain, station, [phase])[0]! as Vec3;
  }

  /** The chain's unit normal at a station and phase, turned to the dorsal side. */
  function outward(chain: IAutoMovieLoftChain, station: number, phase: number, dorsal: Vec3): Vec3 {
    const ds: Vec3 = V.sub(point(chain, station + STEP, phase), point(chain, station - STEP, phase));
    const dt: Vec3 = V.sub(point(chain, station, phase + STEP), point(chain, station, phase - STEP));
    const n: Vec3 = V.normalize(V.cross(ds, dt));
    return V.dot(n, dorsal) < 0 ? V.scale(n, -1) : n;
  }
}

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;
