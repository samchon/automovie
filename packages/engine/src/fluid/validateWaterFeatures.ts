import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieFluidDomain,
  IAutoMovieValidation,
  IAutoMovieVector3,
  IAutoMovieWaterFeature,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "../architecture/builtSpaceContainsPoint";
import { builtSpaceIsConvex } from "../architecture/builtSpaceIsConvex";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { builtSpaceSubtree } from "../architecture/builtSpaceSubtree";
import { ViolationCollector } from "../validation/ViolationCollector";
import { validateFluidDomain } from "./validateFluidDomain";

/** Closed authoring labels for water bindings; the module owns this fixed lookup and no solver behavior is selected by kind. */
const FEATURE_KINDS: ReadonlySet<string> = new Set([
  "pond",
  "channel",
  "fountain",
  "waterfall",
  "reservoir",
  "other",
]);

/** Accepted mode strings; lowerWaterFeature owns their clock interpretation, while this fixed module lookup only admits vocabulary. */
const FEATURE_MODES: ReadonlySet<string> = new Set([
  "static",
  "flowing",
  "simulated",
]);

/**
 * Validate bindings between independent fluid domains and a building's water features.
 *
 * Joins a feature's environment, space, rim and domain ids without adding architecture fields to fluid domains. The supplied environment must already be structurally admitted; space and boundary maps resolve duplicate ids last-wins without validating those environment identities here. Rim membership uses the boundary's spaces list, and material checks reject blank ids without resolving a material catalogue.
 *
 * Every supplied domain is validated with validateFluidDomain, cited or not, and violations are re-pathed to $input.domains[i]. Duplicate domain ids are refused; features resolve both domain and validation verdict from the last record with that id.
 *
 * A volume-less root basin and a domain rejected by validateFluidDomain skip geometry. Other bindings test cell centres at origin.y + bed against the root/descendant spaces using builtSpaceContainsPoint's numerical tolerances. The test does not measure the full cell footprint or water height.
 *
 * A root with one convex cell selects only the four corner bed points. Arbitrary interior bed elevations need not lie in their convex hull, so this shortcut misses an interior excursion such as the existing 3-by-3 centre-bed regression. The exhaustive branch checks every bed point for other root spellings; neither branch certifies all future solved surfaces fit the basin.
 *
 * @evidence contracts/common.md#principled-implementation Resolves supplied ids through maps, checks boundary membership, and applies shared space containment to selected bed centres in the basin subtree. A convex root selects corners, but varying bed height breaks the assumed planar rectangle and can leave interior violations undetected; shared containment also retains its binary64 and tolerance limits.
 * @evidence contracts/common.md#clear-and-simple-design The binding validator owns only cross-record agreement; domain soundness is delegated to `validateFluidDomain` and re-pathed rather than re-worded, and geometry to the shared space predicates, so each rule has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume-less roots and rejected domains skip geometry by explicit policy, with no fixture-specific exceptions. The convex-corner shortcut keeps a disproven premise for arbitrary bed heights and remains a pending behavioral correction; it is not an exact containment certificate.
 * @evidence contracts/common.md#meaningful-documentation Gives binding checks, environment/material admission limits, duplicate resolution and domain re-pathing, geometry skips and the precise bed-centre/corner coverage gap.
 * @evidence contracts/performance.md#efficient-algorithms Maps require O(spaces + boundaries + domains) entries before domain validation and feature/rim walks; each rim membership check scans the cited boundary's spaces list, and id/text handling adds string costs. Per measured feature, subtree indexing/filtering scans all spaces; K selected points then scan descendant volumes with their plane/triangle costs. K is four corner visits or all cells, with per-row span allocation in the exhaustive branch. Domain scans use actual array and flow lengths even for over-budget records.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one call each domain is validated once and its verdict reused by every feature that cites it; across calls nothing is shared, so the production layer, which calls this once per environment with every declared domain, re-validates and re-reports each domain per environment that binds water, a duplication left to that orchestration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the maps, sets and collector die with the call, and the returned violations belong to the caller.
 */
