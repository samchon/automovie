import {
  type Archetype,
  createClub,
  createScabbard,
  createSword,
  createWeaponLoop,
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
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A weapon is drawn from the carrier worn on the body: a knife from its sheath, a baton from a belt loop and a bat from a back sleeve, each carrier worn on the hips or the chest (`IHumanProp.worn`) with its weapon standing in it grip up, its lower end on the carrier's `mouth` or `socket`.
 *
 * Each weapon is turned point or tip down and worn on the same bone as its carrier, so it sits in it: a knife's shoulder on its sheath's mouth, a baton a hand's breadth below its knob on the loop, a bat's tip on its sleeve's bottom. The right hand takes it by its `grip` and lifts it straight up as far as brings its lower end to the opening, drawing it out. The knife's sheath and the baton's loop hang at the right hip, 0.9 of the shoulders' half width out and 0.08 m ahead of the hips joint; the bat's sleeve stands against the chest's back on the right, its opening 0.1 m below the chest joint, so the bat's grip stands above the right shoulder blade, where a back carry puts it.
 *
 * Scenarios, on the average man and the small woman, one film per carrier:
 * 1. A draw the body can make plans, and one it cannot is refused on `lift`, never lifted less in silence. No stance raises the shoulder above its standing height, so a grip whose lifted place lies higher above the standing shoulder than the arm (upper arm and forearm) and the hand's grip socket together is beyond any draw, and one within the arm less the socket of the shoulder within the arm alone; between them either answer stands, a refusal still on `lift`.
 * 2. Before it the weapon keeps its frame in its bone's frame within 1 mm (the campaign's grip bound): it is worn in its carrier.
 * 3. At `lifted`, where the lift is defined, the weapon's lower end stands at the carrier's opening or above it, within the same 1 mm: it has left the carrier.
 * 4. From the grip's close to the film's end the weapon keeps its frame in the right hand's frame within 1 mm: the hand holds it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Wears real carriers and weapons, draws through the public chain and reads the displayed props and bones; a weapon that stays on the body, stays in its carrier or slips in the hand fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The openings and grips are the archetypes' own affordances; the 1 mm is the campaign's grip bound; the wearing places are the test's own; whether a draw can be made is read from the body's own arm and grip socket against the standing shoulder, not from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases A sheath and a loop on the hips, a sleeve on the back, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and six short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 4 scenarios with their bounds.
 */
