import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMoviePose } from "@automovie/interface";
import {
  type AutoMovieHumanPolygon,
  buildHumanPolygon,
} from "@automovie/render";
import * as THREE from "three";

/**
 * The polygon man of one canonical Human body, drawn by the viewer's polygon
 * builder and posed from canonical poses.
 *
 * The builder reads Human's registered frame, so the drawing takes
 * `AutoMovieHumanCanonicalBody.display` (the T-pose bones and placements
 * reflected back) and sits under a group carrying
 * `AutoMovieHumanCanonicalBody.REFLECTION`, which shows it in the canonical
 * world; the rasterizer and three.js reverse winding for that mirrored matrix,
 * so faces keep their orientation. The drawing is the bare polygon body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame handling, why it is exact and that no face or detail is added.
 * @evidence contracts/development/implementation.md#principled-implementation Uses Human's own canonical adapter for placements and the viewer's own polygon builder for geometry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build once, then `place` applies each pose.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No display correction or added geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms Building is linear in drawing triangles; placing is linear in joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One drawing serves every frame of a run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The drawing is disposed by `dispose`.
 */
export class MotionCaptureFigure {
  /** The figure root, in the canonical world. */
  public readonly object: THREE.Group;

  private readonly drawing: AutoMovieHumanPolygon.IDrawing;

  private readonly body: AutoMovieHumanCanonicalBody.IBody;

  /**
   * Build the drawing of a body.
   *
   * @param body The canonical body.
   * @param color Optional colour of every part.
   */
  public constructor(body: AutoMovieHumanCanonicalBody.IBody, color?: number) {
    this.body = body;
    const rest: ReturnType<typeof AutoMovieHumanCanonicalBody.display> =
      AutoMovieHumanCanonicalBody.display(body);
    this.drawing = buildHumanPolygon(
      rest,
      color === undefined
        ? {}
        : {
            partColors: Object.fromEntries(
              rest.bones.map((b: { bone: string }): [string, number] => [
                b.bone,
                color,
              ]),
            ),
          },
    );
    this.object = new THREE.Group();
    this.object.matrixAutoUpdate = false;
    this.object.matrix.fromArray([...AutoMovieHumanCanonicalBody.REFLECTION]);
    this.object.add(this.drawing.object);
  }

  /**
   * Pose the drawing.
   *
   * @param pose A canonical pose of the body.
   * @returns Every Human joint's canonical placement.
   */
  public place(pose: IAutoMoviePose): AutoMovieHumanCanonicalBody.IPlacement[] {
    this.drawing.setPose({
      posed: AutoMovieHumanCanonicalBody.display(this.body, pose).posed,
    });
    this.object.updateMatrixWorld(true);
    return AutoMovieHumanCanonicalBody.place(this.body, pose);
  }

  /** Release the drawing. */
  public dispose(): void {
    this.drawing.dispose();
  }
}
