import {
  AutoMovieArchetypeFrame,
  createBoat,
  createCanoe,
  createPullingBoat,
  createRowboat,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `createBoat` builds each boat kind as its named producer does, and each hull
 * seats its crew the way the craft is rowed or paddled.
 *
 * Scenarios, at seed 1038 with id "carrier":
 *
 * 1. A rowboat, a canoe and a launch equal `createRowboat`, `createCanoe` and
 *    `createPullingBoat`.
 * 2. The rowboat's first thwart faces aft (its z axis below -0.99) with the left
 *    oar riding its oarlock; the canoe's faces forward (z above 0.99) with no
 *    oarlock.
 * 3. The launch has `createBoat.LAUNCH.thwarts` thwarts, each facing aft, and no
 *    oarlock.
 */
export function test_unit_archetypes_vehicles_create_boat(): void {
  const id: string = "carrier";
  const seed: number = 1038;
  const rowboat: ReturnType<typeof createBoat> = createRowboat(
    { id, model: "thamesSkiff" },
    seed,
  );
  const canoe: ReturnType<typeof createBoat> = createCanoe({ id }, seed);
  const launch: ReturnType<typeof createBoat> = createPullingBoat({ id }, seed);
  TestValidator.equals(
    "kinds equal their named producers",
    [
      JSON.stringify(
        createBoat({ id, kind: "rowboat", model: "thamesSkiff" }, seed),
      ),
      JSON.stringify(createBoat({ id, kind: "canoe" }, seed)),
      JSON.stringify(createBoat({ id, kind: "launch" }, seed)),
    ],
    [JSON.stringify(rowboat), JSON.stringify(canoe), JSON.stringify(launch)],
  );
  const facing: (contact: IAutoMovieAffordance) => number = (
    contact: IAutoMovieAffordance,
  ): number => AutoMovieArchetypeFrame.axis(contact.frame, "z").z;
  const oarlock: (contact: IAutoMovieAffordance) => boolean = (
    contact: IAutoMovieAffordance,
  ): boolean => contact.id.endsWith("Oarlock");
  TestValidator.predicate(
    "the rower faces aft on oarlocks, the paddler forward without",
    facing(rowboat.affordance("thwart0")) < -0.99 &&
      rowboat.affordance("leftOar").rides === "leftOarlock" &&
      facing(canoe.affordance("thwart0")) > 0.99 &&
      !canoe.affordances.some(oarlock),
  );
  const thwarts: IAutoMovieAffordance[] = launch.affordances.filter(
    (contact: IAutoMovieAffordance): boolean => /^thwart\d+$/u.test(contact.id),
  );
  TestValidator.predicate(
    "every launch thwart faces aft without an oarlock",
    thwarts.length === createBoat.LAUNCH.thwarts &&
      thwarts.every(
        (contact: IAutoMovieAffordance): boolean => facing(contact) < -0.99,
      ) &&
      !launch.affordances.some(oarlock),
  );
}
