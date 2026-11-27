import * as motions from "@automovie/motions";
import { HumanArmClearance } from "../../../../packages/motions/src/posture/internal/HumanArmClearance";
import { HumanBodyFit } from "../../../../packages/motions/src/posture/internal/HumanBodyFit";
import { HumanFrame } from "../../../../packages/motions/src/posture/internal/HumanFrame";
import { HumanFreedomChoice } from "../../../../packages/motions/src/posture/internal/HumanFreedomChoice";
import { HumanQuadraticProgram } from "../../../../packages/motions/src/posture/internal/HumanQuadraticProgram";
import { HumanFitTargets } from "../../../../packages/motions/src/posture/internal/HumanFitTargets";
import { HumanFitExterior } from "../../../../packages/motions/src/posture/internal/HumanFitExterior";
import { HumanSequentialConvex } from "../../../../packages/motions/src/posture/internal/HumanSequentialConvex";
import { HumanSequentialConvexFunctions } from "../../../../packages/motions/src/posture/internal/HumanSequentialConvexFunctions";
import { HumanPathParameterization } from "../../../../packages/motions/src/posture/internal/HumanPathParameterization";
import { HumanSeidelProgram } from "../../../../packages/motions/src/posture/internal/HumanSeidelProgram";
import { HumanQuinticSegment } from "../../../../packages/motions/src/posture/internal/HumanQuinticSegment";
import { HumanKnot } from "../../../../packages/motions/src/posture/internal/HumanKnot";
import { HumanKnotTiming } from "../../../../packages/motions/src/posture/internal/HumanKnotTiming";
import { HumanTrunkTurn } from "../../../../packages/motions/src/posture/internal/HumanTrunkTurn";
import { HumanLimbFit } from "../../../../packages/motions/src/posture/internal/HumanLimbFit";
import { HumanPosturePreparation } from "../../../../packages/motions/src/posture/internal/HumanPosturePreparation";
import { HumanAuditModel } from "../../../../packages/motions/src/posture/internal/HumanAuditModel";
import { HumanColliders } from "../../../../packages/motions/src/posture/internal/HumanColliders";
import { HumanFoot } from "../../../../packages/motions/src/posture/internal/HumanFoot";
import { HumanHand } from "../../../../packages/motions/src/posture/internal/HumanHand";
import { HumanMinimumJerkSpline } from "../../../../packages/motions/src/posture/internal/HumanMinimumJerkSpline";
import { HumanMersenneTwister } from "../../../../packages/motions/src/posture/internal/HumanMersenneTwister";
import { HumanArmTrajectoryKnots } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectoryKnots";
import { HumanArmTrajectory } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectory";
import { HumanArmSeed } from "../../../../packages/motions/src/posture/internal/HumanArmSeed";
import { HumanArmGeometry } from "../../../../packages/motions/src/posture/internal/HumanArmGeometry";
import { HumanArmTrajectoryModel } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectoryPairs";
import { HumanLimbMirror } from "../../../../packages/motions/src/posture/internal/HumanLimbMirror";
import { HumanRandomSeeds } from "../../../../packages/motions/src/posture/internal/HumanRandomSeeds";
import { HumanPostureRaw } from "../../../../packages/motions/src/posture/internal/HumanPostureRaw";
import { HumanMaterialContact } from "../../../../packages/motions/src/posture/internal/HumanMaterialContact";
import { HumanInteractionMeshLaplacian } from "../../../../packages/motions/src/posture/internal/HumanInteractionMeshLaplacian";
import { HumanFitTargetSlopes } from "../../../../packages/motions/src/posture/internal/HumanFitTargetSlopes";
import { HumanLinkCertificate } from "../../../../packages/motions/src/posture/internal/HumanLinkCertificate";
import { HumanArmConnect } from "../../../../packages/motions/src/posture/internal/HumanArmConnect";
import { HumanArmTrajectorySiteError } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectorySiteError";
import { HumanArmTrajectoryPace } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectoryPace";
import { HumanArmTrajectorySweepBound } from "../../../../packages/motions/src/posture/internal/HumanArmTrajectorySweepBound";
import { HumanBalance } from "../../../../packages/motions/src/everyday/internal/HumanBalance";
import { typeText } from "../../../../packages/motions/src/everyday/internal/typeText";
import { HumanTrunk } from "../../../../packages/motions/src/everyday/internal/HumanTrunk";
import { HumanEffort } from "../../../../packages/motions/src/everyday/internal/HumanEffort";
import { HUMAN_EVERYDAY_LAWS } from "../../../../packages/motions/src/everyday/internal/HUMAN_EVERYDAY_LAWS";
import { curtsy } from "../../../../packages/motions/src/everyday/internal/curtsy";
import { shiftStandingWeight } from "../../../../packages/motions/src/everyday/internal/shiftStandingWeight";
import { bend } from "../../../../packages/motions/src/everyday/internal/bend";
import { rest } from "../../../../packages/motions/src/everyday/internal/rest";
import { crouch } from "../../../../packages/motions/src/everyday/internal/crouch";
import { sit } from "../../../../packages/motions/src/everyday/internal/sit";
import { rise } from "../../../../packages/motions/src/everyday/internal/rise";
import { HumanGaze } from "../../../../packages/motions/src/everyday/internal/HumanGaze";
import { HumanProxemics } from "../../../../packages/motions/src/everyday/internal/HumanProxemics";
import { gesture } from "../../../../packages/motions/src/everyday/internal/gesture";
import { stepOver } from "../../../../packages/motions/src/everyday/internal/stepOver";
import { armPhrase } from "../../../../packages/motions/src/everyday/internal/armPhrase";
import { crossAnkleOverKnee } from "../../../../packages/motions/src/everyday/internal/crossAnkleOverKnee";
import { look } from "../../../../packages/motions/src/everyday/internal/look";
import { seatedHeelBounce } from "../../../../packages/motions/src/everyday/internal/seatedHeelBounce";
import { shift } from "../../../../packages/motions/src/everyday/internal/shift";
import { HumanResponse } from "../../../../packages/motions/src/skill/internal/HumanResponse";
import { HumanSkill } from "../../../../packages/motions/src/skill/internal/HumanSkill";
import { walk } from "../../../../packages/motions/src/gait/internal/walk";
import { stand } from "../../../../packages/motions/src/actions/internal/stand";
import { jump } from "../../../../packages/motions/src/actions/internal/jump";
import { run } from "../../../../packages/motions/src/gait/internal/run";
import { lieOnSurface } from "../../../../packages/motions/src/floor/internal/lieOnSurface";
import { turnOver } from "../../../../packages/motions/src/floor/internal/turnOver";
import { logRoll } from "../../../../packages/motions/src/floor/internal/logRoll";
import { lieDown } from "../../../../packages/motions/src/floor/internal/lieDown";
import { getUp } from "../../../../packages/motions/src/floor/internal/getUp";
import { crawl } from "../../../../packages/motions/src/floor/internal/crawl";
import { lieTogether } from "../../../../packages/motions/src/floor/internal/lieTogether";
import { pullCover } from "../../../../packages/motions/src/floor/internal/pullCover";
import { crabWalk } from "../../../../packages/motions/src/floor/internal/crabWalk";
import { dive } from "../../../../packages/motions/src/floor/internal/dive";
import { roll } from "../../../../packages/motions/src/floor/internal/roll";
import { HumanBase } from "../../../../packages/motions/src/law/internal/HumanBase";
import { HumanBound } from "../../../../packages/motions/src/law/internal/HumanBound";
import { HumanPhysics } from "../../../../packages/motions/src/law/internal/HumanPhysics";
import { HumanContactWindow } from "../../../../packages/motions/src/law/internal/HumanContactWindow";
import { HumanPerception } from "../../../../packages/motions/src/law/internal/HumanPerception";
import { HumanBlast } from "../../../../packages/motions/src/perform/internal/HumanBlast";
import { HumanPerformanceTempo } from "../../../../packages/motions/src/perform/internal/HumanPerformanceTempo";
import { HumanHitTrack } from "../../../../packages/motions/src/perform/internal/HumanHitTrack";
import { HumanPropFlight } from "../../../../packages/motions/src/perform/internal/HumanPropFlight";
import { HumanPropFrame } from "../../../../packages/motions/src/perform/internal/HumanPropFrame";
import { HumanObstacle } from "../../../../packages/motions/src/perform/internal/HumanObstacle";
import { HumanPerformanceLayers } from "../../../../packages/motions/src/perform/internal/HumanPerformanceLayers";
import { HumanPerformanceTether } from "../../../../packages/motions/src/perform/internal/HumanPerformanceTether";
import { HumanSegment } from "../../../../packages/motions/src/perform/internal/HumanSegment";
import { HumanPerformanceHold } from "../../../../packages/motions/src/perform/internal/HumanPerformanceHold";
import { HumanForce } from "../../../../packages/motions/src/perform/internal/HumanForce";
import { HumanLoad } from "../../../../packages/motions/src/perform/internal/HumanLoad";
import { HumanPropDynamics } from "../../../../packages/motions/src/perform/internal/HumanPropDynamics";
import { HumanPropOutcome } from "../../../../packages/motions/src/perform/internal/HumanPropOutcome";
import { HumanWater } from "../../../../packages/motions/src/perform/internal/HumanWater";
import { HumanSegmentSelection } from "../../../../packages/motions/src/perform/internal/HumanSegmentSelection";
import { HumanSegmentStill } from "../../../../packages/motions/src/perform/internal/HumanSegmentStill";
import { HumanPreparedPlayback } from "../../../../packages/motions/src/perform/internal/HumanPreparedPlayback";
import { HumanPerformanceObject } from "../../../../packages/motions/src/perform/internal/HumanPerformanceObject";
import { HumanSegmentLegs } from "../../../../packages/motions/src/perform/internal/HumanSegmentLegs";
import { HumanSegmentStop } from "../../../../packages/motions/src/perform/internal/HumanSegmentStop";
import { HumanSegmentEntry } from "../../../../packages/motions/src/perform/internal/HumanSegmentEntry";
import { HumanSegmentCut } from "../../../../packages/motions/src/perform/internal/HumanSegmentCut";
import { HumanPerformanceContactSpeed } from "../../../../packages/motions/src/perform/internal/HumanPerformanceContactSpeed";
import { HumanPropHold } from "../../../../packages/motions/src/perform/internal/HumanPropHold";
import { HumanPropSweepColliders } from "../../../../packages/motions/src/perform/internal/HumanPropSweepColliders";
import { HumanPerformanceRead } from "../../../../packages/motions/src/perform/internal/HumanPerformanceRead";
import { HumanPropSweepHands } from "../../../../packages/motions/src/perform/internal/HumanPropSweepHands";
import { HumanPropCatchHands } from "../../../../packages/motions/src/perform/internal/HumanPropCatchHands";
import { HumanPerformanceAim } from "../../../../packages/motions/src/perform/internal/HumanPerformanceAim";
import { HumanPerformanceMeeting } from "../../../../packages/motions/src/perform/internal/HumanPerformanceMeeting";
import { HumanPerformanceAhead } from "../../../../packages/motions/src/perform/internal/HumanPerformanceAhead";
import { HumanPerformanceContacts } from "../../../../packages/motions/src/perform/internal/HumanPerformanceContacts";
import { HumanAffect } from "../../../../packages/motions/src/perform/expression/HumanAffect";
import { HumanBreath } from "../../../../packages/motions/src/perform/expression/HumanBreath";
import { HumanSeatedReach } from "../../../../packages/motions/src/touch/internal/HumanSeatedReach";
import { headRest } from "../../../../packages/motions/src/touch/internal/headRest";
import { embraceFromBehind } from "../../../../packages/motions/src/touch/internal/embraceFromBehind";
import { backToBack } from "../../../../packages/motions/src/touch/internal/backToBack";
import { sitOnLap } from "../../../../packages/motions/src/touch/internal/sitOnLap";
import { touch } from "../../../../packages/motions/src/touch/internal/touch";
import { selfAction } from "../../../../packages/motions/src/touch/internal/selfAction";
import { kiss } from "../../../../packages/motions/src/touch/internal/kiss";
import { highFive } from "../../../../packages/motions/src/touch/internal/highFive";
import { lungeGrab } from "../../../../packages/motions/src/touch/internal/lungeGrab";
import { legTouch } from "../../../../packages/motions/src/touch/internal/legTouch";
import { armWrestle } from "../../../../packages/motions/src/touch/internal/armWrestle";
import { HumanHabit } from "../../../../packages/motions/src/lexicon/internal/HumanHabit";
import { HumanSocial } from "../../../../packages/motions/src/lexicon/internal/HumanSocial";
import { HumanPartner } from "../../../../packages/motions/src/lexicon/internal/HumanPartner";
import { hug } from "../../../../packages/motions/src/lexicon/internal/hug";
import { shoulderClasp } from "../../../../packages/motions/src/lexicon/internal/shoulderClasp";
import { HumanSportCarry } from "../../../../packages/motions/src/lexicon/internal/HumanSportCarry";
import { HumanSportThrow } from "../../../../packages/motions/src/lexicon/internal/HumanSportThrow";
import { HumanFloorRoll } from "../../../../packages/motions/src/lexicon/internal/HumanFloorRoll";
import { HumanStance } from "../../../../packages/motions/src/lexicon/internal/HumanStance";
import { HumanPose } from "../../../../packages/motions/src/lexicon/internal/HumanPose";
import { HUMAN_LEXICON } from "../../../../packages/motions/src/lexicon/internal/HUMAN_LEXICON";
import { HumanSport } from "../../../../packages/motions/src/lexicon/internal/HumanSport";
import { HumanRestRows } from "../../../../packages/motions/src/lexicon/internal/HumanRestRows";
import { HumanTouchRows } from "../../../../packages/motions/src/lexicon/internal/HumanTouchRows";
import { HumanTabletop } from "../../../../packages/motions/src/lexicon/internal/HumanTabletop";
import { HumanMountOffSupports } from "../../../../packages/motions/src/lexicon/internal/HumanMountOffSupports";
import { HumanPursuit } from "../../../../packages/motions/src/lexicon/internal/HumanPursuit";
import { HumanMountedWhip } from "../../../../packages/motions/src/lexicon/internal/HumanMountedWhip";
import { HumanMountedStirrups } from "../../../../packages/motions/src/lexicon/internal/HumanMountedStirrups";
import { HumanBikeGuidePath } from "../../../../packages/motions/src/lexicon/internal/HumanBikeGuidePath";
import { HumanGait } from "../../../../packages/motions/src/lexicon/internal/HumanGait";
import { HumanCrutchWalk } from "../../../../packages/motions/src/lexicon/internal/HumanCrutchWalk";
import { HumanCrutchSit } from "../../../../packages/motions/src/lexicon/internal/HumanCrutchSit";
import { HumanSwordTiming } from "../../../../packages/motions/src/lexicon/internal/HumanSwordTiming";
import { HumanLungePivot } from "../../../../packages/motions/src/lexicon/internal/HumanLungePivot";
import { HumanSabreForm } from "../../../../packages/motions/src/lexicon/internal/HumanSabreForm";
import { HumanRide } from "../../../../packages/motions/src/lexicon/internal/HumanRide";
import { chiSau } from "../../../../packages/motions/src/sport/internal/chiSau";
import { aquatic } from "../../../../packages/motions/src/sport/internal/aquatic";
import { athletics } from "../../../../packages/motions/src/sport/internal/athletics";
import { cartwheel } from "../../../../packages/motions/src/sport/internal/cartwheel";
import { gymnastics } from "../../../../packages/motions/src/sport/internal/gymnastics";
import { handspring } from "../../../../packages/motions/src/sport/internal/handspring";
import { HumanBallPlay } from "../../../../packages/motions/src/sport/internal/HumanBallPlay";
import { martialArt } from "../../../../packages/motions/src/sport/internal/martialArt";
import { roundOff } from "../../../../packages/motions/src/sport/internal/roundOff";
import { salto } from "../../../../packages/motions/src/sport/internal/salto";
import { swim } from "../../../../packages/motions/src/sport/internal/swim";
import { squatVault } from "../../../../packages/motions/src/sport/internal/squatVault";
import { AutoMovieMotionHumanBaseball } from "../../../../packages/motions/src/sport/internal/AutoMovieMotionHumanBaseball";
import { stretch } from "../../../../packages/motions/src/exercise/internal/stretch";
import { dance } from "../../../../packages/motions/src/exercise/internal/dance";
import { tapDance } from "../../../../packages/motions/src/exercise/internal/tapDance";
import { streetDance } from "../../../../packages/motions/src/exercise/internal/streetDance";
import { balletStep } from "../../../../packages/motions/src/exercise/internal/balletStep";
import { workout } from "../../../../packages/motions/src/exercise/internal/workout";
import { lineWalk } from "../../../../packages/motions/src/exercise/internal/lineWalk";
import { groupDance } from "../../../../packages/motions/src/exercise/internal/groupDance";
import { stiltWalk } from "../../../../packages/motions/src/exercise/internal/stiltWalk";
import { trampolineBounce } from "../../../../packages/motions/src/exercise/internal/trampolineBounce";
import { carry } from "../../../../packages/motions/src/carrying/internal/carry";
import { coverFace } from "../../../../packages/motions/src/daily/internal/coverFace";
import { wipeTears } from "../../../../packages/motions/src/daily/internal/wipeTears";
import { playWindInstrument } from "../../../../packages/motions/src/daily/internal/playWindInstrument";
import { climbStairs } from "../../../../packages/motions/src/terrain/internal/climbStairs";
import { HumanAttribute } from "../../../../packages/motions/src/ensemble/internal/HumanAttribute";
import { HumanCrowd } from "../../../../packages/motions/src/ensemble/internal/HumanCrowd";
import { HumanFormationPath } from "../../../../packages/motions/src/ensemble/internal/HumanFormationPath";
import { instance } from "../../../../packages/motions/src/ensemble/internal/instance";
import { HumanSupportAim } from "../../../../packages/motions/src/carrier/internal/HumanSupportAim";
import { HumanSupportStepPlants } from "../../../../packages/motions/src/carrier/internal/HumanSupportStepPlants";
import { HumanSurfaceGlide } from "../../../../packages/motions/src/carrier/internal/HumanSurfaceGlide";
import { HumanIceGlide } from "../../../../packages/motions/src/carrier/internal/HumanIceGlide";
import { HumanForceDrawn } from "../../../../packages/motions/src/grappling/internal/HumanForceDrawn";
import { clinch } from "../../../../packages/motions/src/grappling/internal/clinch";
import { grapple } from "../../../../packages/motions/src/grappling/internal/grapple";
import { HumanForceExchange } from "../../../../packages/motions/src/grappling/internal/HumanForceExchange";
import { HumanForceThrow } from "../../../../packages/motions/src/grappling/internal/HumanForceThrow";
import { HumanForceTrunk } from "../../../../packages/motions/src/grappling/internal/HumanForceTrunk";
import { kuzushi } from "../../../../packages/motions/src/grappling/internal/kuzushi";
import { disarm } from "../../../../packages/motions/src/grappling/internal/disarm";
import { disarmed } from "../../../../packages/motions/src/grappling/internal/disarmed";
import { step } from "../../../../packages/motions/src/striking/internal/step";
import { closeStrike } from "../../../../packages/motions/src/striking/internal/closeStrike";
import { defend } from "../../../../packages/motions/src/striking/internal/defend";
import { knockdown } from "../../../../packages/motions/src/reaction/internal/knockdown";
import { flinch } from "../../../../packages/motions/src/reaction/internal/flinch";
import { give } from "../../../../packages/motions/src/reaction/internal/give";
import { thrown } from "../../../../packages/motions/src/reaction/internal/thrown";
import { perturb } from "../../../../packages/motions/src/reaction/internal/perturb";
import { wireArrest } from "../../../../packages/motions/src/reaction/internal/wireArrest";
import { wireFlight } from "../../../../packages/motions/src/reaction/internal/wireFlight";
import { wipe } from "../../../../packages/motions/src/tasks/internal/wipe";
import { release } from "../../../../packages/motions/src/throwing/internal/release";
import { pickUp } from "../../../../packages/motions/src/handling/internal/pickUp";
import { HumanPrehension } from "../../../../packages/motions/src/handling/internal/HumanPrehension";
import { HumanGrip } from "../../../../packages/motions/src/handling/internal/HumanGrip";
import { HumanClaspClearance } from "../../../../packages/motions/src/handling/internal/HumanClaspClearance";
import { HumanHandoverUpright } from "../../../../packages/motions/src/handling/internal/HumanHandoverUpright";
import { HumanPocket } from "../../../../packages/motions/src/handling/internal/HumanPocket";
import { putDown } from "../../../../packages/motions/src/handling/internal/putDown";
import { pianoScore } from "../../../../packages/motions/src/handling/internal/pianoScore";
import { guitarNote } from "../../../../packages/motions/src/handling/internal/guitarNote";
import { pushPull } from "../../../../packages/motions/src/handling/internal/pushPull";
import { button } from "../../../../packages/motions/src/handling/internal/button";
import { zip } from "../../../../packages/motions/src/handling/internal/zip";
import { write } from "../../../../packages/motions/src/handling/internal/write";
import { handOver } from "../../../../packages/motions/src/handling/internal/handOver";
import { receive } from "../../../../packages/motions/src/handling/internal/receive";
import { HumanClasp } from "../../../../packages/motions/src/handling/internal/HumanClasp";
import { HumanWorn } from "../../../../packages/motions/src/dressing/internal/HumanWorn";
import { presentHand } from "../../../../packages/motions/src/dressing/internal/presentHand";
import { HumanWornItem } from "../../../../packages/motions/src/dressing/internal/HumanWornItem";
import { wardrobe } from "../../../../packages/motions/src/dressing/internal/wardrobe";
import { tipHat } from "../../../../packages/motions/src/dressing/internal/tipHat";
import { slipRing } from "../../../../packages/motions/src/dressing/internal/slipRing";
import { placeOverHead } from "../../../../packages/motions/src/dressing/internal/placeOverHead";
import { coatPartner } from "../../../../packages/motions/src/dressing/internal/coatPartner";
import { dressPartner } from "../../../../packages/motions/src/dressing/internal/dressPartner";
import { bindPartner } from "../../../../packages/motions/src/dressing/internal/bindPartner";
import { dress } from "../../../../packages/motions/src/dressing/internal/dress";
import { kickBall } from "../../../../packages/motions/src/ballStrike/internal/kickBall";
import { conduct } from "../../../../packages/motions/src/music/internal/conduct";
import { bowViolin } from "../../../../packages/motions/src/music/internal/bowViolin";

