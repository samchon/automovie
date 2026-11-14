import { HUMAN_ACTIONS } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundChain } from "../../src/playground/package/PlaygroundChain";
import { PlaygroundObjects } from "../../src/playground/package/PlaygroundObjects";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * A scene's status is read from the installed packages: it plays when they have every piece it composes, waits naming what they lack, and is planned without a composition.
 *
 * Scenarios:
 * 1. A scene of two actions of `HUMAN_ACTIONS` plays.
 * 2. The same scene with an action no table holds waits, naming that action.
 * 3. A scene that places an archetype the package does not export waits naming it; one that places a real archetype plays exactly when `HumanObject` is installed.
 * 4. An action performed over another plays exactly when the chain has `over`.
 * 5. A scene without a composition is planned.
 * 6. A scene of installed pieces whose record marks `refusedUntil` is refused until that issue, and the bake computes it as it computes one that plays; the same mark on a scene with a missing piece still waits, and neither a waiting nor a planned scene is baked.
 */
export function test_website_scene_status(): void {
  const names: string[] = Object.keys(HUMAN_ACTIONS);
  const composition: (
    actions: IPlaygroundComposition.IAction[],
    objects?: IPlaygroundComposition.IObject[],
  ) => IPlaygroundComposition = (
    actions: IPlaygroundComposition.IAction[],
    objects: IPlaygroundComposition.IObject[] = [],
  ): IPlaygroundComposition => ({
    version: 2,
    seed: "status",
    performers: [
      {
        subject: "a",
        body: "m1",
        x: 0,
        z: 0,
        yaw: 0,
        proficiency: "trained",
        actions,
      },
    ],
    mutuals: [],
    objects,
  });
  const scene: (made: IPlaygroundComposition | null) => IScene = (
    made: IPlaygroundComposition | null,
  ): IScene => ({
    id: "status",
    title: "Status",
    summary: "",
    setting: "everyday",
    cast: [{ subject: "a", role: "" }],
    composition: made,
    takes: [],
    camera: { view: "front" },
    needs: [3392],
  });

  // 1. Plays.
  TestValidator.equals(
    "two actions of the vocabulary play",
    SceneStatus.of(
      scene(
        composition([
          { name: names[0]!, params: {} },
          { name: names[1]!, params: {} },
        ]),
      ),
    ),
    { kind: "plays" },
  );

  // 2. An action no table holds.
  TestValidator.equals(
    "an unknown action waits",
    SceneStatus.of(scene(composition([{ name: "levitate", params: {} }]))),
    { kind: "waits", missing: ["the action levitate"] },
  );

  // 3. Objects.
  const ghost: SceneStatus.Status = SceneStatus.of(
    scene(
      composition(
        [{ name: names[0]!, params: {} }],
        [{ subject: "x", producer: "createGhost", x: 0, z: 0, yaw: 0 }],
      ),
    ),
  );
  TestValidator.predicate(
    "an archetype the package lacks is named",
    ghost.kind === "waits" &&
      ghost.missing.includes("the archetype createGhost"),
  );
  TestValidator.equals(
    "a real archetype plays exactly when HumanObject is installed",
    SceneStatus.of(
      scene(
        composition(
          [{ name: names[0]!, params: {} }],
          [{ subject: "x", producer: "createSeat", x: 0, z: 0, yaw: 0 }],
        ),
      ),
    ).kind === "plays",
    PlaygroundObjects.available(),
  );

  // 4. Overlays.
  TestValidator.equals(
    "an overlay plays exactly when the chain has over",
    SceneStatus.of(
      scene(
        composition([
          {
            name: names[0]!,
            params: {},
            over: [{ name: names[1]!, params: {} }],
          },
        ]),
      ),
    ).kind === "plays",
    PlaygroundChain.has("over"),
  );

  // 5. Planned.
  TestValidator.equals(
    "no composition is planned",
    SceneStatus.of(scene(null)),
    { kind: "planned" },
  );

  // 6. Refused until an issue.
  const playable: IPlaygroundComposition = composition([
    { name: names[0]!, params: {} },
  ]);
  const refused: SceneStatus.Status = SceneStatus.of({
    ...scene(playable),
    refusedUntil: 3528,
  });
  TestValidator.equals("a marked scene is refused", refused, {
    kind: "refused",
    until: 3528,
  });
  TestValidator.predicate(
    "a refused scene is baked",
    SceneStatus.bakes(refused) &&
      SceneStatus.bakes(SceneStatus.of(scene(playable))),
  );
  const marked: SceneStatus.Status = SceneStatus.of({
    ...scene(composition([{ name: "levitate", params: {} }])),
    refusedUntil: 3528,
  });
  TestValidator.equals("a marked scene with a missing piece waits", marked, {
    kind: "waits",
    missing: ["the action levitate"],
  });
  TestValidator.predicate(
    "neither a waiting nor a planned scene is baked",
    !SceneStatus.bakes(marked) &&
      !SceneStatus.bakes(SceneStatus.of(scene(null))),
  );
}
