import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import { AutoMovieMotionHumanVerdictInspection } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A verdict report maps to the shared inspection findings and coverage a
 * capture, a delivery and a round diff read.
 *
 * Scenarios:
 *
 * 1. A `slip` finding maps to its identity, performer path, `slip` and `seconds`
 *    measurements with their units and limit, rank equal to the reading and no
 *    witness time.
 * 2. A `partner` finding names both paths and finds checked coverage under its
 *    pair's key.
 * 3. Two `skate` readings of one performer in two spans give one finding at the
 *    worse reading, in metres per second.
 * 4. Three `timing` faults of one performer give one finding listing all three,
 *    with a `faults` measurement of 3, no limit and rank 3.
 * 5. A clean report gives checked coverage of sixteen bounds a performer and
 *    `partner` a pair, and no finding.
 * 6. A performer who swims gives excluded coverage for the nine floor and support
 *    bounds and checked coverage for the other seven.
 * 7. A finding naming a performer not given is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names single and paired measurements, worst-span aggregation, timing faults, clean and swimmer coverage, and an unknown performer refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Maps prepared audit verdict records through the inspection mapper and checks exact identities, paths, numeric measurements, units and coverage.
 * @evidence contracts/development/testing.md#independent-expectations From the authored slip derive 0.02 m at 1.25 s against 0.005 m. The larger skate of 0.5 m/s wins at 3 s and three timing faults give rank 3. Two performers contribute 32 checked bound rows and their pair adds one. A swimmer retains seven checks.
 */
