import {
  type Archetype,
  createClub,
  createSword,
  createWeaponRack,
} from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A weapon rack holds weapons standing in its slots, and a hand takes one out by the weapon's own grip.
 *
 * The rack stands on the floor, its front toward `+Z`, and the performer stands 0.6 m before it facing it. An arming sword stands point down in `slot3`, its point on the slot's floor, and a bat barrel down in `slot2`, its tip on that slot's floor. The right hand takes the sword by its `grip` and lifts it 0.1 m.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Taking the sword from the rack plans.
 * 2. Until the grip closes the sword stays where it stood, within 1 mm, its point on the slot's floor within 1 mm, and the bat stays in its slot throughout.
 * 3. From the grip's close to the film's end the sword keeps its frame in the right hand's frame within 1 mm (the campaign's grip bound), and after the lift its point stands at least 50 mm above the slot's floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Stands real weapons in a real rack, takes one through the public chain and reads the displayed props and the hand; a weapon that floats off its slot, a grip that does not take it or a lift that leaves it fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The slots and the grip are the archetypes' own affordances; the 1 mm is the campaign's grip bound; the 50 mm is half the lift asked.
 * @evidence contracts/development/testing.md#distinguishing-cases A weapon taken and one left, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_archetype_weapons_rack(): void {
  const rack: ReturnType<typeof createWeaponRack> = createWeaponRack();
  const sword: Archetype = createSword({ kind: "armingSword" });
  const bat: Archetype = createClub({ kind: "bat" });
  const down: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };
  const point: IAutoMovieVector3 = {
    x: 0,
    y: sword.dimensions.bladeLength!,
    z: 0,
  };
  const tip: IAutoMovieVector3 = { x: 0, y: bat.dimensions.length!, z: 0 };
  // A weapon turned point down with its lower end on a slot's floor.
  const stood = (
    slot: "slot2" | "slot3",
    end: IAutoMovieVector3,
  ): IHumanProp.IFrame => ({
    position: Vector3.subtract(
      rack.affordance(slot).frame.translation,
      Quaternion.rotateVector(down, end),
    ),
    rotation: down,
  });
  const floor: IAutoMovieVector3 = rack.affordance("slot3").frame.translation;
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "rack",
        laws: [],
        props: [
          HumanObject.prop("rack", rack, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
          HumanObject.prop("sword", sword, stood("slot3", point)),
          HumanObject.prop("bat", bat, stood("slot2", tip)),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0.6 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({ prop: "sword", handle: "grip", hand: "right", lift: 0.1 })
          .stand({ seconds: 0.3 }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const pick: HumanSegment.ISegment = film.segments("a")[1]!;
    const closed: number =
      pick.start +
      (pick.plan.events.find((e): boolean => e.name === "gripClosed")?.share ??
        Number.NaN) *
        pick.plan.duration;
    const end = (
      prop: string,
      local: IAutoMovieVector3,
      seconds: number,
    ): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = film.prop(prop, seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );
    };

    // 2. Standing in the rack until taken.
    let moved: number = 0;
    for (let s: number = 0; s < closed - 0.02; s += 0.1)
      moved = Math.max(
        moved,
        Vector3.length(Vector3.subtract(end("sword", point, s), floor)),
      );
    let left: number = 0;
    for (let s: number = 0; s <= film.duration; s += 0.1)
      left = Math.max(
        left,
        Vector3.length(
          Vector3.subtract(
            end("bat", tip, s),
            rack.affordance("slot2").frame.translation,
          ),
        ),
      );
    if (!(moved <= 0.001 && left <= 0.001))
      complaints.push(
        `${name}: before the grip the sword's point moves ${mm(moved)} mm off its slot's floor and the bat's tip ${mm(left)} mm through the film, within 1 mm expected`,
      );

    // 3. Held and lifted out.
    const relative = (seconds: number): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = film
        .bones("a", seconds)
        .get("rightHand")!;
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(
          film.prop("sword", seconds).position,
          hand.worldPosition,
        ),
      );
    };
    const first: IAutoMovieVector3 = relative(closed + 0.02);
    let slip: number = 0;
    for (let s: number = closed + 0.02; s <= film.duration; s += 0.1)
      slip = Math.max(
        slip,
        Vector3.length(Vector3.subtract(relative(s), first)),
      );
    const raised: number = end("sword", point, film.duration).y - floor.y;
    if (!(slip <= 0.001 && raised >= 0.05))
      complaints.push(
        `${name}: after the grip the sword moves ${mm(slip)} mm in the hand (1 mm) and its point stands ${mm(raised)} mm above the slot's floor (at least 50 mm)`,
      );
  }
  TestValidator.equals("a weapon is taken from its rack", complaints, []);
}
