import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMoviePose,
} from "@automovie/interface";
import { AutoMovieHumanPolygon } from "@automovie/render";
import * as THREE from "three";

/*
 * The polygon man of one canonical Human body, drawn by the renderer's polygon
 * builder and posed from canonical poses.
 *
 * The builder reads Human's registered frame, so the drawing takes
 * `AutoMovieHumanCanonicalBody.display` (the T-pose bones and placements
 * reflected back) and sits under a group carrying
 * `AutoMovieHumanCanonicalBody.REFLECTION`, which shows it in the canonical
 * world; three.js reverses winding for that mirrored matrix, so faces keep
 * their orientation. The drawing is the bare polygon body.
 */
export class MotionCaptureFigure {
  /*
   * The figure root, in the canonical world.
   */
  public readonly object: THREE.Group;

  private readonly drawing: AutoMovieHumanPolygon.IDrawing;

  private readonly body: IAutoMovieHumanCanonicalBody.IBody;

  /*
   * Build the drawing of a body.
   * Parameter body: The canonical body.
   * Parameter color: Optional colour of every part.
   */
  public constructor(body: IAutoMovieHumanCanonicalBody.IBody, color?: number) {
    this.body = body;
    const rest: ReturnType<typeof AutoMovieHumanCanonicalBody.display> =
      AutoMovieHumanCanonicalBody.display(body);
    this.drawing = AutoMovieHumanPolygon.build(
      rest,
      color === undefined
        ? {}
        : {
            partColors: Object.fromEntries(
              rest.bones.map((b: IMotionCaptureFigureB): [string, number] => [
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

  /*
   * Pose the drawing.
   * Parameter pose: A canonical pose of the body.
   * Returns: Every Human joint's canonical placement.
   */
  public place(
    pose: IAutoMoviePose,
  ): IAutoMovieHumanCanonicalBody.IPlacement[] {
    this.drawing.setPose({
      posed: AutoMovieHumanCanonicalBody.display(this.body, pose).posed,
    });
    this.object.updateMatrixWorld(true);
    return AutoMovieHumanCanonicalBody.place(this.body, pose);
  }

  /*
   * Release the drawing.
   */
  public dispose(): void {
    this.drawing.dispose();
  }
}

/*
 * The record of `IMotionCaptureFigureB`'s site.
 */
type IMotionCaptureFigureB = { bone: string };
