import { createPlyoBox } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanGymnastics,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A front handspring and a handspring vault turn the body over its hands
 * and fly it to its feet: on the average man and on the small woman, the
 * hands come down on the floor or on the box's top and stay there, the body
 * then flies with its centre of mass falling under gravity alone, and it
 * lands upright on both feet, facing as it began, the vault beyond the box.
 * A box that is not where the hands come down is refused.
 *
 * The bounds are the campaign's (5 mm on a planted support, 15 mm on a
 * contact at its event) and gravity, 9.81 m/s², which a ballistic centre's
 * vertical acceleration equals; the hands' height is a tenth of the stature
 * above their surface, a laid hand's wrist with room. The box stands where
 * the floor handspring of the same body puts its hands, which is where a
 * coach would stand it; a raised surface brings the hands down a little
 * nearer, inside the box's top.
 *
 * Scenarios, for each of the two bodies:
 * 1. A front handspring out of standing: at `handsDown` both wrists are
 *    within a tenth of the stature of the floor; through each hand's window
 *    the wrist stays within 5 mm; halfway between `release` and
 *    `touchdown` every sole and wrist is above the floor and the displayed
 *    centre of mass accelerates down at 9.81 m/s² within 0.1; at the end
 *    both soles are within 15 mm of the floor, the head is above the hips
 *    by more than 0.3 of the stature and the hips face as they began
 *    (0.99 at least).
 * 2. A handspring vault over a 0.508 m plyometric box stood there: the
 *    same, with the wrists at `handsDown` above the box's top by no more
 *    than a tenth of the stature, and at the end the hips beyond the box's
 *    far edge.
 * 3. The same vault with the box 1 m farther on is refused as a `reach`
 *    refusal on `on`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain with a real archetype as the prop and reads displayed joints and the displayed centre of mass; hands that slide or miss their surface, a flight that is not ballistic, a landing off the feet or turned fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations Gravity, the campaign's bounds, the box's own affordance and the body's stature; the box's place is read from the floor run's displayed wrists, not from the law. Limitation: whether the legs clear the box's near edge is not read.
 * @evidence contracts/development/testing.md#distinguishing-cases The floor and a raised surface, and a surface off the hands' path, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men, one archetype and three films each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and their basis, how the box is placed and the 3 scenarios.
 */
