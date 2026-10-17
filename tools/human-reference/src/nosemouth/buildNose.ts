import { fileURLToPath } from "node:url";

import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { r3 as r } from "../geometry/r3.ts";
import type { HeadContext as Ctx } from "../headneck/HeadContext.ts";
import type { HeadFrame } from "../headneck/HeadFrame.ts";
import type { MidPoint } from "../headneck/MidPoint.ts";
import { createRegion as region } from "../headneck/createRegion.ts";
import { createSection as section } from "../headneck/createSection.ts";
import { polyLen } from "../headneck/polyLen.ts";
import type { Course } from "../schema/Course.ts";
import type { Landmark } from "../schema/Landmark.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import { observeAlarGrooves } from "./observeAlarGrooves.ts";
import { observeNostrilRims } from "./observeNostrilRims.ts";

const TOOL: string = fileURLToPath(import.meta.url);

/**
 * Observes nasal source sections, turning rims, alar grooves and the midsagittal
 * profile. Physical search windows and normal thresholds are extraction
 * conventions, not clinical dimensions. Nostril centres are auxiliary points;
 * turning loops are not free skin apertures or an accepted generated surface.
 *
 * @evidence contracts/common.md#principled-implementation Plane/source-edge cuts, interpolated normal iso-contours and physical-window curvature tracks preserve measured source skin while keeping inferred feature rules explicit.
 * @evidence contracts/common.md#clear-and-simple-design One nasal region owns its sections, auxiliary centres, feature courses and unresolved semantic limits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source vertex indices or identity coordinates are embedded; unsupported radial joins remain gaps, and angular stations carry deg rather than millimetres.
 * @evidence contracts/common.md#meaningful-documentation States geometric inference, dimensional search rules, auxiliary observations and the limit of turning-rim correspondence.
 * @evidence contracts/performance.md#efficient-algorithms S source-plane cuts and local iso-contours scan T skin triangles; source-path joins add bounded repeated cuts per adjacent feature station, while each local turn window scans its curve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller supplies one immutable indexed context; this operation owns no request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary source cuts are released per station; the returned regional arrays retain only observed curves and provenance, without handles or running tasks.
 */
