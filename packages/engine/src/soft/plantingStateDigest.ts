import { IAutoMoviePlantingDomain, IAutoMoviePlantingLeaf, IAutoMoviePlantingState, IAutoMoviePruningEnvelope, IAutoMovieQuaternion, IAutoMovieSoftBounds, IAutoMovieVector3 } from "@automovie/interface";
import { seededValue } from "../math/seededValue";

/**
 * A stable 32-bit FNV-1a digest of one derived planting structure, as lowercase
 * hex.
 *
 * Two structures digest alike only when every coordinate, quaternion component
 * and scale is bit-identical, so it is the compact evidence that a
 * re-derivation or a second machine reproduced the reference plant rather than
 * merely a similar one.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Records exact equality of a deterministically derived planting state.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Provides the repeatability receipt for the generated planting structure.
 * @author Samchon
 */
export const plantingStateDigest = (state: IAutoMoviePlantingState): string => {
  const values: number[] = [
    state.stage,
    state.branches.length,
    state.leaves.length,
  ];
  for (const branch of state.branches)
    values.push(
      branch.level,
      branch.start.x,
      branch.start.y,
      branch.start.z,
      branch.end.x,
      branch.end.y,
      branch.end.z,
      branch.radiusStart,
      branch.radiusEnd,
      branch.pruned ? 1 : 0,
    );
  for (const leaf of state.leaves)
    values.push(
      leaf.translation.x,
      leaf.translation.y,
      leaf.translation.z,
      leaf.rotation.x,
      leaf.rotation.y,
      leaf.rotation.z,
      leaf.rotation.w,
      leaf.scale.x,
      leaf.scale.y,
      leaf.scale.z,
    );
  const view = new DataView(new ArrayBuffer(8));
  let hash = 0x811c9dc5;
  for (const value of values) {
    view.setFloat64(0, value, true);
    for (let byte = 0; byte < 8; ++byte) {
      hash = (hash ^ view.getUint8(byte)) >>> 0;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
};

/**
 * The uniform-grid key one ground position falls in.
 *
 * The neighbourhood walk offsets the two integer indices rather than the two
 * coordinates: `floor((x + side)/side)` and `floor(x/side) + 1` are the same
 * rational number and not always the same double, and a neighbourhood that
 * misses a cell is a spacing rule that silently stops holding.
 */
const cell = (side: number, x: number, z: number): [number, number] => [
  Math.floor(x / side),
  Math.floor(z / side),
];

/**
 * Whether an accepted member already stands closer than the minimum spacing.
 *
 * The grid side is the spacing itself, so a member within that distance can
 * only be in the candidate's own cell or one of the eight around it. Walking
 * those nine answers exactly what walking every member would, at a cost that
 * does not grow with the size of the bed.
 */
const crowded = (
  occupied: Map<string, { x: number; z: number }[]>,
  side: number,
  spacing: number,
  x: number,
  z: number,
): boolean => {
  const [cx, cz] = cell(side, x, z);
  for (let dx = -1; dx <= 1; ++dx)
    for (let dz = -1; dz <= 1; ++dz) {
      const bucket = occupied.get(`${cx + dx},${cz + dz}`);
      if (bucket === undefined) continue;
      for (const other of bucket) {
        const ox = other.x - x;
        const oz = other.z - z;
        if (ox * ox + oz * oz < spacing) return true;
      }
    }
  return false;
};

/**
 * Leaves borne by one derived branch, in stable index order.
 *
 * The declared leaf cap is enforced **while** blades are emitted rather than
 * once the whole structure is derived. A density is leaves per metre and is
 * deliberately not capped — a moss is not a wrong plant — so a branch can ask
 * for more blades than the recipe allows, and a cap only checked afterwards
 * would be a cap the machine has to exhaust itself reaching.
 */
const bearLeaves = (props: {
  domain: IAutoMoviePlantingDomain;
  branch: string;
  level: number;
  key: number;
  base: IAutoMovieVector3;
  axis: IAutoMovieVector3;
  length: number;
  leaves: IAutoMoviePlantingLeaf[];
}): void => {
  const foliage = props.domain.foliage;
  if (foliage === null || props.level < foliage.minLevel) return;
  const count = Math.floor(foliage.density * props.length);
  const align = shortestArcFromUp(props.axis);
  for (let index = 0; index < count; ++index) {
    if (props.leaves.length >= props.domain.budget.maxLeaves)
      throw new Error(
        `planting "${props.domain.id}" exceeded its declared cap of ${props.domain.budget.maxLeaves} leaves`,
      );
    const along = ((index + 0.5) / count) * props.length;
    const roll = yaw(
      seededValue(props.domain.seed, props.key, SALT_LEAF_ROLL, index),
      foliage.rollJitter,
    );
    const factor = jitter(
      props.domain.seed,
      props.key,
      SALT_LEAF_SCALE,
      foliage.scaleJitter,
      index,
    );
    props.leaves.push({
      id: `${props.branch}:leaf#${index}`,
      branch: props.branch,
      translation: {
        x: props.base.x + props.axis.x * along,
        y: props.base.y + props.axis.y * along,
        z: props.base.z + props.axis.z * along,
      },
      // Roll first in the leaf's own frame, then align that frame's `+y` to the
      // branch: composing the other way would spin the blade about world `+y`
      // and a drooping branch would carry a fan of leaves in the wrong plane.
      rotation: multiply(align, roll),
      scale: {
        x: foliage.size.x * factor,
        y: foliage.size.y * factor,
        z: foliage.size.z * factor,
      },
    });
  }
};

/** The world axis one child grows along. */
const childAxis = (
  domain: IAutoMoviePlantingDomain,
  parent: IAutoMovieVector3,
  local: IAutoMovieVector3,
  key: number,
): IAutoMovieVector3 => {
  const frame = perpendicularFrame(parent);
  const directed = unitOr(
    {
      x: frame.u.x * local.x + parent.x * local.y + frame.v.x * local.z,
      y: frame.u.y * local.x + parent.y * local.y + frame.v.y * local.z,
      z: frame.u.z * local.x + parent.z * local.y + frame.v.z * local.z,
    },
    parent,
  );
  const bias = domain.structure.gravitropism;
  const weight = bias < 0 ? -bias : bias;
  const pull = bias > 0 ? -1 : 1;
  const bent = unitOr(
    {
      x: directed.x * (1 - weight),
      y: directed.y * (1 - weight) + pull * weight,
      z: directed.z * (1 - weight),
    },
    parent,
  );
  const spread = domain.structure.directionJitter;
  return unitOr(
    {
      x:
        bent.x +
        spread * (2 * seededValue(domain.seed, key, SALT_DIRECTION, 0) - 1),
      y:
        bent.y +
        spread * (2 * seededValue(domain.seed, key, SALT_DIRECTION, 1) - 1),
      z:
        bent.z +
        spread * (2 * seededValue(domain.seed, key, SALT_DIRECTION, 2) - 1),
    },
    bent,
  );
};

/**
 * A deterministic orthonormal pair perpendicular to one unit axis.
 *
 * Duff et al., "Building an Orthonormal Basis, Revisited" (JCGT 2017). The sign
 * trick is what keeps `sign + axis.z` away from zero for every unit axis, so
 * the frame is continuous and no direction needs a special case.
 */
const perpendicularFrame = (
  axis: IAutoMovieVector3,
): { u: IAutoMovieVector3; v: IAutoMovieVector3 } => {
  const sign = axis.z >= 0 ? 1 : -1;
  const a = -1 / (sign + axis.z);
  const b = axis.x * axis.y * a;
  return {
    u: {
      x: 1 + sign * axis.x * axis.x * a,
      y: sign * b,
      z: -sign * axis.x,
    },
    v: { x: b, y: sign + axis.y * axis.y * a, z: -axis.y },
  };
};

/** The shortest-arc rotation carrying `+y` onto one unit direction. */
const shortestArcFromUp = (
  direction: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const x = direction.z;
  const z = -direction.x;
  const w = 1 + direction.y;
  const length = Math.sqrt(x * x + z * z + w * w);
  // Exactly antiparallel: every axis perpendicular to `y` is a shortest arc, so
  // the choice is stated instead of being whichever one a normalization of zero
  // happened to produce.
  if (length === 0) return { x: 1, y: 0, z: 0, w: 0 };
  return { x: x / length, y: 0, z: z / length, w: w / length };
};

/**
 * A seeded turn about `+y`, blended toward identity by `amount`.
 *
 * The half-angle `φ` is drawn straight from the rational parameterization of
 * the circle — `(cos φ, sin φ) = ((1 − t²)/(1 + t²), 2t/(1 + t²))` on the first
 * quadrant, lifted to the second by the quarter-turn swap — so a full turn is
 * covered without a single call to a transcendental function and without a
 * rejection loop whose failure arm no test could ever reach. The distribution
 * is uniform in the half-tangent rather than in the angle, which is a stated
 * property of the jitter, not an approximation of a uniform one.
 *
 * Blending is a normalized quaternion interpolation toward identity. `amount`
 * is therefore a fraction of a rotation rather than a scaled angle, which is
 * what keeps the whole derivation free of trigonometry.
 */
const yaw = (sample: number, amount: number): IAutoMovieQuaternion => {
  const doubled = 2 * sample;
  const half = Math.floor(doubled);
  const t = doubled - half;
  const denominator = 1 + t * t;
  const cosine = (1 - t * t) / denominator;
  const sine = (2 * t) / denominator;
  // `half === 1` lifts the first quadrant into the second by the quarter-turn
  // rotation `(c, s) -> (-s, c)`, so `φ` sweeps the whole half-turn that a full
  // turn of the branch corresponds to.
  const w = half === 0 ? cosine : -sine;
  const y = half === 0 ? sine : cosine;
  const blended = {
    x: 0,
    y: amount * (w < 0 ? -y : y),
    z: 0,
    w: 1 - amount + amount * (w < 0 ? -w : w),
  };
  const length = Math.sqrt(blended.y * blended.y + blended.w * blended.w);
  return { x: 0, y: blended.y / length, z: 0, w: blended.w / length };
};

/** Hamilton product in glTF `(x, y, z, w)` order. */
const multiply = (
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): IAutoMovieQuaternion => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});

