import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidSocket, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanRide, IAutoMovieMotionHumanSegment, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanSeat } from "@automovie/motions";
import { HumanColliders } from "../../packages/motions/src/posture/internal/HumanColliders";
import { HumanFoot } from "../../packages/motions/src/posture/internal/HumanFoot";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SceneTake } from "../src/scenes/SceneTake";
import { SCENES_VEHICLES } from "../src/scenes/data/SCENES_VEHICLES";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";
import type { IScene } from "../src/scenes/structures/IScene";
import { sceneAffordanceFrame } from "./sceneAffordanceFrame";

/** The ride's sampled shares, through its start, cruise and stop. */
const RIDE_SHARES: readonly number[] = [0.2, 0.43, 0.67, 0.88];

/** The push's sampled fractions of the left hand's grip window. */
const PUSH_FRACTIONS: readonly number[] = [0.1, 0.45, 0.8, 0.95];

/** The grip and rod-axis allowance in metres, the touch law's site bound. */
const GRIP: number = 0.01;

/** How far a vehicle must travel in its take, metres. */
const TRAVEL: number = 0.3;

/** How long before the end a vehicle must have stopped, seconds. */
const STOPPED: number = 0.3;

/** The scenes whose alternate bodies are also played. */
const ALTERNATE: ReadonlySet<string> = new Set(["a-bicycle-ride", "car-trip"]);

/** Which trolley handle each wrist socket holds. */
const PUSH_HANDLES: readonly (readonly [string, AutoMovieHumanoidSocket])[] = [
  ["leftHandle", "gripLeft"],
  ["rightHandle", "gripRight"],
];

/**
 * Check the published vehicle stages against the actual carried seats, grips,
 * treads and wheels on the displayed models.
 *
 * Scenarios, for every vehicle scene and, for the bicycle and car, its
 * alternate bodies:
 * 1. Through the ride the seat bones sit at the seated height within the
 *    seat's depth, each authored foot rest bears the ball of its foot and
 *    each authored grip holds its hand.
 * 2. Through the trolley push both wrists stay on their handle rods.
 * 3. The vehicle travels and stands still for its last 0.3 s. The car's
 *    driver door is open at 3.15 s and shut at the end; the bicycle ride
 *    begins and ends with a stopped transfer.
 * 4. A bicycle course that starts during the transfer refuses.
 */
export function checkVehicleScenes(): void {
  for (const scene of SCENES_VEHICLES) {
    const takes: IScene.ITake[] = ALTERNATE.has(scene.id)
      ? [scene.takes[0]!, scene.takes[2]!]
      : [scene.takes[0]!];
    for (const take of takes) {
      const input: IPlaygroundComposition = SceneTake.apply(
        scene.composition!,
        take,
      );
      const object: IPlaygroundComposition.IObject = input.objects![0]!;
      const model: SceneArchetype.Model = SceneArchetype.model(object);
      const { performance }: PlaygroundPerformance.IBuilt =
        PlaygroundPerformance.build(input);
      for (const actor of performance.performers) {
        const motion: readonly IAutoMovieMotionHumanSegment[] =
          performance.segments(actor.subject);
        const ride: IAutoMovieMotionHumanSegment | undefined = motion.find(
          ({ name }: IAutoMovieMotionHumanSegment): boolean => name === "ride",
        );
        const push: IAutoMovieMotionHumanSegment | undefined = motion.find(
          ({ name }: IAutoMovieMotionHumanSegment): boolean =>
            name === "pushPull",
        );
        assert(ride !== undefined || push !== undefined, scene.id);
        if (ride !== undefined)
          checkRide(performance, model, object.subject, actor, ride, scene.id);
        if (push !== undefined)
          checkPush(performance, model, object.subject, actor, push);
      }
      checkTravel(performance, object.subject, scene.id);
    }
  }

  const bicycle: IScene = SCENES_VEHICLES.find(
    ({ id }: IScene): boolean => id === "a-bicycle-ride",
  )!;
  const impossible: IPlaygroundComposition = SceneTake.apply(
    bicycle.composition!,
    bicycle.takes[0]!,
  );
  impossible.objects![0]!.course!.at = 0.1;
  assert.throws(
    () => PlaygroundPerformance.build(impossible),
    /move during the stopped transfer/,
  );
}

