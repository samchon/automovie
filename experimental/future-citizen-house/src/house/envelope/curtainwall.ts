/** Realizes spaces/003#glazing-interface inside each whole facade owner: the
 * four-part curtainwall section with seated glass, the perimeter reveal
 * returns, the interfloor spandrel cassette and the fixed lower louvres.
 * n grows outward from the cut plane C; s is a member's own section axis. */
import { Assembly, rectangle } from "../assembly";
import { entryApproach } from "../plan";
import { bar, position, type Frame } from "../walls";
import { heightRegion, putMesh } from "../metric-solid";
import type { Glazing } from "./facade";

/** Priority splits first, then equal bays of at most 1.25m per span. */
export function edgesOf(w: Glazing): number[] {
  const segments = [w.a, ...(w.breaks ?? []), w.b];
  const edges = [w.a];
  for (let i = 0; i < segments.length - 1; i++) {
    const count = Math.ceil((segments[i + 1] - segments[i]) / 1.25);
    for (let j = 1; j <= count; j++) edges.push(segments[i] + (segments[i + 1] - segments[i]) * j / count);
  }
  return edges;
}
/** Member centres: the two jambs stand 0.02m outside the effective span. */
export const centresOf = (w: Glazing): number[] => edgesOf(w).map((u, i, all) => i === 0 ? u - 0.02 : i === all.length - 1 ? u + 0.02 : u);

const at = (f: Frame, u: number, y: number, n: number) => position(f, u, y, n * f.normal);
/** One box over [u0,u1] x [y0,y1] x [n0,n1] in the facade's own axes. */
function block(a: Assembly, f: Frame, id: string, space: string, material: string, u0: number, u1: number, y0: number, y1: number, n0: number, n1: number): string {
  return bar(a, f, id, space, material, (u0 + u1) / 2, (y0 + y1) / 2, u1 - u0, y1 - y0, n1 - n0, (n0 + n1) / 2 * f.normal);
}
/** Inner body, centre web, outer pressure plate and cover inset 0.002m. */
const SECTION = [["body", 0.020, -0.070, -0.015], ["web", 0.010, -0.015, 0.015], ["plate", 0.020, 0.015, 0.035], ["cover", 0.018, 0.035, 0.070]] as const;
function vertical(a: Assembly, f: Frame, id: string, space: string, m: number, y0: number, y1: number): void {
  for (const [part, s, n0, n1] of SECTION) block(a, f, id + "-" + part, space, "metal", m - s, m + s, y0, y1, n0, n1);
}
/** Each part butts the same part of the two vertical members at m0/m1. */
function horizontal(a: Assembly, f: Frame, id: string, space: string, m0: number, m1: number, c: number): void {
  for (const [part, s, n0, n1] of SECTION) block(a, f, id + "-" + part, space, "metal", m0 + s, m1 - s, c - s, c + s, n0, n1);
}
/** Glazing seat for one bay: gaskets on both glass faces in the 6mm seat,
 * verticals full glass height and horizontals between them, plus two setting
 * blocks bridging the sill web and the glass edge. */
function seat(a: Assembly, f: Frame, id: string, space: string, left: number, right: number, sill: number, head: number): void {
  for (const [side, n0, n1] of [["in", -0.015, -0.009], ["out", 0.009, 0.015]] as const) {
    block(a, f, id + "-gasket-left-" + side, space, "gasket", left - 0.006, left, sill - 0.006, head + 0.006, n0, n1);
    block(a, f, id + "-gasket-right-" + side, space, "gasket", right, right + 0.006, sill - 0.006, head + 0.006, n0, n1);
    block(a, f, id + "-gasket-sill-" + side, space, "gasket", left, right, sill - 0.006, sill, n0, n1);
    block(a, f, id + "-gasket-head-" + side, space, "gasket", left, right, head, head + 0.006, n0, n1);
  }
  const w = Math.min(0.05, (right - left) / 8);
  for (const q of [0.25, 0.75]) {
    const c = left + (right - left) * q;
    block(a, f, id + "-setting-" + q, space, "gasket", c - w / 2, c + w / 2, sill - 0.010, sill - 0.006, -0.009, 0.009);
  }
}
/** The four-part frame, seated glass bands and reveal returns of one window.
 * Returns the id of the first pane for the opening fill. */