export function test_archetype_weapons_draw(): void {
  const down: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const out: number = 0.9 * body.measure.shoulderHalfWidth;
    const knife: Archetype = createSword({ kind: "knife" });
    const sheath: ReturnType<typeof createScabbard> = createScabbard({
      kind: "knife",
      length: 0.2,
    });
    const baton: Archetype = createClub({ kind: "baton" });
    const loop: ReturnType<typeof createWeaponLoop> = createWeaponLoop({
      kind: "belt",
    });
    const bat: Archetype = createClub({ kind: "bat" });
    const sleeve: ReturnType<typeof createWeaponLoop> = createWeaponLoop({
      kind: "back",
    });
    const hand: number = body.measure.hand;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const socket: number = Vector3.length(
      HumanHand.offset(body, "right", "grip").point,
    );
    // Each draw: the carrier, its opening, the carrier's point the weapon
    // rests on, the weapon, its point that rests there, its lower end, the
    // bone, and where the opening is worn.
    const draws: ReadonlyArray<{
      label: string;
      carrier: Archetype;
      opening: IAutoMovieVector3;
      rest: IAutoMovieVector3;
      weapon: Archetype;
      seat: IAutoMovieVector3;
      tip: IAutoMovieVector3;
      bone: "hips" | "chest";
      at: IAutoMovieVector3;
    }> = [
      {
        label: "knife from its sheath",
        carrier: sheath,
        opening: sheath.affordance("mouth").frame.translation,
        rest: sheath.affordance("mouth").frame.translation,
        weapon: knife,
        seat: { x: 0, y: 0, z: 0 },
        tip: { x: 0, y: knife.dimensions.bladeLength!, z: 0 },
        bone: "hips",
        at: { x: -out, y: 0.05, z: 0.08 },
      },
      {
        label: "baton from its belt loop",
        carrier: loop,
        opening: loop.affordance("socket").frame.translation,
        rest: loop.affordance("socket").frame.translation,
        weapon: baton,
        seat: { x: 0, y: hand, z: 0 },
        tip: { x: 0, y: baton.dimensions.length!, z: 0 },
        bone: "hips",
        at: { x: -out, y: 0, z: 0.08 },
      },
      {
        label: "bat from its back sleeve",
        carrier: sleeve,
        opening: sleeve.affordance("socket").frame.translation,
        rest: { x: 0, y: 0, z: 0 },
        weapon: bat,
        seat: { x: 0, y: bat.dimensions.length!, z: 0 },
        tip: { x: 0, y: bat.dimensions.length!, z: 0 },
        bone: "chest",
        at: { x: -0.5 * out, y: -0.1, z: -0.15 },
      },
    ];
    for (const draw of draws) {
      // The lift that brings the weapon's lower end up to the opening, from
      // its rest below it.
      const below: number =
        draw.opening.y - draw.rest.y + Math.abs(draw.tip.y - draw.seat.y);
      // The carrier's origin below its worn opening; the weapon turned point
      // down with its seat on the carrier's rest.
      const carrier: IHumanProp.IFrame = {
        position: Vector3.subtract(draw.at, draw.opening),
        rotation: Quaternion.identity(),
      };
      const weapon: IHumanProp.IFrame = {
        position: Vector3.subtract(
          Vector3.add(carrier.position, draw.rest),
          Quaternion.rotateVector(down, draw.seat),
        ),
        rotation: down,
      };
      const performed = (drawn: boolean): HumanPerformance =>
        new HumanPerformance({
          seed: "draw",
          laws: [],
          props: [
            {
              ...HumanObject.prop("carrier", draw.carrier, {
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
              }),
              worn: { subject: "a", bone: draw.bone, offset: carrier },
            },
            {
              ...HumanObject.prop("weapon", draw.weapon, {
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
              }),
              worn: { subject: "a", bone: draw.bone, offset: weapon },
            },
          ],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: (drawn
            ? HumanChain.subject("a")
                .stand({ seconds: 0.3 })
                .pickUp({
                  prop: "weapon",
                  handle: "grip",
                  hand: "right",
                  lift: below,
                })
                .stand({ seconds: 0.3 })
            : HumanChain.subject("a").stand({ seconds: 0.3 })
          ).node,
        });

      // 1. Whether the body can draw it at all, from the standing shoulder
      // and the worn grip read before the draw.
      const still: HumanPerformance = performed(false);
      const shoulder: IAutoMovieVector3 = still
        .bones("a", 0)
        .get("rightUpperArm")!.worldPosition;
      const carried: IHumanProp.IFrame = still.prop("weapon", 0);
      const grip: IAutoMovieVector3 = Vector3.add(
        carried.position,
        Quaternion.rotateVector(
          carried.rotation,
          draw.weapon.affordance("grip").frame.translation,
        ),
      );
      const lifted: IAutoMovieVector3 = { ...grip, y: grip.y + below };
      const above: number = lifted.y - shoulder.y;
      const beyond: boolean = above - socket > arm;
      const within: boolean =
        Vector3.length(Vector3.subtract(lifted, shoulder)) + socket <= arm;
      let film: HumanPerformance;
      try {
        film = performed(true);
      } catch (error) {
        const refused: boolean =
          error instanceof HumanRefusal &&
          error.kind === "reach" &&
          error.axis === "lift";
        if (within || !refused)
          complaints.push(
            `${name} ${draw.label}: expected ${within ? "to plan" : "to plan or a refusal on lift"}, got ${error instanceof Error ? error.message : String(error)}`,
          );
        continue;
      }
      if (beyond)
        complaints.push(
          `${name} ${draw.label}: its lifted grip is ${mm(above)} mm above the standing shoulder, beyond the arm and the grip socket's ${mm(arm + socket)} mm, yet the draw planned`,
        );
      const pick: HumanSegment.ISegment = film.segments("a")[1]!;
      const event = (instant: string): number =>
        pick.start +
        (pick.plan.events.find((e): boolean => e.name === instant)?.share ??
          Number.NaN) *
          pick.plan.duration;
      const relative = (
        seconds: number,
        bone: "hips" | "chest" | "rightHand",
      ): IAutoMovieVector3 => {
        const b: IAutoMovieResolvedBone = film.bones("a", seconds).get(bone)!;
        return Quaternion.rotateVector(
          Quaternion.inverse(b.worldRotation),
          Vector3.subtract(
            film.prop("weapon", seconds).position,
            b.worldPosition,
          ),
        );
      };
      const drift = (
        from: number,
        to: number,
        bone: "hips" | "chest" | "rightHand",
      ): number => {
        const first: IAutoMovieVector3 = relative(from, bone);
        let most: number = 0;
        for (let s: number = from; s <= to; s += 0.1)
          most = Math.max(
            most,
            Vector3.length(Vector3.subtract(relative(s, bone), first)),
          );
        return most;
      };

      // 2. Worn in its carrier before the draw.
      const worn: number = drift(0, pick.start, draw.bone);
      if (!(worn <= 0.001))
        complaints.push(
          `${name} ${draw.label}: before the draw the weapon moves ${mm(worn)} mm on its bone, within 1 mm expected`,
        );

      // 3. Out of the carrier at `lifted`.
      const after: number = event("lifted");
      const placed = (
        prop: string,
        local: IAutoMovieVector3,
      ): IAutoMovieVector3 => {
        const frame: IHumanProp.IFrame = film.prop(prop, after);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, local),
        );
      };
      const tip: IAutoMovieVector3 = placed("weapon", draw.tip);
      const mouth: IAutoMovieVector3 = placed("carrier", draw.opening);
      if (!(tip.y >= mouth.y - 0.001))
        complaints.push(
          `${name} ${draw.label}: at lifted the weapon's lower end is ${mm(tip.y - mouth.y)} mm above the carrier's opening, at it or above within 1 mm expected`,
        );

      // 4. Held from the grip's close on.
      const closed: number = event("gripClosed");
      const held: number = drift(closed + 0.02, film.duration, "rightHand");
      if (!(held <= 0.001))
        complaints.push(
          `${name} ${draw.label}: after the grip the weapon moves ${mm(held)} mm in the right hand's frame, within 1 mm expected`,
        );
    }
  }
  TestValidator.equals(
    "a weapon is drawn from its worn carrier",
    complaints,
    [],
  );
}
