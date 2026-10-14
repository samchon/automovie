import type {
  IAutoMovieMaterialAssembly,
  IAutoMovieMaterialLayer,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assembly, layer } from "./materialFixtures";
import { namedFacts } from "./predicates";

/**
 * Assert the existing multi-layer and single-layer finish cases owned by test_architecture_material_assembly_defects.
 *
 * The borrowed callback invokes the actual assembly validator. Authored finish flags and face exposure independently determine doubled, buried, absent and wasted finish expectations, including the one-layer case where both faces share a layer. This helper preserves the case labels, located messages and valid neighbors; it registers no case, retains no result and starts no host.
 */
export function assertMaterialAssemblyFinishDefects(
  judge: (one: IAutoMovieMaterialAssembly) => IAutoMovieValidation,
): void {
  const three: (
    finishes: readonly boolean[],
    faces: IAutoMovieMaterialAssembly["faces"],
  ) => IAutoMovieMaterialAssembly = (
    finishes: readonly boolean[],
    faces: IAutoMovieMaterialAssembly["faces"],
  ): IAutoMovieMaterialAssembly =>
    assembly(
      ["outer", "middle", "inner"].map(
        (id: string, index: number): IAutoMovieMaterialLayer =>
          layer(id, 0.05, { finish: finishes[index] }),
      ),
      { faces },
    );
  const solitary: (
    one: IAutoMovieValidation,
    path: string,
    fragment: string,
  ) => boolean = (
    one: IAutoMovieValidation,
    path: string,
    fragment: string,
  ): boolean =>
    one.success === false &&
    one.violations.length === 1 &&
    one.violations[0]!.path === path &&
    one.violations[0]!.expected.includes(fragment);
  TestValidator.equals(
    "finish defects are told apart from one another",
    namedFacts([
      [
        "doubled",
        (): boolean =>
          solitary(
            judge(
              three([true, true, false], {
                first: "exposed",
                last: "concealed",
              }),
            ),
            "$input.layers[1].finish",
            "lays a finish over the finish beside it",
          ),
      ],
      [
        "buried",
        (): boolean =>
          solitary(
            judge(
              three([false, true, false], {
                first: "concealed",
                last: "concealed",
              }),
            ),
            "$input.layers[1].finish",
            "buried between layers",
          ),
      ],
      [
        "missing",
        (): boolean =>
          solitary(
            judge(
              three([false, false, false], {
                first: "exposed",
                last: "concealed",
              }),
            ),
            "$input.layers[0].finish",
            "no finish presents the exposed first face",
          ),
      ],
      [
        "wasted",
        (): boolean =>
          solitary(
            judge(
              three([false, false, true], {
                first: "concealed",
                last: "concealed",
              }),
            ),
            "$input.layers[2].finish",
            "spends a finish on the concealed last face",
          ),
      ],
      [
        "bothEndsFinished",
        (): boolean =>
          judge(
            three([true, false, true], { first: "exposed", last: "exposed" }),
          ).success === true,
      ],
    ]),
    {
      doubled: true,
      buried: true,
      missing: true,
      wasted: true,
      bothEndsFinished: true,
    },
  );

  const single: (
    finish: boolean,
    faces: IAutoMovieMaterialAssembly["faces"],
  ) => IAutoMovieMaterialAssembly = (
    finish: boolean,
    faces: IAutoMovieMaterialAssembly["faces"],
  ): IAutoMovieMaterialAssembly =>
    assembly([layer("slab", 0.2, { finish })], { faces });
  TestValidator.equals(
    "one layer answers for both faces at once",
    namedFacts([
      [
        "oneExposedSideFinished",
        (): boolean =>
          judge(single(true, { first: "exposed", last: "concealed" }))
            .success === true,
      ],
      [
        "bothExposedFinished",
        (): boolean =>
          judge(single(true, { first: "exposed", last: "exposed" })).success ===
          true,
      ],
      [
        "bothExposedUnfinished",
        (): boolean =>
          solitary(
            judge(single(false, { first: "exposed", last: "exposed" })),
            "$input.layers[0].finish",
            "the exposed first and last face",
          ),
      ],
      [
        "bothConcealedFinished",
        (): boolean =>
          solitary(
            judge(single(true, { first: "concealed", last: "concealed" })),
            "$input.layers[0].finish",
            "the concealed first and last face",
          ),
      ],
      [
        "bothConcealedUnfinished",
        (): boolean =>
          judge(single(false, { first: "concealed", last: "concealed" }))
            .success === true,
      ],
    ]),
    {
      oneExposedSideFinished: true,
      bothExposedFinished: true,
      bothExposedUnfinished: true,
      bothConcealedFinished: true,
      bothConcealedUnfinished: true,
    },
  );
}
