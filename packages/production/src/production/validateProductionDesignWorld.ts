import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { AUTOMOVIE_EFFECT_DECLARATION_LIMIT } from "./AUTOMOVIE_EFFECT_DECLARATION_LIMIT";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignVector } from "./validateProductionDesignVector";
import { validateProductionDesignBounded2 } from "./validateProductionDesignBounded2";
import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { validateProductionDesignPolygon } from "./validateProductionDesignPolygon";
import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { validateProductionDesignInstanceSets } from "./validateProductionDesignInstanceSets";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { AUTOMOVIE_MAX_EFFECT_PARTICLES } from "./AUTOMOVIE_MAX_EFFECT_PARTICLES";
import { validateProductionDesignBoundedRange } from "./validateProductionDesignBoundedRange";
import { validateProductionDesignBoundedVector } from "./validateProductionDesignBoundedVector";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { AUTOMOVIE_EFFECT_PARTICLE_BUDGET } from "./AUTOMOVIE_EFFECT_PARTICLE_BUDGET";
import { IAutoMovieDiagnostic, IAutoMovieWorldEffectZone, IAutoMovieEffectRecipe } from "@automovie/interface";

/**
 * Check world landmarks, finite simple surfaces and height declarations, route lengths, instance sets, effect recipes and zones in original order.
 *
 * @evidence contracts/common.md#principled-implementation Existing metre limits, 1e-9 policies and particle peak arithmetic remain unchanged; declarations do not certify realized geometry or rendered budgets.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignWorld owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Surface polygons require quadratic edge-pair tests; height samples, routes and effects are scanned, while zone-to-recipe searches and instance layout queries add their actual populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export function validateProductionDesignWorld(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, sharedRoot: string): void {
if (graph.world !== null) {
    const file: string = `${sharedRoot}/world.json`;
    if (
      graph.world.effectRecipes.length > AUTOMOVIE_EFFECT_DECLARATION_LIMIT ||
      graph.world.effectZones.length > AUTOMOVIE_EFFECT_DECLARATION_LIMIT
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        "world",
        file,
        `World effects must stay within ${AUTOMOVIE_EFFECT_DECLARATION_LIMIT} recipes and ${AUTOMOVIE_EFFECT_DECLARATION_LIMIT} zones. Reduce the declared effect graph.`,
      );
    validateProductionDesignText(diagnostics, graph.world.id, "world", file, "id");
    const ids: Set<string> = new Set<string>();
    for (const landmark of graph.world.landmarks) {
      validateProductionDesignUnique(diagnostics, ids, landmark.id, "world", file, "landmarks");
      validateProductionDesignPositive(diagnostics, landmark.radius, "world", file, "landmark.radius");
      validateProductionDesignVector(
        diagnostics,
        landmark.position,
        "world",
        file,
        "landmark.position",
      );
      validateProductionDesignText(diagnostics, landmark.meaning, "world", file, "landmark.meaning");
    }
    const surfaceIds: Set<string> = new Set<string>();
    for (const surface of graph.world.surfaces) {
      validateProductionDesignUnique(diagnostics, surfaceIds, surface.id, "world", file, "surfaces");
      if (surface.polygon.length < 3)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          "world",
          file,
          `Surface "${surface.id}" has ${surface.polygon.length} polygon points. Add at least three points in the tracked world design record.`,
        );
      for (const point of surface.polygon)
        validateProductionDesignBounded2(
          diagnostics,
          point,
          -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
          AUTOMOVIE_WORLD_COORDINATE_LIMIT,
          "world",
          file,
          "surface.polygon",
        );
      if (validateProductionDesignPolygon(surface.polygon) === false)
        validateProductionDesignInvalid(
          diagnostics,
          "design-polygon-invalid",
          "world",
          file,
          `Surface "${surface.id}" must use distinct finite vertices forming one non-self-intersecting polygon with non-zero area. Correct surface.polygon in the tracked world design record.`,
        );
      if (surface.height.kind === "constant")
        validateProductionDesignFinite(
          diagnostics,
          surface.height.value,
          "world",
          file,
          "surface.height.value",
        );
      else if (surface.height.kind === "plane") {
        validateProductionDesignFinite(
          diagnostics,
          surface.height.originHeight,
          "world",
          file,
          "surface.height.originHeight",
        );
        validateProductionDesignFinite(
          diagnostics,
          surface.height.slopeX,
          "world",
          file,
          "surface.height.slopeX",
        );
        validateProductionDesignFinite(
          diagnostics,
          surface.height.slopeZ,
          "world",
          file,
          "surface.height.slopeZ",
        );
      } else {
        const lattice: { kind: "heightfield"; originX: number; originZ: number; spacingX: number; spacingZ: number; columns: number; rows: number; samples: number[]; } = surface.height;
        validateProductionDesignFinite(
          diagnostics,
          lattice.originX,
          "world",
          file,
          "surface.height.originX",
        );
        validateProductionDesignFinite(
          diagnostics,
          lattice.originZ,
          "world",
          file,
          "surface.height.originZ",
        );
        validateProductionDesignPositive(
          diagnostics,
          lattice.spacingX,
          "world",
          file,
          "surface.height.spacingX",
        );
        validateProductionDesignPositive(
          diagnostics,
          lattice.spacingZ,
          "world",
          file,
          "surface.height.spacingZ",
        );
        // A lattice needs two lines on each axis before anything between them
        // can be interpolated, and its samples have to be exactly the lattice:
        // a short array would read relief that was never authored, and a long
        // one hides a row the author meant to be read.
        if (
          Number.isSafeInteger(lattice.columns) === false ||
          Number.isSafeInteger(lattice.rows) === false ||
          lattice.columns < 2 ||
          lattice.rows < 2
        )
          validateProductionDesignInvalid(
            diagnostics,
            "design-range-invalid",
            "world",
            file,
            `Surface "${surface.id}" heightfield has ${lattice.columns} columns and ${lattice.rows} rows. Use at least two of each in the tracked world design record.`,
          );
        else if (lattice.samples.length !== lattice.columns * lattice.rows)
          validateProductionDesignInvalid(
            diagnostics,
            "design-range-invalid",
            "world",
            file,
            `Surface "${surface.id}" heightfield carries ${lattice.samples.length} samples for a lattice of ${lattice.columns} by ${lattice.rows}. Store exactly ${lattice.columns * lattice.rows} row-major heights in the tracked world design record.`,
          );
        for (const sample of lattice.samples)
          validateProductionDesignFinite(diagnostics, sample, "world", file, "surface.height.samples");
      }
    }
    const routeIds: Set<string> = new Set<string>();
    for (const route of graph.world.routes) {
      validateProductionDesignUnique(diagnostics, routeIds, route.id, "world", file, "routes");
      if (route.waypoints.length < 2)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          "world",
          file,
          `Route "${route.id}" has ${route.waypoints.length} waypoints. Add at least two waypoints in the tracked world design record.`,
        );
      validateProductionDesignPositive(
        diagnostics,
        route.allowedFormationWidth,
        "world",
        file,
        "route.allowedFormationWidth",
      );
      for (const point of route.waypoints)
        validateProductionDesignBounded2(
          diagnostics,
          point,
          -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
          AUTOMOVIE_WORLD_COORDINATE_LIMIT,
          "world",
          file,
          "route.waypoints",
        );
      const routeLength: number = route.waypoints
        .slice(1)
        .reduce(
          (length: number, point: { x: number; z: number; }, index: number): number =>
            length +
            Math.hypot(
              point.x - route.waypoints[index]!.x,
              point.z - route.waypoints[index]!.z,
            ),
          0,
        );
      if (Number.isFinite(routeLength) === false || routeLength <= 0)
        validateProductionDesignInvalid(
          diagnostics,
          "design-route-invalid",
          "world",
          file,
          `Route "${route.id}" must have finite non-zero total length within the supported world. Correct its waypoints in the tracked world design record.`,
        );
    }
    validateProductionDesignInstanceSets(diagnostics, graph, routeIds, file);
    const effectRecipeIds: Set<string> = new Set<string>();
    for (const recipe of graph.world.effectRecipes) {
      const target: string = `effect-recipe:${recipe.id}`;
      validateProductionDesignUnique(
        diagnostics,
        effectRecipeIds,
        recipe.id,
        "world",
        file,
        "effectRecipes",
      );
      validateProductionDesignText(diagnostics, recipe.id, target, file, "id");
      validateProductionDesignInteger(
        diagnostics,
        recipe.seed,
        0,
        Number.MAX_SAFE_INTEGER,
        target,
        file,
        "seed",
      );
      validateProductionDesignBounded(
        diagnostics,
        recipe.emission.rate,
        0,
        1_024,
        target,
        file,
        "emission.rate",
      );
      validateProductionDesignInteger(
        diagnostics,
        recipe.emission.burst,
        0,
        AUTOMOVIE_MAX_EFFECT_PARTICLES,
        target,
        file,
        "emission.burst",
      );
      validateProductionDesignBounded(
        diagnostics,
        recipe.emission.duration,
        1 / 240,
        60,
        target,
        file,
        "emission.duration",
      );
      validateProductionDesignBoundedRange(
        diagnostics,
        recipe.particle.lifetime,
        1 / 240,
        30,
        target,
        file,
        "particle.lifetime",
      );
      validateProductionDesignBoundedRange(
        diagnostics,
        recipe.particle.size,
        0.01,
        20,
        target,
        file,
        "particle.size",
      );
      validateProductionDesignBoundedRange(
        diagnostics,
        recipe.particle.opacity,
        0,
        1,
        target,
        file,
        "particle.opacity",
      );
      if (/^#[0-9a-f]{6}$/i.test(recipe.particle.color) === false)
        validateProductionDesignInvalid(
          diagnostics,
          "design-color-invalid",
          target,
          file,
          `Effect color "${recipe.particle.color}" must be one opaque #RRGGBB value.`,
        );
      validateProductionDesignBoundedVector(
        diagnostics,
        recipe.motion.wind,
        -50,
        50,
        target,
        file,
        "motion.wind",
      );
      validateProductionDesignBounded(
        diagnostics,
        recipe.motion.rise,
        -50,
        50,
        target,
        file,
        "motion.rise",
      );
      validateProductionDesignBounded(
        diagnostics,
        recipe.motion.turbulence,
        0,
        50,
        target,
        file,
        "motion.turbulence",
      );
      validateProductionDesignInteger(
        diagnostics,
        recipe.budget.maxParticles,
        1,
        AUTOMOVIE_MAX_EFFECT_PARTICLES,
        target,
        file,
        "budget.maxParticles",
      );
      validateProductionDesignBounded(
        diagnostics,
        recipe.budget.lodDistance,
        0.1,
        2_000,
        target,
        file,
        "budget.lodDistance",
      );
      const totalRegular: number = Math.floor(
        recipe.emission.rate * recipe.emission.duration + 1e-9,
      );
      const lifetimeRegular: number = Math.ceil(
        recipe.emission.rate * recipe.particle.lifetime.max,
      );
      const regularPeak: number = Math.min(totalRegular, lifetimeRegular);
      // Regular particles spawn at n / rate and expire at age >= lifetime, so
      // an exact lifetime boundary does not overlap the initial burst.
      const regularBeforeBurstExpiry: number = Math.min(
        totalRegular,
        Math.max(0, lifetimeRegular - 1),
      );
      const liveUpperBound: number = Math.max(
        regularPeak,
        recipe.emission.burst + regularBeforeBurstExpiry,
      );
      if (liveUpperBound > recipe.budget.maxParticles)
        validateProductionDesignInvalid(
          diagnostics,
          "design-budget-exceeded",
          target,
          file,
          `Effect recipe "${recipe.id}" can keep ${liveUpperBound} particles live, above its ${recipe.budget.maxParticles} cap. Reduce burst, rate, emission duration, or lifetime.`,
        );
    }
    const effectIds: Set<string> = new Set<string>();
    for (const zone of graph.world.effectZones) {
      validateProductionDesignUnique(diagnostics, effectIds, zone.id, "world", file, "effectZones");
      validateProductionDesignText(diagnostics, zone.recipe, "world", file, "effect.recipe");
      if (effectRecipeIds.has(zone.recipe) === false)
        validateProductionDesignMissing(
          diagnostics,
          "world",
          file,
          `effect recipe "${zone.recipe}"`,
          `add it to effectRecipes or change zone "${zone.id}".recipe`,
        );
      validateProductionDesignBoundedVector(
        diagnostics,
        zone.bounds.min,
        -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        "world",
        file,
        "effect.bounds.min",
      );
      validateProductionDesignBoundedVector(
        diagnostics,
        zone.bounds.max,
        -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        "world",
        file,
        "effect.bounds.max",
      );
      if (
        zone.bounds.min.x >= zone.bounds.max.x ||
        zone.bounds.min.y >= zone.bounds.max.y ||
        zone.bounds.min.z >= zone.bounds.max.z
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          "world",
          file,
          `Effect zone "${zone.id}" bounds are empty or inverted. Fix bounds in the tracked world design record.`,
        );
      validateProductionDesignInteger(
        diagnostics,
        zone.seed,
        0,
        Number.MAX_SAFE_INTEGER,
        "world",
        file,
        "effect.seed",
      );
    }
    const particleBudget: number = graph.world.effectZones.reduce(
      (sum: number, zone: IAutoMovieWorldEffectZone): number =>
        sum +
        (graph.world!.effectRecipes.find((recipe: IAutoMovieEffectRecipe): boolean => recipe.id === zone.recipe)
          ?.budget.maxParticles ?? 0),
      0,
    );
    if (particleBudget > AUTOMOVIE_EFFECT_PARTICLE_BUDGET)
      validateProductionDesignInvalid(
        diagnostics,
        "design-budget-exceeded",
        "world",
        file,
        `Effect zones reserve ${particleBudget} live particles, above the production budget ${AUTOMOVIE_EFFECT_PARTICLE_BUDGET}. Reduce zone count or recipe caps.`,
      );
  }
}