interface ILaw { name: string; plan?: unknown; }
interface IMutual { name: string; roles: readonly string[]; act(role: string, params: object, cast: Readonly<Record<string, string>>): { name: string }; }
interface IMutualExport { record: IMutual; expression: string; }

const PRIVATE: Readonly<Record<string, unknown>> = {
  HumanArmClearance,
  HumanBodyFit,
  HumanFrame,
  HumanFreedomChoice,
  HumanQuadraticProgram,
  HumanFitTargets,
  HumanFitExterior,
  HumanSequentialConvex,
  HumanSequentialConvexFunctions,
  HumanPathParameterization,
  HumanSeidelProgram,
  HumanQuinticSegment,
  HumanKnot,
  HumanKnotTiming,
  HumanTrunkTurn,
  HumanLimbFit,
  HumanPosturePreparation,
  HumanAuditModel,
  HumanColliders,
  HumanFoot,
  HumanHand,
  HumanMinimumJerkSpline,
  HumanMersenneTwister,
  HumanArmTrajectoryKnots,
  HumanArmTrajectory,
  HumanArmSeed,
  HumanArmGeometry,
  HumanArmTrajectoryModel,
  HumanArmTrajectoryPairs,
  HumanLimbMirror,
  HumanRandomSeeds,
  HumanPostureRaw,
  HumanMaterialContact,
  HumanInteractionMeshLaplacian,
  HumanFitTargetSlopes,
  HumanLinkCertificate,
  HumanArmConnect,
  HumanArmTrajectorySiteError,
  HumanArmTrajectoryPace,
  HumanArmTrajectorySweepBound,
  HumanBalance,
  typeText,
  HumanTrunk,
  HumanEffort,
  HUMAN_EVERYDAY_LAWS,
  curtsy,
  shiftStandingWeight,
  bend,
  rest,
  crouch,
  sit,
  rise,
  HumanGaze,
  HumanProxemics,
  gesture,
  stepOver,
  armPhrase,
  crossAnkleOverKnee,
  look,
  seatedHeelBounce,
  shift,
  HumanResponse,
  HumanSkill,
  walk,
  stand,
  jump,
  run,
  lieOnSurface,
  turnOver,
  logRoll,
  lieDown,
  getUp,
  crawl,
  lieTogether,
  pullCover,
  crabWalk,
  dive,
  roll,
  HumanBase,
  HumanBound,
  HumanPhysics,
  HumanContactWindow,
  HumanPerception,
  HumanBlast,
  HumanPerformanceTempo,
  HumanHitTrack,
  HumanPropFlight,
  HumanPropFrame,
  HumanObstacle,
  HumanPerformanceLayers,
  HumanPerformanceTether,
  HumanSegment,
  HumanPerformanceHold,
  HumanForce,
  HumanLoad,
  HumanPropDynamics,
  HumanPropOutcome,
  HumanWater,
  HumanSegmentSelection,
  HumanSegmentStill,
  HumanPreparedPlayback,
  HumanPerformanceObject,
  HumanSegmentLegs,
  HumanSegmentStop,
  HumanSegmentEntry,
  HumanSegmentCut,
  HumanPerformanceContactSpeed,
  HumanPropHold,
  HumanPropSweepColliders,
  HumanPerformanceRead,
  HumanPropSweepHands,
  HumanPropCatchHands,
  HumanPerformanceAim,
  HumanPerformanceMeeting,
  HumanPerformanceAhead,
  HumanPerformanceContacts,
  HumanAffect,
  HumanBreath,
  HumanSeatedReach,
  headRest,
  embraceFromBehind,
  backToBack,
  sitOnLap,
  touch,
  selfAction,
  kiss,
  highFive,
  lungeGrab,
  legTouch,
  armWrestle,
  HumanHabit,
  HumanSocial,
  HumanPartner,
  hug,
  shoulderClasp,
  HumanSportCarry,
  HumanSportThrow,
  HumanFloorRoll,
  HumanStance,
  HumanPose,
  HUMAN_LEXICON,
  HumanSport,
  HumanRestRows,
  HumanTouchRows,
  HumanTabletop,
  HumanMountOffSupports,
  HumanPursuit,
  HumanMountedWhip,
  HumanMountedStirrups,
  HumanBikeGuidePath,
  HumanGait,
  HumanCrutchWalk,
  HumanCrutchSit,
  HumanSwordTiming,
  HumanLungePivot,
  HumanSabreForm,
  HumanRide,
  chiSau,
  aquatic,
  athletics,
  cartwheel,
  gymnastics,
  handspring,
  HumanBallPlay,
  martialArt,
  roundOff,
  salto,
  swim,
  squatVault,
  AutoMovieMotionHumanBaseball,
  stretch,
  dance,
  tapDance,
  streetDance,
  balletStep,
  workout,
  lineWalk,
  groupDance,
  stiltWalk,
  trampolineBounce,
  carry,
  coverFace,
  wipeTears,
  playWindInstrument,
  climbStairs,
  HumanAttribute,
  HumanCrowd,
  HumanFormationPath,
  instance,
  HumanSupportAim,
  HumanSupportStepPlants,
  HumanSurfaceGlide,
  HumanIceGlide,
  HumanForceDrawn,
  clinch,
  grapple,
  HumanForceExchange,
  HumanForceThrow,
  HumanForceTrunk,
  kuzushi,
  disarm,
  disarmed,
  step,
  closeStrike,
  defend,
  knockdown,
  flinch,
  give,
  thrown,
  perturb,
  wireArrest,
  wireFlight,
  wipe,
  release,
  pickUp,
  HumanPrehension,
  HumanGrip,
  HumanClaspClearance,
  HumanHandoverUpright,
  HumanPocket,
  putDown,
  pianoScore,
  guitarNote,
  pushPull,
  button,
  zip,
  write,
  handOver,
  receive,
  HumanClasp,
  HumanWorn,
  presentHand,
  HumanWornItem,
  wardrobe,
  tipHat,
  slipRing,
  placeOverHead,
  coatPartner,
  dressPartner,
  bindPartner,
  dress,
  kickBall,
  conduct,
  bowViolin,
};
const EXPORTS: Readonly<Record<string, unknown>> = {
  ...(motions as Readonly<Record<string, unknown>>),
  ...PRIVATE,
};
const lexiconValue: unknown = EXPORTS["HUMAN_LEXICON"];
const namespaceByLaw: Map<unknown, string> = new Map();
for (const [key, value] of Object.entries(EXPORTS)) {
  if (!/^Human[A-Z]/.test(key) || typeof value !== "object" || value === null) continue;
  for (const law of Object.values(value)) {
    if (!namespaceByLaw.has(law)) namespaceByLaw.set(law, key);
  }
}

