import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { pour } from "../affordance/pour";
import { coverFace } from "../daily/coverFace";
import { playWindInstrument } from "../daily/playWindInstrument";
import { wipeTears } from "../daily/wipeTears";
import { tipHat } from "../dressing/tipHat";
import { crossAnkleOverKnee } from "../everyday/crossAnkleOverKnee";
import { curtsy } from "../everyday/curtsy";
import { headTilt } from "../everyday/headTilt";
import { seatedHeelBounce } from "../everyday/seatedHeelBounce";
import { shiftStandingWeight } from "../everyday/shiftStandingWeight";
import { swipeTouchscreen } from "../everyday/swipeTouchscreen";
import { ropeSkip } from "../exercise/ropeSkip";
import { grapple } from "../grappling/grapple";
import { button } from "../handling/button";
import { drawFromCarrier } from "../handling/drawFromCarrier";
import { collapse } from "../reaction/collapse";
import { thrown } from "../reaction/thrown";
import { wireFlight } from "../reaction/wireFlight";
import { guitarChord } from "../handling/guitarChord";
import { guitarNote } from "../handling/guitarNote";
import { pianoPedal } from "../handling/pianoPedal";
import { pianoPerformance } from "../handling/pianoPerformance";
import { pianoScore } from "../handling/pianoScore";
import { pickUpMoving } from "../handling/pickUpMoving";
import { putDownAperture } from "../handling/putDownAperture";
import { write } from "../handling/write";
import { workHeld } from "../handling/workHeld";
import { zip } from "../handling/zip";
import { bowViolin } from "../music/bowViolin";
import { conduct } from "../music/conduct";
import { throwPottery } from "../handling/throwPottery";
import { spacecraftGlide } from "../spacecraft/spacecraftGlide";
import { aquatic } from "../sport/aquatic";
import { stickBall } from "../sport/stickBall";
import { swimImmersed } from "../sport/swimImmersed";
import { cymbalStrike } from "../tasks/cymbalStrike";
import { sideDrumStrike } from "../tasks/sideDrumStrike";
import { stageCatch } from "../throwing/stageCatch";
import { stageDeflect } from "../throwing/stageDeflect";
import { HumanArchery } from "./HumanArchery";
import { HumanBicycleEffort } from "./HumanBicycleEffort";
import { HumanBikeGuide } from "./HumanBikeGuide";
import { HumanBikeTransfer } from "./HumanBikeTransfer";
import { HumanBlade } from "./HumanBlade";
import { HumanBoltAction } from "./HumanBoltAction";
import { HumanCarried } from "./HumanCarried";
import { HumanCarrierCustody } from "./HumanCarrierCustody";
import { HumanHorrorGait } from "./HumanHorrorGait";
import { HumanRaceGait } from "./HumanRaceGait";
import { HumanDefence } from "./HumanDefence";
import { HumanDressRows } from "./HumanDressRows";
import { HumanDrill } from "./HumanDrill";
import { HumanEmblem } from "./HumanEmblem";
import { HumanEnvironmentRecovery } from "./HumanEnvironmentRecovery";
import { HumanFirearm } from "./HumanFirearm";
import { HumanFloorFall } from "./HumanFloorFall";
import { HumanFloorRoll } from "./HumanFloorRoll";
import { HumanGait } from "./HumanGait";
import { HumanGestureRows } from "./HumanGestureRows";
import { HumanGunDrill } from "./HumanGunDrill";
import { HumanGymnastics } from "./HumanGymnastics";
import { HumanHabit } from "./HumanHabit";
import { HumanHandToFaceRows } from "./HumanHandToFaceRows";
import { HumanHandrimStroke } from "./HumanHandrimStroke";
import { HumanLabour } from "./HumanLabour";
import { HumanFloatBeside } from "./HumanFloatBeside";
import { HumanHoldHandles } from "./HumanHoldHandles";
import { HumanLeadHorse } from "./HumanLeadHorse";
import { HumanManipulate } from "./HumanManipulate";
import { HumanMounted } from "./HumanMounted";
import { HumanUnseat } from "./HumanUnseat";
import { HumanPolo } from "./HumanPolo";
import { HumanBoard } from "./HumanBoard";
import { HumanClasp } from "./HumanClasp";
import { HumanDrape } from "./HumanDrape";
import { HumanTrick } from "./HumanTrick";
import { HumanRoman } from "./HumanRoman";
import { HumanLasso } from "./HumanLasso";
import { HumanMusketDrill } from "./HumanMusketDrill";
import { HumanPartner } from "./HumanPartner";
import { HumanPose } from "./HumanPose";
import { HumanPrecisionSport } from "./HumanPrecisionSport";
import { HumanPursuit } from "./HumanPursuit";
import { HumanRegrasp } from "./HumanRegrasp";
import { HumanRestRows } from "./HumanRestRows";
import { HumanRevolver } from "./HumanRevolver";
import { HumanRide } from "./HumanRide";
import { HumanSelfActionRows } from "./HumanSelfActionRows";
import { HumanSittingVolley } from "./HumanSittingVolley";
import { HumanSocial } from "./HumanSocial";
import { HumanDanceStyles } from "./HumanDanceStyles";
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
import { HumanCover } from "./HumanCover";
import { HumanWallRun } from "./HumanWallRun";
import { HumanRope } from "./HumanRope";
import { HumanStuntFall } from "./HumanStuntFall";
import { HumanTreeClimb } from "./HumanTreeClimb";
import { HumanSkydive } from "./HumanSkydive";
import { HumanUpperRows } from "./HumanUpperRows";
import { HumanWeaponFirearm } from "./HumanWeaponFirearm";
import { HumanWeaponMelee } from "./HumanWeaponMelee";
import { stageBladeFootwork } from "./stageBladeFootwork";
import { tuckHair } from "./tuckHair";

/**
 * Sources of named laws for each lexicon family. `HUMAN_LEXICON` reads
 * these records for explicit installation. Schema generation pairs each
 * law's registered name with its parameters from the canonical family map.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds and the two readers that derive from it.
 * @evidence contracts/development/design.md#principled-representation One readonly list of sources per family. Each source exposes existing typed law records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family table; the families own their rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Standalone laws and row namespaces retain their canonical export and registration names.
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
    HumanEnvironmentRecovery,
    HumanTravelCar,
    HumanTravelLeaf,
    HumanTravelCarExit,
    HumanHorrorGait,
    HumanRaceGait,
  ],
  pursuit: [HumanPursuit],
  social: [HumanSocial, HumanPartner, { curtsy }],
  stageFight: [HumanStageFight, { grapple, HumanStageProp }],
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
  floorFall: [HumanFloorFall, { collapse, thrown, wireFlight }],
  support: [HumanSupportRows],
  sportSwing: [HumanSportSwing, HumanPrecisionSport],
  sportThrow: [HumanSportThrow, { stageCatch, stageDeflect }],
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
  upperDress: [HumanDressRows, { tipHat, button, zip }],
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
