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
 * The figure stays deliberately simple: a fix corrects a wrong value within
 * the same primitives, never adds geometry, detail or realism, because its job
 * is a cheap, deterministic silhouette for motion checks and diffusion hints.
 *
 * @returns The figure's root object, its drawing, the pose port and disposal.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A posed polygon figure with its cartoon face: the original polygon drawing () built once from the evaluator's neutral output, and a face () on its actual head front) and documents the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A posed polygon figure with its cartoon face: the original polygon drawing () built once from the evaluator's neutral output, and a face () on its actual head front) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `buildHumanPolygon`, `input.evaluate`, `drawing.setPose`, `JSON.stringify`, `buildHumanCartoonFace`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 45 lines and 6 top-level statements that reuses `buildHumanPolygon`, `input.evaluate`, `drawing.setPose`, `JSON.stringify`, `buildHumanCartoonFace` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
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
/**
 * Companion types of {@link createAutoMovieHumanPolygonFigure}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 1 member (`IFigure`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `createAutoMovieHumanPolygonFigure` in packages/render/src/scene/human-polygon/createAutoMovieHumanPolygonFigure.ts; its surface is the 1 member listed and the text shows 4 other files naming it, mostly movies (2), packages/render (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
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
