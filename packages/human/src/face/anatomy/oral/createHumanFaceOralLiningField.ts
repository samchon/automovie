import type { IHumanFaceOralArchFrame } from "./IHumanFaceOralArchFrame";
import type { IHumanFaceOralLiningDimensions } from "./IHumanFaceOralLiningDimensions";
import type { IHumanFaceOralLiningField } from "./IHumanFaceOralLiningField";
import { measureHumanFaceOralArchDepth } from "./measureHumanFaceOralArchDepth";
import { measureHumanFaceOralRingDistance } from "./measureHumanFaceOralRingDistance";

/**
 * Define one arch's lining as a height over its arch plane.
 *
 * At a plane point `p` the lining's apical coordinate is
 * `cervical(p) + rise(p)`:
 *
 * - `cervical(p)` is the local cervical height: over every cervical ring edge
 *   of the arch, the height of the edge at its point nearest `p`, averaged
 *   with inverse-square-distance weights. On a ring it equals the ring's own
 *   height at that point, along edges as well as at vertices, so the lining
 *   starts from each tooth's actual ring and not from a mean plane.
 *   A ring is scalloped and tilted, and that relief belongs to the gingival
 *   margin only. Over one wall clearance from the rings the reference fades
 *   linearly into the arch height, the same weighted mean taken over the
 *   station centres, so the fornix and the vault follow the arch and not
 *   each tooth's ring.
 * - `rise(p)` is zero on a cervical ring and positive elsewhere. On the
 *   facial side it climbs linearly to the collar height at the wall
 *   clearance, the vestibular fornix. On the lingual side it follows a
 *   half ellipse that leaves the ring vertically and reaches the vault at
 *   the arch's vault span: the palatal vault on the maxilla, the floor of
 *   the mouth on the mandible. The two are blended across the arch curve
 *   over one collar thickness on either side, so the lining is continuous
 *   between neighbouring teeth.
 *
 * The side is decided by the arch curve, the polyline through the station
 * centres, continued by unbounded posterior half-rays at both terminal
 * stations. No finite closing edge bounds the query domain. The boundary
 * owner reads odd horizontal-ray parity and distance to that same open arch.
 * A point on its lingual side therefore lets the lining keep its vault
 * height along the posterior edge between the terminal crowns and the
 * posterior opening stays open.
 *
 * A crown lies on the occlusal side of its ring and the rise is nowhere
 * negative, so this surface is apical of the local ring everywhere. It can
 * still meet a crown where a ring is tilted enough that the crown surface
 * passes apical of a neighbouring ring vertex; the oral admission reads that
 * relation on the emitted geometry.
 *
 * The half ellipse and the linear collar are authored profiles. No read
 * source gives the coronal or sagittal section of the palate, the gingival
 * contour or the sublingual sulcus as a curve.
 */
export function createHumanFaceOralLiningField(
  frame: IHumanFaceOralArchFrame,
  dimensions: IHumanFaceOralLiningDimensions,
): IHumanFaceOralLiningField {
  const stations = frame.stations;
  const distance = (u: number, v: number): number =>
    measureHumanFaceOralRingDistance(stations, u, v);
  const cervical = (u: number, v: number): number => {
    let weights = 0;
    let sum = 0;
    for (const station of stations) {
      const ring = station.cervical;
      const count = ring.length / 3;
      for (let k = 0; k < count; k++) {
        const next = (k + 1) % count;
        const ax = ring[3 * k];
        const ay = ring[3 * k + 1];
        const dx = ring[3 * next] - ax;
        const dy = ring[3 * next + 1] - ay;
        const length = dx * dx + dy * dy;
        const t =
          length === 0
            ? 0
            : Math.min(
                1,
                Math.max(0, ((u - ax) * dx + (v - ay) * dy) / length),
              );
        const height =
          ring[3 * k + 2] + t * (ring[3 * next + 2] - ring[3 * k + 2]);
        const squared = (u - ax - t * dx) ** 2 + (v - ay - t * dy) ** 2;
        if (squared === 0) return height;
        weights += 1 / squared;
        sum += height / squared;
      }
    }
    return sum / weights;
  };
  const archHeight = (u: number, v: number): number => {
    let weights = 0;
    let sum = 0;
    for (const station of stations) {
      const squared =
        (u - station.centre[0]) ** 2 + (v - station.centre[1]) ** 2;
      if (squared === 0) return station.centre[2];
      weights += 1 / squared;
      sum += station.centre[2] / squared;
    }
    return sum / weights;
  };
  const lingualDepth = (u: number, v: number): number => {
    return measureHumanFaceOralArchDepth(stations, u, v);
  };
  const apical = (u: number, v: number): number => {
    const d = distance(u, v);
    const facial =
      dimensions.collarHeightMetres *
      Math.min(1, d / dimensions.wallClearanceMetres);
    const reach =
      1 - Math.min(d, frame.vaultSpanMetres) / frame.vaultSpanMetres;
    const lingual = dimensions.vaultMetres * Math.sqrt(1 - reach * reach);
    const t = Math.min(
      1,
      Math.max(
        0,
        (lingualDepth(u, v) + dimensions.collarThicknessMetres) /
          (2 * dimensions.collarThicknessMetres),
      ),
    );
    const blend = t * t * (3 - 2 * t);
    // The scallop of the rings fades into the arch's own height by the fornix.
    const fade = Math.min(1, d / dimensions.wallClearanceMetres);
    const reference =
      cervical(u, v) + (archHeight(u, v) - cervical(u, v)) * fade;
    return reference + facial + (lingual - facial) * blend;
  };
  return { distance, apical, lingualDepth };
}
