import { physicalOneStepCaptureRegion } from "./physicalOneStepCaptureRegion";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { solveDenseActiveSet } from "./solveDenseActiveSet";

/**
 * The support pieces of a push response for a body of any number of planted
 * limbs: the support polygon, the support left while a limb swings, the
 * one-step capture region on a polygon, and the weight's split over the
 * planted contacts. None of them branches on a limb count or an anatomy; the
 * stepping limbs, their order and timing come from the body's authored
 * footfall pattern (`IAutoMovieFootfallPattern`), not from here.
 *
 * Points are world floor points (x, z), metres; polygons are in
 * `physicalPlanarPolygon`'s frame of the world-aligned {@link WORLD}.
 */
export namespace physicalSupportSpanContacts {
  /** The world-aligned frame every polygon here is in. */
  export const WORLD: Polygon.IFrame = {
    origin: { x: 0, z: 0 },
    forward: { x: 0, z: 1 },
  };

  /** A planted limb's contact on the floor. */
  export interface IContact {
    /** The limb's support endpoint bone (an `IAutoMovieFootfallPattern` limb). */
    bone: string;

    /** Its floor witnesses, world x and z; one point for a point contact. */
    points: readonly { x: number; z: number }[];
  }

  /** A planted contact's share of the weight. */
  export interface ILoad {
    /** The contact's bone. */
    bone: string;

    /** Its share of m g at the pivot, the shares summing to one. */
    share: number;
  }

  /**
   * The support polygon: the convex hull of the planted contacts' witnesses.
   *
   * @param contacts The planted contacts, any number.
   * @returns The hull, in the frame of {@link WORLD}.
   */
  export function hull(contacts: readonly IContact[]): Polygon.IPoint[] {
    return Polygon.hull(
      contacts.flatMap((contact: IContact): Polygon.IPoint[] =>
        contact.points.map(
          (p: { x: number; z: number }): Polygon.IPoint =>
            Polygon.local(WORLD, p),
        ),
      ),
    );
  }

  /**
   * The support left while a limb swings: the hull of the other contacts.
   *
   * @param contacts The planted contacts.
   * @param swing The swinging limb's bone.
   * @returns The hull without it.
   */
  export function remaining(
    contacts: readonly IContact[],
    swing: string,
  ): Polygon.IPoint[] {
    return hull(
      contacts.filter((contact: IContact): boolean => contact.bone !== swing),
    );
  }

  /** A disc the swinging limb can reach, in the frame of {@link WORLD}. */
  export interface IReach {
    /** Its centre. */
    center: Polygon.IPoint;

    /** Its radius, metres. */
    radius: number;
  }

  /**
   * IHMC's one-step capture region on the support left while a limb swings,
   * one rule for every body: the raw region of the remaining polygon
   * (`physicalOneStepCaptureRegion.raw`,
   * `OneStepCaptureRegionCalculator.calculateCaptureRegion` l.165-218, which
   * takes any convex support polygon) cut by every reach disc in place of the
   * biped's side fan (l.220-231), as the quadruped's step adjustment bounds an
   * adjusted step about its nominal one
   * (`QuadrupedStepAdjustmentController.computeStepAdjustment` l.143-150,
   * `physicalQuadrupedStepAdjustment`). Each disc is the polygon of its
   * circle's `MAX_CAPTURE_REGION_POLYGON_POINTS - 1` points, as the reference
   * samples its reachable fan (l.102-123). With the capture point inside the
   * support the region is the discs' intersection alone.
   *
   * @param input The remaining support polygon and the capture point, in the
   *   frame of {@link WORLD}, the pendulum's rate, per second, the swing time
   *   left, seconds, and the discs the swinging limb can reach.
   * @returns The region, in the frame of {@link WORLD}; empty when there is
   *   none.
   */
  export function captureRegion(input: {
    polygon: readonly Polygon.IPoint[];
    capture: Polygon.IPoint;
    omega: number;
    remaining: number;
    reach: readonly IReach[];
  }): Polygon.IPoint[] {
    if (input.reach.length === 0) return [];
    const count: number =
      physicalOneStepCaptureRegion.MAX_CAPTURE_REGION_POLYGON_POINTS - 1;
    const discs: Polygon.IPoint[][] = input.reach.map(
      (disc: IReach): Polygon.IPoint[] =>
        Polygon.hull(
          Array.from({ length: count }, (_, i: number): Polygon.IPoint => ({
            x: disc.center.x + disc.radius * Math.cos((2 * Math.PI * i) / count),
            y: disc.center.y + disc.radius * Math.sin((2 * Math.PI * i) / count),
          })),
        ),
    );
    const raw: Polygon.IPoint[] | undefined = physicalOneStepCaptureRegion.raw({
      remaining: input.remaining,
      capture: input.capture,
      omega: input.omega,
      foot: input.polygon,
      range: Math.max(...input.reach.map((disc: IReach): number => disc.radius)),
    });
    let region: Polygon.IPoint[] = raw ?? discs[0]!;
    for (const disc of raw === undefined ? discs.slice(1) : discs) {
      if (region.length === 0) return [];
      region = Polygon.intersect(region, disc);
    }
    return region;
  }