export function curtainwall(a: Assembly, f: Frame, w: Glazing): string | null {
  const centres = centresOf(w);
  for (const [i, m] of centres.entries()) vertical(a, f, w.id + "-mullion-" + i, w.room, m, w.sill - 0.04, w.head + 0.04);
  let first: string | null = null;
  for (let i = 0; i < centres.length - 1; i++) {
    const left = centres[i] + 0.02, right = centres[i + 1] - 0.02;
    horizontal(a, f, w.id + "-head-" + i, w.room, centres[i], centres[i + 1], w.head + 0.02);
    horizontal(a, f, w.id + "-sill-" + i, w.room, centres[i], centres[i + 1], w.sill - 0.02);
    seat(a, f, w.id + "-bay-" + i, w.room, left, right, w.sill, w.head);
    // Glass runs 6mm into each seat; optical bands still meet at the split.
    // A lower band that reaches the head leaves no clear band: the one frosted
    // pane then carries both 6mm seat extensions.
    const split = w.privacy === "lower" ? Math.min(w.head, w.sill + 1.25) : w.head;
    const bands = w.privacy === "lower" && split < w.head - 1e-9
      ? [[w.sill - 0.006, split, "frosted"], [split, w.head + 0.006, "glass"]] as const
      : [[w.sill - 0.006, w.head + 0.006, w.privacy ? "frosted" : "glass"]] as const;
    for (const [n, band] of bands.entries()) {
      if (band[1] <= band[0] + 0.006) continue;
      const id = block(a, f, w.id + "-pane-" + i + "-" + n, w.room, band[2], left - 0.006, right + 0.006, band[0], band[1], -0.009, 0.009);
      first ??= id;
    }
  }
  reveal(a, f, w);
  return first;
}
/** Metal returns line the structural cut inward only: 0.004m inside, 0.006m
 * outside; verticals own the full cut height, horizontals end between them. */
function reveal(a: Assembly, f: Frame, w: Glazing): void {
  const u0 = w.a - 0.04, u1 = w.b + 0.04, y0 = w.sill - 0.04, y1 = w.head + 0.04;
  // A storey-owned window (the stair void) has no room lining: stop at the bare wall face.
  const inner = w.room.endsWith("-storey") ? -0.114 : -0.120;
  for (const [side, t, n0, n1] of [["in", 0.004, inner, -0.070], ["out", 0.006, 0.070, 0.120]] as const) {
    block(a, f, w.id + "-reveal-" + side + "-a", w.room, "metal", u0, u0 + t, y0, y1, n0, n1);
    block(a, f, w.id + "-reveal-" + side + "-b", w.room, "metal", u1 - t, u1, y0, y1, n0, n1);
    block(a, f, w.id + "-reveal-" + side + "-head", w.room, "metal", u0 + t, u1 - t, y1 - t, y1, n0, n1);
    block(a, f, w.id + "-reveal-" + side + "-sill", w.room, "metal", u0 + t, u1 - t, y0, y0 + t, n0, n1);
  }
}
/** A folded 0.002m cassette between the two standard window levels. The
 * lower head and upper sill are derived from the shared storey datum; the
 * small offsets below are the authored cassette section, measured from those
 * window edges. Panels split at upper inner mullions outside the end seals. */
