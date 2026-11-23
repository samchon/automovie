import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieRenderSubject,
  IAutoMovieSceneNode,
  IAutoMovieSurfaceGraphicLayer,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";

import { autoMovieSurfaceFeedWidth } from "./autoMovieSurfaceFeedWidth";

/**
 * Bytes one feed render-target pixel holds: four for its RGBA8 colour texture
 * and four for the 24-bit depth renderbuffer three.js gives a
 * `WebGLRenderTarget` by default, stored in a 32-bit word.
 */
const FEED_BYTES_PER_PIXEL: number = 8;

/**
 * Measure the render targets and passes a subject's surface-graphic feed layers
 * commit the renderer to, as `prepareAutoMovieSurfaceGraphics` builds them.
 *
 * Every feed layer of every key owns one render target for the whole shot,
 * `pixels` high and {@link autoMovieSurfaceFeedWidth} wide, the rule `render`
 * allocates by, so each is one texture allocation of
 * {@link FEED_BYTES_PER_PIXEL} bytes per pixel. A shown feed redraws the scene
 * once into its target, so a frame can add as many scene passes as the feed
 * layers shown at once: one key per track is in force, so the bound is the
 * largest feed count of any key, summed over the tracks.
 *
 * The face size is the `surface` affordance the track names on the model its
 * node stages; it throws, naming the track, when that cannot be resolved.
 *
 * @param subject The subject whose surface graphics are measured.
 * @returns One row per track with feeds, in track order, and the totals.
 */
export function measureAutoMovieRenderFeeds(
  subject: IAutoMovieRenderSubject,
): measureAutoMovieRenderFeeds.IResult {
  const nodes: Map<string, IAutoMovieSceneNode> = new Map(
    subject.scene.nodes.map(
      (node: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
        node.id,
        node,
      ],
    ),
  );
  const models: Map<string, IAutoMovieModel> = new Map(
    subject.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const tracks: measureAutoMovieRenderFeeds.ITrack[] = [];
  for (const track of subject.surfaceGraphics ?? []) {
    const feeds: IAutoMovieSurfaceGraphicLayer.IFeed[][] = track.keys.map(
      (
        key: IAutoMovieSurfaceGraphicTrack["keys"][number],
      ): IAutoMovieSurfaceGraphicLayer.IFeed[] =>
        key.graphic.layers.filter(
          (
            layer: IAutoMovieSurfaceGraphicLayer,
          ): layer is IAutoMovieSurfaceGraphicLayer.IFeed =>
            layer.kind === "feed",
        ),
    );
    if (
      feeds.every(
        (layers: IAutoMovieSurfaceGraphicLayer.IFeed[]): boolean =>
          layers.length === 0,
      )
    )
      continue;

    const owner: string = `surface-graphic:${track.node}/${track.surface}`;
    const model: IAutoMovieModel | undefined = models.get(
      nodes.get(track.node)?.model ?? "",
    );
    const face: IAutoMovieAffordance | undefined = model?.affordances?.find(
      (entry: IAutoMovieAffordance): boolean => entry.id === track.surface,
    );
    const faceWidth: number = face?.width ?? NaN;
    const faceDepth: number = face?.depth ?? NaN;
    if (!(faceWidth > 0) || !(faceDepth > 0))
      throw new Error(
        `render inventory cannot measure ${owner}: its node's model has no sized "${track.surface}" surface`,
      );
    let bytes: number = 0;
    for (const layer of feeds.flat())
      bytes +=
        autoMovieSurfaceFeedWidth(layer, faceWidth, faceDepth) *
        layer.pixels *
        FEED_BYTES_PER_PIXEL;
    tracks.push({
      owner,
      targets: feeds.flat().length,
      bytes,
      passes: Math.max(
        ...feeds.map(
          (layers: IAutoMovieSurfaceGraphicLayer.IFeed[]): number =>
            layers.length,
        ),
      ),
    });
  }
  return {
    tracks,
    targets: tracks.reduce(
      (sum: number, track: measureAutoMovieRenderFeeds.ITrack): number =>
        sum + track.targets,
      0,
    ),
    bytes: tracks.reduce(
      (sum: number, track: measureAutoMovieRenderFeeds.ITrack): number =>
        sum + track.bytes,
      0,
    ),
    passes: tracks.reduce(
      (sum: number, track: measureAutoMovieRenderFeeds.ITrack): number =>
        sum + track.passes,
      0,
    ),
  };
}

/** What the feed layers commit. */
export namespace measureAutoMovieRenderFeeds {
  /** One track's feed render targets and its most feeds shown at once. */
  export interface ITrack {
    /** The track's mask owner, `surface-graphic:<node>/<surface>`. */
    owner: string;

    /** Render targets its keys' feed layers hold. */
    targets: number;

    /** Bytes those targets hold. */
    bytes: number;

    /** Most feed layers one key shows, each one scene pass per frame. */
    passes: number;
  }

  /** The tracks with feeds and their sums. */
  export interface IResult {
    /** One row per track with at least one feed layer, in track order. */
    tracks: ITrack[];

    /** Every feed render target the shot holds. */
    targets: number;

    /** Bytes of every feed render target. */
    bytes: number;

    /** Most scene passes the feeds add to one frame. */
    passes: number;
  }
}
