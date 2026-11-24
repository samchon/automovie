import { stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * `stageScene` joins a script's cast to a staging plan and refuses every
 * contradiction between them before any shot is performed.
 *
 * Fixture: a script casting `knightA` and `knightB`, and a staging that places
 * both, with one camera and one sun.
 *
 * Scenarios:
 *
 * 1. Renaming the camera node to `knightA`, the id of a placed actor, is a type
 *    finding at `$input.cameras[0].node`: actors, cameras and lights share one
 *    id namespace.
 * 2. The script casting `knightA` twice with conflicting model references is a
 *    type finding at `$script.cast[1].node`.
 * 3. A sun of intensity -1 is a range finding at `$input.lights[0].intensity`; a
 *    fill light with the zero direction is a range finding at
 *    `$input.lights[1].direction`.
 * 4. `knightA` attached to itself is a type finding at
 *    `$input.actors[0].attach.parent`; `knightB` attached to the unplaced
 *    `horse` is a type finding at `$input.actors[1].attach.parent` carrying
 *    "horse".
 * 5. Staging only `knightA` leaves `knightB` unplaced: a type finding at
 *    `$input.actors` carrying "knightB".
 * 6. Staging a third node `ghost` the cast never mentions is a type finding at
 *    `$input.actors[2].node` carrying "ghost".
 */
export function test_unit_engine_film_stage_scene(): void {
  const base = makeStagingWrite();

  const clash = stageScene(
    makeScriptWrite(),
    makeStagingWrite({ cameras: [{ ...base.cameras[0]!, node: "knightA" }] }),
  );
  TestValidator.equals("namespace fails", clash.success, false);
  TestValidator.predicate(
    "namespace path",
    clash.success === false &&
      hasViolation(clash, "type", "$input.cameras[0].node"),
  );

  const twice = stageScene(
    makeScriptWrite({
      cast: [
        {
          node: "knightA",
          character: "the imported challenger",
          modelRef: "stickman",
        },
        {
          node: "knightA",
          character: "the generated impostor",
          modelRef: null,
        },
        { node: "knightB", character: "the champion", modelRef: null },
      ],
    }),
    makeStagingWrite(),
  );
  TestValidator.equals("duplicate cast fails", twice.success, false);
  TestValidator.predicate(
    "duplicate cast path",
    twice.success === false &&
      hasViolation(twice, "type", "$script.cast[1].node"),
  );

  const lit = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      lights: [
        { ...base.lights[0]!, intensity: -1 },
        {
          node: "void",
          role: "fill",
          direction: { x: 0, y: 0, z: 0 },
          intensity: 0.5,
        },
      ],
    }),
  );
  TestValidator.equals("lights fail", lit.success, false);
  TestValidator.predicate(
    "intensity",
    lit.success === false &&
      hasViolation(lit, "range", "$input.lights[0].intensity"),
  );
  TestValidator.predicate(
    "direction",
    lit.success === false &&
      hasViolation(lit, "range", "$input.lights[1].direction"),
  );

  const mounted = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        {
          node: "knightA",
          position: { x: 0, y: 0, z: 0 },
          facingDeg: 0,
          attach: { parent: "knightA", bone: "chest" },
        },
        {
          node: "knightB",
          position: { x: 0, y: 0, z: 0.7 },
          facingDeg: 180,
          attach: { parent: "horse", bone: "hips" },
        },
      ],
    }),
  );
  TestValidator.equals("mounts fail", mounted.success, false);
  TestValidator.predicate(
    "self mount",
    mounted.success === false &&
      hasViolation(mounted, "type", "$input.actors[0].attach.parent"),
  );
  TestValidator.predicate(
    "dangling parent",
    mounted.success === false &&
      hasViolation(mounted, "type", "$input.actors[1].attach.parent"),
  );
  TestValidator.predicate(
    "names horse",
    mounted.success === false &&
      mounted.violations.some((v) => v.value === "horse"),
  );

  const lonely = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      ],
    }),
  );
  TestValidator.equals("unplaced fails", lonely.success, false);
  TestValidator.predicate(
    "unplaced path",
    lonely.success === false && hasViolation(lonely, "type", "$input.actors"),
  );
  TestValidator.predicate(
    "names knightB",
    lonely.success === false &&
      lonely.violations.some((v) => v.value === "knightB"),
  );

  const stranger = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        ...base.actors,
        { node: "ghost", position: { x: 1, y: 0, z: 1 }, facingDeg: 0 },
      ],
    }),
  );
  TestValidator.equals("stranger fails", stranger.success, false);
  TestValidator.predicate(
    "stranger path",
    stranger.success === false &&
      hasViolation(stranger, "type", "$input.actors[2].node"),
  );
  TestValidator.predicate(
    "names ghost",
    stranger.success === false &&
      stranger.violations.some((v) => v.value === "ghost"),
  );
}
