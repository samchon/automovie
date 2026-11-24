import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLegTouch,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPostureCorrection } from "../actions/prepareHumanPostureCorrection";
import { prepareSupportCorrection } from "../actions/prepareSupportCorrection";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { prepareGroundedBalance } from "../everyday/prepareGroundedBalance";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The alternatives of `PlanRestBone`'s site. */
type PlanRestBone = "UpperLeg" | "LowerLeg" | "Foot" | "Toes";

/**
 * A touch with the leg while standing (effectors below the hip): the toes, the
 * heel or the knee of one leg is brought onto a place and held there, the other
 * leg bearing the body.
 *
 * The body first moves over its standing foot: the root is shifted level until
 * the pelvis stands over that ankle, or, with balance asked
 * (`IAutoMovieMotionHumanBalance`), until the centre of mass does
 * (`HumanBalance.prepareCentre`), the standing leg keeping its planted goal.
 * The moving leg is then a goal of the posture resolver, as an arm is: for the
 * toes and the heel the ankle is placed so that part of the foot, read in the
 * foot's rest frame and turned as the foot stood at the entry, lies on the
 * place; for the knee the thigh's length fixes where the hip must be, so the
 * root is shifted further along the level line to the place until the knee, the
 * leg's bend hint, is exactly a thigh from the displayed hip, and the shank
 * hangs from it with the foot left free, since a foot held as it stood would
 * state another plane for the knee. A place the leg does not reach so is
 * refused.
 *
 * Events: `ready` on the place, `strokeEnd` and `relax` at the hold's end, as a
 * touch's. The leg may be cut from `relax` on.
 *
 * First pass: the foot's parts are offsets of the ankle (provisional where
 * marked), the shin is the round kick's and has no slow stroke here, the
 * contact is not declared as a window, and the standing balance is the static
 * one, not checked through the lift.
 */
