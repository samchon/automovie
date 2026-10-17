import type { Plane } from "../geometry/Plane.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cross } from "../geometry/cross.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { r3 as r } from "../geometry/r3.ts";
import { sub } from "../geometry/sub.ts";
import type { HeadContext as Ctx } from "../headneck/HeadContext.ts";
import type { HeadFrame } from "../headneck/HeadFrame.ts";
import { P } from "../headneck/P.ts";
import { locate } from "../headneck/locate.ts";
import { polyLen } from "../headneck/polyLen.ts";
import { walkFrom } from "../headneck/walkFrom.ts";
import type { Course } from "../schema/Course.ts";
import type { CourseStation } from "../schema/CourseStation.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import { joinCourse } from "../schema/joinCourse.ts";

type AlarStation = CourseStation & { turnDeg: number };
function turnAt(q: V2[], arc: number[], i: number, win: number): number | null {
  let a: number = i,
    b: number = i;
  while (a > 0 && arc[i] - arc[a] < win) a--;
  while (b < q.length - 1 && arc[b] - arc[i] < win) b++;
  if (arc[i] - arc[a] < win * 0.7 || arc[b] - arc[i] < win * 0.7) return null;
  const t1: number = Math.atan2(q[i][1] - q[a][1], q[i][0] - q[a][0]),
    t2: number = Math.atan2(q[b][1] - q[i][1], q[b][0] - q[i][0]);
  let t: number = t2 - t1;
  while (t > Math.PI) t -= 2 * Math.PI;
  while (t < -Math.PI) t += 2 * Math.PI;
  return (t * 180) / Math.PI;
}

/**
 * Tracks alar source relief through right-handed radial plane sections.
 * Turning angles select geometric groove candidates; chord sag records their
 * physical depth in millimetres, and missing angular sectors remain gaps.
 *
 * @evidence contracts/common.md#principled-implementation Source-plane arcs and physical-window tangent turns locate candidate relief without changing the observed skin.
 * @evidence contracts/common.md#clear-and-simple-design One operation owns the radial frame, selected arcs, dimensional prominence and source-supported guide pieces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Angular stations carry degrees, missing sectors are not bridged and no identity coordinates or source topology are emitted as a reconstructed mesh.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes angular selection from physical sag and geometric candidates from clinical landmarks.
 * @evidence contracts/performance.md#efficient-algorithms R radial cuts scan T source triangles; neighboring source-path joins add repeated local cuts while each turning window scans its selected curve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The operation uses a caller-owned immutable context and owns no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Observed guide arrays are returned through the caller-owned region; temporary source arcs retain no external resources.
 */
