import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftFurnishing,
  IAutoMovieSoftNamedState,
  IAutoMovieValidation,
} from "@automovie/interface";

import { builtEnvironmentContainsPoint } from "../architecture/builtEnvironmentContainsPoint";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { ViolationCollector } from "../validation/ViolationCollector";
import { softBodyRestConfiguration } from "./softBodyRestConfiguration";
import { validateAutoMovieSoftFurnishingDomainOwnership } from "./validateAutoMovieSoftFurnishingDomainOwnership";
import { validateSoftBodyDomain } from "./validateSoftBodyDomain";

/** Fixed schema kind membership shared across validation calls without per-call rebuilding. */
const FURNISHING_KINDS: Set<string> = new Set([
  "curtain",
  "blind",
  "rug",
  "cushion",
  "bed-linen",
  "membrane",
  "other",
]);

/** Fixed lowering modes; selecting simulated here does not execute the unwired live solver host. */
const FURNISHING_MODES: Set<string> = new Set(["rest", "simulated"]);

/**
 * Join typed furnishings to domains, supports and room volumes, then inspect held rest particles.
 *
 * @evidence contracts/common.md#principled-implementation Environment/domain maps and domain admission establish references; softBodyRestConfiguration applies static anchors and the selected state before testing each held particle against a declared room volume. This checks particles, not every cloth face or future trajectory.
 * @evidence contracts/common.md#clear-and-simple-design Furnishing owns the architecture/cloth join, while domain admission and production-wide domain ownership stay in their respective owners; prevalidated explicitly delegates the latter check to the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Semantic rooms skip geometric checks, absent domains are reported and no volume is invented. Non-null moving bindings are not evaluated here, and invalid domains with matching array length can still reach held-configuration inspection.
 * @evidence contracts/common.md#meaningful-documentation Documents typed join, prevalidated ownership prerequisite, named-state fallback after a missing-state finding and point-only initial containment; malformed input shapes or derived numeric failures may throw.
 * @evidence contracts/performance.md#efficient-algorithms For D domains and F furnishings, indexing plus domain validation precede support scans and O(P) held-configuration/containment checks per furnishing; repeated bindings can rebuild the same configuration and room tests include their architecture cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Maps and sets share identity resolution within this pass and held particles reuse the canonical rest owner; no configuration cache is retained across changed domain/state/room records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh maps, reference sets and held buffers leave scope when the pass ends; the returned violation list alone retains offending inputs/points, without simulation history or viewer handles.
 * @author Samchon
 */
