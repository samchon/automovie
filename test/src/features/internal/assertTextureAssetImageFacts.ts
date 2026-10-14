import type {
  IAutoMovieTextureImageFacts,
  validateTextureAssets,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { ITextureAssetClosureOverrides } from "./ITextureAssetClosureOverrides";
import { hasViolation, namedFacts } from "./predicates";

/** Assert the existing media and edge-budget cases through supplied image facts; no image bytes are read or decoded here. The test entry owns these callbacks and their original order. */
export function assertTextureAssetImageFacts(
  closure: (
    props: ITextureAssetClosureOverrides,
  ) => ReturnType<typeof validateTextureAssets>,
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined,
): void {
  TestValidator.equals(
    "supplied media and dimensions govern closure admission",
    namedFacts([
      [
        "unreadable",
        (): boolean =>
          hasViolation(
            closure({ facts: (): undefined => undefined }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "hdrAsBaseColor",
        (): boolean =>
          hasViolation(
            closure({
              facts: (
                asset: string,
              ): IAutoMovieTextureImageFacts | undefined =>
                asset === "public/textures/tile-base.png"
                  ? { mediaType: "image/vnd.radiance", width: 8, height: 8 }
                  : facts(asset),
            }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "pngEnvironmentAccepted",
        (): boolean =>
          closure({
            facts: (asset: string): IAutoMovieTextureImageFacts | undefined =>
              asset === "public/textures/studio.hdr"
                ? { mediaType: "image/png", width: 64, height: 32 }
                : facts(asset),
          }).success,
      ],
      [
        "zeroEdge",
        (): boolean =>
          hasViolation(
            closure({
              facts: (
                asset: string,
              ): IAutoMovieTextureImageFacts | undefined =>
                asset === "public/textures/tile-base.png"
                  ? { mediaType: "image/png", width: 0, height: 16 }
                  : facts(asset),
            }),
            "range",
            ".baseColorTexture.width",
          ),
      ],
      [
        "fractionalEdge",
        (): boolean =>
          hasViolation(
            closure({
              facts: (
                asset: string,
              ): IAutoMovieTextureImageFacts | undefined =>
                asset === "public/textures/tile-base.png"
                  ? { mediaType: "image/png", width: 16, height: 16.5 }
                  : facts(asset),
            }),
            "range",
            ".baseColorTexture.height",
          ),
      ],
      [
        "overBudget",
        (): boolean =>
          hasViolation(
            closure({
              facts: (
                asset: string,
              ): IAutoMovieTextureImageFacts | undefined =>
                asset === "public/textures/tile-base.png"
                  ? { mediaType: "image/png", width: 8193, height: 16 }
                  : facts(asset),
            }),
            "range",
            ".baseColorTexture.width",
          ),
      ],
      [
        "exactBudgetAccepted",
        (): boolean =>
          closure({
            facts: (asset: string): IAutoMovieTextureImageFacts | undefined =>
              asset === "public/textures/tile-base.png"
                ? { mediaType: "image/png", width: 8192, height: 8192 }
                : facts(asset),
          }).success,
      ],
    ]),
    {
      unreadable: true,
      hdrAsBaseColor: true,
      pngEnvironmentAccepted: true,
      zeroEdge: true,
      fractionalEdge: true,
      overBudget: true,
      exactBudgetAccepted: true,
    },
  );
}
