import {
  IAutoMovieRenderTarget,
  IAutoMovieRenderTargetAsset,
  IAutoMovieRenderTargetRenderer,
  IAutoMovieRenderTargetSettings,
  type IAutoMovieSealRenderTarget,
} from "@automovie/interface";

import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { normalizeAutoMovieShadowFilter } from "./normalizeAutoMovieShadowFilter";

/**
 * Seal one render target: the renderer, its settings, and the exact asset bytes
 * a frame will read.
 *
 * The digest hashes explicit-position JSON tuples, so object property order and
 * embedded tabs/newlines do not collapse different renderer/asset fields.
 * Assets are sorted by UTF-16 code unit rather than locale collation.
 *
 * Buffer dimensions, ratio/exposure, shadow policy, nonblank renderer fields,
 * unique asset paths and SHA spellings are admitted here. Closed policy and
 * boolean field shapes are a caller structural-admission premise.
 */
export function sealAutoMovieRenderTarget(
  props: IAutoMovieSealRenderTarget.IProps,
): IAutoMovieRenderTarget {
  const {
    renderer,
  }: {
    renderer: IAutoMovieRenderTargetRenderer;
    settings: IAutoMovieRenderTargetSettings;
    assets: readonly IAutoMovieRenderTargetAsset[];
    textureDigest?: string;
  } = props;
  const settings: {
    shadowType: "pcf" | "vsm" | "none";
    width: number;
    height: number;
    pixelRatio: number;
    shadows: boolean;
    toneMapping: "none" | "acesFilmic";
    exposure: number;
  } = {
    ...props.settings,
    shadowType:
      props.settings.shadowType === "none"
        ? ("none" as const)
        : normalizeAutoMovieShadowFilter(props.settings.shadowType),
  };
  for (const [field, value] of [
    ["api", renderer.api],
    ["vendor", renderer.vendor],
    ["device", renderer.device],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`render target renderer.${field} must be non-blank`);
  for (const [field, value] of [
    ["width", settings.width],
    ["height", settings.height],
  ] as const)
    if (value <= 0)
      throw new Error(
        `render target settings.${field} must be a positive integer, but was ${value}`,
      );
  for (const [field, value] of [
    ["pixelRatio", settings.pixelRatio],
    ["exposure", settings.exposure],
  ] as const)
    if (value <= 0)
      throw new Error(
        `render target settings.${field} must be finite and above zero, but was ${value}`,
      );
  if (settings.shadows === (settings.shadowType === "none"))
    throw new Error(
      `render target settings.shadowType "${settings.shadowType}" contradicts shadows=${settings.shadows}`,
    );
  const assets: IAutoMovieRenderTargetAsset[] = [...props.assets].sort(
    (
      left: IAutoMovieRenderTargetAsset,
      right: IAutoMovieRenderTargetAsset,
    ): number => compareAutoMovieRenderIds(left.path, right.path),
  );
  const paths: Set<string> = new Set<string>();
  for (const asset of assets) {
    if (asset.path.trim().length === 0)
      throw new Error("render target asset path must be non-blank");
    if (paths.has(asset.path))
      throw new Error(
        `render target asset "${asset.path}" is declared more than once`,
      );
    paths.add(asset.path);
    if (SHA256_DIGEST_PATTERN.test(asset.digest) === false)
      throw new Error(
        `render target asset "${asset.path}" must carry one exact lowercase SHA-256 digest, but carried "${asset.digest}"`,
      );
  }
  if (
    props.textureDigest !== undefined &&
    SHA256_DIGEST_PATTERN.test(props.textureDigest) === false
  )
    throw new Error(
      "render target textureDigest must carry one exact lowercase SHA-256 digest",
    );
  const protocol: "automovie.render-target.v1" | "automovie.render-target.v2" =
    props.textureDigest === undefined
      ? "automovie.render-target.v1"
      : "automovie.render-target.v2";
  return {
    protocol,
    ...(props.textureDigest === undefined
      ? {}
      : { textureDigest: props.textureDigest }),
    renderer,
    settings,
    assets,
    digest: autoMovieRenderDigest(
      JSON.stringify([
        protocol,
        [renderer.api, renderer.vendor, renderer.device],
        [
          settings.width,
          settings.height,
          settings.pixelRatio,
          settings.shadows,
          settings.shadowType,
          settings.toneMapping,
          settings.exposure,
        ],
        assets.map((asset: IAutoMovieRenderTargetAsset): string[] => [
          asset.path,
          asset.digest,
        ]),
        props.textureDigest ?? null,
      ]),
    ),
  };
}
