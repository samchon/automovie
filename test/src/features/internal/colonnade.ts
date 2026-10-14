import {
  type IAutoMovieMesh,
  type IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieMeshAssembly, mergeAutoMovieMeshParts, revolveAutoMovieProfile } from "@automovie/engine";



/**
 * Build the architecture test's centred X row of faceted shafts, using one metre-based revolve profile and placements spaced by the authored distance. Callers supply positive integral count, positive radius/height/spacing and a supported segment count; production revolve/merge own their refusals.
 *
 * The same shaft mesh is reused as input for every placement, while the final merge owns its emitted buffers/groups. Cost/output scale with count times shaft tessellation, and no shaft cache survives this call. This fixture constructs inputs rather than providing an independent revolve oracle; the parent asserts literal n-gon volume and bounds.
 */
export const colonnade: (props: {
  count: number;
  spacing: number;
  radius: number;
  height: number;
  segments: number;
}) => IAutoMovieMeshAssembly = (props: {
  count: number;
  spacing: number;
  radius: number;
  height: number;
  segments: number;
}): IAutoMovieMeshAssembly => {
  const shaft: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 0, y: 0 },
      { x: props.radius, y: 0 },
      { x: props.radius, y: props.height },
      { x: 0, y: props.height },
    ],
    segments: props.segments,
  });
  const span: number = (props.count - 1) * props.spacing;
  return mergeAutoMovieMeshParts(
    Array.from(
      { length: props.count },
      (
        _: unknown,
        index: number,
      ): {
        id: string;
        mesh: IAutoMovieMesh;
        transform: { translation: IAutoMovieVector3 };
      } => ({
        id: `column-${index + 1}`,
        mesh: shaft,
        transform: {
          translation: { x: index * props.spacing - span / 2, y: 0, z: 0 },
        },
      }),
    ),
  );
};
