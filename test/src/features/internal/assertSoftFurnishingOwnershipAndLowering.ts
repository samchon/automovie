import { lowerSoftFurnishing, validateAutoMovieSoftFurnishingDomainOwnership, validateSoftFurnishings } from "@automovie/engine";
import { IAutoMovieSoftBodyDomain, IAutoMovieSoftFurnishing, IAutoMovieValidation, IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "./predicates";
import { roomEnvironment, softFurnishing } from "./softFixtures";

/** Run the original global ownership, lowering capability and time-budget cases after the owning test's local binding checks. The original panel function object and shared fixture exports preserve every input, evaluation order and assertion. */
export function assertSoftFurnishingOwnershipAndLowering(
  panel: (overrides?: Partial<IAutoMovieSoftBodyDomain>) => IAutoMovieSoftBodyDomain,
): void {
  const duplicateDomains: IAutoMovieSoftFurnishing[] = [
    softFurnishing({
      id: "zeta",
      domain: "z-domain",
    }),
    softFurnishing({
      id: "alpha",
      environment: "other",
      domain: "z-domain",
    }),
    softFurnishing({
      id: "omega",
      domain: "a-domain",
    }),
    softFurnishing({
      id: "beta",
      environment: "other",
      domain: "a-domain",
    }),
  ];
  const ownershipFacts: (furnishings: IAutoMovieSoftFurnishing[]) => [unknown, string][] = (furnishings: IAutoMovieSoftFurnishing[]): [unknown, string][] => {
    const validation: IAutoMovieValidation =
      validateAutoMovieSoftFurnishingDomainOwnership(furnishings);
    return validation.success === true
      ? []
      : validation.violations.map((violation: IAutoMovieConstraintViolation): [unknown, string] => [
          violation.value,
          violation.expected,
        ]);
  };
  const expectedOwnershipFacts: [string, string][] = [
    [
      "a-domain",
      'soft body domain "a-domain" is already drawn by furnishing "beta"',
    ],
    [
      "z-domain",
      'soft body domain "z-domain" is already drawn by furnishing "alpha"',
    ],
  ];
  TestValidator.equals(
    "domain ownership is global and deterministic",
    namedFacts([
      [
        "sameEnvironment",
        (): boolean =>
          validateAutoMovieSoftFurnishingDomainOwnership([
            softFurnishing(),
            softFurnishing({ id: "second-curtain" }),
          ]).success === false,
      ],
      [
        "differentEnvironment",
        (): boolean =>
          validateAutoMovieSoftFurnishingDomainOwnership([
            softFurnishing(),
            softFurnishing({ id: "second-curtain", environment: "other" }),
          ]).success === false,
      ],
      [
        "differentDomains",
        (): boolean =>
          validateAutoMovieSoftFurnishingDomainOwnership([
            softFurnishing(),
            softFurnishing({
              id: "second-curtain",
              environment: "other",
              domain: "other-panel",
            }),
          ]).success === true,
      ],
      [
        "stableOrder",
        (): boolean =>
          JSON.stringify(ownershipFacts(duplicateDomains)) ===
            JSON.stringify(expectedOwnershipFacts) &&
          JSON.stringify(ownershipFacts([...duplicateDomains].reverse())) ===
            JSON.stringify(expectedOwnershipFacts),
      ],
      [
        "prevalidated",
        (): boolean =>
          validateSoftFurnishings({
            environment: roomEnvironment(),
            furnishings: [
              softFurnishing(),
              softFurnishing({ id: "second-curtain" }),
            ],
            domains: [panel()],
            domainOwnership: "prevalidated",
          }).success === true,
      ],
    ]),
    {
      sameEnvironment: true,
      differentEnvironment: true,
      differentDomains: true,
      stableOrder: true,
      prevalidated: true,
    },
  );

  const frame: (furnishing: IAutoMovieSoftFurnishing, domain: IAutoMovieSoftBodyDomain) => ReturnType<typeof lowerSoftFurnishing> = (
    furnishing: IAutoMovieSoftFurnishing,
    domain: IAutoMovieSoftBodyDomain,
  ): ReturnType<typeof lowerSoftFurnishing> => lowerSoftFurnishing({ furnishing, domain, time: 0.5 });
  const notRun: ReturnType<typeof lowerSoftFurnishing> = frame(softFurnishing(), panel({ mass: [1] }));
  const unnamed: ReturnType<typeof lowerSoftFurnishing> = frame(softFurnishing({ state: "shut" }), panel());
  const unsupported: ReturnType<typeof lowerSoftFurnishing> = frame(softFurnishing(), panel({ selfCollision: true }));
  const resting: ReturnType<typeof lowerSoftFurnishing> = frame(softFurnishing({ mode: "rest" }), panel());
  const solved: ReturnType<typeof lowerSoftFurnishing> = frame(softFurnishing({ state: "open" }), panel());
  TestValidator.equals(
    "the capability matrix reports what was computed and what was not",
    namedFacts([
      [
        "notRun",
        (): boolean =>
          notRun.analysis.status === "not-run" &&
          notRun.state === null &&
          notRun.surface === null &&
          notRun.analysis.reason !== null,
      ],
      [
        "unnamedState",
        (): boolean => unnamed.analysis.status === "not-run" && unnamed.state === null,
      ],
      [
        "unsupported",
        (): boolean =>
          unsupported.analysis.status === "unsupported" &&
          unsupported.analysis.unsupported.includes("self-collision") &&
          unsupported.state?.step === 0 &&
          unsupported.surface !== null,
      ],
      [
        "rest",
        (): boolean =>
          resting.analysis.status === "rest" &&
          resting.state?.step === 0 &&
          resting.analysis.reason === null,
      ],
      [
        "solved",
        (): boolean =>
          solved.analysis.status === "solved" &&
          solved.state?.step === 32 &&
          solved.state?.state === "open" &&
          solved.analysis.unsupported.length === 0,
      ],
      [
        "unknownMode",
        (): boolean => {
          const odd: ReturnType<typeof lowerSoftFurnishing> = frame(
            softFurnishing({ mode: "baked" as unknown as "rest" }),
            panel(),
          );
          return (
            odd.analysis.status === "not-run" &&
            odd.state === null &&
            odd.surface === null
          );
        },
      ],
      [
        "mismatchedDomain",
        (): boolean => {
          const odd: ReturnType<typeof lowerSoftFurnishing> = frame(softFurnishing({ domain: "other" }), panel());
          return (
            odd.analysis.status === "not-run" &&
            odd.state === null &&
            odd.surface === null &&
            (odd.analysis.reason ?? "").includes('soft body "other"')
          );
        },
      ],
      ["kind", (): boolean => solved.analysis.kind === "soft-body"],
      ["furnishing", (): boolean => solved.furnishing === "window-curtain"],
      ["surfaceStep", (): boolean => solved.surface?.step === 32],
    ]),
    {
      notRun: true,
      unnamedState: true,
      unsupported: true,
      rest: true,
      solved: true,
      unknownMode: true,
      mismatchedDomain: true,
      kind: true,
      furnishing: true,
      surfaceStep: true,
    },
  );

  // The default panel steps at 1/64 s and declares 1000 of them, so its clock
  // reaches 15.625 s and no further.
  const late: ReturnType<typeof lowerSoftFurnishing> = lowerSoftFurnishing({
    furnishing: softFurnishing(),
    domain: panel(),
    time: 16,
  });
  TestValidator.equals(
    "a second the declared budget cannot reach is reported, not thrown",
    namedFacts([
      [
        "past",
        (): boolean =>
          late.analysis.status === "not-run" &&
          late.state === null &&
          late.surface === null &&
          (late.analysis.reason ?? "").includes("step 1024"),
      ],
      [
        "lastReachable",
        (): boolean =>
          lowerSoftFurnishing({
            furnishing: softFurnishing(),
            domain: panel(),
            time: 15.625,
          }).state?.step === 1_000,
      ],
      [
        "notReal",
        (): boolean => {
          const odd: ReturnType<typeof lowerSoftFurnishing> = lowerSoftFurnishing({
            furnishing: softFurnishing(),
            domain: panel(),
            time: Number.NaN,
          });
          return odd.analysis.status === "not-run" && odd.state === null;
        },
      ],
      [
        "beforeTheClock",
        (): boolean =>
          lowerSoftFurnishing({
            furnishing: softFurnishing(),
            domain: panel(),
            time: -4,
          }).state?.step === 0,
      ],
    ]),
    {
      past: true,
      lastReachable: true,
      notReal: true,
      beforeTheClock: true,
    },
  );
}
