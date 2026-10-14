import { lowerWaterFeature, validateWaterFeatures } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieFluidDomain,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFluidBindingPondDomain as pondDomain } from "../internal/createFluidBindingPondDomain";
import { createNotchedFluidBasinEnvironment as notchedEnvironment } from "../internal/createNotchedFluidBasinEnvironment";
import { createVolumeLessFluidBasinEnvironment as withoutCells } from "../internal/createVolumeLessFluidBasinEnvironment";
import { basinEnvironment, waterFeature } from "../internal/fluidFixtures";
import {
  hasViolation,
  namedFacts,
  nclose,
  throwsError,
} from "../internal/predicates";

/** A 4×4 lattice of the given cell size, cornered on the given origin. */
const placed: (props: {
  cell: number;
  x: number;
}) => IAutoMovieFluidDomain = (props: {
  cell: number;
  x: number;
}): IAutoMovieFluidDomain =>
  pondDomain({
    grid: {
      columns: 4,
      rows: 4,
      cellX: props.cell,
      cellZ: 0.5,
      origin: { x: props.x, y: 0, z: -1 },
    },
  });

/**
 * Validate the joins between an authored building, independent fluid domains
 * and their water-feature bindings, then inspect CPU frame lowering.
 *
 * The direction of the dependency is the design. The architecture record knows
 * nothing about fluid and the fluid record knows nothing about architecture, so
 * the same domain that fills an atrium pond here can be placed by a production
 * world with no building at all. What the binding owes in exchange is that
 * every name it repeats actually resolves, that a rim really bounds the basin
 * it claims to, and that the lattice sits inside the room it floods.
 *
 * Scenarios:
 *
 * 1. A pond bound to a real space, with a rim that really bounds it and a valid
 *    domain, validates clean.
 * 2. Every unresolved or mismatched name is refused: a foreign environment id, a
 *    space that does not exist, a domain that was not supplied, a rim that does
 *    not exist, and a rim that bounds some other room.
 * 3. Identity is enforced across features and domains: an empty feature id,
 *    duplicated feature ids, a duplicated rim, and duplicated domain ids.
 * 4. The closed vocabularies are closed: an unknown kind and an unknown mode.
 * 5. A domain that is invalid on its own terms fails the binding too, with its
 *    range finding re-pathed onto its depth field; an unstable solver carries
 *    an error-severity range finding and the independently computed overshoot.
 * 6. Geometry: a lattice standing outside its basin is refused, and a basin
 *    declared as a purely semantic container — a space with no convex cells —
 *    is deliberately not geometrically checked. The same 3×3 lattice is
 *    admitted with flat bed, but refused when only its centre bed rises above
 *    the convex basin ceiling while all four corner beds remain inside.
 * 7. A basin written as several convex cells is checked at every bed centre: a lattice bridging the notch
 *    between two halves is refused even though all four of its corners stand in
 *    the room, while a lattice wholly inside one half is accepted. An unsound
 *    domain is not measured at all — a grid that failed its own validation has
 *    no placement to answer for, and a second verdict derived from the first
 *    bad one would be a finding about nothing.
 * 8. `lowerWaterFeature` gives a renderer the state, the surface and the spray in
 *    one frame; a `static` feature always reads step 0 while `flowing` and
 *    `simulated` read the fixed-step solve at that second.
 * 9. `lowerWaterFeature` refuses a domain other than the one the feature binds,
 *    because drawing another lattice's water under this feature's name is a
 *    silent wrong frame.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates feature/environment/space/domain/rim joins and bed-point containment, then lowers static, simulated and flowing frames and observes shared step/state/surface/spray fields plus foreign-domain refusal.
 * @evidence contracts/testing.md#independent-expectations Literal identities and basin halfspaces independently require valid joins and in-volume bed centres; the same 3-by-3 lattice changes only its interior bed height for the convex refusal regression. Mode clocks and authored zero-bed heights determine lowering expectations.
 * @evidence contracts/testing.md#distinguishing-cases Retains original missing/duplicate/blank identities, kind/mode/material refusals, domain re-pathing and overshoot, semantic skip, outside/notched/seated/unsound geometry and frame modes; the interior-bed twin requires refusal of a height excursion despite inside corner beds. No visual result is claimed.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns every existing binding/lowering case and the approved same-shape interior-bed twin through engine calls; internal fixture helpers only supply records and no renderer, browser or GPU starts.
 */
