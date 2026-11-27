import { AutoMovieGravity, Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPoleVault,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropLaunch,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { walkPoleFrame } from "../../actions/internal/walkPoleFrame";
import { WorkoutSupport } from "../../exercise/workout/WorkoutSupport";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import type { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { GymnasticsFlight } from "../internal/GymnasticsFlight";
import { GymnasticsMat } from "../internal/GymnasticsMat";
import { GymnasticsTakeoff } from "../internal/GymnasticsTakeoff";
import type { poleVaultBend } from "./poleVaultBend";
import type { poleVaultSwing } from "./poleVaultSwing";
import { prepareGymnasticsPlacement } from "../internal/prepareGymnasticsPlacement";

/*
 * A vault from its release on (`poleVault.plan`): the grip's state where the
 * pole has recoiled, the centre carried with it at the chord's rate; the flight
 * on the parabola of its velocity at the release, the body keeping the chord's
 * rate, until its lowest shape meets the landing surface; the landing lying
 * there (`GymnasticsMat`); the contacts, events, the released pole's launch and
 * the pole's hinge drives; and the plan over all four phases.
 * Parameter prepared: The vault's prepared values.
 * Returns: The vault's plan.
 * When the body is not above the landing surface at the
 * release.
 */
export function poleVaultFinish(
  prepared: poleVaultFinish.IPrepared,
): IAutoMovieMotionHumanActionPlan {
  const {
    context,
    body,
    p,
    model,
    held,
    pole,
    side,
    tipAt,
    ahead,
    off,
    takeoff,
    readGrip,
    swing,
    bend,
    bow,
    swinging,
    swingGripOffset,
    pushing,
  }: poleVaultFinish.IPrepared = prepared;
  const degrees: number = 180 / Math.PI;

  // The release: the grip's state where the pole has recoiled, the centre
  // carried with it at the chord's rate.
  const last: poleVaultSwing.ISample = swing.samples[swing.samples.length - 1]!;
  const omega: number =
    (last.position.up * last.velocity.forward -
      last.position.forward * last.velocity.up) /
    (last.position.forward ** 2 + last.position.up ** 2);
  const released: IAutoMovieMotionHumanPosture = swinging(swing.duration);
  const cr: IAutoMovieVector3 = GymnasticsFlight.centre(body, model, released);
  const out: IAutoMovieVector3 = Vector3.subtract(
    cr,
    Vector3.add(
      Vector3.add(tipAt, Vector3.scale(ahead, last.position.forward)),
      {
        x: 0,
        y: last.position.up,
        z: 0,
      },
    ),
  );
  const forth: number = Vector3.dot(out, ahead);
  const velocity: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(ahead, last.velocity.forward + omega * out.y),
    { x: 0, y: last.velocity.up - omega * forth, z: 0 },
  );
  // The flight keeps the articulation the swing reached at the release: the
  // hands' goals on the pole are let go, their solved angles kept.
  const releasedPose: IAutoMoviePose = resolveHumanPosture(body, released);
  const articulation: IAutoMovieMotionHumanPosture = {
    root: released.root,
    yaw: released.yaw,
    pitch: released.pitch,
    roll: released.roll,
    joints: {},
    limbs: {},
  };
  for (const joint of releasedPose.joints)
    articulation.joints[joint.bone] = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
  const placeFlight: ReturnType<typeof prepareGymnasticsPlacement> =
    prepareGymnasticsPlacement(body, model, articulation);
  const flying: (t: number) => IAutoMovieMotionHumanPosture = (
    t: number,
  ): IAutoMovieMotionHumanPosture =>
    placeFlight(
      {
        yaw: released.yaw,
        pitch: released.pitch + omega * degrees * t,
        roll: 0,
      },
      GymnasticsFlight.at(cr, velocity, t),
    );

  // The touchdown on the landing surface, and the landing.
  const release: number = off + swing.duration;
  const pad: HumanMaterialContact.ISite | undefined =
    p.on === undefined
      ? undefined
      : HumanMaterialContact.prepare(
          context.prop(p.on),
          "surface",
          context.start + release,
        );
  const surface: number =
    pad?.at(context.start + release).frame.position.y ??
    (p.on === undefined
      ? 0
      : WorkoutSupport.at(context, { prop: p.on, affordance: "surface" }).y);
  const fallen: number = GymnasticsFlight.fall(cr.y, velocity.y, surface) ?? 0;
  const exterior:
    | ReturnType<typeof HumanMaterialContact.preparePosture>
    | undefined =
    pad === undefined ? undefined : HumanMaterialContact.preparePosture(body);
  const material: ReturnType<typeof HumanMaterialContact.arrival> =
    pad === undefined || exterior === undefined
      ? undefined
      : HumanMaterialContact.arrival(
          fallen + GymnasticsMat.HOLD,
          (
            time: number,
          ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined =>
            exterior(flying(time), pad.at(context.start + release + time)),
        );
  if (pad !== undefined && material === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "on",
      value: p.on,
      reason: "the released body misses the finite landing surface",
      fix: "move the mat under the vaulter's flight",
    });
  const down: number =
    material?.seconds ??
    ((): number => {
      const [floorResolution, floorProjection]: [
        ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
        ReturnType<typeof prepareHumanPostureProjection>,
      ] = [AutoMovieEngineKinematics.preparePoseResolution(), prepareHumanPostureProjection(body)];
      const readLowest: ReturnType<typeof GymnasticsFlight.prepareLowest> =
        GymnasticsFlight.prepareLowest(body);
      const lowest: (t: number) => number = (t: number): number =>
        readLowest(flying(t), floorResolution, floorProjection);
      const releaseLowest: number = lowest(0);
      if (!(releaseLowest > surface))
        throw new HumanRefusal({
          kind: "reach",
          axis: "on",
          value: surface,
          reason: `at the release the body's lowest point is at ${releaseLowest.toFixed(2)} m, no higher than the landing surface at ${surface.toFixed(2)} m`,
          fix: "land on a lower surface, or run faster",
        });
      return GymnasticsFlight.touchdown(0, fallen, lowest, surface);
    })();
  const landing: ReturnType<typeof GymnasticsMat.lie> = GymnasticsMat.lie({
    body,
    model,
    from: flying(down),
    velocity: {
      ...velocity,
      y: velocity.y - AutoMovieGravity.STANDARD * down,
    },
    height: surface,
    ...(pad === undefined || exterior === undefined
      ? {}
      : {
          support: (
            posture: IAutoMovieMotionHumanPosture,
            time: number,
          ): number => {
            const face: HumanMaterialContact.IFace = pad.at(
              context.start + release + down + time,
            );
            const bearing:
              | IAutoMovieMotionHumanContactWindow.IMaterial
              | undefined = exterior(posture, face);
            const up: number = Quaternion.rotateVectorY(
              face.frame.rotation,
              HumanMaterialContact.NORMAL,
            );
            if (bearing === undefined || up <= 0)
              throw new HumanRefusal({
                kind: "reach",
                axis: "on",
                value: p.on,
                reason: "the settling body leaves the finite landing surface",
                fix: "use a landing mat that covers the settling path",
              });
            if (up < 1 - 1e-12)
              throw new HumanRefusal({
                kind: "affordance",
                axis: "on",
                value: p.on,
                reason: "the landing settle requires a level receiving mat",
                fix: "place the landing mat level",
              });
            return posture.root.y - bearing.clearance;
          },
        }),
  });

  const touchdown: number = release + down;
  const settled: number = touchdown + GymnasticsMat.SETTLE;
  const duration: number = settled + GymnasticsMat.HOLD;
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    ...GymnasticsTakeoff.contacts(takeoff, duration),
    // Every holding hand grips the pole to the release, the top hand
    // first so it carries and the lower steadies (`HumanPerformanceHold`).
    ...pole.hands.map(
      (hand: walkPoleFrame.IHand): IAutoMovieMotionHumanContactWindow => ({
        part: hand.side === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        from: 0,
        to: release / duration,
        support: { kind: "prop", subject: p.pole },
        inHand: (share: number): IAutoMovieRigidTransform =>
          share * release <= off
            ? {
                position: { x: 0, y: 0, z: 0 },
                rotation: Quaternion.identity(),
              }
            : swingGripOffset(hand.side, share * release - off),
      }),
    ),
    {
      part: "back",
      kind: "lie",
      from: touchdown / duration,
      to: 1,
      support:
        pad?.support ??
        (p.on === undefined
          ? { kind: "ground" }
          : { kind: "prop", subject: p.on }),
      ...(material === undefined ? {} : { material: material.material }),
    },
  ];
  const events: IAutoMovieMotionEvent[] = [
    { name: "takeoff", share: off / duration },
    { name: "release", share: release / duration },
    { name: "touchdown", share: touchdown / duration },
    { name: "settled", share: settled / duration },
    { name: "relax", share: settled / duration },
  ];

  // The released pole leaves its held frame on the grip with the velocity
  // the rigid swing about the planted end gives its origin.
  const releasedGrip: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    readGrip(resolveHumanPosture(body, released));
  const hand: IAutoMovieResolvedBone = releasedGrip.get(
    side === "left" ? "leftHand" : "rightHand",
  )!;
  const poleFrame: IAutoMovieRigidTransform = HumanPropFrame.compose(
    {
      position: HumanHand.frame(body, releasedGrip, side, "grip").point,
      rotation: hand.worldRotation,
    },
    HumanPropFrame.compose(swingGripOffset(side, swing.duration), held.frame),
  );
  const arm: IAutoMovieVector3 = Vector3.subtract(poleFrame.position, tipAt);
  const launch: IAutoMovieMotionPropLaunch = {
    prop: p.pole,
    seconds: release,
    point: poleFrame.position,
    velocity: Vector3.add(Vector3.scale(ahead, omega * arm.y), {
      x: 0,
      y: -omega * Vector3.dot(arm, ahead),
      z: 0,
    }),
    rotation: poleFrame.rotation,
  };

  // The pole's hinges, driven by the bend through the swing and turned the
  // way that bows it away from the vaulter (`bow`); straight again at the
  // release, where the last travel holds.
  const drives: IAutoMovieMotionPropDrive[] = bend.hinges.map(
    (articulation: string, k: number): IAutoMovieMotionPropDrive => ({
      prop: p.pole,
      articulation,
      from: off / duration,
      to: release / duration,
      travel: (seconds: number): number =>
        bow *
        bend.turn(k, Math.min(swing.duration, Math.max(0, seconds - off))),
    }),
  );
  return {
    duration,
    events,
    contacts,
    launches: [launch],
    drives,
    contact: off,
    base: { kind: "lying" },
    posture: (
      t: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const s: number = Math.min(duration, Math.max(0, t));
      if (s <= off) return pushing(s, resolution, projection);
      if (s < release) return swinging(s - off);
      if (s < touchdown) return flying(s - release);
      return landing(s - touchdown, resolution, projection);
    },
  };
}

