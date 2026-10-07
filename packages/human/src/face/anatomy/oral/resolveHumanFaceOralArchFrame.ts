import type { IHumanFaceOralArchFrame } from "./IHumanFaceOralArchFrame";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";
import { measureHumanFaceOralRingDistance } from "./measureHumanFaceOralRingDistance";

/**
 * Resolve the frame of one dental arch from its crowns' cervical rings.
 *
 * The plane is the least-squares plane `y = α + βx + γz` through the ring
 * centres, which minimises their vertical residuals; a dental arch lies
 * within a few degrees of the head's horizontal plane, so the regression is
 * well conditioned and a vertical arch refuses by its singular system. The
 * anterior direction is the head's +Z lowered into that plane, the lateral
 * direction points toward the anatomical left, and the apical direction is
 * the plane normal on the side away from the crowns. Thus `(lateral,
 * anterior, apical)` is left-handed on the maxilla and right-handed on the
 * mandible; those declared directions are not reordered to change handedness.
 *
 * Stations run from the right terminal tooth through the midline to the left
 * terminal tooth by ISO identity (quadrants 1 and 4 by descending position,
 * then quadrants 2 and 3 by ascending position), never by coordinate, so an
 * authored arch placement cannot reorder them.
 *
 * The vault span is read on the arch's midline, the mean lateral coordinate
 * of the ring centres. The existing numerical convention takes the maximum
 * nearest-ring distance over 65 uniformly spaced positions, including both
 * rearmost and foremost ring-centre coordinates. It is a sampled proxy for
 * the authored vault transition width, not a certified continuous maximum
 * or an acquired anatomical width. The lining reaches its supplied vault
 * height at and beyond this positive span; no exact-maximum gate uses it.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary least squares on the sixteen ring centres gives the plane the rings lie about; the frame is completed by projection and a cross product, both exact for unit vectors.
 * @evidence contracts/common.md#clear-and-simple-design One resolver owns the plane, the order and the span every lining formula reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads every registered crown of the arch, absent or present, and refuses a degenerate plane instead of falling back to head axes.
 * @evidence contracts/common.md#meaningful-documentation States the fit, its conditioning premise, the ordering rule and how the span is read.
 * @evidence contracts/modeling.md#part-identity-and-grouping Orders the arch's crowns by registered identity into one group.
 * @evidence contracts/modeling.md#spatial-conventions Converts head-frame metres to arch-frame `(u, v, a)` metres at this one boundary.
 * @evidence contracts/modeling.md#shared-boundaries Every lining surface of the arch reads this frame, so their heights share one reference.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes already shaped positions and no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining built in this frame.
 * @evidence contracts/anatomy.md#anatomical-source Licensed source cervical ports define the plane; it is a geometric convention and no measured occlusal or Frankfort relation.
 * @evidence contracts/anatomy.md#permitted-range Refuses a ring-centre population that spans no plane.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function resolveHumanFaceOralArchFrame(
  members: readonly IHumanFaceOralCrown[],
  dental: readonly number[],
  mandibular: boolean,
): IHumanFaceOralArchFrame {
  if (members.length < 3)
    throw new Error("Oral arch frame needs at least three registered crowns.");
  const order = (crown: IHumanFaceOralCrown): number => {
    const quadrant = Number(crown.id[0]);
    const position = Number(crown.id[1]);
    return quadrant === 1 || quadrant === 4 ? -position : position;
  };
  const ordered = [...members].sort((a, b) => order(a) - order(b));
  const point = (vertex: number): number[] => [
    dental[3 * vertex],
    dental[3 * vertex + 1],
    dental[3 * vertex + 2],
  ];
  const centres = ordered.map((crown) => {
    const ring = crown.cervical.map(point);
    return [0, 1, 2].map(
      (axis) => ring.reduce((sum, p) => sum + p[axis], 0) / ring.length,
    );
  });
  const origin = [0, 1, 2].map(
    (axis) => centres.reduce((sum, p) => sum + p[axis], 0) / centres.length,
  );
  // Centred normal equations of y = α + βx + γz.
  let xx = 0;
  let xz = 0;
  let zz = 0;
  let xy = 0;
  let zy = 0;
  for (const centre of centres) {
    const x = centre[0] - origin[0];
    const y = centre[1] - origin[1];
    const z = centre[2] - origin[2];
    xx += x * x;
    xz += x * z;
    zz += z * z;
    xy += x * y;
    zy += z * y;
  }
  const determinant = xx * zz - xz * xz;
  if (!(Math.abs(determinant) > Number.EPSILON * xx * zz))
    throw new Error("Oral arch ring centres do not span a plane.");
  const beta = (xy * zz - zy * xz) / determinant;
  const gamma = (zy * xx - xy * xz) / determinant;
  const unit = (vector: number[]): number[] => {
    const length = Math.hypot(...vector);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error("Oral arch frame has a degenerate direction.");
    return vector.map((value) => value / length);
  };
  const normal = unit([-beta, 1, -gamma]);
  const forward = unit(
    [0, 0, 1].map((value, axis) => value - normal[2] * normal[axis]),
  );
  const lateral = [
    normal[1] * forward[2] - normal[2] * forward[1],
    normal[2] * forward[0] - normal[0] * forward[2],
    normal[0] * forward[1] - normal[1] * forward[0],
  ];
  const apical = mandibular ? normal.map((value) => -value) : normal;
  const local = (p: readonly number[]): number[] => {
    const delta = p.map((value, axis) => value - origin[axis]);
    const dot = (direction: readonly number[]): number =>
      delta[0] * direction[0] +
      delta[1] * direction[1] +
      delta[2] * direction[2];
    return [dot(lateral), dot(forward), dot(apical)];
  };
  const stations: IHumanFaceOralToothStation[] = ordered.map((crown, at) => ({
    id: crown.id,
    centre: local(centres[at]),
    cervical: crown.cervical.flatMap((vertex) => local(point(vertex))),
    vertices: [...crown.cervical],
  }));
  const midline =
    stations.reduce((sum, station) => sum + station.centre[0], 0) /
    stations.length;
  const rear = Math.min(...stations.map((station) => station.centre[1]));
  const front = Math.max(...stations.map((station) => station.centre[1]));
  const samples = 64;
  let vaultSpanMetres = 0;
  for (let k = 0; k <= samples; k++)
    vaultSpanMetres = Math.max(
      vaultSpanMetres,
      measureHumanFaceOralRingDistance(
        stations,
        midline,
        rear + ((front - rear) * k) / samples,
      ),
    );
  if (!(vaultSpanMetres > 0) || !Number.isFinite(vaultSpanMetres))
    throw new Error("Oral arch frame has no finite vault span.");
  return {
    mandibular,
    origin,
    lateral,
    forward,
    apical,
    stations,
    vaultSpanMetres,
  };
}
