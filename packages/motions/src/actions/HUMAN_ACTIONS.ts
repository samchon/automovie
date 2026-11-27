import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionLaw,
} from "@automovie/interface";

import { operate } from "../affordance/internal/operate";
import { kickBall } from "../ballStrike/internal/kickBall";
import { carry } from "../carrying/internal/carry";
import { climbLadder } from "../climbing/internal/climbLadder";
import { handToFace } from "../daily/internal/handToFace";
import { dress } from "../dressing/internal/dress";
import { approach } from "../everyday/internal/approach";
import { bend } from "../everyday/internal/bend";
import { brace } from "../everyday/internal/brace";
import { crouch } from "../everyday/internal/crouch";
import { gesture } from "../everyday/internal/gesture";
import { kneel } from "../everyday/internal/kneel";
import { look } from "../everyday/internal/look";
import { rest } from "../everyday/internal/rest";
import { rise } from "../everyday/internal/rise";
import { shift } from "../everyday/internal/shift";
import { sit } from "../everyday/internal/sit";
import { stepOver } from "../everyday/internal/stepOver";
import { typeText } from "../everyday/internal/typeText";
import { dance } from "../exercise/internal/dance";
import { exercise } from "../exercise/internal/exercise";
import { stretch } from "../exercise/internal/stretch";
import { crawl } from "../floor/internal/crawl";
import { getUp } from "../floor/internal/getUp";
import { lieDown } from "../floor/internal/lieDown";
import { clinch } from "../grappling/internal/clinch";
import { handOver } from "../handling/internal/handOver";
import { handshake } from "../handling/internal/handshake";
import { pickUp } from "../handling/internal/pickUp";
import { pushPull } from "../handling/internal/pushPull";
import { putDown } from "../handling/internal/putDown";
import { receive } from "../handling/internal/receive";
import { flinch } from "../reaction/internal/flinch";
import { give } from "../reaction/internal/give";
import { knockdown } from "../reaction/internal/knockdown";
import { perturb } from "../reaction/internal/perturb";
import { stagger } from "../reaction/internal/stagger";
import { athletics } from "../sport/internal/athletics";
import { ballSport } from "../sport/internal/ballSport";
import { AutoMovieMotionHumanBaseball as baseball } from "../sport/AutoMovieMotionHumanBaseball";
import { chiSau } from "../sport/internal/chiSau";
import { gymnastics } from "../sport/internal/gymnastics";
import { martialArt } from "../sport/internal/martialArt";
import { AutoMovieMotionHumanRacket as racket } from "../sport/AutoMovieMotionHumanRacket";
import { swim } from "../sport/swim";
import { closeStrike } from "../striking/internal/closeStrike";
import { defend } from "../striking/internal/defend";
import { footStrike } from "../striking/internal/footStrike";
import { guard } from "../striking/internal/guard";
import { kick } from "../striking/internal/kick";
import { knee } from "../striking/internal/knee";
import { punch } from "../striking/internal/punch";
import { step } from "../striking/internal/step";
import { useTool } from "../tasks/internal/useTool";
import { wipe } from "../tasks/internal/wipe";
import { climbStairs } from "../terrain/internal/climbStairs";
import { catchObject } from "../throwing/internal/catchObject";
import { release } from "../throwing/internal/release";
import { stageCatch } from "../throwing/internal/stageCatch";
import { throwObject } from "../throwing/internal/throwObject";
import { highFive } from "../touch/internal/highFive";
import { kiss } from "../touch/internal/kiss";
import { selfAction } from "../touch/internal/selfAction";
import { touch } from "../touch/internal/touch";
import { jump } from "./internal/jump";
import { run } from "../gait/internal/run";
import { stand } from "./internal/stand";
import { support } from "./internal/support";
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
