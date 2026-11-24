import { physicalOneStepCaptureRegion } from "./physicalOneStepCaptureRegion";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

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
   * convex support polygon) on a polygon of any number of contacts: the
   * polygon is the support, its lateral extent the foot width, and the
   * reachable fan opens toward the capture point's side of the polygon's
   * centroid, as the swing side.
   *
   * @param input The support polygon, the capture point, both in the frame of
   *   {@link WORLD}, the pendulum's rate, per second, the swing time left,
   *   seconds, and the step range, metres.
   * @returns The region, in the frame of {@link WORLD}; empty when there is
   *   none.
   */
  export function captureRegion(input: {
    polygon: readonly Polygon.IPoint[];
    capture: Polygon.IPoint;
    omega: number;
    remaining: number;
    range: number;
  }): Polygon.IPoint[] {
    const ys: number[] = input.polygon.map((p: Polygon.IPoint): number => p.y);
    const centroid: Polygon.IPoint = Polygon.centroid(input.polygon);
    return physicalOneStepCaptureRegion({
      support: input.capture.y > centroid.y ? "right" : "left",
      remaining: input.remaining,
      capture: input.capture,
      omega: input.omega,
      foot: input.polygon,
      footWidth: Math.max(...ys) - Math.min(...ys),
      range: input.range,
    });
  }

  /**
   * The weight m g at the pivot split over the planted contacts: the
   * least-norm shares w that sum to one and put their weighted mean of the
   * contacts' centroids at the pivot, sum w_i = 1 and sum w_i p_i = pivot
   * (the Moore-Penrose solution, Penrose 1955). Contacts on a line take the
   * line's coordinate only, so two share by the pivot's place between them;
   * one takes everything.
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
 * The least-norm weights w with A w = b, A's rows the ones and the points'
 * coordinates, b = (1, pivot): centred, w = 1/n + d^T S^-1 (pivot - mean). On
 * a line the coordinate along it alone; at one point, one.
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
  const px: number = pivot.x - cx;
  const pz: number = pivot.z - cz;
  const det: number = sxx * szz - sxz * sxz;
  const trace: number = sxx + szz;
  if (det > 1e-12 * trace * trace) {
    const ax: number = (szz * px - sxz * pz) / det;
    const az: number = (sxx * pz - sxz * px) / det;
    return dx.map((v, i) => 1 / n + v * ax + dz[i]! * az);
  }
  if (!(trace > 0)) return points.map(() => 1 / n);
  const ux: number = Math.sqrt(sxx / trace) * (sxz < 0 ? -1 : 1);
  const uz: number = Math.sqrt(szz / trace);
  const s: number[] = dx.map((v, i) => v * ux + dz[i]! * uz);
  const sss: number = s.reduce((sum, v) => sum + v * v, 0);
  const ps: number = px * ux + pz * uz;
  return s.map((v) => 1 / n + (v * ps) / sss);
}
