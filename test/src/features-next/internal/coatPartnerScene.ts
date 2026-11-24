import {
  type AutoMovieArchetype,
  createStageJacket,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDress,
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { everydayTake } from "../../features/internal/everydayTake";
import { motionHumanBody } from "../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../features/internal/wardrobeFilm";

/**
 * The coat scene of `test_motion_get_dressed_coat_partner`, staged as that spec
 * stages it, with its readers and bounds, so the dresser's pickUp, its hold and
 * the partner's threading are each a unit and the scene keeps only its
 * cross-action checks.
 */
export namespace coatPartnerScene {
  /** The rigid custody bound: a worn item's drift on its bone, metres. */
  export const RIGID: number = 0.001;

  /** How still the held-open jacket stays while the partner threads, metres. */
  export const STILL: number = 0.002;

  /**
   * How far the jacket's `wear` socket may lie from the collar, metres:
   * `wardrobe`'s reach tolerance.
   */
  export const MISS: number = 0.01;

  /**
   * The wearer's collar offset from mid-shoulders in the wearer's heading:
   * `wardrobe`'s own.
   */
  const COLLAR: IAutoMovieVector3 = { x: 0, y: -0.085, z: 0.1 };

  /** How long the partner waits before threading, seconds. */
  export const WAIT: number = 3;

  /** How long the jacket is held open, seconds. */
  export const HOLD: number = 4.5;

  /** How far the dresser's wrist is asked to rise after its grasp, metres. */
  export const LIFT: number = 0.02;

  /** A hand enters its sleeve opening from at least this in front of it, metres. */
  export const ENTER: number = 0.02;

  /** A hand leaves its sleeve opening at least this past it, metres. */
  export const CLEAR: number = 0.05;

  /** A jacket model. */
  export type JacketModel = AutoMovieArchetype<
    createStageJacket.Affordance,
    createStageJacket.Dimension
  >;

  /** One case of the original: who coats whom, with which hand. */
  export interface ICase {
    /** The dresser's body. */
    dresser: motionHumanBody.Name;

    /** The partner's body. */
    dressed: motionHumanBody.Name;

    /** The hand that holds the jacket. */
    hand: AutoMovieHumanSide;

    /** The case, for failures. */
    label: string;
  }

  /**
   * The original's cases: the average man coating the small woman and the
   * reverse, with either holding hand.
   */
  export const CASES: readonly ICase[] = [
    caseOf("m-average", "f-small", "right"),
    caseOf("m-average", "f-small", "left"),
    caseOf("f-small", "m-average", "right"),
    caseOf("f-small", "m-average", "left"),
  ];

  /** One case, labelled as the original labels it. */
  function caseOf(
    dresser: motionHumanBody.Name,
    dressed: motionHumanBody.Name,
    hand: AutoMovieHumanSide,
  ): ICase {
    return {
      dresser,
      dressed,
      hand,
      label: `${dresser} coats ${dressed} (${hand} hand)`,
    };
  }

  /**
   * The stage jacket the wardrobe specifications use.
   *
   * @returns The model.
   */
  export function jacket(): JacketModel {
    return createStageJacket({
      id: "jacket",
      width: 0.39,
      depth: 0.3,
      sleeveWidth: 0.19,
      sleeveLength: 0.04,
      length: 0.48,
      zipTravel: 0.15,
    });
  }

  /** What a staged coat take plays after the partner's threading. */
  export type Tail = "none" | "walkOff";

  /**
   * The dresser `a` behind the partner `b`, both facing +Z; `a` picks up the
   * jacket and coats `partner`, `b` threads both sleeves and, with the
   * `walkOff` tail, stands and walks off, as the original.
   *
   * @param a The dresser's body.
   * @param b The partner's body.
   * @param model The jacket.
   * @param hand The holding hand.
   * @param partner The coat's named partner.
   * @param hold The coat's hold, seconds.
   * @param tail What the partner plays after threading.
   * @returns The take.
   */
  export function stage(
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
    model: JacketModel,
    hand: AutoMovieHumanSide,
    partner: string,
    hold: number,
    tail: Tail,
  ): HumanPerformance {
    const threaded: IAutoMovieMotionHumanChain = HumanChain.subject("b")
      .stand({ hold: WAIT })
      .registered("wardrobe", {
        kind: "sleeveIn",
        prop: "jacket",
        side: "left",
        held: true,
      })
      .registered("wardrobe", {
        kind: "sleeveIn",
        prop: "jacket",
        side: "right",
        held: true,
      });
    // The partner is placed first, so the dresser reads where the partner
    // stands; the partner threads the jacket where the dresser holds it, at
    // the partner's own collar, without reading the dresser.
    const partnered: IAutoMovieMotionHumanChain =
      tail === "walkOff"
        ? threaded
            .stand({ hold: 2 })
            .walk({ to: { x: 0.3, y: 0, z: 0.8 }, face: 60 })
        : threaded;
    return new HumanPerformance({
      seed: "coat-partner",
      laws: [
        AutoMovieMotionHumanGetDressed.coatPartner,
        AutoMovieMotionHumanDress.wardrobe,
      ],
      performers: [performer("a", a, -0.45), performer("b", b, 0)],
      props: [prop(model, hand)],
      composition: partnered.with(
        HumanChain.extend({
          coatPartner: AutoMovieMotionHumanGetDressed.coatPartner,
        })
          .subject("a")
          .stand({ hold: 0.3 })
          // The dresser stands behind the partner, so it takes the jacket by
          // its back collar; the `hold` handle is on the front.
          .pickUp({ prop: "jacket", handle: "backCollar", hand, lift: LIFT })
          .coatPartner({ prop: "jacket", partner, hand, hold }),
      ).node,
    });
  }

  /**
   * The dresser alone taking up the jacket by its back collar, as the
   * original's dresser takes it before the coat.
   *
   * @param a The dresser's body.
   * @param model The jacket.
   * @param hand The holding hand.
   * @returns The take.
   */
  export function pickUp(
    a: IAutoMovieMotionHumanBody,
    model: JacketModel,
    hand: AutoMovieHumanSide,
  ): HumanPerformance {
    return new HumanPerformance({
      seed: "coat-partner",
      performers: [performer("a", a, -0.45)],
      props: [prop(model, hand)],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .pickUp({ prop: "jacket", handle: "backCollar", hand, lift: LIFT })
        .node,
    });
  }

  /** A trained performer facing +Z at a depth. */
  function performer(
    subject: string,
    body: IAutoMovieMotionHumanBody,
    z: number,
  ): everydayTake.IPerformer {
    return {
      subject,
      body,
      at: { x: 0, y: 0, z },
      yaw: 0,
      proficiency: { level: "trained" },
    };
  }
  /** The jacket on the holding hand's side, as the original places it. */
  function prop(
    model: JacketModel,
    hand: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanProp {
    const sign: number = hand === "left" ? 1 : -1;
    return HumanObject.prop(
      "jacket",
      model,
      wardrobeFilm.placement(0.1 * sign + 0.25 * sign, 1.06, -0.25),
    );
  }

  /**
   * The dresser's coat.
   *
   * @param film The take.
   * @returns The coatPartner segment.
   */
  export function coat(film: HumanPerformance): IAutoMovieMotionHumanSegment {
    return film
      .segments("a")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "coatPartner",
      )!;
  }

  /**
   * The partner's threading actions, in order.
   *
   * @param film The take.
   * @returns The wardrobe segments with a `sleeveReady` event.
   */
  export function sleeves(
    film: HumanPerformance,
  ): IAutoMovieMotionHumanSegment[] {
    return film
      .segments("b")
      .filter((segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.plan.events.some(
          (event: IAutoMovieMotionEvent): boolean =>
            event.name === "sleeveReady",
        ),
      );
  }

  /**
   * A prop socket's world point.
   *
   * @param prop The prop's frame.
   * @param site The socket.
   * @returns World metres.
   */
  export function socket(
    prop: IAutoMovieRigidTransform,
    site: IAutoMovieAffordance,
  ): IAutoMovieVector3 {
    return Vector3.add(
      prop.position,
      Quaternion.rotateVector(prop.rotation, site.frame.translation),
    );
  }

  /**
   * The partner's displayed collar: mid-shoulders plus `wardrobe`'s collar
   * offset in the partner's heading.
   *
   * @param film The take.
   * @param t Film seconds.
   * @returns World metres.
   */
  export function collar(film: HumanPerformance, t: number): IAutoMovieVector3 {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("b", t);
    const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
    const right: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
    const across: IAutoMovieVector3 = Vector3.subtract(left, right);
    const yaw: number = (Math.atan2(-across.z, across.x) * 180) / Math.PI;
    return Vector3.add(
      Vector3.lerp(left, right, 0.5),
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
        COLLAR,
      ),
    );
  }

  /**
   * The jacket's frame in the partner's displayed chest frame.
   *
   * @param film The take.
   * @param t Film seconds.
   * @returns The frame.
   */
  export function chest(
    film: HumanPerformance,
    t: number,
  ): IAutoMovieRigidTransform {
    const bone: IAutoMovieResolvedBone = film.bones("b", t).get("chest")!;
    const prop: IAutoMovieRigidTransform = film.prop("jacket", t);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      bone.worldRotation,
    );
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, bone.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };
  }
}
