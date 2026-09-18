import { portraitMix as mix } from "../../mesh/portraitMix";
import type { IControlMesh } from "../../mesh/IControlMesh";
import { appendPortraitCranium } from "./appendPortraitCranium";
import { portraitNeckShape } from "./portraitNeckShape";
import { IPortraitNeckSection } from "./structures/IPortraitNeckSection";
import { IPortraitNeckShape } from "./structures/IPortraitNeckShape";

/**
 * Join the submental floor and posterior nape to an authored cropped neck.
 * The attachment rises towards the occiput. Anterior and posterior depths are
 * controlled separately and the lower neck widens towards its cropped base.
 * All vertices share the head's subdivision and normal field.
 * The collar must be the oriented opening returned by appendPortraitCranium.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Joins throat and nape to the head through controlled cervical sections on one skin surface.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Samples tangent-guided collar transitions and ordered neck rings using shared indices and material ownership.
 */
export function appendPortraitNeck(
  cage: IControlMesh,
  collar: ReturnType<typeof appendPortraitCranium>,
  shape: IPortraitNeckShape = portraitNeckShape,
): number[] {
  const { positions, indices, groups } = cage;
  const projection =
    shape.submentalProjection === undefined ? 0 : shape.submentalProjection;
  if (!Number.isFinite(projection) || projection < 0 || projection > 40)
    throw new Error("Submental projection must be from zero through 40 mm.");
  const roots = collar.boundary.map((id) => positions[id]);
  if (
    roots.length < 3 ||
    [shape.upper, shape.lower, shape.crop].some(
      (section) =>
        !Object.values(section).every(Number.isFinite) ||
        section.width <= 0 ||
        section.front <= 0 ||
        section.back <= 0,
    ) ||
    !(
      shape.crop.y < shape.lower.y &&
      shape.lower.y < shape.upper.y &&
      shape.upper.y < Math.min(...roots.map((point) => point[1]))
    )
  )
    throw new Error(
      "Neck sections need finite positive radii and descending heights below their attachment.",
    );
  const angles = roots.map(([x, , z]) => Math.atan2(x, z - shape.upper.centre));
  const section = ({
    y,
    width,
    front,
    back,
    centre,
  }: IPortraitNeckSection): number[][] =>
    angles.map((angle) => {
      const cosine = Math.cos(angle);
      return [
        width * Math.sin(angle),
        y,
        centre + (cosine >= 0 ? front : back) * cosine,
      ];
    });
  const upper = section(shape.upper);
  const lower = section(shape.lower);
  const crop = section(shape.crop);
  // Each collar vertex follows a cubic curve to the upper cervical section.
  // The first handle follows the adjacent head tangent; the second aligns with
  // the upper-to-lower neck direction. Sampling that curve provides a coherent
  // transition around the oblique collar before common skin subdivision.
  const handles = roots.map((root, i) => {
    const incoming = root.map(
      (value, axis) => value - collar.exterior[i][axis],
    );
    const length = Math.hypot(...incoming);
    if (length === 0)
      throw new Error(
        "A neck attachment needs a nonzero incoming surface tangent.",
      );
    // A long neck must not amplify small lateral changes in the head tangent
    // into deep radial grooves. Limit the first guide by its adjacent head
    // spacing as well as by the remaining distance to the cervical section.
    let span = Math.min(
      0.5 * length,
      0.25 * Math.hypot(...root.map((value, axis) => upper[i][axis] - value)),
    );
    const depth = upper[i][2] - root[2];
    // Where the incoming tangent already faces the target depth, keep its
    // handle short of that target. This preserves the tangent direction while
    // preventing a backtracking upper-neck curve.
    if (incoming[2] * depth > 0)
      span = Math.min(span, 0.8 * Math.abs((depth * length) / incoming[2]));
    const drop = root[1] - upper[i][1];
    if (incoming[1] < 0)
      span = Math.min(span, (0.4 * drop * length) / -incoming[1]);
    const outgoing = lower[i].map((value, axis) => value - upper[i][axis]);
    const outgoingLength = Math.hypot(...outgoing);
    const approach = Math.min(
      0.25 * Math.hypot(...root.map((value, axis) => upper[i][axis] - value)),
      (0.4 * drop * outgoingLength) / -outgoing[1],
    );
    return {
      first: root.map(
        (value, axis) => value + (span * incoming[axis]) / length,
      ),
      second: upper[i].map(
        (value, axis) => value - (approach * outgoing[axis]) / outgoingLength,
      ),
    };
  });
  let previous = collar.boundary;
  const addRing = (points: number[][]): void => {
    const ring = points.map((point) => positions.push(point) - 1);
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      indices.push(
        previous[i],
        previous[j],
        ring[i],
        previous[j],
        ring[j],
        ring[i],
      );
      groups.push(0, 0);
    }
    previous = ring;
  };
  // Evaluate the Bezier curve into skin rings; its tangent handles are control
  // points and do not enter the mesh. Sample the lower neck at comparable
  // spacing with an incoming direction matching the final Bezier derivative.
  for (let row = 1; row <= 12; row++) {
    const t = row / 12,
      s = 1 - t;
    addRing(
      roots.map((root, i) => {
        const point = root.map(
          (value, axis) =>
            value * s ** 3 +
            3 * handles[i].first[axis] * s * s * t +
            3 * handles[i].second[axis] * s * t * t +
            upper[i][axis] * t ** 3,
        );
        // A compact quartic adds only anterior volume and has zero value and
        // derivative at both joins. Omission preserves the original arithmetic.
        if (projection !== 0)
          point[2] +=
            projection *
            16 *
            t *
            t *
            s *
            s *
            Math.max(0, Math.cos(angles[i])) ** 2;
        return point;
      }),
    );
  }
  for (const [from, to, count] of [
    [upper, lower, 8],
    [lower, crop, 2],
  ] as const)
    for (let row = 1; row <= count; row++)
      addRing(
        from.map((point, i) =>
          point.map((value, axis) => mix(value, to[i][axis], row / count)),
        ),
      );
  return previous;
}
