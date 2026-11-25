import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTargetGrid } from "../compose/AutoMovieMotionHumanTargetGrid";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanPerformanceTempo } from "../perform/HumanPerformanceTempo";
import { HumanFrame } from "../posture/HumanFrame";
import type { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";
import { MartialArtStancePhrase } from "./MartialArtStancePhrase";
import { prepareChokuZukiPath } from "./prepareChokuZukiPath";

/**
 * Martial-art forms other than kickboxing: the karate horse stance
 * (kiba-dachi), alternating straight punches from it (choku-zuki) and the tai
 * chi push in a bow stance.
 *
 * - Horse stance: the left foot steps out until the feet stand two shoulder
 *   widths apart (provisional) and the hips sink a fifth of the thigh
 *   (provisional), held, and the foot steps back.
 * - Choku-zuki: each fist leaves a waist-high chamber outside the live shoulder
 *   and passes around the flank before reaching the midline at chest height.
 *   The other fist returns to its chamber (hikite). Upper-arm and forearm radii
 *   provide provisional clearance for the tucked elbow as it turns. Each punch
 *   extends in 0.2 s and stays 0.2 s, inside the 400 ms a choku-zuki takes
 *   (VencesBrito et al. 2011); the hands alternate.
 * - Tai chi push: the lead foot steps ahead 0.35 statures (provisional) over 3 s
 *   as the hips come half the step forward and sink until both legs reach their
 *   feet; over 3 s more the weight shifts to six tenths of the step as the
 *   palms push from before the chest to an arm's reach ahead, then shifts back
 *   over 3 s, and the foot returns over 3 s: the slow, continuous form of tai
 *   chi (Wu and Hitt 2005).
 *
 * The karate and tai chi stance phrases link their own support transfers and
 * arm carriage on a single clock. The taekwondo and Muay Thai solo resets share
 * that support and recovery clock under their styles' low and high guards.
 * Their distinct pelvis paths and guard sites are authored blocking for screen
 * animation.
 */
export namespace martialArt {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "martialArt";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      martialArt: ["fromRelax", "smooth"],
    });

  /**
   * A punch's extension and its stay, seconds (VencesBrito et al. 2011: the
   * whole technique in 400 ms).
   */
  export const PUNCH: number = 0.2;

  /** The tai chi push's shift, seconds each way (provisional). */
  export const PUSH: number = 3;

  /**
   * Plan a martial-art technique.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number or the
   *   hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanMartialArt.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      body.measure;
    const count: number = HumanBound.whole("count", p.count ?? 4);
    const hold: number = p.hold ?? 1;
    HumanBound.least("hold", hold, 0, "s");
    if (
      p.kind === "karateStanceTransfer" ||
      p.kind === "taiChiTransfer" ||
      p.kind === "taekwondoStanceReset" ||
      p.kind === "muayThaiStanceReset" ||
      p.kind === "capoeiraGinga" ||
      p.kind === "sumoShiko" ||
      p.kind === "wingChunStance"
    )
      return stancePhrase(context, p.kind, hold);

    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );

    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const axes: IAutoMovieMotionHumanFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(axes, {
      x: 0,
      y: 0,
      z: 1,
    });
    const leftward: IAutoMovieVector3 = HumanFrame.point(axes, {
      x: 1,
      y: 0,
      z: 0,
    });
    const stance: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    // Tai chi is slow throughout: its step takes the push's time.
    const step: number = p.kind === "taiChiPush" ? PUSH : 0.6;
    const middle: number =
      p.kind === "chokuZuki" ? count * 2 * PUNCH + PUNCH : hold;
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: step,
        attack: p.kind === "taiChiPush" ? PUSH : middle,
        follow: p.kind === "taiChiPush" ? PUSH : 0,
        retract: step,
      }),
      modifiers,
    );
    const into: (s: number) => number = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    // The span the arms are planned over: the reach to the place, the hold and the return.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.at("end"),
    };
    const root: (
      offset: (s: number) => IAutoMovieVector3,
    ) => IAutoMovieMotionHumanPrimitive = (
      offset: (s: number) => IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive => ({
      channels: ["root"],
      from: 0,
      to: clock.duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        s: number,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        root: Vector3.add(posture.root, offset(s)),
      }),
    });
    const lead: (
      side: AutoMovieHumanSide,
      by: IAutoMovieVector3,
      s: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
      by: IAutoMovieVector3,
      s: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      AutoMovieMotionHumanLeg.arc(
        stance[side],
        {
          ankle: Vector3.add(stance[side].ankle, by),
          rotation: stance[side].rotation,
        },
        0.03 * m.stature,
        into(s),
      );
    const bearing: (s: number) => boolean = (s: number): boolean =>
      into(s) <= 0 || into(s) >= 1;
    const stepped: (
      side: AutoMovieHumanSide,
      by: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanPrimitive = (
      side: AutoMovieHumanSide,
      by: IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanLeg.place({
        body,
        side,
        from: 0,
        to: clock.duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => lead(side, by, s),
        planted: bearing,
      });
    const rest: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanArmAngles.IAngles = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanArmAngles.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    // The right foot stands throughout; the left steps out over the way into
    // the stance and back over the way out of it, and bears between.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "leftFoot",
        kind: "plant",
        from: clock.at("ready") / clock.duration,
        to: clock.at("relax") / clock.duration,
        support: { kind: "ground" },
      },
    ];

    if (p.kind === "horseStance" || p.kind === "chokuZuki") {
      const apart: number = Vector3.dot(
        Vector3.subtract(stance.left.ankle, stance.right.ankle),
        leftward,
      );
      const out: number = Math.max(
        0,
        4 * m.shoulderHalfWidth * modifiers.extent - apart,
      );
      const sink: number = 0.2 * m.thigh * modifiers.extent;
      primitives.push(
        stepped("left", Vector3.scale(leftward, out)),
        root(
          (s: number): IAutoMovieVector3 =>
            Vector3.add(Vector3.scale(leftward, (out / 2) * into(s)), {
              x: 0,
              y: -sink * into(s),
              z: 0,
            }),
        ),
      );
    }
    if (p.kind === "chokuZuki") {
      // Punch i starts at `ready + 2 i PUNCH`, by the right hand first.
      const ready: number = clock.at("ready");
      const len: number = PUNCH * modifiers.tempo;
      const start: (i: number) => number = (i: number): number =>
        ready + 2 * i * PUNCH * modifiers.tempo;
      const extended: (side: AutoMovieHumanSide, s: number) => number = (
        side: AutoMovieHumanSide,
        s: number,
      ): number => {
        const first: number = side === "right" ? 0 : 1;
        if (s < start(first)) return 0;

        // Each arm's three-unit pulse fits inside its four-unit period.
        // Check the next authored start to preserve the exact phase if
        // floating-point division rounds the estimated cycle down.
        let i: number = first + 2 * Math.floor((s - start(first)) / (4 * len));
        if (s >= start(i + 2)) i += 2;
        if (i >= count) return 0;
        const a: number = start(i);
        const rise: number = Math.min(1, Math.max(0, (s - a) / len));
        const fall: number = Math.min(1, Math.max(0, (s - a - 2 * len) / len));
        return Math.max(0, rise - fall);
      };
      // The chamber stands outside both the shoulder's line and the flank,
      // the chest's half breadth, by a forearm diameter, at waist height.
      const chamber: IAutoMovieVector3 = {
        x: Math.max(
          m.upperArmRadius + m.forearmRadius,
          m.chestBreadth / 2 + 2 * m.forearmRadius - m.shoulderHalfWidth,
        ),
        y: m.waistHeight - m.shoulderHeight,
        z:
          AutoMovieMotionHumanTargetGrid.DISTANCES.close *
            (m.upperArm + m.forearm) +
          m.forearmRadius / 2,
      };
      const path: prepareHumanKnotCourse.ICourse = prepareChokuZukiPath(
        body,
        chamber,
      );
      for (const side of ["left", "right"] as const) {
        const outward: number = side === "left" ? 1 : -1;
        const chamberOffset: IAutoMovieVector3 = {
          ...chamber,
          x: outward * chamber.x,
        };
        primitives.push(
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight: into,
            span,
            // The clock is the law's own, lengthened by a slower tempo.
            together: AutoMovieMotionHumanArm.together(
              context.handover,
              true,
              context.tempo,
            ),
            surface: "fist",
            shape: "fist",
            place: (
              posture: IAutoMovieMotionHumanPosture,
              s: number,
              resolution?: Parameters<
                IAutoMovieMotionHumanActionPlan["posture"]
              >[2],
            ) => {
              const axes: IAutoMovieMotionHumanFrame = {
                origin: { x: 0, y: 0, z: 0 },
                yaw: posture.yaw,
              };
              const shoulder: IAutoMovieVector3 =
                AutoMovieMotionHumanPlaced.joint(
                  body,
                  posture,
                  `${side}UpperArm`,
                  resolution,
                );
              const local: IAutoMovieMotionHumanFrame = {
                ...axes,
                origin: shoulder,
              };
              const aim: IAutoMovieVector3 = HumanFrame.point(
                {
                  origin: { x: posture.root.x, y: 0, z: posture.root.z },
                  yaw: posture.yaw,
                },
                {
                  x: 0,
                  y:
                    AutoMovieMotionHumanTargetGrid.height(body, "chest") *
                    m.stature,
                  z: m.upperArm + m.forearm,
                },
              );
              const phase: number = extended(side, s);

              // The fist's shares of the way from chamber to aim, inward and
              // ahead, on the punch's prepared path (`prepareChokuZukiPath`).
              const from: IAutoMovieVector3 = chamberOffset;
              const to: IAutoMovieVector3 = HumanFrame.local(local, aim);
              const share: readonly number[] = path.position(phase);
              return {
                point: HumanFrame.point(local, {
                  x: from.x + (to.x - from.x) * share[0]!,
                  y: from.y + (to.y - from.y) * share[1]!,
                  z: from.z + (to.z - from.z) * share[1]!,
                }),
                facing: HumanFrame.point(axes, { x: 0, y: 0, z: 1 }),
              };
            },
            bend: "tucked",
          }),
        );
      }
    }
    if (p.kind === "taiChiPush") {
      const stride: number = 0.35 * m.stature * modifiers.extent;
      const arm: number = m.upperArm + m.forearm;
      const near: number = AutoMovieMotionHumanTargetGrid.DISTANCES.near * arm;
      const far: number = AutoMovieMotionHumanTargetGrid.DISTANCES.far * arm;
      const inside: number =
        (1 - AutoMovieMotionHumanTargetGrid.LATERALS.inside) *
        m.shoulderHalfWidth;
      const below: number = m.chestHeight - m.shoulderHeight;
      const shift: (s: number) => number = (s: number): number =>
        clock.envelope(["strokeStart", "stroke"], ["stroke", "strokeEnd"], s);
      // The hips travel between the feet and sink until each bearing leg
      // reaches its foot: the bow stance's depth follows from the stride.
      primitives.push(
        AutoMovieMotionHumanLean.sway({
          body,
          from: 0,
          to: clock.duration,
          angles: (): IAutoMovieMotionHumanLean.IAngles => ({
            pitch: 0,
            roll: 0,
          }),
          shift: (s: number): IAutoMovieVector3 => ({
            x: 0,
            y: 0,
            z: stride * (0.5 * into(s) + 0.1 * shift(s)),
          }),
          legs: (s: number) => ({
            leftLeg: AutoMovieMotionHumanLeg.goal(
              body,
              entry,
              "left",
              lead("left", Vector3.scale(forward, stride), s),
              bearing(s),
            ),
            rightLeg: AutoMovieMotionHumanLeg.goal(
              body,
              entry,
              "right",
              stance.right,
              true,
            ),
          }),
        }),
        stepped("left", Vector3.scale(forward, stride)),
      );
      for (const side of ["left", "right"] as const)
        primitives.push(
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight: into,
            span,
            together: AutoMovieMotionHumanArm.together(
              context.handover,
              true,
              context.tempo,
            ),
            place: (
              posture: IAutoMovieMotionHumanPosture,
              s: number,
              resolution?: Parameters<
                IAutoMovieMotionHumanActionPlan["posture"]
              >[2],
            ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => ({
              point: Vector3.add(
                AutoMovieMotionHumanPlaced.joint(
                  body,
                  posture,
                  `${side}UpperArm`,
                  resolution,
                ),
                HumanFrame.point(
                  { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                  {
                    x: side === "left" ? -inside : inside,
                    y: below,
                    z: near + (far - near) * shift(s),
                  },
                ),
              ),
              facing: HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                { x: 0, y: 0, z: 1 },
              ),
              forward: { x: 0, y: 1, z: 0 },
            }),
            bend: "front",
          }),
        );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
    });
  }
}

/** Prepare the shared arm and support clock before exposing the phrase. */
function stancePhrase(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams>,
  kind: Parameters<typeof MartialArtStancePhrase>[1],
  hold: number,
): IAutoMovieMotionHumanActionPlan {
  return HumanPerformanceTempo.paced(context, (at) =>
    MartialArtStancePhrase(
      at,
      kind,
      hold,
      AutoMovieMotionManner(at, at.params.manner),
    ),
  );
}
