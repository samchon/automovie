import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { AquaticDive } from "./AquaticDive";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticWallContact } from "./AquaticWallContact";
import { swim } from "./swim";

/*
 * Pool racing starts, stroke and wall reversal. World Aquatics distinguishes
 * crawl wall contact from the simultaneous separated breaststroke touch (7.7).
 * Puel et al. (PMID 22176710) motivate separating rotation, plant and push.
 */
export namespace AquaticPool {
  /*
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
    const tBreakout: number = flight.entry + 0.55;
    const tApproach: number = tBreakout + inbound.duration;
    const tTouch: number = tApproach + 0.28;
    const tPlant: number = tTouch + (breast ? 0.43 : 0.35);
    const tPush: number = tPlant + 0.2;
    const tResume: number = tPush + 0.56;
    const duration: number = tResume + outbound.duration;
    const wall: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      distance,
      water - 0.32,
    );
    const virtual: AquaticWallContact.Face = {
      origin: wall,
      rotation: wallRotation(forward),
      width: Infinity,
      depth: Infinity,
    };
    const at = (seconds: number): AquaticWallContact.Face =>
      edge?.face(seconds) ?? virtual;
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
    const handKey: IAutoMovieMotionHumanPosture = breast
      ? AquaticPosture.key(
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
        )
      : tuck;
    const touchFace: AquaticWallContact.Face = at(tTouch);
    const hands: AquaticWallContact.IContactPair | undefined = breast
      ? AquaticWallContact.prepare(context, "Hand", handKey, touchFace, {
          ...wall,
          y: water - 0.07,
        })
      : undefined;
    const approaching: IAutoMovieMotionHumanPosture =
      hands === undefined ? tuck : hands.make(hands.start, touchFace);
    const handClearance: number[] | undefined = hands?.verify(
      approaching,
      touchFace,
    );
    const plantKey: IAutoMovieMotionHumanPosture = AquaticPosture.key(
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
    );
    const plantFace: AquaticWallContact.Face = at(tPlant);
    const feet: AquaticWallContact.IContactPair = AquaticWallContact.prepare(
      context,
      "Foot",
      plantKey,
      plantFace,
      wall,
    );
    const planted: IAutoMovieMotionHumanPosture = feet.make(
      feet.start,
      plantFace,
    );
    const pushFace: AquaticWallContact.Face = at(tPush);
    const pushKey: IAutoMovieMotionHumanPosture = feet.center(
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
      pushFace,
    );
    const pushing: IAutoMovieMotionHumanPosture = feet.make(pushKey, pushFace);

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
    const outboundOpening: IAutoMovieMotionHumanPosture = outbound.posture(0);
    const outboundStart: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      distance - 1.65,
      outboundOpening.root.y,
    );
    const outShift: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      outboundStart,
      outboundOpening.root,
    );
    const swimIn: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const shaped: IAutoMovieMotionHumanPosture = inbound.posture(seconds);
      const root: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
        inboundStart,
        inboundEnd,
        seconds / inbound.duration,
      );
      return AquaticPosture.translate(shaped, { ...root, y: shaped.root.y });
    };
    const swimOut: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const shaped: IAutoMovieMotionHumanPosture =
        seconds === 0 ? outboundOpening : outbound.posture(seconds);
      return AquaticPosture.translate(
        shaped,
        AutoMovieEngineVector3.add(shaped.root, outShift),
      );
    };
    const entering: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(flight.immersed, swimIn(0));
    const touched: IAutoMovieMotionHumanPosture =
      hands === undefined
        ? approaching
        : AquaticWallContact.key(context, approaching);
    const reach: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      swimIn(inbound.duration),
      touched,
    );
    const turn: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      touched,
      AquaticWallContact.key(context, planted),
    );
    const push: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      feet.start,
      pushKey,
    );
    const glide: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      AquaticWallContact.key(context, pushing),
      swimOut(0),
    );

    const pressed = (seconds: number): IAutoMovieMotionHumanPosture =>
      feet.make(push((seconds - tPlant) / (tPush - tPlant)), at(seconds));
    const footClearance: number[] = feet.verify(planted, plantFace);
    for (const share of [0.25, 0.5, 0.75, 1]) {
      const seconds: number = tPlant + (tPush - tPlant) * share;
      feet.verify(pressed(seconds), at(seconds));
    }
    const wallSupport = {
      kind: "prop" as const,
      subject: support!,
      ...(edge?.point === "wall" ? { point: edge.point } : {}),
    };
    // The hands touch once and the feet retain their own anchors until push-off.
    const wallContacts: IAutoMovieMotionHumanContactWindow[] =
      context.params.support === undefined
        ? []
        : (["left", "right"] as const).flatMap(
            (
              side: AutoMovieHumanSide,
              index: number,
            ): IAutoMovieMotionHumanContactWindow[] => [
              ...(breast
                ? [
                    {
                      part: `${side}Hand` as const,
                      kind: "strike" as const,
                      from: tTouch / duration,
                      to: tTouch / duration,
                      support: wallSupport,
                      ...(edge?.point === "wall"
                        ? {
                            material: {
                              bone: `${side}Hand` as const,
                              point: hands!.anchor[index]!,
                              normal: HumanMaterialContact.NORMAL,
                              clearance: handClearance![index]!,
                            },
                          }
                        : {}),
                    },
                  ]
                : []),
              {
                part: `${side}Foot` as const,
                kind: "bear",
                from: tPlant / duration,
                to: tPush / duration,
                support: wallSupport,
                ...(edge?.point === "wall"
                  ? {
                      material: {
                        bone: `${side}Foot` as const,
                        point: feet.anchor[index]!,
                        normal: HumanMaterialContact.NORMAL,
                        clearance: footClearance[index]!,
                      },
                    }
                  : {}),
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
        if (t <= tPush) return pressed(t);
        if (t < tResume) return glide((t - tPush) / (tResume - tPush));
        return swimOut(t - tResume);
      },
    };
  }

  /*
   * Calibrated wall crossing and horizontal clearance for the swimmer's lane.
   */
  interface IEdge {
    /*
     * Forward distance from the entered root to the wall plane, in metres.
     */
    distance: number;
    /*
     * Which named frame owns the wall contact.
     */
    point: string;
    /*
     * The displayed face at an action second.
     */
    face(seconds: number): AquaticWallContact.Face;
  }