export function observeAlarGrooves(c: Ctx, hf: HeadFrame, R: RegionFile): void {
  const s: Skin = c.s;
  const prn: V3 = hf.mid.pronasale.p,
    sn: V3 = hf.mid.subnasale.p;
  // ---- alare: widest nose point in the level cuts below the tip region ----
  for (const side of ["l", "r"] as const) {
    const sg: 1 | -1 = side === "l" ? 1 : -1;
    let best: V3 | null = null,
      bsec: string = "";
    for (const sec of R.sections.filter(
      (x: Section): boolean =>
        x.family === "face-nose.h" &&
        typeof x.station.mm === "number" &&
        x.station.mm < prn[1] &&
        x.station.mm > sn[1] - 4,
    ))
      for (const l of sec.loops)
        for (const p of l.points)
          if (
            p[2] > sn[2] - 18 &&
            Math.abs(p[0]) < 28 &&
            (!best || sg * p[0] > sg * best[0])
          ) {
            best = p;
            bsec = sec.id;
          }
    if (!best) continue;
    R.landmarks.push({
      id: `face-nose.lm.${side}.alare`,
      name: `${side === "l" ? "left" : "right"} widest ala point (alare, inference)`,
      p: r(best),
      pose: "native-A",
      method:
        "extreme |x| over the nose level-cut points between subnasale - 4 mm and the pronasale level, restricted to z > subnasale z - 18 mm",
      confidence: "medium",
      section: bsec,
    });
    // radial sections about the ala: axis through a point 5 mm inside alare along the ala surface normal
    const ci: { d: number; q: V3; tri: number } = c.idx.closest(best);
    const nrm: V3 = norm(
      add(
        add(c.vn[s.triangles[ci.tri][0]], c.vn[s.triangles[ci.tri][1]]),
        c.vn[s.triangles[ci.tri][2]],
      ),
    );
    const ctr: V3 = sub(best, mul(nrm, 5));
    const fr: Plane = planeFrame(ctr, nrm, [0, 1, 0]);
    const fam: string = `face-nose.${side}.alar-radial`;
    R.families.push({
      id: fam,
      kind: "radial",
      axis: `line along the outward skin normal at the ${side} alare, through a point 5 mm inside it`,
      fraction0: "phase 0 = inferior (-v)",
      fraction1: "phase 360; fraction = phase / 360",
      reference: "v = superior (+Y) projected; u = v x n",
      phaseLabels: {
        "0": "inferior",
        "90": fr.u[2] > 0 ? "anterior (+u)" : "posterior (+u)",
        "180": "superior",
        "270": fr.u[2] > 0 ? "posterior (-u)" : "anterior (-u)",
      },
    });
    const groove: AlarStation[] = [];
    const nearA: (i: number) => boolean = (i: number): boolean =>
      s.triangles[i].every(
        (v: number): boolean => dist(s.vertices[v], ctr) < 26,
      );
    for (let ph: number = 0; ph < 360; ph += 10) {
      const ang: number = ((ph - 90) * Math.PI) / 180;
      const dir: V3 = add(mul(fr.u, Math.cos(ang)), mul(fr.v, Math.sin(ang)));
      // keep phases that do not point toward the nostril/tip (anterior-inferior) quadrant
      const towardFront: boolean = dot(dir, [0, 0, 1]) > 0.35 && dir[1] < 0.2;
      if (towardFront) continue;
      const pn: V3 = norm(cross(dir, nrm));
      const pl: Plane = { origin: ctr, n: pn, u: dir, v: nrm };
      let host: V3[] | null = null,
        hs: number = 0,
        hd: number = Infinity,
        hc: boolean = false;
      for (const poly of cut(s, pl, nearA)) {
        const pp: V3[] = P(poly);
        const l: { s: number; d: number } = locate(pp, poly.closed, best);
        // the ray from ctr along nrm meets the skin at alare only at phase-independent point: use the point nearest alare
        if (l.d < hd) {
          hd = l.d;
          host = pp;
          hs = l.s;
          hc = poly.closed;
        }
      }
      if (!host || hd > 0.5) continue;
      const rad: (p: V3) => number = (p: V3): number => dot(sub(p, ctr), dir);
      const A: V3[] = walkFrom(host, hc, hs, 1),
        B: V3[] = walkFrom(host, hc, hs, -1);
      const trim: (arr: V3[]) => V3[] = (arr: V3[]): V3[] => {
        const out: V3[] = [];
        for (const p of arr) {
          out.push(p);
          if (rad(p) > 20) break;
        }
        return out;
      };
      const a1: V3[] = trim(A),
        b1: V3[] = trim(B);
      const arcPts: V3[] =
        (a1.length > 1 ? rad(a1[a1.length - 1]) : -1e9) >=
        (b1.length > 1 ? rad(b1[b1.length - 1]) : -1e9)
          ? a1
          : b1;
      if (arcPts.length < 5) continue;
      const id: string = `${fam}.${String(ph * 10).padStart(4, "0")}`;
      const uv: V2[] = arcPts.map(
        (p: V3): V2 => [rad(p), dot(sub(p, ctr), nrm)] as V2,
      );
      R.sections.push({
        id,
        family: fam,
        station: {
          fraction: ph / 360,
          deg: ph,
          definition:
            "phase in degrees about the ala axis; no linear station coordinate",
        },
        pose: "native-A",
        plane: { origin: r(ctr), normal: pn, u: dir, v: nrm },
        status: "clipped",
        statusNote:
          "open arc from the point nearest alare outward to 20 mm radial distance; in-plane frame u = radial, v = ala axis",
        loops: [
          {
            role: "clipped-arc",
            closed: false,
            points: arcPts,
            uv,
            perimeter: polyLen(arcPts),
            convexPerimeter: null,
            area: null,
            breadthU:
              Math.max(...uv.map((q: V2): number => q[0])) -
              Math.min(...uv.map((q: V2): number => q[0])),
            depthV:
              Math.max(...uv.map((q: V2): number => q[1])) -
              Math.min(...uv.map((q: V2): number => q[1])),
          },
        ],
      });
      // Turning selects the groove; physical prominence measures its depth below the 2..16 mm sub-arc chord.
      const arc: number[] = [0];
      for (let k: number = 1; k < uv.length; k++)
        arc.push(
          arc[k - 1] +
            Math.hypot(uv[k][0] - uv[k - 1][0], uv[k][1] - uv[k - 1][1]),
        );
      let bk: number = -1,
        bt: number = -Infinity;
      for (let k: number = 0; k < uv.length; k++) {
        if (uv[k][0] < 2 || uv[k][0] > 16) continue;
        const t: number | null = turnAt(uv, arc, k, 2);
        if (t !== null && t > bt) {
          bt = t;
          bk = k;
        }
      }
      if (bk >= 0 && bt > 12) {
        const candidates: V2[] = uv.filter(
          (q: V2): boolean => q[0] >= 2 && q[0] <= 16,
        );
        const first: V2 = candidates[0],
          last: V2 = candidates[candidates.length - 1];
        const dx: number = last[0] - first[0],
          dy: number = last[1] - first[1];
        const depth: number =
          -(dx * (uv[bk][1] - first[1]) - dy * (uv[bk][0] - first[0])) /
          (Math.hypot(dx, dy) || 1);
        groove.push({
          section: id,
          p: arcPts[bk],
          phaseDeg: ph,
          prominenceMm: Math.max(0, depth),
          turnDeg: bt,
          plane: { origin: ctr, normal: pn, u: dir, v: nrm },
        });
      }
    }
    // order by phase going from the superior side over the posterior side to the inferior side
    const post: 90 | 270 = fr.u[2] > 0 ? 270 : 90;
    const key: (ph: number) => number = (ph: number): number =>
      ((ph - 180) * (post === 270 ? 1 : -1) + 360) % 360;
    const st: AlarStation[] = [...groove].sort(
      (a: AlarStation, b: AlarStation): number =>
        key(a.phaseDeg) - key(b.phaseDeg),
    );
    if (st.length >= 2) {
      const j: {
        pieces: V3[][];
        gaps: { from: string; to: string; reason: string }[];
      } = joinCourse(s, c.idx, st, 3, (i: number): string | null =>
        key(st[i].phaseDeg) - key(st[i - 1].phaseDeg) > 15
          ? "Unobserved intermediate radial angle"
          : null,
      );
      R.courses.push({
        id: `face-nose.${side}.course.alar-groove`,
        name: `${side === "l" ? "left" : "right"} alar groove (concave course around the ala, superior over posterior to inferior)`,
        kind: "groove",
        pose: "native-A",
        family: fam,
        method:
          "Per radial section about the ala axis (10 deg, anterior-inferior quadrant toward the nostril and tip excluded), the maximum concave turning (+-2 mm arc window) between 2 and 16 mm radial distance, kept above 12 deg. turnDeg stores that angle; prominenceMm is nonnegative perpendicular sag below the selected 2..16 mm sub-arc endpoint chord. Joined by schema surfacePath.",
        confidence: "medium",
        confidenceBasis: `${st.length} stations; turn median ${st
          .map((x: AlarStation): number => x.turnDeg)
          .sort((a: number, b: number): number => a - b)
          [Math.floor(st.length / 2)].toFixed(0)} deg`,
        stations: st,
        pieces: j.pieces,
        ...(j.gaps.length ? { gaps: j.gaps } : {}),
      } as Course);
    } else
      R.limits.push(
        `alar groove ${side}: fewer than two stations met the rule`,
      );
  }
}
