import {
  IAutoMoviePlantingBudget,
  IAutoMoviePlantingChild,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingStructure,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANTING_MAX_BRANCHES } from "./constants/PLANTING_MAX_BRANCHES";
import { PLANTING_MAX_CHILDREN } from "./constants/PLANTING_MAX_CHILDREN";
import { PLANTING_MAX_LEAVES } from "./constants/PLANTING_MAX_LEAVES";
import { PLANTING_MAX_LEVELS } from "./constants/PLANTING_MAX_LEVELS";
import { plantingBudget } from "./plantingBudget";
import { validateSoftIdentity as identity } from "./validateSoftIdentity";
import { validateSoftInteger as integer } from "./validateSoftInteger";
import { validateSoftNumeric as numeric } from "./validateSoftNumeric";
import { validateSoftVector as vector } from "./validateSoftVector";

/**
 * Validate a typed planting recipe's scalar law, child identities, pruning and emission budgets.
 *
 * @evidence contracts/common.md#principled-implementation Finite scalar ranges, positive growth span and bounded depth feed the same worst-case branching/foliage budget used by growth; ratios may equal one, and finite fields alone do not guarantee every derived coordinate remains representable.
 * @evidence contracts/common.md#clear-and-simple-design One recipe owner supplies both production binding validation and lowering admission, with shared scalar/integer/vector/id helpers preserving diagnostic paths and traversal order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid values are reported rather than clamped. Direction zero uses squared components and can misclassify tiny nonzero inputs; the pass is not a universal finite-geometry or continuity certificate.
 * @evidence contracts/common.md#meaningful-documentation States typed-record admission, range and budget effects, recipe-local law and remaining squared-arithmetic/derived-representability limits; malformed container shapes can still throw.
 * @evidence contracts/performance.md#efficient-algorithms C child records and depth D take O(C+D) validation/budget work plus identity storage; foliage budgeting uses the same level walk and this pass never emits the full tree.
 * @evidence contracts/performance.md#reuse-equivalent-work Scalar, integer, vector and sibling-id policies are shared with soft-domain validation, while each pass owns its sets and recipe-specific limits; no mutable-recipe result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh collector and child-id set are local; returned findings retain offending values, and no emitted plant, viewer handle or task is acquired.
 * @author Samchon
 */