  /**
   * The weight m g at the pivot split over the planted contacts, as IHMC
   * distributes contact force over nonnegative basis magnitudes rho >= 0
   * under a minimum rho weight (`WrenchMatrixCalculator`): the shares w of
   * least norm, min |w|^2, with sum w_i = 1, sum w_i p_i = pivot over the
   * contacts' centroids and w_i >= 0, solved by `solveDenseActiveSet`. A pivot
   * outside the contacts' hull is projected onto it first; contacts on a line
   * keep the line's coordinate only, so two share by the pivot's place between
   * them; one takes everything.
   *
   * @param contacts The planted contacts.
   * @param pivot The pivot, world x and z.
   * @returns Each contact's share, in input order.
   * @throws {Error} When the solver fails on the feasible program, with the
   *   inputs.
   */
  export function loads(
    contacts: readonly IContact[],
    pivot: { x: number; z: number },
  ): ILoad[] {
    const shares: number[] = split(contacts.map(mean), pivot);
    return contacts.map(
      (contact: IContact, i: number): ILoad => ({
        bone: contact.bone,
        share: shares[i]!,
      }),
    );
  }
}

/** A contact's witnesses' centroid. */
function mean(contact: physicalSupportSpanContacts.IContact): {
  x: number;
  z: number;
} {
  const n: number = Math.max(1, contact.points.length);
  return {
    x: contact.points.reduce((sum, p) => sum + p.x, 0) / n,
    z: contact.points.reduce((sum, p) => sum + p.z, 0) / n,
  };
}

/**
 * The least-norm nonnegative weights w with sum w = 1 and sum w d = pivot -
 * mean over the centred points d: the equalities as pairs of opposite rows
 * and -w_i <= 0, for `solveDenseActiveSet`. The pivot is projected into the
 * points' hull first. A pivot on the hull's boundary, within 1e-9 of the
 * points' spread, is carried by the boundary's face alone, since a convex
 * combination on a supporting line weights only the points on it: at a
 * vertex the points there share evenly, the least norm among them, and on an
 * edge the points on its line split as on a line. On a line the coordinate
 * along it alone, clamped to the points' span; at one point, one.
 */
