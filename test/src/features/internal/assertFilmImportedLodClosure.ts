import { forgeProp } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "./predicates";
import type { IFilmImportedLodInputs } from "./IFilmImportedLodInputs";

/** Run the existing imported appearance LOD identity and sealed byte closure assertions. */
export function assertFilmImportedLodClosure(input: IFilmImportedLodInputs): void {
  const { createImportedPropSpec, refuses, tolerated, digest, SIDECAR_BYTES } = input;
  TestValidator.equals(
    "the LOD closure answers for its own levels and for the hero",
    namedFacts([
      [
        "duplicatedLevel",
        () =>
          refuses(
            (spec) =>
              spec.model.imported!.lod.push({
                ...spec.model.imported!.lod[0]!,
              }),
            "$input.model.imported.lod[1].level",
            "is declared twice",
          ),
      ],
      [
        "levelProfileDisagreement",
        () =>
          refuses(
            (spec) =>
              (spec.model.imported!.lod[0]!.profile = "gltf-humanoid-v1"),
            "$input.model.imported.lod[0].profile",
            "every level of one appearance shares its profile",
          ),
      ],
      [
        "malformedLevelDigest",
        () =>
          refuses(
            (spec) => (spec.model.imported!.lod[0]!.digest = "sha256:"),
            "$input.model.imported.lod[0].digest",
            "64 lowercase hexadecimal digits",
          ),
      ],
      [
        "levelDisagreesWithTheLedgerDigest",
        () =>
          refuses(
            (spec) => (spec.model.imported!.lod[0]!.digest = digest("c")),
            "$input.model.imported.lod[0].digest",
            "while the sealed ledger carries",
          ),
      ],
      [
        "aMalformedDigestIsNotAlsoALedgerDisagreement",
        () => {
          const spec = createImportedPropSpec();
          spec.model.imported!.lod[0]!.digest = "sha256:";
          const result = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.every(
              (item) =>
                !item.expected.includes("while the sealed ledger carries"),
            )
          );
        },
      ],
      [
        "levelOutsideTheLedger",
        () =>
          refuses(
            (spec) =>
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
        () =>
          refuses(
            (spec) => (spec.model.imported!.lod = []),
            "$input.model.imported.lod",
            "needs a hero LOD",
          ),
      ],
      [
        "aNonHeroLevelIsStillNotAHero",
        () =>
          refuses(
            (spec) => (spec.model.imported!.lod[0]!.level = "near"),
            "$input.model.imported.lod",
            "needs a hero LOD",
          ),
      ],
      [
        "heroBindingOtherBytes",
        () =>
          refuses(
            (spec) => (spec.model.imported!.lod[0]!.asset = SIDECAR_BYTES),
            "$input.model.imported.lod",
            "one appearance is one set of bytes",
          ),
      ],
      [
        "aNullAssetIsNotAlsoAHeroMismatch",
        () => {
          const spec = createImportedPropSpec();
          spec.model.asset = null;
          const result = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.every(
              (item) =>
                !item.expected.includes("one appearance is one set of bytes"),
            )
          );
        },
      ],
      [
        "aSecondSealedLevelIsAccepted",
        () =>
          tolerated((spec) => {
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