export const validateWaterFeatures: (props: { environment: IAutoMovieBuiltEnvironment; features: IAutoMovieWaterFeature[]; domains: IAutoMovieFluidDomain[] }) => IAutoMovieValidation = (props: {
  environment: IAutoMovieBuiltEnvironment;
  features: IAutoMovieWaterFeature[];
  domains: IAutoMovieFluidDomain[];
}): IAutoMovieValidation => {
  const environment: IAutoMovieBuiltEnvironment = props.environment;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  const spaces: Map<string, IAutoMovieBuiltSpace> = new Map(
    environment.spaces.map(
      (space: IAutoMovieBuiltSpace): [string, IAutoMovieBuiltSpace] => [
        space.id,
        space,
      ],
    ),
  );
  const boundaries: Map<string, IAutoMovieBuiltBoundary> = new Map(
    environment.boundaries.map(
      (boundary: IAutoMovieBuiltBoundary): [string, IAutoMovieBuiltBoundary] => [
        boundary.id,
        boundary,
      ],
    ),
  );
  const byDomain: Map<string, IAutoMovieFluidDomain> = new Map(
    props.domains.map(
      (domain: IAutoMovieFluidDomain): [string, IAutoMovieFluidDomain] => [
        domain.id,
        domain,
      ],
    ),
  );

  const seenDomains: Set<string> = new Set<string>();
  // Whether each domain is usable on its own terms, in the same last-one-wins
  // order `byDomain` resolves an id in, so the verdict the geometry check reads
  // belongs to the record it is about to measure.
  const soundness: Map<string, boolean> = new Map<string, boolean>();
  props.domains.forEach((domain: IAutoMovieFluidDomain, index: number): void => {
    if (seenDomains.has(domain.id))
      out.push(
        "type",
        `${root}.domains[${index}].id`,
        `fluid domain id "${domain.id}" is duplicated`,
        domain.id,
      );
    seenDomains.add(domain.id);
    const validation: IAutoMovieValidation = validateFluidDomain({ domain });
    soundness.set(domain.id, validation.success);
    // Re-path rather than re-word: the domain's own violation keeps its kind,
    // its measured overshoot and its severity, so a binding report reads as the
    // same finding `validateFluidDomain` would give, at the address the binding
    // knows the domain by.
    if (validation.success === false)
      for (const item of validation.violations)
        out.items.push({
          ...item,
          path: item.path.replace("$input", `${root}.domains[${index}]`),
        });
  });

  const seenFeatures: Set<string> = new Set<string>();
  props.features.forEach(
    (feature: IAutoMovieWaterFeature, index: number): void => {
      const path: string = `${root}.features[${index}]`;
      out.nonEmpty(`${path}.id`, feature.id, "water feature id");
      if (seenFeatures.has(feature.id) && feature.id.trim().length !== 0)
        out.push(
          "type",
          `${path}.id`,
          `water feature id "${feature.id}" is duplicated`,
          feature.id,
        );
      seenFeatures.add(feature.id);

      if (!FEATURE_KINDS.has(feature.kind))
        out.push(
          "type",
          `${path}.kind`,
          `water feature kind must be one of ${[...FEATURE_KINDS].join(", ")}`,
          feature.kind,
        );
      if (!FEATURE_MODES.has(feature.mode))
        out.push(
          "type",
          `${path}.mode`,
          `water feature mode must be one of ${[...FEATURE_MODES].join(", ")}`,
          feature.mode,
        );
      if (feature.environment !== environment.id)
        out.push(
          "type",
          `${path}.environment`,
          `water feature must cite its owning built environment "${environment.id}"`,
          feature.environment,
        );
      // `null` is the renderer's own default and says so; a blank string is a
      // citation of a material with no name, which a budget would then
      // attribute to a material nobody can find.
      if (feature.material !== null && feature.material.trim().length === 0)
        out.push(
          "type",
          `${path}.material`,
          "water feature material must be a material id or null for the default",
          feature.material,
        );

      const space: IAutoMovieBuiltSpace | undefined = spaces.get(
        feature.space,
      );
      if (space === undefined)
        out.push(
          "type",
          `${path}.space`,
          `basin logical space "${feature.space}" does not resolve in built environment "${environment.id}"`,
          feature.space,
        );

      const seenBoundaries: Set<string> = new Set<string>();
      feature.boundaries.forEach((id: string, at: number): void => {
        const boundary: IAutoMovieBuiltBoundary | undefined =
          boundaries.get(id);
        if (boundary === undefined) {
          out.push(
            "type",
            `${path}.boundaries[${at}]`,
            `rim boundary "${id}" does not resolve in built environment "${environment.id}"`,
            id,
          );
          return;
        }
        if (seenBoundaries.has(id))
          out.push(
            "type",
            `${path}.boundaries[${at}]`,
            `rim boundary "${id}" is duplicated`,
            id,
          );
        seenBoundaries.add(id);
        if (!boundary.spaces.includes(feature.space))
          out.push(
            "type",
            `${path}.boundaries[${at}]`,
            `rim boundary "${id}" does not bound basin space "${feature.space}"`,
            boundary.spaces,
          );
      });

      const domain: IAutoMovieFluidDomain | undefined = byDomain.get(
        feature.domain,
      );
      if (domain === undefined) {
        out.push(
          "type",
          `${path}.domain`,
          `fluid domain "${feature.domain}" was not supplied with this binding`,
          feature.domain,
        );
        return;
      }
      if (
        space === undefined ||
        builtSpaceStatesVolume(space) === false ||
        soundness.get(feature.domain) !== true
      )
        return;
      const stray: IAutoMovieVector3 | null = strayCell({
        environment,
        space: feature.space,
        domain,
        // Root convexity currently chooses the corner shortcut. Interior bed
        // heights can still leave that root; other spellings take the full walk.
        exhaustive: builtSpaceIsConvex(space) === false,
      });
      if (stray !== null)
        out.push(
          "type",
          `${path}.domain`,
          `fluid lattice of "${domain.id}" reaches outside basin space "${feature.space}"`,
          stray,
        );
    },
  );

  return out.toValidation();
};

