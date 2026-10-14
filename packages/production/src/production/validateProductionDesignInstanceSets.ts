import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { AUTOMOVIE_MAX_FORMATION_MEMBERS } from "./AUTOMOVIE_MAX_FORMATION_MEMBERS";
import { validateProductionDesignBoundedVector } from "./validateProductionDesignBoundedVector";
import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { validateProductionDesignInstanceLayout } from "./validateProductionDesignInstanceLayout";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignBoundedRange } from "./validateProductionDesignBoundedRange";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignUniqueTextValues } from "./validateProductionDesignUniqueTextValues";
import { AUTOMOVIE_MAX_GENERAL_INSTANCES } from "./AUTOMOVIE_MAX_GENERAL_INSTANCES";
import { AUTOMOVIE_GENERAL_INSTANCE_BUFFER_BUDGET_BYTES } from "./AUTOMOVIE_GENERAL_INSTANCE_BUFFER_BUDGET_BYTES";
import { IAutoMovieDiagnostic, IAutoMovieInstanceSetDesign, IAutoMovieModelRecipe } from "@automovie/interface";

/**
 * Check each world instance set's identity, recipe, placement, prototype and variation in original order, then aggregate instance count and matrix/color/trait storage.
 *
 * @evidence contracts/common.md#principled-implementation Missing optional instanceSets means an empty population. Declared budgets do not certify final GPU allocation or realized placement.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignInstanceSets owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms All instance rows and prototypes/traits are scanned; layout queries can search routes and their points. Diagnostics grow with findings, and storage estimates use the largest declared prototype LOD population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignInstanceSets: (diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, routeIds: ReadonlySet<string>, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  graph: IAutoMovieProductionDesignGraph,
  routeIds: ReadonlySet<string>,
  file: string,
): void => {
  const instanceSets: IAutoMovieInstanceSetDesign[] = graph.world?.instanceSets ?? [];
  const ids: Set<string> = new Set<string>();
  let total: number = 0;
  let bufferBytes: number = 0;
  for (const instanceSet of instanceSets) {
    const target: string = `instance-set:${instanceSet.id}`;
    validateProductionDesignUnique(diagnostics, ids, instanceSet.id, target, file, "instanceSets");
    validateProductionDesignText(diagnostics, instanceSet.modelRecipe, target, file, "modelRecipe");
    const model: IAutoMovieModelRecipe | undefined = graph.models.get(instanceSet.modelRecipe);
    if (model === undefined)
      validateProductionDesignMissing(
        diagnostics,
        target,
        file,
        `model recipe "${instanceSet.modelRecipe}"`,
        `Create or correct the model recipe record for "${instanceSet.modelRecipe}" or change ${instanceSet.id}.modelRecipe`,
      );
    validateProductionDesignInteger(
      diagnostics,
      instanceSet.count,
      1,
      AUTOMOVIE_MAX_FORMATION_MEMBERS,
      target,
      file,
      "count",
    );
    total += instanceSet.count;
    validateProductionDesignBoundedVector(
      diagnostics,
      instanceSet.anchor,
      -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
      AUTOMOVIE_WORLD_COORDINATE_LIMIT,
      target,
      file,
      "anchor",
    );
    validateProductionDesignFinite(diagnostics, instanceSet.facingDeg, target, file, "facingDeg");
    validateProductionDesignInteger(
      diagnostics,
      instanceSet.seed,
      0,
      Number.MAX_SAFE_INTEGER,
      target,
      file,
      "seed",
    );
    validateProductionDesignInstanceLayout(diagnostics, graph, routeIds, file, instanceSet, target);
    const prototypeIds: Set<string> = new Set<string>();
    let maximumPrototypeLodCount: number = Math.max(1, model?.lod.length ?? 0);
    for (const prototype of instanceSet.prototypes ?? []) {
      validateProductionDesignUnique(
        diagnostics,
        prototypeIds,
        prototype.id,
        target,
        file,
        "prototypes",
      );
      if (prototype.id === "default")
        validateProductionDesignInvalid(
          diagnostics,
          "design-id-reserved",
          target,
          file,
          'Instance prototype id "default" is reserved for modelRecipe.',
        );
      validateProductionDesignText(
        diagnostics,
        prototype.modelRecipe,
        target,
        file,
        `prototypes.${prototype.id}.modelRecipe`,
      );
      const prototypeModel: IAutoMovieModelRecipe | undefined = graph.models.get(prototype.modelRecipe);
      if (prototypeModel === undefined)
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `model recipe "${prototype.modelRecipe}"`,
          `create it or correct prototype "${prototype.id}"`,
        );
      validateProductionDesignPositive(
        diagnostics,
        prototype.weight,
        target,
        file,
        `prototypes.${prototype.id}.weight`,
      );
      maximumPrototypeLodCount = Math.max(
        maximumPrototypeLodCount,
        Math.max(1, prototypeModel?.lod.length ?? 0),
      );
    }
    validateProductionDesignBoundedRange(
      diagnostics,
      instanceSet.variation.scale,
      Number.EPSILON,
      1_000,
      target,
      file,
      "variation.scale",
    );
    if (instanceSet.variation.scale3 !== undefined) {
      validateProductionDesignBoundedVector(
        diagnostics,
        instanceSet.variation.scale3.min,
        Number.EPSILON,
        1_000,
        target,
        file,
        "variation.scale3.min",
      );
      validateProductionDesignBoundedVector(
        diagnostics,
        instanceSet.variation.scale3.max,
        Number.EPSILON,
        1_000,
        target,
        file,
        "variation.scale3.max",
      );
      for (const axis of ["x", "y", "z"] as const)
        if (
          instanceSet.variation.scale3.min[axis] >
          instanceSet.variation.scale3.max[axis]
        )
          validateProductionDesignInvalid(
            diagnostics,
            "design-range-invalid",
            target,
            file,
            `variation.scale3.${axis} min must not exceed max.`,
          );
    }
    if (instanceSet.variation.rotationDeg !== undefined)
      for (const axis of ["x", "y", "z"] as const)
        validateProductionDesignBoundedRange(
          diagnostics,
          instanceSet.variation.rotationDeg[axis],
          -360_000,
          360_000,
          target,
          file,
          `variation.rotationDeg.${axis}`,
        );
    if (instanceSet.variation.visibleProbability !== undefined)
      validateProductionDesignBounded(
        diagnostics,
        instanceSet.variation.visibleProbability,
        0,
        1,
        target,
        file,
        "variation.visibleProbability",
      );
    if (instanceSet.variation.palette.length === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        "Instance variation palette must contain at least one #RRGGBB color.",
      );
    validateProductionDesignUniqueTextValues(
      diagnostics,
      instanceSet.variation.palette,
      target,
      file,
      "variation.palette",
    );
    for (const color of instanceSet.variation.palette)
      if (/^#[0-9a-f]{6}$/i.test(color) === false)
        validateProductionDesignInvalid(
          diagnostics,
          "design-color-invalid",
          target,
          file,
          `Instance palette color "${color}" must be one opaque #RRGGBB value.`,
        );
    const traitNames: Set<string> = new Set<string>();
    for (const trait of instanceSet.variation.traits) {
      validateProductionDesignUnique(
        diagnostics,
        traitNames,
        trait.name,
        target,
        file,
        "variation.traits",
      );
      validateProductionDesignBounded(
        diagnostics,
        trait.min,
        -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        target,
        file,
        `${trait.name}.min`,
      );
      validateProductionDesignBounded(
        diagnostics,
        trait.max,
        -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        target,
        file,
        `${trait.name}.max`,
      );
      if (trait.min > trait.max)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Instance trait "${trait.name}" min must not exceed max.`,
        );
    }
    const lodCount: number = maximumPrototypeLodCount;
    bufferBytes +=
      instanceSet.count *
      lodCount *
      (16 * Float32Array.BYTES_PER_ELEMENT +
        3 * Float32Array.BYTES_PER_ELEMENT +
        Float32Array.BYTES_PER_ELEMENT *
          (1 + instanceSet.variation.traits.length));
  }
  if (
    Number.isSafeInteger(total) === false ||
    total > AUTOMOVIE_MAX_GENERAL_INSTANCES
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      "instance-sets",
      file,
      `The world declares ${total} general instances, above the compact-runtime limit ${AUTOMOVIE_MAX_GENERAL_INSTANCES}. Reduce the total.`,
    );
  if (
    Number.isSafeInteger(bufferBytes) === false ||
    bufferBytes > AUTOMOVIE_GENERAL_INSTANCE_BUFFER_BUDGET_BYTES
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-budget-exceeded",
      "instance-sets",
      file,
      `General instance matrices, colors, scales, and traits require ${bufferBytes} bytes, above the ${AUTOMOVIE_GENERAL_INSTANCE_BUFFER_BUDGET_BYTES}-byte viewer budget.`,
    );
};
