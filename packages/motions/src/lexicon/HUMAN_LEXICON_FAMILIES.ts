import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { HumanArchery } from "./HumanArchery";
import { HumanBlade } from "./HumanBlade";
import { HumanBoltAction } from "./HumanBoltAction";
import { HumanCarried } from "./HumanCarried";
import { HumanDefence } from "./HumanDefence";
import { HumanDressRows } from "./HumanDressRows";
import { HumanDrill } from "./HumanDrill";
import { HumanEmblem } from "./HumanEmblem";
import { HumanFirearm } from "./HumanFirearm";
import { HumanFloorFall } from "./HumanFloorFall";
import { HumanFloorRoll } from "./HumanFloorRoll";
import { HumanGait } from "./HumanGait";
import { HumanGestureRows } from "./HumanGestureRows";
import { HumanGunDrill } from "./HumanGunDrill";
import { HumanGymnastics } from "./HumanGymnastics";
import { HumanHabit } from "./HumanHabit";
import { HumanHandToFaceRows } from "./HumanHandToFaceRows";
import { HumanLabour } from "./HumanLabour";
import { HumanManipulate } from "./HumanManipulate";
import { HumanMusketDrill } from "./HumanMusketDrill";
import { HumanPartner } from "./HumanPartner";
import { HumanPose } from "./HumanPose";
import { HumanPursuit } from "./HumanPursuit";
import { HumanRegrasp } from "./HumanRegrasp";
import { HumanRestRows } from "./HumanRestRows";
import { HumanRevolver } from "./HumanRevolver";
import { HumanRide } from "./HumanRide";
import { HumanSelfActionRows } from "./HumanSelfActionRows";
import { HumanSocial } from "./HumanSocial";
import { HumanSport } from "./HumanSport";
import { HumanSportCarry } from "./HumanSportCarry";
import { HumanSportGym } from "./HumanSportGym";
import { HumanSportSwing } from "./HumanSportSwing";
import { HumanSportThrow } from "./HumanSportThrow";
import { HumanSportWorkout } from "./HumanSportWorkout";
import { HumanStageFight } from "./HumanStageFight";
import { HumanStance } from "./HumanStance";
import { HumanStrike } from "./HumanStrike";
import { HumanSupportRows } from "./HumanSupportRows";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";
import { HumanSwordParry } from "./HumanSwordParry";
import { HumanSwordThrust } from "./HumanSwordThrust";
import { HumanThrownWeapon } from "./HumanThrownWeapon";
import { HumanToolRows } from "./HumanToolRows";
import { HumanTouchRows } from "./HumanTouchRows";
import { HumanTravelCar } from "./HumanTravelCar";
import { HumanTravelDoor } from "./HumanTravelDoor";
import { HumanTravelLeaf } from "./HumanTravelLeaf";
import { HumanUpperRows } from "./HumanUpperRows";
import { HumanWeaponFirearm } from "./HumanWeaponFirearm";
import { HumanWeaponMelee } from "./HumanWeaponMelee";

/**
 * The namespaces each family of the lexicon is read from, in order, with
 * their types kept: `HUMAN_LEXICON` lists their laws as data, and the
 * lexicon's parameter schemas are derived from these same types
 * (`HUMAN_LEXICON_SCHEMAS`), so the two cannot name different rows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds and the two readers that derive from it.
 * @evidence contracts/development/design.md#principled-representation One readonly tuple of namespaces per family, `as const`, so each namespace's own law types survive for a type to read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family table; the families own their rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row is named here: a family lists namespaces, and their rows are read from them.
 */
export const HUMAN_LEXICON_FAMILIES: IAutoMovieMotionHumanLexiconFamilies = {
  emblem: [HumanEmblem],
  habit: [HumanHabit],
  stance: [HumanStance],
  pose: [HumanPose],
  gait: [HumanGait, HumanTravelDoor, HumanTravelCar, HumanTravelLeaf],
  pursuit: [HumanPursuit],
  social: [HumanSocial, HumanPartner],
  stageFight: [HumanStageFight],
  drill: [HumanDrill],
  blade: [HumanBlade],
  firearm: [HumanFirearm],
  labour: [HumanLabour],
  ride: [HumanRide],
  carried: [HumanCarried],
  sport: [HumanSport],
  sportGym: [HumanSportGym],
  sportCarry: [HumanSportCarry],
  floorRoll: [HumanFloorRoll],
  floorFall: [HumanFloorFall],
  support: [HumanSupportRows],
  sportSwing: [HumanSportSwing],
  sportThrow: [HumanSportThrow],
  sportWorkout: [HumanSportWorkout],
  gymnastics: [HumanGymnastics],
  sword: [HumanSword, HumanSwordGuard, HumanSwordParry, HumanSwordThrust],
  weaponFirearm: [HumanWeaponFirearm],
  weaponMelee: [HumanWeaponMelee],
  manipulate: [HumanManipulate],
  regrasp: [HumanRegrasp],
  upperPhrase: [HumanUpperRows],
  upperGesture: [HumanGestureRows],
  upperRest: [HumanRestRows],
  upperTouch: [HumanTouchRows, HumanSelfActionRows],
  upperFace: [HumanHandToFaceRows],
  upperDress: [HumanDressRows],
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
