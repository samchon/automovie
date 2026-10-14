import { TestValidator } from "@nestia/e2e";
import { assertProductionRenderDialogueRuntimeIdentity } from "../../../../packages/production/src/production/assertProductionRenderDialogueRuntimeIdentity";
import { namedFacts, throwsError } from "../internal/predicates";

function digest(digit: string): string {
  return `sha256:${digit.repeat(64)}`;
}

/**
 * Supplied planned and observed dialogue identities are compared at the named boundary.
 *
 * Scenarios:
 *
 * 1. Matching canonical identities and an explicitly silent null/null pair
 *    preserve the observed typed value.
 * 2. Different, null, missing, non-string, and malformed observations each
 *    fail closed without printing an untrusted value.
 * 3. A missing or malformed planned identity is stale rather than silently
 *    interpreted as a dialogue-free plan.
 * 4. Empty boundary context is refused so each comparison failure identifies
 *    the supplied caller context.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained comparison directly and observes returned values and contextual refusals; matching voiced and explicit silent observations remain accepted while invalid or differing values refuse.
 * @evidence contracts/testing.md#independent-expectations Literal SHA-256 syntax, distinct repeated hex digits and explicit null/missing values define expected equality and silence independently; assertions also require the named context and omission of malformed observed secrets. No byte-origin or live-pipeline enforcement is proven.
 * @evidence contracts/testing.md#distinguishing-cases Matching digest/null pairs neighbor different digest, null mismatch, missing, nonstring and malformed observations; missing/malformed plans, hidden dialogue and whitespace-only context pin remaining refusal branches. Native capture and final publication belong to their owners.
 * @evidence contracts/testing.md#execution-ownership The named portable unit imports its canonical source directly and owns every enumerated case; it starts no capture host, replaces no global and installs no application consumer.
 */
export function test_production_render_dialogue_runtime_identity(): void {
  const expected: string = digest("a");
  TestValidator.equals(
    "matching voiced and silent captures preserve their exact planned identity",
    [
      assertProductionRenderDialogueRuntimeIdentity({
        boundary: "render preflight",
        expected,
        observed: expected,
      }),
      assertProductionRenderDialogueRuntimeIdentity({
        boundary: "final preview",
        expected: null,
        observed: null,
      }),
    ],
    [expected, null],
  );

  const secret: string = "credential-bearing-observed-value";
  const captureRefusals: { name: string; refused: boolean; secretAbsent: boolean; exactCanonicalMismatch: boolean }[] = [
    {
      name: "different",
      observed: digest("b"),
      message: "differs from the render plan",
    },
    { name: "null", observed: null, message: "differs from the render plan" },
    { name: "missing", observed: undefined, message: "omitted" },
    { name: "non-string", observed: 7, message: "invalid" },
    { name: "malformed", observed: secret, message: "invalid" },
  ].map(({ name, observed, message }: { name: string; observed: unknown; message: string }): { name: string; refused: boolean; secretAbsent: boolean; exactCanonicalMismatch: boolean } => {
    let caught: unknown;
    try {
      assertProductionRenderDialogueRuntimeIdentity({
        boundary: "chunk feature:0 frame 12 layer 1 beauty",
        expected,
        observed,
      });
    } catch (error) {
      caught = error;
    }
    return {
      name,
      refused:
        caught instanceof Error &&
        caught.message.includes(message) &&
        caught.message.includes("chunk feature:0 frame 12 layer 1 beauty"),
      secretAbsent:
        caught instanceof Error && caught.message.includes(secret) === false,
      exactCanonicalMismatch:
        name !== "different" ||
        (caught instanceof Error &&
          caught.message.includes(`expected ${expected}`) &&
          caught.message.includes(`observed ${digest("b")}`)),
    };
  });
  TestValidator.equals(
    "every untrusted observed identity fails closed at its named capture boundary",
    captureRefusals,
    ["different", "null", "missing", "non-string", "malformed"].map((name: string): { name: string; refused: boolean; secretAbsent: boolean; exactCanonicalMismatch: boolean } => ({
      name,
      refused: true,
      secretAbsent: true,
      exactCanonicalMismatch: true,
    })),
  );

  TestValidator.equals(
    "stored legacy or malformed planned identities require replanning",
    namedFacts([
      [
        "missing",
        (): boolean =>
          throwsError(
            (): string | null =>
              assertProductionRenderDialogueRuntimeIdentity({
                boundary: "stored render plan",
                expected: undefined,
                observed: null,
              }),
            ["missing or invalid", "Replan"],
          ),
      ],
      [
        "malformed",
        (): boolean =>
          throwsError(
            (): string | null =>
              assertProductionRenderDialogueRuntimeIdentity({
                boundary: "stored render plan",
                expected: "sha256:short",
                observed: null,
              }),
            ["missing or invalid", "Replan"],
          ),
      ],
      [
        "hiddenDialogue",
        (): boolean =>
          throwsError(
            (): string | null =>
              assertProductionRenderDialogueRuntimeIdentity({
                boundary: "silent guide pass",
                expected: null,
                observed: expected,
              }),
            "differs from the render plan",
          ),
      ],
      [
        "emptyBoundary",
        (): boolean =>
          throwsError(
            (): string | null =>
              assertProductionRenderDialogueRuntimeIdentity({
                boundary: " ",
                expected,
                observed: expected,
              }),
            "comparison boundary is invalid",
          ),
      ],
    ]),
    {
      missing: true,
      malformed: true,
      hiddenDialogue: true,
      emptyBoundary: true,
    },
  );
}