export namespace legTouch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "legTouch";

  /** Cancel table: the leg is left once it starts back. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * How far the knee's joint centre lies under its front skin, metres
   * (provisional).
   */
  export const KNEE: number = 0.05;

  /** How far behind the ankle's joint the heel's pad lies, metres (provisional). */
  export const HEEL: number = 0.04;

  /**
   * The farthest the root is shifted along the level line to put the knee a
   * thigh from the hip, metres (provisional).
   */
  export const SHIFT: number = 0.25;

  /**
   * The place tolerance the balance shift and the knee's placement settle to,
   * metres: the limb solver's own (`HumanArmTrajectoryTerms.TOLERANCE`, a
   * millimetre).
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /**
   * Plan a touch with the leg.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative, the centre of mass does
   *   not settle over the standing ankle, or the knee cannot be put on the
   *   place by shifting the root within `SHIFT` to the solver's place
   *   tolerance.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLegTouch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanLegTouch.IParams = context.params;
    const body = context.body;
    const part: IAutoMovieMotionHumanLegTouch.With = p.with ?? "toes";
    const side: AutoMovieHumanSide = p.side ?? "right";
    const standing: AutoMovieHumanSide = side === "right" ? "left" : "right";
    const hold: number = p.hold ?? 0.5;
    HumanBound.least("hold", hold, 0, "s");
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const foot = context.entry.feet[side];
    const place: IAutoMovieMotionHumanTarget.IPlace =
      AutoMovieMotionHumanTarget.resolve(
        context,
        p.target,
        context.start,
        entry,
        AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      );
    const level = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: v.x,
      y: 0,
      z: v.z,
    });

    // The root over the standing ankle, with the moving leg's goal `at`.
    const moved = (
      posture: IAutoMovieMotionHumanPosture,
      shift: IAutoMovieVector3,
      goal?: IAutoMovieHumanLimbGoal,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      root: Vector3.add(posture.root, shift),
      ...(goal === undefined
        ? {}
        : { limbs: { ...posture.limbs, [`${side}Leg`]: goal } }),
    });
    const ankle: IAutoMovieVector3 = context.entry.feet[standing].ankle;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);

    // The entry geometry places the pelvis over the stance ankle. Active corrections use the resulting foot support.
    const over: IAutoMovieVector3 = level(
      Vector3.subtract(
        ankle,
        Vector3.add(
          entry.root,
          Quaternion.rotateVector(
            humanPostureHeading(entry),
            body.rest.get("hips")!,
          ),
        ),
      ),
    );
    // The moving leg's goal on the place.
    const rest = (bone: PlanRestBone): IAutoMovieVector3 =>
      body.rest.get(`${side}${bone}`)!;

    // The leg's two lengths are this body's own, between its rest joints: the
    // knee falls on its place only on the circle those lengths allow.
    const thigh: number = Vector3.distance(rest("LowerLeg"), rest("UpperLeg"));
    const shank: number = Vector3.distance(rest("Foot"), rest("LowerLeg"));
    const turned = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(foot.rotation, local);
    // The hip as the body displays it under a shift: the pelvis is fitted
    // over the planted leg, so the hip is read, not carried with the root.
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}UpperLeg`]);
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    const hip = (by: IAutoMovieVector3): IAutoMovieVector3 =>
      frames(
        resolveHumanPosture.seeded(
          body,
          moved(entry, by),
          undefined,
          {},
          resolution,
          undefined,
          projection,
        ).pose,
        resolution(),
      ).get(`${side}UpperLeg`)!.worldPosition;
    let shift: IAutoMovieVector3 = over;
    let goal: IAutoMovieHumanLimbGoal;
    if (part === "knee") {
      const knee: IAutoMovieVector3 = Vector3.add(
        place.point,
        Vector3.scale(place.normal, KNEE),
      );
      // The shift that puts the displayed hip a thigh from the knee: the
      // nearer root of the thigh's length along the level line to the knee,
      // taken again from the hip each shift displays, until the hip is a
      // thigh from the knee within the solver's place tolerance; a pass that
      // does not shrink the residual cannot converge and stops the search.
      const initial: IAutoMovieVector3 = hip(shift);
      let current: IAutoMovieVector3 = initial;
      let residual: number = Infinity;
      for (;;) {
        const before: number = residual;
        const from: IAutoMovieVector3 = Vector3.subtract(knee, current);
        const flat: IAutoMovieVector3 = level(from);
        const line: IAutoMovieVector3 =
          Vector3.length(flat) > 1e-6
            ? Vector3.normalize(flat)
            : { x: 0, y: 0, z: 1 };
        const along: number = Vector3.dot(from, line);
        const inside: number =
          along ** 2 - (Vector3.dot(from, from) - thigh ** 2);
        const root: number = inside < 0 ? NaN : Math.sqrt(inside);
        const far: number =
          inside < 0
            ? NaN
            : [along - root, along + root].sort(
                (a: number, b: number): number => Math.abs(a) - Math.abs(b),
              )[0]!;
        shift = Vector3.add(shift, Vector3.scale(line, far));
        current = hip(shift);
        residual = Math.abs(Vector3.distance(knee, current) - thigh);
        if (!(Vector3.distance(shift, over) <= SHIFT)) break;
        if (residual <= TOLERANCE || !(residual < before)) break;
      }
      if (!(Vector3.distance(shift, over) <= SHIFT) || !(residual <= TOLERANCE))
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: `${(Vector3.distance(knee, initial) * 1000).toFixed(0)} mm`,
          feasible: { kind: "alternatives", values: ["a nearer place"] },
          reason: `The knee is a thigh of ${(thigh * 1000).toFixed(0)} mm from the hip, and the place lies ${(Vector3.distance(knee, initial) * 1000).toFixed(0)} mm from it, which a shift of the body within ${(SHIFT * 1000).toFixed(0)} mm does not close (the hip stays ${(residual * 1000).toFixed(0)} mm off the thigh's length)`,
          fix: "stand nearer the place, or aim the knee at a place at the hip's height or below",
        });
      const line: IAutoMovieVector3 = Vector3.normalize(
        level(Vector3.subtract(knee, current)),
      );
      const down: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract({ x: 0, y: -1, z: 0 }, Vector3.scale(line, 0.5)),
      );
      // No rotation is asked of the foot: a foot turned as it stood would
      // state the knee's plane against the bend point.
      goal = {
        point: Vector3.add(knee, Vector3.scale(down, shank)),
        bend: knee,
      };
    } else {
      const local: IAutoMovieVector3 =
        part === "toes"
          ? Vector3.subtract(rest("Toes"), rest("Foot"))
          : { x: 0, y: -rest("Foot").y, z: -HEEL };
      goal = {
        point: Vector3.subtract(place.point, turned(local)),
        rotation: foot.rotation,
        // The knee ahead of the hip, as the foot stood at the entry.
        bend: Vector3.add(hip(shift), turned({ x: 0, y: 0, z: thigh })),
      };
    }

    // The clock: out, the hold, back.
    const reach: number =
      1.5 *
      AutoMovieMotionHumanTiming.transport(
        Vector3.distance(goal.point, foot.ankle),
      );
    const relax: number = reach + hold;
    const duration: number = relax + reach;
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const lift: number = 0.05;
    const events: IAutoMovieMotionHumanActionPlan["events"] = [
      { name: "ready", share: reach / duration },
      { name: "strokeStart", share: reach / duration },
      { name: "strokeEnd", share: relax / duration },
      { name: "relax", share: relax / duration },
    ];
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      p,
      {},
      context.start,
      { duration, events },
      context.instant,
    );
    const contacts: IAutoMovieMotionHumanContactWindow[] = base.contacts.filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part !== `${side}Foot`,
    );
    const adjust: ReturnType<typeof prepareGroundedBalance> =
      window?.by === "hips" && part === "knee"
        ? prepareSupportCorrection(body, window, { duration, contacts }, [
            `${side}LowerLeg`,
          ])
        : prepareGroundedBalance(body, window, () => [standing]);

    // The leg's posture before the correction at a second.
    const rawAt = (
      t: number,
      source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      nativeProjection?: Parameters<
        IAutoMovieMotionHumanActionPlan["posture"]
      >[3],
    ): IAutoMovieMotionHumanPosture => {
      const s: number =
        t < reach
          ? minimumJerk.share(t / reach)
          : t <= relax
            ? 1
            : 1 - minimumJerk.share((t - relax) / reach);
      return moved(
        base.posture(t, undefined, source, nativeProjection),
        Vector3.scale(shift, s),
        {
          point: Vector3.add(
            Vector3.add(
              foot.ankle,
              Vector3.scale(Vector3.subtract(goal.point, foot.ankle), s),
            ),
            { x: 0, y: lift * Math.sin(Math.PI * s), z: 0 },
          ),
          ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
          // The hint rides the root, which is short of its full shift by 1 - s.
          bend: Vector3.subtract(goal.bend, Vector3.scale(shift, 1 - s)),
          ...(s === 0 ? { planted: true } : {}),
        },
      );
    };

    // The correction is solved at its knots, the reach's and the relax's
    // ends among them, and read from their course
    // (`prepareHumanPostureCorrection`).
    const corrected: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => IAutoMovieMotionHumanPosture =
      window === null
        ? (
            posture: IAutoMovieMotionHumanPosture,
          ): IAutoMovieMotionHumanPosture => posture
        : prepareHumanPostureCorrection(
            (t: number): IAutoMovieMotionHumanPosture => rawAt(t),
            window,
            [reach, relax],
            (
              posture: IAutoMovieMotionHumanPosture,
              t: number,
            ): IAutoMovieMotionHumanPosture => adjust(posture, t),
          );
    return {
      duration,
      events,
      ...HumanPhysics.declared(context.params, window),
      contacts,
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        nativeProjection?: Parameters<
          IAutoMovieMotionHumanActionPlan["posture"]
        >[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return corrected(rawAt(t, source, nativeProjection), t);
      },
    };
  }
}
