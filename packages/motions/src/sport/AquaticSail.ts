import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticProp } from "./AquaticProp";

/**
 * Close-hauled mainsail trim of a small dinghy, degrees of boom travel off
 * the centreline. A provisional staging value: upwind the boom is sheeted to
 * within a few degrees of the quarter, ahead of the transom corner.
 */
const CLOSE_HAULED: number = 12;

/** Share of the maneuver by which the sailors have crouched and taken their controls (`helmIn`). */
const HELM_IN: number = 0.2;

/** How far the reaching hand rises over the straight path, metres: provisional. */
const REACH_UP: number = 0.15;

/** How far out to its own side the reaching hand passes, metres: provisional. */
const REACH_OUT: number = 0.15;

/** How far ahead of the trunk the reaching hand passes, metres: provisional. */
const REACH_AHEAD: number = 0.2;

/** How far the crouch lowers the pelvis, over stature: provisional, below a dinghy's boom. */
const CROUCH: number = 0.2;

/** A hand bone's placement in the hull frame entered by the action. */
interface IHullLocal {
  /** Hull-local elbow position, metres, the bend the reach starts from. */
  elbow: IAutoMovieVector3;

  /** Hull-local position, metres. */
  point: IAutoMovieVector3;

  /** Hull-local rotation. */
  rotation: IAutoMovieQuaternion;
}

/** One hand on one of the craft's declared handle controls. */
interface IControl {
  /** The holding hand. */
  side: AquaticCrew.Side;

  /** The craft's handle affordance id, such as the tiller or the mainsheet. */
  handle: string;
}

/**
 * Dinghy tack and near-side recovery when a tack is aborted. The visible
 * foot transfers follow World Sailing Racing Rules 13 and 42 and Schutt (2017).
 The sailors cross the boat crouched, facing the way they entered. On a
 * craft that declares its handles, each sailor's hand reaches its control by
 * the helm-in instant and holds it on the posed rig while the helm's own
 * drives swing the rudder and boom; on a craft with a standing area for the
 * role the forefoot bears on it and the sailor stays crouched below the boom.
 * The crew's foot transfers lead the helm's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both outcomes and their supporting references.
 * @evidence contracts/development/design.md#principled-representation Stages body transfers in the hull frame while the helm drives the boat's authored rig.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the dinghy gait and helm articular timing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The entered body and craft determine the deck contact locations.
 */
