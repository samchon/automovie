import type { IAutoMovieMotionHumanRun } from "./actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanStand } from "./actions/IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanWalkParams } from "./actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanKickBall } from "./ballStrike/IAutoMovieMotionHumanKickBall";
import type { IAutoMovieMotionHumanCarry } from "./carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanClimbLadder } from "./climbing/IAutoMovieMotionHumanClimbLadder";
import type { IAutoMovieMotionHumanHandToFace } from "./daily/IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanApproach } from "./everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanBend } from "./everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanBrace } from "./everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanCrouch } from "./everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanKneel } from "./everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanLook } from "./everyday/IAutoMovieMotionHumanLook";
import type { IAutoMovieMotionHumanRest } from "./everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanRise } from "./everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanShift } from "./everyday/IAutoMovieMotionHumanShift";
import type { IAutoMovieMotionHumanSit } from "./everyday/IAutoMovieMotionHumanSit";
import type { IAutoMovieMotionHumanStepOver } from "./everyday/IAutoMovieMotionHumanStepOver";
import type { IAutoMovieMotionHumanTypeText } from "./everyday/IAutoMovieMotionHumanTypeText";
import type { IAutoMovieMotionHumanExercise } from "./exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanStretch } from "./exercise/IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanCrawl } from "./floor/IAutoMovieMotionHumanCrawl";
import type { IAutoMovieMotionHumanGetUp } from "./floor/IAutoMovieMotionHumanGetUp";
import type { IAutoMovieMotionHumanLieDown } from "./floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanClinch } from "./grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanHandoverAction } from "./handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanHandshake } from "./handling/IAutoMovieMotionHumanHandshake";
import type { IAutoMovieMotionHumanPickUp } from "./handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPushPull } from "./handling/IAutoMovieMotionHumanPushPull";
import type { IAutoMovieMotionHumanPutDown } from "./handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanReceive } from "./handling/IAutoMovieMotionHumanReceive";
import type { IAutoMovieMotionHumanDance } from "./next/IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanDress } from "./next/IAutoMovieMotionHumanDress";
import type { IAutoMovieMotionHumanGesture } from "./next/IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanJump } from "./next/IAutoMovieMotionHumanJump";
import type { IAutoMovieMotionHumanOperate } from "./next/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanSupport } from "./next/IAutoMovieMotionHumanSupport";
import type { IAutoMovieMotionHumanSwim } from "./next/IAutoMovieMotionHumanSwim";
import type { IAutoMovieMotionHumanTouch } from "./next/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanFlinch } from "./reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanGive } from "./reaction/IAutoMovieMotionHumanGive";
import type { IAutoMovieMotionHumanKnockdown } from "./reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "./reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "./reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanAthletics } from "./sport/IAutoMovieMotionHumanAthletics";
import type { IAutoMovieMotionHumanBallSport } from "./sport/IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanBaseball } from "./sport/IAutoMovieMotionHumanBaseball";
import type { IAutoMovieMotionHumanChiSau } from "./sport/IAutoMovieMotionHumanChiSau";
import type { IAutoMovieMotionHumanGymnastics } from "./sport/IAutoMovieMotionHumanGymnastics";
import type { IAutoMovieMotionHumanMartialArt } from "./sport/IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanRacket } from "./sport/IAutoMovieMotionHumanRacket";
import type { IAutoMovieMotionHumanCloseStrike } from "./striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanDefend } from "./striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanFootStrike } from "./striking/IAutoMovieMotionHumanFootStrike";
import type { IAutoMovieMotionHumanGuard } from "./striking/IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "./striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "./striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "./striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "./striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanUseTool } from "./tasks/IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "./tasks/IAutoMovieMotionHumanWipe";
import type { IAutoMovieMotionHumanClimbStairs } from "./terrain/IAutoMovieMotionHumanClimbStairs";
import type { IAutoMovieMotionHumanCatchObject } from "./throwing/IAutoMovieMotionHumanCatchObject";
import type { IAutoMovieMotionHumanRelease } from "./throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectParams } from "./throwing/IAutoMovieMotionHumanThrowObjectParams";
import type { IAutoMovieMotionHumanHighFive } from "./touch/IAutoMovieMotionHumanHighFive";
import type { IAutoMovieMotionHumanKiss } from "./touch/IAutoMovieMotionHumanKiss";
import type { IAutoMovieMotionHumanSelfAction } from "./touch/IAutoMovieMotionHumanSelfAction";

