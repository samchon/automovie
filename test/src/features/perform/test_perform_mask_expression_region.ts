import {
  IAutoMovieActionSynthesizer,
  compilePerformance,
} from "@automovie/engine";
import {
  AutoMovieGestureKind,
  IAutoMovieActionCall,
  IAutoMovieExpression,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";

const action: (
  kind: AutoMovieGestureKind,
  region: IAutoMovieActionCall["region"],
  start: number,
) => IAutoMovieActionCall = (
  kind: AutoMovieGestureKind,
  region: IAutoMovieActionCall["region"],
  start: number,
): IAutoMovieActionCall => ({
  verb: "gesture",
  kind,
  actor: "a",
  start,
  duration: 1,
  region,
});

/** Every synthesized clip authors an expression, keyed by the gesture kind. */
const synth: (
  expressionOf: (kind: string) => IAutoMovieExpression,
) => (call: IAutoMovieActionCall) => IAutoMovieMotion =
  (
    expressionOf: (kind: string) => IAutoMovieExpression,
  ): ((call: IAutoMovieActionCall) => IAutoMovieMotion) =>
  (call: IAutoMovieActionCall): IAutoMovieMotion => {
    const kind: string = call.verb === "gesture" ? call.kind : "";
    return makeMotion(
      [
        keyframe(
          0,
          makePose([joint("spine", { flexion: 0 })]),
          "linear",
          expressionOf(kind),
        ),
        keyframe(
          1,
          makePose([joint("spine", { flexion: 10 })]),
          "linear",
          expressionOf(kind),
        ),
      ],
      1,
    );
  };

const expressions: (m: IAutoMovieMotion) => (string | null)[] = (
  m: IAutoMovieMotion,
): (string | null)[] =>
  m.keyframes.map(
    (k: IAutoMovieKeyframe): string | null => k.expression?.preset ?? null,
  );

/**
 * Observe expression-channel masking through compilePerformance, using injected clips that author a preset regardless of the action's region. Preset observations cover the mask/layer result rather than a rendered facial expression.
 *
 * Scenarios:
 *
 * 1. An upperBody clip's returned keyframe presets are all null.
 * 2. The same injected clip assigned to face keeps angry at every returned keyframe.
 * 3. A fullBody angry clip beside a face happy clip yields the singleton non-null preset set happy.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles single and overlapping region actions, then checks returned keyframe presets. Preserving non-face expression leakage or stripping the face channel contradicts these observations.
 * @evidence contracts/testing.md#independent-expectations Literal angry/happy/null expectations derive from ownership of the expression channel by face and deliberately region-agnostic local fixtures. The two every checks do not independently assert keyframe count; the layered happy set establishes nonempty face content there. Intensity, blendshape weights and sampled interpolation are not asserted.
 * @evidence contracts/testing.md#distinguishing-cases Retains non-face/face twins and concurrent fullBody/face ownership with different presets, without changing cases, clocks or intensity 1. Other region memberships, masked-report diagnostics and shot refusal belong to other tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns compiler calls and assertions; its local synth factory returns injected clips and registers nothing. No production host, native build or viewer is started.
 */
export function test_perform_mask_expression_region(): void {
  const angryEverywhere: (call: IAutoMovieActionCall) => IAutoMovieMotion =
    synth((): IAutoMovieExpression => makeExpression("angry", 1));

  // 1. a non-face region strips the expression
  const stripped: IAutoMovieMotion = compilePerformance(
    [action("wave", "upperBody", 0)],
    angryEverywhere as IAutoMovieActionSynthesizer,
  ).performances.a!;
  TestValidator.predicate(
    "a non-face region's expression is stripped at every keyframe",
    expressions(stripped).every(
      (preset: string | null): boolean => preset === null,
    ),
  );

  // 2. negative twin: the face region keeps it
  const kept: IAutoMovieMotion = compilePerformance(
    [action("nod", "face", 0)],
    angryEverywhere as IAutoMovieActionSynthesizer,
  ).performances.a!;
  TestValidator.predicate(
    "the face region keeps its expression at every keyframe",
    expressions(kept).every(
      (preset: string | null): boolean => preset === "angry",
    ),
  );

  // 3. layered: only the face region speaks for the face
  const byKind: (call: IAutoMovieActionCall) => IAutoMovieMotion = synth(
    (kind: string): IAutoMovieExpression =>
      kind === "nod" ? makeExpression("happy", 1) : makeExpression("angry", 1),
  );
  const layered: IAutoMovieMotion = compilePerformance(
    [action("stagger", "fullBody", 0), action("nod", "face", 0)],
    byKind as IAutoMovieActionSynthesizer,
  ).performances.a!;
  const presets: Set<string | null> = new Set<string | null>(
    expressions(layered).filter(
      (preset: string | null): boolean => preset !== null,
    ),
  );
  TestValidator.equals(
    "the layered composite carries only the face region's expression",
    [...presets],
    ["happy"],
  );
}
