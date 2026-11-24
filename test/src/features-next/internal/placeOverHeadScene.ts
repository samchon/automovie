import { type AutoMovieArchetype, createNecklace } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * The neck-loop scenes of `test_motion_get_dressed_place_over_head`, staged as
 * that spec stages them, with switches for what a unit leaves out (the
 * dresser's walk off and the partner's rise), and the placing's checks 1 and 2,
 * so the placing from in front and from behind, the loop's pickUp, its ride
 * through a rise and the standing refusal are units of their own.
 */
export namespace placeOverHeadScene {
  /**
   * How the partner waits for the loop: seated facing the dresser, seated
   * facing away, or standing facing the dresser.
   */
  export type Pose = "front" | "behind" | "stand";

  /** A neck loop model. */
  export type Loop = AutoMovieArchetype<
    createNecklace.Affordance,
    createNecklace.Dimension
  >;

  /** What a scene leaves out after the placing. */
  export interface IAfter {
    /**
     * Whether a seated partner rises once the loop is worn, and the dresser
     * walks off before; the original's both.
     */
    rise: boolean;
  }

  /** A performer's chain. */
  type Chain = ReturnType<typeof HumanChain.subject>;

  /** The rigid custody bound: a worn loop's drift on its bone, metres. */
  export const RIGID: number = 0.001;

  /**
   * How near the worn loop's back lies to the nape, metres: the ribbon's
   * thickness and a skin contact (provisional).
   */
  const NAPE: number = 0.015;

  /**
   * How far ahead of the dresser a partner seated facing away has the seat's
   * front edge, metres (staging: the dresser behind the seated back).
   */
  const BEHIND: number = 0.75;

  /**
   * How far ahead of the dresser a partner seated facing the dresser has the
   * seat's front edge, metres (staging: the dresser at the knees).
   */
  const FRONT: number = 0.3;

  /** The partner's sitting's anchor, which the dresser waits for. */
  const SEATING: string = "seating";

  /**
   * How long the dresser may stand waiting for the partner to sit, seconds: an
   * upper bound past any sitting's `seated`.
   */
  const SIT: number = 6;

  /**
   * How far the dresser walks off a partner seated facing it before the partner
   * rises, metres (staging: clear of a rising trunk's forward lean).
   */
  const AWAY: number = 0.6;

  /**
   * The loop on its stand at the dresser's right, laid as it will be worn, as
   * the original places it.
   */
  export function stand(pose: Pose): IAutoMovieRigidTransform {
    return {
      position: { x: -0.3, y: 1.0, z: 0.05 },
      rotation:
        pose === "behind"
          ? Quaternion.identity()
          : Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    };
  }

  /** The handle the right hand takes the loop by, as the original takes it. */
  export function handle(pose: Pose): string {
    return pose === "behind" ? "holdRight" : "holdLeft";
  }

  /** The partner's seat for a seated pose, as the original stages it. */
  export function seat(
    b: IAutoMovieMotionHumanBody,
    pose: Pose,
  ): IAutoMovieMotionHumanSeated.ISeat {
    return {
      at: {
        x: 0,
        y: AutoMovieMotionHumanSeat.seated.popliteal(b),
        z: pose === "behind" ? BEHIND : FRONT,
      },
      yaw: pose === "behind" ? 0 : 180,
      depth: 0.45,
    };
  }

  /**
   * Where the partner stands before a seated pose's sitting, or stands for the
   * standing one.
   */
  export function place(b: IAutoMovieMotionHumanBody, pose: Pose): number {
    if (pose === "stand") return 0.55;
    const foot: number = b.rest.get("leftFoot")!.z - 0.1;
    const edge: number = pose === "behind" ? BEHIND : FRONT;
    return pose === "behind" ? edge - foot : edge + foot;
  }

