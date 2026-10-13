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

const FEATURE_KINDS: ReadonlySet<string> = new Set([
  "pond",
  "channel",
  "fountain",
  "waterfall",
  "reservoir",
  "other",
]);

const FEATURE_MODES: ReadonlySet<string> = new Set([
  "static",
  "flowing",
  "simulated",
]);

/**
 * Validate the bindings that make independent fluid domains a building's water
 * features.
 *
 * This is the seam, and it is deliberately one-directional: the architecture
 * record knows nothing about fluid, and the fluid record knows nothing about
 * architecture. The feature is the only place the two names meet, so this is
 * the only place their agreement can be checked: that the cited space is a
 * real logical space of the cited building, that every rim boundary really
 * bounds that space rather than some other room, that the cited domain exists
 * and is itself valid, and that the lattice actually sits inside the basin
 * instead of overhanging a room the author never meant to flood.
 *
 * Every supplied domain is validated with `validateFluidDomain`, cited or not,
 * and its violations are re-pathed to `$input.domains[i]`; duplicate domain
 * ids are refused and the last one with an id is the one features resolve to.
 *
 * A basin declared as a purely semantic container (a logical space that states
 * no volume at all) is not geometrically checked: there is no volume to check
 * against, and inventing one would be the design deciding a fact the author
 * did not state. Neither is a domain that already failed its own validation:
 * an unusable grid has no lattice to place, and reporting where its cells fell
 * would be a second answer derived from the first bad one.
 *
 * @evidence contracts/common.md#principled-implementation Resolves every cited name through id maps of the environment and the supplied domains, checks rim membership through each boundary's own `spaces`, and tests lattice cell centres at bed height for containment in the basin subtree, using only the corner cells for a convex basin, where a rectangle's corners decide containment exactly, and every cell otherwise.
 * @evidence contracts/common.md#clear-and-simple-design The binding validator owns only cross-record agreement; domain soundness is delegated to `validateFluidDomain` and re-pathed rather than re-worded, and geometry to the shared space predicates, so each rule has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume-less basins and unsound domains are skipped for geometry as stated rules with reasons, not to silence a fixture, and no kind, mode or environment is special-cased beyond the interface's closed vocabularies.
 * @evidence contracts/common.md#meaningful-documentation States the one-directional seam, every agreement checked, how domains are validated and re-pathed and which duplicate wins, and the two geometry skips with their reasons.
 * @evidence contracts/performance.md#efficient-algorithms Id maps make each name lookup constant time, each domain is validated once per call in time linear in its lattice, and the basin subtree is resolved once per feature before the cell walk, so geometry costs the corner cells or all cells times the subtree's spaces rather than also rescanning every space per cell.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one call each domain is validated once and its verdict reused by every feature that cites it; across calls nothing is shared, so the production layer, which calls this once per environment with every declared domain, re-validates and re-reports each domain per environment that binds water, a duplication left to that orchestration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the maps, sets and collector die with the call, and the returned violations belong to the caller.
 */
export const validateWaterFeatures = (props: {
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
        // One convex cell is decided exactly by the lattice's own corners; a
        // basin written as several cells, or as a boundary shell, is not
        // convex, and there the corners only say the ends of the lattice are
        // somewhere in the room while its middle may stand over the notch
        // between two of them, or over an atrium void cut through the basin.
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
 * The points measured are cell centres, because that is where the water is:
 * the free surface carries one vertex per cell at its centre, so the drawn
 * water never reaches past the outermost centres and a rim half a cell wide is
 * not flooded by arithmetic nobody authored. A point is inside when the basin
 * space or any space below it contains it, the same fold
 * `builtEnvironmentContainsPoint` applies, with the subtree resolved once.
 *
 * `exhaustive` walks every cell; otherwise only the corner cells are measured,
 * which decides a rectangle against a single convex region exactly. The
 * caller pays the full walk exactly when the basin is not convex, and only for
 * a domain whose own cell budget has already been enforced.
 */
const strayCell = (props: {
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
  const span = (length: number): number[] =>
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
