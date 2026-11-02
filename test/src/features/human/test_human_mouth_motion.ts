import { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";
import { AutoMovieHumanMouthExpression as Expression } from "../../../../packages/human/src/expression/AutoMovieHumanMouthExpression";
import { AutoMovieHumanMouthDeformation as Deformation } from "../../../../packages/human/src/expression/AutoMovieHumanMouthDeformation";
import { AutoMovieHumanStateAdmission as Admission } from "../../../../packages/human/src/instance/AutoMovieHumanStateAdmission";


/** Admitted unilateral lip actions move the requested side and saturate with bilateral speech.
 *
 * Scenarios:
 * 1. Each of the seven whole-mouth action units acts on its requested side, preserves the opposite handle and reflects under side exchange.
 * 2. A maximal unilateral pucker plus the bilateral U viseme saturates only that side and preserves the opposite viseme result.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real expression admission, resolution and deformation at side handles for every supported whole-mouth action unit. The old symmetric half-intensity resolver failed all eight cases before this test was adopted; the corrected cause batch passed the same fixtures.
 * @evidence contracts/testing.md#independent-expectations The public side contract requires the untouched opposite handle to remain fixed. Reflection supplies right-side expectation and full bilateral activation supplies the selected-side magnitude. The public closed intensity interval supplies per-side saturation.
 * @evidence contracts/testing.md#distinguishing-cases Seven unilateral channels, both sides, bilateral activation and mixed unilateral FACS plus bilateral viseme input; no fitted person coordinate or anatomical magnitude threshold.
 * @evidence contracts/testing.md#execution-ownership A synchronous synthetic-mouth CPU test with no person generation, renderer or host.
 */
export function test_human_mouth_motion(): void {
  const mouth: AutoMovieHumanMouth.IMouth = AutoMovieHumanMouth.create({ stomion: 0, width: 25, upper: 5, lower: 6, subnasale: 20, menton: -45, sex: 0, gonion: -70, contact: (): number => 0, front: (): number => 80 }).mouth;
  const context: Deformation.IContext = { mouth, hinge: [-70, 0, 0], span: 100 };
  const resolve: (value: unknown) => Deformation.Field = (value: unknown): Deformation.Field => Deformation.field(context, Expression.resolve(Admission.expression(value), 40), 0);
  const norm: (v: Deformation.Vec3) => number = (v: Deformation.Vec3): number => Math.hypot(...v);
  let failures: number = 0;
  for (const name of Expression.WHOLE.filter((unit: Expression.Whole): boolean => unit !== "cheekPuff")) {
    // Sample an actual side handle, not an interpolated point influenced by
    // the shared centre. The chin raiser acts at the corner on the upper lip.
    const leftPoint: Deformation.Vec3 = name === "chinRaiser" ? [80, 1, 25] : [80, 5, 12.5];
    const rightPoint: Deformation.Vec3 = [leftPoint[0], leftPoint[1], -leftPoint[2]];
    const leftField: Deformation.Field = resolve({ units: [{ unit: name, side: "left", intensity: 1 }] });
    const rightField: Deformation.Field = resolve({ units: [{ unit: name, side: "right", intensity: 1 }] });
    const bilateral: Deformation.Field = resolve({ units: [{ unit: name, side: "both", intensity: 1 }] });
    const left: Deformation.Vec3 = leftField(leftPoint, false);
    const opposite: Deformation.Vec3 = leftField(rightPoint, false);
    const right: Deformation.Vec3 = rightField(rightPoint, false);
    const both: Deformation.Vec3 = bilateral(leftPoint, false);
    const passed: boolean = norm(left) > 0 && norm(opposite) < 1e-10 &&
      Math.hypot(left[0] - right[0], left[1] - right[1], left[2] + right[2]) < 1e-10 &&
      Math.hypot(...left.map((value: number, index: number): number => value - both[index]!)) < 1e-10;
    if (!passed) failures++;
  }
  const full: Deformation.Field = resolve({ units: [], mouth: { lips: { lipPucker: 1 } } });
  const combined: Deformation.Field = resolve({ units: [{ unit: "lipPucker", side: "left", intensity: 1 }], mouth: { visemes: { U: 1 } } });
  const viseme: Deformation.Field = resolve({ units: [], mouth: { visemes: { U: 1 } } });
  // Account for the funneler contributed by /u/, isolating the pucker's final
  // per-side saturation while retaining the actual admitted input combination.
  const funneler: Deformation.Field = resolve({ units: [], mouth: { lips: { lipFunneler: 0.4 } } });
  const leftPoint: Deformation.Vec3 = [80, 1, 25];
  const rightPoint: Deformation.Vec3 = [80, 1, -25];
  const left: Deformation.Vec3 = combined(leftPoint, false);
  const right: Deformation.Vec3 = combined(rightPoint, false);
  const leftExpected: Deformation.Vec3 = full(leftPoint, false).map((value: number, index: number): number => value + funneler(leftPoint, false)[index]!) as Deformation.Vec3;
  const rightExpected: Deformation.Vec3 = viseme(rightPoint, false);
  const passed: boolean = Math.hypot(...left.map((value: number, index: number): number => value - leftExpected[index]!)) < 1e-10 && Math.hypot(...right.map((value: number, index: number): number => value - rightExpected[index]!)) < 1e-10;
  if (!passed) failures++;
  
  if (failures > 0) throw new Error("Mouth motion: " + failures + " failed cases");
  
}
