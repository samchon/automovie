
import { Assembly } from "../Assembly";
import { heightRegion } from "../heightRegion";
import { putMesh } from "../putMesh";
import { entryApproach } from "../entryApproach";
import { rectangle } from "../rectangle";
import type { Frame } from "../Frame";
import { centresOf } from "./centresOf";
import { block } from "./block";
import { at } from "./at";
import type { Glazing } from "./Glazing";

/** The louvred openings of the design table; the rear bedroom window is left
 * out because the relocated rear tree crowns stand in its blade and pull-out space. */
const LOUVRED = new Set(["front-flex-glazing", "front-bedroom-glazing", "left-flex-glazing", "left-bedroom-glazing", "left-child-two-glazing"]);
/** Fixed 40% louvres in front of a lower privacy band: one support per
 * member centre, blades between end plates, two arms per support. */
export function louvre(a: Assembly, f: Frame, w: Glazing): void {
  if (!LOUVRED.has(w.id)) return;
  const S = w.sill, F = Math.min(w.head, S + 1.25), L = F - S - 0.08;
  const k = Math.ceil(L / 0.08 - 1e-9), p = L / k, H = (j: number) => S + 0.04 + (j + 0.5) * p;
  if (!(L > 0) || p - 0.034 < 0.040 || p - 0.038 < 0.036) throw new Error(w.id + ": louvre input needs a design review (L=" + L + ", p=" + p + ")");
  const centres = centresOf(w), id = w.id + "-louvre";
  // A bay whose blades would drip onto the front entry approach gets no louvre.
  const bays = centres.slice(0, -1).map((m, i) => f.id !== "front-face" || centres[i + 1] - 0.012 <= entryApproach[0] || m + 0.012 >= entryApproach[1]);
  for (const [i, m] of centres.entries()) {
    if (!bays[i - 1] && !bays[i]) continue;
    block(a, f, id + "-support-" + i, "house", "metal", m - 0.009, m + 0.009, S + 0.02, F - 0.02, 0.190, 0.215);
    for (const [name, y] of [["low", S + 0.04 + p - 0.017], ["high", S + 0.04 + (k - 1) * p - 0.017]] as const) {
      block(a, f, id + "-arm-" + i + "-" + name, "house", "metal", m - 0.009, m + 0.009, y - 0.009, y + 0.009, 0.070, 0.190);
      a.rod(id + "-arm-bolt-" + i + "-" + name, "house", "steel", at(f, m, y, -0.050), at(f, m, y, 0.215), 0.003);
      a.rod(id + "-arm-head-" + i + "-" + name, "house", "steel", at(f, m, y, 0.215), at(f, m, y, 0.221), 0.006);
    }
  }
  const n = (x: number, z: number) => ((f.along === "x" ? z : x) - f.plane) * f.normal;
  const lo = f.plane + 0.215 * f.normal, hi = f.plane + 0.285 * f.normal;
  for (let i = 0; i < centres.length - 1; i++) {
    if (!bays[i]) continue;
    const u0 = centres[i] + 0.012, u1 = centres[i + 1] - 0.012;
    const plan = f.along === "x" ? rectangle(u0, u1, Math.min(lo, hi), Math.max(lo, hi)) : rectangle(Math.min(lo, hi), Math.max(lo, hi), u0, u1);
    for (let j = 0; j < k; j++) {
      const top = (x: number, z: number) => H(j) - 0.40 * (n(x, z) - 0.215);
      putMesh(a, id + "-blade-" + i + "-" + j, "house", "metal", heightRegion(plan, (x, z) => top(x, z) - 0.006, top), "louvre-blade");
      for (const [end, e0, e1, head] of [["a", centres[i] + 0.009, centres[i] + 0.012, 1], ["b", centres[i + 1] - 0.012, centres[i + 1] - 0.009, -1]] as const) {
        block(a, f, id + "-endplate-" + i + "-" + j + "-" + end, "house", "metal", e0, e1, H(j) - 0.036, H(j) + 0.002, 0.190, 0.285);
        // M4 fastener: head on the bay side, body through the plate 0.008 into the solid support.
        const face = head === 1 ? e1 : e0, y = H(j) - 0.017;
        a.rod(id + "-fastener-head-" + i + "-" + j + "-" + end, "house", "steel", at(f, face, y, 0.202), at(f, face + 0.003 * head, y, 0.202), 0.0035);
        a.rod(id + "-fastener-body-" + i + "-" + j + "-" + end, "house", "steel", at(f, face - 0.011 * head, y, 0.202), at(f, face, y, 0.202), 0.002);
      }
    }
  }
}