export const validateSoftFurnishings: (props: {
  environment: IAutoMovieBuiltEnvironment;
  furnishings: IAutoMovieSoftFurnishing[];
  domains: IAutoMovieSoftBodyDomain[];
  domainOwnership?: "validate" | "prevalidated" | undefined;
}) => IAutoMovieValidation = (props: {
  environment: IAutoMovieBuiltEnvironment;
  furnishings: IAutoMovieSoftFurnishing[];
  domains: IAutoMovieSoftBodyDomain[];
  /** Skip the production-wide join only after the caller validated it once. */
  domainOwnership?: "validate" | "prevalidated";
}): IAutoMovieValidation => {
  const { environment, furnishings, domains }: typeof props = props;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  if (props.domainOwnership !== "prevalidated") {
    const ownership: IAutoMovieValidation =
      validateAutoMovieSoftFurnishingDomainOwnership(furnishings);
    if (ownership.success === false) out.items.push(...ownership.violations);
  }

  const spaces: Map<string, IAutoMovieBuiltSpace> = new Map(
    environment.spaces.map(
      (space: IAutoMovieBuiltSpace): [string, IAutoMovieBuiltSpace] => [
        space.id,
        space,
      ],
    ),
  );
  const elements: Set<string> = new Set(
    environment.elements.map(
      (element: IAutoMovieBuiltElement): string => element.id,
    ),
  );
  const byDomain: Map<string, IAutoMovieSoftBodyDomain> = new Map(
    domains.map(
      (
        domain: IAutoMovieSoftBodyDomain,
      ): [string, IAutoMovieSoftBodyDomain] => [domain.id, domain],
    ),
  );

  const seenDomains: Set<string> = new Set<string>();
  domains.forEach((domain: IAutoMovieSoftBodyDomain, index: number): void => {
    if (seenDomains.has(domain.id))
      out.push(
        "type",
        `${root}.domains[${index}].id`,
        `soft body domain id "${domain.id}" is duplicated`,
        domain.id,
      );
    seenDomains.add(domain.id);
    const validation: IAutoMovieValidation = validateSoftBodyDomain({ domain });
    // Re-path rather than re-word: the domain's own violation keeps its kind,
    // its measured overshoot and its severity, so a binding report reads as the
    // same finding `validateSoftBodyDomain` would give, at the address the
    // binding knows the domain by.
    if (validation.success === false)
      for (const item of validation.violations)
        out.items.push({
          ...item,
          path: item.path.replace("$input", `${root}.domains[${index}]`),
        });
  });

  const seenFurnishings: Set<string> = new Set<string>();
  furnishings.forEach(
    (furnishing: IAutoMovieSoftFurnishing, index: number): void => {
      const path: string = `${root}.furnishings[${index}]`;
      if (furnishing.id.trim().length === 0)
        out.push(
          "type",
          `${path}.id`,
          "soft furnishing id must be non-empty",
          furnishing.id,
        );
      else if (seenFurnishings.has(furnishing.id))
        out.push(
          "type",
          `${path}.id`,
          `soft furnishing id "${furnishing.id}" is duplicated`,
          furnishing.id,
        );
      seenFurnishings.add(furnishing.id);

      if (!FURNISHING_KINDS.has(furnishing.kind))
        out.push(
          "type",
          `${path}.kind`,
          `soft furnishing kind must be one of ${[...FURNISHING_KINDS].join(", ")}`,
          furnishing.kind,
        );
      if (!FURNISHING_MODES.has(furnishing.mode))
        out.push(
          "type",
          `${path}.mode`,
          `soft furnishing mode must be one of ${[...FURNISHING_MODES].join(", ")}`,
          furnishing.mode,
        );
      if (furnishing.environment !== environment.id)
        out.push(
          "type",
          `${path}.environment`,
          `soft furnishing must cite its owning built environment "${environment.id}"`,
          furnishing.environment,
        );

      const space: IAutoMovieBuiltSpace | undefined = spaces.get(
        furnishing.space,
      );
      if (space === undefined)
        out.push(
          "type",
          `${path}.space`,
          `logical space "${furnishing.space}" does not resolve in built environment "${environment.id}"`,
          furnishing.space,
        );

      const seenSupports: Set<string> = new Set<string>();
      furnishing.supports.forEach((id: string, at: number): void => {
        if (!elements.has(id))
          out.push(
            "type",
            `${path}.supports[${at}]`,
            `support element "${id}" does not resolve in built environment "${environment.id}"`,
            id,
          );
        else if (seenSupports.has(id))
          out.push(
            "type",
            `${path}.supports[${at}]`,
            `support element "${id}" is duplicated`,
            id,
          );
        seenSupports.add(id);
      });

      const domain: IAutoMovieSoftBodyDomain | undefined = byDomain.get(
        furnishing.domain,
      );
      if (domain === undefined) {
        out.push(
          "type",
          `${path}.domain`,
          `soft body domain "${furnishing.domain}" was not supplied with this binding`,
          furnishing.domain,
        );
        return;
      }
      const holds: boolean =
        furnishing.state !== null &&
        domain.states.some(
          (state: IAutoMovieSoftNamedState): boolean =>
            state.id === furnishing.state,
        );
      if (furnishing.state !== null && holds === false)
        out.push(
          "type",
          `${path}.state`,
          `soft body domain "${domain.id}" does not declare a named state "${furnishing.state}"`,
          furnishing.state,
        );
      if (space === undefined || builtSpaceStatesVolume(space) === false)
        return;
      const particles: number = domain.lattice.columns * domain.lattice.rows;
      if (domain.rest.length !== particles * 3) return;
      // The configuration is checked, not the rest array. An anchor holds its
      // particle at its own target and the held named state moves it again, both
      // before the first step is integrated, so a curtain whose every ring is on
      // the far side of the wall would read as hanging inside the room if only
      // the authored mesh were walked.
      const configuration: number[] = softBodyRestConfiguration(
        domain,
        holds ? furnishing.state : null,
      );
      for (let particle: number = 0; particle < particles; ++particle) {
        const point: { x: number; y: number; z: number } = {
          x: configuration[particle * 3],
          y: configuration[particle * 3 + 1],
          z: configuration[particle * 3 + 2],
        };
        if (
          builtEnvironmentContainsPoint(
            environment,
            furnishing.space,
            point,
          ) === false
        ) {
          out.push(
            "type",
            `${path}.domain`,
            `particle ${particle} of "${domain.id}" is held outside space "${furnishing.space}"`,
            point,
          );
          return;
        }
      }
    },
  );

  return out.toValidation();
};
