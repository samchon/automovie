import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { pour } from "../affordance/pour";
import { coverFace } from "../daily/coverFace";
import { playWindInstrument } from "../daily/playWindInstrument";
import { wipeTears } from "../daily/wipeTears";
import { tipHat } from "../dressing/tipHat";
import { wardrobe } from "../dressing/wardrobe";
import { crossAnkleOverKnee } from "../everyday/crossAnkleOverKnee";
import { curtsy } from "../everyday/curtsy";
import { headTilt } from "../everyday/headTilt";
import { seatedHeelBounce } from "../everyday/seatedHeelBounce";
import { shiftStandingWeight } from "../everyday/shiftStandingWeight";
import { swipeTouchscreen } from "../everyday/swipeTouchscreen";
import { ropeSkip } from "../exercise/ropeSkip";
import { crabWalk } from "../floor/crabWalk";
import { disarm } from "../grappling/disarm";
import { disarmed } from "../grappling/disarmed";
import { grapple } from "../grappling/grapple";
import { heldHostage } from "../grappling/heldHostage";
import { hostageHold } from "../grappling/hostageHold";
import { button } from "../handling/button";
import { drawFromCarrier } from "../handling/drawFromCarrier";
import { guitarChord } from "../handling/guitarChord";
import { guitarNote } from "../handling/guitarNote";
import { pianoPedal } from "../handling/pianoPedal";
import { pianoPerformance } from "../handling/pianoPerformance";
import { pianoScore } from "../handling/pianoScore";
import { pickUpMoving } from "../handling/pickUpMoving";
import { putDownAperture } from "../handling/putDownAperture";
import { throwPottery } from "../handling/throwPottery";
import { workHeld } from "../handling/workHeld";
import { write } from "../handling/write";
import { zip } from "../handling/zip";
import { bowViolin } from "../music/bowViolin";
import { conduct } from "../music/conduct";
import { collapse } from "../reaction/collapse";
import { stopDropRoll } from "../reaction/stopDropRoll";
import { thrown } from "../reaction/thrown";
import { wireArrest } from "../reaction/wireArrest";
import { wireFlight } from "../reaction/wireFlight";
import { spacecraftGlide } from "../spacecraft/spacecraftGlide";
import { aquatic } from "../sport/aquatic";
import { stickBall } from "../sport/stickBall";
import { swimImmersed } from "../sport/swimImmersed";
import { beatFlames } from "../tasks/beatFlames";
import { cymbalStrike } from "../tasks/cymbalStrike";
import { extinguish } from "../tasks/extinguish";
import { hoseLine } from "../tasks/hoseLine";
import { sideDrumStrike } from "../tasks/sideDrumStrike";
import { stageDeflect } from "../throwing/stageDeflect";
import { lungeGrab } from "../touch/lungeGrab";
import { HumanAidWalk } from "./HumanAidWalk";
import { HumanArchery } from "./HumanArchery";
import { HumanAssistedTransfer } from "./HumanAssistedTransfer";
import { HumanBicycleEffort } from "./HumanBicycleEffort";
import { HumanBikeGuide } from "./HumanBikeGuide";
import { HumanBikeTransfer } from "./HumanBikeTransfer";
import { HumanBlade } from "./HumanBlade";
import { HumanBoard } from "./HumanBoard";
import { HumanBoltAction } from "./HumanBoltAction";
import { HumanCarried } from "./HumanCarried";
import { HumanCarrierCustody } from "./HumanCarrierCustody";
import { HumanClasp } from "./HumanClasp";
import { HumanCover } from "./HumanCover";
import { HumanDanceStyles } from "./HumanDanceStyles";
import { HumanDefence } from "./HumanDefence";
import { HumanDrape } from "./HumanDrape";
import { HumanDressRows } from "./HumanDressRows";
import { HumanDrill } from "./HumanDrill";
import { HumanEdgeRescue } from "./HumanEdgeRescue";
import { HumanEmblem } from "./HumanEmblem";
import { HumanEnvironmentRecovery } from "./HumanEnvironmentRecovery";
import { HumanFirearm } from "./HumanFirearm";
import { HumanFloatBeside } from "./HumanFloatBeside";
import { HumanFloorFall } from "./HumanFloorFall";
import { HumanFloorRoll } from "./HumanFloorRoll";
import { HumanFrailWalk } from "./HumanFrailWalk";
import { HumanGait } from "./HumanGait";
import { HumanGestureRows } from "./HumanGestureRows";
import { HumanGunDrill } from "./HumanGunDrill";
import { HumanGymnastics } from "./HumanGymnastics";
import { HumanHabit } from "./HumanHabit";
import { HumanHandToFaceRows } from "./HumanHandToFaceRows";
import { HumanHandrimStroke } from "./HumanHandrimStroke";
import { HumanHoldHandles } from "./HumanHoldHandles";
import { HumanHorrorGait } from "./HumanHorrorGait";
import { HumanLabour } from "./HumanLabour";
import { HumanLanceCouch } from "./HumanLanceCouch";
import { HumanLasso } from "./HumanLasso";
import { HumanLeadHorse } from "./HumanLeadHorse";
import { HumanLunge } from "./HumanLunge";
import { HumanManipulate } from "./HumanManipulate";
import { HumanMounted } from "./HumanMounted";
import { HumanMusketDrill } from "./HumanMusketDrill";
import { HumanPartner } from "./HumanPartner";
import { HumanPolo } from "./HumanPolo";
import { HumanPose } from "./HumanPose";
import { HumanPrecisionSport } from "./HumanPrecisionSport";
import { HumanPursuit } from "./HumanPursuit";
import { HumanRaceGait } from "./HumanRaceGait";
import { HumanRegrasp } from "./HumanRegrasp";
import { HumanRestRows } from "./HumanRestRows";
import { HumanRevolver } from "./HumanRevolver";
import { HumanRide } from "./HumanRide";
import { HumanRoman } from "./HumanRoman";
import { HumanRope } from "./HumanRope";
import { HumanSabre } from "./HumanSabre";
import { HumanSelfActionRows } from "./HumanSelfActionRows";
import { HumanSittingVolley } from "./HumanSittingVolley";
import { HumanSkydive } from "./HumanSkydive";
import { HumanSocial } from "./HumanSocial";
import { HumanSport } from "./HumanSport";
import { HumanSportCarry } from "./HumanSportCarry";
import { HumanSportGym } from "./HumanSportGym";
import { HumanSportSwing } from "./HumanSportSwing";
import { HumanSportThrow } from "./HumanSportThrow";
import { HumanSportWorkout } from "./HumanSportWorkout";
import { HumanStageFight } from "./HumanStageFight";
import { HumanStageProp } from "./HumanStageProp";
import { HumanStance } from "./HumanStance";
import { HumanStrike } from "./HumanStrike";
import { HumanStuntFall } from "./HumanStuntFall";
import { HumanSupportRows } from "./HumanSupportRows";
import { HumanSurface } from "./HumanSurface";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";
import { HumanSwordParry } from "./HumanSwordParry";
import { HumanSwordThrust } from "./HumanSwordThrust";
import { HumanThrownWeapon } from "./HumanThrownWeapon";
import { HumanToolRows } from "./HumanToolRows";
import { HumanTouchRows } from "./HumanTouchRows";
import { HumanTravelCar } from "./HumanTravelCar";
import { HumanTravelCarExit } from "./HumanTravelCarExit";
import { HumanTravelDoor } from "./HumanTravelDoor";
import { HumanTravelLeaf } from "./HumanTravelLeaf";
import { HumanTraversal } from "./HumanTraversal";
import { HumanTreeClimb } from "./HumanTreeClimb";
import { HumanTrick } from "./HumanTrick";
import { HumanUnseat } from "./HumanUnseat";
import { HumanUpperRows } from "./HumanUpperRows";
import { HumanVehicleHit } from "./HumanVehicleHit";
import { HumanWallRun } from "./HumanWallRun";
import { HumanWeaponFirearm } from "./HumanWeaponFirearm";
import { HumanWeaponMelee } from "./HumanWeaponMelee";
import { stageBladeFootwork } from "./stageBladeFootwork";
import { tuckHair } from "./tuckHair";

