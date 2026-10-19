import { reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { recoveryPrismOracle as prism } from "../internal/recoveryPrismOracle";

/**
 * Saved square rings generate new metre geometry without any source mesh input.
 * The analytic side area is perimeter 12 mm times height 2 mm, or 24e-6 m².
 *
 * Scenarios:
 * 1. Two straight cubic square rings generate the uncapped prism side surface.
 * 2. Every boundary edge belongs to one of the two known square ends.
 * 3. A disjoint unsupported domain retains the valid surface and reports partial.
 * 4. Explicit prefix coverage remains partial even with successful retained geometry.
 * 5. Multiple malformed incidence, curve and named-domain records retain the independent valid surface.
 * 6. Missing quality inventories remain partial, and ambiguous domain IDs never borrow report stages.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public source-free reconstruction API and measures generated indexed triangles, finite physical positions, side area, directed edge incidence, exposed end perimeter, retained primitive ownership and input nonmutation. A missing wall, invented cap, dropped independent domain or false complete terminal fails.
 * @evidence contracts/testing.md#independent-expectations Authored linear Bernstein controls define two 3-mm squares separated by 2 mm; four rectangular walls give 24e-6 m² and the two open ends give 24e-3 m of boundary. Edge incidence follows an uncapped annulus independently of triangulation choice; this does not prove arbitrary surface embedding or appearance.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts complete declared continuation with a separate unsupported group, incomplete prefix and malformed local incidence or analytic metadata while preserving the same valid domain. Assertions allow adaptive subdivisions and render-vertex duplication, avoiding exact triangle counts and generated snapshots. Terminal refusal, cancellation and observer failure belong to test_recovery_public_lifecycle.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_source_free entry owns small saved-coefficient fixtures and CPU measurements only, imports supported public packages and an existing scalar comparison helper, and opens no source, filesystem, process, renderer or native artifact. Central validation owns execution and the strict under-500-ms scenario budget.
 */
export function test_recovery_source_free(): void {
  type Input = prism.Input;
  const completeInput: Input = prism.makeInput(false);
  const partialInput: Input = prism.makeInput(true);
  const prefixInput: Input = {
    ...prism.makeInput(false),
    coverage: {
      complete: false,
      plannedSections: 3,
      retainedSections: 2,
      sourceRangeMm: [0, 4],
      observedStationRangeMm: [0, 2],
      unobservedStationRangeMm: [2, 4],
      missingSourceRangeMm: [2, 4],
    },
  };
  const groupSource: Input = prism.makeInput(false);
  const malformedGroup: Input = {
    ...groupSource,
    loft: {
      ...groupSource.loft,
      intervals: groupSource.loft.intervals!.map(
        (
          interval: NonNullable<Input["loft"]["intervals"]>[number],
        ): NonNullable<Input["loft"]["intervals"]>[number] => ({
          ...interval,
          groups: [
            ...interval.groups,
            JSON.parse('{"supported":true,"reason":null}'),
          ],
        }),
      ),
    },
  };
  const malformedDomain: Input = {
    ...prism.makeInput(false),
    analyticDomains: [JSON.parse('{"id":"malformed-domain"}')],
  };
  const mixedBase: Input = prism.makeInput(false);
  const mixedSource: Input = {
    ...mixedBase,
    loft: {
      ...mixedBase.loft,
      sections: mixedBase.loft.sections.map(
        (
          section: Input["loft"]["sections"][number],
        ): Input["loft"]["sections"][number] => ({
          ...section,
          loops: [...section.loops, JSON.parse('{"winding":1}')],
        }),
      ),
    },
    reports: mixedBase.reports.map(
      (report: Input["reports"][number]): Input["reports"][number] => ({
        ...report,
        fits: [...report.fits, report.fits[0]!],
        open: JSON.parse("[{}]"),
      }),
    ),
  };
  const mixedDomains: Input = {
    ...mixedSource,
    analyticDomains: JSON.parse(
      '[{"id":"repeated"},{"id":"repeated"},null,{"id":17},{"id":"ports-invalid","ports":[null,{}, {"curveName":8}],"closedGroups":[null]}]',
    ),
    loft: {
      ...mixedSource.loft,
      intervals: mixedSource.loft.intervals!.map(
        (
          interval: NonNullable<Input["loft"]["intervals"]>[number],
        ): NonNullable<Input["loft"]["intervals"]>[number] => ({
          ...interval,
          groups: [
            ...interval.groups,
            ...JSON.parse(
              '[{"supported":true,"reason":null},{"before":[{}],"after":false,"supported":true,"reason":null}]',
            ),
          ],
        }),
      ),
    },
  };
  const missingCurveSource: Input = prism.makeInput(false);
  const missingCurves: Input = {
    ...missingCurveSource,
    loft: {
      ...missingCurveSource.loft,
      sections: missingCurveSource.loft.sections.map(
        (
          section: Input["loft"]["sections"][number],
        ): Input["loft"]["sections"][number] => ({
          ...section,
          loops: [...section.loops, JSON.parse('{"winding":1}')],
        }),
      ),
    },
    reports: missingCurveSource.reports.map(
      (report: Input["reports"][number]): Input["reports"][number] => ({
        ...report,
        fits: [...report.fits, report.fits[0]!],
      }),
    ),
  };
  const unnamedOpen: Input = {
    ...prism.makeInput(false),
    reports: prism
      .makeInput(false)
      .reports.map(
        (report: Input["reports"][number]): Input["reports"][number] => ({
          ...report,
          open: JSON.parse('[null,{}, {"curve":{"name":7}}]'),
        }),
      ),
  };
  const unknownInventories: Input = Object.assign(prism.makeInput(false), {
    topologyGaps: null,
    unconsumedEvents: {},
    tensorFamilies: {},
    analyticDomains: {},
    reports: prism
      .makeInput(false)
      .reports.map(
        (report: Input["reports"][number]): Input["reports"][number] =>
          Object.assign({}, report, { open: null, isolatedContactsMm: null }),
      ),
  });
  const missingGroupSource: Input = prism.makeInput(false);
  const extraSection: Input["loft"]["sections"][number] = {
    coordinateMm: 4,
    loops: [{ curve: prism.ring(4, 10, "unconsumed.4"), winding: 1 }],
  };
  const missingGroupInventory: Input = {
    ...missingGroupSource,
    loft: {
      ...missingGroupSource.loft,
      sections: [...missingGroupSource.loft.sections, extraSection],
      intervals: [
        ...missingGroupSource.loft.intervals!,
        JSON.parse('{"beforeMm":2,"afterMm":4,"groups":null}'),
      ],
    },
    reports: [
      ...missingGroupSource.reports,
      { ...missingGroupSource.reports[0]!, coordinateMm: 4 },
    ],
  };
  for (const input of [
    completeInput,
    partialInput,
    prefixInput,
    malformedGroup,
    malformedDomain,
    mixedDomains,
    missingCurves,
    unnamedOpen,
    unknownInventories,
    missingGroupInventory,
  ]) {
    const original: string = JSON.stringify(input);
    const result: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
      reconstructAutoMovieRecoveryModel(input);
    TestValidator.equals(
      "declared coverage determines terminal",
      result.status,
      input === completeInput ? "complete" : "partial",
    );
    prism.measure(result);
    if (input === partialInput && "value" in result)
      TestValidator.predicate(
        "unsupported independent domain remains explicit",
        result.value.unresolved.some(
          (record: (typeof result.value.unresolved)[number]): boolean =>
            nclose(record.beforeMm, 0, 1e-12) &&
            nclose(record.afterMm, 2, 1e-12) &&
            record.reason === "General domain intentionally unsupported",
        ),
      );
    if (input === malformedGroup && "value" in result) {
      const member:
        | (typeof result.value.membership.members)[number]
        | undefined = result.value.membership.members.find(
        (record: (typeof result.value.membership.members)[number]): boolean =>
          record.id === "closed-group:0:1",
      );
      TestValidator.predicate(
        "malformed group keeps its declared identity without inventing curve names",
        member !== undefined &&
          member.curves.length === 0 &&
          member.diagnostics.length > 0 &&
          member.attempted === null,
      );
    }
    if (input === malformedDomain && "value" in result) {
      const member:
        | (typeof result.value.membership.members)[number]
        | undefined = result.value.membership.members.find(
        (record: (typeof result.value.membership.members)[number]): boolean =>
          record.kind === "analytic-domain",
      );
      TestValidator.predicate(
        "unobserved analytic generation remains unknown after local refusal",
        member !== undefined &&
          member.admitted === false &&
          member.attempted === null &&
          member.curves.length === 0 &&
          member.emitted.length === 0,
      );
    }
    if (input === mixedDomains && "value" in result) {
      const domains: typeof result.value.membership.members =
        result.value.membership.members.filter(
          (member: (typeof result.value.membership.members)[number]): boolean =>
            member.kind === "analytic-domain",
        );
      TestValidator.equals(
        "each malformed planned domain remains represented",
        domains.length,
        5,
      );
      TestValidator.predicate(
        "duplicate, missing and non-string identities have no inferred stages",
        domains
          .slice(0, 4)
          .every(
            (member: (typeof domains)[number]): boolean =>
              member.admitted === null &&
              member.attempted === null &&
              member.emitted.length === 0 &&
              member.delegatedTo === null &&
              member.diagnostics.length > 0,
          ),
      );
      TestValidator.predicate(
        "invalid ports cannot invent a saved curve name",
        domains[4]!.curves.length === 0 && domains[4]!.admitted === false,
      );
      TestValidator.predicate(
        "unbound actual reports remain diagnosed and retained",
        result.value.membership.diagnostics.length >= 4 &&
          result.value.analyticReports.length === 5,
      );
      TestValidator.predicate(
        "independent valid group still has exact ownership",
        result.value.membership.members.some(
          (member: (typeof domains)[number]): boolean =>
            member.id === "closed-group:0:0" &&
            member.admitted === true &&
            member.emitted.length > 0,
        ),
      );
    }
    if (input === missingCurves && "value" in result)
      TestValidator.predicate(
        "unassigned invalid coefficient identity stays unknown",
        result.value.membership.members.some(
          (member: (typeof result.value.membership.members)[number]): boolean =>
            member.kind === "unassigned-boundary" &&
            member.curves.length === 0 &&
            member.attempted === null &&
            member.diagnostics.length > 0,
        ),
      );
    if (input === unnamedOpen && "value" in result)
      TestValidator.predicate(
        "unconsumed malformed open metadata has no invented name",
        result.value.membership.members
          .filter(
            (
              member: (typeof result.value.membership.members)[number],
            ): boolean => member.kind === "open-course",
          )
          .every(
            (
              member: (typeof result.value.membership.members)[number],
            ): boolean =>
              member.curves.length === 0 &&
              member.admitted === false &&
              member.diagnostics.length > 0,
          ),
      );
    if (input === missingGroupInventory && "value" in result)
      TestValidator.predicate(
        "unknown group inventory cannot consume the independent slab",
        result.value.membership.diagnostics.some((message: string): boolean =>
          message.includes("group inventory is unavailable"),
        ) &&
          result.value.membership.members.some(
            (
              member: (typeof result.value.membership.members)[number],
            ): boolean =>
              member.kind === "unassigned-boundary" &&
              member.attempted === null,
          ),
      );
    if (input === unknownInventories)
      TestValidator.predicate(
        "missing omission inventories are explicit unknown coverage",
        result.diagnostics.some((message: string): boolean =>
          message.includes("coverage remains unknown"),
        ),
      );
    TestValidator.equals(
      "saved coefficient authority is unchanged",
      JSON.stringify(input),
      original,
    );
  }
}
