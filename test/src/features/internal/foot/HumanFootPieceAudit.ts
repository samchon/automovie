import type { AutoMovieHumanFootBody } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootBody";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanCurveConstants } from "../HumanCurveConstants";
import { HumanLimbSectionShape } from "../limbs/HumanLimbSectionShape";
import type { HumanFootPieces } from "./HumanFootPieces";

type IRow = HumanAnatomyAudit.IRow;
type Vec3 = [number, number, number];
type Vec2 = HumanLimbSectionShape.Vec2;

/**
 * The foot body's pieces read alone, section by section and along their
 * phases, from one foot's fixed inputs: dents and kinks inside each piece's
 * share of a section, ribs along the stations, and each toe's own tube.
 *
 * A section of the body is five pieces at fixed phases: dorsal-lateral (the
 * crest to the lateral border), the lateral border's plantar piece, the sole's
 * contact, the medial arch and dorsal-medial (`AutoMovieHumanFootBody`). A
 * finding names the piece, so a defect is traced to the piece that makes it
 * before the chain, the webs or the reliefs touch it.
 */
export namespace HumanFootPieceAudit {
  /** The body's pieces in phase order, with their fixed shares of a section's control points. */
  export const PIECES: readonly { name: string; share: number; concave: boolean }[] = [
    { name: "dorsal-lateral", share: 51, concave: false },
    { name: "lateral border", share: 46, concave: false },
    { name: "sole contact", share: 56, concave: false },

    // The medial longitudinal arch hollows the medial side of the sole (Gray
    // 1918), so its piece may be concave across.
    { name: "medial arch", share: 52, concave: true },
    { name: "dorsal-medial", share: 51, concave: false },
  ];

  /** Sections read along the body, as shares of its stations from the web ring (0) to the ankle ring (1). */
  export const SECTIONS: number = 100;

  /** Chord a dent is read across, mm: the crease definition's 10 mm (`HumanAnatomyShared.CREASE` over a 10 mm chord). */
  export const CHORD: number = 10;

  /** Arc either side of a point a kink is read over, mm: the curve audit's rib step. */
  export const ARC: number = HumanCurveConstants.RIB_STEP;

  /** Largest turn per radius, radians: the curve audit's rib limit, 250 degrees per ring radius. */
  export const TURN: number = (HumanCurveConstants.RIB * Math.PI) / 180;

  /** A source of sections, the body's own or a made defect's. */
  export type Sections = (station: number) => AutoMovieHumanFootBody.ISection;

  /** The piece a ring index of a section belongs to. */
  export function piece(index: number, order: number): number {
    const total: number = PIECES.reduce((s: number, p: { share: number }): number => s + p.share, 0);
    let start: number = 0;
    for (let k: number = 0; k < PIECES.length; k++) {
      start += (PIECES[k]!.share * order) / total;
      if (index < start - 1e-9) return k;
    }
    return PIECES.length - 1;
  }

  /** A section's ring in its own plane, mm. */
  export function plane(section: AutoMovieHumanFootBody.ISection): Vec2[] {
    const o: number[] = section.frame.origin as number[];
    const u: number[] = section.frame.u as number[];
    const v: number[] = section.frame.v as number[];
    return section.ring.map((p: Vec3): Vec2 => {
      const r: number[] = [p[0] - o[0]!, p[1] - o[1]!, p[2] - o[2]!];
      return [r[0]! * v[0]! + r[1]! * v[1]! + r[2]! * v[2]!, r[0]! * u[0]! + r[1]! * u[1]! + r[2]! * u[2]!];
    });
  }