export function test_fluid_water_feature_binding(): void {
  const environment: ReturnType<typeof basinEnvironment> = basinEnvironment();
  const domain: ReturnType<typeof pondDomain> = pondDomain();

  TestValidator.equals(
    "a well-formed binding validates clean",
    validateWaterFeatures({
      environment,
      features: [waterFeature()],
      domains: [domain],
    }).success,
    true,
  );

  const names: ReturnType<typeof validateWaterFeatures> = validateWaterFeatures(
    {
      environment,
      features: [
        waterFeature({ id: "foreign", environment: "somewhere-else" }),
        waterFeature({ id: "ghost-space", space: "no-such-room" }),
        waterFeature({ id: "ghost-domain", domain: "no-such-domain" }),
        waterFeature({ id: "ghost-rim", boundaries: ["no-such-rim"] }),
        waterFeature({ id: "wrong-rim", boundaries: ["elsewhere"] }),
      ],
      domains: [domain],
    },
  );
  TestValidator.equals(
    "every repeated name must resolve to the thing it claims",
    namedFacts([
      [
        "environment",
        (): boolean =>
          hasViolation(names, "type", "$input.features[0].environment"),
      ],
      [
        "space",
        (): boolean => hasViolation(names, "type", "$input.features[1].space"),
      ],
      [
        "domain",
        (): boolean => hasViolation(names, "type", "$input.features[2].domain"),
      ],
      [
        "rimMissing",
        (): boolean =>
          hasViolation(names, "type", "$input.features[3].boundaries[0]"),
      ],
      [
        "rimElsewhere",
        (): boolean =>
          hasViolation(names, "type", "$input.features[4].boundaries[0]"),
      ],
    ]),
    {
      environment: true,
      space: true,
      domain: true,
      rimMissing: true,
      rimElsewhere: true,
    },
  );

  const identity: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment,
      features: [
        waterFeature({ id: "  " }),
        waterFeature({ id: "twin" }),
        waterFeature({ id: "twin" }),
        waterFeature({ id: "double-rim", boundaries: ["coping", "coping"] }),
        waterFeature({ id: "blank-material", material: "  " }),
        waterFeature({ id: "named-material", material: "water-glass" }),
      ],
      domains: [domain, { ...domain }],
    });
  TestValidator.equals(
    "identity is enforced across features, rims and domains",
    namedFacts([
      [
        "emptyId",
        (): boolean => hasViolation(identity, "type", "$input.features[0].id"),
      ],
      [
        "duplicateFeature",
        (): boolean => hasViolation(identity, "type", "$input.features[2].id"),
      ],
      [
        "duplicateRim",
        (): boolean =>
          hasViolation(identity, "type", "$input.features[3].boundaries[1]"),
      ],
      [
        "duplicateDomain",
        (): boolean => hasViolation(identity, "type", "$input.domains[1].id"),
      ],
      [
        "blankMaterial",
        (): boolean =>
          hasViolation(identity, "type", "$input.features[4].material"),
      ],
      [
        "namedMaterial",
        (): boolean =>
          hasViolation(identity, "type", "$input.features[5].material") ===
          false,
      ],
    ]),
    {
      emptyId: true,
      duplicateFeature: true,
      duplicateRim: true,
      duplicateDomain: true,
      blankMaterial: true,
      namedMaterial: true,
    },
  );

  const vocabulary: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment,
      features: [
        waterFeature({
          kind: "lava" as unknown as "pond",
          mode: "boiling" as unknown as "static",
        }),
      ],
      domains: [domain],
    });
  const broken: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment,
      features: [waterFeature()],
      domains: [pondDomain({ depth: new Array<number>(16).fill(-1) })],
    });
  const unstable: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment,
      features: [waterFeature()],
      domains: [
        pondDomain({
          solver: {
            fixedStepSeconds: 1,
            gravity: 8,
            drag: 0,
            dryDepth: 0,
            referenceDepth: 2,
            maxSteps: 100,
          },
        }),
      ],
    });
  TestValidator.predicate(
    "the binding reports the independently computed Courant overshoot",
    (): boolean =>
      unstable.success === false &&
      unstable.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.domains[0].solver.fixedStepSeconds" &&
          item.kind === "range" &&
          item.severity === "error" &&
          nclose(item.overshoot ?? -1, 1 * 4 * Math.sqrt(8) - 1, 1e-9),
      ),
  );
  TestValidator.equals(
    "closed vocabularies stay closed and a broken domain breaks its binding",
    namedFacts([
      [
        "kind",
        (): boolean =>
          hasViolation(vocabulary, "type", "$input.features[0].kind"),
      ],
      [
        "mode",
        (): boolean =>
          hasViolation(vocabulary, "type", "$input.features[0].mode"),
      ],
      [
        "domainViolations",
        (): boolean =>
          hasViolation(broken, "range", "$input.domains[0].depth[0]"),
      ],
    ]),
    {
      kind: true,
      mode: true,
      domainViolations: true,
    },
  );

  const outside: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment,
      features: [waterFeature()],
      domains: [
        pondDomain({
          grid: {
            columns: 4,
            rows: 4,
            cellX: 0.5,
            cellZ: 0.5,
            origin: { x: 100, y: 0, z: 0 },
          },
        }),
      ],
    });
  const semantic: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment: withoutCells(),
      features: [waterFeature()],
      domains: [
        pondDomain({
          grid: {
            columns: 4,
            rows: 4,
            cellX: 0.5,
            cellZ: 0.5,
            origin: { x: 100, y: 0, z: 0 },
          },
        }),
      ],
    });
  TestValidator.equals(
    "a lattice must sit in its basin, unless the basin states no volume",
    namedFacts([
      [
        "outside",
        (): boolean =>
          hasViolation(outside, "type", "$input.features[0].domain"),
      ],
      ["semanticContainer", (): boolean => semantic.success === true],
    ]),
    { outside: true, semanticContainer: true },
  );

  // Centres X/Z are -0.5, 0, 0.5, all inside the authored basin walls.
  // Flat bed Y=0 is between floor -1 and ceiling 4; only the centre Y=100
  // violates the same ceiling. Domain shape and every other value stay equal.
  const flatInterior: IAutoMovieFluidDomain = pondDomain({
    grid: {
      columns: 3,
      rows: 3,
      cellX: 0.5,
      cellZ: 0.5,
      origin: { x: -0.75, y: 0, z: -0.75 },
    },
    bed: new Array<number>(9).fill(0),
    depth: new Array<number>(9).fill(0.25),
    solid: new Array<boolean>(9).fill(false),
  });
  TestValidator.equals(
    "the flat 3x3 bed fits its convex basin",
    validateWaterFeatures({
      environment,
      features: [waterFeature()],
      domains: [flatInterior],
    }).success,
    true,
  );
  const raisedInterior: IAutoMovieFluidDomain = {
    ...flatInterior,
    bed: flatInterior.bed.map((height: number, index: number): number =>
      index === 4 ? 100 : height,
    ),
  };
  const interiorRefusal: IAutoMovieValidation = validateWaterFeatures({
    environment,
    features: [waterFeature()],
    domains: [raisedInterior],
  });
  TestValidator.predicate(
    "an outside interior bed is refused even with inside corner beds",
    hasViolation(interiorRefusal, "type", "$input.features[0].domain"),
  );

  // Cell centres −0.75, −0.25, 0.25, 0.75: the two ends stand in the two halves
  // of the notched basin while the middle two stand over the notch, so the
  // lattice's own corners say nothing about where its water is.
  const notched: ReturnType<typeof notchedEnvironment> = notchedEnvironment();
  const bridging: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment: notched,
      features: [waterFeature()],
      domains: [placed({ cell: 0.5, x: -1 })],
    });
  // Centres −1.75, −1.5, −1.25, −1: wholly inside the west half.
  const seated: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment: notched,
      features: [waterFeature()],
      domains: [placed({ cell: 0.25, x: -1.875 })],
    });
  const unsound: ReturnType<typeof validateWaterFeatures> =
    validateWaterFeatures({
      environment,
      features: [waterFeature()],
      domains: [
        pondDomain({
          depth: new Array<number>(16).fill(-1),
          grid: {
            columns: 4,
            rows: 4,
            cellX: 0.5,
            cellZ: 0.5,
            origin: { x: 100, y: 0, z: 0 },
          },
        }),
      ],
    });
  TestValidator.equals(
    "a basin split into convex cells is measured cell by cell",
    namedFacts([
      [
        "bridgesTheNotch",
        (): boolean =>
          hasViolation(bridging, "type", "$input.features[0].domain"),
      ],
      ["seatedInOneHalf", (): boolean => seated.success === true],
      [
        "unsoundDomainReported",
        (): boolean =>
          hasViolation(unsound, "range", "$input.domains[0].depth[0]"),
      ],
      [
        "unsoundDomainNotPlaced",
        (): boolean =>
          hasViolation(unsound, "type", "$input.features[0].domain") === false,
      ],
    ]),
    {
      bridgesTheNotch: true,
      seatedInOneHalf: true,
      unsoundDomainReported: true,
      unsoundDomainNotPlaced: true,
    },
  );

  const still: ReturnType<typeof lowerWaterFeature> = lowerWaterFeature({
    feature: waterFeature({ mode: "static" }),
    domain,
    time: 4,
  });
  const solved: ReturnType<typeof lowerWaterFeature> = lowerWaterFeature({
    feature: waterFeature({ mode: "simulated" }),
    domain,
    time: 4,
    cameraDistance: 0,
  });
  const flowing: ReturnType<typeof lowerWaterFeature> = lowerWaterFeature({
    feature: waterFeature({ mode: "flowing" }),
    domain,
    time: 4,
  });
  TestValidator.predicate(
    "one frame carries the state, the surface and the spray together",
    (): boolean =>
      still.state.step === 0 &&
      Object.is(still.state.sourceVolume, 0) &&
      nclose(still.state.sourceVolume, 0, 0) &&
      solved.state.step === Math.round(4 / domain.solver.fixedStepSeconds) &&
      solved.state.sourceVolume > 0 &&
      flowing.state.step === solved.state.step &&
      solved.feature === "atrium-pond" &&
      solved.surface.step === solved.state.step &&
      solved.surface.bounds !== null &&
      nclose(
        solved.surface.bounds.max.y,
        Math.max(...solved.state.depth),
        1e-12,
      ) &&
      solved.spray.particles.length > 0 &&
      solved.spray.step === solved.state.step,
  );

  TestValidator.predicate(
    "a feature names the domain it refuses",
    (): boolean =>
      throwsError(
        (): ReturnType<typeof lowerWaterFeature> =>
          lowerWaterFeature({
            feature: waterFeature({ domain: `${domain.id}-elsewhere` }),
            domain,
            time: 4,
          }),
        ["atrium-pond", `${domain.id}-elsewhere`, domain.id],
      ),
  );
}
