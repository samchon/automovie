import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDive,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanVehicleHit,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { dive } from "../../floor/internal/dive";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { vehicleFront } from "./vehicleFront";

/**
 * Plan a near-miss dive clear of a moving car: the pedestrian stands while the
 * car comes on its course, then dives to the side (`dive`), timed so that every
 * collider of the body has left the car's width when the car's leading face
 * reaches where the legs stood (`vehicleFront.contact`), and stays out of it to
 * the dive's end. The side defaults to the one whose lateral points away from
 * the car's centre line, the nearer edge of its path.
 *
 * @param context The action's context, standing in the car's course.
 * @returns The plan.
 * @throws {HumanRefusal} When the car never arrives within the horizon, the
 *   dive never clears its width, or it arrives before the dive could clear it.
 */
export function planVehicleDive(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanVehicleHit.IDive>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanVehicleHit.IDive = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.vehicle);
  const front: vehicleFront.IFront = vehicleFront.read(context, p.vehicle);
  const hips: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
    "hips",
  )!.worldPosition;
  const arrival: number | undefined = vehicleFront.contact(
    reader,
    front,
    {
      hips,
      depth: body.measure.thighRadius,
      spread: body.measure.hipHalfWidth,
    },
    context.start,
    context.start + (p.horizon ?? 6),
  );
  if (arrival === undefined)
    throw vehicleFront.refusal(
      p.vehicle,
      `${p.vehicle}'s course does not reach the pedestrian within the horizon`,
    );
  const frame: IAutoMovieRigidTransform = reader.frame(arrival);
  const at: IAutoMovieVector3 = vehicleFront.local(frame, hips);
  // Away from the car's centre line, toward the nearer edge of its path.
  const out: number = at.x >= 0 ? 1 : -1;
  const outward: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: out,
    y: 0,
    z: 0,
  });
  const left: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: context.entry.posture.yaw },
    { x: 1, y: 0, z: 0 },
  );
  const side: AutoMovieHumanSide =
    p.side ?? (Vector3.dot(left, outward) >= 0 ? "left" : "right");
  const params: IAutoMovieMotionHumanDive.IParams = { kind: "dive", side };
  const leap: IAutoMovieMotionHumanActionPlan = dive.plan({
    ...context,
    params,
  });

  // The body is clear while every collider lies outside the car's width,
  // on the side it dives to, in the car's frame at the arrival.
  const clear: (seconds: number) => boolean = (seconds: number): boolean => {
    const posed: IAutoMovieMotionHumanPosture = leap.posture(seconds);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, posed).pose,
    );
    for (const { pose, shapes } of HumanColliders.placed(body, bones))
      for (const shape of shapes) {
        const box: IAutoMoviePhysicalShapeBounds.IResult = AutoMovieEnginePhysics.physicalShapeBounds(
          pose,
          shape,
        );
        for (const x of [box.min.x, box.max.x])
          for (const z of [box.min.z, box.max.z]) {
            const corner: IAutoMovieVector3 = vehicleFront.local(frame, {
              x,
              y: box.min.y,
              z,
            });
            if (out * corner.x <= front.half) return false;
          }
      }
    return true;
  };
  let clearing: number | undefined;
  for (
    let k: number = Math.ceil(leap.duration / vehicleFront.STEP);
    k >= 0;
    k--
  ) {
    const t: number = Math.min(leap.duration, k * vehicleFront.STEP);
    if (!clear(t)) break;
    clearing = t;
  }
  if (clearing === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "side",
      value: side,
      reason: `a dive to the ${side} never leaves ${p.vehicle}'s width`,
      fix: "dive to the other side, or stand nearer the edge of the car's path",
    });
  const delay: number = arrival - context.start - clearing;
  if (delay < 0)
    throw vehicleFront.refusal(
      p.vehicle,
      `${p.vehicle} arrives ${(-delay).toFixed(3)} s before a dive could clear it`,
    );

  // The dive, shifted to start `delay` after the action's start.
  const duration: number = delay + leap.duration;
  const shift: (share: number) => number = (share: number): number =>
    (delay + share * leap.duration) / duration;
  const contacts: IAutoMovieMotionHumanContactWindow[] = leap.contacts.map(
    (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow => ({
      ...window,
      from: window.from === 0 ? 0 : shift(window.from),
      to: shift(window.to),
    }),
  );
  return {
    ...leap,
    duration,
    events: [
      ...leap.events.map(
        (event: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
          ...event,
          share: shift(event.share),
        }),
      ),
      { name: "arrival", share: (arrival - context.start) / duration },
    ],
    contacts,
    ...(leap.physicalWindow === undefined || leap.physicalWindow === null
      ? {}
      : {
          physicalWindow: {
            from: delay + leap.physicalWindow.from,
            to: delay + leap.physicalWindow.to,
          },
        }),
    base: { kind: "lying" },
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      seconds < delay
        ? leap.posture(0, channels, resolution, projection)
        : leap.posture(seconds - delay, channels, resolution, projection),
  };
}
