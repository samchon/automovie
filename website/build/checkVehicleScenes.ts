import { ArchetypeFrame } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieMotionHumanRide } from "@automovie/interface";
import { HumanColliders, HumanFoot, seated } from "@automovie/motions";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import { SceneTake } from "../src/scenes/SceneTake";
import { SCENES_VEHICLES } from "../src/scenes/data/SCENES_VEHICLES";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";

/** Check the published stages against actual carried seats, grips, treads and wheels. */
export function checkVehicleScenes(): void {
  for (const scene of SCENES_VEHICLES) {
    const alternate = scene.id === "a-bicycle-ride" || scene.id === "car-trip";
    for (const take of alternate
      ? [scene.takes[0]!, scene.takes[2]!]
      : [scene.takes[0]!]) {
      const input = SceneTake.apply(scene.composition!, take);
      const object = input.objects![0]!;
      const model = SceneArchetype.model(object);
      const { performance } = PlaygroundPerformance.build(input);
      const frame = (id: string, time: number) => {
        const root = performance.prop(object.subject, time);
        const shown = model.articulate(performance.state(object.subject, time));
        const site = shown.affordance(id);
        return {
          site,
          pose: ArchetypeFrame.compose(
            {
              translation: root.position,
              rotation: root.rotation,
              scale: { x: 1, y: 1, z: 1 },
            },
            site.frame,
          ),
        };
      };

      for (const actor of performance.performers) {
        const motion = performance.segments(actor.subject);
        const ride = motion.find(({ name }) => name === "ride");
        const push = motion.find(({ name }) => name === "pushPull");
        assert(ride !== undefined || push !== undefined);
        if (ride !== undefined) {
          const params = ride.params as IAutoMovieMotionHumanRide.IParams;
          for (const share of [0.2, 0.43, 0.67, 0.88]) {
            const at = ride.start + share * ride.plan.duration;
            const bones = performance.bones(actor.subject, at);
            const support = frame(params.seat!, at);
            const socket = actor.body.surfaces.sockets.seat;
            const seatPoint = resolveAutoMovieHumanoidSurfaces.point(
              socket,
              bones.get(socket.bone)!,
            );
            const onSeat = Quaternion.rotateVector(
              Quaternion.inverse(support.pose.rotation),
              Vector3.subtract(seatPoint, support.pose.translation),
            );
            const lift = seated.point(actor.body, {
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              depth: support.site.depth,
            }).y;
            assert(
              Math.abs(onSeat.y - lift) <= HumanFoot.BEARING,
              scene.id + " seat height",
            );
            assert(
              onSeat.z <= 0 && onSeat.z >= -support.site.depth!,
              scene.id + " seat depth",
            );
            for (const side of ["left", "right"] as const) {
              const rest = params.feet?.[side];
              if (rest !== undefined) {
                const ball = HumanFoot.sockets(actor.body, bones, side).find(
                  ({ socket }) => socket === "ball",
                )!.point;
                assert(
                  Vector3.distance(ball, frame(rest, at).pose.translation) <=
                    HumanFoot.BEARING,
                  scene.id + " " + rest,
                );
              }
              const grip = params.hands?.[side];
              if (grip !== undefined) {
                const hand = side === "left" ? "leftHand" : "rightHand";
                const parts = new Map([[hand, bones.get(hand)!]] as const);
                const anchor = frame(grip, at);
                assert(
                  HumanColliders.distance(
                    actor.body,
                    parts,
                    anchor.pose.translation,
                  ).distance <=
                    (anchor.site.aperture ?? 0) / 2 + 0.01,
                  scene.id + " " + grip,
                );
              }
            }
          }
        }
        if (push !== undefined) {
          const window = push.plan.contacts.find(
            ({ part, kind }) => part === "leftHand" && kind === "grip",
          )!;
          for (const fraction of [0.1, 0.45, 0.8, 0.95]) {
            const share = window.from + (window.to - window.from) * fraction;
            const at = push.start + push.plan.duration * share;
            const bones = performance.bones(actor.subject, at);
            for (const [id, key] of [
              ["leftHandle", "gripLeft"],
              ["rightHandle", "gripRight"],
            ] as const) {
              const hand = actor.body.surfaces.sockets[key];
              const wrist = resolveAutoMovieHumanoidSurfaces.point(
                hand,
                bones.get(hand.bone)!,
              );
              const handle = frame(id, at);
              const local = Quaternion.rotateVector(
                Quaternion.inverse(handle.pose.rotation),
                Vector3.subtract(wrist, handle.pose.translation),
              );
              assert(Math.hypot(local.y, local.z) <= 0.01, id + " rod axis");
              assert(
                Math.abs(local.x) <= handle.site.length! / 2 + 0.01,
                id + " material band",
              );
            }
          }
        }
      }

      const start = performance.prop(object.subject, 0);
      const stopped = performance.prop(object.subject, performance.duration);
      assert(
        Vector3.distance(start.position, stopped.position) > 0.3,
        scene.id,
      );
      assert.deepEqual(
        performance.prop(object.subject, performance.duration - 0.3),
        stopped,
        scene.id,
      );
      if (scene.id === "car-trip") {
        assert.equal(performance.state(object.subject, 3.15).driverDoor, 45);
        assert.equal(
          performance.state(object.subject, performance.duration).driverDoor,
          0,
        );
      } else if (scene.id === "a-bicycle-ride") {
        assert.equal(performance.segments("rider")[0]?.name, "bikeTransfer");
        assert.equal(
          performance.segments("rider").at(-1)?.name,
          "bikeTransfer",
        );
      }
    }
  }

  const bicycle = SCENES_VEHICLES.find(({ id }) => id === "a-bicycle-ride")!;
  const impossible = SceneTake.apply(bicycle.composition!, bicycle.takes[0]!);
  impossible.objects![0]!.course!.at = 0.1;
  assert.throws(
    () => PlaygroundPerformance.build(impossible),
    /move during the stopped transfer/,
  );
}
