import {
  AutoMovieArchetypeCourse,
  createBoat,
  createCanoePaddle,
  createKayak,
  createKayakPaddle,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

const SIDES = ["left", "right"] as const;
const PERIOD: number = 1.24;

/**
 * A kneeling canoeist and a seated kayaker with real separate prop trajectories.
 *
 * Scenarios:
 * 1. Two hands meet the canoe paddle's T-bar and shaft over one-sided
 *    loaded strokes. Knee and opposite sole keep their entered floor sites.
 * 2. Stable pelvis and two foot braces in the kayaking cockpit while opposite
 *    paddle blades enter and leave the water in successive strokes.
 * 3. Read both boats and paddles on the same clock across the opening
 *    turn and in reverse, and refuse a canoe take staged on the wrong tool.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two hulls, stance datums, moving parts and replay checks.
 * @evidence contracts/development/testing.md#behavioral-verification Compares both body and independently posed archetype contacts in the actual composition.
 * @evidence contracts/development/testing.md#independent-expectations The named surfaces and water plane give geometric oracles. Separate paddles require different visible blade count, hand sites and loading side.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests still and turning hulls, wet and recovery periods, alternating blades, distinct support stances, reverse sampling and the wrong tool.
 * @evidence contracts/development/testing.md#execution-ownership Builds the two takes, motions and archetypes entirely in memory.
 */
export function test_motion_ride_native_paddling(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const kind of ["canoeStroke", "kayakStroke"] as const) {
    const canoe: boolean = kind === "canoeStroke";
    const boat = canoe ? createBoat({ kind: "canoe" }) : createKayak();
    const paddle = canoe
      ? createCanoePaddle()
      : createKayakPaddle({ length: 2.3 });
    const course: AutoMovieArchetypeCourse.IPlan =
      AutoMovieArchetypeCourse.plan("paddle-course", {
        start: { x: 0, z: 0, heading: 0 },
        legs: [
          { kind: "straight", length: 0.4 },
          { kind: "turn", radius: 6, angle: 32 },
          { kind: "straight", length: 2 },
        ],
        cruise: 1.4,
        acceleration: 1.1,
        deceleration: 0.6,
      });
    const first: IAutoMovieRigidTransform = {
      position: course.at(0).placement.translation,
      rotation: course.at(0).placement.rotation,
    };
    const placed: IAutoMovieVector3 = canoe
      ? boat.affordances.find((a) => a.id === "floor")!.frame.translation
      : first.position;
    const actor: IAutoMovieMotionHumanPerformer = {
      subject: "paddler",
      body,
      at: { ...placed, z: 0.31 },
      yaw: 0,
      proficiency: { level: "trained" },
    };
    const chain = HumanChain.subject(actor.subject);
    const entry = chain
      .stand({ hold: 0.2, on: { prop: "boat" } })
      .kneel({ knee: "right", kind: "one", hold: 0.15, rise: false });
    const before: HumanPerformance | undefined = canoe
      ? new HumanPerformance({
          seed: "paddle-entry",
          performers: [actor],
          props: [HumanObject.prop("boat", boat, first)],
          composition: entry.node,
        })
      : undefined;
    const depart: number = before?.duration ?? 0;
    const lead: number = canoe ? 0.28 : 0;
    const ready: number = depart + lead;
    const hips: IAutoMovieVector3 | undefined =
      before === undefined
        ? undefined
        : before.bones("paddler", depart).get("hips")!.worldPosition;
    const boatAt = (film: number): IAutoMovieRigidTransform => {
      const t: number = Math.max(0, film - ready);
      const { translation, rotation } = course.at(t).placement;
      return { position: translation, rotation };
    };
    const paddleAt = (film: number): IAutoMovieRigidTransform => {
      const t: number = Math.max(0, film - ready);
      const full: number = t / PERIOD;
      const cycle: number = Math.floor(full);
      const phase: number = full - cycle;
      const loaded: number = Math.min(1, phase / 0.49);
      const recovery: number = Math.min(1, Math.max(0, (phase - 0.49) / 0.51));
      const skim: number = Math.sin(Math.PI * recovery);
      const pull: number =
        minimumJerk.share(loaded) - minimumJerk.share(recovery);
      const z: number = canoe
        ? hips!.z + 0.38 - 0.25 * pull
        : -0.29 + 0.48 - 0.24 * pull;
      const angle: number = canoe
        ? 63 - 20 * skim
        : -(cycle % 2 ? -1 : 1) * 34 * (1 - 2 * minimumJerk.share(recovery));
      const frame: IAutoMovieRigidTransform = boatAt(film);
      return {
        position: point(frame, {
          x: canoe ? -0.23 : 0,
          y:
            (canoe ? 0.55 : 0.586) +
            0.13 * skim +
            (canoe
              ? 0.14 *
                (1 -
                  minimumJerk.share(
                    Math.max(0, Math.min(1, (film - depart) / lead)),
                  ))
              : 0),
          z,
        }),
        // A canoe shaft leans its top forward about the lower hand, so the
        // top hand drives ahead of the face rather than at it.
        rotation: Quaternion.multiply(
          Quaternion.multiply(
            frame.rotation,
            Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, canoe ? 20 : 0),
          ),
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, angle),
        ),
      };
    };
    const take = (tool: IAutoMovieMotionHumanObject.IModel): HumanPerformance =>
      new HumanPerformance({
        seed: "native-paddle",
        laws: [AutoMovieMotionHumanSwim.aquatic],
        performers: [actor],
        props: [
          HumanObject.prop("boat", boat, first, boatAt),
          HumanObject.prop("blade", tool, paddleAt(0), paddleAt),
        ],
        composition: (canoe ? entry : chain).registered("aquatic", {
          kind,
          support: "boat",
          prop: "blade",
          side: canoe ? "right" : "left",
        }).node,
      });
    const film: HumanPerformance = take(paddle);
    assertTakeClean(kind, film);
    const stroke: IAutoMovieMotionHumanSegment = film
      .segments("paddler")
      .at(-1)!;
    const phase0: number = stroke.start + lead;
    const acquisition = stroke.plan.events.find(
      (e) => e.name === "paddleReady",
    );
    if (
      canoe &&
      (acquisition === undefined ||
        Math.abs(acquisition.share * stroke.plan.duration - lead) > 1e-9)
    )
      throw new Error(
        "canoe approach and first catch lack the shared lead beat",
      );
    const bones0 = film.bones("paddler", phase0);
    const knee = body.surfaces.regions.kneeRight;
    const top = point(
      first,
      boat.affordances.find((a) => a.id === (canoe ? "floor" : "seat"))!.frame
        .translation,
    );
    const knee0: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      knee,
      bones0.get(knee.bone)!,
    ).point;
    const startingSole: IAutoMovieVector3 = HumanFoot.sockets(
      body,
      bones0,
      "left",
    )[1]!.point;
    const errors: string[] = [];
    let maxHand: number = 0;
    let maxSupport: number = 0;
    for (let frame: number = 0; frame <= 72; ++frame) {
      const t: number = phase0 + (3 * PERIOD * frame) / 72;
      const hull: IAutoMovieRigidTransform = film.prop("boat", t);
      const tool: IAutoMovieRigidTransform = film.prop("blade", t);
      const bones = film.bones("paddler", t);
      const seat = canoe
        ? resolveAutoMovieHumanoidSurfaces.place(knee, bones.get(knee.bone)!)
            .point
        : resolveAutoMovieHumanoidSurfaces.point(
            body.surfaces.sockets.seat,
            bones.get("hips")!,
          );
      const local = (at: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          Quaternion.inverse(hull.rotation),
          Vector3.subtract(at, hull.position),
        );
      maxSupport = Math.max(
        maxSupport,
        Math.abs(
          local(seat).y - top.y - (canoe ? body.measure.shankRadius : 0),
        ),
      );
      if (canoe) {
        maxSupport = Math.max(maxSupport, Vector3.distance(local(seat), knee0));
        maxSupport = Math.max(
          maxSupport,
          Vector3.distance(
            local(HumanFoot.sockets(body, bones, "left")[1]!.point),
            startingSole,
          ),
        );
      } else
        for (const side of SIDES) {
          const rest = boat.affordances.find(
            (site) => site.id === `${side}Foot`,
          )!.frame.translation;
          const sole = HumanFoot.sockets(body, bones, side)[1]!.point;
          maxSupport = Math.max(
            maxSupport,
            Vector3.distance(local(sole), rest),
          );
        }
      for (const side of SIDES) {
        const id: string = canoe
          ? side === "left"
            ? "topGrip"
            : "shaftGrip"
          : `${side}Grip`;
        // A hand may hold a round handle anywhere along its length: the gap
        // is the hand's distance off the handle's axis, or past its end.
        const site = paddle.affordances.find((site) => site.id === id)!;
        const centre: IAutoMovieVector3 = point(tool, site.frame.translation);
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.multiply(tool.rotation, site.frame.rotation),
          { x: 1, y: 0, z: 0 },
        );
        const offset: IAutoMovieVector3 = Vector3.subtract(
          HumanHand.frame(body, bones, side, "grip").point,
          centre,
        );
        const along: number = Vector3.dot(offset, axis);
        maxHand = Math.max(
          maxHand,
          Vector3.length(Vector3.subtract(offset, Vector3.scale(axis, along))),
          Math.abs(along) - (site.length ?? 0) / 2,
        );
      }
    }
    const tip = (id: string, t: number): number =>
      point(
        film.prop("blade", t),
        paddle.affordances.find((site) => site.id === id)!.frame.translation,
      ).y;
    const wet: string = canoe ? "bladeTip" : "leftTip";
    const load: number = phase0 + 0.23 * PERIOD;
    const clear: number = phase0 + 0.74 * PERIOD;
    if (!(tip(wet, load) < -0.01 && tip(wet, clear) > 0.08))
      errors.push(
        `blade must hit water and recover [${tip(wet, load)}, ${tip(wet, clear)}]`,
      );
    if (
      !canoe &&
      !(tip("rightTip", load) > 0.3 && tip("rightTip", load + PERIOD) < -0.01)
    )
      errors.push("the alternate blade must take the following stroke");
    if (
      !canoe &&
      !vclose(film.prop("blade", load).position, paddleAt(load).position)
    )
      errors.push("paddle ownership changed from the authored track");
    if (
      !(
        course.at(2 * PERIOD).curvature > 0 &&
        Vector3.distance(
          film.prop("boat", phase0).position,
          film.prop("boat", phase0 + 2 * PERIOD).position,
        ) > 1
      )
    )
      errors.push("the moving hull must depart and turn");
    if (maxHand > 0.01) errors.push(`grip gap ${maxHand} m exceeds 10 mm`);
    if (maxSupport > 0.015) errors.push(`support gap ${maxSupport} m`);
    const old = film.bones("paddler", load).get("hips")!.worldPosition;
    film.bones("paddler", clear);
    if (
      !vclose(old, film.bones("paddler", load).get("hips")!.worldPosition, 1e-8)
    )
      errors.push("reverse sample changed the actor");
    try {
      take(canoe ? createKayakPaddle() : createCanoePaddle());
      errors.push("a paddle from a different discipline must refuse");
    } catch (error) {
      if (!(error instanceof HumanRefusal && error.kind === "affordance"))
        throw error;
    }
    TestValidator.equals(`${kind} observations`, errors, []);
  }
}

function point(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}
