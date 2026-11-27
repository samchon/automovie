import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../../ballStrike/HumanBall";
import { HumanRefusal } from "../../law/HumanRefusal";
import { catchObject } from "./catchObject";

/**
 * The physical-prop variant of the catch law, an action of the vocabulary.
 * Compose the anchored launch first through the proposed catch time, then
 * `stageCatch({ partner, ball })` on the catcher's chain. A portable drag-free
 * prop must reach the base law's interception point on its actual flight before
 * this law gives its grip custody of the prop. An authored `intercept` reads
 * that flight at release plus its seconds, including any intervening rebound,
 * and uses the same arm planner. The interception second is the flight's
 * provisional planning horizon, so a long pass is caught after the thrower's
 * action has ended. Final flight admission checks that the launch survives and
 * its frame matches the grip.
 */
export const stageCatch: IAutoMovieMotionHumanCatchObject.IStageLaw = {
  ...catchObject,
  name: "stageCatch",
  family: catchObject.name,
  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IStageParams>,
  ): IAutoMovieMotionHumanCatchObject.IPlan => {
    const {
      ball,
      partner: from,
    }: IAutoMovieMotionHumanCatchObject.IStageParams = context.params;
    const source: IAutoMovieMotionHumanPlacedAction = context.action(from);
    const launches: readonly IAutoMovieMotionPropLaunch[] =
      source.plan.launches?.filter(
        (launch: IAutoMovieMotionPropLaunch): boolean => launch.prop === ball,
      ) ?? [];
    const launch: IAutoMovieMotionPropLaunch | undefined = launches[0];
    if (launches.length !== 1 || launch === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "partner",
        value: from,
        reason: `the anchored action must publish one launch of ${ball}`,
        fix: "name the action that releases the ball in from",
      });

    const reader: IAutoMovieMotionHumanPropReader = context.prop(ball);
    if (
      reader.prop.fixed === true ||
      reader.prop.motion !== undefined ||
      reader.prop.worn !== undefined ||
      reader.prop.body?.drag !== undefined
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "ball",
        value: ball,
        reason:
          "stageCatch plans the interception of a portable drag-free prop",
        fix: "use a prop whose motion is driven by its launch",
      });

    const released: number = source.start + launch.seconds;
    const specified: number | undefined = context.params.intercept;
    const model: IAutoMovieMotionHumanPropReader["prop"] = reader.prop;
    const centre = (frame: IAutoMovieRigidTransform): IAutoMovieVector3 =>
      HumanBall.placed(model, (): IAutoMovieRigidTransform => frame, "ball")
        .centre;
    let interception: catchObject.IInterception | undefined;
    let approach: IAutoMovieMotionHumanPropReader.IFlightApproach | undefined;
    if (specified !== undefined) {
      const at: number = released + specified;
      if (!(specified > 0) || !(at > context.start))
        throw new HumanRefusal({
          kind: "reach",
          axis: "intercept",
          value: specified,
          reason:
            "the prop must be on the anchored launch during the placed interception",
          fix: "give positive seconds after release, within the catcher's window",
        });
      const previous: number = at - Math.min((at - released) / 2, 1e-4);
      approach = reader.flightApproach?.(at, previous);
      if (approach?.launch !== launch)
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: from,
          reason: "the anchored launch must own the prop at interception",
          fix: "place the catch before another grip or launch takes the prop",
        });
      const expected: IAutoMovieVector3 = centre(approach.frame);
      const movement: IAutoMovieVector3 = Vector3.subtract(
        expected,
        centre(approach.before),
      );
      if (!(Vector3.length(movement) > 0))
        throw new HumanRefusal({
          kind: "reach",
          axis: "intercept",
          value: specified,
          reason: "the ball has already come to rest at interception",
          fix: "intercept the ball in motion, or pick it up after it settles",
        });
      interception = {
        contact: at - context.start,
        speed: Vector3.scale(movement, 1 / (at - previous)),
        before: (seconds: number): IAutoMovieVector3 =>
          seconds >= at - context.start
            ? expected
            : centre(reader.frame(Math.max(released, context.start + seconds))),
      };
    }
    const plan: IAutoMovieMotionHumanCatchObject.IPlan = catchObject.plan(
      context,
      interception,
    );
    const contact: number | undefined = plan.contact;
    if (
      contact === undefined ||
      released < source.entryTime ||
      !(context.start + contact > released)
    )
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: from,
        reason:
          "the source action must release the ball before the interception",
        fix: "place the catch after the anchored action's release",
      });

    const placedAt: number = context.start + contact;
    const approached:
      | IAutoMovieMotionHumanPropReader.IFlightApproach
      | undefined = approach ?? reader.flightApproach?.(placedAt, placedAt);
    if (
      (approached === undefined
        ? reader.launchAt?.(placedAt)
        : approached.launch) !== launch
    )
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: from,
        reason: "the anchored launch must own the prop at interception",
        fix: "place the catch before another grip or launch takes the prop",
      });

    // The placed flight and the arm plan must see the same ball at contact.
    // The projectile campaign's parity contract bounds this difference in metres.
    const flightParity: number = 1e-6;
    const expected: IAutoMovieVector3 = plan.object(contact);
    const prepare: number | undefined =
      specified !== undefined &&
      launch.sphere !== undefined &&
      context.params.glove === undefined
        ? plan.events.find((event): boolean => event.name === "prepare")?.share
        : undefined;
    const capture: NonNullable<IAutoMovieMotionPropHold["capture"]> = {
      launch,
      ...(prepare === undefined
        ? {}
        : { handContactFrom: context.start + prepare * plan.duration }),
      matches: (frame: IAutoMovieRigidTransform): boolean =>
        Vector3.length(Vector3.subtract(centre(frame), expected)) <=
        flightParity,
    };
    if (!capture.matches(approached?.frame ?? reader.frame(placedAt)))
      throw new HumanRefusal({
        kind: "reach",
        axis: "ball",
        value: ball,
        reason:
          "the recorded flight misses the catch plan's interception point",
        fix: "align the published launch and the catch on the same unobstructed path",
      });

    const hands: readonly AutoMovieHumanSide[] =
      context.params.hands === "one"
        ? [context.params.hand ?? "right"]
        : ["left", "right"];
    // The catching hands are this plan's own: name them, so over a
    // carrier the overlay keeps posing a hand that holds the ball instead
    // of handing it to the carrier's carry fit.
    return {
      ...plan,
      hands: [...(plan.hands ?? []), ...hands],
      holds: [
        ...(plan.holds ?? []),
        ...hands.map(
          (side: AutoMovieHumanSide): IAutoMovieMotionPropHold => ({
            side,
            prop: ball,
            from: contact / plan.duration,
            capture,
          }),
        ),
      ],
    };
  },
};