/** One symmetric multiplicative jitter in `[1 − amount, 1 + amount)`. */
const jitter = (
  seed: number,
  key: number,
  salt: number,
  amount: number,
  index = 0,
): number => 1 + amount * (2 * seededValue(seed, key, salt, index) - 1);

/** One sample mapped into `[min, max]`. */
const between = (min: number, max: number, sample: number): number =>
  min + (max - min) * sample;

/** A unit vector, or the stated fallback when the input has no length. */
const unitOr = (
  value: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const length = Math.sqrt(
    value.x * value.x + value.y * value.y + value.z * value.z,
  );
  if (length === 0) return fallback;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};

/** Whether one point lies inside the pruning envelope. */
const inside = (
  envelope: IAutoMoviePruningEnvelope,
  point: IAutoMovieVector3,
): boolean => {
  if (envelope.kind === "none") return true;
  if (envelope.kind === "box")
    return (
      point.x >= envelope.min.x &&
      point.x <= envelope.max.x &&
      point.y >= envelope.min.y &&
      point.y <= envelope.max.y &&
      point.z >= envelope.min.z &&
      point.z <= envelope.max.z
    );
  const dx = point.x - envelope.center.x;
  const dy = point.y - envelope.center.y;
  const dz = point.z - envelope.center.z;
  return dx * dx + dy * dy + dz * dz <= envelope.radius * envelope.radius;
};

