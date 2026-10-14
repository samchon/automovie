import { validateSoftFurnishings } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftFurnishing,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertSoftFurnishingOwnershipAndLowering } from "../internal/assertSoftFurnishingOwnershipAndLowering";
import { hasViolation, namedFacts } from "../internal/predicates";
import {
  roomEnvironment,
  softFurnishing,
  softPanel,
} from "../internal/softFixtures";

/** A curtain small enough to hang well inside the room's convex cell. */
const panel: (
  overrides?: Partial<IAutoMovieSoftBodyDomain>,
) => IAutoMovieSoftBodyDomain = (
  overrides: Partial<IAutoMovieSoftBodyDomain> = {},
): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 3,
    rows: 3,
    overrides: {
      anchors: [{ id: "hook", particle: 0, position: null }],
      states: [
        {
          id: "open",
          anchors: [{ anchor: "hook", position: { x: 0.5, y: 0, z: 0 } }],
        },
      ],
      ...overrides,
    },
  });

const check: (props: {
  furnishings?: IAutoMovieSoftFurnishing[];
  domains?: IAutoMovieSoftBodyDomain[];
  semantic?: boolean;
}) => IAutoMovieValidation = (props: {
  furnishings?: IAutoMovieSoftFurnishing[];
  domains?: IAutoMovieSoftBodyDomain[];
  semantic?: boolean;
}): IAutoMovieValidation =>
  validateSoftFurnishings({
    environment: roomEnvironment({ semantic: props.semantic }),
    furnishings: props.furnishings ?? [softFurnishing()],
    domains: props.domains ?? [panel()],
  });

/**
 * The binding between a building and a soft-body domain resolves, and what the
 * lowering could not compute is reported as a capability status rather than
 * drawn as though it had been.
 *
 * This is the seam where the two independent records meet, so it is the only
 * place their agreement can be checked. It is also where the honesty contract
 * lives: a panel that could not be solved must arrive labelled, because a still
 * curtain nobody can distinguish from a solved one is exactly the silent pass
 * this domain exists to refuse.
 *
 * Scenarios:
 *
 * 1. A complete binding validates clean, and the panel's rest mesh really is
 *    inside the room's convex cell.
 * 2. Every reference is checked: a wrong environment, an unknown space, an unknown
 *    or duplicated support element, an unsupplied domain, a duplicated domain
 *    id, a duplicated furnishing id, a blank furnishing id, an unknown kind, an
 *    unknown mode and an undeclared named state are each named.
 * 3. A domain that fails its own validation is reported at the address the binding
 *    knows it by, keeping its original kind and severity.
 * 4. A panel hanging outside the room is refused, while a purely semantic space
 *    with no convex cells is not geometrically checked at all — inventing a
 *    volume would be the design deciding a fact nobody stated. A panel whose
 *    rest array is the wrong length is refused for that and **not**
 *    additionally accused of hanging outside the room; the malformed rest field is reported.
 * 5. Containment reads the configuration the panel is actually **held** in, not
 *    the authored rest mesh: an anchor holding its ring beyond the wall is
 *    refused even though every rest particle is inside, the named state the
 *    furnishing holds is refused for the same reason, and the identical state
 *    left unheld is not — a boundary condition nobody applied is not a panel
 *    hanging anywhere.
 * 6. Two furnishings cannot draw one panel, whether their bindings cite the
 *    same or different environments. The production-wide findings are ordered
 *    by domain and furnishing id rather than authoring order; a caller that
 *    performs that join once can skip repeating it in each environment-local
 *    validation pass.
 * 7. The lowering's capability matrix: a furnishing paired with a domain it does
 *    not draw is `not-run`, an invalid domain is `not-run` with no geometry, an
 *    undeclared named state is `not-run`, a request for cloth-on-cloth contact
 *    is `unsupported` and returns the rest configuration rather than a solve,
 *    `mode: "rest"` is reported as `rest`, only an ordinary `simulated`
 *    furnishing is reported as `solved`, and a mode this tier does not evaluate
 *    is `not-run` rather than falling through to a solve it never performed.
 * 8. The probed invalid times are reported without throwing. A non-finite second and one
 *    landing past the step budget the domain declared for itself, are each
 *    reported as `not-run` with no geometry rather than being sent to the solver.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises validateSoftFurnishings references, domain refusal paths and held-particle containment, then the shared ownership/lowering helper checks global deterministic ownership and explicit computation statuses, missing geometry and clock refusals. These are actual validator/lowering outputs rather than renderer appearances.
 * @evidence contracts/testing.md#independent-expectations The room spans X/Z [-8,8] and Y [-4,4], so authored X=40 particles or held anchors lie outside while a semantic room supplies no geometric premise. Literal identity conflicts and lexicographic a-domain/z-domain plus alpha/beta ownership supply independent expectations. The 1/64 s clock maps 0.5 to step 32, 16 to 1024 beyond budget 1000, and 15.625 to its exact boundary. Containment assertions do not prove whole-face or future-trajectory containment.
 * @evidence contracts/testing.md#distinguishing-cases Eight groups preserve complete/reference-invalid bindings, re-pathed domain errors, geometric versus semantic/unmeasurable panels, held/unheld/unknown states, local/global and reordered ownership, prevalidated ownership, rest/solved/unsupported/not-run lowering and time limits. Malformed container shapes, live moving boundaries and unexpected solver failures are outside these cases; the test does not establish that lowering can never throw.
 * @evidence contracts/testing.md#execution-ownership The named test_soft_furnishing_binding entry invokes assertSoftFurnishingOwnershipAndLowering synchronously with the same panel function object and shared furnishing/room fixtures. All cases are portable CPU joins and lowering, with no production renderer, host or dynamically registered cases.
 */
