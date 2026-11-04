import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type ILine = HumanAnatomyHeadGeometry.ILine;
const A: typeof HumanAnatomy = HumanAnatomy;
const ahead: typeof HumanAnatomyHeadGeometry.ahead = HumanAnatomyHeadGeometry.ahead;
const band: typeof HumanAnatomyShared.band = HumanAnatomyShared.band;

/**
 * The cranial vault and the breadths of the face: glabella, nasion and
 * opisthocranion on the median profile, the head's circumference through them,
 * and the widest skin at the zygia, the gonia and the eurya.
 */
export namespace HumanAnatomyHeadVault {
  /** The forehead's landmarks as indices on the upward median profile. */
  export interface IBrow {
    /** Glabella, the brow's most prominent point. */
    g: number;

    /** Nasion, the root of the nose. */
    n: number;
  }

  /** The heights and anchors that bound the face's breadths. */
  export interface IBounds {
    /** Height of menton, below which no head skin is counted, mm. */
    menton: number;

    /** Height of stomion, mm. */
    stomion: number;

    /** Tragion, the midpoint of the two auricles' tragia. */
    tragion: V3;

    /** Height of the higher superaurale, mm. */
    earTop: number;

    /** Height of the lowest eyelid margin, mm. */
    eyeLow: number;
  }

  /** Face and head breadths, mm. */
  export interface IBreadths {
    /** Zygion to zygion. */
    face: number;

    /** Gonion to gonion. */
    mandibular: number;

    /** Eurion to eurion. */
    head: number;
  }

  /**
   * Glabella and nasion by the profile's own shape, so a nasal root standing
   * ahead of the brow cannot take glabella's place: the brow's most prominent
   * point, farthest ahead of the chord from the nasofrontal hollow (the
   * deepest point behind the chord from pronasale to the forehead 45 mm above
   * the eye openings' centre) to that forehead point. Nasion: the most
   * posterior point between glabella and pronasale, or the hollow itself when
   * the brow recedes behind the nasal root.
   *
   * @param up Median profile from the lip up the face, over the vertex.
   * @param prn Index of pronasale.
   * @param vertexIdx Index of the vertex.
   * @param eyeLevel Height of the eye openings' centre, mm.
   */
  export function brow(up: V3[], prn: number, vertexIdx: number, eyeLevel: number): IBrow {
    let F: number = prn;
    while (F < vertexIdx && up[F]![1] < eyeLevel + 45) F++;

    let hollow: number = prn;
    for (let i: number = prn; i <= F; i++)
      if (ahead(up[i]!, up[F]!, up[prn]!) < ahead(up[hollow]!, up[F]!, up[prn]!)) hollow = i;

    let g: number = hollow;
    for (let i: number = hollow; i <= F; i++)
      if (ahead(up[i]!, up[F]!, up[hollow]!) > ahead(up[g]!, up[F]!, up[hollow]!)) g = i;

    let n: number = prn;
    for (let i: number = prn; i <= g; i++) if (up[i]![0] < up[n]![0]) n = i;
    return { g, n: n === g ? hollow : n };
  }

  /** Opisthocranion: the vault's point farthest from glabella, behind it. */
  export function opisthocranion(topLine: ILine, glabella: V3): V3 {
    let op: V3 = glabella;

    for (const p of topLine.points)
      if (p[1] > glabella[1] - 60 && p[0] < glabella[0] - 100 && A.dist(p, glabella) > A.dist(op, glabella)) op = p;
    return op;
  }

  /**
   * Head circumference: the girth of the section through glabella and
   * opisthocranion, across the head.
   *
   * @returns The girth, mm, or NaN when the plane cuts no section.
   */
  export function circumference(skin: HumanAnatomy.ISkin, glabella: V3, op: V3, top: V3): number {
    const across: V3 = A.unit(A.cross(A.sub(op, glabella), [0, 0, 1]));
    const ring: HumanAnatomy.ICut | null = A.cut(
      skin,
      glabella,
      across,
      A.lerp(glabella, op, 0.5),
      band(skin, Math.min(glabella[1], op[1]) - 40, top[1] + 1),
    );
    return ring === null ? NaN : ring.girth;
  }

  /**
   * The widest skin in the bands of three Farkas breadths, the auricles left
   * out. Zygion: the widest face over the arches, in front of the tragion and
   * between its height and the lower lids. Gonion: the widest lower face from
   * menton to stomion within 40 mm in front of the tragion. Eurion: the widest
   * vault above the auricles, clear of their roots.
   *
   * @param skin Skin to read.
   * @param auricles Both auricles' vertices, excluded.
   * @param bounds Heights and anchors that bound the bands.
   */
  export function breadths(skin: HumanAnatomy.ISkin, auricles: V3[], bounds: IBounds): IBreadths {
    const ears: Set<string> = new Set(auricles.map(HumanAnatomyHeadGeometry.key));
    const points: V3[] = [];

    for (let v: number = 0; v < skin.P.length / 3; v++) {
      const p: V3 = A.point(skin, v);
      if (p[1] > bounds.menton - 10 && !ears.has(HumanAnatomyHeadGeometry.key(p))) points.push(p);
    }

    const widest: (keep: (p: V3) => boolean) => number = (keep: (p: V3) => boolean): number => {
      const rows: Map<number, [number, number]> = new Map();

      for (const p of points) {
        if (!keep(p)) continue;

        const k: number = Math.round(p[1]);
        const r: [number, number] = rows.get(k) ?? [Infinity, -Infinity];
        rows.set(k, [Math.min(r[0], p[2]), Math.max(r[1], p[2])]);
      }

      let best: number = 0;
      for (const [low, high] of rows.values()) best = Math.max(best, high - low);
      return best;
    };
    const t: V3 = bounds.tragion;
    return {
      face: widest((p: V3): boolean => p[0] > t[0] + 10 && p[1] < bounds.eyeLow && p[1] > t[1] - 5),
      mandibular: widest(
        (p: V3): boolean => p[0] > t[0] - 10 && p[0] < t[0] + 40 && p[1] < bounds.stomion && p[1] > bounds.menton,
      ),
      head: widest((p: V3): boolean => p[1] > bounds.earTop + 3),
    };
  }
}
