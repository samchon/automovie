import {
  IAutoMoviePlantingBranch,
  IAutoMoviePlantingChild,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingFoliage,
  IAutoMoviePlantingLeaf,
  IAutoMoviePlantingState,
  IAutoMoviePlantingStructure,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { mixSeed } from "../math/mixSeed";
import { seededValue } from "../math/seededValue";
import { plantingCanopyBounds } from "./plantingCanopyBounds";
import { plantingContainsPoint } from "./plantingContainsPoint";
import { plantingPruningDistance } from "./plantingPruningDistance";
import { plantingYaw } from "./plantingYaw";

const SALT_TRUNK: number = 0x74726e6b;

const SALT_LENGTH: number = 0x6c656e67;

const SALT_DIRECTION: number = 0x64697200;

const SALT_LEAF_SCALE: number = 0x6c656166;

const SALT_LEAF_ROLL: number = 0x726f6c6c;

/** Derive recipe-local depth-first branches and leaves at one normalized growth stage. Level extension is clamp((stage-onset*level)/(1-onset*(levels-1)),0,1); child-path seeds fix jitter independently of traversal count. Analytic pruning cuts emitted branches, and declared branch/leaf caps throw during emission. Production planting validation consumes this geometry.
 *
 * @evidence contracts/common.md#principled-implementation An admitted positive growth span, bounded depth and normalized directions feed deterministic path-seeded growth, Duff's signed perpendicular frame, scalar slab/sphere pruning and rational-circle leaf roll. Binary64 arithmetic and direct squares retain extreme-input limitations; the signed frame is deterministic, not globally continuous.
 * @evidence contracts/common.md#clear-and-simple-design One grow owner supplies both quantity/bounds validation and lower installation results; canonical pruning and yaw helpers isolate the same geometric decisions, and emitted stem/leaf measurement supplies the installation's complete canopy envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero growth emits no invented seedling, pruned children are omitted and emitted caps refuse overflow rather than silently truncate; degenerate direction/antiparallel fallback choices remain explicit helper policy.
 * @evidence contracts/common.md#meaningful-documentation States growth law, recipe-local frame, path seeds, pruning, cap failures and numeric premises without claiming cross-host bit proof from method choice alone.
 * @evidence contracts/performance.md#efficient-algorithms For B visited branches, C child definitions, L leaves and depth D, emission costs O(B*C+L) scalar work plus O(B*D+L*D) path-id/string storage; final stem support/leaf-card envelope takes O(B+L) time and constant extra live storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Child path keys make random draws independent of unrelated emission order; the same parent full length is reused by its children and one leaf alignment is reused for its blades. Changed stages/pruning/recipe values require a fresh derivation without a tree cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All output arrays and complete recipe-local canopy bounds belong to the caller; recursion is bounded by admitted depth, temporary frames and rotated corners are local, and cap failure retains no partially published tree or host task.
 *
 * @author Samchon
 */
export const growPlanting: (
  domain: IAutoMoviePlantingDomain,
) => IAutoMoviePlantingState = (
  domain: IAutoMoviePlantingDomain,
): IAutoMoviePlantingState => {
  const structure: IAutoMoviePlantingStructure = domain.structure;
  const branches: IAutoMoviePlantingBranch[] = [];
  const leaves: IAutoMoviePlantingLeaf[] = [];
  const span: number = 1 - domain.growth.onset * (structure.levels - 1);
  /** Clamp this admitted level growth law to the normalized extension interval using the recipe-wide positive span. */
  const extension: (level: number) => number = (level: number): number => {
    const raw: number =
      (domain.growth.stage - domain.growth.onset * level) / span;
    if (raw <= 0) return 0;
    return raw >= 1 ? 1 : raw;
  };

  /** Emit one recipe-local branch, its leaf occurrences and surviving children in authored depth-first order, refusing declared cap overflow before publication. */

  const emit: (props: {
    id: string;
    parent: string | null;
    level: number;
    key: number;
    base: IAutoMovieVector3;
    axis: IAutoMovieVector3;
    fullLength: number;
    radiusStart: number;
  }) => void = (props: {
    id: string;
    parent: string | null;
    level: number;
    key: number;
    base: IAutoMovieVector3;
    axis: IAutoMovieVector3;
    fullLength: number;
    radiusStart: number;
  }): void => {
    const reach: number = extension(props.level);
    if (reach === 0) return;
    if (plantingContainsPoint(domain.pruning, props.base) === false) return;
    const length: number = props.fullLength * reach;
    const tip: { x: number; y: number; z: number } = {
      x: props.base.x + props.axis.x * length,
      y: props.base.y + props.axis.y * length,
      z: props.base.z + props.axis.z * length,
    };
    const cut: number | null = plantingPruningDistance(
      domain.pruning,
      props.base,
      props.axis,
      length,
    );
    const end: { x: number; y: number; z: number } =
      cut === null
        ? tip
        : {
            x: props.base.x + props.axis.x * cut,
            y: props.base.y + props.axis.y * cut,
            z: props.base.z + props.axis.z * cut,
          };
    const grown: number = cut === null ? length : cut;
    const radiusEnd: number = props.radiusStart * structure.radiusRatio;
    branches.push({
      id: props.id,
      parent: props.parent,
      level: props.level,
      start: props.base,
      end,
      radiusStart: props.radiusStart,
      radiusEnd,
      pruned: cut !== null,
    });
    if (branches.length > domain.budget.maxBranches)
      throw new Error(
        `planting "${domain.id}" exceeded its declared cap of ${domain.budget.maxBranches} branches`,
      );
    bearLeaves({
      domain,
      branch: props.id,
      level: props.level,
      key: props.key,
      base: props.base,
      axis: props.axis,
      length: grown,
      leaves,
    });

    if (props.level + 1 >= structure.levels) return;
    structure.children.forEach(
      (child: IAutoMoviePlantingChild, index: number): void => {
        const emergence: number = child.offset * length;
        if (emergence > grown) return;
        const key: number = mixSeed(index + 1, props.key);
        emit({
          id: `${props.id}/${child.id}`,
          parent: props.id,
          level: props.level + 1,
          key,
          base: {
            x: props.base.x + props.axis.x * emergence,
            y: props.base.y + props.axis.y * emergence,
            z: props.base.z + props.axis.z * emergence,
          },
          axis: childAxis(domain, props.axis, child.direction, key),
          fullLength:
            props.fullLength *
            structure.lengthRatio *
            jitter(domain.seed, key, SALT_LENGTH, structure.lengthJitter),
          radiusStart: radiusEnd,
        });
      },
    );
  };

  const trunkKey: number = mixSeed(domain.seed, SALT_TRUNK);
  emit({
    id: "trunk",
    parent: null,
    level: 0,
    key: trunkKey,
    base: { x: 0, y: 0, z: 0 },
    axis: unitOr(structure.axis, { x: 0, y: 1, z: 0 }),
    fullLength:
      structure.length *
      jitter(domain.seed, trunkKey, SALT_LENGTH, structure.lengthJitter),
    radiusStart: structure.radius,
  });

  return {
    domain: domain.id,
    stage: domain.growth.stage,
    branches,
    leaves,
    bounds: plantingCanopyBounds(branches, leaves),
  };
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
const bearLeaves: (props: {
  domain: IAutoMoviePlantingDomain;
  branch: string;
  level: number;
  key: number;
  base: IAutoMovieVector3;
  axis: IAutoMovieVector3;
  length: number;
  leaves: IAutoMoviePlantingLeaf[];
}) => void = (props: {
  domain: IAutoMoviePlantingDomain;
  branch: string;
  level: number;
  key: number;
  base: IAutoMovieVector3;
  axis: IAutoMovieVector3;
  length: number;
  leaves: IAutoMoviePlantingLeaf[];
}): void => {
  const foliage: IAutoMoviePlantingFoliage | null = props.domain.foliage;
  if (foliage === null || props.level < foliage.minLevel) return;
  const count: number = Math.floor(foliage.density * props.length);
  const align: IAutoMovieQuaternion = shortestArcFromUp(props.axis);
  for (let index: number = 0; index < count; ++index) {
    if (props.leaves.length >= props.domain.budget.maxLeaves)
      throw new Error(
        `planting "${props.domain.id}" exceeded its declared cap of ${props.domain.budget.maxLeaves} leaves`,
      );
    const along: number = ((index + 0.5) / count) * props.length;
    const roll: IAutoMovieQuaternion = plantingYaw(
      seededValue(props.domain.seed, props.key, SALT_LEAF_ROLL, index),
      foliage.rollJitter,
    );
    const factor: number = jitter(
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
      rotation: Quaternion.multiply(align, roll),
      scale: {
        x: foliage.size.x * factor,
        y: foliage.size.y * factor,
        z: foliage.size.z * factor,
      },
    });
  }
};

/** The world axis one child grows along. */
const childAxis: (
  domain: IAutoMoviePlantingDomain,
  parent: IAutoMovieVector3,
  local: IAutoMovieVector3,
  key: number,
) => IAutoMovieVector3 = (
  domain: IAutoMoviePlantingDomain,
  parent: IAutoMovieVector3,
  local: IAutoMovieVector3,
  key: number,
): IAutoMovieVector3 => {
  const frame: { u: IAutoMovieVector3; v: IAutoMovieVector3 } =
    perpendicularFrame(parent);
  const directed: IAutoMovieVector3 = unitOr(
    {
      x: frame.u.x * local.x + parent.x * local.y + frame.v.x * local.z,
      y: frame.u.y * local.x + parent.y * local.y + frame.v.y * local.z,
      z: frame.u.z * local.x + parent.z * local.y + frame.v.z * local.z,
    },
    parent,
  );
  const bias: number = domain.structure.gravitropism;
  const weight: number = bias < 0 ? -bias : bias;
  const pull: number = bias > 0 ? -1 : 1;
  const bent: IAutoMovieVector3 = unitOr(
    {
      x: directed.x * (1 - weight),
      y: directed.y * (1 - weight) + pull * weight,
      z: directed.z * (1 - weight),
    },
    parent,
  );
  const spread: number = domain.structure.directionJitter;
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
 * the signed frame remains deterministic across all unit directions; its sign branch is not globally continuous.
 */
const perpendicularFrame: (axis: IAutoMovieVector3) => {
  u: IAutoMovieVector3;
  v: IAutoMovieVector3;
} = (
  axis: IAutoMovieVector3,
): { u: IAutoMovieVector3; v: IAutoMovieVector3 } => {
  const sign: number = axis.z >= 0 ? 1 : -1;
  const a: number = -1 / (sign + axis.z);
  const b: number = axis.x * axis.y * a;
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
const shortestArcFromUp: (
  direction: IAutoMovieVector3,
) => IAutoMovieQuaternion = (
  direction: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const x: number = direction.z;
  const z: number = -direction.x;
  const w: number = 1 + direction.y;
  const length: number = Math.sqrt(x * x + z * z + w * w);
  // Exactly antiparallel: every axis perpendicular to `y` is a shortest arc, so
  // the choice is stated instead of being whichever one a normalization of zero
  // happened to produce.
  if (length === 0) return { x: 1, y: 0, z: 0, w: 0 };
  return { x: x / length, y: 0, z: z / length, w: w / length };
};

/** One symmetric multiplicative jitter in `[1 − amount, 1 + amount)`. */
const jitter: (
  seed: number,
  key: number,
  salt: number,
  amount: number,
  index?: number,
) => number = (
  seed: number,
  key: number,
  salt: number,
  amount: number,
  index: number = 0,
): number => 1 + amount * (2 * seededValue(seed, key, salt, index) - 1);

/** A unit vector, or the stated fallback when the input has no length. */
const unitOr: (
  value: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  value: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const length: number = Math.sqrt(
    value.x * value.x + value.y * value.y + value.z * value.z,
  );
  if (length === 0) return fallback;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};
