import { TestValidator } from "@nestia/e2e";
import { nclose } from "../internal/nclose";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import { AutoMovieHumanInstance } from "../../../../packages/human/src/instance/AutoMovieHumanInstance";
import { AutoMovieHumanStateAdmission as Admission } from "../../../../packages/human/src/instance/AutoMovieHumanStateAdmission";
import { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";


/** A speaking Human instance consumes its admitted expression once and owns its mutable result.
 *
 * Scenarios:
 * 1. Malformed, out-of-range, duplicate, unilateral jaw and unsupported active facial fields reject; signed tongue boundaries and dormant units admit.
 * 2. Speech adds once to the authored jaw, equal evaluation is reused, and the field receives the evaluator's actual clamp.
 * 3. The core field moves skin and lining equally, preserves the original bind and teeth, and never changes another instance or accumulates drift.
 * 4. Failed admission and stale plans cannot change state or geometry; neutral restores the bind and a body without a mouth refuses speech.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production admission and instance plan, update, mouth and deformMouth APIs with a synthetic prepared mouth. It catches ignored speech, double-added opening, missing clamp propagation, a lining field omitted from the consumer, mutated shared bind, stale-plan writes and unsupported data that silently disappears.
 * @evidence contracts/testing.md#independent-expectations Public closed input intervals, unique units and bilateral jaw rules supply admission expectations. Authored 3 mm plus half of the open vowel's 12 mm request is 9 mm, while an evaluator that clamps at 30 mm must give its field 30 mm. Immutable bind and independent-instance ownership require the source and neutral sibling to remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Valid and malformed records, both signed tongue endpoints, unknown fields, named-unit duplication, jaw-only and soft-tissue changes, repeated reads, neutral restoration, a stale plan, rejected update, sibling instance and missing prepared mouth. Whole-person anatomy and renderer parity belong to their own checks.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test with a synthetic evaluator and mouth. No whole person, process, host or GPU is created.
 */
export function test_human_mouth_instance(): void {
  const problems: string[] = [];
  const check: (name: string, value: boolean) => void = (name: string, value: boolean): void => {
    if (!value) problems.push(name);
  };
  const rejects: (action: () => unknown) => boolean = (action: () => unknown): boolean => {
    try { action(); return false; } catch { return true; }
  };
  const invalid: unknown[] = [
    { units: [], mouth: { visemes: { aa: NaN } } },
    { units: [], mouth: { tongue: { dorsumBacking: -1 } } },
    { units: [], mouth: { lips: { lipPucker: 1.01 } } },
    { units: [], mouth: { lips: { lipCornerPuller: { left: 1 } } } },
    { units: [], mouth: { visemes: { unknown: 1 } } },
    { units: [{ unit: "jawDrop", side: "left", intensity: 1 }] },
    { units: [{ unit: "eyesClosed", side: "both", intensity: 1 }] },
    { units: [{ unit: "lipPucker", side: "both", intensity: 0.1 }], mouth: { lips: { lipPucker: 0.2 } } },
    { units: [{ unit: "upperLipRaiser", side: "both", intensity: 0.1 }, { unit: "upperLipRaiser", side: "left", intensity: 0.1 }] },
  ];
  check("All malformed, duplicate and unsupported expression cases reject", invalid.every((value: unknown): boolean => rejects((): unknown => Admission.expression(value))));
  check("Signed tongue boundary and zero dormant facial units remain admissible", Admission.expression({ units: [{ unit: "eyesClosed", side: "both", intensity: 0 }], mouth: { tongue: { tipElevation: -1, tipLateral: 1, dorsumBacking: 1 } } }).mouth?.tongue?.tipElevation === -1);
  
  const mouth: AutoMovieHumanMouth.IMouth = AutoMovieHumanMouth.create({ stomion: 0, width: 25, upper: 5, lower: 6, subnasale: 20, menton: -45, sex: 0, gonion: -70, contact: (): number => 0, front: (): number => 80 }).mouth;
  let evaluations: number = 0;
  const body: AutoMovieHumanInstance.IBody = {
    skeleton: null,
    mouth: { context: { mouth, hinge: [-70, 0, 0], span: 100 }, scale: 0.001, maximal: 40 },
    evaluate: (pose = {}): AutoMovieHumanSkeleton.IOutput => {
      evaluations++;
      const request: number = pose.head?.jaw?.opening ?? 0;
      const applied: number = Math.min(30, Math.max(0, request));
      return { bones: [], posed: [], clamped: applied === request ? [] : [{ path: "head.jaw.opening", requested: request, applied }] };
    },
  };
  const human: AutoMovieHumanInstance = new AutoMovieHumanInstance(body, { pose: { head: { jaw: { opening: 3 } } }, expression: { units: [], mouth: { visemes: { aa: 0.5 } } } });
  check("Speech and authored jaw compose once", nclose(human.mouth.opening, 9, 1e-12) && human.state.pose.head?.jaw?.opening === 3 && evaluations === 1);
  human.mouth;
  check("Equal effective state reuses the pose evaluation", evaluations === 1);
  human.update({ kind: "snapshot", pose: { head: { jaw: { opening: 20 } } }, expression: { units: [{ unit: "jawDrop", side: "both", intensity: 1 }] } });
  check("Geometry receives the evaluator's actual clamped jaw opening", nclose(human.mouth.opening, 30, 1e-12));
  human.update({ kind: "snapshot", expression: { units: [], mouth: { lips: { lipPucker: 1 } } } });
  const original: number[] = [0.08, 0.001, 0];
  const moved: NonNullable<ReturnType<AutoMovieHumanInstance["deformMouth"]>> = human.deformMouth("human.skin.fixture", original, null)!;
  const lining: NonNullable<ReturnType<AutoMovieHumanInstance["deformMouth"]>> = human.deformMouth("human.mouth.lining", original, null)!;
  check("Core expression moves the real bind geometry and lining equally", moved.positions[0]! > original[0]! && moved.positions.every((n: number, i: number): boolean => nclose(n, lining.positions[i]!, 1e-12)));
  check("Bind source and rigid teeth remain unchanged", original[0] === 0.08 && human.deformMouth("human.mouth.teeth.upper", original, null) === null);
  const second: AutoMovieHumanInstance = new AutoMovieHumanInstance(body);
  check("Another instance of the prepared shape remains neutral", second.deformMouth("human.skin.fixture", original, null) === null);
  const repeated: NonNullable<ReturnType<AutoMovieHumanInstance["deformMouth"]>> = human.deformMouth("human.skin.fixture", original, null)!;
  check("Repeated reads never accumulate a displacement", repeated.positions.every((n: number, i: number): boolean => nclose(n, moved.positions[i]!, 1e-12)));
  const before: string = JSON.stringify(human.state);
  const revision: number = human.revision;
  check("Rejected admission cannot commit or move state", rejects((): unknown => human.update({ kind: "snapshot", expression: invalid[0] })) && human.revision === revision && JSON.stringify(human.state) === before);
  const stale: AutoMovieHumanInstance.IPlan = human.plan({ kind: "snapshot", expression: { units: [], mouth: { lips: { lipsPart: 1 } } } });
  human.update({ kind: "snapshot" });
  check("Neutral restores the immutable bind", human.deformMouth("human.skin.fixture", original, null) === null);
  check("Stale plans cannot displace geometry", rejects((): unknown => human.deformMouth("human.skin.fixture", original, null, stale)));
  check("A body without a mouth refuses speech instead of ignoring it", rejects((): unknown => new AutoMovieHumanInstance({ skeleton: null, evaluate: body.evaluate }, { expression: { units: [], mouth: { visemes: { aa: 1 } } } })));
  human.dispose();
  second.dispose();
  
  TestValidator.predicate("Mouth instance: " + problems.join("; "), problems.length === 0);
}
