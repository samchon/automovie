import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignInstanceHorizontalExtent } from "./validateProductionDesignInstanceHorizontalExtent";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { validateProductionDesignBoundedVector } from "./validateProductionDesignBoundedVector";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { IAutoMovieDiagnostic, IAutoMovieInstanceSetDesign, IAutoMovieInstanceSetLayout, IAutoMovieWorldRoute, IAutoMovieInstancePrototypeDesign } from "@automovie/interface";

/**
 * Check the original grid, scatter, route, lattice or explicit placement declaration against capacity and horizontal world extent.
 *
 * @evidence contracts/common.md#principled-implementation Explicit transform quaternion, scale, prototype, palette and trait checks preserve order. Coordinates are metres, scales dimensionless and rotations unit quaternions; these conservative declaration bounds do not replace realized geometry admission.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignInstanceLayout owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Declared route searches and explicit transform/trait scans dominate; identity sets scale with explicit transforms and prototypes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export function validateProductionDesignInstanceLayout(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, routeIds: ReadonlySet<string>, file: string, instanceSet: IAutoMovieInstanceSetDesign, target: string): void {
const layout: IAutoMovieInstanceSetLayout = instanceSet.layout;
if (layout.kind === "grid") {
      validateProductionDesignInteger(
        diagnostics,
        layout.rows,
        1,
        instanceSet.count,
        target,
        file,
        "layout.rows",
      );
      validateProductionDesignInteger(
        diagnostics,
        layout.columns,
        1,
        instanceSet.count,
        target,
        file,
        "layout.columns",
      );
      validateProductionDesignPositive(diagnostics, layout.spacing.x, target, file, "layout.spacing.x");
      validateProductionDesignPositive(diagnostics, layout.spacing.z, target, file, "layout.spacing.z");
      if (layout.rows * layout.columns < instanceSet.count)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Instance grid capacity ${layout.rows * layout.columns} is below count ${instanceSet.count}. Increase rows or columns.`,
        );
      const radius: number = Math.hypot(
        ((layout.columns - 1) * layout.spacing.x) / 2,
        (layout.rows - 1) * layout.spacing.z,
      );
      validateProductionDesignInstanceHorizontalExtent(
        diagnostics,
        instanceSet.anchor,
        radius,
        target,
        file,
        "grid",
      );
    } else if (layout.kind === "scatter") {
      validateProductionDesignPositive(diagnostics, layout.radius, target, file, "layout.radius");
      validateProductionDesignInstanceHorizontalExtent(
        diagnostics,
        instanceSet.anchor,
        layout.radius,
        target,
        file,
        "scatter",
      );
    } else if (layout.kind === "along-route") {
      validateProductionDesignText(diagnostics, layout.route, target, file, "layout.route");
      if (routeIds.has(layout.route) === false)
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `route "${layout.route}"`,
          `add it to world.routes or change ${instanceSet.id}.layout.route`,
        );
      validateProductionDesignBounded(
        diagnostics,
        layout.lateralJitter,
        0,
        AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        target,
        file,
        "layout.lateralJitter",
      );
      const route: IAutoMovieWorldRoute | undefined = graph.world?.routes.find(
        (candidate: IAutoMovieWorldRoute): boolean => candidate.id === layout.route,
      );
      if (
        route !== undefined &&
        route.waypoints.some(
          (point: { x: number; z: number; }): boolean =>
            Math.abs(point.x) + layout.lateralJitter >
              AUTOMOVIE_WORLD_COORDINATE_LIMIT ||
            Math.abs(point.z) + layout.lateralJitter >
              AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        )
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Along-route instance set "${instanceSet.id}" can jitter beyond the supported world coordinate limit. Reduce lateralJitter or move the route inward.`,
        );
    } else if (layout.kind === "lattice") {
      validateProductionDesignInteger(
        diagnostics,
        layout.rows,
        1,
        instanceSet.count,
        target,
        file,
        "layout.rows",
      );
      validateProductionDesignInteger(
        diagnostics,
        layout.columns,
        1,
        instanceSet.count,
        target,
        file,
        "layout.columns",
      );
      validateProductionDesignInteger(
        diagnostics,
        layout.layers,
        1,
        instanceSet.count,
        target,
        file,
        "layout.layers",
      );
      validateProductionDesignBoundedVector(
        diagnostics,
        layout.spacing,
        Number.EPSILON,
        AUTOMOVIE_WORLD_COORDINATE_LIMIT,
        target,
        file,
        "layout.spacing",
      );
      if (layout.rows * layout.columns * layout.layers < instanceSet.count)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Instance lattice capacity ${layout.rows * layout.columns * layout.layers} is below count ${instanceSet.count}. Increase rows, columns, or layers.`,
        );
      // Columns are centred on the anchor and rows run forward from it, which
      // is exactly how the slot is materialised, so the reach is measured the
      // same way rather than assumed symmetric. Grid and scatter have been held
      // to the world limit since they existed; a lattice reaches further than
      // either for the same spacing and was never measured at all.
      validateProductionDesignInstanceHorizontalExtent(
        diagnostics,
        instanceSet.anchor,
        Math.hypot(
          ((layout.columns - 1) * layout.spacing.x) / 2,
          (layout.rows - 1) * layout.spacing.z,
        ),
        target,
        file,
        "lattice",
      );
    } else {
      if (layout.transforms.length !== instanceSet.count)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Explicit transform count ${layout.transforms.length} must equal instance count ${instanceSet.count}.`,
        );
      const transformIds: Set<string> = new Set<string>();
      const knownPrototypeIds: Set<string> = new Set([
        "default",
        ...(instanceSet.prototypes ?? []).map((prototype: IAutoMovieInstancePrototypeDesign): string => prototype.id),
      ]);
      for (const [index, transform] of layout.transforms.entries()) {
        validateProductionDesignUnique(
          diagnostics,
          transformIds,
          transform.id,
          target,
          file,
          "layout.transforms",
        );
        validateProductionDesignBoundedVector(
          diagnostics,
          transform.translation,
          -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
          AUTOMOVIE_WORLD_COORDINATE_LIMIT,
          target,
          file,
          `layout.transforms[${index}].translation`,
        );
        // Each translation is anchor-relative, so a slot inside the limit and
        // an anchor inside the limit still place a piece outside it. Every
        // other layout is measured from its anchor; this one measured only the
        // offset.
        validateProductionDesignInstanceHorizontalExtent(
          diagnostics,
          instanceSet.anchor,
          Math.hypot(transform.translation.x, transform.translation.z),
          target,
          file,
          "explicit",
        );
        const norm: number = Math.hypot(
          transform.rotation.x,
          transform.rotation.y,
          transform.rotation.z,
          transform.rotation.w,
        );
        if (Number.isFinite(norm) === false || Math.abs(norm - 1) > 1e-6)
          validateProductionDesignInvalid(
            diagnostics,
            "design-quaternion-invalid",
            target,
            file,
            `Explicit transform "${transform.id}" rotation must be a finite unit quaternion.`,
          );
        validateProductionDesignBoundedVector(
          diagnostics,
          transform.scale,
          Number.EPSILON,
          1_000,
          target,
          file,
          `layout.transforms[${index}].scale`,
        );
        if (
          transform.prototype !== undefined &&
          knownPrototypeIds.has(transform.prototype) === false
        )
          validateProductionDesignMissing(
            diagnostics,
            target,
            file,
            `instance prototype "${transform.prototype}"`,
            `add it to ${instanceSet.id}.prototypes or use "default"`,
          );
        if (
          transform.palette !== undefined &&
          /^#[0-9a-f]{6}$/i.test(transform.palette) === false
        )
          validateProductionDesignInvalid(
            diagnostics,
            "design-color-invalid",
            target,
            file,
            `Explicit transform "${transform.id}" palette must be one opaque #RRGGBB value.`,
          );
        for (const [name, value] of Object.entries(transform.traits ?? {})) {
          validateProductionDesignFinite(
            diagnostics,
            value,
            target,
            file,
            `layout.transforms[${index}].traits.${name}`,
          );
          if (
            instanceSet.variation.traits.some(
              (trait: { name: string; min: number; max: number; }): boolean => trait.name === name,
            ) === false
          )
            validateProductionDesignInvalid(
              diagnostics,
              "design-reference-invalid",
              target,
              file,
              `Explicit transform "${transform.id}" overrides undeclared trait "${name}".`,
            );
        }
      }
    }
}