/**
 * The parameters of every action by its name: the one table that types a
 * chain's `act(name, params)` and each vocabulary method, so a call names an
 * action and the type checker supplies and checks its parameters.
 *
 * Each member is the law's own `IParams`; nothing is restated here. Its keys
 * are exactly `AutoMovieMotionHumanActionName`: `HumanChain.act` indexes it by
 * the name, so a name without a member, or a member without a name, fails to
 * compile.
 *
 * What only planning finds, such as an unreachable target, the law refuses as
 * its own type states.
 */
export interface IAutoMovieMotionHumanActionParams {
  /** Quiet standing. */
  stand: IAutoMovieMotionHumanStand.IParams;

  /** Walking to a floor point. */
  walk: IAutoMovieMotionHumanWalkParams;

  /** Running to a floor point. */
  run: IAutoMovieMotionHumanRun.IParams;

  /** Jumping to a floor point. */
  jump: IAutoMovieMotionHumanJump.IParams;

  /** Walking up to a target. */
  approach: IAutoMovieMotionHumanApproach.IParams;

  /** Looking at a target. */
  look: IAutoMovieMotionHumanLook.IParams;

  /** A communicative gesture. */
  gesture: IAutoMovieMotionHumanGesture.IParams;

  /** The hands at rest places. */
  rest: IAutoMovieMotionHumanRest.IParams;

  /** A punch. */
  punch: IAutoMovieMotionHumanPunch.IParams;

  /** A kick. */
  kick: IAutoMovieMotionHumanKick.IParams;

  /** The fighting guard. */
  guard: IAutoMovieMotionHumanGuard.IParams;

  /** Fighting-stance footwork. */
  step: IAutoMovieMotionHumanStep.IParams;

  /** A defence against one strike. */
  defend: IAutoMovieMotionHumanDefend.IParams;

  /** The protective startle. */
  flinch: IAutoMovieMotionHumanFlinch.IParams;

  /** Giving way to a contact. */
  give: IAutoMovieMotionHumanGive.IParams;

  /** A capture step after a push. */
  stagger: IAutoMovieMotionHumanStagger.IParams;

  /** Going down to lie supine. */
  knockdown: IAutoMovieMotionHumanKnockdown.IParams;

  /** Respond to the impulses on the body by their outcome. */
  perturb: IAutoMovieMotionHumanPerturb.IParams;

  /** A knee strike. */
  knee: IAutoMovieMotionHumanKnee.IParams;

  /** An elbow, a spinning elbow or backfist, or a headbutt. */
  closeStrike: IAutoMovieMotionHumanCloseStrike.IParams;

  /** A side, back, hook, crescent, axe kick, a stomp or a leg sweep. */
  footStrike: IAutoMovieMotionHumanFootStrike.IParams;

  /** Sitting down. */
  sit: IAutoMovieMotionHumanSit.IParams;

  /** Standing up from a seat. */
  rise: IAutoMovieMotionHumanRise.IParams;

  /** Edging along a seat. */
  shift: IAutoMovieMotionHumanShift.IParams;

  /** Bending to a low point. */
  bend: IAutoMovieMotionHumanBend.IParams;

  /** A handshake. */
  handshake: IAutoMovieMotionHumanHandshake.IParams;

  /** Picking a prop up. */
  pickUp: IAutoMovieMotionHumanPickUp.IParams;

  /** Putting a prop down. */
  putDown: IAutoMovieMotionHumanPutDown.IParams;

  /** Handing a prop over. */
  handOver: IAutoMovieMotionHumanHandoverAction.IParams;

  /** Receiving a prop. */
  receive: IAutoMovieMotionHumanReceive.IParams;

