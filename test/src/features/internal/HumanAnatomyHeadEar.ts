import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type ILine = HumanAnatomyHeadGeometry.ILine;
const A: typeof HumanAnatomy = HumanAnatomy;
const band: typeof HumanAnatomyShared.band = HumanAnatomyShared.band;
const resample: typeof HumanAnatomyShared.resample = HumanAnatomyShared.resample;

/**
 * An auricle found by its shape alone, a thin plate of cartilage standing off
 * the head, and its Farkas and Cho 2025 dimensions: length, breadth and
 * protrusion.
 */
export namespace HumanAnatomyHeadEar {
  /** One auricle's landmarks and dimensions. */
  export interface IEar {
    /** Superaurale, the auricle's highest point, mm. */
    superaurale: V3;

    /** Subaurale, the lobule's lowest point, mm. */
    subaurale: V3;

    /** Tragion: the auricle's front at the tragus, mm. */
    tragion: V3;

    /** Otobasion superius, the most anterior point of the upper half where the plate meets the head, mm. */
    otobasionSuperius: V3;

    /** Postaurale, the helix's farthest point back from otobasion superius, perpendicular to the long axis, mm. */
    postaurale: V3;

    /** Superaurale to subaurale, mm. */
    length: number;

    /** Breadth perpendicular to the long axis, from the front attachment to the posterior helix, mm. */
    breadth: number;

    /** Helix rim from the scalp behind it at the tragus' level, mm. */
    protrusion: number;

    /** Inclination of the long axis behind the vertical, seen from the side, degrees. */
    inclination: number;

    /** Auricle vertices. */
    points: V3[];
  }

  /**
   * One auricle, found by its shape: a plate of cartilage standing off the
   * head. Near the auricle's chains, every vertex whose skin, seen from just
   * inside it, meets skin again within 15 mm toward the median plane belongs
   * to that thin plate; the scalp, cheek and concha's floor have the head
   * behind them. Superaurale and subaurale are the plate's highest and lowest
   * points, its long axis the line between them; breadth is the direct
   * distance from otobasion superius to the helix's farthest point back,
   * perpendicular to that axis; tragion is the plate's most anterior point in
   * the middle third of its height; protrusion is how far the helix rim, the
   * plate's most lateral point at the tragion's level, stands from the nearest
   * scalp behind the auricle.
   *
   * @param skin Skin to read.
   * @param side Which auricle.
   */
  export function auricle(skin: HumanAnatomy.ISkin, side: "left" | "right"): IEar {
    const nan: V3 = [NaN, NaN, NaN];
    const none: IEar = {
      superaurale: nan,
      subaurale: nan,
      otobasionSuperius: nan,
      postaurale: nan,
      tragion: nan,
      length: NaN,
      breadth: NaN,
      protrusion: NaN,
      inclination: NaN,
      points: [],
    };
    const seed: V3[] = A.vertices(skin, new RegExp(`^ear\\..*${side}$`));
    if (seed.length === 0) return none;

    const inward: 1 | -1 = side === "left" ? -1 : 1;
    const { plate, scalp }: IParts = split(skin, HumanAnatomyHeadGeometry.centre(seed), inward);
    if (plate.length < 10) return none;

    let sa: V3 = plate[0]!;
    let sba: V3 = plate[0]!;

    for (const p of plate) {
      if (p[1] > sa[1]) sa = p;
      if (p[1] < sba[1]) sba = p;
    }

    const tragion: V3 = front(plate, sa, sba);
    const width: IWidth = breadth(plate, scalp, sa, sba);
    return {
      superaurale: sa,
      subaurale: sba,
      otobasionSuperius: width.obs,
      postaurale: width.post,
      tragion,
      length: A.dist(sa, sba),
      breadth: width.breadth,
      protrusion: protrusion(skin, plate, tragion, inward),
      inclination: (Math.atan2(sa[0] - sba[0], sa[1] - sba[1]) * -180) / Math.PI,
      points: plate,
    };
  }

  /** The vertices near an auricle, split into its thin plate and the scalp behind it. */
  interface IParts {
    /** Vertices whose skin meets skin again within 15 mm toward the median plane. */
    plate: V3[];

    /** All other vertices within 45 mm of the auricle. */
    scalp: V3[];
  }

  /** Split the vertices within 45 mm of a centre into the plate and the scalp. */
  function split(skin: HumanAnatomy.ISkin, centre: V3, inward: 1 | -1): IParts {
    const normals: Float64Array = HumanAnatomyHeadGeometry.normals(skin);
    const plate: V3[] = [];
    const scalp: V3[] = [];

    for (let v: number = 0; v < skin.P.length / 3; v++) {
      const p: V3 = A.point(skin, v);
      if (A.dist(p, centre) > 45) continue;

      // A ray from just inside the vertex toward the median plane: a plate has
      // skin behind it within a few millimetres, the scalp has the whole head.
      const nrm: V3 = [normals[3 * v]!, normals[3 * v + 1]!, normals[3 * v + 2]!];
      const hit: { crossings: number; nearest: number } = A.ray(skin, A.sub(p, A.scale(nrm, 0.1)), 2, inward);

      if (hit.crossings > 0 && hit.nearest < 15) plate.push(p);
      else scalp.push(p);
    }
    return { plate, scalp };
  }

