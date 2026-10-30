import type { IAutoMovieHumanVisual } from "@automovie/viewer/human";
import * as THREE from "three";

import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanPose } from "../../../human/src/structures/pose/IAutoMovieHumanPose";
import { reportAutoMovieResourceRetirement } from "../../../viewer/src/reportAutoMovieResourceRetirement";
import { buildHumanCartoonFace } from "./buildHumanCartoonFace";
import type { buildHumanPolygon } from "./buildHumanPolygon";
import type { buildHumanStickman } from "./buildHumanStickman";

/**
 * Transfer the existing playground drawings into the public structural sink.
 * No geometry is copied or rebuilt here. Builder-specific names and stickman
 * child ordering stay beside those builders rather than in the public facade.
 * Optional hint drawings contribute their original bone bindings and disposer.
 * Face updates build a replacement before retiring the previous drawing;
 * explicit callback inputs are already independent facade snapshots.
 * Input/build refusal leaves the current face intact. Retirement failure makes
 * face updates terminal, cleans the replacement once and remains a disposal cause.
 *
 * @evidence contracts/common.md#principled-implementation Original polygon/section groups bind by their declared bone names, and the existing stickman builder's documented rest-bone order supplies its groups; all geometry and face construction remain with those owners.
 * @evidence contracts/common.md#clear-and-simple-design One playground adapter exposes structural slots and explicit face/disposal callbacks without exporting the example builders or choreography as library content.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No new body form, clinical bone cast, animation sampler or renderer is constructed; only a container and explicit references assemble existing drawings.
 * @evidence contracts/common.md#meaningful-documentation States transfer ownership, builder identity premises, immutable face replacement and sticky disposal failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Construction scans bounded builder groups per rest bone; explicit face construction has its existing drawing cost and no frame callback is introduced.
 * @evidence contracts/performance.md#reuse-equivalent-work One assembled drawing and placement list serve every pose; face geometry changes only on explicit updates, with unchanged body buffers retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns polygon/stickman/hint builders and the current face until one attempted disposal; a failed replacement retains at most two uncertain face owners and its original cause, refuses further updates, and disposal attempts all remaining owners without retrying those faces.
 */