export function buildNose(c: Ctx, hf: HeadFrame): RegionFile {
  const R: RegionFile = region(c, "face-nose", TOOL);
  const s: Skin = c.s;
  const m: Record<string, MidPoint> = hf.mid;
  const prn: V3 = m.pronasale.p,
    sn: V3 = m.subnasale.p,
    se: V3 = m.sellion.p;
  const noseBox: (i: number) => boolean = (i: number): boolean =>
    s.triangles[i].every((v: number): boolean => {
      const p: V3 = s.vertices[v];
      return (
        Math.abs(p[0]) < 32 &&
        p[2] > sn[2] - 28 &&
        p[1] > sn[1] - 12 &&
        p[1] < se[1] + 8
      );
    });
  // ---- level sections sellion -> subnasale - 4 mm ----
  R.families.push({
    id: "face-nose.h",
    kind: "level",
    axis: "world +Y",
    fraction0: `sellion level y=${se[1].toFixed(3)}`,
    fraction1: `subnasale level - 4 mm y=${(sn[1] - 4).toFixed(3)}`,
    reference: "v = posterior (-Z); u = v x n",
    phaseLabels: {
      "0": "anterior",
      "90": "+u",
      "180": "posterior",
      "270": "-u",
    },
  });
  const y0: number = se[1],
    y1: number = sn[1] - 4;
  for (let k: number = 0; k <= 20; k++) {
    const f: number = k / 20,
      y: number = y0 + f * (y1 - y0);
    const pl: Plane = planeFrame([0, y, sn[2]], [0, 1, 0], [0, 0, -1]);
    const sec: Section = section(
      c,
      `face-nose.h.${String(k * 50).padStart(4, "0")}`,
      "face-nose.h",
      {
        fraction: f,
        mm: y,
        definition: "y = y_sellion + f (y_subnasale - 4 mm - y_sellion)",
      },
      pl,
      noseBox,
      (_p: Polyline, rec: LoopRecord): "other" | "clipped-arc" | null =>
        rec.points.length > 1 ? (rec.closed ? "other" : "clipped-arc") : null,
    );
    sec.status = "clipped";
    sec.statusNote =
      "cut limited to skin triangles with |x| < 32 mm, z > subnasale z - 28 mm, y within subnasale - 12 .. sellion + 8 mm; closed loops are nostril-pit walls (role other)";
    R.sections.push(sec);
  }
  R.families[0].phaseLabels = {
    "0": "anterior",
    "90":
      planeFrame([0, 0, 0], [0, 1, 0], [0, 0, -1]).u[0] > 0
        ? "subject-left"
        : "subject-right",
    "180": "posterior",
    "270":
      planeFrame([0, 0, 0], [0, 1, 0], [0, 0, -1]).u[0] > 0
        ? "subject-right"
        : "subject-left",
  };
  // ---- sagittal sections x = +-3..+-18 ----
  R.families.push({
    id: "face-nose.sag",
    kind: "sagittal",
    axis: "world +X",
    fraction0: "x = 0",
    fraction1: "x = 18 mm (fraction = x / 18, negative subject-right)",
    reference: "v = posterior (-Z); u = v x n",
    phaseLabels: { "0": "anterior", "180": "posterior" },
  });
  for (const x of [3, -3, 6, -6, 9, -9, 12, -12, 15, -15, 18, -18]) {
    const pl: Plane = planeFrame([x, 0, 0], [1, 0, 0], [0, 0, -1]);
    const sec: Section = section(
      c,
      `face-nose.sag.${x < 0 ? "r" : "l"}${String(Math.abs(x)).padStart(3, "0")}`,
      "face-nose.sag",
      { fraction: x / 18, mm: x, definition: "x = fraction * 18 mm" },
      pl,
      noseBox,
      (_p: Polyline, rec: LoopRecord): "other" | "clipped-arc" | null =>
        rec.points.length > 1 ? (rec.closed ? "other" : "clipped-arc") : null,
    );
    sec.status = "clipped";
    sec.statusNote = "same nose box clip as face-nose.h";
    R.sections.push(sec);
  }
  observeNostrilRims(c, hf, R, noseBox, y0, y1);
  observeAlarGrooves(c, hf, R);
  // ---- midline courses from the head frame profile ----
  const prof: V3[] = hf.profile;
  const dorsum: V3[] = prof.slice(m.sellion.i, m.pronasale.i + 1);
  const columella: V3[] = prof.slice(m.pronasale.i, m.subnasale.i + 1);
  R.courses.push(
    {
      id: "face-nose.course.dorsum",
      name: "nasal dorsum midline, sellion to pronasale",
      kind: "midline",
      pose: "native-A",
      family: "head.sag",
      method:
        "sub-arc of the x = 0 plane cut of the skin (head.json midsagittal course) between the sellion and pronasale observations",
      confidence: "high",
      confidenceBasis: "single plane cut",
      stations: [
        { section: "head.sag.m000", p: m.sellion.p, phaseDeg: 0 },
        { section: "head.sag.m000", p: m.pronasale.p, phaseDeg: 0 },
      ],
      pieces: [dorsum],
    } as Course,
    {
      id: "face-nose.course.columella",
      name: "columella and lobule underside midline, pronasale to subnasale",
      kind: "midline",
      pose: "native-A",
      family: "head.sag",
      method:
        "sub-arc of the x = 0 plane cut of the skin between the pronasale and subnasale observations",
      confidence: "high",
      confidenceBasis: "single plane cut",
      stations: [
        { section: "head.sag.m000", p: m.pronasale.p, phaseDeg: 0 },
        { section: "head.sag.m000", p: m.subnasale.p, phaseDeg: 0 },
      ],
      pieces: [columella],
    } as Course,
  );
  R.landmarks.push(
    {
      id: "face-nose.lm.sellion",
      name: "sellion (deepest nasal root, midsagittal)",
      p: r(se),
      pose: "native-A",
      method: m.sellion.method,
      confidence: "high",
      section: "head.sag.m000",
    },
    {
      id: "face-nose.lm.pronasale",
      name: "pronasale (midsagittal tip)",
      p: r(prn),
      pose: "native-A",
      method: m.pronasale.method,
      confidence: "high",
      section: "head.sag.m000",
    },
    {
      id: "face-nose.lm.subnasale",
      name: "subnasale (midsagittal nasolabial apex)",
      p: r(sn),
      pose: "native-A",
      method: m.subnasale.method,
      confidence: "high",
      section: "head.sag.m000",
    },
  );
  const lm: (id: string) => V3 | undefined = (id: string): V3 | undefined =>
    R.landmarks.find((l: Landmark): boolean => l.id === id)?.p;
  const al: V3 | undefined = lm("face-nose.lm.l.alare"),
    ar: V3 | undefined = lm("face-nose.lm.r.alare");
  const measures: NonNullable<RegionFile["measures"]> =
    R.measures ?? (R.measures = []);
  if (al && ar)
    measures.push({
      id: "face-nose.measure.alar-width",
      name: "nose width al-al",
      value: dist(al, ar),
      unit: "mm",
      pose: "native-A",
      method: "3D chord between the alare observations",
    });
  measures.push(
    {
      id: "face-nose.measure.sellion-subnasale",
      name: "nasal height se-sn",
      value: dist(se, sn),
      unit: "mm",
      pose: "native-A",
      method: "3D chord",
    },
    {
      id: "face-nose.measure.subnasale-pronasale",
      name: "nasal protrusion sn-prn",
      value: dist(sn, prn),
      unit: "mm",
      pose: "native-A",
      method: "3D chord",
    },
    {
      id: "face-nose.measure.dorsum-length",
      name: "dorsum skin arclength se-prn",
      value: polyLen(dorsum),
      unit: "mm",
      pose: "native-A",
      method: "arclength of the midsagittal sub-arc",
    },
    {
      id: "face-nose.measure.columella-length",
      name: "columella/lobule underside arclength prn-sn",
      value: polyLen(columella),
      unit: "mm",
      pose: "native-A",
      method: "arclength of the midsagittal sub-arc",
    },
  );
  R.limits.push(
    "Nostrils are blind skin pits in this mesh; the rim is a normal-angle rule on the rounded lip, so its position depends on the 60 deg threshold within the lip's rounding.",
    "Alar grooves stop where the ala meets the nostril sill and the tip; the alar base (subalare) is not separately identified.",
  );
  return R;
}
