import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { crutchSitDown } from "./crutchSitDown";
import { crutchSitKit } from "./crutchSitKit";
import { crutchSitUp } from "./crutchSitUp";

/**
 * Sit down onto a chair with two crutches, or rise from it, in the prescribed
 * order (Cornell Health and HealthLinkBC, Using crutches).
 *
 * Sitting (`crutchSitDown`): the hands take the standing crutches' grips
 * (`taken`) as the injured leg lifts off the floor; both crutches are gathered
 * into the injured side's hand (`gathered`); the sound hand reaches back to the
 * chair's armrest or seat (`reached`); and the sit law lowers the body while
 * the crutches tilt on their planted tips. Rising (`crutchSitUp`): the rise law
 * stands the body on the sound leg while the sound hand pushes on the chair and
 * the crutches come back upright; the sound hand takes its crutch back
 * (`taken`), and both are planted in the tripod (`planted`). The injured leg is
 * held off the floor throughout.
 *
 * Both arms are laid as one course (`courseArmGoal`) from the second the hands
 * hold the crutches. The crutches are held, never leaned on: the hands carry
 * them by grip windows, a wear and holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both orders, their source, the course and the custody.
 * @evidence contracts/development/design.md#principled-representation The sit and rise laws for the body, with the arms and the injured leg written over them and the crutches carried.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Dispatches to the two orders and courses the arms; the body's sit and rise, the transport and the course are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every crutch frame follows from the crutches' own contacts, the seat and the body's measure.
 */
export const HumanCrutchSit: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrutchSit> =
  {
    name: "crutchSit",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchSit>,
    ): IAutoMovieMotionHumanActionPlan => {
      const kit: crutchSitKit.IKit = crutchSitKit.of(context);
      const order: crutchSitKit.IOrder =
        context.params.rise === true
          ? crutchSitUp(context, kit)
          : crutchSitDown(context, kit);
      const goals: IAutoMovieMotionHumanActionPlan = {
        duration: order.duration,
        events: [...order.events].sort(
          (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
            a.share - b.share,
        ),
        contacts: order.contacts,
        holds: order.holds,
        wears: order.wears,
        ...(order.base === undefined ? {} : { base: order.base }),
        posture: (seconds: number): IAutoMovieMotionHumanPosture =>
          order.posture(seconds),
      };
      return courseArmGoal({
        context,
        plan: goals,
        side: kit.injured,
        span: {
          start: 0,
          ready: order.ready,
          relax: order.duration,
          end: order.duration,
        },
        with: [
          {
            side: kit.sound,
          },
        ],
        after: "angles",
      });
    },
  };
