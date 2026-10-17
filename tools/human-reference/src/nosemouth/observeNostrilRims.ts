import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { centroid2 } from "../geometry/centroid2.ts";
import { contains } from "../geometry/contains.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { r3 as r } from "../geometry/r3.ts";
import { sub } from "../geometry/sub.ts";
import { to2 } from "../geometry/to2.ts";
import type { HeadContext as Ctx } from "../headneck/HeadContext.ts";
import type { HeadFrame } from "../headneck/HeadFrame.ts";
import { P } from "../headneck/P.ts";
import { createSection as section } from "../headneck/createSection.ts";
import { isoContour } from "../headneck/isoContour.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";

/**
 * Observes closed nasal pit sections and normal-turning rim candidates.
 * Auxiliary area centroids define the pit axis; a missing closed loop remains
 * absent rather than receiving an invented aperture or a fallback contour.
 *
 * @evidence contracts/common.md#principled-implementation Exact planar pit contours and interpolated normal iso-contours preserve source support under an explicitly conventional angular threshold.
 * @evidence contracts/common.md#clear-and-simple-design This nasal sub-operation owns pit-axis selection, auxiliary centres and turning-rim observations together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing candidates remain absent; no source index table, copied mesh or clinical aperture identity is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the auxiliary-centroid method, turning-contour meaning and explicit absence policy.
 * @evidence contracts/performance.md#efficient-algorithms S physical pit cuts scan T source triangles, followed by local normal iso-contour scans and contour selection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns the immutable context and this operation coordinates no request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only selected source observations are appended to the caller-owned region; temporary cut arrays retain no handles or tasks.
 */
export function observeNostrilRims(
  c: Ctx,
  hf: HeadFrame,
  R: RegionFile,
  noseBox: (i: number) => boolean,
  y0: number,
  y1: number,
): void {
  const s: Skin = c.s;
  const prn: V3 = hf.mid.pronasale.p,
    sn: V3 = hf.mid.subnasale.p;
  // ---- nostril pits: lowest level where a closed pit loop exists on each side ----
  const pits: Record<
    "l" | "r",
    { lo: V2 | null; y: number; c3: V3 | null; hi: V3 | null }
  > = {
    l: { lo: null, y: 0, c3: null, hi: null },
    r: { lo: null, y: 0, c3: null, hi: null },
  };
  for (let y: number = sn[1] - 6; y < prn[1] + 4; y += 0.25) {
    const pl: Plane = planeFrame([0, y, 0], [0, 1, 0], [0, 0, -1]);
    for (const poly of cut(s, pl, noseBox)) {
      if (!poly.closed || poly.pts.length < 8) continue;
      const pts: V3[] = P(poly);
      const centre: V2 = centroid2(pts.map((p: V3): V2 => [p[0], p[2]]));
      const cx: number = centre[0],
        cz: number = centre[1];
      const w: number =
        Math.max(...pts.map((p: V3): number => p[0])) -
        Math.min(...pts.map((p: V3): number => p[0]));
      if (Math.abs(cx) < 2 || Math.abs(cx) > 20 || w > 20 || cz < sn[2] - 15)
        continue;
      const side: "r" | "l" = cx > 0 ? "l" : "r";
      if (!pits[side].c3)
        pits[side] = { lo: [cx, cz], y, c3: [cx, y, cz], hi: null };
      else if (!pits[side].hi && y > pits[side].y + 4)
        pits[side].hi = [cx, y, cz];
    }
  }
  for (const side of ["l", "r"] as const) {
    const pit: { lo: V2 | null; y: number; c3: V3 | null; hi: V3 | null } =
      pits[side];
    if (!pit.c3 || !pit.hi) {
      R.limits.push(
        `nostril ${side}: no closed pit loop found in level cuts; rim not reported`,
      );
      continue;
    }
    const axis: V3 = norm(sub(pit.hi, pit.c3)); // up into the pit
    // rim: iso-contour of the outward normal component along -axis at 0.5 (surface tilted 60 deg from facing straight
    // out of the opening), the lowest closed contour enclosing the pit axis
    const f: Float64Array<ArrayBuffer> = new Float64Array(
      s.vertices.length,
    ).fill(NaN);
    s.vertices.forEach((p: V3, i: number): void => {
      if (dist(p, pit.c3!) < 18) f[i] = dot(c.vn[i], mul(axis, -1));
    });
    const fr: Plane = planeFrame(pit.c3, mul(axis, -1), [0, 0, 1]); // normal out of the opening (down), v = anterior projected
    const loops: Polyline[] = isoContour(s, f, 0.5).filter(
      (l: Polyline): boolean => l.closed && l.pts.length > 10,
    );
    let bestL: Polyline | null = null,
      bestH: number = Infinity;
    for (const l of loops) {
      const uv: V2[] = P(l).map((p: V3): V2 => to2(fr, p));
      if (!contains(uv, [0, 0])) continue;
      const h: number =
        P(l).reduce(
          (a: number, p: V3): number => a + dot(sub(p, pit.c3!), axis),
          0,
        ) / l.pts.length;
      if (h < bestH) {
        bestH = h;
        bestL = l;
      }
    }
    if (!bestL) {
      R.limits.push(
        `nostril ${side}: no normal-component contour encloses the pit axis; rim not reported`,
      );
      continue;
    }
    const rec: LoopRecord = orientLoop(fr, bestL, "other", [0, 0]);
    R.loops.push({
      id: `face-nose.${side}.nostril-rim`,
      name: `${side === "l" ? "left" : "right"} nostril rim (lip where the downward nose base turns into the nostril wall)`,
      kind: "rim",
      side,
      pose: "native-A",
      closed: true,
      frame: { origin: r(pit.c3), normal: fr.n, u: fr.u, v: fr.v },
      method: `pit axis from the projected polygon area centroids of the lowest closed level-cut pit loop (y=${pit.y.toFixed(2)}) and the pit loop at least 4 mm higher; rim = iso-contour 0.5 of the outward vertex normal component along the outward pit axis (surface at 60 deg to the opening), linear on skin triangles, the lowest closed contour enclosing the pit axis; CCW seen from below along the pit axis`,
      confidence: "medium",
      points: rec.points,
    });
    // inner pit loop at the lowest level, for reference as a section
    const plP: Plane = planeFrame([0, pit.y, 0], [0, 1, 0], [0, 0, -1]);
    const sec: Section = section(
      c,
      `face-nose.pit.${side}`,
      "face-nose.h",
      {
        fraction: (pit.y - y0) / (y1 - y0),
        mm: pit.y,
        definition:
          "lowest level with a closed nostril-pit loop (0.25 mm search)",
      },
      plP,
      noseBox,
      (p: Polyline, rec2: LoopRecord): "selected" | null => {
        if (!p.closed) return null;
        const cx: number =
          rec2.points.reduce((a: number, q: V3): number => a + q[0], 0) /
          rec2.points.length;
        return Math.sign(cx) === (side === "l" ? 1 : -1) &&
          Math.abs(cx) > 2 &&
          Math.abs(cx) < 20
          ? "selected"
          : null;
      },
    );
    sec.statusNote = "only the nostril-pit loop of this side is kept";
    R.sections.push(sec);
    R.landmarks.push({
      id: `face-nose.lm.${side}.nostril-pit-centre`,
      name: `${side === "l" ? "left" : "right"} nostril pit centre at its lowest closed level (geometric, inside the pit, not on skin)`,
      p: r(pit.c3),
      pose: "native-A",
      method:
        "projected polygon area centroid of the lowest closed level-cut pit loop; auxiliary coordinate, not a skin landmark",
      confidence: "medium",
    });
  }
}