export function test_soft_furnishing_binding(): void {
  TestValidator.equals(
    "a complete binding validates clean",
    check({}).success,
    true,
  );

  TestValidator.equals(
    "every reference is checked",
    namedFacts([
      [
        "environment",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing({ environment: "other" })] }),
            "type",
            "furnishings[0].environment",
          ),
      ],
      [
        "space",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing({ space: "attic" })] }),
            "type",
            "furnishings[0].space",
          ),
      ],
      [
        "support",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing({ supports: ["rail"] })] }),
            "type",
            "furnishings[0].supports[0]",
          ),
      ],
      [
        "duplicateSupport",
        (): boolean =>
          hasViolation(
            check({
              furnishings: [softFurnishing({ supports: ["track", "track"] })],
            }),
            "type",
            "furnishings[0].supports[1]",
          ),
      ],
      [
        "domain",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing({ domain: "absent" })] }),
            "type",
            "furnishings[0].domain",
          ),
      ],
      [
        "duplicateDomain",
        (): boolean =>
          hasViolation(
            check({ domains: [panel(), panel()] }),
            "type",
            "domains[1].id",
          ),
      ],
      [
        "duplicateFurnishing",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing(), softFurnishing()] }),
            "type",
            "furnishings[1].id",
          ),
      ],
      [
        "blankFurnishing",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing({ id: " " })] }),
            "type",
            "furnishings[0].id",
          ),
      ],
      [
        "kind",
        (): boolean =>
          hasViolation(
            check({
              furnishings: [
                softFurnishing({
                  kind: "tapestry" as unknown as "curtain",
                }),
              ],
            }),
            "type",
            "furnishings[0].kind",
          ),
      ],
      [
        "mode",
        (): boolean =>
          hasViolation(
            check({
              furnishings: [
                softFurnishing({ mode: "baked" as unknown as "rest" }),
              ],
            }),
            "type",
            "furnishings[0].mode",
          ),
      ],
      [
        "state",
        (): boolean =>
          hasViolation(
            check({ furnishings: [softFurnishing({ state: "shut" })] }),
            "type",
            "furnishings[0].state",
          ),
      ],
      [
        "declaredState",
        (): boolean =>
          check({ furnishings: [softFurnishing({ state: "open" })] })
            .success === true,
      ],
    ]),
    {
      environment: true,
      space: true,
      support: true,
      duplicateSupport: true,
      domain: true,
      duplicateDomain: true,
      duplicateFurnishing: true,
      blankFurnishing: true,
      kind: true,
      mode: true,
      state: true,
      declaredState: true,
    },
  );

  TestValidator.equals(
    "a domain's own refusal is re-pathed onto the binding",
    hasViolation(
      check({ domains: [panel({ mass: [1] })] }),
      "type",
      "domains[0].mass",
    ),
    true,
  );

  const outside: IAutoMovieSoftBodyDomain = panel({
    rest: softPanel({
      columns: 3,
      rows: 3,
      origin: { x: 40, y: 0, z: 0 },
    }).rest,
  });
  TestValidator.equals(
    "geometry is checked only where the space has a volume",
    namedFacts([
      [
        "refused",
        (): boolean =>
          hasViolation(
            check({ domains: [outside] }),
            "type",
            "furnishings[0].domain",
          ),
      ],
      [
        "semantic",
        (): boolean =>
          check({ domains: [outside], semantic: true }).success === true,
      ],
      [
        "unmeasurable",
        (): boolean =>
          hasViolation(
            check({ domains: [panel({ rest: [0, 0, 0] })] }),
            "type",
            "domains[0].rest",
          ),
      ],
      [
        "notAlsoGuessed",
        (): boolean => {
          const validation: IAutoMovieValidation = check({
            domains: [panel({ rest: [0, 0, 0] })],
          });
          return (
            validation.success === false &&
            validation.violations.every(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.path.includes("furnishings[0].domain") === false,
            )
          );
        },
      ],
    ]),
    { refused: true, semantic: true, unmeasurable: true, notAlsoGuessed: true },
  );

  const beyond: IAutoMovieVector3 = { x: 40, y: 0, z: 0 };
  const swung: IAutoMovieSoftBodyDomain = panel({
    states: [{ id: "swung", anchors: [{ anchor: "hook", position: beyond }] }],
  });
  TestValidator.equals(
    "the panel is checked where it is held, not where it was drawn",
    namedFacts([
      [
        "anchorBeyondTheWall",
        (): boolean =>
          hasViolation(
            check({
              domains: [
                panel({
                  anchors: [{ id: "hook", particle: 0, position: beyond }],
                  states: [],
                }),
              ],
            }),
            "type",
            "furnishings[0].domain",
          ),
      ],
      [
        "heldStateBeyondTheWall",
        (): boolean =>
          hasViolation(
            check({
              furnishings: [softFurnishing({ state: "swung" })],
              domains: [swung],
            }),
            "type",
            "furnishings[0].domain",
          ),
      ],
      [
        "unheldStateIsNotApplied",
        (): boolean => check({ domains: [swung] }).success === true,
      ],
      [
        "undeclaredStateIsNotApplied",
        (): boolean => {
          const validation: IAutoMovieValidation = check({
            furnishings: [softFurnishing({ state: "shut" })],
            domains: [swung],
          });
          return (
            validation.success === false &&
            validation.violations.every(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.path.includes("furnishings[0].domain") === false,
            )
          );
        },
      ],
    ]),
    {
      anchorBeyondTheWall: true,
      heldStateBeyondTheWall: true,
      unheldStateIsNotApplied: true,
      undeclaredStateIsNotApplied: true,
    },
  );

  TestValidator.equals(
    "one panel is drawn by one furnishing",
    namedFacts([
      [
        "second",
        (): boolean =>
          hasViolation(
            check({
              furnishings: [
                softFurnishing(),
                softFurnishing({ id: "second-curtain" }),
              ],
            }),
            "type",
            "furnishings[0].domain",
          ),
      ],
      [
        "distinctDomainsPass",
        (): boolean =>
          check({
            furnishings: [
              softFurnishing(),
              softFurnishing({ id: "second-curtain", domain: "twin" }),
            ],
            domains: [panel(), panel({ id: "twin" })],
          }).success === true,
      ],
    ]),
    { second: true, distinctDomainsPass: true },
  );

  assertSoftFurnishingOwnershipAndLowering(panel);
}
