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

  /**
   * IHMC's one-step capture region (`physicalOneStepCaptureRegion`,
   * `OneStepCaptureRegionCalculator.calculateCaptureRegion`, which takes any
   * convex support polygon) on the support left while a limb swings. The
   * reachable fan opens toward the swing side
   * (`OneStepCaptureRegionCalculator.calculateReachableRegions`, `swingSide`):
   * the side of the remaining support's centroid the swinging limb stands on,
   * across the frame's lateral axis, and the foot width is the polygon's
   * extent along that axis. The region is computed in the frame of
   * {@link WORLD} moved to that centroid, as IHMC's is in the support sole's
   * frame, and moved back.
   *
   * @param input The remaining support polygon, the capture point and the
   *   swinging limb's point, all in the frame of {@link WORLD}, the pendulum's
   *   rate, per second, the swing time left, seconds, and the step range,
   *   metres.
   * @returns The region, in the frame of {@link WORLD}; empty when there is
   *   none.
   */
  export function captureRegion(input: {
    polygon: readonly Polygon.IPoint[];
    capture: Polygon.IPoint;
    swing: Polygon.IPoint;
    omega: number;
    remaining: number;
    range: number;
  }): Polygon.IPoint[] {
    const centroid: Polygon.IPoint = Polygon.centroid(input.polygon);
    const moved = (p: Polygon.IPoint): Polygon.IPoint => ({
      x: p.x - centroid.x,
      y: p.y - centroid.y,
    });
    const ys: number[] = input.polygon.map((p: Polygon.IPoint): number => p.y);
    return physicalOneStepCaptureRegion({
      // The fan opens away from the support side, toward the swing side.
      support: input.swing.y > centroid.y ? "right" : "left",
      remaining: input.remaining,
      capture: moved(input.capture),
      omega: input.omega,
      foot: input.polygon.map(moved),
      footWidth: Math.max(...ys) - Math.min(...ys),
      range: input.range,
    }).map(
      (p: Polygon.IPoint): Polygon.IPoint => ({
        x: p.x + centroid.x,
        y: p.y + centroid.y,
      }),
    );
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
 * points' hull first. On a line the coordinate along it alone, clamped to the
 * points' span; at one point, one.
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
    equalities.push({ a: dx, b: inside.x - cx }, { a: dz, b: inside.z - cz });
  } else {
    const ux: number = Math.sqrt(sxx / trace) * (sxz < 0 ? -1 : 1);
    const uz: number = Math.sqrt(szz / trace);
    const s: number[] = dx.map((v, i) => v * ux + dz[i]! * uz);
    const ps: number = (pivot.x - cx) * ux + (pivot.z - cz) * uz;
    equalities.push({
      a: s,
      b: Math.min(Math.max(...s), Math.max(Math.min(...s), ps)),
    });
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
  return solved ?? points.map(() => 1 / n);
}