function split(
  points: readonly { x: number; z: number }[],
  pivot: { x: number; z: number },
): number[] {
  const n: number = points.length;
  if (n === 0) return [];
  if (n === 1) return [1];
  const cx: number = points.reduce((s, p) => s + p.x, 0) / n;
  const cz: number = points.reduce((s, p) => s + p.z, 0) / n;
  const dx: number[] = points.map((p) => p.x - cx);
  const dz: number[] = points.map((p) => p.z - cz);
  const sxx: number = dx.reduce((s, v) => s + v * v, 0);
  const szz: number = dz.reduce((s, v) => s + v * v, 0);
  const sxz: number = dx.reduce((s, v, i) => s + v * dz[i]!, 0);
  const det: number = sxx * szz - sxz * sxz;
  const trace: number = sxx + szz;
  if (!(trace > 0)) return points.map(() => 1 / n);
  const tolerance: number = 1e-9 * Math.sqrt(trace);

  // The points at a place, sharing evenly.
  const at = (place: { x: number; z: number }): number[] | undefined => {
    const near: boolean[] = points.map(
      (p) => Math.hypot(p.x - place.x, p.z - place.z) <= tolerance,
    );
    const count: number = near.filter(Boolean).length;
    return count > 0 ? near.map((v) => (v ? 1 / count : 0)) : undefined;
  };

  // The equality rows and their values: the plane's two coordinates, or the
  // line's one.
  const equalities: { a: number[]; b: number }[] = [
    { a: points.map(() => 1), b: 1 },
  ];
  if (det > 1e-12 * trace * trace) {
    const frame = physicalSupportSpanContacts.WORLD;
    const polygon: Polygon.IPoint[] = Polygon.hull(
      points.map((p) => Polygon.local(frame, p)),
    );
    const local: Polygon.IPoint = Polygon.local(frame, pivot);
    const inside: { x: number; z: number } = Polygon.inside(polygon, local)
      ? pivot
      : Polygon.world(frame, Polygon.project(polygon, local));

    // On the boundary: the face's points alone.
    if (
      Polygon.signedDistance(polygon, Polygon.local(frame, inside)) >
      -tolerance
    ) {
      const vertex: number[] | undefined = at(inside);
      if (vertex) return vertex;
      let edge: { a: Polygon.IPoint; b: Polygon.IPoint } | undefined;
      let best: number = Number.POSITIVE_INFINITY;
      const q: Polygon.IPoint = Polygon.local(frame, inside);
      for (let i: number = 0; i < polygon.length; i++) {
        const a: Polygon.IPoint = polygon[i]!;
        const b: Polygon.IPoint = polygon[(i + 1) % polygon.length]!;
        const length: number = Math.hypot(b.x - a.x, b.y - a.y);
        const distance: number = Math.abs(
          ((b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x)) / length,
        );
        if (distance < best) {
          best = distance;
          edge = { a, b };
        }
      }
      const { a, b } = edge!;
      const length: number = Math.hypot(b.x - a.x, b.y - a.y);
      const face: number[] = [];
      points.forEach((p, i) => {
        const l: Polygon.IPoint = Polygon.local(frame, p);
        if (
          Math.abs(
            ((b.x - a.x) * (l.y - a.y) - (b.y - a.y) * (l.x - a.x)) / length,
          ) <= tolerance
        )
          face.push(i);
      });
      const shares: number[] = split(
        face.map((i) => points[i]!),
        inside,
      );
      const out: number[] = points.map(() => 0);
      face.forEach((i, k) => (out[i] = shares[k]!));
      return out;
    }
    equalities.push({ a: dx, b: inside.x - cx }, { a: dz, b: inside.z - cz });
  } else {
    const ux: number = Math.sqrt(sxx / trace) * (sxz < 0 ? -1 : 1);
    const uz: number = Math.sqrt(szz / trace);
    const s: number[] = dx.map((v, i) => v * ux + dz[i]! * uz);
    const ps: number = (pivot.x - cx) * ux + (pivot.z - cz) * uz;
    const clamped: number = Math.min(
      Math.max(...s),
      Math.max(Math.min(...s), ps),
    );

    // At an end of the line: the points there.
    const end: number | undefined = [Math.min(...s), Math.max(...s)].find(
      (e) => Math.abs(clamped - e) <= tolerance,
    );
    if (end !== undefined) {
      const near: boolean[] = s.map((v) => Math.abs(v - end) <= tolerance);
      const count: number = near.filter(Boolean).length;
      return near.map((v) => (v ? 1 / count : 0));
    }
    equalities.push({ a: s, b: clamped });
  }
  const solved: number[] | null = solveDenseActiveSet({
    quadratic: points.map((_, i) => points.map((__, j) => (i === j ? 1 : 0))),
    linear: points.map(() => 0),
    rows: [
      ...equalities.flatMap((row) => [
        { a: row.a, b: row.b },
        { a: row.a.map((v) => -v), b: -row.b },
      ]),
      ...points.map((_, i) => ({
        a: points.map((__, j) => (i === j ? -1 : 0)),
        b: 0,
      })),
    ],
  });
  // The pivot lies in the points' hull, so the program is feasible: a failure
  // is a bug, never a split to guess.
  if (solved === null)
    throw new Error(
      `physicalSupportSpanContacts.loads: no split of ${JSON.stringify(
        points,
      )} at ${JSON.stringify(pivot)}.`,
    );
  return solved;
}