  /**
   * Dents and kinks across each piece, at {@link SECTIONS} + 1 sections: per
   * piece and section, the deepest concave sagitta over a 10 mm chord (none
   * deeper than the crease floor, except in the medial arch) and the sharpest
   * turn per radius (none sharper than the rib limit).
   */
  export function sections(p: HumanFootPieces.IPieces, source: Sections = p.body.section): IRow[] {
    const out: IRow[] = [];
    const end: number = p.line.end;
    for (let k: number = 0; k <= SECTIONS; k++) {
      const station: number = (end * k) / SECTIONS;
      const ring: Vec2[] = plane(source(station));
      const shape: HumanLimbSectionShape.IShape = HumanLimbSectionShape.of(ring, CHORD, ARC);
      const dent: number[] = PIECES.map((): number => 0);
      const bend: number[] = PIECES.map((): number => 0);
      ring.forEach((_: Vec2, i: number): void => {
        const j: number = piece(i, ring.length);
        dent[j] = Math.max(dent[j]!, shape.dent[i]!);
        bend[j] = Math.max(bend[j]!, shape.bend[i]!);
      });
      PIECES.forEach((q: { name: string; concave: boolean }, j: number): void => {
        const where: string = `${p.side} foot ${q.name} piece at ${(k / SECTIONS).toFixed(2)} of the stations (web 0, ankle 1)`;
        if (!q.concave)
          out.push({ person: p.person, site: `${where}: concave sagitta over a ${CHORD} mm chord, mm`, value: dent[j]!, low: 0, high: HumanAnatomyShared.CREASE, unit: "mm" });
        out.push({ person: p.person, site: `${where}: sharpest turn per section radius, rad`, value: bend[j]!, low: 0, high: TURN, unit: "rad" });
      });
    }
    return out;
  }

  /**
   * Ribs along the body: each of 64 phase tracks read every 1 mm of station,
   * the turn of the track per mm times the section's radius, against the curve
   * audit's rib limit; one row per piece and station band of a tenth.
   */
  export function ribs(p: HumanFootPieces.IPieces, source: Sections = p.body.section): IRow[] {
    const end: number = p.line.end;
    const count: number = Math.floor(end / HumanCurveConstants.RIB_STEP);
    const sections: AutoMovieHumanFootBody.ISection[] = Array.from({ length: count + 1 }, (_: unknown, i: number): AutoMovieHumanFootBody.ISection =>
      source(Math.min(end, i * HumanCurveConstants.RIB_STEP)),
    );
    const radii: number[] = sections.map((s: AutoMovieHumanFootBody.ISection): number => HumanLimbSectionShape.of(plane(s), CHORD, ARC).radius);
    const order: number = sections[0]!.ring.length;
    const tracks: number = HumanCurveConstants.RIB_PHASES;
    const worst: number[][] = PIECES.map((): number[] => Array.from({ length: 10 }, (): number => 0));
    for (let t: number = 0; t < tracks; t++) {
      const m: number = Math.floor((t * order) / tracks);
      const j: number = piece(m, order);
      for (let i: number = 1; i < count; i++) {
        const a: Vec3 = sub(sections[i]!.ring[m]!, sections[i - 1]!.ring[m]!);
        const b: Vec3 = sub(sections[i + 1]!.ring[m]!, sections[i]!.ring[m]!);
        const la: number = Math.hypot(...a);
        const lb: number = Math.hypot(...b);
        if (la < HumanCurveConstants.RIB_SEGMENT || lb < HumanCurveConstants.RIB_SEGMENT || radii[i]! < HumanCurveConstants.RIB_RADIUS) continue;
        const turn: number = Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb))));
        const band: number = Math.min(9, Math.floor((10 * i) / count));
        worst[j]![band] = Math.max(worst[j]![band]!, (turn / ((la + lb) / 2)) * radii[i]!);
      }
    }
    return PIECES.flatMap((q: { name: string }, j: number): IRow[] =>
      worst[j]!.map(
        (value: number, band: number): IRow => ({
          person: p.person,
          site: `${p.side} foot ${q.name} piece, stations ${(band / 10).toFixed(1)} to ${((band + 1) / 10).toFixed(1)}: sharpest turn along a phase track per section radius, rad`,
          value,
          low: 0,
          high: TURN,
          unit: "rad",
        }),
      ),
    );
  }

  /**
   * Each toe's own tube, from its first own section to where its tip starts
   * to close, is at least as long as the toe is broad there: the dome closing
   * the tip takes one half breadth and the web's fillet into the root another,
   * so a shorter tube makes the web and the dome overlap, which folds the skin.
   */
  export function toes(p: HumanFootPieces.IPieces): IRow[] {
    return p.toes.map((t: HumanFootPieces.IPieces["toes"][number], i: number): IRow => {
      const breadth: number = 2 * t.size(t.first)[0];
      return {
        person: p.person,
        site: `${p.side} foot toe ${i + 1}: own tube length (first section to cap) less the toe's breadth there, mm`,
        value: t.cap - t.first - breadth,
        low: 0,
        high: Infinity,
        unit: "mm",
      };
    });
  }
}

/** Difference of two points. */
function sub(a: readonly number[], b: readonly number[]): Vec3 {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}
