import type {
  IAutoMovieFontSource,
  IAutoMoviePerformShotProps,
  IAutoMoviePracticalSurfaceTrack,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieSurfaceGraphicTrack,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateAutoMovieFontSources } from "../../typography/internal/validateAutoMovieFontSources";
import { appendPracticalSurfacesArtifact } from "../../validation/internal/appendPracticalSurfacesArtifact";
import { appendSurfaceGraphicsArtifact } from "../../validation/internal/appendSurfaceGraphicsArtifact";

/*
 * Admit a shot's authored prop surfaces against the staged nodes and the
 * registered models, and return detached copies for the shot artifact.
 *
 * Practical surface tracks switch a part's material; surface graphic tracks
 * show pictures on a `surface` affordance. Both are checked with the models the
 * props supply, so a target must resolve on the prop's registered model, and a
 * text layer that specifies a font must name a source the props list. An
 * omitted font stays omitted for the renderer's default. Font sources are
 * admitted from what their records state. With `cameras`, a feed layer must
 * name one of the staged cameras `ids` other than `shot`, the live camera the
 * camera gate chose, so a feed of the shot's own camera is an authoring finding
 * rather than a defect of the assembled artifact. Findings join `out`; when any
 * finding exists, including one an earlier gate recorded, both lists come back
 * absent so no partially admitted track reaches the artifact. Absent inputs
 * stay absent.
 */
export function admitPerformShotSurfaces(
  props: Pick<
    IAutoMoviePerformShotProps,
    "practicalSurfaces" | "surfaceGraphics" | "models" | "fonts"
  >,
  nodes: readonly IAutoMovieSceneNode[],
  duration: number,
  out: IAutoMovieViolationCollector,
  cameras?: {
    /*
     * Ids of the staged cameras.
     */
    ids: ReadonlySet<string>;

    /*
     * The live camera, when the camera gate chose one.
     */
    shot?: string;
  },
): Pick<IAutoMovieShot, "practicalSurfaces" | "surfaceGraphics" | "fonts"> {
  validateAutoMovieFontSources(props.fonts, "$input.fonts", out);
  appendPracticalSurfacesArtifact(
    props.practicalSurfaces,
    nodes,
    duration,
    out.items,
    props.models ?? [],
  );
  appendSurfaceGraphicsArtifact(
    props.surfaceGraphics,
    nodes,
    duration,
    out,
    props.models ?? [],
    new Set(
      (props.fonts ?? []).map(
        (source: IAutoMovieFontSource): string => source.id,
      ),
    ),
    cameras,
  );
  if (out.items.length > 0) return {};

  const practicalSurfaces: IAutoMoviePracticalSurfaceTrack[] | undefined =
    props.practicalSurfaces?.map(
      (
        track: IAutoMoviePracticalSurfaceTrack,
      ): IAutoMoviePracticalSurfaceTrack => ({
        node: track.node,
        part: track.part,
        keys: track.keys.map(
          ({
            time,
            material,
          }: IAutoMoviePracticalSurfaceTrack["keys"][number]): IAutoMoviePracticalSurfaceTrack["keys"][number] => ({
            time,
            material,
          }),
        ),
      }),
    );

  // A graphic is plain data, so a structured clone detaches every nested layer.
  const surfaceGraphics: IAutoMovieSurfaceGraphicTrack[] | undefined =
    props.surfaceGraphics?.map(
      (track: IAutoMovieSurfaceGraphicTrack): IAutoMovieSurfaceGraphicTrack =>
        structuredClone(track),
    );
  return {
    ...(practicalSurfaces === undefined ? {} : { practicalSurfaces }),
    ...(surfaceGraphics === undefined ? {} : { surfaceGraphics }),
    ...(props.fonts === undefined
      ? {}
      : {
          fonts: props.fonts.map(
            (source: IAutoMovieFontSource): IAutoMovieFontSource => ({
              ...source,
            }),
          ),
        }),
  };
}