export namespace MotionInventory {
  export function lexicon(): Record<string, ILaw[]> {
    return typeof lexiconValue === "object" && lexiconValue !== null
      ? (lexiconValue as Record<string, ILaw[]>)
      : {};
  }

  export function namespace(law: unknown): string | null {
    return namespaceByLaw.get(law) ?? null;
  }

  export function exported(): Map<string, ILaw> {
    const found = new Map<string, ILaw>();
    for (const value of Object.values(EXPORTS)) {
      if (typeof value !== "object" || value === null) continue;
      const law = value as ILaw;
      if (typeof law.name === "string" && typeof law.plan === "function") found.set(law.name, law);
    }
    return found;
  }

  export function mutualExports(): Record<string, IMutualExport> {
    const chain = motions.AutoMovieMotionHumanChain as unknown as Record<string, unknown>;
    const join: unknown = chain["mutual"];
    if (typeof join !== "function") return {};

    const found: Record<string, IMutualExport> = {};
    const register = (value: unknown, expression: string): void => {
      if (typeof value !== "object" || value === null) return;
      const record = value as IMutual;
      if (typeof record.name !== "string" || !Array.isArray(record.roles) || typeof record.act !== "function") return;
      found[record.name] = { record, expression };
    };

    for (const [key, space] of Object.entries(EXPORTS)) {
      if (typeof space !== "object" || space === null) continue;
      register(space, key);
      for (const [member, value] of Object.entries(space)) {
        register(value, key + "." + member);
        if (typeof value !== "object" || value === null) continue;
        for (const [inner, nested] of Object.entries(value)) register(nested, key + "." + member + "." + inner);
      }
    }
    return found;
  }

  export function rows(): Record<string, string> {
    const found: Record<string, string> = {};
    for (const [key, value] of Object.entries(EXPORTS)) {
      if (typeof value !== "object" || value === null) continue;
      const direct = value as ILaw;
      if (typeof direct.name === "string" && typeof direct.plan === "function") {
        found[direct.name] ??= key;
        continue;
      }
      for (const [member, inner] of Object.entries(value)) {
        if (typeof inner !== "object" || inner === null) continue;
        const law = inner as ILaw;
        if (typeof law.name === "string" && typeof law.plan === "function") found[law.name] ??= key + "." + member;
      }
    }
    return found;
  }
}
