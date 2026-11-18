import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../ballStrike/HumanBall";
import { HumanRefusal } from "../law/HumanRefusal";
import { catchObject } from "./catchObject";

/**
 * The registered, physical-prop variant of the catch law. Compose the
 * anchored launch first through the proposed catch time, then use
 * `registered("stageCatch", { from, ball })` on the catcher. A portable
 * drag-free prop must reach the base law's interception point on its
 * actual flight before this law gives its grip custody of the prop.
 * The source window supplies the provisional planning horizon. Final flight
 * admission checks that the launch survives and its frame matches the grip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the registered use, relevant source window, supported prop and authoritative catch instant.
 * @evidence contracts/development/design.md#principled-representation The base catch owns arm goals and timing. A hold publishes the borrowed launch identity and frame check at the interception the base plan names.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses the catch's parameter and plan types plus the prop reader's public placement. The film and hand carry still belong to the performance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second catch trajectory, grip proxy or special body model. The opt-in law admits a staged capture only where its existing arm plan and the authoritative prop trajectory agree.
 */
export const stageCatch: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCatchObject.IParams> =
  {
    ...catchObject,
    name: "stageCatch",
    family: catchObject.name,
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IParams>,
    ): IAutoMovieMotionHumanCatchObject.IPlan => {
      const { ball, from }: IAutoMovieMotionHumanCatchObject.IParams =
        context.params;
      const source: IAutoMovieMotionHumanPlacedAction = context.action(from);
      const launches: readonly IAutoMovieMotionPropLaunch[] =
        source.plan.launches?.filter(
          (launch: IAutoMovieMotionPropLaunch): boolean => launch.prop === ball,
        ) ?? [];
      const launch: IAutoMovieMotionPropLaunch | undefined = launches[0];
      if (launches.length !== 1 || launch === undefined)
        throw new HumanRefusal({
          kind: "participant",
          axis: "from",
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

      const plan: IAutoMovieMotionHumanCatchObject.IPlan =
        catchObject.plan(context);
      const contact: number | undefined = plan.contact;
      const released: number = source.start + launch.seconds;
      if (
        contact === undefined ||
        released < source.entryTime ||
        !(context.start + contact > released) ||
        context.start + contact > source.end
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "from",
          value: from,
          reason:
            "the source action must stay placed from release through interception",
          fix: "extend the anchored launch action through the proposed catch",
        });

      if (reader.launchAt?.(context.start + contact) !== launch)
        throw new HumanRefusal({
          kind: "reach",
          axis: "from",
          value: from,
          reason: "the anchored launch must own the prop at interception",
          fix: "place the catch before another grip or launch takes the prop",
        });

      // The placed flight and the arm plan must see the same ball at contact.
      // The projectile campaign's parity contract bounds this difference in metres.
      const flightParity: number = 1e-6;
      const expected: IAutoMovieVector3 = plan.object(contact);
      const model: IAutoMovieMotionHumanPropReader["prop"] = reader.prop;
      const capture: NonNullable<IAutoMovieMotionPropHold["capture"]> = {
        launch,
        matches: (frame: IAutoMovieRigidTransform): boolean =>
          Vector3.length(
            Vector3.subtract(
              HumanBall.placed(
                model,
                (): IAutoMovieRigidTransform => frame,
                "ball",
              ).centre,
              expected,
            ),
          ) <= flightParity,
      };
      if (!capture.matches(reader.frame(context.start + contact)))
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
          ? [context.params.side ?? "right"]
          : ["left", "right"];
      return {
        ...plan,
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
