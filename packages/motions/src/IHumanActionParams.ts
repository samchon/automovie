import type { jump } from "./actions/jump";
import type { run } from "./actions/run";
import type { stand } from "./actions/stand";
import type { walk } from "./actions/walk";
import type { operate } from "./affordance/operate";
import type { kickBall } from "./ballStrike/kickBall";
import type { carry } from "./carrying/carry";
import type { climbLadder } from "./climbing/climbLadder";
import type { handToFace } from "./daily/handToFace";
import type { dress } from "./dressing/dress";
import type { approach } from "./everyday/approach";
import type { bend } from "./everyday/bend";
import type { brace } from "./everyday/brace";
import type { crouch } from "./everyday/crouch";
import type { gesture } from "./everyday/gesture";
import type { kneel } from "./everyday/kneel";
import type { look } from "./everyday/look";
import type { rest } from "./everyday/rest";
import type { rise } from "./everyday/rise";
import type { shift } from "./everyday/shift";
import type { sit } from "./everyday/sit";
import type { stepOver } from "./everyday/stepOver";
import type { typeText } from "./everyday/typeText";
import type { dance } from "./exercise/dance";
import type { exercise } from "./exercise/exercise";
import type { stretch } from "./exercise/stretch";
import type { crawl } from "./floor/crawl";
import type { lieDown } from "./floor/lieDown";
import type { clinch } from "./grappling/clinch";
import type { handOver } from "./handling/handOver";
import type { handshake } from "./handling/handshake";
import type { pickUp } from "./handling/pickUp";
import type { putDown } from "./handling/putDown";
import type { receive } from "./handling/receive";
import type { flinch } from "./reaction/flinch";
import type { knockdown } from "./reaction/knockdown";
import type { stagger } from "./reaction/stagger";
import type { athletics } from "./sport/athletics";
import type { ballSport } from "./sport/ballSport";
import type { baseball } from "./sport/baseball";
import type { gymnastics } from "./sport/gymnastics";
import type { martialArt } from "./sport/martialArt";
import type { racket } from "./sport/racket";
import type { swim } from "./sport/swim";
import type { defend } from "./striking/defend";
import type { guard } from "./striking/guard";
import type { kick } from "./striking/kick";
import type { knee } from "./striking/knee";
import type { punch } from "./striking/punch";
import type { step } from "./striking/step";
import type { useTool } from "./tasks/useTool";
import type { wipe } from "./tasks/wipe";
import type { climbStairs } from "./terrain/climbStairs";
import type { catchObject } from "./throwing/catchObject";
import type { throwObject } from "./throwing/throwObject";
import type { highFive } from "./touch/highFive";
import type { kiss } from "./touch/kiss";
import type { selfAction } from "./touch/selfAction";
import type { touch } from "./touch/touch";

/**
 * The parameters of every action by its name: the one table that types a
 * chain's `act(name, params)` and each vocabulary method, so a call names an
 * action and the type checker supplies and checks its parameters.
 *
 * Each member is the law's own `IParams`; nothing is restated here. Its keys
 * are exactly `HumanActionName`: `HumanChain.act` indexes it by the name, so
 * a name without a member, or a member without a name, fails to compile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table types and where each member comes from.
 * @evidence contracts/development/design.md#principled-representation A record from the closed action name to that law's parameter type, the shape a name-indexed call needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One member per action name, each owned by its law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Restates no parameter: every member refers to the law's own type.
 */
export interface IHumanActionParams {
  /** Quiet standing. */
  stand: stand.IParams;

  /** Walking to a floor point. */
  walk: walk.IParams;

  /** Running to a floor point. */
  run: run.IParams;

  /** Jumping to a floor point. */
  jump: jump.IParams;

  /** Walking up to a target. */
  approach: approach.IParams;

  /** Looking at a target. */
  look: look.IParams;

  /** A communicative gesture. */
  gesture: gesture.IParams;

  /** The hands at rest places. */
  rest: rest.IParams;

  /** A punch. */
  punch: punch.IParams;

  /** A kick. */
  kick: kick.IParams;

  /** The fighting guard. */
  guard: guard.IParams;

  /** Fighting-stance footwork. */
  step: step.IParams;

  /** A defence against one strike. */
  defend: defend.IParams;

  /** The protective startle. */
  flinch: flinch.IParams;

  /** A capture step after a push. */
  stagger: stagger.IParams;

  /** Going down to lie supine. */
  knockdown: knockdown.IParams;

  /** A knee strike. */
  knee: knee.IParams;

  /** Sitting down. */
  sit: sit.IParams;

  /** Standing up from a seat. */
  rise: rise.IParams;

  /** Edging along a seat. */
  shift: shift.IParams;

  /** Bending to a low point. */
  bend: bend.IParams;

  /** A handshake. */
  handshake: handshake.IParams;

  /** Picking a prop up. */
  pickUp: pickUp.IParams;

  /** Putting a prop down. */
  putDown: putDown.IParams;

  /** Handing a prop over. */
  handOver: handOver.IParams;

  /** Receiving a prop. */
  receive: receive.IParams;

  /** Stepping over an obstacle. */
  stepOver: stepOver.IParams;

  /** Bracing for a force. */
  brace: brace.IParams;

  /** Typing a text. */
  typeText: typeText.IParams;

  /** A touch on a region. */
  touch: touch.IParams;

  /** A hand-to-face task. */
  handToFace: handToFace.IParams;

  /** A crouch or squat. */
  crouch: crouch.IParams;

  /** Kneeling. */
  kneel: kneel.IParams;

  /** Climbing stairs. */
  climbStairs: climbStairs.IParams;

  /** Throwing an object. */
  throwObject: throwObject.IParams;

  /** Catching an object. */
  catchObject: catchObject.IParams;

  /** Operating a mechanism. */
  operate: operate.IParams;

  /** Lying down. */
  lieDown: lieDown.IParams;

  /** Crawling. */
  crawl: crawl.IParams;

  /** Climbing a ladder. */
  climbLadder: climbLadder.IParams;

  /** A clinch grip. */
  clinch: clinch.IParams;

  /** Kicking a ball. */
  kickBall: kickBall.IParams;

  /** Working a tool. */
  useTool: useTool.IParams;

  /** Wiping a surface. */
  wipe: wipe.IParams;

  /** Putting on a hat or glasses. */
  dress: dress.IParams;

  /** Walking with a load. */
  carry: carry.IParams;

  /** A kiss. */
  kiss: kiss.IParams;

  /** A high five. */
  highFive: highFive.IParams;

  /** A whole-body self action. */
  selfAction: selfAction.IParams;

  /** A bodyweight exercise. */
  exercise: exercise.IParams;

  /** A static stretch. */
  stretch: stretch.IParams;

  /** A dance step. */
  dance: dance.IParams;

  /** The sprint start. */
  athletics: athletics.IParams;

  /** A handstand. */
  gymnastics: gymnastics.IParams;

  /** A martial-art technique. */
  martialArt: martialArt.IParams;

  /** A team ball skill. */
  ballSport: ballSport.IParams;

  /** A baseball position. */
  baseball: baseball.IParams;

  /** A racket or golf position. */
  racket: racket.IParams;

  /** Swimming. */
  swim: swim.IParams;
}