/**
 * The first bed point of the lattice standing outside the basin, or `null`.
 *
 * Measures origin plus each selected cell centre's X/Z and authored bed Y, not the depth-shifted water surface or cell footprint. A point is accepted when any root/descendant volume accepts it; subtree membership is built once and volume predicates retain their own numerical limits.
 *
 * `exhaustive` walks row-major cells; otherwise two endpoints per axis produce four visits, repeating endpoints on singleton axes. Arbitrary bed heights invalidate the corner branch's full-lattice inference. The caller supplies a domain admitted by validateFluidDomain; per-call sets/span arrays become collectible on return, while the returned stray point belongs to the caller. Work is subtree construction plus selected points times volume-predicate cost; exhaustive column spans are rebuilt per row.
 */
const strayCell: (props: { environment: IAutoMovieBuiltEnvironment; space: string; domain: IAutoMovieFluidDomain; exhaustive: boolean }) => IAutoMovieVector3 | null = (props: {
  environment: IAutoMovieBuiltEnvironment;
  space: string;
  domain: IAutoMovieFluidDomain;
  exhaustive: boolean;
}): IAutoMovieVector3 | null => {
  const domain: IAutoMovieFluidDomain = props.domain;
  const included: Set<string> = builtSpaceSubtree(
    props.environment.spaces,
    props.space,
  );
  const basin: IAutoMovieBuiltSpace[] = props.environment.spaces.filter(
    (space: IAutoMovieBuiltSpace): boolean => included.has(space.id),
  );
  /** Allocate all indices or the two endpoints of one admitted axis; the row loop calls this again for each column span, so arrays are not shared across rows. */
  const span: (length: number) => number[] = (length: number): number[] =>
    props.exhaustive
      ? Array.from({ length }, (_: unknown, at: number): number => at)
      : [0, length - 1];
  for (const row of span(domain.grid.rows))
    for (const column of span(domain.grid.columns)) {
      const point: IAutoMovieVector3 = {
        x: domain.grid.origin.x + (column + 0.5) * domain.grid.cellX,
        y:
          domain.grid.origin.y + domain.bed[row * domain.grid.columns + column],
        z: domain.grid.origin.z + (row + 0.5) * domain.grid.cellZ,
      };
      if (
        basin.some((space: IAutoMovieBuiltSpace): boolean =>
          builtSpaceContainsPoint(space, point),
        ) === false
      )
        return point;
    }
  return null;
};
