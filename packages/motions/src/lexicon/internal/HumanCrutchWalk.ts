import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanCrutchWalkPlan } from "./HumanCrutchWalkPlan";
import { crutchWalkCourse } from "./crutchWalkCourse";

/*
 * Walking on two crutches: a crutch gait on the support law, the crutches
 * advancing on their own track and the body swinging on the hands.
 *
 * Each station first advances both crutch tips (`ADVANCE` of its time), the
 * feet standing; then the hands bear on the planted handgrips while the feet
 * swing. In a three-point gait only the sound foot bears and steps, the injured
 * leg held off the floor (`HELD`), its foot first lifted clear over its place
 * before the leg folds; in a swing-to gait both feet land level with the tips
 * ("Lift and swing the body to the crutches", Morelewicz and Chambers 1961,
 * "Crutch Walking", AAIN Journal 9(1):20-21; "Land on your good foot, between
 * your crutches", UMass Memorial Health's crutch instructions), and in a
 * swing-through gait `THROUGH` past them. A foot is level with a line where the
 * middle of its support, between the heel and the ball it lands flat on
 * (contacts.md, "Feet"), lies on it. The crutch props share the walk's clock
 * (`track`), so a scene's crutches and the body read one course. Each station
 * carries both crutches and the feet rigidly with the walker: displaced by the
 * station and turned about the walk's `origin` (each crutch about its own tip
 * and the feet about the tips' midpoint when none is given). The hands hold
 * their grips where the crutch stands at each support key and ride the crutch's
 * lift between them (`carryCrutchHands`).
 */
export const HumanCrutchWalk: IAutoMovieMotionHumanCrutchWalk.ILaw = {
  name: "crutchWalk",
  interrupts: {},

  track: (
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchWalk,
    _side: AutoMovieHumanSide,
    startsAt: number = 0,
    localTip?: IAutoMovieVector3,
  ): ((filmSecond: number) => IAutoMovieRigidTransform) => {
    const timing: crutchWalkCourse.IClock = crutchWalkCourse.clock(params);
    // A crutch moves rigidly with the walker: displaced by each station and
    // turned about the entry station (`origin`). Both crutches advance on one
    // clock, so the side selects no phase of its own.
    const moves: crutchWalkCourse.IAdvance[] = crutchWalkCourse.advances(
      start,
      params,
      timing,
      localTip,
    );
    return (filmSecond: number): IAutoMovieRigidTransform =>
      crutchWalkCourse.frameAt(moves, start, filmSecond - startsAt);
  },

  plan: HumanCrutchWalkPlan,
};