/**
 * The distance at which a segment leaves the envelope, or `null` when it never
 * does.
 *
 * The base is known to be inside, so a box exit is the nearest slab crossing
 * ahead of it and a sphere exit is the positive root of the quadratic. Both are
 * analytic: a sampled cut would move as the sampling changed, and a hedge whose
 * clipped face depends on a step count is not a clipped hedge.
 */
const clip = (
  envelope: IAutoMoviePruningEnvelope,
  base: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  length: number,
): number | null => {
  if (envelope.kind === "none") return null;
  if (envelope.kind === "box") {
    let exit = Infinity;
    const low = [envelope.min.x, envelope.min.y, envelope.min.z];
    const high = [envelope.max.x, envelope.max.y, envelope.max.z];
    const from = [base.x, base.y, base.z];
    const direction = [axis.x, axis.y, axis.z];
    for (let at = 0; at < 3; ++at) {
      if (direction[at] === 0) continue;
      const bound = direction[at] > 0 ? high[at] : low[at];
      const distance = (bound - from[at]) / direction[at];
      if (distance < exit) exit = distance;
    }
    return exit < length ? exit : null;
  }
  const ox = base.x - envelope.center.x;
  const oy = base.y - envelope.center.y;
  const oz = base.z - envelope.center.z;
  const b = ox * axis.x + oy * axis.y + oz * axis.z;
  const c = ox * ox + oy * oy + oz * oz - envelope.radius * envelope.radius;
  const exit = -b + Math.sqrt(b * b - c);
  return exit < length ? exit : null;
};

