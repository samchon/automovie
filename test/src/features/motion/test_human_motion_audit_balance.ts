import {
  AutoMovieGravity,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance,
  HumanFoot,
  HumanPhysics,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";
import { nclose } from "../internal/nclose";

/** The audit fixture's world-space bone table. */
type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/**
 * The balance audit on real bodies: the extrapolated centre of mass of Hof,
 * Gazendam and Sinke (2005) against the feet, read only while both feet
 * alone bear the body.
 *
 * A body in its quiet stance is carried rigidly along its heading at a
 * constant speed `v` for 1 s, both feet declared planted on the ground. Its
 * feet travel with it, so its centre of mass keeps its place over them, and
 * the extrapolated centre lies `v / w` ahead of it, with `w = sqrt(g /
 * (1.34 hipHeight))` the pendulum's eigenfrequency, `g` standard gravity. The feet's hull ends in
 * front at the line through both toe points and behind at the line through
 * both heels, so past either line the distance outside is known in closed
 * form from the stance's centre of mass `c`, toe line `zToe` and heel line
 * `zHeel` along the heading.
 *
 * Scenarios, on the average man and on the small woman, whose shorter
 * pendulum extrapolates less:
 * 1. Standing still the body is balanced: nothing is outside, and the
 *    margin at an instant is positive and less than a foot's length.
 * 2. At 0.05 m/s the extrapolated centre stays over the feet: zero.
 * 3. At 1 m/s forward it lies `c + 1 / w - zToe` outside.
 * 4. At 1 m/s backward it lies `zHeel - (c - 1 / w)` outside.
 * 5. `margin` at 0.5 s of the forward film, with its own difference step,
 *    is the negative of scenario 3's reading: the velocity of a constant
 *    carry does not depend on the span it is differenced over.
 * 6. With the right foot planted only from 0.5 s, the forward film is read
 *    from 0.5 s on; with a hand gripping a rail throughout it is not read.
 * 7. The same forward film with the physical flag off keeps its zero
 *    verdict and reads no displayed bones.
 * 8. For both bodies at the same Froude number, the extrapolation divided
 *    by pendulum length is equal after removing the sole's own geometry.
 * 9. On the average man, planted palms extend the hull to a mass centre
 *    beyond the feet. Adding a bearing knee keeps it inside the hull.
 * 10. Separated physical and balance phases each admit one original grid tick.
 *     Their derivatives use only the immediate neighbours on that same grid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads public measure and margin on a real mass model, counting bone reads of the unjudged fixture. A wrong velocity span, pendulum length, judgment gate or bearing hull fails.
 * @evidence contracts/development/testing.md#independent-expectations The distance outside is Hof's closed form over the stance's centre of mass and sole points. At fixed v/sqrt(g l), the advance is proportional to l. The palm fixture's chosen translations place the centre ahead of the feet and behind the palms.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes still, slow, fast forward and backward, two pendulum lengths, late contact, grip, unjudged and ground support by additional parts.
 * @evidence contracts/development/testing.md#execution-ownership The test program discovers one in-memory audit spec on two prepared bodies with no renderer or host.
 * @evidence contracts/development/common.md#meaningful-documentation States the carry, independent formula, hull and judgment branches.
 */
export function test_human_motion_audit_balance(): void {
  const ground: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "ground",
  };
  const plant = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    from: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind: "plant",
    from,
    to: 1,
    support: ground,
  });

  // The reference 1 m/s forward carry sets one dimensionless speed.
  const referenceHip: number = motionHumanBody("m-average").measure.hipHeight;
  const normalized: number[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stance: Bones = motionHumanStance(body);
    let boneReads: number = 0;
    const film = (
      speed: number,
      contacts: IAutoMovieMotionHumanContactWindow[] = [
        plant("leftFoot", 0),
        plant("rightFoot", 0),
      ],
      physical: boolean = true,
    ): IAutoMovieMotionHumanAuditMotion =>
      motionAuditMoved(
        stance,
        1,
        (_bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 => {
          ++boneReads;
          return { x: 0, y: 0, z: speed * t };
        },
        [
          {
            name: "stand",
            start: 0,
            entryTime: 0,
            end: 1,
            physical,
            plan: { duration: 1, contacts },
          },
        ],
      );
    const measure = (
      motion: IAutoMovieMotionHumanAuditMotion,
    ): IAutoMovieMotionHumanAuditMeasure =>
      AutoMovieMotionHumanAuditBalance.measure(motion, "a", body);

    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const centre: number = resolveAutoMovieCenterOfMass.place(model, stance).z;
    const sole: number[] = HumanFoot.base(body, stance).map(
      (p: IAutoMovieVector3): number => p.z,
    );
    const zToe: number = Math.max(...sole);
    const zHeel: number = Math.min(...sole);
    // The audit uses Hof et al.'s frontal-plane estimate of 1.34 times the
    // trochanteric height as its isotropic pendulum length.
    const length: number = 1.34 * body.measure.hipHeight;
    const lead: number = Math.sqrt(length / AutoMovieGravity.STANDARD);

    const still: IAutoMovieMotionHumanAuditMeasure = measure(film(0));
    const margin: number = AutoMovieMotionHumanAuditBalance.margin(
      film(0),
      "a",
      body,
      model,
      0.5,
    );
    TestValidator.predicate(
      `${name}: standing still is balanced, margin ${(margin * 1000).toFixed(1)} mm`,
      still.value === 0 &&
        still.where === "none" &&
        margin > 0 &&
        margin < zToe - zHeel,
    );
    TestValidator.equals(
      `${name}: a slow carry stays over the feet`,
      measure(film(0.05)).value,
      0,
    );

    const forward: IAutoMovieMotionHumanAuditMeasure = measure(film(1));
    TestValidator.predicate(
      `${name}: a forward carry leaves the toes by ${((centre + lead - zToe) * 1000).toFixed(1)} mm, got ${(forward.value * 1000).toFixed(1)}`,
      Math.abs(forward.value - (centre + lead - zToe)) <= 1e-6 &&
        forward.where === "both feet",
    );
    const backward: IAutoMovieMotionHumanAuditMeasure = measure(film(-1));
    TestValidator.predicate(
      `${name}: a backward carry leaves the heels by ${((zHeel - (centre - lead)) * 1000).toFixed(1)} mm, got ${(backward.value * 1000).toFixed(1)}`,
      Math.abs(backward.value - (zHeel - (centre - lead))) <= 1e-6,
    );
    TestValidator.predicate(
      `${name}: one instant's margin agrees with the motion's reading`,
      Math.abs(
        AutoMovieMotionHumanAuditBalance.margin(
          film(1),
          "a",
          body,
          model,
          0.5,
        ) + forward.value,
      ) <= 1e-6,
    );

    const late: IAutoMovieMotionHumanAuditMeasure = measure(
      film(1, [plant("leftFoot", 0), plant("rightFoot", 0.5)]),
    );
    TestValidator.predicate(
      `${name}: only instants with both feet planted are read`,
      Math.abs(late.value - forward.value) <= 1e-6 && late.seconds >= 0.5,
    );
    const gripped: IAutoMovieMotionHumanAuditMeasure = measure(
      film(1, [
        plant("leftFoot", 0),
        plant("rightFoot", 0),
        {
          part: "rightHand",
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "rail" },
        },
      ]),
    );
    TestValidator.predicate(
      `${name}: a gripping hand leaves the instant unread`,
      gripped.value === 0 && gripped.where === "none",
    );
    const scaledSpeed: number = Math.sqrt(body.measure.hipHeight / referenceHip);
    const scaled: IAutoMovieMotionHumanAuditMeasure =
      scaledSpeed === 1 ? forward : measure(film(scaledSpeed));
    TestValidator.predicate(
      `${name}: the Froude-scaled carry still crosses the toe line`,
      scaled.value > 0,
    );
    normalized.push((scaled.value + zToe - centre) / length);

    const before: number = boneReads;
    const posed: IAutoMovieMotionHumanAuditMeasure = measure(
      film(1, undefined, false),
    );
    TestValidator.predicate(
      `${name}: an unjudged action takes no displayed-bone samples`,
      posed.value === 0 && posed.where === "none" && boneReads === before,
    );
    if (name === "m-average") {
      palms(body, stance);
      const span: HumanPhysics.ISpan = {
        name: "accelerating stance",
        start: 0,
        entryTime: 0,
        end: 1,
        law: { physical: true },
        plan: {
          duration: 1,
          contacts: [plant("leftFoot", 0), plant("rightFoot", 0)],
          physicalWindow: { from: 3 / 16, to: 5 / 16 },
          balanceWindow: {
            by: "hips", weight: 1, ramp: { in: 0, out: 0 },
            from: 11 / 16, to: 13 / 16,
          },
        },
      };
      const reads: Set<number> = new Set<number>();
      const sparse: IAutoMovieMotionHumanAuditMotion = motionAuditMoved(
        stance, 1,
        (_bone: AutoMovieHumanoidBone, seconds: number): IAutoMovieVector3 => {
          reads.add(seconds);
          return { x: 0, y: 0, z: seconds ** 2 };
        },
        [span],
      );
      const rate: number = 8;
      const judged: IAutoMovieMotionHumanAuditMeasure =
        AutoMovieMotionHumanAuditBalance.measure(sparse, "a", body, rate);
      const ticks: number[] = [...reads].map((t: number): number => t * rate)
        .sort((a: number, b: number): number => a - b);
      TestValidator.equals("only ticks 2 and 6 and their neighbours supply bones", ticks, [1, 2, 3, 5, 6, 7]);

      // An off-grid physical phase has no sample even though its endpoints
      // bracket real seconds. The synthetic inputs count each public read.
      let contactsRead: number = 0;
      let modelsRead: number = 0;
      const unobserved: HumanPhysics.ISpan = {
        ...span,
        plan: {
          duration: 1,
          physicalWindow: { from: 1 / 32, to: 3 / 32 },
          balanceWindow: null,
          get contacts(): readonly IAutoMovieMotionHumanContactWindow[] {
            contactsRead++;
            return span.plan.contacts;
          },
        },
      };
      const counted: IAutoMovieMotionHumanBody = {
        ...body,
        get massModel(): IAutoMovieResolveCenterOfMass.IModel {
          modelsRead++;
          return model;
        },
      };
      reads.clear();
      const gap: IAutoMovieMotionHumanAuditMeasure =
        AutoMovieMotionHumanAuditBalance.measure(
          { ...sparse, segments: (): readonly HumanPhysics.ISpan[] => [unobserved] },
          "a", counted, rate,
        );
      TestValidator.predicate("a phase wholly between adjacent ticks reads no contact, mass or pose",
        gap.value === 0 && gap.where === "none" &&
          contactsRead === 0 && modelsRead === 0 && reads.size === 0,
      );
      // The central difference of z(t) = t² is exactly 2t at either tick.
      const peak: number = 6 / rate;
      TestValidator.predicate(
        "the second phase has the greater analytic extrapolation",
        judged.seconds === peak && judged.where === "both feet" &&
          nclose(judged.value, centre + 2 * peak * lead - zToe),
      );
    }
  }
  TestValidator.predicate(
    "Froude similarity preserves the advance in pendulum lengths",
    nclose(normalized[0]!, normalized[1]!, 1e-6),
  );
}

