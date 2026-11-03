import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Steps, ridges and dents on the emitted skin, read on meridian outlines: the
 * skin cut by half-planes that contain a region's axis, one per azimuth, each
 * outline resampled at 1 mm and read for the sharpest turn over a 10 mm
 * chord. A smooth skin turns at its least radius of curvature over a chord;
 * a step, a rim or a groove turns far more sharply. The bound is the
 * catalog's crease definition (`HumanAnatomyShared.CREASE`): the sagitta over
 * a 10 mm chord less the 1 mm a 12.5 mm radius gives, at most 1 mm, so a turn
 * tighter than about 7 mm of radius fails, convex (a rim, a step's edge) or
 * concave (a groove, a step's foot).
 *
 * A region names the stretch of skin where anatomy has no crease of that
 * size: it leaves out the sectors where the body has one (the jugular notch
 * and clavicles in front of the neck base, the axilla under the arm root, the
 * face's sulci), so every remaining sharp turn is a defect of the
 * construction.
 */
export namespace HumanCurveKinks {
  /** A region read for kinks. */
  export interface IRegion {
    /** Name in rows, such as `neck base, lateral and posterior meridians`. */
    name: string;

    /** Catalog rule, such as `STEP-NK-1`. */
    rule: string;

    /** Chains whose skin is cut, by name. */
    chains: RegExp;

    /** The region's axis and extent on a skin. */
    frame: (skin: HumanAnatomy.ISkin, stature: number) => IFrame;

    /** Azimuths read, degrees from the forward reference about the axis (right-handed). */
    azimuths: readonly number[];

    /** Whether the region binds a person, from the person's inputs; absent, every person. */
    applies?: (subject: HumanAnatomyAudit.ISubject) => boolean;
  }

  /** A region's axis and extent on one skin. */
  export interface IFrame {
    /** A point of the axis, mm. */
    origin: V3;

    /** Unit direction of the axis. */
    axis: V3;

    /** The direction azimuth 0 points to, rejected from the axis before use. */
    forward: V3;

    /** Least station along the axis from the origin, mm. */
    from: number;

    /** Largest station along the axis from the origin, mm. */
    to: number;

    /** Largest distance of the skin read from the axis segment, mm. */
    reach: number;
  }

  /** The sharpest turn of one meridian outline. */
  export interface IKink {
    /** Azimuth, degrees. */
    azimuth: number;

    /** Sagitta over the 10 mm chord less the 12.5 mm radius' 1 mm; zero when the outline is missing. */
    excess: number;

    /** Whether the sharpest turn bulges away from the axis (a rim) or toward it (a groove). */
    kind: "rim" | "groove" | "none";

    /** Where, mm. */
    at: V3;

    /** Station along the axis from the origin, mm. */
    station: number;
  }

  /** Half the chord, in 1 mm samples: a 10 mm chord. */
  export const HALF: number = 5;

  /** The sagitta a 12.5 mm radius gives over a 10 mm chord, mm: `12.5 - sqrt(12.5^2 - 5^2)`. */
  export const SMOOTH: number = 12.5 - Math.sqrt(12.5 ** 2 - 25);

  /** Every azimuth's sharpest turn on a skin. */
  export function kinks(skin: HumanAnatomy.ISkin, region: IRegion, stature: number): IKink[] {
    const f: IFrame = region.frame(skin, stature);
    const forward: V3 = A.unit(A.reject(f.forward, f.axis));
    const side: V3 = A.cross(f.axis, forward);
    const keep: boolean[] = skin.chains.map((c: string): boolean => region.chains.test(c));
    const tris: Uint32Array = A.near(skin, A.add(f.origin, A.scale(f.axis, f.from)), A.add(f.origin, A.scale(f.axis, f.to)), f.reach).filter(
      (t: number): boolean => keep[skin.tri[t]!] === true,
    );

    return region.azimuths.map((deg: number): IKink => {
      const a: number = (deg * Math.PI) / 180;
      const d: V3 = A.add(A.scale(forward, Math.cos(a)), A.scale(side, Math.sin(a)));
      const normal: V3 = A.unit(A.cross(f.axis, d));
      let best: IKink = { azimuth: deg, excess: 0, kind: "none", at: f.origin, station: 0 };

      // A rim stands farther from the axis than its chord's middle.
      const radial: (p: V3) => number = (p: V3): number => A.dist(p, A.add(f.origin, A.scale(f.axis, A.dot(A.sub(p, f.origin), f.axis))));

      // Each outline's runs on the azimuth's half-plane within the region's stations.
      for (const line of A.polylines(skin, f.origin, normal, tris)) {
        const runs: V3[][] = [];
        let run: V3[] = [];
        for (const p of line.points) {
          const q: V3 = A.sub(p, f.origin);
          const h: number = A.dot(q, f.axis);
          if (A.dot(q, d) > 0 && h >= f.from && h <= f.to) run.push(p);
          else if (run.length > 0) {
            runs.push(run);
            run = [];
          }
        }
        if (run.length > 0) runs.push(run);

        for (const r of runs) {
          const s: V3[] = HumanAnatomyShared.resample(r, 1);
          for (let i: number = HALF; i + HALF < s.length; i++) {
            const m: V3 = s[i]!;
            const c: V3 = A.lerp(s[i - HALF]!, s[i + HALF]!, 0.5);
            const excess: number = A.dist(m, c) - SMOOTH;
            if (excess <= best.excess) continue;
            best ={ azimuth: deg, excess, kind: radial(m) > radial(c) ? "rim" : "groove", at: m, station: A.dot(A.sub(m, f.origin), f.axis) };
          }
        }
      }
      return best;
    });
  }

  /** The rows of one region on one subject: one per azimuth, its sharpest turn against the crease bound. */
  export function rows(subject: HumanAnatomyAudit.ISubject, region: IRegion, skin: HumanAnatomy.ISkin = subject.bind()): IRow[] {
    const S: number = subject.params.body.controls.height.value!;
    return kinks(skin, region, S).map(
      (k: IKink): IRow => ({
        person: subject.name,
        site: `${region.name}, azimuth ${k.azimuth} deg: sharpest ${k.kind} over a 10 mm chord past a 12.5 mm radius, at station ${k.station.toFixed(0)} mm, point ${k.at.map((v: number): string => v.toFixed(0)).join(" ")} (${region.rule})`,
        value: k.excess,
        low: 0,
        high: HumanAnatomyShared.CREASE,
        unit: "mm",
      }),
    );
  }

  /**
   * A copy of a skin with a ridge raised round a region's axis at one
   * station: every vertex of the region's chains moved away from the axis by
   * `height * exp(-(h - station)^2 / (2 width^2))`, a Gaussian ring of known
   * height and width. Its sagitta over a 10 mm chord at the crest is
   * `height * (1 - exp(-25 / (2 width^2)))` above the skin's own, so a ring
   * 3 mm high and 2 mm wide raises the reading by about 2.9 mm.
   */
  export function ridge(skin: HumanAnatomy.ISkin, region: IRegion, stature: number, station: number, height: number, width: number): HumanAnatomy.ISkin {
    const f: IFrame = region.frame(skin, stature);
    const keep: boolean[] = skin.chains.map((c: string): boolean => region.chains.test(c));
    const moved: Uint8Array = new Uint8Array(skin.P.length / 3);
    for (let t: number = 0; t < skin.tri.length; t++) if (keep[skin.tri[t]!] === true) for (let k: number = 0; k < 3; k++) moved[skin.I[3 * t + k]!] = 1;
    const P: Float64Array = Float64Array.from(skin.P);
    for (let v: number = 0; v < moved.length; v++) {
      if (moved[v] === 0) continue;
      const p: V3 = A.point(skin, v);
      const q: V3 = A.sub(p, f.origin);
      const h: number = A.dot(q, f.axis);
      const out: V3 = A.reject(q, f.axis);
      const r: number = Math.hypot(out[0], out[1], out[2]);
      if (r === 0) continue;
      const lift: number = height * Math.exp(-((h - station) ** 2) / (2 * width * width));
      for (let k: number = 0; k < 3; k++) P[3 * v + k] = p[k]! + (out[k]! / r) * lift;
    }
    return { ...skin, name: `${skin.name} with a ridge`, P };
  }
}
