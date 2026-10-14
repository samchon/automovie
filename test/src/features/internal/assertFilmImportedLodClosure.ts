import { type IAutoMovieForgedProp, forgeProp } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmImportedLodInputs } from "./IFilmImportedLodInputs";
import { namedFacts } from "./predicates";

/** Assert declared LOD identity and ledger joins through the owning test's mutation callbacks; no asset bytes are loaded or hashed. */
export function assertFilmImportedLodClosure(
  input: IFilmImportedLodInputs,
): void {
  const {
    createImportedPropSpec,
    refuses,
    tolerated,
    digest,
    SIDECAR_BYTES,
  }: IFilmImportedLodInputs = input;
  TestValidator.equals(
    "the LOD closure answers for its own levels and for the hero",
    namedFacts([
      [
        "duplicatedLevel",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): number =>
              spec.model.imported!.lod.push({
                ...spec.model.imported!.lod[0]!,
              }),
            "$input.model.imported.lod[1].level",
            "is declared twice",
          ),
      ],
      [
        "levelProfileDisagreement",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): string =>
              (spec.model.imported!.lod[0]!.profile = "gltf-humanoid-v1"),
            "$input.model.imported.lod[0].profile",
            "every level of one appearance shares its profile",
          ),
      ],
      [
        "malformedLevelDigest",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): string =>
              (spec.model.imported!.lod[0]!.digest = "sha256:"),
            "$input.model.imported.lod[0].digest",
            "64 lowercase hexadecimal digits",
          ),
      ],
      [
        "levelDisagreesWithTheLedgerDigest",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): `sha256:${string}` =>
              (spec.model.imported!.lod[0]!.digest = digest("c")),
            "$input.model.imported.lod[0].digest",
            "while the sealed ledger carries",
          ),
      ],
      [
        "aMalformedDigestIsNotAlsoALedgerDisagreement",
        (): boolean => {
          const spec: IAutoMoviePropSpec = createImportedPropSpec();
          spec.model.imported!.lod[0]!.digest = "sha256:";
          const result: IAutoMovieForgedProp = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean =>
                !item.expected.includes("while the sealed ledger carries"),
            )
          );
        },
      ],
      [
        "levelOutsideTheLedger",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): number =>
              spec.model.imported!.lod.push({
                level: "far",
                asset: "assets/chair-far.glb",
                digest: digest("d"),
                profile: "gltf-static-v1",
                humanoidBones: [],
              }),
            "$input.model.imported.lod[1].asset",
            "the sealed byte ledger does not cover",
          ),
      ],
      [
        "noHeroAtAll",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): never[] =>
              (spec.model.imported!.lod = []),
            "$input.model.imported.lod",
            "needs a hero LOD",
          ),
      ],
      [
        "aNonHeroLevelIsStillNotAHero",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): string =>
              (spec.model.imported!.lod[0]!.level = "near"),
            "$input.model.imported.lod",
            "needs a hero LOD",
          ),
      ],
      [
        "heroBindingOtherBytes",
        (): boolean =>
          refuses(
            (spec: IAutoMoviePropSpec): string =>
              (spec.model.imported!.lod[0]!.asset = SIDECAR_BYTES),
            "$input.model.imported.lod",
            "one appearance is one set of bytes",
          ),
      ],
      [
        "aNullAssetIsNotAlsoAHeroMismatch",
        (): boolean => {
          const spec: IAutoMoviePropSpec = createImportedPropSpec();
          spec.model.asset = null;
          const result: IAutoMovieForgedProp = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean =>
                !item.expected.includes("one appearance is one set of bytes"),
            )
          );
        },
      ],
      [
        "aSecondSealedLevelIsAccepted",
        (): boolean =>
          tolerated((spec: IAutoMoviePropSpec): void => {
            spec.model.imported!.assets.push({
              path: "assets/chair-far.glb",
              digest: digest("e"),
            });
            spec.model.imported!.lod.push({
              level: "far",
              asset: "assets/chair-far.glb",
              digest: digest("e"),
              profile: "gltf-static-v1",
              humanoidBones: [],
            });
          }),
      ],
    ]),
    {
      duplicatedLevel: true,
      levelProfileDisagreement: true,
      malformedLevelDigest: true,
      levelDisagreesWithTheLedgerDigest: true,
      aMalformedDigestIsNotAlsoALedgerDisagreement: true,
      levelOutsideTheLedger: true,
      noHeroAtAll: true,
      aNonHeroLevelIsStillNotAHero: true,
      heroBindingOtherBytes: true,
      aNullAssetIsNotAlsoAHeroMismatch: true,
      aSecondSealedLevelIsAccepted: true,
    },
  );
}
