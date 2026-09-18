import { IAutoMovieBuiltEnvironment, IAutoMovieSoftBodyDomain, IAutoMovieSoftFurnishing, IAutoMovieValidation } from "@automovie/interface";
import { builtEnvironmentContainsPoint } from "../architecture/builtEnvironmentContainsPoint";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { ViolationCollector } from "../validation/ViolationCollector";
import { softBodyRestConfiguration } from "./softBodyRestConfiguration";
import { validateSoftBodyDomain } from "./validateSoftBodyDomain";
import { validateAutoMovieSoftFurnishingDomainOwnership } from "./validateAutoMovieSoftFurnishingDomainOwnership";

/**
 * Validate the bindings that make independent soft-body domains a building's
 * furnishings.
 *
 * This is the seam, and it is deliberately one-directional: the architecture
 * record knows nothing about cloth, and the cloth record knows nothing about
 * architecture. The furnishing is the only place the two names meet, so this is
 * the only place their agreement can be checked — that the cited space is a
 * real logical space of the cited environment, that every support really is an
 * element of it, that the cited domain exists and is itself valid, that no
 * second furnishing draws a panel one already draws, that the named state the
 * furnishing asks to hold is one the domain declares, and that the panel in the
 * configuration it is actually held in hangs inside the room instead of through
 * the wall behind it.
 *
 * A room declared as a purely semantic container (a logical space that states
 * no volume at all) is not geometrically checked: there is no volume to check
 * against, and inventing one would be the design deciding a fact the author did
 * not state.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Validates the furnishing's domain, support, uniqueness, and held geometry against its room.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Enforces the binding boundary between a soft panel and interior placement.
 * @author Samchon
 */
export const validateSoftFurnishings = (props: {
  environment: IAutoMovieBuiltEnvironment;
  furnishings: IAutoMovieSoftFurnishing[];
  domains: IAutoMovieSoftBodyDomain[];
  /** Skip the production-wide join only after the caller validated it once. */
  domainOwnership?: "validate" | "prevalidated";
}): IAutoMovieValidation => {
  const { environment, furnishings, domains } = props;
  const out = new ViolationCollector();
  const root = "$input";

  if (props.domainOwnership !== "prevalidated") {
    const ownership =
      validateAutoMovieSoftFurnishingDomainOwnership(furnishings);
    if (ownership.success === false) out.items.push(...ownership.violations);
  }

  const spaces = new Map(environment.spaces.map((space) => [space.id, space]));
  const elements = new Set(environment.elements.map((element) => element.id));
  const byDomain = new Map(domains.map((domain) => [domain.id, domain]));

  const seenDomains = new Set<string>();
  domains.forEach((domain, index) => {
    if (seenDomains.has(domain.id))
      out.push(
        "type",
        `${root}.domains[${index}].id`,
        `soft body domain id "${domain.id}" is duplicated`,
        domain.id,
      );
    seenDomains.add(domain.id);
    const validation = validateSoftBodyDomain({ domain });
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

  const seenFurnishings = new Set<string>();
  furnishings.forEach((furnishing, index) => {
    const path = `${root}.furnishings[${index}]`;
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

    const space = spaces.get(furnishing.space);
    if (space === undefined)
      out.push(
        "type",
        `${path}.space`,
        `logical space "${furnishing.space}" does not resolve in built environment "${environment.id}"`,
        furnishing.space,
      );

    const seenSupports = new Set<string>();
    furnishing.supports.forEach((id, at) => {
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

    const domain = byDomain.get(furnishing.domain);
    if (domain === undefined) {
      out.push(
        "type",
        `${path}.domain`,
        `soft body domain "${furnishing.domain}" was not supplied with this binding`,
        furnishing.domain,
      );
      return;
    }
    const holds =
      furnishing.state !== null &&
      domain.states.some((state) => state.id === furnishing.state);
    if (furnishing.state !== null && holds === false)
      out.push(
        "type",
        `${path}.state`,
        `soft body domain "${domain.id}" does not declare a named state "${furnishing.state}"`,
        furnishing.state,
      );
    if (space === undefined || builtSpaceStatesVolume(space) === false) return;
    const particles = domain.lattice.columns * domain.lattice.rows;
    if (domain.rest.length !== particles * 3) return;
    // The configuration is checked, not the rest array. An anchor holds its
    // particle at its own target and the held named state moves it again, both
    // before the first step is integrated, so a curtain whose every ring is on
    // the far side of the wall would read as hanging inside the room if only
    // the authored mesh were walked.
    const configuration = softBodyRestConfiguration(
      domain,
      holds ? furnishing.state : null,
    );
    for (let particle = 0; particle < particles; ++particle) {
      const point = {
        x: configuration[particle * 3],
        y: configuration[particle * 3 + 1],
        z: configuration[particle * 3 + 2],
      };
      if (
        builtEnvironmentContainsPoint(environment, furnishing.space, point) ===
        false
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
  });

  return out.toValidation();
};

/** Code-unit order without locale-dependent collation. */
const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const FURNISHING_KINDS = new Set([

  "curtain",
  "blind",
  "rug",
  "cushion",
  "bed-linen",
  "membrane",
  "other",
]);
const FURNISHING_MODES = new Set(["rest", "simulated"]);
