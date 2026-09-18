import { IAutoMoviePlantingBranch, IAutoMoviePlantingDomain, IAutoMoviePlantingLeaf, IAutoMoviePlantingState, IAutoMovieVector3 } from "@automovie/interface";
import { mixSeed } from "../math/mixSeed";

/**
 * Derive the branching structure of one planting recipe at its growth state.
 *
 * ## The law
 *
 * A branch at level `l` is a segment of length `Λ(l)·e(l)` along a unit axis,
 * where `Λ(l) = length · lengthRatio^l` scaled by its own seeded jitter and
 *
 * ```text
 *   e(l) = clamp( (stage − onset·l) / (1 − onset·(levels − 1)), 0, 1 )
 * ```
 *
 * Is the level's **extension**: level `0` starts extending at `stage = 0`, each
 * deeper level waits `onset` longer, and the normalizing span is exactly what
 * makes the deepest level reach `1` at `stage = 1`. Growth is therefore a state
 * and not an animation — the same recipe at the same stage is the same plant
 * everywhere, and a stage of `0` emits nothing at all rather than a seedling
 * nobody authored.
 *
 * Every branch bears the same authored child list. A child's direction is
 * stated in a frame whose `+y` is the parent's own axis and whose `+x`/`+z` are
 * the deterministic perpendicular pair of Duff et al. (2017), so one vector
 * means the same thing wherever the parent points. That direction is then bent
 * toward world vertical by `gravitropism` and perturbed by `directionJitter`
 * before being renormalized.
 *
 * ## Pruning
 *
 * A branch whose base already lies outside the envelope is not grown; a branch
 * that crosses the envelope is cut exactly at the crossing — the analytic slab
 * or quadratic root, not a sampled approximation — and only the children whose
 * emergence point precedes the cut survive. Cutting the structure rather than
 * clipping in the renderer is what lets a quantity take-off and a collision
 * check read the same plant the camera sees.
 *
 * ## Determinism
 *
 * A branch's seeded values are drawn from the recipe seed folded with the
 * **path** of child indices that produced it, never from a sequential stream,
 * so a branch's jitter does not depend on how many branches were emitted before
 * it. Nothing transcendental is evaluated: directions are authored as vectors,
 * rotations are built from the rational parameterization of the circle, and
 * only `+ − × ÷`, `Math.abs`, `Math.floor` and `Math.sqrt` ever touch a
 * coordinate. A plant reproduces bit for bit on Windows and POSIX alike.
 *
 * Throws when the derivation would exceed the recipe's own declared branch or
 * leaf cap: a budget that can be silently overrun is not a budget.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Derives the declared planting state reproducibly from its growth recipe.
 * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-layers-form `growPlanting` expands the declared trunk, branch levels, and leaf rules into an explicit bounded structural state.
 * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-season-growth The growth stage and per-level onset deterministically control branch extension and leaf emission for the declared planting state.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Implements the bounded procedural structure of an interior planting.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input The generated branch and leaf records materialize the declared vegetation form without inferring an external species catalogue.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-growth-season-disturbance The explicit growth-stage calculation implements the deterministic seasonal-growth subset while leaving weather and disturbance authoring upstream.
 * @author Samchon
 */
export const growPlanting = (
  domain: IAutoMoviePlantingDomain,
): IAutoMoviePlantingState => {
  const structure = domain.structure;
  const branches: IAutoMoviePlantingBranch[] = [];
  const leaves: IAutoMoviePlantingLeaf[] = [];
  const span = 1 - domain.growth.onset * (structure.levels - 1);
  const extension = (level: number): number => {
    const raw = (domain.growth.stage - domain.growth.onset * level) / span;
    if (raw <= 0) return 0;
    return raw >= 1 ? 1 : raw;
  };

  const emit = (props: {
    id: string;
    parent: string | null;
    level: number;
    key: number;
    base: IAutoMovieVector3;
    axis: IAutoMovieVector3;
    fullLength: number;
    radiusStart: number;
  }): void => {
    const reach = extension(props.level);
    if (reach === 0) return;
    if (inside(domain.pruning, props.base) === false) return;
    const length = props.fullLength * reach;
    const tip = {
      x: props.base.x + props.axis.x * length,
      y: props.base.y + props.axis.y * length,
      z: props.base.z + props.axis.z * length,
    };
    const cut = clip(domain.pruning, props.base, props.axis, length);
    const end =
      cut === null
        ? tip
        : {
            x: props.base.x + props.axis.x * cut,
            y: props.base.y + props.axis.y * cut,
            z: props.base.z + props.axis.z * cut,
          };
    const grown = cut === null ? length : cut;
    const radiusEnd = props.radiusStart * structure.radiusRatio;
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
    structure.children.forEach((child, index) => {
      const emergence = child.offset * length;
      if (emergence > grown) return;
      const key = mixSeed(index + 1, props.key);
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
    });
  };

  const trunkKey = mixSeed(domain.seed, SALT_TRUNK);
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
    bounds: extents(branches.flatMap((branch) => [branch.start, branch.end])),
  };
};

const SALT_TRUNK = 0x74726e6b;

const SALT_LENGTH = 0x6c656e67;
