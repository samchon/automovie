import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropWear,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { courseArmGoal } from "../compose/courseArmGoal";
import { rise } from "../everyday/rise";
import { sit } from "../everyday/sit";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { crutchSitPath } from "./crutchSitPath";

/** The injured leg's two joints a held leg sets. */
type LegJoint = "hip" | "knee";

/** A held leg's hip and knee flexion, degrees. */
type LegAngles = Readonly<Record<LegJoint, number>>;

/** The injured leg's hip and knee flexion held off the floor standing, degrees: the crutch walk's three-point gait's. */
const STANDING: LegAngles = { hip: 30, knee: 80 };

/** The injured leg's hip and knee flexion held forward off the floor seated, degrees (provisional: the thigh level, the shank 30 degrees forward of vertical). */
const SEATED: LegAngles = { hip: 90, knee: 60 };

/** How far apart the two crutches stand in one hand, metres (provisional: two shafts side by side). */
const SPACING: number = 0.035;

/** How far a seated hand rests beside the thigh's side, metres (provisional: a hand's breadth out). */
const BESIDE: number = 0.08;

/** How far a crutch tip stands beside and ahead of its foot after a rise, metres: the crutch walk specification's tripod. */
const TRIPOD: number = 0.15;

/**
 * Sit down onto a chair with two crutches, or rise from it (#3994), in the
 * prescribed order (Cornell Health and HealthLinkBC, Using crutches).
 *
 * Sitting: first both crutches are gathered into the injured side's hand
 * (`gathered`): that hand carries its crutch to stand upright on the floor
 * at the tip from which, pivoting, its grip comes down to the seated hand's
 * place beside the thigh, and the sound hand carries its crutch beside it,
 * where it is worn on the injured side's hand from then on. Then the sound
 * hand reaches back to the chair (`reached`): onto its armrest on the sound
 * side, or onto the seat beside the hip. Then the sit law (`sit`) lowers the
 * body onto the seat while the injured side's hand comes down the crutches'
 * pivot arc to its seated place, the crutches tilting on their planted
 * tips, top back. The injured leg is held off the floor throughout, its
 * hip and knee from `STANDING` to `SEATED` over the descent.
 *
 * Rising: the rise law (`rise`) stands the body on the sound leg while the
 * sound hand pushes on the chair until the seat is left and the injured
 * side's hand brings the crutches back up their arc to upright; then the
 * sound hand takes its crutch back (`taken`), and both crutches are carried
 * to stand `TRIPOD` beside and ahead of the feet (`planted`). The injured
 * leg goes from `SEATED` back to `STANDING`.
 *
 * The arms are laid as one course (`courseArmGoal`). The crutches are held,
 * never leaned on: the hands carry them by grip windows and holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both orders, the crutch paths, the reuse of sit and rise, the leg, the course and the custody.
 * @evidence contracts/development/design.md#principled-representation The sit and rise laws for the body, with the arms and the injured leg written over them and the crutches carried.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the order, the crutch paths and the leg; the body's sit and rise, the transport and the course are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every crutch frame follows from the crutches' own contacts, the seat and the body's measure.
 */