/** The world box a point list occupies, or `null` for an empty list. */
const extents = (points: IAutoMovieVector3[]): IAutoMovieSoftBounds | null => {
  if (points.length === 0) return null;
  const low = { x: Infinity, y: Infinity, z: Infinity };
  const high = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) {
    low.x = Math.min(low.x, point.x);
    low.y = Math.min(low.y, point.y);
    low.z = Math.min(low.z, point.z);
    high.x = Math.max(high.x, point.x);
    high.y = Math.max(high.y, point.y);
    high.z = Math.max(high.z, point.z);
  }
  return { min: low, max: high };
};

const SALT_DIRECTION = 0x64697200;

const SALT_LEAF_SCALE = 0x6c656166;

const SALT_LEAF_ROLL = 0x726f6c6c;

/**
 * A deterministic orthonormal pair perpendicular to one unit axis.
 *
 * Duff et al., "Building an Orthonormal Basis, Revisited" (JCGT 2017). The sign
 * trick is what keeps `sign + axis.z` away from zero for every unit axis, so
 * the frame is continuous and no direction needs a special case.
 */
const perpendicularFrame = (
  axis: IAutoMovieVector3,
): { u: IAutoMovieVector3; v: IAutoMovieVector3 } => {
  const sign = axis.z >= 0 ? 1 : -1;
  const a = -1 / (sign + axis.z);
  const b = axis.x * axis.y * a;
  return {
    u: {
      x: 1 + sign * axis.x * axis.x * a,
      y: sign * b,
      z: -sign * axis.x,
    },
    v: { x: b, y: sign + axis.y * axis.y * a, z: -axis.y },
  };
};

/** The shortest-arc rotation carrying `+y` onto one unit direction. */
const shortestArcFromUp = (
  direction: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const x = direction.z;
  const z = -direction.x;
  const w = 1 + direction.y;
  const length = Math.sqrt(x * x + z * z + w * w);
  // Exactly antiparallel: every axis perpendicular to `y` is a shortest arc, so
  // the choice is stated instead of being whichever one a normalization of zero
  // happened to produce.
  if (length === 0) return { x: 1, y: 0, z: 0, w: 0 };
  return { x: x / length, y: 0, z: z / length, w: w / length };
};

/** Hamilton product in glTF `(x, y, z, w)` order. */
const multiply = (
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): IAutoMovieQuaternion => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});
