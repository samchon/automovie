import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The sprint start's crouch into the set position and its hold until the
 * gun (#3250): the hands on the start line, the front foot and the rear
 * foot on their blocks.
 *
 * The set position is solved from measured block settings and one measured
 * angle: the anthropometry-driven setting of Cavedon et al. (2019, PLoS One
 * 14:e0213979, table 2) puts the front block 0.60 of the leg's length behind
 * the line and the rear block 0.45 of it behind the front, and the front
 * knee stands at 90 degrees (their 90, SD 8; Harland and Steele 1997's
 * "about 90"). The hands lie on the line a shoulder width apart with the
 * arms vertical, so the shoulders stand the arms' reach above the wrists of
 * the laid hands; each foot rests in its block, the ball on the floor and
 * the sole on the face. The hip height is the result: the trunk tilts by a
 * total shared by the lumbopelvic rhythm, the pelvis taking no more than
 * the hips' range of flexion leaves it and the spine the rest
 * (`HumanTrunk.incline`), its root placed so the shoulders stand over the
 * hands, and the tilt is the one at which the front hip joint stands the
 * front knee's hip-to-ankle distance from the front ankle, by bisection to
 * float resolution. The rear knee follows from where the rear block lies.
 *
 * The crouch takes 1.5 s (provisional): the front foot steps back to its
 * block over the first half, the rear foot over the second, while the hips
 * travel and the trunk pitches down; the set is held, and the action ends
 * at the gun. Events: `onYourMarks` (the crouch's start), `set`, `gun`.
 *
 * Not drafted: the on-your-marks kneel with the rear knee down, the drive
 * out of the blocks (the run law's), hurdles, relays, jumps and throws (the
 * jump and throw laws' rows).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture with its source, how each place derives from the body, the timing, the events and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record composed of root, leg and arm rows over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the angles, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The block settings and the front knee are the source's; lengths are the body's; the hip height is solved, never stated.
 */
export namespace athletics {
  /** The action's name. */
  export const name: HumanActionName = "athletics";

  /** Cancel table: the gun releases the start into a run. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      run: ["fromRelax", "reflex"],
      stand: ["fromRelax", "smooth"],
    });

  /** The front knee's included angle in the set, degrees: 90 (SD 8) measured with the anthropometry-driven block setting (Cavedon et al. 2019, PLoS One 14:e0213979, table 2), Harland and Steele's (1997) "about 90". */
  export const FRONT: number = 90;

  /** The front block's distance behind the start line, a share of the leg's length (greater trochanter to lateral malleolus): the anthropometry-driven setting (Cavedon et al. 2019, table 2). */
  export const FRONT_DISTANCE: number = 0.6;

  /** The rear block's distance behind the front block, a share of the leg's length: the same setting's spacing (Cavedon et al. 2019). */
  export const SPACING: number = 0.45;

  /** The most the trunk's total tilt is searched to, degrees: a half turn, past which the trunk would point back up. */
  export const TILT: number = 180;

  /**
   * The whole body's centre of mass behind the start line in the set, metres
   * along the ground, by the sprinter's sex as the sources stratify it: 22.9
   * cm for elite men (Slawinski et al. 2010, J Strength Cond Res 24:896, n =
   * 6) and 16.2 cm for world-class women (Ciacci et al. 2017, J Sports Sci
   * 35:1270, n = 4), both read as Valamatos et al. 2022 report them (Int J
   * Environ Res Public Health 19:4074, section 4.1.2), the primary texts being
   * closed.
   */
  export const CENTRE: Readonly<Record<"female" | "male", number>> = {
    female: 0.162,
    male: 0.229,
  };

  /** The most the straight arms are searched to lean forward from the vertical, degrees: a quarter turn, past which the hands would no longer bear. */
  export const LEAN: number = 90;

  /** The front block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const FRONT_BLOCK: number = 50;

  /** The rear block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const REAR_BLOCK: number = 65;

  /** The share of the straight arm's length the shoulders stand above the wrists (provisional): the elbows a little soft. */
  export const REACH: number = 0.98;

  /** The crouch's seconds (provisional). */
  export const CROUCH: number = 1.5;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The front foot and the time held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No block spacing in metres: the knees decide it.
   */
  export interface IParams {
    /** The front foot; `left` when absent. */
    front?: "left" | "right";

    /** The sprinter's sex, the stratum whose measured centre-of-mass distance the set takes (`CENTRE`); `male` when absent. */
    sex?: "female" | "male";

    /** Seconds held in the set; 1.5 when absent. */
    seconds?: number & tags.Minimum<0> & HumanUnit<"s">;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * The set position's hips, pitch and feet for a body in front of a line.
   *
   * @param context The body.
   * @param entry The standing posture; the line is a hand's length ahead of its feet.
   * @param front The front foot.
   * @returns The hips' world point, the trunk's pitch, each palm's place on the floor and each foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulders over the wrists of the laid hands at the arms' reach, the feet in blocks set by the leg's length, and the trunk's total tilt, shared by the lumbopelvic rhythm within the hips' range, bisected to float resolution until the front hip joint stands the front knee's hip-to-ankle distance from its ankle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The palms, the shoulders, the hips, then one foot per knee angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable knee angle puts the foot under the hip rather than off the floor; the wrist's height is the hand owner's, never half a hand.
   * @evidence contracts/development/implementation.md#efficient-algorithms Once per plan, a bisection to float resolution of about fifty steps, each two posture solves of the trunk with no limb goals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed arm's wrist, pitch and root, and the foot's pivot.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function set(
    context: Pick<IHumanActionContext, "body">,
    entry: IHumanPosture,
    front: "left" | "right",
    sex: "female" | "male" = "male",
  ): {
    hips: IAutoMovieVector3;
    pitch: number;
    joints: IHumanPosture["joints"];
    palms: Record<
      "left" | "right",
      {
        point: IAutoMovieVector3;
        facing: IAutoMovieVector3;
        forward: IAutoMovieVector3;
      }
    >;
    feet: Record<"left" | "right", HumanFoot.IPlacement>;
  } {
    const body = context.body;
    const m = body.measure;
    const frame: HumanFrame.IFrame = {
      origin: { x: entry.root.x, y: 0, z: entry.root.z },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const palm = (side: "left" | "right") => ({
      point: HumanFrame.point(frame, {
        x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
        y: 0,
        z: m.footLength - m.hand / 2,
      }),
      facing: { x: 0, y: -1, z: 0 },
      forward,
    });
    const palms = { left: palm("left"), right: palm("right") };
    // The shoulders stand the arms' reach from the wrists of the laid hands,
    // the straight arms leaning forward from the vertical by `lean` degrees.
    const wrist: Record<"left" | "right", IAutoMovieVector3> = {
      left: AutoMovieMotionHumanPlaced.wrist(body, "left", palms.left),
      right: AutoMovieMotionHumanPlaced.wrist(body, "right", palms.right),
    };
    const wrists: IAutoMovieVector3 = Vector3.lerp(wrist.left, wrist.right, 0.5);
    const arm: number = REACH * (m.upperArm + m.forearm);
    const over = (lean: number): IAutoMovieVector3 =>
      Vector3.add(
        { ...wrists, y: wrists.y + arm * Math.cos((lean * Math.PI) / 180) },
        Vector3.scale(forward, arm * Math.sin((lean * Math.PI) / 180)),
      );
    // Each foot in its block, the ball on the floor and the sole on the
    // block's face, its ball behind the line by the anthropometry-driven
    // setting's share of the leg's length (`FRONT_DISTANCE`, `SPACING`).
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    const leg: number = m.thigh + m.shank;
    const feet: Record<"left" | "right", HumanFoot.IPlacement> = {
      [front]: block(body, entry, frame, front, FRONT_DISTANCE * leg, FRONT_BLOCK),
      [rear]: block(
        body,
        entry,
        frame,
        rear,
        (FRONT_DISTANCE + SPACING) * leg,
        REAR_BLOCK,
      ),
    } as Record<"left" | "right", HumanFoot.IPlacement>;

    // The trunk inclined by a total tilt shared by the lumbopelvic rhythm,
    // the pelvis taking no more than the planted legs' hip range leaves it
    // and the spine the rest (`HumanTrunk.incline`), its root placed so the
    // shoulders stand over the hands.
    const reach: number = Math.sqrt(
      m.thigh * m.thigh +
        m.shank * m.shank -
        2 * m.thigh * m.shank * Math.cos((FRONT * Math.PI) / 180),
    );
    const posed = (q: number, shoulders: IAutoMovieVector3): IStance => {
      const at = (limit: number): IStance => {
        const tilt: { pitch: number; joints: IHumanPosture["joints"] } =
          HumanTrunk.incline(entry.joints, q, limit);
        const turned: IHumanPosture = {
          ...entry,
          root: { x: 0, y: 0, z: 0 },
          pitch: tilt.pitch,
          roll: 0,
          joints: tilt.joints,
          // The trunk alone is read: the limbs' goals move no joint of it.
          limbs: {},
        };
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          resolveHumanPosture(body, turned),
        );
        const girdle: IAutoMovieVector3 = Vector3.lerp(
          bones.get("leftUpperArm")!.worldPosition,
          bones.get("rightUpperArm")!.worldPosition,
          0.5,
        );
        const root: IAutoMovieVector3 = Vector3.subtract(shoulders, girdle);
        return {
          pitch: tilt.pitch,
          joints: tilt.joints,
          hips: Vector3.add(root, bones.get("hips")!.worldPosition),
          joint: Vector3.add(root, bones.get(`${front}UpperLeg`)!.worldPosition),
          root,
        };
      };
      const free: IStance = at(Infinity);
      return at(
        HumanTrunk.pelvisLimit(
          body,
          Vector3.subtract(free.hips, body.rest.get("hips")!),
          entry.yaw,
          { left: feet.left.ankle, right: feet.right.ankle },
        ),
      );
    };

    // The total tilt at which the front hip joint stands the front knee's
    // hip-to-ankle distance (the law of cosines on the thigh and the shank)
    // from the front ankle, by bisection to float resolution: halved until
    // the midpoint is one of its ends. The gap grows with the tilt, which
    // lifts the hips away from the blocks about the planted hands.
    const tilted = (shoulders: IAutoMovieVector3): IStance => {
      const gap = (q: number): number =>
        Vector3.length(
          Vector3.subtract(posed(q, shoulders).joint, feet[front].ankle),
        ) - reach;
      let low: number = 0;
      let high: number = TILT;
      for (
        let middle: number = (low + high) / 2;
        middle > low && middle < high;
        middle = (low + high) / 2
      )
        if (gap(middle) < 0) low = middle;
        else high = middle;
      return posed(low, shoulders);
    };

    // The arms' lean at which the whole body's centre of mass stands the
    // measured distance behind the line (`CENTRE`), its ground projection
    // read on the set posture with its legs on the blocks and its hands on
    // the line, by bisection to float resolution. The distance falls as the
    // lean carries the shoulders, and the hips with them, toward the line.
    const line: number = m.footLength;
    const behind = (lean: number): number => {
      const stance: IStance = tilted(over(lean));
      const posture: IHumanPosture = {
        ...entry,
        root: stance.root,
        pitch: stance.pitch,
        roll: 0,
        joints: stance.joints,
        limbs: {},
      };
      const limbs: IHumanPosture["limbs"] = {
        leftLeg: AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          "left",
          feet.left,
          true,
        ),
        rightLeg: AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          "right",
          feet.right,
          true,
        ),
        leftArm: {
          point: wrist.left,
          bend: AutoMovieMotionHumanBend.hang(body, posture, "left"),
        },
        rightArm: {
          point: wrist.right,
          bend: AutoMovieMotionHumanBend.hang(body, posture, "right"),
        },
      };
      return (
        line -
        HumanFrame.local(
          frame,
          HumanBalance.support(body, { ...posture, limbs }).centre,
        ).z
      );
    };
    let near: number = 0;
    let far: number = LEAN;
    for (
      let middle: number = (near + far) / 2;
      middle > near && middle < far;
      middle = (near + far) / 2
    )
      if (behind(middle) > CENTRE[sex]) near = middle;
      else far = middle;
    const stance: IStance = tilted(over(near));
    return {
      hips: stance.hips,
      pitch: stance.pitch,
      joints: stance.joints,
      palms,
      feet,
    };
  }

  /**
   * Plan a sprint start.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The set position solved once; the root, the feet and the hands carried into it on one phrase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Set, clock, root row, two leg rows, two arm rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every place is the body's; provisional times are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the leg arc, the placed arm and the posture heading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the set position and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const hold: number = p.seconds ?? 1.5;
    HumanBound.least("seconds", hold, 0, "s");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const front: "left" | "right" = p.front ?? "left";
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    const entry: IHumanPosture = context.entry.posture;
    const target = set(context, entry, front, p.sex ?? "male");
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: CROUCH,
        attack: 0,
        hold,
        retract: 0.001,
      }),
      modifiers,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "onYourMarks", seconds: 0 },
        { name: "set", seconds: timed.at("ready") },
        { name: "gun", seconds: timed.at("relax") },
      ],
    );
    const into = (seconds: number): number =>
      clock.progress("start", "ready", seconds);
    // The span the arms are planned over: the reach to the place, held to the end.
    const span: AutoMovieMotionHumanArm.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("end"),
      end: clock.at("end"),
    };
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standingHips: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(entry), hipsRest),
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
          const w: number = into(seconds);
          // The spine's share of the trunk's tilt comes in with the pelvis's.
          const flexed = (
            bone: "spine" | "chest",
          ): readonly [number, number, number] => {
            const was: readonly [number, number, number] = posture.joints[
              bone
            ] ?? [0, 0, 0];
            const added: number =
              (target.joints[bone]?.[0] ?? 0) - (entry.joints[bone]?.[0] ?? 0);
            return [was[0] + added * w, was[1], was[2]];
          };
          const pitched: IHumanPosture = {
            ...posture,
            pitch: posture.pitch + target.pitch * w,
            joints: {
              ...posture.joints,
              spine: flexed("spine"),
              chest: flexed("chest"),
            },
          };
          const hips: IAutoMovieVector3 = Vector3.lerp(
            standingHips,
            target.hips,
            w,
          );
          return {
            ...pitched,
            root: Vector3.subtract(
              hips,
              Quaternion.rotateVector(
                resolveHumanPosture.heading(pitched),
                hipsRest,
              ),
            ),
          };
        },
      },
    ];
    for (const [side, from, to] of [
      [front, "start", "half"],
      [rear, "half", "ready"],
    ] as const) {
      const stance: HumanFoot.IPlacement = {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      };
      const block: HumanFoot.IPlacement = target.feet[side];
      const share = (seconds: number): number => {
        const half: number = clock.at("ready") / 2;
        const a: number = from === "start" ? 0 : half;
        const b: number = to === "half" ? half : clock.at("ready");
        return Math.min(1, Math.max(0, (seconds - a) / (b - a)));
      };
      primitives.push(
        AutoMovieMotionHumanLeg.place({
          body,
          side,
          from: 0,
          to: clock.duration,
          placement: (
            _: IHumanPosture,
            seconds: number,
          ): HumanFoot.IPlacement =>
            AutoMovieMotionHumanLeg.arc(
              stance,
              block,
              0.05 * body.measure.stature,
              share(seconds),
            ),
          planted: (seconds: number): boolean =>
            share(seconds) <= 0 || share(seconds) >= 1,
        }),
      );
    }
    for (const side of ["left", "right"] as const)
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: into,
          span,
          place: () => target.palms[side],
          bend: "front",
        }),
      );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, [
        {
          part: "leftFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "leftHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
      ]),
      clock,
      primitives,
      contact: "set",
    });
  }
}

/** A set stance at one total tilt: the pelvis's pitch, the spine's flexion added, and the hips, the front hip joint and the root placed so the shoulders stand over the hands, world metres. */
interface IStance {
  pitch: number;
  joints: IHumanPosture["joints"];
  hips: IAutoMovieVector3;
  joint: IAutoMovieVector3;
  root: IAutoMovieVector3;
}

/**
 * A foot in its block: the ball on the floor `behind` metres behind the
 * start line (the entry's foot length ahead of the root, where the hands lie),
 * the sole turned up onto the block's face.
 */
function block(
  body: IHumanBody,
  entry: IHumanPosture,
  frame: HumanFrame.IFrame,
  side: "left" | "right",
  behind: number,
  face: number,
): HumanFoot.IPlacement {
  return HumanFoot.pivot(
    body,
    side,
    "ball",
    HumanFrame.point(frame, {
      x: body.rest.get(`${side}UpperLeg`)!.x,
      y: 0,
      z: body.measure.footLength - behind,
    }),
    entry.yaw,
    -face,
  );
}
