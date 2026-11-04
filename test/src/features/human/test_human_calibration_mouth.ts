import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";
import { nclose } from "../internal/predicates";

/**
 * Dental calibration preserves adult crown dimensions, occlusion and placement.
 *
 * Scenarios:
 *
 * 1. Both sexes and narrow/wide lips keep all 28 permanent crowns, mirrored
 * placement and the declared incisor display and occlusal-plane angle.
 * 2. First-molar cusp width remains in the published adult 52 to 55 mm band.
 * 3. Translating the lip/mandible frame translates every crown without changing
 * its dimensions; earlier public arrays remain independent of later output.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual mouth producer with a known planar skin, reads all tooth necks, axes, incisal tips and reconstructed cusp points, and checks unchanged previous output after changing a later mouth's edge. It catches a dental solve changing adult dimensions, symmetry, occlusion or frame dependence.
 * @evidence contracts/testing.md#independent-expectations Wheeler crown dimensions and the published adult first-molar width band, Vig and Brundo sex-specific resting display and Downs occlusal angle are the mouth's declared physical contract. Euclidean translation and reflection supply placement expectations without repeating the beta arch, its chord integration or either numerical solve. The cusp-width check uses a tangent displacement from the tooth centre, so its broad published band allows that local geometric approximation.
 * @evidence contracts/testing.md#distinguishing-cases Covers masculine/feminine rest display, 40/60 mm mouths, both jaws and sides, every tooth, and two frame translations. Full head attachment and skin containment remain the assembled calibration and existing mouth anatomy tests' responsibility.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit imports the mouth producer directly with deterministic local callbacks and starts no renderer, browser, process or installation.
 */
export function test_human_calibration_mouth(): void {
  const defects: string[] = [];

  // Wheeler's permanent-crown width and height, central incisor to second molar.
  const dimensions: Record<
    "upper" | "lower",
    readonly (readonly [number, number])[]
  > = {
    upper: [
      [8.5, 10.5],
      [6.5, 9],
      [7.5, 10],
      [7, 8.5],
      [6.5, 8.5],
      [10, 7.5],
      [9, 7],
    ],
    lower: [
      [5, 9],
      [5.5, 9.5],
      [7, 11],
      [7, 8.5],
      [7, 8],
      [11, 7.5],
      [10.5, 7],
    ],
  };
  const names: readonly string[] = [
    "centralIncisor",
    "lateralIncisor",
    "canine",
    "firstPremolar",
    "secondPremolar",
    "firstMolar",
    "secondMolar",
  ];
  for (const sex of [-1, 1])
    for (const width of [20, 30]) {
      const outputs: AutoMovieHumanMouth.IOutput[] = [];
      for (const shift of [0, 137]) {
        const inputs: AutoMovieHumanMouth.IInputs = {
          stomion: 1500 + shift,
          width,
          upper: 8,
          lower: 9,
          gap: 0,
          subnasale: 1520 + shift,
          menton: 1460 + shift,
          sex,
          gonion: 20 + shift,
          contact: (u: number): number => 1500 + shift + u * u,
          front: (_y: number, _z: number): number => 100 + shift,
        };
        const output: AutoMovieHumanMouth.IOutput =
          AutoMovieHumanMouth.create(inputs);
        outputs.push(output);
        const mouth: AutoMovieHumanMouth.IMouth = output.mouth;
        const label: string = `${sex}/${width}/${shift}`;
        if (mouth.teeth.length !== 28)
          defects.push(`${label}: permanent dentition`);
        const display: number = sex < 0 ? 1.91 : 3.4;
        if (!nclose(mouth.edge[1], inputs.stomion - display, 1e-10))
          defects.push(`${label}: resting incisor display`);
        if (!nclose(100 + shift - mouth.edge[0], 13.5, 1e-10))
          defects.push(`${label}: upper lip tissue thickness`);
        for (const tooth of mouth.teeth) {
          const mirror: AutoMovieHumanMouth.ITooth = mouth.teeth.find(
            (other: AutoMovieHumanMouth.ITooth): boolean =>
              other.name ===
              tooth.name.replace(
                tooth.name.includes(".left.") ? ".left." : ".right.",
                tooth.name.includes(".left.") ? ".right." : ".left.",
              ),
          )!;
          if (
            !nclose(tooth.neck[0], mirror.neck[0], 1e-10) ||
            !nclose(tooth.neck[1], mirror.neck[1], 1e-10) ||
            !nclose(tooth.neck[2], -mirror.neck[2], 1e-10)
          )
            defects.push(`${label}/${tooth.name}: bilateral placement`);
          const tipY: number =
            tooth.neck[1] + tooth.axis[1] * tooth.crown.height;
          if (
            tooth.jaw === "upper" &&
            !nclose(
              tipY,
              mouth.edge[1] +
                Math.tan((9.3 * Math.PI) / 180) *
                  (mouth.edge[0] - tooth.neck[0]),
              1e-10,
            )
          )
            defects.push(`${label}/${tooth.name}: occlusal plane`);
          const expected: readonly [number, number] | undefined =
            dimensions[tooth.jaw][names.indexOf(tooth.crown.name)];
          if (
            expected === undefined ||
            !nclose(tooth.crown.height, expected[1], 0) ||
            !nclose(tooth.crown.width, expected[0], 0)
          )
            defects.push(`${label}/${tooth.name}: adult crown dimensions`);
        }
        const molar: AutoMovieHumanMouth.ITooth = mouth.teeth.find(
          (tooth: AutoMovieHumanMouth.ITooth): boolean =>
            tooth.name === "upper.left.firstMolar",
        )!;
        const cuspWidth: number =
          2 *
          (molar.neck[2] +
            (molar.out[2] * molar.crown.depth) / 4 -
            (molar.along[2] * molar.crown.width) / 4);
        if (!(cuspWidth >= 52 && cuspWidth <= 55))
          defects.push(`${label}: adult intermolar cusp width ${cuspWidth}`);
      }
      for (let i: number = 0; i < outputs[0]!.mouth.teeth.length; i++) {
        const before: AutoMovieHumanMouth.ITooth = outputs[0]!.mouth.teeth[i]!;
        const after: AutoMovieHumanMouth.ITooth = outputs[1]!.mouth.teeth[i]!;
        for (let k: number = 0; k < 3; k++)
          if (!nclose(after.neck[k]! - before.neck[k]!, k < 2 ? 137 : 0, 1e-10))
            defects.push(
              `${sex}/${width}/${before.name}: translated dental frame`,
            );
      }
      const edge: number = outputs[0]!.mouth.edge[0];
      outputs[1]!.mouth.edge[0] = -999;
      if (!nclose(outputs[0]!.mouth.edge[0], edge, 0))
        defects.push(`${sex}/${width}: aliased output`);
    }
  TestValidator.equals("physical mouth calibration", defects, []);
}