export function test_motions_audit_human_verdict_inspection(): void {
  const performers: IAutoMovieMotionHumanVerdicts.IPerformer[] = [
    { subject: "a", path: "film.performers[0]", airborne: false },
    { subject: "b", path: "film.performers[1]", airborne: false },
  ];
  const finding = (
    props: Partial<IAutoMovieMotionHumanVerdicts.IFinding> &
      Pick<IAutoMovieMotionHumanVerdicts.IFinding, "check" | "subject">,
  ): IAutoMovieMotionHumanVerdicts.IFinding => ({
    act: "stand",
    instance: 1,
    value: 0.02,
    limit: 0.005,
    seconds: 1.25,
    where: "lFoot",
    ...props,
  });
  const report = (
    ...findings: IAutoMovieMotionHumanVerdicts.IFinding[]
  ): IAutoMovieMotionHumanVerdicts.IReport => ({
    clean: findings.length === 0,
    findings,
  });
  const measure = (
    found: IAutoMovieInspectionDiagnostics.IFinding,
    name: string,
  ): IAutoMovieInspectionDiagnostics.IMeasurement | undefined =>
    found.witness.measurements?.find(
      (m: IAutoMovieInspectionDiagnostics.IMeasurement): boolean =>
        m.name === name,
    );
  const rowsOf = (
    packet: Pick<IAutoMovieInspectionDiagnostics, "coverage">,
    status: string,
  ): string[] =>
    packet.coverage
      .filter(
        (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
          row.status === status,
      )
      .map(
        (row: IAutoMovieInspectionDiagnostics.ICoverage): string =>
          `${row.check}/${row.key}`,
      );

  // 1. A slip finding.
  const slip: ReturnType<typeof AutoMovieMotionHumanVerdictInspection.fromReport> =
    AutoMovieMotionHumanVerdictInspection.fromReport(
      report(finding({ check: "slip", subject: "a" })),
      performers,
    );
  TestValidator.equals("one slip finding", slip.findings.length, 1);
  const one: IAutoMovieInspectionDiagnostics.IFinding = slip.findings[0]!;
  TestValidator.equals(
    "slip identity",
    [one.check, one.key, one.code, one.paths],
    ["human-slip", "a", "slip-exceeded", ["film.performers[0]"]],
  );
  TestValidator.equals(
    "a confirmed error",
    [one.category, one.confidence],
    ["error", "confirmed"],
  );
  TestValidator.equals("slip measurement", measure(one, "slip"), {
    name: "slip",
    value: 0.02,
    limit: 0.005,
    unit: "m",
  });
  TestValidator.equals("seconds measurement", measure(one, "seconds"), {
    name: "seconds",
    value: 1.25,
    unit: "s",
  });
  TestValidator.predicate(
    "rank is the reading and no witness time is set",
    one.witness.rank === 0.02 && one.witness.time === undefined,
  );

  // 2. A partner finding.
  const partner: ReturnType<typeof AutoMovieMotionHumanVerdictInspection.fromReport> =
    AutoMovieMotionHumanVerdictInspection.fromReport(
      report(finding({ check: "partner", subject: "a+b", where: "chest" })),
      performers,
    );
  TestValidator.equals("partner names both paths", partner.findings[0]!.paths, [
    "film.performers[0]",
    "film.performers[1]",
  ]);
  TestValidator.predicate(
    "partner finds checked coverage under its pair key",
    partner.coverage.some(
      (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        row.check === partner.findings[0]!.check &&
        row.key === partner.findings[0]!.key &&
        row.status === "checked",
    ),
  );

  // 3. Two skate readings in two spans.
  const skate: ReturnType<typeof AutoMovieMotionHumanVerdictInspection.fromReport> =
    AutoMovieMotionHumanVerdictInspection.fromReport(
      report(
        finding({ check: "skate", subject: "a", value: 0.2, limit: 0.05 }),
        finding({
          check: "skate",
          subject: "a",
          value: 0.5,
          limit: 0.05,
          seconds: 3,
          act: "walk",
        }),
      ),
      performers,
    );
  TestValidator.equals("two skate readings give one", skate.findings.length, 1);
  TestValidator.equals(
    "the worse skate reading",
    [
      measure(skate.findings[0]!, "skate")?.value,
      measure(skate.findings[0]!, "skate")?.unit,
      measure(skate.findings[0]!, "seconds")?.value,
    ],
    [0.5, "m/s", 3],
  );

  // 4. Three timing faults.
  const timing: ReturnType<typeof AutoMovieMotionHumanVerdictInspection.fromReport> =
    AutoMovieMotionHumanVerdictInspection.fromReport(
      report(
        ...["early", "overlap", "open"].map(
          (where: string): IAutoMovieMotionHumanVerdicts.IFinding =>
            finding({
              check: "timing",
              subject: "a",
              act: "",
              instance: 0,
              value: 0,
              limit: 0,
              seconds: 0,
              where,
            }),
        ),
      ),
      performers,
    );
  TestValidator.equals("three faults give one", timing.findings.length, 1);
  const faulty: IAutoMovieInspectionDiagnostics.IFinding = timing.findings[0]!;
  TestValidator.predicate(
    "the message lists every fault",
    ["early", "overlap", "open"].every((fault: string): boolean =>
      faulty.message.includes(fault),
    ),
  );
  TestValidator.equals(
    "faults measurement without a limit and rank 3",
    [faulty.witness.measurements, faulty.witness.rank],
    [[{ name: "faults", value: 3, unit: "faults" }], 3],
  );

  // 5. A clean report.
  const clean: ReturnType<typeof AutoMovieMotionHumanVerdictInspection.fromReport> =
    AutoMovieMotionHumanVerdictInspection.fromReport(report(), performers);
  TestValidator.equals("a clean report has no finding", clean.findings, []);
  TestValidator.equals(
    "checked rows: sixteen a performer and one pair",
    [rowsOf(clean, "checked").length, rowsOf(clean, "excluded").length],
    [33, 0],
  );

  // 6. A performer the floor does not carry.
  const swim: ReturnType<typeof AutoMovieMotionHumanVerdictInspection.fromReport> =
    AutoMovieMotionHumanVerdictInspection.fromReport(report(), [{ ...performers[0]!, airborne: true }]);
  TestValidator.equals(
    "nine bounds are excluded for a swimmer",
    rowsOf(swim, "excluded").map((row: string): string =>
      row.replace("human-", "").replace("/a", ""),
    ),
    [
      "floor",
      "slip",
      "lift",
      "balance",
      "skate",
      "loose",
      "afloat",
      "statics",
      "unloaded",
    ],
  );
  TestValidator.equals(
    "seven bounds are still read",
    rowsOf(swim, "checked").length,
    7,
  );
  // 7. A finding naming a performer not given.
  let refused: boolean = false;
  try {
    AutoMovieMotionHumanVerdictInspection.fromReport(
      report(finding({ check: "slip", subject: "c" })),
      performers,
    );
  } catch (error: unknown) {
    refused = error instanceof Error;
  }
  TestValidator.predicate("a finding on nobody given is refused", refused);
}
