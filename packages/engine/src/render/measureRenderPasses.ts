import type {
  IAutoMovieMeasureRenderSimulation,
  IAutoMovieRenderSubject,
} from "@automovie/interface";

import { measureAutoMovieRenderFeeds } from "./measureAutoMovieRenderFeeds";
import type { measureRenderTextures } from "./measureRenderTextures";

/**
 * The render inventory's frame-pass phase: the lights, their shadow passes, the
 * outline pass, the surface feeds' scene passes and the background.
 *
 * It runs last, on the opaque draw and triangle counts every earlier phase
 * summed. Each light is one `lights` row. Each shadow caster owns one map, and
 * its depth faces repeat the opaque geometry once each while each VSM filtering
 * draw submits one fullscreen triangle; those draws and triangles are `pass`
 * rows, because their cost is the sum of every drawable before them rather than
 * the light's own complexity. With no caster the outline pass is the frame-wide
 * peak and is added the same way; with one it ties the shadow pass, and with
 * several the shadow pass is already the larger bound. Each surface feed target
 * is one more runtime texture of its bytes, and each feed shown at once redraws
 * the scene with its shadow maps into its target. An environment image draws
 * its background as one more call of two triangles. Every count adds in the
 * order the inventory always added it, so the totals keep their floating-point
 * sums.
 *
 * @returns The counts with every pass added, the shadow map count and the feed
 *   measure whose targets and bytes join the texture totals.
 */
export function measureRenderPasses(
  props: measureRenderPasses.IProps,
): measureRenderPasses.IResult {
  const { subject, casters, add }: measureRenderPasses.IProps = props;
  let drawCalls: number = props.drawCalls;
  let triangles: number = props.triangles;
  for (const light of subject.scene.lights)
    add(`light:${light.id}`, `scene.lights["${light.id}"]`, "lights", 1);

  const opaqueDraws: number = props.drawCalls;
  const opaqueTriangles: number = props.triangles;
  for (const caster of casters) {
    const shadowDraws: number =
      opaqueDraws * caster.depthFaces + caster.filterDraws;
    const shadowTriangles: number =
      opaqueTriangles * caster.depthFaces + caster.filterDraws;
    drawCalls += shadowDraws;
    triangles += shadowTriangles;
    add(
      `light:${caster.light}`,
      `scene.lights["${caster.light}"]`,
      "shadowMaps",
      1,
    );
    add(
      `light:${caster.light}`,
      `scene.lights["${caster.light}"]`,
      "drawCalls",
      shadowDraws,
      "pass",
    );
    add(
      `light:${caster.light}`,
      `scene.lights["${caster.light}"]`,
      "triangles",
      shadowTriangles,
      "pass",
    );
  }
  if (casters.length === 0) {
    drawCalls += opaqueDraws;
    triangles += opaqueTriangles;
    add(
      "render-pass:outline",
      "render.pass.outline",
      "drawCalls",
      opaqueDraws,
      "pass",
    );
    add(
      "render-pass:outline",
      "render.pass.outline",
      "triangles",
      opaqueTriangles,
      "pass",
    );
  }

  // A feed target is one more texture, and a shown feed redraws the scene,
  // its shadow maps included, into it once per frame.
  const feeds: measureAutoMovieRenderFeeds.IResult =
    measureAutoMovieRenderFeeds(subject);
  const sceneDraws: number = casters.reduce(
    (sum: number, caster: measureRenderTextures.ICaster): number =>
      sum + opaqueDraws * caster.depthFaces + caster.filterDraws,
    opaqueDraws,
  );
  const sceneTriangles: number = casters.reduce(
    (sum: number, caster: measureRenderTextures.ICaster): number =>
      sum + opaqueTriangles * caster.depthFaces + caster.filterDraws,
    opaqueTriangles,
  );
  for (const track of feeds.tracks) {
    const source: string = `surfaceGraphics["${track.owner}"]`;
    add(track.owner, source, "textures", track.targets, "runtime");
    add(track.owner, source, "textureBytes", track.bytes, "runtime");
    add(track.owner, source, "drawCalls", track.passes * sceneDraws, "pass");
    add(
      track.owner,
      source,
      "triangles",
      track.passes * sceneTriangles,
      "pass",
    );
  }
  drawCalls += feeds.passes * sceneDraws;
  triangles += feeds.passes * sceneTriangles;

  const image: string | null = subject.scene.environment?.image ?? null;
  if (image !== null) {
    drawCalls += 1;
    triangles += 2;
    add(`texture:${image}`, "scene.environment.image", "drawCalls", 1);
    add(`texture:${image}`, "scene.environment.image", "triangles", 2);
  }
  return { drawCalls, triangles, shadowMaps: casters.length, feeds };
}

/** What the frame-pass phase reads and returns. */
export namespace measureRenderPasses {
  /** The subject, the shadow casters and the opaque counts so far. */
  export interface IProps {
    /** The measured subject; only read. */
    subject: IAutoMovieRenderSubject;

    /** The lights that render a shadow map. */
    casters: readonly measureRenderTextures.ICaster[];

    /** Draw calls every earlier phase counted, the opaque frame. */
    drawCalls: number;

    /** Triangles every earlier phase counted, the opaque frame. */
    triangles: number;

    /** Appends one owner row. */
    add: IAutoMovieMeasureRenderSimulation.IProps["add"];
  }

  /** The counts with every pass and the feed measure. */
  export interface IResult {
    /** Draw calls with every pass added. */
    drawCalls: number;

    /** Triangles with every pass added. */
    triangles: number;

    /** Shadow maps the frame renders, one per caster. */
    shadowMaps: number;

    /** The surface feeds' targets, bytes and passes. */
    feeds: measureAutoMovieRenderFeeds.IResult;
  }
}
