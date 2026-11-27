import type { AutoMovieArchetype } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";

import { motionHumanLaw } from "./motionHumanLaw";

const { putDownAperture } = AutoMovieMotionHumanPrehension;

/**
 * Shared staging and readers for the household workflow specifications: one
 * trained performer `a` at the origin, placed archetypes, event times in film
 * seconds and complaint collection against metre bounds.
 *
 * The callers own every bound and assertion. These readers only build the
 * public performance and read its displayed prop and hand frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared staging, the performer, the units and that callers own the bounds.
 * @evidence contracts/development/design.md#principled-representation Positions are world metres, times film seconds and frames the public rigid transforms the performance displays.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the staging and readers the kitchen, laundry and floor workflow specifications share; body, prop and performance types stay with their package owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, prop frame or limit is replaced; every reading comes from the public performance.
 */
export namespace householdFilm {
  /**
   * An event-name to film-second map of one segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the key and the timebase of the value.
   * @evidence contracts/development/design.md#principled-representation Values are film seconds derived from the segment's start, duration and event share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias for the map every workflow reads its phase times from.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Event names stay the law's own; nothing is renamed or invented.
   */
  export type EventTimes = Record<string, number>;

  /**
   * Resolve the public performance of performer `a` through a chain with the
   * given props. The aperture placement law is registered for the laundry.
   *
   * @param body The canonical body.
   * @param chain The authored chain.
   * @param props The placed props.
   * @returns The film with remembered displayed frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the performer, the registered law, the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the SDK's AutoMovieMotionHumanPerformance with one trained performer at the origin facing +Z and wraps it in the shared film reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Construction only; reading and assertions belong to the callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose, limit or prop is replaced; refusals propagate to the caller.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Delegates all planning to the performance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds an independent performance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned film owns its frame memory until the caller drops it.
   */
  export function stage(
    body: IAutoMovieMotionHumanBody,
    chain: IAutoMovieMotionHumanChain,
    props: IAutoMovieMotionHumanProp[],
  ): motionHumanLaw.IFilm {
    return motionHumanLaw.film(
      new AutoMovieMotionHumanPerformance({
        seed: "household",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        laws: [putDownAperture],
        props,
        composition: chain.node,
      }),
    );
  }

  /**
   * Place a static archetype with its own contacts in the scene.
   *
   * @param id The scene id.
   * @param model The archetype.
   * @param at Its floor-level origin in world metres.
   * @param yaw Its heading in degrees about +Y.
   * @returns The fixed prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units of the placement and that the prop is fixed.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the public AutoMovieMotionHumanObject.prop placement with `fixed: true`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the placement owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The model's own affordances are kept unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One placement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call places one prop.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fixed(
    id: string,
    model: AutoMovieArchetype,
    at: IAutoMovieVector3,
    yaw: number = 0,
  ): IAutoMovieMotionHumanProp {
    return AutoMovieMotionHumanObject.prop(id, model, { at, yaw, fixed: true });
  }

  /**
   * Transform a model-local point by a prop's displayed frame.
   *
   * @param frame The displayed rigid frame.
   * @param local The model-local point in metres.
   * @returns The world point in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both frames and units.
   * @evidence contracts/development/implementation.md#principled-implementation Rotates then translates, the rigid transform's definition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    frame: IAutoMovieRigidTransform,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local),
    );
  }

  /**
   * The film seconds of a selected segment's public events.
   *
   * @param film The film of performer `a`.
   * @param name The segment's action name.
   * @param ordinal Which occurrence of that action, from zero.
   * @returns Each event's film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the selection and the timebase.
   * @evidence contracts/development/implementation.md#principled-implementation Converts each event share to start plus share times duration, the segment clock's definition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects the segment, then maps its events.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing segment throws instead of returning a substitute.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the performer's segments and the segment's events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads one segment.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function events(
    film: motionHumanLaw.IFilm,
    name: string,
    ordinal: number = 0,
  ): EventTimes {
    const segment: IAutoMovieMotionHumanSegment | undefined = film.performance
      .segments("a")
      .filter(
        (part: IAutoMovieMotionHumanSegment): boolean => part.name === name,
      )[ordinal];
    if (segment === undefined)
      throw new Error(`no ${name} segment number ${ordinal}`);
    const times: EventTimes = {};
    for (const event of segment.plan.events)
      times[event.name] = segment.start + event.share * segment.plan.duration;
    return times;
  }

  /**
   * Add a complaint when a measured miss exceeds its bound, with both in
   * millimetres.
   *
   * @param failures The caller's complaints.
   * @param label What was measured.
   * @param miss The measured miss in metres.
   * @param limit The caller's bound in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the effect on the caller's list.
   * @evidence contracts/development/implementation.md#principled-implementation A non-strict comparison that also rejects NaN, so an unmeasurable miss fails.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison and one formatted complaint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound comes from the caller and is never widened here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Appends to the caller's list only.
   */
  export function near(
    failures: string[],
    label: string,
    miss: number,
    limit: number,
  ): void {
    if (!(miss <= limit))
      failures.push(
        `${label}: ${(1000 * miss).toFixed(3)} mm exceeds ${1000 * limit} mm`,
      );
  }

  /**
   * Check that a prop keeps its wrist-local offset through a rigid grip, at
   * the grip's start and four later quarter points.
   *
   * @param film The film of performer `a`.
   * @param prop The held prop.
   * @param from The grip's first film second.
   * @param to The grip's last film second.
   * @param bound The admitted drift in metres.
   * @param failures The caller's complaints.
   * @param side The gripping hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled instants, the frame of the offset and the bound's owner.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid grasp stores inverse(hand)·object at closure, so the prop's position in the hand bone's frame stays constant until release.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the start offset, then compares four later offsets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the displayed hand bone and prop frame, never the plan's stored offset.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five displayed-frame reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The film already shares its frames.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function keep(
    film: motionHumanLaw.IFilm,
    prop: string,
    from: number,
    to: number,
    bound: number,
    failures: string[],
    side: AutoMovieHumanSide = "right",
  ): void {
    const handLocal: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = film
        .bones("a", t)
        .get(`${side}Hand`)!;
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(
          film.performance.prop(prop, t).position,
          hand.worldPosition,
        ),
      );
    };
    const start: IAutoMovieVector3 = handLocal(from);
    for (const u of [0.25, 0.5, 0.75, 1]) {
      const t: number = from + u * (to - from);
      near(
        failures,
        `${prop} in ${side} grip at ${t.toFixed(2)} s`,
        Vector3.distance(handLocal(t), start),
        bound,
      );
    }
  }
}