/*
 * Companion types of poleVaultFinish.
 */
export namespace poleVaultFinish {
  /*
   * What `poleVault.plan` prepared before its release.
   */
  export interface IPrepared {
    /*
     * The vault's context, whose landing prop is read.
     */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPoleVault.IParams>;

    /*
     * The vaulter's body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The vault's parameters.
     */
    p: IAutoMovieMotionHumanPoleVault.IParams;

    /*
     * The body's centre-of-mass model.
     */
    model: IAutoMovieResolveCenterOfMass.IModel;

    /*
     * The pole as the top hand holds it.
     */
    held: IAutoMovieMotionHumanHeld.IHeld;

    /*
     * The pole in the hands that hold it.
     */
    pole: walkPoleFrame.IPole;

    /*
     * The top hand.
     */
    side: AutoMovieHumanSide;

    /*
     * The planted end, world metres.
     */
    tipAt: IAutoMovieVector3;

    /*
     * The run's unit heading, world.
     */
    ahead: IAutoMovieVector3;

    /*
     * The take-off's instant, seconds.
     */
    off: number;

    /*
     * The vault's take-off.
     */
    takeoff: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff;

    /*
     * The reader of the top hand's grip bones.
     */
    readGrip: ReturnType<typeof poseBones.prepare>;

    /*
     * The point-mass swing on the flexible pole.
     */
    swing: poleVaultSwing.ISwing;

    /*
     * The pole's elastica on its hinged chain.
     */
    bend: poleVaultBend.IBend;

    /*
     * The way the pole's hinges turn, 1 or -1.
     */
    bow: number;

    /*
     * The vaulter's posture at seconds since the take-off.
     */
    swinging: (t: number) => IAutoMovieMotionHumanPosture;

    /*
     * The articulated material displacement in each hand's grip frame.
     */
    swingGripOffset: (
      side: AutoMovieHumanSide,
      seconds: number,
    ) => IAutoMovieRigidTransform;

    /*
     * The push-off's posture at a second, before the take-off.
     */
    pushing: (
      t: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ) => IAutoMovieMotionHumanPosture;
  }
}