export const HumanCrutchSit: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrutchSit> =
  {
    name: "crutchSit",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchSit>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanCrutchSit = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      const injured: AutoMovieHumanSide = p.injured ?? "left";
      const sound: AutoMovieHumanSide = injured === "left" ? "right" : "left";
      const subject = (side: AutoMovieHumanSide): string =>
        side === "left" ? p.left : p.right;
      const affordances = (
        side: AutoMovieHumanSide,
      ): readonly IAutoMovieAffordance[] =>
        context.prop(subject(side)).prop.affordances ?? [];
      const crutch: Record<AutoMovieHumanSide, crutchSitPath.ICrutch> = {
        left: crutchSitPath.crutch(p.left, affordances("left")),
        right: crutchSitPath.crutch(p.right, affordances("right")),
      };
      const start = (side: AutoMovieHumanSide): IAutoMovieRigidTransform =>
        context.prop(subject(side)).frame(context.start);
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const held = (
        side: AutoMovieHumanSide,
        hand: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanHeld.IHeld =>
        crutchSitPath.held(
          body,
          context.entry.pose,
          hand,
          subject(side),
          start(side),
          affordances(side),
        );
      const goal = (
        hand: AutoMovieHumanSide,
        h: IAutoMovieMotionHumanHeld.IHeld,
        frame: IAutoMovieRigidTransform,
      ): IAutoMovieHumanLimbGoal => {
        const rotation: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            frame.rotation,
            Quaternion.inverse(h.frame.rotation),
          ),
        );
        const at: IAutoMovieVector3 = Vector3.subtract(
          frame.position,
          Quaternion.rotateVector(rotation, h.frame.position),
        );
        return {
          ...HumanHand.place(body, hand, "grip", at, rotation),
          bend: AutoMovieMotionHumanBend.hang(body, entry, hand, 0.2),
        };
      };
      const palm = (
        hand: AutoMovieHumanSide,
        at: IAutoMovieVector3,
        yaw: number,
      ): IAutoMovieHumanLimbGoal => ({
        ...HumanHand.place(
          body,
          hand,
          "palm",
          at,
          HumanHand.facing(hand, yaw, { fingers: "forward", palm: "down" }),
          "flat",
        ),
        bend: AutoMovieMotionHumanBend.hang(body, entry, hand, 0.2),
      });
      const blendGoal = (
        a: IAutoMovieHumanLimbGoal,
        b: IAutoMovieHumanLimbGoal,
        share: number,
      ): IAutoMovieHumanLimbGoal => {
        const s: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
        return {
          ...b,
          point: Vector3.lerp(a.point, b.point, s),
          bend: Vector3.lerp(a.bend, b.bend, s),
          rotation: Quaternion.slerp(
            a.rotation ?? Quaternion.identity(),
            b.rotation ?? Quaternion.identity(),
            s,
          ),
        };
      };
      const leg = (
        share: number,
        from: LegAngles,
        to: LegAngles,
      ): IAutoMovieMotionHumanPosture["joints"] => {
        const s: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
        return {
          [`${injured}UpperLeg`]: [from.hip + (to.hip - from.hip) * s, 0, 0],
          [`${injured}LowerLeg`]: [from.knee + (to.knee - from.knee) * s, 0, 0],
        };
      };
      const lateral = (
        yaw: number,
        side: AutoMovieHumanSide,
      ): IAutoMovieVector3 => {
        const r: number = (yaw * Math.PI) / 180;
        const left: IAutoMovieVector3 = {
          x: Math.cos(r),
          y: 0,
          z: -Math.sin(r),
        };
        return side === "left" ? left : Vector3.scale(left, -1);
      };
      const forward = (yaw: number): IAutoMovieVector3 => ({
        x: Math.sin((yaw * Math.PI) / 180),
        y: 0,
        z: Math.cos((yaw * Math.PI) / 180),
      });
      const write = (
        posture: IAutoMovieMotionHumanPosture,
        arms: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>,
        joints: IAutoMovieMotionHumanPosture["joints"],
      ): IAutoMovieMotionHumanPosture => {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
          leftArm: arms.left,
          rightArm: arms.right,
        };
        delete limbs[`${injured}Leg`];
        return { ...posture, limbs, joints: { ...posture.joints, ...joints } };
      };
      const at = (
        plan: IAutoMovieMotionHumanActionPlan,
        name: string,
      ): number =>
        plan.duration *
        (plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === name,
        )?.share ?? 1);
      const hA: IAutoMovieMotionHumanHeld.IHeld = held(injured, injured);
      const cA: crutchSitPath.ICrutch = crutch[injured];
      const grip = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanContactWindow["part"] =>
        side === "left" ? "leftHand" : "rightHand";
      const holds: IAutoMovieMotionPropHold[] = [];
      let wears: IAutoMovieMotionPropWear[] = [];
      let duration: number;
      let posture: (seconds: number) => IAutoMovieMotionHumanPosture;
      let contacts: IAutoMovieMotionHumanContactWindow[];
      let events: IAutoMovieMotionEvent[];
      let base: IAutoMovieMotionHumanActionPlan["base"];
      if (p.rise !== true) {
        const seat: IAutoMovieMotionHumanSeated.ISeat | undefined = p.seat;
        if (seat === undefined)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "seat",
            value: null,
            reason: "a crutch sit names the chair it sits on",
            fix: "give the seat",
          });
        const f: IAutoMovieVector3 = forward(seat.yaw);
        const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
        // The seated hand's grip place beside the injured thigh, and the
        // planted tip from which the crutch's pivot brings its grip there.
        const seated: IAutoMovieVector3 = Vector3.add(
          Vector3.add(
            seat.at,
            Vector3.scale(
              lateral(seat.yaw, injured),
              m.hipHalfWidth + m.thighRadius + BESIDE,
            ),
          ),
          {
            x: -f.x * m.thigh * 0.5,
            y: 2 * m.thighRadius + 0.03,
            z: -f.z * m.thigh * 0.5,
          },
        );
        const reachable: number = Math.min(1, seated.y / cA.length);
        const tilt: number = (Math.acos(reachable) * 180) / Math.PI;
        const tip: IAutoMovieVector3 = Vector3.add(
          { x: seated.x, y: 0, z: seated.z },
          Vector3.scale(f, cA.length * Math.sin((tilt * Math.PI) / 180)),
        );
        const axis: IAutoMovieVector3 = lateral(seat.yaw, "left");
        const upright: IAutoMovieQuaternion = start(injured).rotation;
        const gatheredA: IAutoMovieRigidTransform = crutchSitPath.pivoted(
          cA,
          tip,
          upright,
          axis,
          0,
        );
        const gatheredB: IAutoMovieRigidTransform = {
          position: Vector3.add(
            gatheredA.position,
            Vector3.scale(lateral(seat.yaw, injured), SPACING),
          ),
          rotation: gatheredA.rotation,
        };
        const hB: IAutoMovieMotionHumanHeld.IHeld = held(sound, sound);
        const gather: number = AutoMovieMotionHumanTiming.transport(
          Math.max(
            Vector3.distance(start(injured).position, gatheredA.position),
            Vector3.distance(start(sound).position, gatheredB.position),
          ),
        );
        const rest: IAutoMovieVector3 =
          seat.armrests?.[sound] ??
          Vector3.add(
            Vector3.add(
              seat.at,
              Vector3.scale(
                lateral(seat.yaw, sound),
                m.hipHalfWidth + m.thighRadius + BESIDE,
              ),
            ),
            { x: -f.x * m.thigh * 0.6, y: 0, z: -f.z * m.thigh * 0.6 },
          );
        const reach: number = AutoMovieMotionHumanTiming.transport(
          Vector3.distance(goal(sound, hB, gatheredB).point, rest),
        );
        const plan: IAutoMovieMotionHumanActionPlan = sit.plan({
          ...context,
          params: { seat },
        });
        const lower: number = gather + reach;
        const descent: number = at(plan, "seated");
        duration = lower + plan.duration;
        const settled: IAutoMovieHumanLimbGoal = palm(sound, rest, seat.yaw);
        posture = (seconds: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          const body0: IAutoMovieMotionHumanPosture =
            t < lower ? entry : plan.posture(t - lower);
          const k: number = minimumJerk.share(
            Math.min(1, Math.max(0, (t - lower) / descent)),
          );
          const injuredArm: IAutoMovieHumanLimbGoal =
            t < gather
              ? goal(
                  injured,
                  hA,
                  crutchSitPath.carried(start(injured), gatheredA, t / gather),
                )
              : goal(
                  injured,
                  hA,
                  crutchSitPath.pivoted(cA, tip, upright, axis, -tilt * k),
                );
          const soundArm: IAutoMovieHumanLimbGoal =
            t < gather
              ? goal(
                  sound,
                  hB,
                  crutchSitPath.carried(start(sound), gatheredB, t / gather),
                )
              : blendGoal(
                  goal(sound, hB, gatheredB),
                  settled,
                  (t - gather) / reach,
                );
          const arms: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal> =
            injured === "left"
              ? { left: injuredArm, right: soundArm }
              : { left: soundArm, right: injuredArm };
          return write(
            body0,
            arms,
            leg((t - lower) / descent, STANDING, SEATED),
          );
        };
        const later = (share: number): number =>
          (lower + share * plan.duration) / duration;
        contacts = [
          {
            part: `${sound}Foot`,
            kind: "plant",
            from: 0,
            to: lower / duration,
            support: { kind: "ground" },
          },
          ...plan.contacts
            .filter(
              (w: IAutoMovieMotionHumanContactWindow): boolean =>
                w.part !== `${injured}Foot` &&
                w.part !== "leftHand" &&
                w.part !== "rightHand",
            )
            .map(
              (
                w: IAutoMovieMotionHumanContactWindow,
              ): IAutoMovieMotionHumanContactWindow => ({
                ...w,
                from: later(w.from),
                to: later(w.to),
              }),
            ),
          {
            part: grip(injured),
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: subject(injured) },
          },
          {
            part: grip(sound),
            kind: "grip",
            from: 0,
            to: gather / duration,
            support: { kind: "prop", subject: subject(sound) },
          },
          {
            part: grip(sound),
            kind: "bear",
            from: lower / duration,
            to: 1,
            support: { kind: "ground" },
          },
        ];
        wears = [
          {
            prop: subject(sound),
            bone: `${injured}Hand`,
            from: gather / duration,
          },
        ];
        holds.push({ side: injured, prop: subject(injured), from: 1 });
        events = [
          { name: "gathered", share: gather / duration },
          { name: "reached", share: lower / duration },
          ...plan.events.map(
            (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
              ...e,
              share: later(e.share),
            }),
          ),
        ];
        base = plan.base;
      } else {
        // The crutches as the sit left them: tilted on their planted tips.
        const frameA: IAutoMovieRigidTransform = start(injured);
        const tip: IAutoMovieVector3 = Vector3.add(
          frameA.position,
          Quaternion.rotateVector(frameA.rotation, cA.tip),
        );
        const shaft: IAutoMovieVector3 = Quaternion.rotateVector(
          frameA.rotation,
          { x: 0, y: 1, z: 0 },
        );
        const tilt: number =
          (Math.acos(Math.min(1, Math.max(-1, shaft.y))) * 180) / Math.PI;
        const axis: IAutoMovieVector3 = lateral(entry.yaw, "left");
        const upright: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle(axis, tilt),
            frameA.rotation,
          ),
        );
        const plan: IAutoMovieMotionHumanActionPlan = rise.plan(context);
        const stood: number = at(plan, "standing");
        const off: number = at(plan, "seatOff");
        const risen: IAutoMovieMotionHumanPosture = plan.posture(plan.duration);
        const f: IAutoMovieVector3 = forward(risen.yaw);
        const ankle: IAutoMovieVector3 =
          risen.limbs[`${sound}Leg`]?.point ?? risen.root;
        const centre: IAutoMovieVector3 = Vector3.add(
          ankle,
          Vector3.scale(lateral(risen.yaw, injured), body.measure.hipHalfWidth),
        );
        const planted = (side: AutoMovieHumanSide): IAutoMovieRigidTransform =>
          crutchSitPath.pivoted(
            crutch[side],
            Vector3.add(
              { x: centre.x, y: 0, z: centre.z },
              Vector3.add(
                Vector3.scale(
                  lateral(risen.yaw, side),
                  body.measure.hipHalfWidth + TRIPOD,
                ),
                Vector3.scale(f, TRIPOD),
              ),
            ),
            upright,
            axis,
            0,
          );
        const uprightA: IAutoMovieRigidTransform = crutchSitPath.pivoted(
          cA,
          tip,
          upright,
          axis,
          0,
        );
        const uprightB: IAutoMovieRigidTransform = {
          position: Vector3.add(
            uprightA.position,
            Vector3.scale(lateral(entry.yaw, injured), SPACING),
          ),
          rotation: uprightA.rotation,
        };
        // The sound hand will hold its crutch as the injured side's hand holds
        // it: the same grip, mirrored, read from the sound side's own offset.
        const hBsound: IAutoMovieMotionHumanHeld.IHeld = {
          ...hA,
          prop: subject(sound),
          side: sound,
        };
        const pushed: IAutoMovieHumanLimbGoal = {
          ...(entry.limbs[`${sound}Arm`] ?? palm(sound, risen.root, entry.yaw)),
        };
        const takeAt: IAutoMovieHumanLimbGoal = goal(sound, hBsound, uprightB);
        const reach: number = AutoMovieMotionHumanTiming.transport(
          Vector3.distance(pushed.point, takeAt.point),
        );
        const carry: number = AutoMovieMotionHumanTiming.transport(
          Math.max(
            Vector3.distance(uprightA.position, planted(injured).position),
            Vector3.distance(uprightB.position, planted(sound).position),
          ),
        );
        const taken: number = Math.max(stood, off + reach);
        duration = taken + carry;
        posture = (seconds: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          const body0: IAutoMovieMotionHumanPosture = plan.posture(
            Math.min(plan.duration, t),
          );
          const k: number = minimumJerk.share(Math.min(1, t / stood));
          const injuredArm: IAutoMovieHumanLimbGoal =
            t < stood
              ? goal(
                  injured,
                  hA,
                  crutchSitPath.pivoted(
                    cA,
                    tip,
                    upright,
                    axis,
                    -tilt * (1 - k),
                  ),
                )
              : t < taken
                ? goal(injured, hA, uprightA)
                : goal(
                    injured,
                    hA,
                    crutchSitPath.carried(
                      uprightA,
                      planted(injured),
                      (t - taken) / carry,
                    ),
                  );
          const soundArm: IAutoMovieHumanLimbGoal =
            t < off
              ? pushed
              : t < taken
                ? blendGoal(pushed, takeAt, (t - off) / (taken - off))
                : goal(
                    sound,
                    hBsound,
                    crutchSitPath.carried(
                      uprightB,
                      planted(sound),
                      (t - taken) / carry,
                    ),
                  );
          const arms: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal> =
            injured === "left"
              ? { left: injuredArm, right: soundArm }
              : { left: soundArm, right: injuredArm };
          return write(body0, arms, leg(t / stood, SEATED, STANDING));
        };
        const share = (seconds: number): number =>
          Math.min(1, seconds / duration);
        contacts = [
          ...plan.contacts
            .filter(
              (w: IAutoMovieMotionHumanContactWindow): boolean =>
                w.part !== `${injured}Foot` &&
                w.part !== "leftHand" &&
                w.part !== "rightHand",
            )
            .map(
              (
                w: IAutoMovieMotionHumanContactWindow,
              ): IAutoMovieMotionHumanContactWindow => ({
                ...w,
                from: share(w.from * plan.duration),
                to: w.to >= 1 ? 1 : share(w.to * plan.duration),
              }),
            ),
          {
            part: grip(injured),
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: subject(injured) },
          },
          {
            part: grip(sound),
            kind: "bear",
            from: 0,
            to: share(off),
            support: { kind: "ground" },
          },
          {
            part: grip(sound),
            kind: "grip",
            from: share(taken),
            to: 1,
            support: { kind: "prop", subject: subject(sound) },
          },
        ];
        holds.push(
          { side: injured, prop: subject(injured), from: 1 },
          { side: sound, prop: subject(sound), from: 1 },
        );
        events = [
          ...plan.events.map(
            (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
              ...e,
              share: share(e.share * plan.duration),
            }),
          ),
          { name: "taken", share: share(taken) },
          { name: "planted", share: 1 },
        ];
        base = plan.base;
      }
      const goals: IAutoMovieMotionHumanActionPlan = {
        duration,
        events: [...events].sort(
          (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
            a.share - b.share,
        ),
        contacts,
        holds,
        wears,
        ...(base === undefined ? {} : { base }),
        posture: (seconds: number): IAutoMovieMotionHumanPosture =>
          posture(seconds),
      };
      return courseArmGoal({
        body,
        plan: goals,
        side: injured,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, injured),
        span: { start: 0, ready: 0, relax: duration, end: duration },
        with: [
          {
            side: sound,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, sound),
          },
        ],
        after: "angles",
      });
    },
  };
