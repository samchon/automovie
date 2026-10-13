import {
  IAutoMovieRenderTarget,
  IAutoMovieRenderTargetAsset,
  IAutoMovieRenderTargetRenderer,
  IAutoMovieRenderTargetSettings,
  AutoMovieContentDigest,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { normalizeAutoMovieShadowFilter } from "./normalizeAutoMovieShadowFilter";

/**
 * Seal one render target: the renderer, its settings, and the exact asset bytes
 * a frame will read.
 *
 * The digest is taken over a field stream with explicit separators rather than
 * over `JSON.stringify`, because property order is an implementation detail of
 * whoever built the object and a fingerprint that changes with it would call
 * every second capture stale. Assets are sorted by UTF-16 code unit, never by
 * locale collation: a Turkish host must not fingerprint a different frame than
 * an English one, and `localeCompare` is exactly how that happens.
 *
 * Every field is validated. A zero-width buffer, a negative exposure, or a
 * malformed digest is an authoring or adapter defect, and a fingerprint that
 * accepted it would be a stable name for something that cannot be rendered.
 *
 * @author Samchon
 */
export const sealAutoMovieRenderTarget = (props: {
  /** Who draws the frame. */
  renderer: IAutoMovieRenderTargetRenderer;
  /** Configuration that changes what a frame costs. */
  settings: IAutoMovieRenderTargetSettings;
  /** Assets the drawn frame depends on; order is normalized here. */
  assets: readonly IAutoMovieRenderTargetAsset[];
  /** Canonical host-decoded upload facts, when measured by the current host. */
  textureDigest?: AutoMovieContentDigest;
}): IAutoMovieRenderTarget => {
  const { renderer } = props;
  const settings = { ...props.settings, shadowType: props.settings.shadowType === "none"
    ? "none" as const : normalizeAutoMovieShadowFilter(props.settings.shadowType) };
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
    if (!Number.isSafeInteger(value) || value <= 0)
      throw new Error(
        `render target settings.${field} must be a positive integer, but was ${value}`,
      );
  for (const [field, value] of [
    ["pixelRatio", settings.pixelRatio],
    ["exposure", settings.exposure],
  ] as const)
    if (!Number.isFinite(value) || value <= 0)
      throw new Error(
        `render target settings.${field} must be finite and above zero, but was ${value}`,
      );
  if (settings.shadows === (settings.shadowType === "none"))
    throw new Error(
      `render target settings.shadowType "${settings.shadowType}" contradicts shadows=${settings.shadows}`,
    );
  const assets = [...props.assets].sort((left, right) =>
    compareAutoMovieRenderIds(left.path, right.path),
  );
  const paths = new Set<string>();
  for (const asset of assets) {
    if (asset.path.trim().length === 0)
      throw new Error("render target asset path must be non-blank");
    if (paths.has(asset.path))
      throw new Error(
        `render target asset "${asset.path}" is declared more than once`,
      );
    paths.add(asset.path);
    if (/^sha256:[0-9a-f]{64}$/.test(asset.digest) === false)
      throw new Error(
        `render target asset "${asset.path}" must carry one exact lowercase SHA-256 digest, but carried "${asset.digest}"`,
      );
  }
  if (props.textureDigest !== undefined && /^sha256:[0-9a-f]{64}$/.test(props.textureDigest) === false)
    throw new Error("render target textureDigest must carry one exact lowercase SHA-256 digest");
  const protocol = props.textureDigest === undefined ? "automovie.render-target.v1" : "automovie.render-target.v2";
  return {
    protocol,
    ...(props.textureDigest === undefined ? {} : { textureDigest: props.textureDigest }),
    renderer,
    settings,
    assets,
    digest: autoMovieRenderDigest(
      [
        protocol,
        `renderer\t${renderer.api}\t${renderer.vendor}\t${renderer.device}`,
        `settings\t${settings.width}\t${settings.height}\t${settings.pixelRatio}\t${settings.shadows}\t${settings.shadowType}\t${settings.toneMapping}\t${settings.exposure}`,
        ...assets.map((asset) => `asset\t${asset.path}\t${asset.digest}`),
        ...(props.textureDigest === undefined ? [] : [`textures\t${props.textureDigest}`]),
      ].join("\n"),
    ),
  };
};
