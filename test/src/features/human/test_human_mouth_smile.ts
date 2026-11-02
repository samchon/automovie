import { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";
import { AutoMovieHumanMouthExpression as Expression } from "../../../../packages/human/src/expression/AutoMovieHumanMouthExpression";
import { AutoMovieHumanMouthDeformation as Deformation } from "../../../../packages/human/src/expression/AutoMovieHumanMouthDeformation";
import { AutoMovieHumanStateAdmission as Admission } from "../../../../packages/human/src/instance/AutoMovieHumanStateAdmission";


/** Measured smile directions and bilateral central symmetry survive field construction.
 *
 * Scenarios:
 * 1. Upper-lip centre uses the primary study's reported posterior and coronal directions.
 * 2. Bilateral lower-lip centre has no lateral drift.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the actual full-intensity lip-corner-puller field at both central lip handles. The former vertical upper vector and unreflected lower centre failed these exact fixtures before the corrected batch passed them.
 * @evidence contracts/testing.md#independent-expectations The original abstract of Three Dimensional Analysis of Normal Smiles in Korean (2003, KCI ART000866559) reports 7.3 mm, 88.1 degrees coronal and 33.3 posterior at the upper centre, and 5.9 mm, -87.5 and 66.9 at the lower centre. Independent spherical projection and bilateral cancellation give the expected vectors.
 * @evidence contracts/testing.md#distinguishing-cases Upper and lower central handles, reported posterior displacement and bilateral zero lateral displacement; the 1e-10 allowance covers only double-precision arithmetic.
 * @evidence contracts/testing.md#execution-ownership A synchronous synthetic-mouth CPU test. It does not qualify unmeasured action-unit magnitudes or rendered facial appearance.
 */
export function test_human_mouth_smile(): void {
  const mouth: AutoMovieHumanMouth.IMouth = AutoMovieHumanMouth.create({ stomion: 0, width: 25, upper: 5, lower: 6, subnasale: 20, menton: -45, sex: 0, gonion: -70, contact: (): number => 0, front: (): number => 80 }).mouth;
  const context: Deformation.IContext = { mouth, hinge: [-70, 0, 0], span: 100 };
  const resolved: Expression.IResolved = Expression.resolve(Admission.expression({ units: [{ unit: "lipCornerPuller", side: "both", intensity: 1 }] }), 40);
  const field: Deformation.Field = Deformation.field(context, resolved, 0);
  // Primary abstract: https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART000866559
  // Coordinate conversion is checked against published magnitude and angles;
  // bilateral midline components cancel their lateral direction.
  const centre: (length: number, coronal: number, back: number) => Deformation.Vec3 = (length: number, coronal: number, back: number): Deformation.Vec3 => [
    -length * Math.sin(back * Math.PI / 180),
    length * Math.cos(back * Math.PI / 180) * Math.sin(coronal * Math.PI / 180),
    0,
  ];
  const cases: { name: string; point: Deformation.Vec3; expected: Deformation.Vec3 }[] = [
    { name: "Upper centre uses the reported posterior and coronal angles", point: [80, 1, 0], expected: centre(7.3, 88.1, 33.3) },
    { name: "Bilateral lower centre has no lateral drift", point: [80, -1, 0], expected: centre(5.9, -87.5, 66.9) },
  ];
  let failures: number = 0;
  for (const scenario of cases) {
    const actual: Deformation.Vec3 = field(scenario.point, false);
    const error: number = Math.hypot(...actual.map((value: number, index: number): number => value - scenario.expected[index]!));
    const passed: boolean = error < 1e-10;
    if (!passed) failures++;
  }
  
  if (failures > 0) throw new Error("Mouth smile: " + failures + " failed cases");
  
}
