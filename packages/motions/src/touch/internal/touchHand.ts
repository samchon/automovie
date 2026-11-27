import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import type { AutoMovieMotionHumanTouchContacts } from "../../compose/AutoMovieMotionHumanTouchContacts";
import { AutoMovieMotionHumanTouchLaid } from "../../compose/AutoMovieMotionHumanTouchLaid";
import { touchPrimitive } from "../../compose/internal/touchPrimitive";
import type { touchCrossedSupport } from "./touchCrossedSupport";
import { touchHold } from "./touchHold";
import { touchRegion } from "./touchRegion";

/**
 * One touching hand's primitives (`touch`): the hand laid on its region the way
 * its layout lays it, its elbow hint from where the hand meets its place (end
 * on from its elbow, or kept by a held tool's grasp), and the touch's stroke,
 * rests, stand-off and support on that hand. A ruled or drawn site already lies
 * off the region's point by up to its radius, so the hand lands about the site
 * only in the room that radius has left, the offset read once at the entry.
 *
 * @param prepared The touch's prepared values.
 * @param side The touching hand.
 * @param target The region it touches.
 * @returns The hand's primitives.
 */
export function touchHand(
  prepared: touchHand.IPrepared,
  side: AutoMovieHumanSide,
  target: IAutoMovieMotionTarget,
): IAutoMovieMotionHumanPrimitive[] {
  const {
    context,
    first,
    region,
    unsited,
    felt,
    leaning,
    laid,
    reached,
    risen,
    effector,
    kept,
    clock,
    kind,
    count,
    extent,
    together,
    attempt,
    resting,
    standoff,
  }: touchHand.IPrepared = prepared;
  const p: IAutoMovieMotionHumanTouch.IParams = context.params;
  const body = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const radius: number | undefined = touchRegion.disc(
    context,
    target,
    side === first ? p.site : undefined,
  );
  // A ruled or drawn site already lies off the region's point by up to
  // its radius; the hand lands about the site only in the room that
  // radius has left, so the touch stays within it of the region
  // (`IAutoMovieMotionHumanTouchSite`: the radius the place is chosen
  // within), the offset read once at the entry.
  const disc: number | undefined =
    side !== first ||
    radius === undefined ||
    p.site === undefined ||
    !("within" in p.site || "draw" in p.site)
      ? radius
      : Math.max(
          0,
          radius -
            Vector3.distance(
              region(target)(entry, 0).point,
              unsited(target, leaning)(entry, 0).point,
            ),
        );
  const support: IAutoMovieMotionHumanContactWindow.Support | undefined =
    target.kind === "person"
      ? { kind: "person", subject: target.subject, region: target.region }
      : target.kind === "self"
        ? {
            kind: "person",
            subject: context.subject,
            region: target.region,
          }
        : undefined;
  const { lay, tangent, axis } = laid(side, target);

  // Where the hand arrives on its region, on the reached posture.
  const arrival: IAutoMovieMotionHumanTouchSite.IFrame = region(target)(
    reached,
    0,
  );

  // A hand that meets its place end on runs from its elbow, so the
  // elbow's place is settled with the hand and serves as the hint too.
  const from: IAutoMovieVector3 | undefined =
    lay === "reach"
      ? AutoMovieMotionHumanTouchLaid.settled(
          body,
          reached,
          side,
          effector,
          arrival,
          tangent,
          p.elbow,
        )
      : undefined;
  const own: IAutoMovieMotionHumanGrasp.IKey | null =
    side === first ? kept : null;
  const bend: IAutoMovieVector3 =
    from ??
    own?.bend ??
    AutoMovieMotionHumanTouchLaid.bend(
      body,
      reached,
      side,
      effector,
      arrival,
      tangent,
      lay,
      axis,
      p.elbow,
    );
  return touchPrimitive({
    body,
    clock,
    side,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    effector,
    region: touchHold.region(clock, region(target), felt(target, leaning)),
    kind,
    count,
    tangent,
    extent,
    bend,
    reference:
      own === null
        ? AutoMovieMotionHumanTouchLaid.laid(
            body,
            reached,
            side,
            effector,
            arrival,
            tangent,
            bend,
            lay,
            axis,
            p.elbow,
            from,
          )
        : AutoMovieMotionHumanTouchLaid.reference(body, reached, side, {
            point: own.wrist.point,
            rotation: own.wrist.rotation,
            bend,
          }),
    lay,
    ...(axis === undefined ? {} : { facing: axis }),
    ...(own === null ? {} : { held: own.wrist.rotation }),
    ...(from === undefined ? {} : { from }),
    ...(p.elbow === undefined ? {} : { elbow: p.elbow }),
    entry: risen,
    ...(together === undefined ? {} : { together }),
    ...(disc === undefined ? {} : { disc }),
    ...(attempt === undefined
      ? {}
      : { skinDistance: AutoMovieMotionHumanAuditSkin.BUILT }),
    ...(target.kind === "self"
      ? { on: body.surfaces.regions[target.region].bone }
      : {}),
    ...(resting(side).length === 0 ? {} : { rests: resting(side) }),
    ...(p.prop !== undefined && side === first
      ? { fingers: "keep" as const }
      : {}),
    ...(standoff > 0 ? { standoff } : {}),
    ...(support === undefined || standoff > 0 ? {} : { contact: support }),
    ...(target.kind === "person"
      ? {
          others: touchHold.others(context, target, clock),
          perceived: touchHold.perceived(
            context,
            target,
            clock,
            region(target),
          ),
        }
      : {}),
  });
}

/** Companion types of {@link touchHand}. */
export namespace touchHand {
  /** What the touch's plan prepared before its hands. */
  export interface IPrepared {
    /** The touch's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>;

    /** The first hand, which a site and a held prop belong to. */
    first: AutoMovieHumanSide;

    /** A region at a second, on the posture as the stance leans it. */
    region: (
      target: IAutoMovieMotionTarget,
    ) => ReturnType<ReturnType<typeof touchRegion.reader>>;

    /** The first hand's region without its site. */
    unsited: ReturnType<typeof touchRegion.reader>;

    /** A region as the hand lying on a person feels it. */
    felt: ReturnType<typeof touchRegion.reader>;

    /** Whether the stance leans. */
    leaning: boolean;

    /** Each hand's layout on its region. */
    laid: touchHold.Lay;

    /** The posture the arms are solved on at plan time. */
    reached: IAutoMovieMotionHumanPosture;

    /** The posture the stroke is entered from. */
    risen: IAutoMovieMotionHumanPosture;

    /** The touching part of the hand. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** A held tool's grasp the first hand keeps, if any. */
    kept: IAutoMovieMotionHumanGrasp.IKey | null;

    /** The touch's clock. */
    clock: IAutoMovieMotionClock;

    /** The touch's kind. */
    kind: IAutoMovieMotionHumanTouchForm.Kind;

    /** The stroke's repetitions. */
    count: number;

    /** The manner's extent. */
    extent: number;

    /** The hands' shared trajectory, if any. */
    together: IAutoMovieMotionHumanArmPlanned.ITogether | undefined;

    /** The crossed-support attempt this plan is, if any. */
    attempt: touchCrossedSupport.IAttempt | undefined;

    /** Each hand's rests. */
    resting: ReturnType<typeof AutoMovieMotionHumanTouchContacts.sided>;

    /** The hand's stand-off from its region, metres. */
    standoff: number;
  }
}
