import { AutoMovieGravity, Quaternion, Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanLieDown, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPropReader, IAutoMovieMotionHumanVehicleHit, IAutoMovieQuaternion, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { lieDown } from "../../floor/internal/lieDown";
import { createHumanPostureRotation } from "../../posture/internal/createHumanPostureRotation";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";
import { stuntFallPose } from "./stuntFallPose";
import { vehicleFront } from "./vehicleFront";

/**
 * Plan a pedestrian struck by a moving car. The pedestrian stands until the
 * car's leading face reaches the legs on its own course
 * (`vehicleFront.contact`); the trajectory class follows Ravani, Brougham and
 * Mason (SAE 811024): a centre of mass no higher than the leading edge gives a
 * forward projection, the body launched at the car's speed `PROJECTION` above
 * the road; one above it a wrap, the legs swept at the car's speed while the
 * body turns about the edge onto the bonnet at the rate the bumper gives it,
 * the head travelling the arc from its height to the bonnet at the car's speed;
 * an off-centre contact, within a hip's width of the car's side, a fender
 * vault, and a wrap at or above `ROOF` a roof vault. A wrapped body rides the
 * bonnet in the car's frame until the car brakes harder than `BONNET` holds it,
 * then leaves at the car's speed; a vaulting body leaves at once with `VAULT`
 * of it, a roof vault rising to clear the roof. It flies a projectile under
 * gravity to the road, turning onto its back with its head against its travel,
 * slides to rest under `SLIDE` (Searle's throw model) and lies.
 *
 * @param context The action's context, standing in the car's course.
 * @returns The plan.
 * @throws {HumanRefusal} When the car has no colliders or course, its course
 *   never meets the legs within the horizon, or a wrapped body is never braked
 *   off the bonnet.
 */
export function planVehicleHit(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanVehicleHit.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanVehicleHit.IParams = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const g: number = AutoMovieGravity.STANDARD;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.vehicle);
  const front: vehicleFront.IFront = vehicleFront.read(
    context,
    p.vehicle,
    p.edge,
  );
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const ground: number = entry.root.y;
  const hips0: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
    "hips",
  )!.worldPosition;
  const tc: number | undefined = vehicleFront.contact(
    reader,
    front,
    {
      hips: hips0,
      depth: body.measure.thighRadius,
      spread: body.measure.hipHalfWidth,
    },
    context.start,
    context.start + (p.horizon ?? 6),
  );
  if (tc === undefined)
    throw vehicleFront.refusal(
      p.vehicle,
      `${p.vehicle}'s course does not reach the pedestrian within the horizon`,
    );
  const impact: number = tc - context.start;
  const struck: IAutoMovieRigidTransform = reader.frame(tc);
  const at: IAutoMovieVector3 = vehicleFront.local(struck, hips0);
  const v0: IAutoMovieVector3 = vehicleFront.velocity(reader, tc);
  const speed: number = Vector3.length(v0);
  // The class reads the body's centre of mass against the leading edge.
  const centre: IAutoMovieVector3 = vehicleFront.local(
    struck,
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
      body.massModel,
      poseBones(body, context.entry.pose),
    ),
  );
  const trajectory: IAutoMovieMotionHumanVehicleHit.Trajectory =
    centre.y <= front.top
      ? "forwardProjection"
      : Math.abs(at.x) > front.half - body.measure.hipHalfWidth
        ? "fenderVault"
        : speed >= ROOF
          ? "roofVault"
          : "wrap";

  // The body as it stood, its legs' solved joints kept, every orientation
  // carried by the posture's turn about its hips.
  const joints: IAutoMovieMotionHumanPosture["joints"] =
    GymnasticsFlight.frozen(body, entry).joints;
  const q0: IAutoMovieQuaternion = humanPostureHeading(entry);
  const shaped: (
    hips: IAutoMovieVector3,
    turn: IAutoMovieQuaternion,
    shape: IAutoMovieMotionHumanPosture["joints"],
    offset: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanPosture = (
    hips: IAutoMovieVector3,
    turn: IAutoMovieQuaternion,
    shape: IAutoMovieMotionHumanPosture["joints"],
    offset: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture => ({
    root: Vector3.subtract(hips, offset),
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: shape,
    limbs: {},
    rotation: createHumanPostureRotation(hips, turn),
  });
  const bare: (
    shape: IAutoMovieMotionHumanPosture["joints"],
  ) => IAutoMovieMotionHumanPosture = (
    shape: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: shape,
    limbs: {},
  });
  const stoodOffset: IAutoMovieVector3 = stuntFallPose.offset(
    body,
    bare(joints),
  );

  // How far a shape turned so lies below its hips.
  const lowAt: (
    turn: IAutoMovieQuaternion,
    shape: IAutoMovieMotionHumanPosture["joints"],
    offset: IAutoMovieVector3,
  ) => number = (
    turn: IAutoMovieQuaternion,
    shape: IAutoMovieMotionHumanPosture["joints"],
    offset: IAutoMovieVector3,
  ): number =>
    stuntFallPose.lowest(body, {
      ...bare(shape),
      rotation: createHumanPostureRotation(offset, turn),
    }) - offset.y;

  // The wrap: a quarter turn about the leading edge, at the body's near side
  // a leg's half depth above the bonnet so the body comes to lie on it.
  const wraps: boolean = trajectory !== "forwardProjection";
  const pivot: IAutoMovieVector3 = {
    x: at.x,
    y: front.top + body.measure.thighRadius,
    z: front.front + body.measure.thighRadius,
  };
  const wrapSeconds: number = wraps
    ? ((body.measure.stature - front.top) * (Math.PI / 2)) /
      Math.max(speed, vehicleFront.STEP)
    : 0;
  const faced: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(struck.rotation),
    q0,
  );
  const fromPivot: IAutoMovieVector3 = Vector3.subtract(at, pivot);
  const turnAboutEdge: ReturnType<typeof Quaternion.prepareAxisAngle> =
    Quaternion.prepareAxisAngle({ x: 1, y: 0, z: 0 });
  // Where the full turn alone would leave the hips in the car's frame, and
  // where they lie on the bonnet: over the leading edge, the turned body's
  // lowest point on the bonnet's top.
  const quarter: IAutoMovieQuaternion = turnAboutEdge(-90);
  const turned: IAutoMovieVector3 = Vector3.add(
    pivot,
    Quaternion.rotateVector(quarter, fromPivot),
  );
  const settle: IAutoMovieVector3 = wraps
    ? Vector3.subtract(
        {
          x: at.x,
          y:
            front.top -
            lowAt(
              Quaternion.multiply(
                struck.rotation,
                Quaternion.multiply(quarter, faced),
              ),
              joints,
              stoodOffset,
            ),
          z: front.front,
        },
        turned,
      )
    : { x: 0, y: 0, z: 0 };
  const wrapped: (film: number) => IAutoMovieMotionHumanPosture = (
    film: number,
  ): IAutoMovieMotionHumanPosture => {
    const frame: IAutoMovieRigidTransform = reader.frame(film);
    // The bumper sweeps the legs at once, so the turn starts at its full rate
    // and the feet leave the road at the contact (degrees, as the engine's
    // axis-angle reads them).
    const theta: number =
      90 * Math.min(1, Math.max(0, (film - tc) / wrapSeconds));
    const turn: IAutoMovieQuaternion = turnAboutEdge(-theta);
    // The body slides back over the edge as it turns, so the hips come to
    // rest over the leading edge with the body's underside on the bonnet.
    const hips: IAutoMovieVector3 = vehicleFront.world(
      frame,
      Vector3.add(
        Vector3.add(pivot, Quaternion.rotateVector(turn, fromPivot)),
        Vector3.scale(settle, theta / 90),
      ),
    );
    return shaped(
      hips,
      Quaternion.multiply(frame.rotation, Quaternion.multiply(turn, faced)),
      joints,
      stoodOffset,
    );
  };

  // Separation: a wrap rides until the car brakes off the bonnet's hold.
  const braked: (film: number) => boolean = (film: number): boolean => {
    const before: IAutoMovieVector3 = vehicleFront.velocity(
      reader,
      film - vehicleFront.DT,
    );
    const after: IAutoMovieVector3 = vehicleFront.velocity(
      reader,
      film + vehicleFront.DT,
    );
    const along: number = Vector3.length(before);
    if (!(along > 0)) return false;
    const slowing: number =
      -Vector3.dot(Vector3.subtract(after, before), before) /
      (along * 2 * vehicleFront.DT);
    return slowing > BONNET * g;
  };
  const ridden: number = tc + wrapSeconds;
  let separate: number = ridden;
  if (trajectory === "wrap") {
    const last: number = context.start + (p.horizon ?? 6);
    let found: number | undefined;
    for (let t: number = ridden; t <= last; t += vehicleFront.STEP)
      if (braked(t)) {
        found = t;
        break;
      }
    if (found === undefined)
      throw vehicleFront.refusal(
        p.vehicle,
        `${p.vehicle} never brakes hard enough within the horizon to throw the body off its bonnet`,
      );
    separate = found;
  }

  // The launch.
  const launched: IAutoMovieMotionHumanPosture = wraps
    ? wrapped(separate)
    : shaped(hips0, q0, joints, stoodOffset);
  const hipsS: IAutoMovieVector3 = Vector3.add(launched.root, stoodOffset);
  const qS: IAutoMovieQuaternion = launched.rotation!.turn;
  const carS: IAutoMovieVector3 = vehicleFront.velocity(reader, separate);
  const vS: IAutoMovieVector3 =
    trajectory === "wrap"
      ? carS
      : Vector3.scale(carS, trajectory === "forwardProjection" ? 1 : VAULT);
  if (trajectory === "forwardProjection")
    // A projected body leaves the road at a shallow angle, its feet off it.
    vS.y = Math.hypot(vS.x, vS.z) * Math.tan((PROJECTION * Math.PI) / 180);
  if (trajectory === "roofVault") {
    // Rise until the lowest point clears the roof.
    const rise: number =
      front.roof - (hipsS.y - ground + lowAt(qS, joints, stoodOffset));
    vS.y = rise > 0 ? Math.sqrt(2 * g * rise) : 0;
  }

  // The lie: on the back, the head against the travel.
  const supine: IAutoMovieMotionHumanLieDown.IPose = lieDown.POSES.supine;
  const heading: number =
    Math.hypot(vS.x, vS.z) > 0
      ? (Math.atan2(vS.x, vS.z) * 180) / Math.PI
      : entry.yaw;
  const qLie: IAutoMovieQuaternion = humanPostureHeading({
    yaw: heading,
    pitch: supine.pitch,
    roll: supine.roll,
  });
  const lieOffset: IAutoMovieVector3 = stuntFallPose.offset(
    body,
    bare(supine.joints),
  );
  const lieHips: number = ground - lowAt(qLie, supine.joints, lieOffset);
  const flight: number =
    (vS.y + Math.sqrt(Math.max(0, vS.y * vS.y + 2 * g * (hipsS.y - lieHips)))) /
    g;
  const across: IAutoMovieVector3 = { x: vS.x, y: 0, z: vS.z };
  const slideSpeed: number = Vector3.length(across);
  const slide: number = slideSpeed / (SLIDE * g);
  const landing: IAutoMovieVector3 = {
    x: hipsS.x + vS.x * flight,
    y: lieHips,
    z: hipsS.z + vS.z * flight,
  };
  const direction: IAutoMovieVector3 =
    slideSpeed > 0 ? Vector3.scale(across, 1 / slideSpeed) : across;
  const leave: number = separate - context.start;
  const land: number = leave + flight;
  const rest: number = land + slide;
  const duration: number = rest + (p.hold ?? 1);

  const blend: ReturnType<typeof prepareHumanShapeBlend> =
    prepareHumanShapeBlend(joints, supine.joints);
  const stopped: IAutoMovieVector3 = Vector3.add(
    landing,
    Vector3.scale(direction, (slideSpeed * slide) / 2),
  );

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t < impact) return entry;
    if (t < leave) return wrapped(context.start + t);
    if (t >= rest)
      return shaped({ ...stopped, y: lieHips }, qLie, supine.joints, lieOffset);
    // In the air the body turns onto its back by the landing; on the road it
    // slides to rest on it.
    if (t < land) {
      const tau: number = t - leave;
      const w: number = AutoMovieEngineMotionSampling.minimumJerkShare(flight > 0 ? tau / flight : 1);
      const shape: IAutoMovieMotionHumanPosture["joints"] = blend(w);
      const turn: IAutoMovieQuaternion = Quaternion.slerp(qS, qLie, w);
      const offset: IAutoMovieVector3 = stuntFallPose.offset(body, bare(shape));
      const ballistic: IAutoMovieVector3 = {
        x: hipsS.x + vS.x * tau,
        y: hipsS.y + vS.y * tau - 0.5 * g * tau * tau,
        z: hipsS.z + vS.z * tau,
      };
      // Nothing passes under the road while the body turns.
      const floor: number = ground - lowAt(turn, shape, offset);
      return shaped(
        { ...ballistic, y: Math.max(ballistic.y, floor) },
        turn,
        shape,
        offset,
      );
    }
    const sigma: number = t - land;
    const slid: number = slideSpeed * sigma - 0.5 * SLIDE * g * sigma * sigma;
    return shaped(
      { ...Vector3.add(landing, Vector3.scale(direction, slid)), y: lieHips },
      qLie,
      supine.joints,
      lieOffset,
    );
  };

  const share: (seconds: number) => number = (seconds: number): number =>
    seconds / duration;
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    ...(["leftFoot", "rightFoot"] as const).map(
      (
        part: PlanVehicleHitContactsPart,
      ): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        support: { kind: "ground" },
        from: 0,
        to: share(impact),
      }),
    ),
    ...(trajectory === "wrap" && separate > ridden
      ? [
          {
            part: "back" as const,
            kind: "lie" as const,
            support: { kind: "prop" as const, subject: p.vehicle },
            from: share(ridden - context.start),
            to: share(leave),
          },
        ]
      : []),
    {
      part: "back",
      kind: "lie",
      support: { kind: "ground" },
      from: share(land),
      to: 1,
    },
  ];
  return {
    duration,
    events: [
      { name: "impact", share: share(impact) },
      { name: trajectory, share: share(impact) },
      { name: "separate", share: share(leave) },
      { name: "land", share: share(land) },
      { name: "rest", share: share(rest) },
    ],
    contacts,
    base: { kind: "lying" },
    posture,
    yields: [],
  };
}

/**
 * The impact speed from which a wrap turns into a roof vault, metres per second
 * (provisional: 50 km/h; Ravani et al. 1981 report roof vaults at the higher
 * impact speeds).
 */
const ROOF: number = 50 / 3.6;

/**
 * Friction holding a body on a bonnet, dimensionless (provisional: clothing on
 * painted steel); a car braking harder throws the body off.
 */
const BONNET: number = 0.3;

/**
 * Friction of a body sliding to rest on the road, dimensionless: the upper end
 * of the 0.5 to 0.66 range Searle's throw model takes (provisional).
 */
const SLIDE: number = 0.66;

/**
 * The share of the car's speed a vaulting body keeps as it leaves over the wing
 * or the roof (provisional).
 */
const VAULT: number = 0.5;
/**
 * The angle above the road a forward-projected body leaves at, degrees
 * (provisional: a shallow launch inside the small angles Searle's throw model
 * admits).
 */
const PROJECTION: number = 10;

/** The alternatives of `PlanVehicleHitContactsPart`'s site. */
type PlanVehicleHitContactsPart = "leftFoot" | "rightFoot";