  /**
   * `b` sits facing `a`, sits facing away or stands facing `a`; `a` takes the
   * loop up and sets it over `b`'s head; with `after.rise`, a seated `b` rises
   * and `a` first walks off a partner seated facing it, as the original.
   */
  export function scene(
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
    loop: Loop,
    pose: Pose,
    after: IAfter,
  ): HumanPerformance {
    const behind: boolean = pose === "behind";
    const partner: Chain = HumanChain.subject("b");
    const sat: Chain = partner.sit({ seat: seat(b, pose), hold: 8 }, SEATING);
    const first: Chain =
      pose === "stand"
        ? partner.stand({ hold: 8 })
        : after.rise
          ? sat.rise({})
          : sat;

    // The dresser reads the head where it is as the setting starts, so it
    // waits until a seated partner has sat; a partner seated facing it sits
    // pitched forward over the knees, so it waits `AWAY` back and walks in
    // to a foot's length short of the shins.
    const waiting: Chain =
      pose === "stand"
        ? HumanChain.subject("a")
        : HumanChain.subject("a")
            .stand({ hold: SIT })
            .until({ of: SEATING, event: "seated" });
    const dresser: Chain =
      pose === "front"
        ? waiting.walk({
            to: { x: 0, y: 0, z: -a.measure.footLength },
            face: 0,
          })
        : waiting;
    const placing: Chain = dresser
      .pickUp({ prop: "loop", handle: handle(pose), hand: "right", lift: 0.05 })
      .registered(AutoMovieMotionHumanGetDressed.placeOverHead.name, {
        prop: "loop",
        partner: "b",
      });
    return new HumanPerformance({
      seed: "place-over-head",
      laws: [AutoMovieMotionHumanGetDressed.placeOverHead],
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: pose === "front" ? -AWAY : 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: place(b, pose) },
          yaw: behind ? 0 : 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [HumanObject.prop("loop", loop, stand(pose))],

      // The partner is placed first, so the dresser reads where the head is;
      // before a partner seated facing it rises, the dresser walks off to its
      // side.
      composition: first.with(
        pose === "front" && after.rise
          ? placing.walk({
              to: { x: -AWAY, y: 0, z: -a.measure.footLength },
              face: -90,
            })
          : placing,
      ).node,
    });
  }

  /**
   * The placing's checks 1 and 2 of the original and its own bounds: both
   * hands' grips on the loop end as it is worn, the second hand's carrying
   * nothing, and the worn loop's back lies on the partner's nape.
   *
   * @returns The second the loop is worn.
   */
  export function placed(
    checks: motionComplaints.IGatherer,
    label: string,
    film: HumanPerformance,
    b: IAutoMovieMotionHumanBody,
    loop: Loop,
  ): number {
    const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
      film,
      "a",
      "placeOverHead",
    );
    const worn: number = motionActionUnit.event(act, "strokeEnd");
    const grips: readonly IAutoMovieMotionHumanContactWindow[] =
      act.plan.contacts.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.kind === "grip" &&
          w.support.kind === "prop" &&
          w.support.subject === "loop",
      );
    checks.check(
      `${label}: both grips end as the loop is worn, one carrying it`,
      grips.length === 2 &&
        grips.every(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            Math.abs(act.start + w.to * act.plan.duration - worn) <= 1e-9,
        ) &&
        grips.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.support.kind === "prop" && w.support.carries === false,
        ).length === 1,
    );
    const at: number = worn + 0.02;
    const frame: IAutoMovieRigidTransform = film.prop("loop", at);
    const back: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        loop.affordance("wear").frame.translation,
      ),
    );
    const nape: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      b.surfaces.regions.nape,
      film.bones("b", at).get(b.surfaces.regions.nape.bone)!,
    ).point;
    checks.check(
      `${label}: the loop's back lies on the nape (${(Vector3.distance(back, nape) * 1000).toFixed(0)} mm)`,
      Vector3.distance(back, nape) <= NAPE,
    );
    motionActionUnit.bounds(checks, label, film, "a", act);
    return worn;
  }

  /** A prop's position in a displayed bone's frame. */
  export function local(
    prop: IAutoMovieRigidTransform,
    bone: IAutoMovieResolvedBone,
  ): IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      bone.worldRotation,
    );
    return Quaternion.rotateVector(
      inverse,
      Vector3.subtract(prop.position, bone.worldPosition),
    );
  }
}