/** Seat, foot rests and grips of one rider on the displayed vehicle. */
function checkRide(
  performance: IAutoMovieMotionHumanPerformance,
  model: SceneArchetype.Model,
  subject: string,
  actor: IAutoMovieMotionHumanPerformer,
  ride: IAutoMovieMotionHumanSegment,
  label: string,
): void {
  const params: IAutoMovieMotionHumanRide.IParams =
    ride.params as IAutoMovieMotionHumanRide.IParams;
  for (const share of RIDE_SHARES) {
    const at: number = ride.start + share * ride.plan.duration;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones(actor.subject, at);
    const support: sceneAffordanceFrame.IPlaced = sceneAffordanceFrame(
      performance,
      model,
      subject,
      params.seat!,
      at,
    );
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      actor.body.surfaces.sockets.seat;
    const seatPoint: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
      socket,
      bones.get(socket.bone)!,
    );
    const onSeat: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(support.pose.rotation),
      AutoMovieEngineVector3.subtract(seatPoint, support.pose.translation),
    );
    const lift: number = AutoMovieMotionHumanSeat.seated.point(actor.body, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      depth: support.site.depth,
    }).y;
    assert(
      Math.abs(onSeat.y - lift) <= HumanFoot.BEARING,
      label + " seat height",
    );
    assert(
      onSeat.z <= 0 && onSeat.z >= -support.site.depth!,
      label + " seat depth",
    );
    for (const side of ["left", "right"] as const) {
      const rest: string | undefined = params.feet?.[side];
      if (rest !== undefined) {
        const ball: IAutoMovieVector3 = HumanFoot.sockets(
          actor.body,
          bones,
          side,
        ).find(
          ({ socket }: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            socket === "ball",
        )!.point;
        const anchor: IAutoMovieVector3 = sceneAffordanceFrame(
          performance,
          model,
          subject,
          rest,
          at,
        ).pose.translation;
        assert(
          AutoMovieEngineVector3.distance(ball, anchor) <= HumanFoot.BEARING,
          label + " " + rest,
        );
      }
      const grip: string | undefined = params.hands?.[side];
      if (grip !== undefined) {
        const hand: AutoMovieHumanoidBone =
          side === "left" ? "leftHand" : "rightHand";
        const anchor: sceneAffordanceFrame.IPlaced = sceneAffordanceFrame(
          performance,
          model,
          subject,
          grip,
          at,
        );
        assert(
          HumanColliders.distance(
            actor.body,
            new Map([[hand, bones.get(hand)!]]),
            anchor.pose.translation,
          ).distance <=
            (anchor.site.aperture ?? 0) / 2 + GRIP,
          label + " " + grip,
        );
      }
    }
  }
}

/** Both wrists stay on the trolley's two handle rods through the push. */
function checkPush(
  performance: IAutoMovieMotionHumanPerformance,
  model: SceneArchetype.Model,
  subject: string,
  actor: IAutoMovieMotionHumanPerformer,
  push: IAutoMovieMotionHumanSegment,
): void {
  const window: IAutoMovieMotionHumanContactWindow = push.plan.contacts.find(
    ({ part, kind }: IAutoMovieMotionHumanContactWindow): boolean =>
      part === "leftHand" && kind === "grip",
  )!;
  for (const fraction of PUSH_FRACTIONS) {
    const share: number = window.from + (window.to - window.from) * fraction;
    const at: number = push.start + push.plan.duration * share;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones(actor.subject, at);
    for (const [id, key] of PUSH_HANDLES) {
      const hand: IAutoMovieHumanoidSurfaces.IFrame =
        actor.body.surfaces.sockets[key];
      const wrist: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
        hand,
        bones.get(hand.bone)!,
      );
      const handle: sceneAffordanceFrame.IPlaced = sceneAffordanceFrame(
        performance,
        model,
        subject,
        id,
        at,
      );
      const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(handle.pose.rotation),
        AutoMovieEngineVector3.subtract(wrist, handle.pose.translation),
      );
      assert(Math.hypot(local.y, local.z) <= GRIP, id + " rod axis");
      assert(
        Math.abs(local.x) <= handle.site.length! / 2 + GRIP,
        id + " material band",
      );
    }
  }
}

/** The vehicle travels, stops, and the car's door and bicycle's transfers frame the trip. */
function checkTravel(
  performance: IAutoMovieMotionHumanPerformance,
  subject: string,
  label: string,
): void {
  const start: IAutoMovieRigidTransform = performance.prop(subject, 0);
  const stopped: IAutoMovieRigidTransform = performance.prop(
    subject,
    performance.duration,
  );
  assert(AutoMovieEngineVector3.distance(start.position, stopped.position) > TRAVEL, label);
  assert.deepEqual(
    performance.prop(subject, performance.duration - STOPPED),
    stopped,
    label,
  );
  if (label === "car-trip") {
    assert.equal(performance.state(subject, 3.15).driverDoor, 45);
    assert.equal(
      performance.state(subject, performance.duration).driverDoor,
      0,
    );
  } else if (label === "a-bicycle-ride") {
    assert.equal(performance.segments("rider")[0]?.name, "bikeTransfer");
    assert.equal(performance.segments("rider").at(-1)?.name, "bikeTransfer");
  }
}
