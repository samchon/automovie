import { strict as assert } from "node:assert";

import { BakedTake } from "../src/baked/BakedTake";
import { SCENES } from "../src/scenes/SCENES";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { SceneTake } from "../src/scenes/SceneTake";
import type { IScene } from "../src/scenes/structures/IScene";
import { TakeCompute } from "../src/takes/package/TakeCompute";
import type { ITake } from "../src/takes/structures/ITake";

/**
 * Play every published take of the named scenes the way the take worker
 * does, at the scene rate through the exact endpoint.
 *
 * The bake computes only a scene's first take, so a seed, body or skill take
 * a page computes on demand is otherwise first played by a visitor. Each take
 * must yield a track the baked format round-trips with its duration intact.
 *
 * Every take is played before the check fails, so one refusal does not hide
 * the state of the others.
 *
 * @param ids The scene ids to play; each must name a listed scene that plays.
 * @throws AssertionError listing each scene and take that did not play, with the packages' refusal.
 */
export function checkSceneTakes(ids: readonly string[]): void {
  const failures: string[] = [];
  for (const id of ids) {
    const scene: IScene | undefined = SCENES.find(
      (candidate: IScene): boolean => candidate.id === id,
    );
    assert(scene?.composition, `${id} is a listed scene with a composition`);
    assert.equal(scene.refusedUntil, undefined, `${id} is marked refused`);
    for (const take of scene.takes) {
      const result: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
        SceneTake.apply(scene.composition, take),
        SCENE_FPS,
      );
      if (!("track" in result)) {
        failures.push(`${id} "${take.label}": ${result.message}`);
        continue;
      }
      const decoded: ITake = BakedTake.decode(BakedTake.encode(result));
      if (decoded.duration !== result.duration)
        failures.push(`${id} "${take.label}": the baked duration changed`);
    }
  }
  assert.deepEqual(failures, [], failures.join("\n"));
}