  /** Tragion: the plate's most anterior point in the middle third of its height. */
  function front(plate: V3[], sa: V3, sba: V3): V3 {
    const H: number = sa[1] - sba[1];
    let tragion: V3 = [NaN, NaN, NaN];

    for (const p of plate)
      if (p[1] > sba[1] + H / 3 && p[1] < sa[1] - H / 3 && (Number.isNaN(tragion[0]) || p[0] > tragion[0])) tragion = p;
    return tragion;
  }

  /**
   * Breadth: from otobasion superius, the most anterior point of the upper
   * half where the plate meets the head, to the helix's farthest point back,
   * the direct distance perpendicular to the long axis. The plate stands off
   * the head, so the helix lies lateral as well as behind; a side view's
   * projection would read it short by the cosine of that angle.
   */
  function breadth(plate: V3[], scalp: V3[], sa: V3, sba: V3): IWidth {
    const nan: V3 = [NaN, NaN, NaN];
    const u: V3 = A.unit(A.sub(sa, sba));
    const w: V3 = A.unit(A.reject([-1, 0, 0], u));
    const meets: (p: V3) => boolean = touching(scalp);
    const middle: number = (sa[1] + sba[1]) / 2;

    // Otobasion superius: of the plate's attached upper-half points, the one
    // farthest forward along the backward axis.
    let obs: V3 | undefined;

    for (const p of plate)
      if (p[1] > middle && (obs === undefined || A.dot(p, w) < A.dot(obs, w)) && meets(p)) obs = p;
    if (obs === undefined) return { breadth: NaN, obs: nan, post: nan };

    // Postaurale: the plate point behind it that lies farthest from it across
    // the long axis.
    let post: V3 = obs;
    let widest: number = 0;

    for (const p of plate) {
      const off: V3 = A.sub(p, obs);
      const across: number = Math.hypot(...A.reject(off, u));

      if (A.dot(off, w) > 0 && across > widest) {
        widest = across;
        post = p;
      }
    }
    return { breadth: widest, obs, post };
  }

  /** The auricle's breadth and the two landmarks it is taken between. */
  interface IWidth {
    /** Direct distance from otobasion superius to postaurale across the long axis, mm. */
    breadth: number;

    /** Otobasion superius. */
    obs: V3;

    /** Postaurale. */
    post: V3;
  }

  /** A test whether a point lies within 2 mm of any of the given points, by a 2 mm grid. */
  function touching(points: V3[]): (p: V3) => boolean {
    const cells: Map<string, V3[]> = new Map();
    const cell: (a: number, b: number, c: number) => string = (a: number, b: number, c: number): string => `${Math.floor(a / 2)},${Math.floor(b / 2)},${Math.floor(c / 2)}`;

    for (const q of points) {
      const k: string = cell(q[0], q[1], q[2]);
      const list: V3[] | undefined = cells.get(k);

      if (list === undefined) cells.set(k, [q]);
      else list.push(q);
    }
    return (p: V3): boolean => {
      for (let a: number = -1; a <= 1; a++)
        for (let b: number = -1; b <= 1; b++)
          for (let d: number = -1; d <= 1; d++)
            for (const q of cells.get(cell(p[0] + 2 * a, p[1] + 2 * b, p[2] + 2 * d)) ?? []) if (A.dist(p, q) < 2) return true;
      return false;
    };
  }

  /**
   * Protrusion, in the horizontal section at the tragion's level: the helix
   * rim, the plate's most lateral point there, from the nearest section point
   * behind the whole auricle, the mastoid skin a ruler rests on.
   */
  function protrusion(skin: HumanAnatomy.ISkin, plate: V3[], tragion: V3, inward: 1 | -1): number {
    const level: V3[] = plate.filter((p: V3): boolean => Math.abs(p[1] - tragion[1]) <= 1);
    let rim: V3 = level[0] ?? [NaN, NaN, NaN];

    for (const p of level) if (Math.abs(p[2]) > Math.abs(rim[2])) rim = p;

    // The section on the auricle's own side, points tagged by whether they lie
    // on the plate.
    const cut: V3[] = A.polylines(skin, [0, tragion[1], 0], [0, 1, 0], band(skin, tragion[1] - 1, tragion[1] + 1))
      .flatMap((l: ILine): V3[] => resample(l.points, 0.5))
      .filter((q: V3): boolean => Math.sign(q[2]) === -inward && A.dist(q, tragion) < 60);
    const onPlate: boolean[] = cut.map((q: V3): boolean => level.some((p: V3): boolean => A.dist(p, q) < 1.5));
    let rear: number = Infinity;

    cut.forEach((q: V3, i: number): void => {
      if (onPlate[i]) rear = Math.min(rear, q[0]);
    });

    let nearest: number = Infinity;

    cut.forEach((q: V3, i: number): void => {
      if (!onPlate[i] && q[0] < rear) nearest = Math.min(nearest, A.dist(rim, q));
    });
    return Number.isFinite(nearest) ? nearest : NaN;
  }
}
