import type * as THREE from "three";

import type { AutoMovieHumanCartoon } from "./AutoMovieHumanCartoon.js";
import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import { buildHumanCartoonFace } from "./buildHumanCartoonFace.js";
import { buildHumanPolygon } from "./buildHumanPolygon.js";

/**
 * A posed polygon figure with its cartoon face: the original polygon drawing
 * ({@link buildHumanPolygon}) built once from the evaluator's neutral output,
 * and a face ({@link buildHumanCartoonFace}) on its actual head front.
 *
 * `place` applies an evaluated pose to the existing groups and rebuilds the
 * face only when the head pose or expression changes by value, disposing the
 * previous face, so a held expression costs no geometry. The evaluator is a
 * structural function (a Human skeleton evaluator fits); the Viewer imports
 * no figure generator.
 *
 * @returns The figure's root object, its drawing, the pose port and disposal.
 */
export function createAutoMovieHumanPolygonFigure(input: {
  /** Evaluate a pose to rest bones and placements; called once with the neutral pose. */ evaluate: (
    pose: Readonly<Record<string, never>>,
  ) => AutoMovieHumanPolygon.IInput;
  /** RGB overrides by emitted bone. */ partColors?: Readonly<
    Record<string, number>
  >;
}): createAutoMovieHumanPolygonFigure.IFigure {
  const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(
    input.evaluate({}),
    input.partColors === undefined ? {} : { partColors: input.partColors },
  );
  let face: ReturnType<typeof buildHumanCartoonFace> | null = null;
  let key: string | null = null;
  let disposed: boolean = false;
  const figure: createAutoMovieHumanPolygonFigure.IFigure = {
    object: drawing.object,
    drawing,
    unsupported: [],
    place: (
      output: Pick<AutoMovieHumanPolygon.IInput, "posed">,
      head?: AutoMovieHumanCartoon.IHeadPose,
      expression?: AutoMovieHumanCartoon.IExpression,
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
/** Companion types of {@link createAutoMovieHumanPolygonFigure}. */
export namespace createAutoMovieHumanPolygonFigure {
  /** A posed polygon figure. */
  export interface IFigure {
    /** The figure's root; the host places the actor through its parent. */
    readonly object: THREE.Group;

    /** The underlying drawing, for colours, bone groups and attachments. */
    readonly drawing: AutoMovieHumanPolygon.IDrawing;

    /** Requested face fields outside the cartoon's supported subset, after the latest rebuild. */
    unsupported: readonly string[];

    /**
     * Apply an evaluated pose, and the face for a head pose and expression.
     *
     * @param output Evaluated placements.
     * @param head Optional eye, lid and jaw pose.
     * @param expression Optional facial expression.
     */
    place(
      output: Pick<AutoMovieHumanPolygon.IInput, "posed">,
      head?: AutoMovieHumanCartoon.IHeadPose,
      expression?: AutoMovieHumanCartoon.IExpression,
    ): void;

    /** Release the face and the drawing once; later `place` calls throw. */
    dispose(): void;
  }
}
