import type { AutoMovieHumanFootBody } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootBody";
import type { HumanFootPieceAudit } from "./HumanFootPieceAudit";

type Vec3 = [number, number, number];
type ISection = AutoMovieHumanFootBody.ISection;

/**
 * Made shapes for proving the foot's piece observers, built in memory: a
 * correct shape (a straight elliptic tube, convex in every section and
 * straight along every phase) and defects of known size applied to any
 * section source (a groove across a piece, a spike at one point, a ripple
 * along the stations).
 */
export namespace HumanFootMadeShapes {
  /** Control points of a made section, the body's own count. */
  export const ORDER: number = 256;

  /** Semi-axes of the made tube, mm: a foot section's breadth and height at mid-foot. */
  export const AXES: readonly [number, number] = [45, 30];

  /** A straight elliptic tube along +Z: every section the same ellipse in its own plane. */
  export function tube(station: number): ISection {
    const frame: ISection["frame"] = { origin: [0, 0, station], u: [0, 1, 0], v: [1, 0, 0] };
    const ring: Vec3[] = Array.from({ length: ORDER }, (_: unknown, m: number): Vec3 => {
      const t: number = (2 * Math.PI * m) / ORDER;
      return [AXES[0] * Math.cos(t), AXES[1] * Math.sin(t), station];
    });
    return section(ring, frame);
  }

  /**
   * A groove across one piece: the ring points within `half` indices of the
   * piece's middle pushed toward the section's centre by `depth` times a
   * raised cosine, so the groove's deepest point is `depth` mm.
   */
  export function groove(source: HumanFootPieceAudit.Sections, middle: number, half: number, depth: number): HumanFootPieceAudit.Sections {
    return (station: number): ISection => {
      const s: ISection = source(station);
      const c: Vec3 = centre(s.ring);
      const ring: Vec3[] = s.ring.map((p: Vec3, m: number): Vec3 => {
        const d: number = Math.abs(m - middle);
        if (d > half) return p;
        const w: number = (depth * (1 + Math.cos((Math.PI * d) / half))) / 2;
        const r: Vec3 = sub(p, c);
        const l: number = Math.hypot(...r);
        return [p[0] - (w * r[0]) / l, p[1] - (w * r[1]) / l, p[2] - (w * r[2]) / l];
      });
      return section(ring, s.frame);
    };
  }

  /** A spike: one ring point pushed away from the section's centre by `height` mm. */
  export function spike(source: HumanFootPieceAudit.Sections, index: number, height: number): HumanFootPieceAudit.Sections {
    return (station: number): ISection => {
      const s: ISection = source(station);
      const c: Vec3 = centre(s.ring);
      const ring: Vec3[] = s.ring.map((p: Vec3, m: number): Vec3 => {
        if (m !== index) return p;
        const r: Vec3 = sub(p, c);
        const l: number = Math.hypot(...r);
        return [p[0] + (height * r[0]) / l, p[1] + (height * r[1]) / l, p[2] + (height * r[2]) / l];
      });
      return section(ring, s.frame);
    };
  }

  /**
   * A ripple along the stations: every ring point between stations `from` and
   * `to` pushed out from the section's centre by `amplitude` times the sine of
   * the station over the wavelength, the ribs a section-by-section loft prints.
   */
  export function ripple(source: HumanFootPieceAudit.Sections, amplitude: number, wavelength: number, from: number, to: number): HumanFootPieceAudit.Sections {
    return (station: number): ISection => {
      const s: ISection = source(station);
      if (station < from || station > to) return s;
      const c: Vec3 = centre(s.ring);
      const w: number = amplitude * Math.sin((2 * Math.PI * (station - from)) / wavelength);
      const ring: Vec3[] = s.ring.map((p: Vec3): Vec3 => {
        const r: Vec3 = sub(p, c);
        const l: number = Math.hypot(...r);
        return [p[0] + (w * r[0]) / l, p[1] + (w * r[1]) / l, p[2] + (w * r[2]) / l];
      });
      return section(ring, s.frame);
    };
  }
}

/** A section from its ring and plane; the readers use only these two. */
function section(ring: Vec3[], frame: ISection["frame"]): ISection {
  return {
    ring,
    frame,
    pinches: (): { dorsal: number; plantar: number } => ({ dorsal: 0, plantar: 0 }),
    lateral: 0,
    medial: 0,
    at: (t: number): Vec3 => ring[Math.round((t / (2 * Math.PI)) * ring.length) % ring.length]!,
  };
}

/** Mean of a ring's points. */
function centre(ring: readonly Vec3[]): Vec3 {
  const s: Vec3 = [0, 0, 0];
  for (const p of ring) {
    s[0] += p[0];
    s[1] += p[1];
    s[2] += p[2];
  }
  return [s[0] / ring.length, s[1] / ring.length, s[2] / ring.length];
}

/** Difference. */
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
