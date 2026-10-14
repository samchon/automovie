import { linearInterpolate as mix } from "../../mesh/linearInterpolate";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { appendPortraitCranium } from "./appendPortraitCranium";
import { portraitNeckShape } from "./portraitNeckShape";
import { IPortraitNeckSection } from "./structures/IPortraitNeckSection";
import { IPortraitNeckShape } from "./structures/IPortraitNeckShape";

/**
 * Join the submental floor and posterior nape to an authored cropped neck.
 * The attachment rises towards the occiput. Anterior and posterior depths are
 * controlled separately, as are the widths of the descending neck sections.
 * All vertices share the head's subdivision and normal field.
 * The collar must be the oriented opening returned by appendPortraitCranium.
 *
 * @evidence contracts/common.md#principled-implementation The oriented head collar follows cubic tangent handles to admitted descending upper/lower/crop ellipses, preserving shared skin and normal correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One mutable ring-append helper connects all Bezier/linear sections and returns the actual final open crop boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid radii/heights/projection or zero incoming tangents refuse; first-handle limits retain direction and bound its advance toward target depth/height, without certifying global curve monotonicity. Projection omission preserves original arithmetic.
 * @evidence contracts/common.md#meaningful-documentation The prose states oriented collar input, authored crop/depth controls and shared subdivision ownership; implementation comments explain tangent caps and compact projection joins.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in collar population C with fixed 12+8+2 transition rings; validation and handle setup scan C points and three sections once.
 * @evidence contracts/performance.md#reuse-equivalent-work Root angles and tangent handles are computed once and reused across all sampled rings instead of refitting the head boundary at each section.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Appended cage geometry and returned crop indices are caller-owned; temporary roots/handles/ring arrays expire and no resource or retained geometry cache is created.
 */
export function appendPortraitNeck(
  cage: IControlMesh,
  collar: ReturnType<typeof appendPortraitCranium>,
  shape: IPortraitNeckShape = portraitNeckShape,
): number[] {
  const { positions, indices, groups }: IControlMesh = cage;
  const projection: number =
    shape.submentalProjection === undefined ? 0 : shape.submentalProjection;
  if (!Number.isFinite(projection) || projection < 0 || projection > 40)
    throw new Error("Submental projection must be from zero through 40 mm.");
  const roots: number[][] = collar.boundary.map(
    (id: number): number[] => positions[id],
  );
  if (
    roots.length < 3 ||
    [shape.upper, shape.lower, shape.crop].some(
      (section: IPortraitNeckSection): boolean =>
        !Object.values(section).every(Number.isFinite) ||
        section.width <= 0 ||
        section.front <= 0 ||
        section.back <= 0,
    ) ||
    !(
      shape.crop.y < shape.lower.y &&
      shape.lower.y < shape.upper.y &&
      shape.upper.y <
        Math.min(...roots.map((point: number[]): number => point[1]))
    )
  )
    throw new Error(
      "Neck sections need finite positive radii and descending heights below their attachment.",
    );
  const angles: number[] = roots.map(([x, , z]: number[]): number =>
    Math.atan2(x, z - shape.upper.centre),
  );
  const section: ({
    y,
    width,
    front,
    back,
    centre,
  }: IPortraitNeckSection) => number[][] = ({
    y,
    width,
    front,
    back,
    centre,
  }: IPortraitNeckSection): number[][] =>
    angles.map((angle: number): number[] => {
      const cosine: number = Math.cos(angle);
      return [
        width * Math.sin(angle),
        y,
        centre + (cosine >= 0 ? front : back) * cosine,
      ];
    });
  const upper: number[][] = section(shape.upper);
  const lower: number[][] = section(shape.lower);
  const crop: number[][] = section(shape.crop);
  // Each collar vertex follows a cubic curve to the upper cervical section.
  // The first handle follows the adjacent head tangent; the second aligns with
  // the upper-to-lower neck direction. Sampling that curve provides a coherent
  // transition around the oblique collar before common skin subdivision.
  const handles: { first: number[]; second: number[] }[] = roots.map(
    (root: number[], i: number): { first: number[]; second: number[] } => {
      const incoming: number[] = root.map(
        (value: number, axis: number): number =>
          value - collar.exterior[i][axis],
      );
      const length: number = Math.hypot(...incoming);
      if (length === 0)
        throw new Error(
          "A neck attachment needs a nonzero incoming surface tangent.",
        );
      // A long neck must not amplify small lateral changes in the head tangent
      // into deep radial grooves. Limit the first guide by its adjacent head
      // spacing as well as by the remaining distance to the cervical section.
      let span: number = Math.min(
        0.5 * length,
        0.25 *
          Math.hypot(
            ...root.map(
              (value: number, axis: number): number => upper[i][axis] - value,
            ),
          ),
      );
      const depth: number = upper[i][2] - root[2];
      // Where the incoming tangent already faces the target depth, keep its
      // handle short of that target while preserving the tangent direction.
      if (incoming[2] * depth > 0)
        span = Math.min(span, 0.8 * Math.abs((depth * length) / incoming[2]));
      const drop: number = root[1] - upper[i][1];
      if (incoming[1] < 0)
        span = Math.min(span, (0.4 * drop * length) / -incoming[1]);
      const outgoing: number[] = lower[i].map(
        (value: number, axis: number): number => value - upper[i][axis],
      );
      const outgoingLength: number = Math.hypot(...outgoing);
      const approach: number = Math.min(
        0.25 *
          Math.hypot(
            ...root.map(
              (value: number, axis: number): number => upper[i][axis] - value,
            ),
          ),
        (0.4 * drop * outgoingLength) / -outgoing[1],
      );
      return {
        first: root.map(
          (value: number, axis: number): number =>
            value + (span * incoming[axis]) / length,
        ),
        second: upper[i].map(
          (value: number, axis: number): number =>
            value - (approach * outgoing[axis]) / outgoingLength,
        ),
      };
    },
  );
  let previous: number[] = collar.boundary;
  const addRing: (points: number[][]) => void = (points: number[][]): void => {
    const ring: number[] = points.map(
      (point: number[]): number => positions.push(point) - 1,
    );
    for (let i: number = 0; i < ring.length; i++) {
      const j: number = (i + 1) % ring.length;
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
  for (let row: number = 1; row <= 12; row++) {
    const t: number = row / 12,
      s: number = 1 - t;
    addRing(
      roots.map((root: number[], i: number): number[] => {
        const point: number[] = root.map(
          (value: number, axis: number): number =>
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
    for (let row: number = 1; row <= count; row++)
      addRing(
        from.map((point: number[], i: number): number[] =>
          point.map((value: number, axis: number): number =>
            mix(value, to[i][axis], row / count),
          ),
        ),
      );
  return previous;
}