export function spandrel(a: Assembly, f: Frame, windows: Glazing[], lowerHead: number, upperSill: number): void {
  const bandBottom = lowerHead + 0.04;
  const bandTop = upperSill - 0.07;
  const plateBottom = bandBottom + 0.004;
  const plateTop = bandTop - 0.004;
  const clipCenter = (lowerHead + upperSill) / 2;
  const isAt = (actual: number, expected: number) => Math.abs(actual - expected) <= 1e-7;
  for (const lower of windows.filter(
    (w) =>
      isAt(
        w.head,
        lowerHead,
      ),
  )) for (const upper of windows.filter((w) => isAt(w.sill, upperSill))) {
    const b0 = Math.max(lower.a, upper.a) - 0.04, b1 = Math.min(lower.b, upper.b) + 0.04;
    if (b1 <= b0) continue;
    const splits = edgesOf(upper).slice(1, -1).filter(
      (u) => u >= b0 + 0.08 - 1e-9 && u <= b1 - 0.08 + 1e-9,
    );
    const lines = [b0, ...splits, b1];
    const id = f.id + "-spandrel-" + upper.id;
    for (const [j, line] of lines.entries()) {
      // Side seals own the full band height between panels and at both ends.
      const s0 = j === 0 ? line : line - 0.002, s1 = j === lines.length - 1 ? line : line + 0.002;
      block(
        a,
        f,
        id + "-seal-side-" + j,
        "house",
        "seal",
        s0,
        s1,
        bandBottom,
        bandTop,
        0.120,
        0.138,
      );
    }
    for (let j = 0; j < lines.length - 1; j++) {
      const p0 = lines[j] + 0.002, p1 = lines[j + 1] - 0.002, pid = id + "-panel-" + j;
      block(
        a,
        f,
        pid + "-plate",
        "house",
        "cassette",
        p0,
        p1,
        plateBottom,
        plateTop,
        0.138,
        0.140,
      );
      block(
        a,
        f,
        pid + "-return-a",
        "house",
        "cassette",
        p0,
        p0 + 0.002,
        plateBottom,
        plateTop,
        0.120,
        0.138,
      );
      block(
        a,
        f,
        pid + "-return-b",
        "house",
        "cassette",
        p1 - 0.002,
        p1,
        plateBottom,
        plateTop,
        0.120,
        0.138,
      );
      block(
        a,
        f,
        pid + "-return-top",
        "house",
        "cassette",
        p0 + 0.002,
        p1 - 0.002,
        plateTop - 0.002,
        plateTop,
        0.120,
        0.138,
      );
      const slots = [0.25, 0.75].map((q) => p0 + (p1 - p0) * q);
      const cuts = [
        p0 + 0.002,
        ...slots.flatMap((q) => [q - 0.005, q + 0.005]),
        p1 - 0.002,
      ];
      for (let k = 0; k < cuts.length; k += 2) block(
        a,
        f,
        pid + "-return-bottom-" + k / 2,
        "house",
        "cassette",
        cuts[k],
        cuts[k + 1],
        plateBottom,
        plateBottom + 0.002,
        0.120,
        0.138,
      );
      for (const [k, q] of slots.entries()) {
        // Drain slot: the bottom return keeps only its two faces around the opening.
        block(
          a,
          f,
          pid + "-slot-" + k + "-inner",
          "house",
          "cassette",
          q - 0.005,
          q + 0.005,
          plateBottom,
          plateBottom + 0.002,
          0.120,
          0.122,
        );
        block(
          a,
          f,
          pid + "-slot-" + k + "-outer",
          "house",
          "cassette",
          q - 0.005,
          q + 0.005,
          plateBottom,
          plateBottom + 0.002,
          0.137,
          0.138,
        );
        const cw = Math.min(0.05, (p1 - p0) / 6);
        block(
          a,
          f,
          pid + "-clip-" + k,
          "house",
          "metal",
          q - cw / 2,
          q + cw / 2,
          clipCenter - 0.01,
          clipCenter + 0.01,
          0.120,
          0.138,
        );
        a.rod(
          pid + "-anchor-" + k,
          "house",
          "steel",
          at(f, q, clipCenter, 0.100),
          at(f, q, clipCenter, 0.138),
          0.003,
        );
      }
      block(
        a,
        f,
        pid + "-seal-top",
        "house",
        "seal",
        p0,
        p1,
        plateTop,
        bandTop,
        0.120,
        0.140,
      );
      block(
        a,
        f,
        pid + "-seal-bottom",
        "house",
        "seal",
        p0,
        p1,
        bandBottom,
        plateBottom,
        0.120,
        0.122,
      );
    }
  }
}
/** Fixed 40% louvres in front of a lower privacy band: one support per
 * member centre, blades between end plates, two arms per support. */
/** The louvred openings of the design table; the rear bedroom window is left
 * out because the relocated rear tree crowns stand in its blade and pull-out space. */
const LOUVRED = new Set(["front-flex-glazing", "front-bedroom-glazing", "left-flex-glazing", "left-bedroom-glazing", "left-child-two-glazing"]);
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