  /*
   * Bind the named wall face and the starting distance of the swimmer's lane.
   */
  function laneEdge(
    context: AquaticPosture.Context,
    support: string,
    forward: IAutoMovieVector3,
  ): IEdge {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(support);
    const contacts: readonly IAutoMovieAffordance[] =
      reader.prop.affordances ?? [];
    const named: IAutoMovieAffordance | undefined =
      contacts.find(
        (item: IAutoMovieAffordance): boolean =>
          item.id === "wall" && item.kind === "surface",
      ) ??
      contacts.find(
        (item: IAutoMovieAffordance): boolean =>
          item.id === "edge" && item.kind === "ledge",
      );
    const refuse = (): AutoMovieMotionHumanRefusal =>
      new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "support",
        value: support,
        reason:
          "the pool end wall needs a finite level edge across and facing the swimmer's lane",
        fix: "align the end wall perpendicularly to the lane with enough span for both contacts",
      });
    if (named === undefined) throw refuse();
    const legacy: boolean = named.kind === "ledge";
    const width: number = named.width ?? named.length ?? Infinity;
    const depth: number = named.depth ?? Infinity;
    const edgeToFace: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      90,
    );
    const face = (seconds: number): AquaticWallContact.Face => {
      const time: number = context.start + seconds;
      const frame: IAutoMovieRigidTransform =
        reader.site?.(named.id, time) ??
        (() => {
          const root: IAutoMovieRigidTransform = reader.frame(time);
          return {
            position: AutoMovieEngineVector3.add(
              root.position,
              AutoMovieEngineQuaternion.rotateVector(root.rotation, named.frame.translation),
            ),
            rotation: AutoMovieEngineQuaternion.multiply(root.rotation, named.frame.rotation),
          };
        })();
      return {
        origin: frame.position,
        rotation: legacy
          ? AutoMovieEngineQuaternion.multiply(frame.rotation, edgeToFace)
          : frame.rotation,
        width,
        depth,
      };
    };
    const opening: AquaticWallContact.Face = face(0);
    const along: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(opening.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      opening.rotation,
      HumanMaterialContact.NORMAL,
    );
    const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      opening.origin,
      context.entry.posture.root,
    );
    const offset: number = Math.abs(AutoMovieEngineVector3.dot(delta, along));

    // The authored turn keeps both contacts at one lane depth, which requires
    // the wall plane to face the swimmer. Allow rotation roundoff.
    if (
      !(offset < width / 2) ||
      !(Math.abs(along.y) <= 1e-8) ||
      !(AutoMovieEngineVector3.dot(normal, forward) <= -1 + 1e-8)
    )
      throw refuse();
    return { distance: AutoMovieEngineVector3.dot(delta, forward), point: named.id, face };
  }
}

/*
 * The alternatives of `RaceStroke`'s site.
 */
type RaceStroke = "breaststroke" | "frontCrawl";

/*
 * The alternatives of `RaceKind`'s site.
 */
type RaceKind = "crawlStartTurn" | "breaststrokeStartTurn";

/*
 * Give an unstaged wall the lane's normal and true vertical depth axis.
 */
function wallRotation(forward: IAutoMovieVector3): IAutoMovieQuaternion {
  return HumanHand.align(
    { normal: HumanMaterialContact.NORMAL, forward: { x: 0, y: 0, z: -1 } },
    { normal: AutoMovieEngineVector3.scale(forward, -1), forward: { x: 0, y: 1, z: 0 } },
  );
}