export function createHumanStickmanVisual(
  options: createHumanStickmanVisual.IOptions,
): IAutoMovieHumanVisual {
  const polygon: ReturnType<typeof buildHumanPolygon> | undefined =
    options.polygon;
  const stickman: ReturnType<typeof buildHumanStickman> | undefined =
    options.stickman;
  const hints: createHumanStickmanVisual.IOptions["hints"] = options.hints;
  const retireHints: (() => void) | undefined = hints?.dispose.bind(hints);
  const faceEnabled: boolean = options.face !== false;
  const object: THREE.Group = new THREE.Group();
  object.name = "human.drawings";
  const bindings: { bone: string; objects: THREE.Object3D[] }[] = [];
  if (
    stickman !== undefined &&
    stickman.object.children.length !== options.rest.bones.length
  )
    throw new Error("Stickman binding does not match its rest prototype");
  for (const [index, bone] of options.rest.bones.entries()) {
    const objects: THREE.Object3D[] = [];
    for (const group of [polygon?.surface, polygon?.sections]) {
      const suffix: string = group === polygon?.sections ? ".sections" : "";
      const target: THREE.Object3D | undefined = group?.children.find(
        (child: THREE.Object3D): boolean =>
          child.name === `human.polygon.${bone.bone}${suffix}`,
      );
      if (target !== undefined) objects.push(target);
    }
    if (stickman !== undefined) objects.push(stickman.object.children[index]!);
    if (objects.length !== 0) bindings.push({ bone: bone.bone, objects });
  }
  if (polygon !== undefined) object.add(polygon.object);
  if (stickman !== undefined) object.add(stickman.object);
  if (hints !== undefined) {
    object.add(hints.object);
    for (const slot of hints.bindings)
      bindings.push({ bone: slot.bone, objects: [...slot.objects] });
  }
  let face: ReturnType<typeof buildHumanCartoonFace> | undefined;
  let disposed: boolean = false;
  let replacementFailure: { error: unknown } | undefined;
  const uncertainFaces: Set<ReturnType<typeof buildHumanCartoonFace>> =
    new Set();
  let failure: { error: unknown } | undefined;
  return {
    object,
    bindings,
    updateFace: (
      expression: IAutoMovieHumanExpression,
      head: IAutoMovieHumanPose["head"],
    ): readonly string[] => {
      if (disposed) throw new Error("Human drawing is disposed");
      if (replacementFailure !== undefined) throw replacementFailure.error;
      if (!faceEnabled || polygon === undefined) return [];
      const next: ReturnType<typeof buildHumanCartoonFace> =
        buildHumanCartoonFace(polygon.head, expression, head);
      const previous: typeof face = face;
      face = undefined;
      try {
        reportAutoMovieResourceRetirement([
          (): void => {
            previous?.object.removeFromParent();
          },
          (): void => {
            previous?.dispose();
          },
        ]);
        polygon.head.object.add(next.object);
        face = next;
      } catch (error: unknown) {
        if (previous !== undefined) uncertainFaces.add(previous);
        uncertainFaces.add(next);
        try {
          reportAutoMovieResourceRetirement(
            [
              (): void => {
                next.object.removeFromParent();
              },
              (): void => {
                next.dispose();
              },
            ],
            { error },
          );
        } catch (cleanup: unknown) {
          replacementFailure = { error: cleanup };
          throw cleanup;
        }
        throw error;
      }
      return [...next.unsupported];
    },
    dispose: (): void => {
      if (failure !== undefined) throw failure.error;
      if (disposed) return;
      disposed = true;
      const current: typeof face = face;
      face = undefined;
      if (current !== undefined) uncertainFaces.add(current);
      try {
        reportAutoMovieResourceRetirement(
          [
            (): void => {
              current?.object.removeFromParent();
            },
            (): void => {
              current?.dispose();
            },
            (): void => {
              polygon?.dispose();
            },
            (): void => {
              stickman?.dispose();
            },
            (): void => {
              retireHints?.();
            },
            (): void => {
              object.removeFromParent();
            },
            (): void => {
              object.clear();
            },
            (): void => {
              bindings.length = 0;
            },
          ],
          replacementFailure,
        );
        uncertainFaces.clear();
      } catch (error: unknown) {
        failure = { error };
        throw error;
      }
    },
  };
}

/** Existing builder inputs transferred to the playground's structural adapter.
 *
 * @evidence contracts/common.md#principled-implementation IOptions names the same rest graph and original polygon, stickman and optional hint owners consumed by this adapter.
 * @evidence contracts/common.md#clear-and-simple-design The merged namespace keeps playground builder types beside their structural binding adapter; the public facade sees only its visual contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It introduces no geometry copy, bone normalization or replacement evaluator; omitted drawings remain omitted.
 * @evidence contracts/common.md#meaningful-documentation Documents fixed-rest identity, transferred drawing resources and the optional face suppression switch.
 * @evidence contracts/performance.md#efficient-algorithms The namespace is erased; assembly cost belongs to the adapter's scans of actual bones and drawing groups.
 * @evidence contracts/performance.md#reuse-equivalent-work Types reference existing builder return shapes instead of duplicating their resource or head-surface contracts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Type declarations acquire no resource; supplied builders transfer to the adapter and its terminal disposer.
 */
export namespace createHumanStickmanVisual {
  /** Geometry stays in its original builders; this adapter supplies only placement references. */
  export interface IOptions {
    /** Matching fixed rest graph, used only for explicit placement identities. */
    rest: Skeleton.IOutput;

    /** Optional original polygon and section drawing. */
    polygon?: ReturnType<typeof buildHumanPolygon>;

    /** Optional original rod-and-ball drawing of the same rest graph. */
    stickman?: ReturnType<typeof buildHumanStickman>;

    /** Optional owned joint hints using the same actual bone identities and local frames. */
    hints?: Pick<IAutoMovieHumanVisual, "object" | "bindings" | "dispose">;

    /** False omits the optional cartoon drawing. */
    face?: boolean;
  }
}