export const validatePlantingDomain: (props: {
  domain: IAutoMoviePlantingDomain;
}) => IAutoMovieValidation = (props: {
  domain: IAutoMoviePlantingDomain;
}): IAutoMovieValidation => {
  const { domain }: typeof props = props;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  if (domain.id.trim().length === 0)
    out.push("type", `${root}.id`, "planting id must be non-empty", domain.id);
  if (domain.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `planting schema version must be 1, but was ${String(domain.version)}`,
      domain.version,
    );
  if (domain.units !== "meter")
    out.push(
      "type",
      `${root}.units`,
      `planting units must be "meter", but was ${String(domain.units)}`,
      domain.units,
    );
  if (!Number.isSafeInteger(domain.seed))
    out.push(
      "type",
      `${root}.seed`,
      "planting seed must be a safe integer",
      domain.seed,
    );

  const structure: IAutoMoviePlantingStructure = domain.structure;
  integer(
    out,
    `${root}.structure.levels`,
    "branching levels",
    structure.levels,
    1,
    PLANTING_MAX_LEVELS,
  );
  direction(out, `${root}.structure.axis`, "trunk axis", structure.axis);
  numeric(
    out,
    `${root}.structure.length`,
    "trunk length",
    structure.length,
    0,
    true,
    Infinity,
  );
  numeric(
    out,
    `${root}.structure.radius`,
    "trunk radius",
    structure.radius,
    0,
    true,
    Infinity,
  );
  numeric(
    out,
    `${root}.structure.lengthRatio`,
    "length ratio",
    structure.lengthRatio,
    0,
    true,
    1,
  );
  numeric(
    out,
    `${root}.structure.radiusRatio`,
    "radius ratio",
    structure.radiusRatio,
    0,
    true,
    1,
  );
  numeric(
    out,
    `${root}.structure.directionJitter`,
    "direction jitter",
    structure.directionJitter,
    0,
    false,
    1,
  );
  numeric(
    out,
    `${root}.structure.lengthJitter`,
    "length jitter",
    structure.lengthJitter,
    0,
    false,
    1,
  );
  numeric(
    out,
    `${root}.structure.gravitropism`,
    "gravitropism",
    structure.gravitropism,
    -1,
    false,
    1,
  );
  if (structure.children.length === 0)
    out.push(
      "type",
      `${root}.structure.children`,
      "a branching law must declare at least one child, or the recursion has nothing to do",
      structure.children.length,
    );
  if (structure.children.length > PLANTING_MAX_CHILDREN)
    out.push(
      "range",
      `${root}.structure.children`,
      `a branch may bear at most ${PLANTING_MAX_CHILDREN} children, but declared ${structure.children.length}`,
      structure.children.length,
      structure.children.length - PLANTING_MAX_CHILDREN,
    );
  const childIds: Set<string> = new Set<string>();
  structure.children.forEach(
    (child: IAutoMoviePlantingChild, index: number): void => {
      const path: string = `${root}.structure.children[${index}]`;
      identity(out, path, "child", child.id, childIds);
      direction(out, `${path}.direction`, "child direction", child.direction);
      numeric(out, `${path}.offset`, "child offset", child.offset, 0, false, 1);
    },
  );

  numeric(
    out,
    `${root}.growth.stage`,
    "growth stage",
    domain.growth.stage,
    0,
    false,
    1,
  );
  numeric(
    out,
    `${root}.growth.onset`,
    "growth onset",
    domain.growth.onset,
    0,
    false,
    1,
  );
  const spanned: number = domain.growth.onset * (structure.levels - 1);
  if (Number.isFinite(spanned) && spanned >= 1)
    out.push(
      "range",
      `${root}.growth.onset`,
      `onset * (levels - 1) must stay below 1, or the deepest level could never emerge, but it is ${spanned}`,
      domain.growth.onset,
      spanned - 1,
    );

  if (domain.pruning.kind === "box") {
    vector(out, `${root}.pruning.min`, domain.pruning.min);
    vector(out, `${root}.pruning.max`, domain.pruning.max);
    for (const axis of ["x", "y", "z"] as const)
      if (domain.pruning.max[axis] <= domain.pruning.min[axis])
        out.push(
          "range",
          `${root}.pruning.max.${axis}`,
          `pruning box max ${axis} must be strictly above its min (${domain.pruning.min[axis]})`,
          domain.pruning.max[axis],
        );
  } else if (domain.pruning.kind === "sphere") {
    vector(out, `${root}.pruning.center`, domain.pruning.center);
    numeric(
      out,
      `${root}.pruning.radius`,
      "pruning radius",
      domain.pruning.radius,
      0,
      true,
      Infinity,
    );
  }

  if (domain.foliage !== null) {
    numeric(
      out,
      `${root}.foliage.density`,
      "foliage density",
      domain.foliage.density,
      0,
      true,
      Infinity,
    );
    integer(
      out,
      `${root}.foliage.minLevel`,
      "foliage minimum level",
      domain.foliage.minLevel,
      0,
      PLANTING_MAX_LEVELS,
    );
    for (const axis of ["x", "y", "z"] as const)
      numeric(
        out,
        `${root}.foliage.size.${axis}`,
        `leaf size ${axis}`,
        domain.foliage.size[axis],
        0,
        true,
        Infinity,
      );
    numeric(
      out,
      `${root}.foliage.scaleJitter`,
      "leaf scale jitter",
      domain.foliage.scaleJitter,
      0,
      false,
      1,
    );
    numeric(
      out,
      `${root}.foliage.rollJitter`,
      "leaf roll jitter",
      domain.foliage.rollJitter,
      0,
      false,
      1,
    );
  }

  integer(
    out,
    `${root}.budget.maxBranches`,
    "branch cap",
    domain.budget.maxBranches,
    1,
    PLANTING_MAX_BRANCHES,
  );
  integer(
    out,
    `${root}.budget.maxLeaves`,
    "leaf cap",
    domain.budget.maxLeaves,
    0,
    PLANTING_MAX_LEAVES,
  );
  // Guarded by the level range above: the worst case is counted by walking the
  // levels, so an out-of-range depth is refused before anything walks it.
  if (
    Number.isSafeInteger(structure.levels) &&
    structure.levels >= 1 &&
    structure.levels <= PLANTING_MAX_LEVELS
  ) {
    const budget: IAutoMoviePlantingBudget = plantingBudget({ domain });
    if (
      Number.isSafeInteger(domain.budget.maxBranches) &&
      budget.worstCaseBranches > domain.budget.maxBranches
    )
      out.push(
        "range",
        `${root}.budget.maxBranches`,
        `the declared branching law grows ${budget.worstCaseBranches} segments unpruned, which its own cap of ${domain.budget.maxBranches} refuses`,
        domain.budget.maxBranches,
        budget.worstCaseBranches - domain.budget.maxBranches,
      );
    // The leaf cap is refused here for the same reason the branch cap is: it is
    // enforced by throwing while blades are emitted, and a derivation that
    // throws inside a binding's own validation is a crash where a violation was
    // asked for. A recipe with no foliage rule bears nothing, so there is no
    // emission to bound and the cap is only its own range check's business.
    if (
      domain.foliage !== null &&
      budget.worstCaseLeaves > domain.budget.maxLeaves
    )
      out.push(
        "range",
        `${root}.budget.maxLeaves`,
        `the declared foliage rule bears ${budget.worstCaseLeaves} blades on an unpruned structure, which its own cap of ${domain.budget.maxLeaves} refuses`,
        domain.budget.maxLeaves,
        budget.worstCaseLeaves - domain.budget.maxLeaves,
      );
  }

  return out.toValidation();
};

/** A non-zero finite direction vector. */
const direction: (
  out: ViolationCollector,
  path: string,
  label: string,
  value: IAutoMovieVector3,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: IAutoMovieVector3,
): void => {
  vector(out, path, value);
  if (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z) &&
    value.x * value.x + value.y * value.y + value.z * value.z === 0
  )
    out.push("type", path, `${label} must be a non-zero vector`, value);
};