/**
 * Sources of named laws for each lexicon family. `HUMAN_LEXICON` reads these
 * records for explicit installation.
 */
export const HUMAN_LEXICON_FAMILIES: IAutoMovieMotionHumanLexiconFamilies = {
  emblem: [HumanEmblem],
  habit: [HumanHabit, { seatedHeelBounce }],
  stance: [HumanStance],
  pose: [HumanPose, { crossAnkleOverKnee, shiftStandingWeight }],
  gait: [
    HumanGait,
    HumanTravelDoor,
    HumanTraversal,
    HumanCover,
    HumanWallRun,
    HumanRope,
    HumanStuntFall,
    HumanTreeClimb,
    HumanSkydive,
    HumanEdgeRescue,
    HumanEnvironmentRecovery,
    HumanTravelCar,
    HumanTravelLeaf,
    HumanTravelCarExit,
    HumanHorrorGait,
    { crabWalk, frailWalk: HumanFrailWalk.frailWalk },
    HumanRaceGait,
  ],
  pursuit: [HumanPursuit],
  social: [HumanSocial, HumanPartner, { curtsy }],
  stageFight: [
    HumanStageFight,
    {
      grapple,
      HumanStageProp,
      lungeGrab,
      disarm,
      disarmed,
      hostageHold,
      heldHostage,
    },
  ],
  drill: [HumanDrill],
  blade: [HumanBlade, { stageBladeFootwork }],
  firearm: [HumanFirearm],
  labour: [HumanLabour],
  ride: [
    HumanRide,
    {
      HumanHandrimStroke,
      HumanBicycleEffort,
      HumanBikeTransfer,
      HumanBikeGuide,
      HumanLeadHorse,
      HumanLunge,
      HumanHoldHandles,
      HumanFloatBeside,
      HumanMounted,
      HumanUnseat,
      HumanPolo,
      HumanBoard,
      HumanClasp,
      HumanDrape,
      HumanTrick,
      HumanRoman,
      HumanLasso,
      HumanSabre,
      HumanLanceCouch,
    },
  ],
  carried: [HumanCarried, { spacecraftGlide }],
  sport: [
    HumanSport,
    HumanDanceStyles,
    HumanSurface,
    { aquatic, HumanSittingVolley, stickBall, swimImmersed },
  ],
  sportGym: [HumanSportGym],
  sportCarry: [HumanSportCarry],
  floorRoll: [HumanFloorRoll],
  floorFall: [
    HumanFloorFall,
    HumanVehicleHit,
    { collapse, thrown, wireFlight, wireArrest, stopDropRoll },
  ],
  support: [HumanSupportRows, { HumanAidWalk, HumanAssistedTransfer }],
  sportSwing: [HumanSportSwing, HumanPrecisionSport],
  sportThrow: [HumanSportThrow, { stageDeflect }],
  sportWorkout: [HumanSportWorkout, { ropeSkip }],
  gymnastics: [HumanGymnastics],
  sword: [HumanSword, HumanSwordGuard, HumanSwordParry, HumanSwordThrust],
  weaponFirearm: [HumanWeaponFirearm],
  weaponMelee: [HumanWeaponMelee],
  manipulate: [
    HumanManipulate,
    {
      write,
      workHeld,
      swipeTouchscreen,
      pour,
      pickUpMoving,
      putDownAperture,
      takeFromCarrier: HumanCarrierCustody,
      drawFromCarrier,
      bowViolin,
      conduct,
      throwPottery,
      extinguish,
      hoseLine,
      beatFlames,
      playWindInstrument,
      guitarNote,
      guitarChord,
      pianoScore,
      pianoPedal,
      pianoPerformance,
      sideDrumStrike,
      cymbalStrike,
    },
  ],
  regrasp: [HumanRegrasp],
  upperPhrase: [HumanUpperRows],
  upperGesture: [HumanGestureRows, { headTilt }],
  upperRest: [HumanRestRows],
  upperTouch: [HumanTouchRows, HumanSelfActionRows, { tuckHair }],
  upperFace: [HumanHandToFaceRows, { coverFace, wipeTears }],
  upperDress: [HumanDressRows, { tipHat, button, zip, wardrobe }],
  upperTool: [HumanToolRows],
  strike: [HumanStrike],
  defence: [HumanDefence],
  thrownWeapon: [HumanThrownWeapon],
  gunDrill: [HumanGunDrill],
  musketDrill: [HumanMusketDrill],
  boltAction: [HumanBoltAction],
  revolver: [HumanRevolver],
  archery: [HumanArchery],
} as const;
