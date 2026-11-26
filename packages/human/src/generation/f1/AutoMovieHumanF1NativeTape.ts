import { AutoMovieHumanF1NativeCalibration } from "./AutoMovieHumanF1NativeCalibration";
import { AutoMovieLoftViewFullSource as Full, AutoMovieEngineMath, AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieHumanF1Engineering,
  IAutoMovieLoftViewFullSource,
  IAutoMovieVector3,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Read F1 native source tapes. */
export namespace AutoMovieHumanF1NativeTape {
  /**
   * Finite source tapes for the F1 engineering constraint owner, without a loft or final mesh.
   * The trunk rings read the full native source of the bare wall, every relief excluded, and the convex hull
   * bridges every cleft, as a taut tape does (ISO 8559-1 girths are taken over the skin). The breast cap is read
   * through NativeProfile's planar conics; it carries no relief. Bust uses the most anterior retained sampled cap
   * point's horizontal plane and actual native curve-plane crossings. Other tapes use their declared material
   * planes, including the qualified neck-skin proxy rather than claiming an unavailable infrathyroid plane.
   * The optional report counts actual native source preparations, point calls
   * and latest-station cache misses under valid source queries, with wall time.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing native point owners, bracketed plane intersections and convexHull2D construct a taut-source hull; finite angular/apex samples are an explicit numerical observation, not a continuous contour certificate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One native preparation per supplied trunk/breast serves every point and all five tape readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads no reference, completed part or mesh; reliefs and bands stay excluded, and missing crossings/native values are not filled with zeros.
   * @evidence contracts/development/common.md#meaningful-documentation Names physical mm, bare-source scope, material/plane definitions and finite-sampling limits.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N*P) apex/plane samples and bounded existing bracket solves precede O(K log K) hulls; N=64 longitudinal samples and P is the explicit angular count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each immutable native source preparation and its latest-station conic are reused across the reading; the caller supplies the actual source revision.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All preparations and bounded point arrays have call lifetime; only physical scalar tape readings survive.
   */
  export function read(
    parts: { trunk: IAutoMovieViewPart; breast: IAutoMovieViewPart },
    revision: string,
    phases: number,
    report?: (counts: {
      sourcePreparations: number;
      pointCalls: number;
      stationPreparations: number;
      elapsedMs: number;
    }) => void,
  ): IAutoMovieHumanF1Engineering.IReading {
    if (!(Number.isInteger(phases) && phases >= 32) || revision.length === 0)
      throw new Error(
        "native tape needs a source revision and at least32 angular samples",
      );
    const began: number = performance.now();
    let sourcePreparations: number = 0,
      pointCalls: number = 0,
      stationPreparations: number = 0;
    try {
      const prepare = (part: IAutoMovieViewPart) => {
        const native = AutoMovieEngineConstruction.constructionNativeProfile(part, {
          material: "f1.provisional.bare",
          binding: revision + ":" + part.name,
          revisions: {
            source: revision,
            constraints: revision + ":tape",
            topology: revision + ":native-loop",
          },
        });
        sourcePreparations++;
        const curve = native.curves.values().next().value;
        if (curve === undefined)
          throw new Error("bare native curve missing: " + part.name);
        let latest: number | undefined;
        return (s: number, t: number): IAutoMovieVector3 => {
          pointCalls++;
          if (latest !== s) {
            stationPreparations++;
            latest = s;
          }
          const p = curve.point(s, t);
          const f = part.axis.at(s);
          const q = {
            x: f.origin[0] + p[0] * f.u[0] + p[1] * f.v[0],
            y: f.origin[1] + p[0] * f.u[1] + p[1] * f.v[1],
            z: f.origin[2] + p[0] * f.u[2] + p[1] * f.v[2],
          };
          if (![q.x, q.y, q.z].every(Number.isFinite))
            throw new Error("nonfinite native tape point");
          return q;
        };
      };
      // The trunk rings read the bare wall; every relief stays excluded so the wall tapes scale exactly.
      const skin: IAutoMovieLoftViewFullSource.IReader = Full.create({
        ...parts.trunk,
        reliefs: undefined,
      });
      sourcePreparations++;
      const trunk = (s: number, t: number): IAutoMovieVector3 => {
        pointCalls++;
        const p = skin.point(s, t);
        if (!p.every(Number.isFinite)) throw new Error("nonfinite native tape point");
        return { x: p[0]!, y: p[1]!, z: p[2]! };
      };
      const breast = prepare(parts.breast);
      const ring = (s: number): IAutoMovieVector3[] =>
        Array.from({ length: phases }, (_, k) =>
          trunk(s, (2 * Math.PI * k) / phases),
        );
      const perimeter = (points: IAutoMovieVector3[]): number => {
        const hull = AutoMovieEngineMath.convexHull2D(points);
        if (hull.length < 3) throw new Error("bare tape hull is not a loop");
        return hull.reduce(
          (sum: number, p: IAutoMovieVector3, k: number): number => {
            const next = hull[(k + 1) % hull.length]!;
            return sum + Math.hypot(next.x - p.x, next.z - p.z);
          },
          0,
        );
      };
      const domain: readonly [number, number] = [
        parts.breast.stations[0]!,
        parts.breast.stations.at(-1)!,
      ];
      const addresses: number[] = Array.from(
        { length: 65 },
        (_, k) => domain[0] + ((domain[1] - domain[0]) * k) / 64,
      );
      let apex: IAutoMovieVector3 = breast(domain[0], 0);
      for (const s of addresses)
        for (let k: number = 0; k < phases; k++) {
          const p = breast(s, (2 * Math.PI * k) / phases);
          if (p.x > apex.x) apex = p;
        }
      const frame = parts.trunk.axis.at(0),
        next = parts.trunk.axis.at(1);
      const rise: number = next.origin[1] - frame.origin[1];
      if (
        !(rise > 0) ||
        Math.abs(frame.u[1]) + Math.abs(frame.v[1]) > 64 * Number.EPSILON
      )
        throw new Error(
          "native tape's trunk requires its declared straight horizontal planes",
        );
      const station: number = (apex.y - frame.origin[1]) / rise;
      if (
        !(
          station >= parts.trunk.stations[0]! &&
          station <= parts.trunk.stations.at(-1)!
        )
      )
        throw new Error("bust plane leaves the trunk source domain");
      const points: IAutoMovieVector3[] = ring(station);
      const bareBust: number = perimeter(points);
      for (let k: number = 0; k < phases; k++) {
        const t: number = (2 * Math.PI * k) / phases;
        for (let j: number = 0; j + 1 < addresses.length; j++) {
          const a: number = addresses[j]!,
            b: number = addresses[j + 1]!;
          const fa: number = breast(a, t).y - apex.y,
            fb: number = breast(b, t).y - apex.y;
          if (fa !== 0 && fb !== 0 && fa * fb > 0) continue;
          const s: number =
            fa === 0
              ? a
              : fb === 0
                ? b
                : AutoMovieEngineMath.bracketedRoot(
                    (x: number): number => breast(x, t).y - apex.y,
                    a,
                    b,
                    1e-7,
                    40,
                  );
          const p = breast(s, t);
          points.push(p, { x: p.x, y: p.y, z: -p.z });
        }
      }
      // Each wall tape lies in its site's plane, read by the site's field name from the calibration's list, whose stations come from the
      // one site owner (`AutoMovieHumanF1NativeSites`), so a tape and the caliper of the same site read one section. The bust tape keeps
      // its own plane through the breast's apex, above.
      const site = (field: (typeof AutoMovieHumanF1NativeCalibration.WALL)[number][0]): number => {
        const found = AutoMovieHumanF1NativeCalibration.WALL.find(
          ([name]): boolean => name === field,
        );
        if (found === undefined)
          throw new Error("native tape: the wall has no site " + field);
        return found[1];
      };
      const result: IAutoMovieHumanF1Engineering.IReading = {
        bareBust,
        girths: {
          hip: perimeter(ring(site("hipSkin"))),
          omphalion: perimeter(ring(site("omphalionWall"))),
          underbust: perimeter(ring(site("underbustWall"))),
          bust: perimeter(points),
          neck: perimeter(ring(site("neckSkin"))),
        },
      };
      return result;
    } finally {
      report?.({
        sourcePreparations,
        pointCalls,
        stationPreparations,
        elapsedMs: performance.now() - began,
      });
    }
  }
}
