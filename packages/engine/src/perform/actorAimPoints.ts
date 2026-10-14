import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * Lift known actors' placement points by their context eye height for lookAt targets, preserving the table's exact key set. Other staged nodes and cameras keep their borrowed placement points. Arm and locomotion targets use the unlifted table.
 *
 * @evidence contracts/common.md#principled-implementation Adds eyeHeight to world Y for each placement with an actor context; the existing synthesis convention treats actor positions as ground origins and height as metres.
 * @evidence contracts/common.md#clear-and-simple-design A single lifted placement table lets point, node and group resolution use the same positional resolver without a second averaging implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is the staged vertical eye-height convention, not animated eye FK; a rig's lean or arbitrary transform does not move these aim points.
 * @evidence contracts/common.md#meaningful-documentation States metre eye-height lift, exact key preservation, borrowed non-actor points and gaze-only use.
 * @evidence contracts/performance.md#efficient-algorithms For N placements, one O(N) pass and O(N) map entries plus fresh vectors only for entries with eye height.
 * @evidence contracts/performance.md#reuse-equivalent-work The action's lookAt resolver shares this table; it is rebuilt from resumed contexts and placements so previous-beat positions are not stale.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns the map and lifted vectors; unlifted vectors are borrowed and no persistent table or task is retained.
 */
export const actorAimPoints: (
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  nodes: ReadonlyMap<string, IAutoMovieVector3>,
) => Map<string, IAutoMovieVector3> = (
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  nodes: ReadonlyMap<string, IAutoMovieVector3>,
): Map<string, IAutoMovieVector3> =>
  new Map(
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
