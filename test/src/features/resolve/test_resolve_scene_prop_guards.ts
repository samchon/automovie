import {
  type IAutoMovieModel,
  type IAutoMovieNode,
  type IAutoMoviePropSpec,
  IAutoMovieScene,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sceneToNodes } from "../../../../packages/engine/src/resolve/sceneToNodes";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
import { createModel } from "../internal/createModel";
import { namedFacts } from "../internal/namedFacts";
import { throwsError } from "../internal/throwsError";

const scene: (
  placements: ReadonlyArray<readonly [string, string]>,
) => IAutoMovieScene = (
  placements: ReadonlyArray<readonly [string, string]>,
): IAutoMovieScene => ({
  id: "scene-pg",
  name: null,
  nodes: placements.map(
    ([id, model]: readonly [string, string]): {
      id: string;
      model: string;
      transform: IAutoMovieTransform;
      motion: null;
      pose: null;
    } => ({
      id,
      model,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      motion: null,
      pose: null,
    }),
  ),
  cameras: [],
  lights: [],
});

/**
 * With either registry supplied, each placement must resolve in the model/prop union without contradictory ownership. Omitting both registries permits placement-only lowering.
 *
 * Scenarios:
 *
 * 1. A mixed scene resolves: the door through `props`, the actor through `models`
 *    and both subtrees lower into one graph (the positive twin).
 * 2. An id in both registries throws naming the contradiction.
 * 3. With only `props` supplied, a placement missing from the union throws: the
 *    union rule, not a silent partial lowering.
 * 4. Both registries omitted → placements-only lowering, no throw (the legacy
 *    twin).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sceneToNodes with model/prop registries and observes accepted placement/articulation lowering plus refusal of contradictory or missing registry joins.
 * @evidence contracts/testing.md#independent-expectations Authored placement.model identifies exactly one source registry, so a duplicate resolution contradicts ownership and an unresolved required reference cannot supply a subtree; expected names come from the existing door fixture.
 * @evidence contracts/testing.md#distinguishing-cases Existing model/prop, missing and contradictory registry neighbors separate valid lowering from silent registry preference; articulation world transforms and profiles belong to lowering/frame cases.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_scene_prop_guards entry synchronously invokes actual portable lowering with the canonical existing door provider, without importing another test entry or starting a host.
 */
export function test_resolve_scene_prop_guards(): void {
  const door: IAutoMoviePropSpec = createDoorPropSpec();
  const hero: IAutoMovieModel = { ...createModel(), id: "hero" };

  const mixed: IAutoMovieNode[] = sceneToNodes({
    scene: scene([
      ["frontDoor", "door"],
      ["knight", "hero"],
    ]),
    props: { door },
    models: { hero },
  });
  TestValidator.equals(
    "a mixed scene lowers both subtrees into one graph",
    namedFacts([
      [
        "mixedSomeNode",
        (): boolean =>
          mixed.some(
            (node: IAutoMovieNode): boolean => node.id === "frontDoor/hinge",
          ),
      ],
      [
        "mixedSomeNode2",
        (): boolean =>
          mixed.some(
            (node: IAutoMovieNode): boolean => node.id === "knight/hips",
          ),
      ],
    ]),
    { mixedSomeNode: true, mixedSomeNode2: true },
  );

  TestValidator.predicate(
    "an id in both registries throws the contradiction",
    throwsError(
      (): IAutoMovieNode[] =>
        sceneToNodes({
          scene: scene([["frontDoor", "door"]]),
          props: { door },
          models: { door: { ...createModel(null), id: "door" } },
        }),
      ["BOTH", "door", "frontDoor"],
    ),
  );

  TestValidator.predicate(
    "a placement outside the union throws",
    throwsError(
      (): IAutoMovieNode[] =>
        sceneToNodes({
          scene: scene([
            ["frontDoor", "door"],
            ["knight", "hero"],
          ]),
          props: { door },
        }),
      ["hero", "knight", "scene-pg"],
    ),
  );

  TestValidator.equals(
    "both registries omitted lowers placements only",
    sceneToNodes({ scene: scene([["frontDoor", "door"]]) }).length,
    1,
  );
}