export function test_human_motion_gymnastics_airborne(): void {
  const box: ReturnType<typeof createPlyoBox> = createPlyoBox({
    height: 0.508,
  });
  const top: number = 0.508;
  const depth: number = box.dimensions.depth!;
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const perform = (
      row: "frontHandspring" | "handspringVault",
      place?: IAutoMovieVector3,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "handspring",
        laws: [HumanGymnastics[row]],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props:
          place === undefined
            ? []
            : [
                HumanObject.prop("box", box, {
                  position: place,
                  rotation: Quaternion.identity(),
                }),
              ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered(row, place === undefined ? {} : { on: "box" }).node,
      });

    // Read one film; returns the hands' middle at `handsDown` and the hips at the end.
    const read = (
      label: string,
      film: HumanPerformance,
      row: string,
      surface: number,
    ): { hands: IAutoMovieVector3; hips: IAutoMovieVector3 } => {
      const reader: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      const segment: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
      const at = (event: string): number =>
        segment.start +
        (segment.plan.events.find((e): boolean => e.name === event)?.share ??
          Number.NaN) *
          segment.plan.duration;
      const joint = (
        seconds: number,
        bone: AutoMovieHumanoidBone,
      ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);

      // The hands on their surface, and still while they bear.
      const down: number = at("handsDown");
      for (const bone of ["leftHand", "rightHand"] as const) {
        const over: number = joint(down, bone).y - surface;
        if (!(over >= -0.015 && over <= 0.1 * stature))
          complaints.push(
            `${label}: at handsDown the ${bone} is ${over.toFixed(3)} m above its surface, 0 to ${(0.1 * stature).toFixed(3)} m expected`,
          );
      }
      for (const window of segment.plan.contacts.filter(
        (w: IHumanContactWindow): boolean => w.part.endsWith("Hand"),
      )) {
        const bone: AutoMovieHumanoidBone =
          window.part as AutoMovieHumanoidBone;
        const share = (s: number): number =>
          segment.start + s * segment.plan.duration;
        const first: IAutoMovieVector3 = joint(share(window.from), bone);
        for (const s of [(window.from + window.to) / 2, window.to]) {
          const slid: number =
            1000 * Vector3.length(Vector3.subtract(joint(share(s), bone), first));
          if (!(slid <= 5))
            complaints.push(
              `${label}: the bearing ${bone} moves ${slid.toFixed(1)} mm while it bears, 5 mm at most expected`,
            );
        }
      }

      // The flight: off the floor, its centre ballistic.
      const middle: number = (at("release") + at("touchdown")) / 2;
      for (const side of ["left", "right"] as const) {
        const sole: number = HumanSignature.sole(reader, middle, side).y;
        const wrist: number = joint(middle, `${side}Hand`).y;
        if (!(sole > 0 && wrist > 0))
          complaints.push(
            `${label}: in the flight's middle the ${side} sole is at ${sole.toFixed(3)} m and the wrist at ${wrist.toFixed(3)} m, above the floor expected`,
          );
      }
      const h: number = 0.02;
      const fall: number =
        (HumanSignature.centre(reader, middle + h).y -
          2 * HumanSignature.centre(reader, middle).y +
          HumanSignature.centre(reader, middle - h).y) /
        (h * h);
      if (!(Math.abs(fall + 9.81) <= 0.1))
        complaints.push(
          `${label}: in the flight's middle the centre of mass accelerates at ${fall.toFixed(2)} m/s², -9.81 within 0.1 expected`,
        );

      // The landing: upright on both feet, facing as before.
      const end: number = segment.end;
      for (const side of ["left", "right"] as const) {
        const sole: number = HumanSignature.sole(reader, end, side).y;
        if (!(Math.abs(sole) <= 0.015))
          complaints.push(
            `${label}: at the end the ${side} sole is ${sole.toFixed(3)} m from the floor, within 15 mm expected`,
          );
      }
      const hips = (seconds: number): IAutoMovieVector3 =>
        Vector3.lerp(
          joint(seconds, "leftUpperLeg"),
          joint(seconds, "rightUpperLeg"),
          0.5,
        );
      const upright: number = joint(end, "head").y - hips(end).y;
      if (!(upright > 0.3 * stature))
        complaints.push(
          `${label}: at the end the head is ${upright.toFixed(3)} m above the hips, more than 0.3 of the stature expected`,
        );
      const facing = (seconds: number): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          HumanSignature.bones(reader, seconds).get("hips")!.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
      const kept: number = Vector3.dot(facing(segment.start), facing(end));
      if (!(kept >= 0.99))
        complaints.push(
          `${label}: at the end the hips face ${kept.toFixed(3)} along where they faced at the start, 0.99 at least expected`,
        );
      return {
        hands: Vector3.lerp(
          joint(down, "leftHand"),
          joint(down, "rightHand"),
          0.5,
        ),
        hips: hips(end),
      };
    };

    // 1. On the floor.
    let hands: IAutoMovieVector3;
    try {
      hands = read(
        `${name} front handspring`,
        perform("frontHandspring"),
        "frontHandspring",
        0,
      ).hands;
    } catch (error) {
      complaints.push(
        `${name} front handspring: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    // 2. Over the box, stood where the hands came down.
    const place: IAutoMovieVector3 = { x: hands.x, y: 0, z: hands.z };
    try {
      const landed: IAutoMovieVector3 = read(
        `${name} handspring vault`,
        perform("handspringVault", place),
        "handspringVault",
        top,
      ).hips;
      if (!(landed.z > place.z + depth / 2))
        complaints.push(
          `${name} handspring vault: the hips land at ${landed.z.toFixed(3)} m, beyond the box's far edge at ${(place.z + depth / 2).toFixed(3)} m expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} handspring vault: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 3. A box off the hands' path.
    let thrown: unknown = null;
    try {
      perform("handspringVault", { ...place, z: place.z + 1 });
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "on"
      )
    )
      complaints.push(
        `${name}: a vault with the box 1 m beyond the hands, a reach refusal on on expected, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals(
    "a handspring turns over the hands and flies to the feet",
    complaints,
    [],
  );
}
