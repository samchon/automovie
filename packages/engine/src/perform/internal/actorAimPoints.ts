import {
  type IAutoMovieActorContext,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Lift known actors' placement points by their context eye height for lookAt
 * targets, preserving the table's exact key set. Other staged nodes and cameras
 * keep their borrowed placement points. Arm and locomotion targets use the
 * unlifted table.
 */
export function actorAimPoints(
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  nodes: ReadonlyMap<string, IAutoMovieVector3>,
): Map<string, IAutoMovieVector3> {
  return new Map(
    [...nodes].map(
      ([id, point]: [string, IAutoMovieVector3]): readonly [
        string,
        IAutoMovieVector3,
      ] => {
        const eyeHeight: number | undefined = contexts.get(id)?.eyeHeight;
        return [
          id,
          eyeHeight === undefined
            ? point
            : { x: point.x, y: point.y + eyeHeight, z: point.z },
        ] as const;
      },
    ),
  );
}
