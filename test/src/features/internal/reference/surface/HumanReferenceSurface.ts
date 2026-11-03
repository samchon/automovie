import type { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceSurfaceCompare } from "./HumanReferenceSurfaceCompare";
import { HumanReferenceSurfaceFloor } from "./HumanReferenceSurfaceFloor";
import { HumanReferenceSurfaceLimitsSingleton } from "./HumanReferenceSurfaceLimitsSingleton";
import { HumanReferenceSurfacePopulation } from "./HumanReferenceSurfacePopulation";
import { HumanReferenceSurfaceSkin } from "./HumanReferenceSurfaceSkin";

/**
 * Two-way comparison of a generated skin with its private reference body,
 * finding gross shape errors and defects, never fitting to the reference.
 * This namespace is the public face of the comparison; each responsibility
 * lives in a `HumanReferenceSurface*` piece beside it.
 *
 * It belongs to the reference comparison layer, the gross-defect check that
 * stands in for anatomical-logic coverage still to be written, held in its own
 * folders as `packages/human/docs/testing/reference-layer.md` describes. Its
 * one consumer is `test_human_reference_surface`.
 *
 * Reference to generated (`HumanReferenceSurfaceOffsets`): every vertex of the
 * reference's skin reads the signed distance along its own outward normal to
 * the generated skin, positive where the generated skin stands outside. The
 * reference's skin is its body's one continuous surface as seen from outside:
 * vertices from which no ray escapes the reference, such as the closed mouth's
 * cavity and the sockets behind the eyelids, and the separate pieces such as
 * eyeballs and teeth, are not skin and are left unread. Only a generated
 * triangle facing within 60 degrees of the reference normal counts as the
 * counterpart, within a reach of three times the nearest distance plus the
 * vertex's limit, since a farther or turned crossing along the line is another
 * part of the body. Where the line finds no counterpart, the vertex falls back
 * to the nearest distance, signed by the side the nearest point lies on, and
 * the fallback is recorded; a fallback whose nearest generated skin turns more
 * than 60 degrees away, or ends at an open border, is another surface or a
 * hole, so the generated person is missing this one. The counterpart is the
 * generated skin seen from outside by the same test, so geometry inside the
 * generated body never stands in for the reference's skin.
 *
 * Generated to reference (`HumanReferenceSurfaceExtras`): every vertex of the
 * generated outer skin reads its nearest distance to the reference. A
 * generated vertex beyond the limit whose nearest reference triangle is not
 * already flagged on the reference with the same sign is extra geometry, such
 * as a spike thinner than the reference's vertex spacing; a bump the reference
 * normals see is listed once, from the reference. A generated piece detached
 * from the body's largest piece that reaches beyond its limit anywhere is
 * listed whole as a floating part, since its nearest reference skin may lie
 * within a wide region's spread.
 *
 * The limit (`HumanReferenceSurfaceLimits`) is the human surface's own spread:
 * a deviation counts as gross only when it exceeds how much real people differ
 * at that point. All reference bodies share one vertex order, so at every
 * reference vertex the spread is read across the population directly: each
 * other body is scaled by this person's stature over its own, and each of its
 * segments (a region as named below, both ears whole) is moved onto this
 * person's same segment by the least-squares rigid motion of Horn 1987, so
 * that where a limb happens to sit, which arm lengths and shoulder breadths
 * change by centimetres at the hand, leaves the shape alone. The spread is the
 * sample standard deviation of the moved bodies' offsets along this person's
 * normal. The segments come from the chain labels and joints, which locate
 * only. The limit is 2.576 times it, the two-sided 99 % normal quantile, so a
 * real person of this stature lies within it 99 times in 100, and never less
 * than 2 mm, the largest single-point allowance among the ISO 20685-1:2018
 * Table 4 rows the anatomy tests cite (foot dimensions 2 mm; head and hand
 * 1 mm; a large girth's 9 mm is 1.4 mm of radius), below which a deviation is
 * measurement noise.
 *
 * - Body: every reference body but `c0`, whose body is f1's exactly, and the
 *   held-out pair `e3`, `e6`, which stay unseen by every derived quantity, and
 *   leaving out the compared person.
 * - Head: a vertex all of whose triangles belong to the head part reads the
 *   four fitted heads f1, f2, m1, m2 only, its own included, since the newer
 *   people carry one unfitted preset head whose spread is no population's, and
 *   three heads leave a deviation two degrees of freedom.
 *
 * Where the population is degenerate the spread is no measure of people: the
 * source barely varies its hands, fingers, toes and feet, and carries only
 * four fitted heads. So every region also has a floor from published human
 * variation (`HumanReferenceSurfaceFloor`): 2.576 times the standard deviation
 * of the nearest measured dimension (ANSUR II for the body, hands and feet,
 * Weinberg 2016 for the face and cranium, Cho 2025 for the ear; the sex with
 * the larger spread), turned into one surface point's offset at that site,
 * half a breadth's deviation, a girth's over 2 pi, or a protrusion's whole.
 * The limit is the larger of the two. The test is meant to flag only skin that
 * leaves the range real bodies take there; a universal construction may differ
 * from the reference well inside it, and even read better.
 *
 * Nothing in a limit reads the generated skin's positions; the limit is never
 * a target, and a deviation within it is information, listed per region as RMS
 * and p95.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanReferenceSurface {
  /** How the generated skin departs from the reference at a patch. */
  export type Direction = "outside" | "inside" | "missing" | "extra";

  /** A connected patch of vertices beyond their limit. */
  export interface IPatch {
    /** Reference alias. */
    person: string;

    /** Region holding most of the patch's area. */
    region: string;

    /** Other regions the patch reaches, by area. */
    spans: string[];

    /** The generated skin's departure. */
    direction: Direction;

    /** Surface the patch lies on: reference vertices, or generated ones for extra geometry. */
    surface: "reference" | "generated";

    /** Way the patch's skin faces, from its mean normal. */
    facing: string;

    /** Area, mm². */
    area: number;

    /** Largest deviation's magnitude, mm. */
    max: number;

    /** Area-weighted mean deviation's magnitude, mm. */
    mean: number;

    /** Limit at the largest deviation, mm. */
    limit: number;

    /** Smallest and largest limit in the patch, mm. */
    limits: [number, number];

    /** Area-weighted centroid, mm. */
    centroid: HumanAnatomy.V3;

    /** Vertex of the largest deviation, mm. */
    at: HumanAnatomy.V3;

    /** Vertex count. */
    vertices: number;

    /** Vertices read by the nearest distance because the normal line found no counterpart. */
    fallback: number;

    /** Whether the patch is a whole generated piece detached from the body. */
    detached: boolean;
  }

  /** Deviation statistics of one region of the reference, information only. */
  export interface IRegion {
    /** Region name. */
    region: string;

    /** Reference vertex count. */
    vertices: number;

    /** Area, mm². */
    area: number;

    /** Area-weighted RMS of the signed deviation, mm. */
    rms: number;

    /** 95th percentile of the deviation's magnitude, mm. */
    p95: number;

    /** Largest magnitude, mm. */
    max: number;

    /** Area-weighted mean signed deviation, mm; positive where generated stands outside. */
    mean: number;

    /** Vertices read by the nearest distance. */
    fallback: number;

    /** Vertices beyond their limit. */
    exceeding: number;

    /** Median limit over the region, mm. */
    limit: number;

    /** The region's published floor, mm, and its basis. */
    floor: HumanReferenceSurfaceFloor.IValue;
  }

  /** One person's comparison. */
  export interface IReport {
    /** Reference alias. */
    person: string;

    /** Reference vertex count. */
    vertices: number;

    /** Generated vertex count. */
    generated: number;

    /** Signed deviation of every reference vertex, mm; NaN where the vertex is not skin. */
    deviation: Float64Array;

    /** Every patch, by region and descending area. */
    patches: IPatch[];

    /** Every region's statistics. */
    regions: IRegion[];

    /** Reference vertices read by the nearest distance. */
    fallback: number;

    /**
     * Reference vertices left unread as not skin: no ray from them escapes the
     * reference (the closed mouth's cavity, the sockets behind the lids), or
     * they lie on a piece apart from the body's skin (eyeballs, teeth).
     */
    interior: number;
  }

  /** One reference's per-vertex limits and their basis. */
  export interface ILimits {
    /** Limit per welded reference vertex: the larger of the population spread and the region's published floor, mm. */
    limit: Float64Array;

    /** The population spread's limit alone, floored only at the ISO 2 mm, mm. */
    spread: Float64Array;

    /** The region's floor from published human variation, mm. */
    floor: Float64Array;

    /** Stature-normalised population deviation along the normal, mm. */
    sigma: Float64Array;

    /** Whether the vertex read the fitted heads rather than the bodies. */
    head: Uint8Array;

    /** Bodies in the body population. */
    bodies: string[];

    /** Heads in the head population. */
    heads: string[];

    /** The person's stature, mm. */
    stature: number;
  }

  /** What `compare` takes: a generated skin, its reference and the limits between them. */
  export interface ICompareProps {
    /** Reference alias, for the findings. */
    person: string;

    /** The skin under test. */
    generated: HumanAnatomy.ISkin;

    /** The reference body. */
    reference: HumanReference.IMesh;

    /** A skin over the reference's triangles naming their chains, with joints locating the regions. */
    labels: HumanAnatomy.ISkin;

    /** Limit per reference vertex, mm. */
    limit: Float64Array;
  }

  /** A nearest-point answer of a triangle search. */
  export interface INearest {
    /** Squared distance, mm². */
    d2: number;

    /** Triangle index. */
    tri: number;

    /** Nearest point, mm. */
    q: [number, number, number];
  }

  /** The two-sided 99 % quantile of the standard normal distribution. */
  export const QUANTILE: number = HumanReferenceSurfaceFloor.QUANTILE;

  /** Smallest limit: ISO 20685-1:2018 Table 4's foot dimensions, the largest single-point allowance the anatomy tests cite, mm. */
  export const FLOOR: number = HumanReferenceSurfaceFloor.FLOOR;

  /** Floors by region from published human variation, first match wins. */
  export const FLOORS: readonly HumanReferenceSurfaceFloor.IFloor[] = HumanReferenceSurfaceFloor.FLOORS;

  /** References outside every population: `c0` repeats f1's body; `e3` and `e6` are held out. */
  export const EXCLUDED: readonly string[] = HumanReferenceSurfacePopulation.EXCLUDED;

  /** Fewest bodies a population spread may stand on. */
  export const MINIMUM: number = HumanReferenceSurfacePopulation.MINIMUM;

  /**
   * A region's floor, mm, and its basis.
   *
   * @param region The region's readable name.
   */
  export function floor(region: string): HumanReferenceSurfaceFloor.IValue {
    return HumanReferenceSurfaceFloor.floor(region);
  }

  /** Every reference body in the population, present in this checkout. */
  export function population(): string[] {
    return HumanReferenceSurfacePopulation.population();
  }

  /**
   * A reference's limits, computed once per run from the population.
   *
   * @param id Reference alias.
   */
  export function limits(id: string): ILimits {
    return HumanReferenceSurfaceLimitsSingleton.get(id);
  }

  /**
   * Compares a generated skin with a reference.
   *
   * @param props The skins, the labels and the limits.
   */
  export function compare(props: ICompareProps): IReport {
    return HumanReferenceSurfaceCompare.compare(props);
  }

  /**
   * Which vertices of a mesh lie on its outer skin: some ray from them leaves
   * the mesh, as `compare` reads both skins.
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   */
  export function outer(P: Float64Array, I: Uint32Array): Uint8Array {
    return HumanReferenceSurfaceSkin.outer(P, I);
  }

  /**
   * One line naming everything about a patch.
   *
   * @param p The patch.
   */
  export function describe(p: IPatch): string {
    const xyz: (v: HumanAnatomy.V3) => string = (v: HumanAnatomy.V3): string =>
      `(${v.map((c: number): string => c.toFixed(0)).join(", ")})`;
    const what: string = p.detached
      ? "detached generated part"
      : p.direction === "extra"
        ? "extra generated geometry"
        : p.direction === "missing"
          ? "generated missing"
          : `generated ${p.direction}`;

    return (
      `${p.person} ${p.region}: ${what}, facing ${p.facing}, ${p.area.toFixed(0)} mm² over ${p.vertices} ${p.surface} vertices, ` +
      `max ${p.max.toFixed(1)} mm against limit ${p.limit.toFixed(1)} mm at ${xyz(p.at)}, mean ${p.mean.toFixed(1)} mm, ` +
      `limits ${p.limits[0].toFixed(1)}..${p.limits[1].toFixed(1)} mm, centroid ${xyz(p.centroid)}` +
      (p.spans.length !== 0 ? `, reaching ${p.spans.join(", ")}` : "") +
      (p.fallback !== 0 ? `, ${p.fallback} vertices read by nearest distance` : "")
    );
  }

  /**
   * One line of a region's statistics.
   *
   * @param person Reference alias.
   * @param r The region's statistics.
   */
  export function summarize(person: string, r: IRegion): string {
    return (
      `${person} ${r.region}: ${r.vertices} vertices, ${(r.area / 100).toFixed(0)} cm², rms ${r.rms.toFixed(1)} mm, ` +
      `p95 ${r.p95.toFixed(1)} mm, max ${r.max.toFixed(1)} mm, mean ${r.mean >= 0 ? "+" : ""}${r.mean.toFixed(1)} mm, ` +
      `${r.exceeding} beyond limit, ${r.fallback} by nearest distance; median limit ${r.limit.toFixed(1)} mm, ` +
      `floor ${Number.isNaN(r.floor.value) ? "" : `${r.floor.value.toFixed(1)} mm `}(${r.floor.basis})`
    );
  }
}