export namespace AquaticSail {
  /** Two discrete foot transfers, or a near-side recovery when the helm aborts. */
  export function plan(
    context: AquaticPosture.Context,
    aborted: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const hull: AquaticCrew.IHull = AquaticCrew.bind(context, true);
    const carrier: IAutoMovieMotionHumanPropReader = context.prop(hull.id);
    const affordances: readonly IAutoMovieAffordance[] =
      carrier.prop.affordances ?? [];

    // Controls the craft declares as handles are held through its posed rig;
    // the other named grips are placed points the crew law already tracks.
    const controls: readonly IControl[] = (["left", "right"] as const).flatMap(
      (side: AquaticCrew.Side): IControl[] => {
        const handle: string | undefined =
          side === "left" ? params.leftGrip : params.rightGrip;
        return handle !== undefined &&
          affordances.some(
            (contact: IAutoMovieAffordance): boolean =>
              contact.id === handle && contact.kind === "handle",
          )
          ? [{ side, handle }]
          : [];
      },
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const shouldersAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["leftUpperArm", "rightUpperArm"]);
    const duration: number = 3.65;
    const helm: boolean = params.role !== "crew";

    // A craft with a standing area for this role supports the forefoot on it.
    const deck: boolean = affordances.some(
      (site: IAutoMovieAffordance): boolean =>
        site.id === (helm ? "helmDeck" : "crewDeck") && site.kind === "surface",
    );
    const lead: AquaticCrew.Side = params.side ?? "left";
    const trail: AquaticCrew.Side = lead === "left" ? "right" : "left";
    const enteredHips: IAutoMovieVector3 = poseBones(
      body,
      entry.pose,
      undefined,
      new Set(["hips"]),
    ).get("hips")!.worldPosition;
    const hips: IAutoMovieVector3 = Quaternion.rotateVector(
      hull.inverse,
      Vector3.subtract(enteredHips, hull.origin.position),
    );
    const initialSide: number =
      params.side === undefined
        ? Math.sign(hips.x) || 1
        : lead === "left"
          ? 1
          : -1;
    // A tack mirrors the entered pelvis across the centreline, at least a
    // provisional 0.15 of stature out to clear the centreboard case.
    const cross: number =
      -initialSide *
      Math.max(Math.abs(hips.x), body.measure.stature * 0.15) *
      (aborted ? 1 : 2);
    const leadStart: number = helm ? 0.29 : 0.21;
    const leadEnd: number = leadStart + 0.21;
    const trailStart: number = aborted ? 0.58 : leadEnd + 0.02;
    const trailEnd: number = trailStart + 0.19;
    const clearance: number = body.measure.stature * 0.075;

    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      AquaticCrew.bear(hull.id, `${lead}Foot`, "plant", 0, leadStart),
      AquaticCrew.bear(
        hull.id,
        `${lead}Foot`,
        "plant",
        leadEnd,
        aborted ? trailStart : 1,
      ),
      AquaticCrew.bear(
        hull.id,
        `${trail}Foot`,
        "plant",
        0,
        aborted ? 1 : trailStart,
      ),
      AquaticCrew.bear(
        hull.id,
        aborted ? `${lead}Foot` : `${trail}Foot`,
        "plant",
        trailEnd,
        1,
      ),
      // A hand takes its handle control at the helm-in instant, after it
      // has reached there from the entered pose; placed grips hold from entry.
      ...AquaticCrew.grips(hull, params).map(
        (
          window: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow =>
          controls.some(
            (control: IControl): boolean =>
              window.part === `${control.side}Hand`,
          )
            ? { ...window, from: HELM_IN }
            : window,
      ),
    ];

    // The entered hands, held in the hull frame, start each reach to a control.
    const enteredHands: ReturnType<typeof poseBones> = poseBones(
      body,
      entry.pose,
      undefined,
      new Set(["leftHand", "rightHand", "leftLowerArm", "rightLowerArm"]),
    );
    const reachFrom: Readonly<Record<AquaticCrew.Side, IHullLocal>> = {
      left: hullLocal(
        hull,
        enteredHands.get("leftHand")!,
        enteredHands.get("leftLowerArm")!,
      ),
      right: hullLocal(
        hull,
        enteredHands.get("rightHand")!,
        enteredHands.get("rightLowerArm")!,
      ),
    };
    const upright: IAutoMovieMotionHumanPosture = entry.posture;
    const drives: IAutoMovieMotionPropDrive[] = [];
    if (helm && params.boom !== undefined) {
      // A boom at its rest on the centreline is first sheeted out to the
      // close-hauled angle on the leeward side, away from the helm. A boom
      // entered off the centreline keeps its own trim. The tack then swings
      // it to the mirrored trim; an abort luffs it part way and bears away.
      const entered: number = hull.travel(params.boom);
      const trim: number = entered !== 0 ? entered : initialSide * CLOSE_HAULED;
      drives.push({
        prop: hull.id,
        articulation: params.boom,
        from: 0,
        to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          const sheeted: number =
            entered + (trim - entered) * AquaticCrew.span(u, 0, HELM_IN);
          return aborted
            ? sheeted *
                (1 -
                  0.65 *
                    (AquaticCrew.span(u, HELM_IN, leadEnd) -
                      AquaticCrew.span(u, trailStart, trailEnd)))
            : sheeted * (1 - 2 * AquaticCrew.span(u, leadStart, trailEnd));
        },
      });
    }
    if (helm && params.rudder !== undefined) {
      const start: number = hull.travel(params.rudder);
      drives.push({
        prop: hull.id,
        articulation: params.rudder,
        from: 0,
        to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          // Pushing the tiller away from the helm's side turns the bow
          // toward that side, through the wind.
          return (
            start -
            initialSide *
              18 *
              (AquaticCrew.span(u, HELM_IN, leadStart) -
                AquaticCrew.span(u, leadEnd, trailEnd))
          );
        },
      });
    }
    return {
      duration,
      contacts,
      drives,
      events: [
        { name: "helmIn", share: HELM_IN },
        { name: "leadLift", share: leadStart },
        { name: "leadPlant", share: leadEnd },
        { name: aborted ? "abort" : "trailLift", share: trailStart },
        { name: "settle", share: trailEnd },
        { name: "relax", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const u: number = t / duration;
        const first: number = AquaticCrew.span(u, leadStart, leadEnd);
        const second: number = AquaticCrew.span(u, trailStart, trailEnd);
        const stride: number = aborted ? first - second : (first + second) / 2;
        // Sailors on a dinghy's own cockpit floor stay crouched below the
        // boom after the maneuver; on a generic hull they stand back up.
        const lower: number =
          AquaticCrew.span(u, 0, HELM_IN) *
          (deck ? 1 : 1 - AquaticCrew.span(u, trailEnd, 0.98));
        const trunk: IAutoMovieMotionHumanPosture = AquaticPosture.key(
          upright,
          ExerciseKey.from(
            body,
            {
              pitch: 9 + 28 * lower,
              roll: initialSide * (9 - 18 * stride),
              spine: [9 * lower, 0, (helm ? 20 : 10) * stride],
              neck: -12 * lower,
            },
            {
              hip: 23 + 60 * lower,
              knee: 28 + 75 * lower,
              shoulder: 36,
              raise: 28,
              elbow: 65,
            },
          ),
        );
        const leadX: number = aborted ? first - second : first;
        const trailX: number = aborted ? 0 : second;
        const leadBase: IAutoMovieVector3 = hull.feet[lead];
        const trailBase: IAutoMovieVector3 = hull.feet[trail];
        const footA: IAutoMovieVector3 = {
          ...leadBase,
          x: leadBase.x + cross * leadX,
          y:
            leadBase.y +
            clearance *
              (swing(u, leadStart, leadEnd) +
                (aborted ? swing(u, trailStart, trailEnd) : 0)),
        };
        const footB: IAutoMovieVector3 = {
          ...trailBase,
          x: trailBase.x + cross * trailX,
          y:
            trailBase.y +
            (aborted ? 0 : clearance * swing(u, trailStart, trailEnd)),
        };
        const carriedHips: IAutoMovieVector3 = {
          ...hips,
          x: hips.x + cross * (aborted ? 0.48 : 1) * stride,
          y: hips.y - body.measure.stature * CROUCH * lower,
        };
        // The pelvis crosses the deck. Counter the offset from rotating the
        // floor-origin rig to duck, so pitch and yaw do not move it off that path.
        const offset: IAutoMovieVector3 = Vector3.subtract(
          hipsAt(trunk).get("hips")!.worldPosition,
          trunk.root,
        );
        const root: IAutoMovieVector3 = Vector3.subtract(
          carriedHips,
          Quaternion.rotateVector(hull.inverse, offset),
        );
        let posture: IAutoMovieMotionHumanPosture = AquaticCrew.apply(
          context,
          hull,
          t,
          trunk,
          root,
          lead === "left" ? footA : footB,
          lead === "right" ? footA : footB,
        );
        if (deck) {
          // On a deck the forefoot bears, as on a crouched dinghy stance;
          // a foot is planted while its bearing window is open.
          for (const side of ["left", "right"] as const) {
            const leg: AquaticCrew.Leg = `${side}Leg`;
            const planted: boolean = contacts.some(
              (contact: IAutoMovieMotionHumanContactWindow): boolean =>
                contact.part === `${side}Foot` &&
                contact.kind === "plant" &&
                contact.from <= u &&
                u <= contact.to,
            );
            posture.limbs[leg] = {
              ...posture.limbs[leg]!,
              contact: HumanFoot.offset(body, side, "ball"),
              planted,
            };
          }
          posture = resolveHumanPosture.lower(body, posture);
        }
        if (controls.length !== 0) {
          // Pose the rig at this instant's own drive travels, so the hands
          // meet the handles where the drives put them.
          const rig: AquaticProp.IContacts = AquaticProp.at(
            carrier,
            context.start + t,
            drives.length === 0
              ? undefined
              : Object.fromEntries(
                  drives.map(
                    (drive: IAutoMovieMotionPropDrive): [string, number] => [
                      drive.articulation,
                      drive.travel(t),
                    ],
                  ),
                ),
          );
          const frame: IAutoMovieRigidTransform = hull.frame(t);
          const shoulders: ReturnType<
            ReturnType<typeof AquaticPosture.markers>
          > = shouldersAt(posture);
          for (const control of controls) {
            const held: IAutoMovieHumanLimbGoal = AquaticProp.hold(
              body,
              posture,
              control.side,
              rig.require(control.handle, "handle").world,
              shoulders.get(`${control.side}UpperArm`)!.worldPosition,
            );
            const entered: IHullLocal = reachFrom[control.side];
            const world = (local: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                frame.position,
                Quaternion.rotateVector(frame.rotation, local),
              );
            posture.limbs[`${control.side}Arm`] =
              u < HELM_IN
                ? blendGoal(
                    {
                      ...held,
                      point: world(entered.point),
                      rotation: Quaternion.multiply(
                        frame.rotation,
                        entered.rotation,
                      ),
                      bend: world(entered.elbow),
                    },
                    held,
                    AquaticCrew.span(u, 0, HELM_IN),
                    // The hand comes up, out to its own side and forward,
                    // clear of the thigh.
                    Vector3.add(
                      { x: 0, y: REACH_UP, z: 0 },
                      Quaternion.rotateVector(
                        resolveHumanPosture.heading(posture),
                        {
                          x: (control.side === "left" ? 1 : -1) * REACH_OUT,
                          y: 0,
                          z: REACH_AHEAD,
                        },
                      ),
                    ),
                  )
                : held;
          }
        }
        return posture;
      },
    };
  }

  /** A hand goal moving from one placement to another: position along the line, rotation on the shorter arc. */
  function blendGoal(
    from: IAutoMovieHumanLimbGoal,
    to: IAutoMovieHumanLimbGoal,
    share: number,
    bow: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    if (share >= 1) return to;

    // A quadratic Bezier through the midpoint displaced by the bow.
    const via: IAutoMovieVector3 = Vector3.add(
      Vector3.lerp(from.point, to.point, 0.5),
      Vector3.scale(bow, 2),
    );
    return {
      ...to,
      point: Vector3.lerp(
        Vector3.lerp(from.point, via, share),
        Vector3.lerp(via, to.point, share),
        share,
      ),
      bend: Vector3.lerp(from.bend, to.bend, share),
      rotation: Quaternion.slerp(from.rotation!, to.rotation!, share),
    };
  }
  /** A displayed hand bone expressed in the entered hull frame. */
  function hullLocal(
    hull: AquaticCrew.IHull,
    bone: IAutoMovieResolvedBone,
    elbow: IAutoMovieResolvedBone,
  ): IHullLocal {
    return {
      elbow: Quaternion.rotateVector(
        hull.inverse,
        Vector3.subtract(elbow.worldPosition, hull.origin.position),
      ),
      point: Quaternion.rotateVector(
        hull.inverse,
        Vector3.subtract(bone.worldPosition, hull.origin.position),
      ),
      rotation: Quaternion.multiply(hull.inverse, bone.worldRotation),
    };
  }

  /** An ankle's clearance pulse between release and replant. */
  function swing(at: number, from: number, to: number): number {
    return Math.sin(Math.PI * AquaticCrew.span(at, from, to)) ** 2;
  }
}
