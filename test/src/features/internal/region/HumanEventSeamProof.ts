import type { HumanAnatomy } from "../HumanAnatomy";
import { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanEventSeamRows } from "./HumanEventSeamRows";

type V3 = HumanAnatomy.V3;

/**
 * The red and green proof of the event seam rows on a made seam: a sphere of
 * 100 mm radius cut at its equator into a parent above and a child below,
 * which joins G2 with no gap and a sagitta of 0.125 mm over a 10 mm chord, and
 * the same seam with the child pushed out 2 mm at the seam, fading over 3 mm,
 * which opens a 2 mm gap, turns the normal by about 34 degrees and creases the
 * meridian.
 */
export namespace HumanEventSeamProof {
  /** The made seam, its child pushed out by `push` mm at the seam. */
  export function sphere(push: number): HumanEventSeamRows.ISeam {
    const R: number = 100;
    const ring: (s: number, phases: readonly number[], extra: number) => V3[] = (s: number, phases: readonly number[], extra: number): V3[] =>
      phases.map((phi: number): V3 => {
        const r: number = Math.sqrt(R * R - s * s) + extra;
        return [r * Math.cos(phi), s, r * Math.sin(phi)];
      });
    return {
      label: `made sphere, child pushed ${push} mm`,
      parent: { name: "made.parent", first: 0, last: 80, ring: (s: number, phases: readonly number[]): V3[] => ring(s, phases, 0) },
      child: { name: "made.child", first: -80, last: 0, ring: (s: number, phases: readonly number[]): V3[] => ring(s, phases, push * Math.exp(-Math.abs(s) / 3)) },
      direction: "down",
      arcs: [[0, 2 * Math.PI]],
      axilla: false,
    };
  }

  /** The proof's failures, empty when it holds. */
  export function failures(): string[] {
    const out: string[] = [];
    for (const r of HumanEventSeamRows.rows("made", sphere(0), 1))
      if (!HumanAnatomyAudit.passes(r)) out.push(`made sphere must pass: ${r.site}: ${r.value.toFixed(3)} ${r.unit}`);
    const red: HumanAnatomyAudit.IRow[] = HumanEventSeamRows.rows("made", sphere(2), 1);
    for (const r of red) if (!Number.isFinite(r.value) || HumanAnatomyAudit.passes(r)) out.push(`made pushed seam must fail: ${r.site}: ${r.value.toFixed(3)} ${r.unit}`);
    return out;
  }
}
