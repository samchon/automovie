import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import type { AutoMovieHumanHeadConstruction } from "./AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import { AutoMovieHumanHeadSkin } from "./AutoMovieHumanHeadSkin";
import { AutoMovieHumanHeadSkinReading } from "./AutoMovieHumanHeadSkinReading";
import type { IAutoMovieHumanHeadCorrections } from "./IAutoMovieHumanHeadCorrections";
import type { IAutoMovieHumanHeadLandmarks } from "./IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadMandible } from "./IAutoMovieHumanHeadMandible";
import type { IAutoMovieHumanHeadSides } from "./IAutoMovieHumanHeadSides";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The secant passes that solve the measures an input names on the
 * construction's own skin, each at its Farkas landmark by its definition: n-gn,
 * n-sn and sn-prn on the median profile, zy-zy and go-go as breadths at their
 * sites, al-al on the alar walls, the head circumference and g-op, and the
 * menton's height. Each reading moves the one key that owns it.
 */
export namespace AutoMovieHumanHeadSolve {
  /**
   * The corrections after one pass: each measure an input names, read on the
   * pass's own skin at its Farkas landmark by its definition, moves the one key
   * that owns it by its error. n-gn, n-sn and sn-prn are 3D distances between
   * points of the midline profile; zy-zy, go-go and al-al are skin breadths at
   * the landmark's place.
   */
  export function solved(
    surface: IAutoMovieHumanHeadSurface,
    inputs: AutoMovieHumanHeadConstruction.IInputs,
    fix: IAutoMovieHumanHeadCorrections,
  ): IAutoMovieHumanHeadCorrections {
    const { plan, compiled } = surface;
    const k: number = plan.scale;
    const head: IAutoMovieHumanHeadIdentity = inputs.head;
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const points: P2[] = [];
    for (let s: number = plan.menton - 30 * k; s <= m.glabella[1] + 30 * k; s += 0.5 * k)
      points.push(AutoMovieHumanHeadSkinReading.midline(surface, s));
    const pick = (keep: (p: P2) => boolean, score: (p: P2) => number): P2 => {
      let best: P2 = [NaN, NaN];
      let value: number = -Infinity;
      for (const p of points)
        if (keep(p) && score(p) > value) {
          value = score(p);
          best = p;
        }
      return best;
    };
    // Nasion the deepest point between the fissures and the glabella;
    // gnathion the chin's support point toward the front and down; pronasale
    // the most prominent point of the nose; subnasale the nasolabial angle's
    // apex, deepest behind the chord from pronasale to labrale superius.
    const n: P2 = pick(
      (p: P2): boolean => p[1] > plan.eye - 6 * k && p[1] < m.glabella[1],
      (p: P2): number => -p[0],
    );
    const gn: P2 = pick(
      (p: P2): boolean => p[1] < plan.stomion - 10 * k,
      (p: P2): number => p[0] - p[1],
    );
    const prn: P2 = pick(
      (p: P2): boolean => p[1] > plan.stomion && p[1] < n[1] - 10 * k,
      (p: P2): number => p[0],
    );
    const ls: P2 = pick(
      (p: P2): boolean => p[1] > plan.stomion && p[1] < plan.subnasale - 2 * k,
      (p: P2): number => p[0],
    );
    const chord: P2 = [ls[0] - prn[0], ls[1] - prn[1]];
    const sn: P2 = pick(
      (p: P2): boolean => p[1] < prn[1] && p[1] > ls[1],
      (p: P2): number =>
        ((p[0] - prn[0]) * chord[1] - (p[1] - prn[1]) * chord[0]) /
        Math.hypot(chord[0], chord[1]),
    );
    const d = (a: P2, b: P2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const ok = (v: number): number => (Number.isFinite(v) ? v : 0);
    const out: IAutoMovieHumanHeadCorrections = { ...fix };
    out.nasion -= ok(d(n, gn) - head.faceHeight * k);
    out.subnasale += ok(d(n, sn) - head.face.nose.height * k);
    // Menton: the lowest point of the chin within 40 mm past the gnathion.
    let me: number = gn[1];
    for (const p of points)
      if (p[1] < gn[1] && d(p, gn) < 40 * k) me = Math.min(me, p[1]);
    out.menton -= ok(me - plan.menton);
    const protrusion: number = d(sn, prn);
    if (protrusion > 0)
      out.lead *= Math.min(2, Math.max(0.5, (head.face.nose.protrusion * k) / protrusion));

    // Breadths: the face's at the zygion, the jaw's at the gonion's place
    // on its tilted plane, the nose's at the alar lobules.
    // Each breadth is read on both sides, the left half plus the right half
    // against the whole input.
    const both = (c: IAutoMovieHumanHeadSides, x: number): number => AutoMovieHumanHeadSkinReading.across(c.left, x) - AutoMovieHumanHeadSkinReading.across(c.right, x);
    const zy: number = both(AutoMovieHumanHeadSkin.sides(surface, m.zygion[1]), m.zygion[0]);
    out.zygion -= ok(zy - head.faceWidth * k) / 2;
    const jaw: IAutoMovieHumanHeadMandible = plan.mandible!;
    let s: number = jaw.gonionY;
    for (let i: number = 0; i < 4; i++) {
      const tilt: number = AutoMovieHumanHeadSection.section(compiled, plan, s).tilt;
      s = jaw.gonionY - (jaw.gonion / Math.cos(tilt)) * Math.sin(tilt);
    }
    const go: number = both(AutoMovieHumanHeadSkin.sides(surface, s), jaw.gonion);
    out.gonion -= ok(go - head.mandibularWidth * k) / 2;

    // The head circumference round the glabella's section, and the head
    // length from the glabella, the forehead's most prominent point within
    // 45 mm over the fissures, to the opisthocranion, the farthest point of
    // the back of the vault.
    const ring: IAutoMovieHumanHeadSides = AutoMovieHumanHeadSkin.sides(surface, m.glabella[1]);
    const around = (side: readonly Vec3[]): number =>
      side.reduce((sum: number, p: Vec3, i: number): number => (i === 0 ? 0 : sum + AutoMovieHumanHeadMath.dist(p, side[i - 1]!)), 0);
    out.tape += ok(head.circumference * k - around(ring.left) - around(ring.right));
    const g: P2 = pick(
      (p: P2): boolean => p[1] >= plan.eye && p[1] <= plan.eye + 45 * k,
      (p: P2): number => p[0],
    );
    let length: number = 0;
    for (let y: number = m.glabella[1] - 60 * k; y <= m.glabella[1] + 40 * k; y += k)
      length = Math.max(length, d(g, AutoMovieHumanHeadSkinReading.midline(surface, y, true)));
    out.occiput -= ok(length - head.length * k);

    // Alare: on level cuts from the subnasale up, each side walked inward from
    // 35 mm off the midline until the contour turns to run within 20 degrees of
    // straight back, the ala's lateral wall.
    const alare = (pick: (c: IAutoMovieHumanHeadSides) => Vec3[], sign: 1 | -1): number => {
      let al: number = 0;
      for (let y: number = m.subnasale[1] - k; y <= m.subnasale[1] + 0.4 * (m.pronasale[1] - m.subnasale[1] + 15 * k); y += k) {
        const side: Vec3[] = pick(AutoMovieHumanHeadSkin.sides(surface, y));
        const z = (p: Vec3): number => sign * p[2];
        let end: number = 0;
        while (end + 1 < side.length && side[end + 1]![0] > m.subnasale[0] - 40 * k && z(side[end]!) <= 35 * k) end++;
        for (let i: number = end; i - 8 > 0; i--) {
          const p: Vec3 = side[i]!;
          const q: Vec3 = side[i - 8]!;
          if (z(q) < 5 * k) break;
          if (Math.abs(z(q) - z(p)) < Math.sin((20 * Math.PI) / 180) * Math.hypot(q[0] - p[0], z(q) - z(p))) {
            al = Math.max(al, z(p));
            break;
          }
        }
      }
      return al;
    };
    const al: number =
      alare((c: IAutoMovieHumanHeadSides): Vec3[] => c.left, 1) + alare((c: IAutoMovieHumanHeadSides): Vec3[] => c.right, -1);
    if (al > 0)
      out.ala += Math.max(-0.3, Math.min(0.3, (head.face.nose.width * k) / al - 1)) * plan.noseWidth;
    return out;
  }

  /** Secant passes that solve the measures on the skin. */
  export const PASSES: number = 4;
}

/** A point of a section. */
type P2 = [number, number];

/** A point. */
type Vec3 = [number, number, number];
