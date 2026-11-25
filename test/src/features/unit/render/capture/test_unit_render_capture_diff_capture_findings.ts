import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import { diffAutoMovieCaptureFindings } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

type Audit = IAutoMovieInspectionDiagnostics.IAudit;

const finding = (): IAutoMovieInspectionDiagnostics.IFinding => ({
  check: "contact",
  key: "hand-prop",
  code: "contact-gap",
  paths: ["hero/hand"],
  category: "error",
  confidence: "confirmed",
  message: "gap",
  witness: {},
});

/** A finding sampled at 1 fps and coverage on the same or a slower grid. */
const audit = (props: {
  episode: boolean;
  checked: boolean;
  slow?: boolean;
}): Audit => ({
  episodes: props.episode
    ? [
        {
          scope: "s",
          first: {
            time: { filmSeconds: 1, outputFrame: 1 },
            finding: finding(),
          },
          worst: {
            time: { filmSeconds: 1, outputFrame: 1 },
            finding: finding(),
          },
          last: { filmSeconds: 2, outputFrame: 2 },
          samples: 2,
          sampledShotClock: true,
        },
      ]
    : [],
  coverage: props.checked
    ? [
        {
          scope: "s",
          first: { filmSeconds: 0, outputFrame: 0 },
          last: { filmSeconds: 4, outputFrame: props.slow === true ? 2 : 4 },
          samples: props.slow === true ? 3 : 5,
          sampledShotClock: true,
          coverage: {
            check: "contact",
            key: "hand-prop",
            required: true,
            status: "checked",
          },
        },
      ]
    : [],
  observedOutputFrames: props.checked
    ? props.slow === true
      ? 3
      : 5
    : props.episode
      ? 2
      : 0,
  hasBlockingFinding: false,
  unresolvedRequiredCoverage: false,
});

/**
 * `diffAutoMovieCaptureFindings` compares the findings of two rounds.
 *
 * Scenarios:
 *
 * 1. A missing round is omitted, naming which one is lacking.
 * 2. Two clean rounds are the same with no entries.
 * 3. An error only the current round has, where the earlier round checked that
 *    span, is `new` and the outcome is worse.
 * 4. The same error only the earlier round has, where the current round checked
 *    the span, is `fixed` and the outcome is better.
 * 5. An error whose span the other round never sampled is `unmatched` with the
 *    cause `not-sampled`, and the outcome stays the same.
 * 6. Coverage at 0.5 fps observes only seconds 0, 2 and 4. It cannot classify a
 *    finding from frames 1 and 2 at 1 fps because second 1 was not checked.
 */
export function test_unit_render_capture_diff_capture_findings(): void {
  TestValidator.equals(
    "omitted",
    diffAutoMovieCaptureFindings({
      earlier: undefined,
      current: audit({ episode: false, checked: false }),
    }),
    { state: "omitted", lacking: ["earlier"] },
  );
  TestValidator.equals(
    "clean",
    diffAutoMovieCaptureFindings({
      earlier: audit({ episode: false, checked: false }),
      current: audit({ episode: false, checked: false }),
    }),
    { state: "compared", outcome: "same", entries: [] },
  );

  const added = diffAutoMovieCaptureFindings({
    earlier: audit({ episode: false, checked: true }),
    current: audit({ episode: true, checked: false }),
  });
  TestValidator.equals(
    "new",
    added.state === "compared"
      ? [added.outcome, added.entries.map((entry): string => entry.state)]
      : null,
    ["worse", ["new"]],
  );
  const removed = diffAutoMovieCaptureFindings({
    earlier: audit({ episode: true, checked: false }),
    current: audit({ episode: false, checked: true }),
  });
  TestValidator.equals(
    "fixed",
    removed.state === "compared"
      ? [removed.outcome, removed.entries.map((entry): string => entry.state)]
      : null,
    ["better", ["fixed"]],
  );
  const unsampled = diffAutoMovieCaptureFindings({
    earlier: audit({ episode: false, checked: false }),
    current: audit({ episode: true, checked: false }),
  });
  TestValidator.equals(
    "unmatched",
    unsampled.state === "compared"
      ? [
          unsampled.outcome,
          unsampled.entries.map((entry): string =>
            entry.state === "unmatched" ? entry.cause : entry.state,
          ),
        ]
      : null,
    ["same", ["not-sampled"]],
  );

  const slower = diffAutoMovieCaptureFindings({
    earlier: audit({ episode: false, checked: true, slow: true }),
    current: audit({ episode: true, checked: false }),
  });
  TestValidator.equals(
    "overlapping elapsed times without common frame coverage",
    slower.state === "compared"
      ? [
          slower.outcome,
          slower.entries.map((entry): string =>
            entry.state === "unmatched" ? entry.cause : entry.state,
          ),
        ]
      : null,
    ["same", ["not-sampled"]],
  );
}
