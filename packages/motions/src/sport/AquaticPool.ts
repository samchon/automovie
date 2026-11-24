import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { AquaticDive } from "./AquaticDive";
import { AquaticPosture } from "./AquaticPosture";
import { swim } from "./swim";

/** The alternatives of `RaceStroke`'s site. */
type RaceStroke = "breaststroke" | "frontCrawl";

/** The alternatives of `RaceKind`'s site. */
type RaceKind = "crawlStartTurn" | "breaststrokeStartTurn";

/**
 * Pool racing starts, stroke and wall reversal. World Aquatics distinguishes
 * crawl wall contact from the two-hand breaststroke touch. Puel et al. (PMID
 * 22176710) motivate separating rotation, plant and push.
 */
export namespace AquaticPool {
  /** Calibrated wall crossing and horizontal clearance for the swimmer's lane. */
  interface IEdge {
    /** Forward distance from the entered root to the wall plane, in metres. */
    distance: number;
    /** World unit direction along the finite edge. */
    along: IAutoMovieVector3;
    /** Distance from the edge centre to the swimmer's lane, in metres. */
    offset: number;
    /** Half the physical edge span, in metres. */
    halfSpan: number;
  }

  /**
   * Pool race with an authored short course, resolved wall contacts and a
   * reused stroke cycle on either course.
   */
  export function race(
    context: AquaticPosture.Context,
    water: number,
    kind: RaceKind,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    const forward: IAutoMovieVector3 = HumanFrame.forward(entry.posture.yaw);
    const support: string | undefined = context.params.support;
    const edge: IEdge | undefined =
      support === undefined ? undefined : laneEdge(context, support, forward);
    const distance: number = edge?.distance ?? context.params.wall ?? 6;
    HumanBound.above("wall", distance, 3, "m");
    const flight: ReturnType<typeof AquaticDive.departure> =
      AquaticDive.departure(context, water, false);
    const breast: boolean = kind === "breaststrokeStartTurn";
    const stroke: RaceStroke = breast ? "breaststroke" : "frontCrawl";
    const inbound: IAutoMovieMotionHumanActionPlan = swim.plan({
      ...context,
      params: { kind: stroke, water, count: 2 },
    });
    const outbound: IAutoMovieMotionHumanActionPlan = swim.plan({
      ...context,
      entry: {
        ...entry,
        posture: { ...entry.posture, yaw: entry.posture.yaw + 180 },
      },
      params: { kind: stroke, water, count: 1 },
    });
    const wall: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      distance,
      water - 0.32,
    );
    const tuck: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: breast ? 47 : 160, spine: [22, 0, 0] },
        {
          hip: 65,
          knee: 95,
          shoulder: 40,
          raise: 16,
          elbow: 75,
        },
      ),
      AquaticPosture.along(entry.posture, distance - 0.55, water - 0.57),
    );
    const approaching: IAutoMovieMotionHumanPosture = breast
      ? pin(
          context,
          ["leftHand", "rightHand"],
          { ...wall, y: water - 0.07 },
          edge,
        )(
          AquaticPosture.key(
            entry.posture,
            ExerciseKey.from(
              body,
              { pitch: 85 },
              {
                shoulder: 160,
                raise: 8,
                elbow: 14,
                ankle: -18,
                knee: 18,
              },
            ),
            tuck.root,
          ),
        )
      : tuck;
    const pinFeet: ReturnType<typeof pin> = pin(
      context,
      ["leftFoot", "rightFoot"],
      wall,
      edge,
    );
    const planted: IAutoMovieMotionHumanPosture = pinFeet(
      AquaticPosture.key(
        entry.posture,
        ExerciseKey.from(
          body,
          {
            yaw: 180,
            pitch: 68,
            spine: [14, 0, 0],
          },
          {
            hip: 50,
            spread: 8,
            knee: 95,
            ankle: 10,
            shoulder: 165,
            raise: 8,
            elbow: 10,
          },
        ),
        tuck.root,
      ),
    );
    const pushing: IAutoMovieMotionHumanPosture = pinFeet(
      AquaticPosture.key(
        entry.posture,
        ExerciseKey.from(
          body,
          { yaw: 180, pitch: 89 },
          {
            hip: 3,
            spread: 4,
            knee: 14,
            ankle: -29,
            shoulder: 172,
            raise: 7,
            elbow: 5,
          },
        ),
        planted.root,
      ),
    );
    const tBreakout: number = flight.entry + 0.55;
    const tApproach: number = tBreakout + inbound.duration;
    const tTouch: number = tApproach + 0.28;
    const tPlant: number = tTouch + (breast ? 0.43 : 0.35);
    const tPush: number = tPlant + 0.2;
    const tResume: number = tPush + 0.56;
    const duration: number = tResume + outbound.duration;

    const inboundStart: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      1.55,
      inbound.posture(0).root.y,
    );
    const inboundEnd: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      distance - 1.1,
      inbound.posture(inbound.duration).root.y,
    );
    const outboundStart: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      distance - 1.65,
      outbound.posture(0).root.y,
    );
    const outShift: IAutoMovieVector3 = Vector3.subtract(
      outboundStart,
      outbound.posture(0).root,
    );
    const swimIn: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const shaped: IAutoMovieMotionHumanPosture = inbound.posture(seconds);
      const root: IAutoMovieVector3 = Vector3.lerp(
        inboundStart,
        inboundEnd,
        seconds / inbound.duration,
      );
      return AquaticPosture.translate(shaped, { ...root, y: shaped.root.y });
    };
    const swimOut: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const shaped: IAutoMovieMotionHumanPosture = outbound.posture(seconds);
      return AquaticPosture.translate(
        shaped,
        Vector3.add(shaped.root, outShift),
      );
    };
    const entering: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(flight.immersed, swimIn(0));
    const reach: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      swimIn(inbound.duration),
      approaching,
    );
    const turn: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      approaching,
      planted,
    );
    const push: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      planted,
      pushing,
    );
    const glide: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      pushing,
      swimOut(0),
    );

    // Keep the measured foot midpoint on the wall while shape extends to push-off.
    const wallContacts: IAutoMovieMotionHumanContactWindow[] =
      context.params.support === undefined
        ? []
        : (["left", "right"] as const).flatMap(
            (
              side: AutoMovieHumanSide,
            ): IAutoMovieMotionHumanContactWindow[] => [
              ...(breast
                ? [
                    {
                      part: `${side}Hand` as const,
                      kind: "strike" as const,
                      from: tTouch / duration,
                      to: tTouch / duration,
                      support: {
                        kind: "prop" as const,
                        subject: context.params.support!,
                      },
                    },
                  ]
                : []),
              {
                part: `${side}Foot` as const,
                kind: "bear",
                from: tPlant / duration,
                to: tPush / duration,
                support: { kind: "prop", subject: context.params.support! },
              },
            ],
          );

    return {
      duration,
      events: [
        { name: "takeOff", share: flight.release / duration },
        { name: "waterEntry", share: flight.entry / duration },
        { name: "breakout", share: tBreakout / duration },
        { name: breast ? "twoHandTouch" : "tumble", share: tTouch / duration },
        { name: "wallPlant", share: tPlant / duration },
        { name: "pushOff", share: tPush / duration },
        { name: "resumeStroke", share: tResume / duration },
        { name: "relax", share: 1 },
      ],
      contacts: [
        ...flight.contacts.map(
          (
            contact: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow => ({
            ...contact,
            to: flight.release / duration,
          }),
        ),
        ...wallContacts,
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= flight.entry) return flight.posture(t);
        if (t < tBreakout)
          return entering((t - flight.entry) / (tBreakout - flight.entry));
        if (t < tApproach) return swimIn(t - tBreakout);
        if (t < tTouch) return reach((t - tApproach) / (tTouch - tApproach));
        if (t < tPlant) return turn((t - tTouch) / (tPlant - tTouch));
        if (t <= tPush) return pinFeet(push((t - tPlant) / (tPush - tPlant)));
        if (t < tResume) return glide((t - tPush) / (tResume - tPush));
        return swimOut(t - tResume);
      },
    };
  }

  /** Read the planted edge of a fixed, perpendicular lane wall at action entry. */
  function laneEdge(
    context: AquaticPosture.Context,
    support: string,
    forward: IAutoMovieVector3,
  ): IEdge {
    const placed: ReturnType<typeof WorkoutSupport.placed> =
      WorkoutSupport.placed(context, { prop: support, affordance: "edge" });
    const length: number | undefined = placed.affordance.length;
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      placed.frame.rotation,
      placed.affordance.frame.rotation,
    );
    const along: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const delta: IAutoMovieVector3 = Vector3.subtract(
      placed.point,
      context.entry.posture.root,
    );
    const offset: number = Math.abs(Vector3.dot(delta, along));

    // The authored turn keeps both contacts at one lane depth, which requires
    // the wall plane to face the swimmer. Allow rotation roundoff.
    if (
      placed.affordance.kind !== "ledge" ||
      length === undefined ||
      !Number.isFinite(length) ||
      !(offset < length / 2) ||
      !(Math.abs(along.y) <= 1e-8) ||
      !(Vector3.dot(normal, forward) <= -1 + 1e-8)
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "support",
        value: support,
        reason:
          "the pool end wall must provide a finite level edge across and facing the swimmer's lane",
        fix: "align the end wall perpendicularly to the lane with enough edge span for both contacts",
      });
    return {
      distance: Vector3.dot(delta, forward),
      along,
      offset,
      halfSpan: length / 2,
    };
  }

  /**
   * Centre a displayed marker pair at the target and keep both within the
   * physical wall span.
   */
  function pin(
    context: AquaticPosture.Context,
    bones: readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone],
    target: IAutoMovieVector3,
    edge: IEdge | undefined,
  ): (posture: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture {
    const markersAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(context.body, bones);
    return (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const markers: ReturnType<typeof markersAt> = markersAt(posture);
      const a: IAutoMovieVector3 = markers.get(bones[0])!.worldPosition;
      const b: IAutoMovieVector3 = markers.get(bones[1])!.worldPosition;
      if (
        edge !== undefined &&
        edge.offset +
          Math.abs(Vector3.dot(Vector3.subtract(a, b), edge.along)) / 2 >
          edge.halfSpan
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "support",
          value: context.params.support,
          reason:
            "the swimmer's contact pair extends past the end of the physical wall",
          fix: "centre the swimmer's lane within the end wall or widen its span",
        });
      return AquaticPosture.translate(
        posture,
        Vector3.add(
          posture.root,
          Vector3.subtract(target, Vector3.lerp(a, b, 0.5)),
        ),
      );
    };
  }
}
