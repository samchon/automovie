import type { IAutoMovieHumanSkeleton } from "@automovie/interface";

import type { AutoMovieRenderHumanCartoon } from "../../AutoMovieRenderHumanCartoon";
import type { AutoMovieRenderHumanPolygon } from "../../AutoMovieRenderHumanPolygon";
import { buildHumanCartoonFace } from "./buildHumanCartoonFace";
import { buildHumanPolygon } from "./buildHumanPolygon";

/*
 * A posed polygon figure with its cartoon face: the original polygon drawing
 * (AutoMovieRenderHumanPolygon.build) built once from the evaluator's neutral output,
 * and a face (AutoMovieRenderHumanCartoon.buildFace) on its actual head front.
 *
 * `place` applies an evaluated pose to the existing groups and rebuilds the
 * face only when the head pose or expression changes by value, disposing the
 * previous face, so a held expression costs no geometry. The evaluator is a
 * structural function (a Human skeleton evaluator fits); the Viewer imports no
 * figure generator.
 *
 * The figure stays deliberately simple: a fix corrects a wrong value within the
 * same primitives, never adds geometry, detail or realism, because its job is a
 * cheap, deterministic silhouette for motion checks and diffusion hints.
 * Returns: The figure's root object, its drawing, the pose port and disposal.
 */
export function createHumanPolygonFigure(input: {
  /*
   * Evaluate a pose to rest bones and placements; called once with the neutral
   * pose.
   */ evaluate: (
    pose: Readonly<Record<string, never>>,
  ) => Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">;
  /*
   * RGB overrides by emitted bone.
   */ partColors?: Readonly<
    Record<string, number>
  >;
}): AutoMovieRenderHumanPolygon.IFigure {
  const drawing: AutoMovieRenderHumanPolygon.IDrawing = buildHumanPolygon(
    input.evaluate({}),
    input.partColors === undefined ? {} : { partColors: input.partColors },
  );
  let face: ReturnType<typeof buildHumanCartoonFace> | null = null;
  let key: string | null = null;
  let disposed: boolean = false;
  const figure: AutoMovieRenderHumanPolygon.IFigure = {
    object: drawing.object,
    drawing,
    unsupported: [],
    place: (
      output: Pick<
        Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
        "posed"
      >,
      head?: AutoMovieRenderHumanCartoon.IHeadPose,
      expression?: AutoMovieRenderHumanCartoon.IExpression,
    ): void => {
      if (disposed) throw new Error("The polygon figure is disposed");
      drawing.setPose(output);
      const next: string = JSON.stringify([head ?? null, expression ?? null]);
      if (next === key) return;
      const built: ReturnType<typeof buildHumanCartoonFace> =
        buildHumanCartoonFace(drawing.head, expression, head);
      if (face !== null) {
        drawing.head.object.remove(face.object);
        face.dispose();
      }
      face = built;
      key = next;
      drawing.head.object.add(built.object);
      figure.unsupported = built.unsupported;
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      if (face !== null) {
        drawing.head.object.remove(face.object);
        face.dispose();
        face = null;
      }
      drawing.dispose();
    },
  };
  return figure;
}
