import type { IAutoMovieTextureImageFacts, validateTextureAssets } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { ITextureAssetClosureOverrides } from "./ITextureAssetClosureOverrides";
import { hasViolation, namedFacts } from "./predicates";

/** Existing media/edge-budget boundary assertions on the caller's unchanged texture closure.
 * The source facts reader and original supported/refused cases retain their order.
 */
export const assertTextureAssetImageFacts = (
  closure: (props: ITextureAssetClosureOverrides) => ReturnType<typeof validateTextureAssets>,
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined,
): void => {
  TestValidator.equals(
    "media and dimensions are decided by the bytes",
    namedFacts([
      [
        "unreadable",
        () =>
          hasViolation(
            closure({ facts: () => undefined }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "hdrAsBaseColor",
        () =>
          hasViolation(
            closure({
              facts: (asset) =>
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
        () =>
          closure({
            facts: (asset) =>
              asset === "public/textures/studio.hdr"
                ? { mediaType: "image/png", width: 64, height: 32 }
                : facts(asset),
          }).success,
      ],
      [
        "zeroEdge",
        () =>
          hasViolation(
            closure({
              facts: (asset) =>
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
        () =>
          hasViolation(
            closure({
              facts: (asset) =>
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
        () =>
          hasViolation(
            closure({
              facts: (asset) =>
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
        () =>
          closure({
            facts: (asset) =>
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

};
