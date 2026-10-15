/** Realizes spaces/003#glazing-interface inside each whole facade owner: the
 * four-part curtainwall section with seated glass, the perimeter reveal
 * returns, the interfloor spandrel cassette and the fixed lower louvres.
 * n grows outward from the cut plane C; s is a member's own section axis. */
import { Assembly } from "../Assembly";
import { type Frame } from "../Frame";
import type { Glazing } from "./Glazing";
import { centresOf } from "./centresOf";
import { block } from "./block";

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