/** Check contact topology on a still, explicitly judged posture. */
function palms(body: IAutoMovieMotionHumanBody, stance: Bones): void {
  // Move the non-foot mass 0.3 m and the palms 0.6 m to put the centre
  // between two separate bearing regions without using the hull solver.
  const move = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    /(Foot|Toes)$/.test(bone)
      ? { x: 0, y: 0, z: 0 }
      : /(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)
        ? { x: 0, y: 0, z: 0.6 }
        : { x: 0, y: 0, z: 0.3 };
  const ground = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"] = "plant",
  ): IAutoMovieMotionHumanContactWindow => ({
    part, kind, from: 0, to: 1, support: { kind: "ground" },
  });
  const margin = (contacts: IAutoMovieMotionHumanContactWindow[]): number => {
    const span: IAutoMovieMotionHumanAuditMotion.ISpan = {
      name: "lean",
      start: 0,
      entryTime: 0,
      end: 1,
      physical: true,
      plan: { duration: 1, contacts },
    };
    TestValidator.predicate("the palm fixture explicitly judges balance", HumanPhysics.judged(span));
    return AutoMovieMotionHumanAuditBalance.margin(
      motionAuditMoved(stance, 1, move, [span]),
      "a",
      body,
      body.massModel,
      0.5,
    );
  };
  const feet: IAutoMovieMotionHumanContactWindow[] = [
    ground("leftFoot"),
    ground("rightFoot"),
  ];
  const hands: IAutoMovieMotionHumanContactWindow[] = [
    ...feet,
    ground("leftHand"),
    ground("rightHand"),
  ];
  const planted: number = margin(hands);
  const kneeling: number = margin([...hands, ground("leftLowerLeg", "bear")]);
  const unsupported: number = margin(feet);
  TestValidator.predicate(
    `planted palms extend the hull: margins ${planted}, ${kneeling} with a knee, ${unsupported} on the feet alone`,
    planted > 0 && kneeling > 0 && unsupported < 0,
  );
}
