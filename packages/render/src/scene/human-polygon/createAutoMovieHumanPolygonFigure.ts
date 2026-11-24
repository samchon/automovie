import type {
  IAutoMovieDialogueMouth,
  IAutoMovieHumanSkeleton,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieDialogueMouthFigure } from "../IAutoMovieDialogueMouthFigure.js";
import { bindAutoMovieDialogueMouth } from "../bindAutoMovieDialogueMouth.js";
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
 * structural function (a Human skeleton evaluator fits); the Viewer imports no
 * figure generator.
 *
 * The figure's root is bound as a dialogue-mouth figure
 * (`bindAutoMovieDialogueMouth`) that takes the jaw opening: under a speaking
 * actor's scene node, the draw page opens the cartoon face's jaw to the actor's
 * envelope jaw over the head pose last placed, and restores that pose when the
 * actor stops speaking. The face has no viseme shapes until #3185, so it shows
 * the jaw alone.
 *
 * The figure stays deliberately simple: a fix corrects a wrong value within the
 * same primitives, never adds geometry, detail or realism, because its job is a
 * cheap, deterministic silhouette for motion checks and diffusion hints.
 *
 * @returns The figure's root object, its drawing, the pose port and disposal.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose, when `place` rebuilds the face, how a dialogue mouth reaches the face and what it shows, and documents the returned value.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the drawing once from the neutral evaluation and keys the face by the value of its head pose and expression, so equal inputs reuse the built face. A dialogue mouth replaces only the head pose's jaw opening, in millimetres at the incisors as `IAutoMovieHumanJawPose.opening` measures it, and keeps the authored eyes, protrusion, lateral excursion and expression; one throw site refuses a disposed figure.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory that reuses `buildHumanPolygon` and `buildHumanCartoonFace` from their owners; `place` and the bound mouth share one face rebuild, so the authored and the speaking face are built the same way.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No branch is keyed on a consumer or fixture; a mouth before the first placement shows nothing rather than an invented head pose.
 * @evidence contracts/development/implementation.md#efficient-algorithms Building the drawing is linear in the evaluated bones; each `place` or mouth costs one stringified key and, when the key changes, one face rebuild, so a speaking actor rebuilds the face on each frame whose jaw differs. No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The only reuse is the built face, kept while its key is unchanged, which is decided by value.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The figure holds one drawing and at most one face; a rebuild disposes the face it replaces, and `dispose` releases both once. The mouth binding is a weak entry keyed by the drawing's root, so it adds nothing that outlives the figure.
 */
export function createAutoMovieHumanPolygonFigure(input: {
  /**
   * Evaluate a pose to rest bones and placements; called once with the neutral
   * pose.
   */ evaluate: (
    pose: Readonly<Record<string, never>>,
  ) => Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">;
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

  // The authored face as last placed, which a dialogue mouth layers over.
  let placed: boolean = false;
  let authoredHead: AutoMovieHumanCartoon.IHeadPose | undefined;
  let authoredExpression: AutoMovieHumanCartoon.IExpression | undefined;
  const showFace: (
    head: AutoMovieHumanCartoon.IHeadPose | undefined,
    expression: AutoMovieHumanCartoon.IExpression | undefined,
  ) => void = (
    head: AutoMovieHumanCartoon.IHeadPose | undefined,
    expression: AutoMovieHumanCartoon.IExpression | undefined,
  ): void => {
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
  };
  const figure: createAutoMovieHumanPolygonFigure.IFigure = {
    object: drawing.object,
    drawing,
    unsupported: [],
    place: (
      output: Pick<
        Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
        "posed"
      >,
      head?: AutoMovieHumanCartoon.IHeadPose,
      expression?: AutoMovieHumanCartoon.IExpression,
    ): void => {
      if (disposed) throw new Error("The polygon figure is disposed");
      drawing.setPose(output);
      placed = true;
      authoredHead = head;
      authoredExpression = expression;
      showFace(head, expression);
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

  // The dialogue mouth opens the jaw over the authored face; the cartoon face
  // has no viseme shapes, so the polygon man takes the jaw alone (#3185).
  bindAutoMovieDialogueMouth(drawing.object, {
    show: (
      mouth: IAutoMovieDialogueMouth | null,
    ): IAutoMovieDialogueMouthFigure.IShown | null => {
      if (disposed || !placed) return null;
      if (mouth === null) {
        showFace(authoredHead, authoredExpression);
        return null;
      }
      showFace(
        {
          ...authoredHead,
          jaw: { ...authoredHead?.jaw, opening: mouth.jaw },
        },
        authoredExpression,
      );
      return { jaw: mouth.jaw };
    },
  });
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

    /**
     * Requested face fields outside the cartoon's supported subset, after the
     * latest rebuild.
     */
    unsupported: readonly string[];

    /**
     * Apply an evaluated pose, and the face for a head pose and expression.
     *
     * @param output Evaluated placements.
     * @param head Optional eye, lid and jaw pose.
     * @param expression Optional facial expression.
     */
    place(
      output: Pick<
        Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
        "posed"
      >,
      head?: AutoMovieHumanCartoon.IHeadPose,
      expression?: AutoMovieHumanCartoon.IExpression,
    ): void;

    /** Release the face and the drawing once; later `place` calls throw. */
    dispose(): void;
  }
}
