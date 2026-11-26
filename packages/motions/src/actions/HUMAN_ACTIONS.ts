import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionLaw,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { kickBall } from "../ballStrike/kickBall";
import { carry } from "../carrying/carry";
import { climbLadder } from "../climbing/climbLadder";
import { handToFace } from "../daily/handToFace";
import { dress } from "../dressing/dress";
import { approach } from "../everyday/approach";
import { bend } from "../everyday/bend";
import { brace } from "../everyday/brace";
import { crouch } from "../everyday/crouch";
import { gesture } from "../everyday/gesture";
import { kneel } from "../everyday/kneel";
import { look } from "../everyday/look";
import { rest } from "../everyday/rest";
import { rise } from "../everyday/rise";
import { shift } from "../everyday/shift";
import { sit } from "../everyday/sit";
import { stepOver } from "../everyday/stepOver";
import { typeText } from "../everyday/typeText";
import { dance } from "../exercise/dance";
import { exercise } from "../exercise/exercise";
import { stretch } from "../exercise/stretch";
import { crawl } from "../floor/crawl";
import { getUp } from "../floor/getUp";
import { lieDown } from "../floor/lieDown";
import { clinch } from "../grappling/clinch";
import { handOver } from "../handling/handOver";
import { handshake } from "../handling/handshake";
import { pickUp } from "../handling/pickUp";
import { pushPull } from "../handling/pushPull";
import { putDown } from "../handling/putDown";
import { receive } from "../handling/receive";
import { flinch } from "../reaction/flinch";
import { give } from "../reaction/give";
import { knockdown } from "../reaction/knockdown";
import { perturb } from "../reaction/perturb";
import { stagger } from "../reaction/stagger";
import { athletics } from "../sport/athletics";
import { ballSport } from "../sport/ballSport";
import { baseball } from "../sport/baseball";
import { chiSau } from "../sport/chiSau";
import { gymnastics } from "../sport/gymnastics";
import { martialArt } from "../sport/martialArt";
import { racket } from "../sport/racket";
import { swim } from "../sport/swim";
import { closeStrike } from "../striking/closeStrike";
import { defend } from "../striking/defend";
import { footStrike } from "../striking/footStrike";
import { guard } from "../striking/guard";
import { kick } from "../striking/kick";
import { knee } from "../striking/knee";
import { punch } from "../striking/punch";
import { step } from "../striking/step";
import { useTool } from "../tasks/useTool";
import { wipe } from "../tasks/wipe";
import { climbStairs } from "../terrain/climbStairs";
import { catchObject } from "../throwing/catchObject";
import { release } from "../throwing/release";
import { stageCatch } from "../throwing/stageCatch";
import { throwObject } from "../throwing/throwObject";
import { highFive } from "../touch/highFive";
import { kiss } from "../touch/kiss";
import { selfAction } from "../touch/selfAction";
import { touch } from "../touch/touch";
import { jump } from "./jump";
import { run } from "../gait/internal/run";
import { stand } from "./stand";
import { support } from "./support";
import { walk } from "../gait/internal/walk";

/**
 * Every action law by name: the closed table a performance dispatches through.
 * A law's parameter type is its own; the table erases it to `never` so one
 * table holds every law, and the chain method that names an action is what
 * supplies its parameters.
 */
export const HUMAN_ACTIONS: Readonly<
  Record<AutoMovieMotionHumanActionName, IAutoMovieMotionHumanActionLaw<never>>
> = {
  stand,
  walk,
  run,
  jump,
  approach,
  look,
  gesture,
  rest,
  punch,
  kick,
  guard,
  step,
  defend,
  flinch,
  give,
  stagger,
  knockdown,
  perturb,
  knee,
  closeStrike,
  footStrike,
  sit,
  rise,
  shift,
  handshake,
  pickUp,
  putDown,
  handOver,
  receive,
  bend,
  stepOver,
  brace,
  typeText,
  touch,
  handToFace,
  crouch,
  kneel,
  climbStairs,
  throwObject: throwObject,
  catchObject,
  stageCatch,
  release,
  operate,
  lieDown,
  getUp,
  support,
  crawl,
  climbLadder,
  clinch,
  kickBall,
  useTool,
  wipe,
  dress,
  carry,
  pushPull,
  kiss,
  highFive,
  selfAction,
  exercise,
  stretch,
  dance,
  athletics,
  gymnastics,
  martialArt,
  chiSau,
  ballSport,
  baseball,
  racket,
  swim,
};