  /** Stepping over an obstacle. */
  stepOver: IAutoMovieMotionHumanStepOver.IParams;

  /** Bracing for a force. */
  brace: IAutoMovieMotionHumanBrace.IParams;

  /** Typing a text. */
  typeText: IAutoMovieMotionHumanTypeText.IParams;

  /** A touch on a region. */
  touch: IAutoMovieMotionHumanTouch.IParams;

  /** A hand-to-face task. */
  handToFace: IAutoMovieMotionHumanHandToFace.IParams;

  /** A crouch or squat. */
  crouch: IAutoMovieMotionHumanCrouch.IParams;

  /** Kneeling. */
  kneel: IAutoMovieMotionHumanKneel.IParams;

  /** Climbing stairs. */
  climbStairs: IAutoMovieMotionHumanClimbStairs.IParams;

  /** Throwing an object. */
  throwObject: IAutoMovieMotionHumanThrowObjectParams;

  /** Catching an object. */
  catchObject: IAutoMovieMotionHumanCatchObject.IParams;

  /** Catching a real ball an anchored action launched. */
  stageCatch: IAutoMovieMotionHumanCatchObject.IStageParams;

  /** Letting go of a held prop. */
  release: IAutoMovieMotionHumanRelease.IParams;

  /** Operating a mechanism. */
  operate: IAutoMovieMotionHumanOperate.IParams;

  /** Lying down. */
  lieDown: IAutoMovieMotionHumanLieDown.IParams;

  /** Getting up from the floor. */
  getUp: IAutoMovieMotionHumanGetUp.IParams;

  /** Moving the body's weight across a sequence of supports. */
  support: IAutoMovieMotionHumanSupport.IParams;

  /** Crawling. */
  crawl: IAutoMovieMotionHumanCrawl.IParams;

  /** Climbing a ladder. */
  climbLadder: IAutoMovieMotionHumanClimbLadder.IParams;

  /** A clinch grip. */
  clinch: IAutoMovieMotionHumanClinch.IParams;

  /** Kicking a ball. */
  kickBall: IAutoMovieMotionHumanKickBall.IParams;

  /** Working a tool. */
  useTool: IAutoMovieMotionHumanUseTool.IParams;

  /** Wiping a surface. */
  wipe: IAutoMovieMotionHumanWipe.IParams;

  /** Putting on a hat or glasses. */
  dress: IAutoMovieMotionHumanDress.IParams;

  /** Walking with a load. */
  carry: IAutoMovieMotionHumanCarry.IParams;

  /** Pushing, pulling or dragging a heavy load by its handles. */
  pushPull: IAutoMovieMotionHumanPushPull.IParams;

  /** A kiss. */
  kiss: IAutoMovieMotionHumanKiss.IParams;

  /** A high five. */
  highFive: IAutoMovieMotionHumanHighFive.IParams;

  /** A whole-body self action. */
  selfAction: IAutoMovieMotionHumanSelfAction.IParams;

  /** A bodyweight exercise. */
  exercise: IAutoMovieMotionHumanExercise.IParams;

  /** A static stretch. */
  stretch: IAutoMovieMotionHumanStretch.IParams;

  /** A dance step. */
  dance: IAutoMovieMotionHumanDance.IParams;

  /** The sprint start. */
  athletics: IAutoMovieMotionHumanAthletics.IParams;

  /** A handstand. */
  gymnastics: IAutoMovieMotionHumanGymnastics.IParams;

  /** A martial-art technique. */
  martialArt: IAutoMovieMotionHumanMartialArt.IParams;

  /** Wing chun's rolling chi sau with a partner. */
  chiSau: IAutoMovieMotionHumanChiSau.IParams;

  /** A team ball skill. */
  ballSport: IAutoMovieMotionHumanBallSport.IParams;

  /** A baseball position. */
  baseball: IAutoMovieMotionHumanBaseball.IParams;

  /** A racket or golf position. */
  racket: IAutoMovieMotionHumanRacket.IParams;

  /** Swimming. */
  swim: IAutoMovieMotionHumanSwim.IParams;
}
