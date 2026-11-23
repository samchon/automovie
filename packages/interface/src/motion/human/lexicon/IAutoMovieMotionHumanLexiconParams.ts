import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanLexiconArcheryParams } from "./IAutoMovieMotionHumanLexiconArcheryParams";
import type { IAutoMovieMotionHumanLexiconBladeParams } from "./IAutoMovieMotionHumanLexiconBladeParams";
import type { IAutoMovieMotionHumanLexiconBoltActionParams } from "./IAutoMovieMotionHumanLexiconBoltActionParams";
import type { IAutoMovieMotionHumanLexiconCarriedParams } from "./IAutoMovieMotionHumanLexiconCarriedParams";
import type { IAutoMovieMotionHumanLexiconDefenceParams } from "./IAutoMovieMotionHumanLexiconDefenceParams";
import type { IAutoMovieMotionHumanLexiconDrillParams } from "./IAutoMovieMotionHumanLexiconDrillParams";
import type { IAutoMovieMotionHumanLexiconEmblemParams } from "./IAutoMovieMotionHumanLexiconEmblemParams";
import type { IAutoMovieMotionHumanLexiconFirearmParams } from "./IAutoMovieMotionHumanLexiconFirearmParams";
import type { IAutoMovieMotionHumanLexiconFloorFallParams } from "./IAutoMovieMotionHumanLexiconFloorFallParams";
import type { IAutoMovieMotionHumanLexiconFloorRollParams } from "./IAutoMovieMotionHumanLexiconFloorRollParams";
import type { IAutoMovieMotionHumanLexiconGaitParams } from "./IAutoMovieMotionHumanLexiconGaitParams";
import type { IAutoMovieMotionHumanLexiconGunDrillParams } from "./IAutoMovieMotionHumanLexiconGunDrillParams";
import type { IAutoMovieMotionHumanLexiconGymnasticsParams } from "./IAutoMovieMotionHumanLexiconGymnasticsParams";
import type { IAutoMovieMotionHumanLexiconHabitParams } from "./IAutoMovieMotionHumanLexiconHabitParams";
import type { IAutoMovieMotionHumanLexiconLabourParams } from "./IAutoMovieMotionHumanLexiconLabourParams";
import type { IAutoMovieMotionHumanLexiconManipulateParams } from "./IAutoMovieMotionHumanLexiconManipulateParams";
import type { IAutoMovieMotionHumanLexiconMusketDrillParams } from "./IAutoMovieMotionHumanLexiconMusketDrillParams";
import type { IAutoMovieMotionHumanLexiconPoseParams } from "./IAutoMovieMotionHumanLexiconPoseParams";
import type { IAutoMovieMotionHumanLexiconPursuitParams } from "./IAutoMovieMotionHumanLexiconPursuitParams";
import type { IAutoMovieMotionHumanLexiconRegraspParams } from "./IAutoMovieMotionHumanLexiconRegraspParams";
import type { IAutoMovieMotionHumanLexiconRevolverParams } from "./IAutoMovieMotionHumanLexiconRevolverParams";
import type { IAutoMovieMotionHumanLexiconRideParams } from "./IAutoMovieMotionHumanLexiconRideParams";
import type { IAutoMovieMotionHumanLexiconSocialParams } from "./IAutoMovieMotionHumanLexiconSocialParams";
import type { IAutoMovieMotionHumanLexiconSportCarryParams } from "./IAutoMovieMotionHumanLexiconSportCarryParams";
import type { IAutoMovieMotionHumanLexiconSportGymParams } from "./IAutoMovieMotionHumanLexiconSportGymParams";
import type { IAutoMovieMotionHumanLexiconSportParams } from "./IAutoMovieMotionHumanLexiconSportParams";
import type { IAutoMovieMotionHumanLexiconSportSwingParams } from "./IAutoMovieMotionHumanLexiconSportSwingParams";
import type { IAutoMovieMotionHumanLexiconSportThrowParams } from "./IAutoMovieMotionHumanLexiconSportThrowParams";
import type { IAutoMovieMotionHumanLexiconSportWorkoutParams } from "./IAutoMovieMotionHumanLexiconSportWorkoutParams";
import type { IAutoMovieMotionHumanLexiconStageFightParams } from "./IAutoMovieMotionHumanLexiconStageFightParams";
import type { IAutoMovieMotionHumanLexiconStanceParams } from "./IAutoMovieMotionHumanLexiconStanceParams";
import type { IAutoMovieMotionHumanLexiconStrikeParams } from "./IAutoMovieMotionHumanLexiconStrikeParams";
import type { IAutoMovieMotionHumanLexiconSupportParams } from "./IAutoMovieMotionHumanLexiconSupportParams";
import type { IAutoMovieMotionHumanLexiconSwordParams } from "./IAutoMovieMotionHumanLexiconSwordParams";
import type { IAutoMovieMotionHumanLexiconThrownWeaponParams } from "./IAutoMovieMotionHumanLexiconThrownWeaponParams";
import type { IAutoMovieMotionHumanLexiconUpperDressParams } from "./IAutoMovieMotionHumanLexiconUpperDressParams";
import type { IAutoMovieMotionHumanLexiconUpperFaceParams } from "./IAutoMovieMotionHumanLexiconUpperFaceParams";
import type { IAutoMovieMotionHumanLexiconUpperGestureParams } from "./IAutoMovieMotionHumanLexiconUpperGestureParams";
import type { IAutoMovieMotionHumanLexiconUpperPhraseParams } from "./IAutoMovieMotionHumanLexiconUpperPhraseParams";
import type { IAutoMovieMotionHumanLexiconUpperRestParams } from "./IAutoMovieMotionHumanLexiconUpperRestParams";
import type { IAutoMovieMotionHumanLexiconUpperToolParams } from "./IAutoMovieMotionHumanLexiconUpperToolParams";
import type { IAutoMovieMotionHumanLexiconUpperTouchParams } from "./IAutoMovieMotionHumanLexiconUpperTouchParams";
import type { IAutoMovieMotionHumanLexiconWeaponFirearmParams } from "./IAutoMovieMotionHumanLexiconWeaponFirearmParams";
import type { IAutoMovieMotionHumanLexiconWeaponMeleeParams } from "./IAutoMovieMotionHumanLexiconWeaponMeleeParams";

/**
 * The open parameters of every installed Human lexicon row, by family and then
 * by the row's export key: what a row leaves to the author after the parameters
 * it fixes, each with its law's own default, unit and required status. A row's
 * export key may differ from its registered name; `HUMAN_LEXICON_FAMILIES`
 * pairs them.
 */
export interface IAutoMovieMotionHumanLexiconParams {
  /**
   * Export-name to open parameters for the emblem family; registered law names
   * are read from the runtime law records.
   */
  emblem: IAutoMovieMotionHumanLexiconEmblemParams;

  /**
   * Export-name to open parameters for the habit family; registered law names
   * are read from the runtime law records.
   */
  habit: IAutoMovieMotionHumanLexiconHabitParams;

  /**
   * Export-name to open parameters for the stance family; registered law names
   * are read from the runtime law records.
   */
  stance: IAutoMovieMotionHumanLexiconStanceParams;

  /**
   * Export-name to open parameters for the pose family; registered law names
   * are read from the runtime law records.
   */
  pose: IAutoMovieMotionHumanLexiconPoseParams;

  /**
   * Export-name to open parameters for the gait family; registered law names
   * are read from the runtime law records.
   */
  gait: IAutoMovieMotionHumanLexiconGaitParams;

  /**
   * Export-name to open parameters for the pursuit family; registered law names
   * are read from the runtime law records.
   */
  pursuit: IAutoMovieMotionHumanLexiconPursuitParams;

  /**
   * Export-name to open parameters for the social family; registered law names
   * are read from the runtime law records.
   */
  social: IAutoMovieMotionHumanLexiconSocialParams;

  /**
   * Export-name to open parameters for the stageFight family; registered law
   * names are read from the runtime law records.
   */
  stageFight: IAutoMovieMotionHumanLexiconStageFightParams;

  /**
   * Export-name to open parameters for the drill family; registered law names
   * are read from the runtime law records.
   */
  drill: IAutoMovieMotionHumanLexiconDrillParams;

  /**
   * Export-name to open parameters for the blade family; registered law names
   * are read from the runtime law records.
   */
  blade: IAutoMovieMotionHumanLexiconBladeParams;

  /**
   * Export-name to open parameters for the firearm family; registered law names
   * are read from the runtime law records.
   */
  firearm: IAutoMovieMotionHumanLexiconFirearmParams;

  /**
   * Export-name to open parameters for the labour family; registered law names
   * are read from the runtime law records.
   */
  labour: IAutoMovieMotionHumanLexiconLabourParams;

  /**
   * Export-name to open parameters for the ride family; registered law names
   * are read from the runtime law records.
   */
  ride: IAutoMovieMotionHumanLexiconRideParams;

  /**
   * Export-name to open parameters for the carried family; registered law names
   * are read from the runtime law records.
   */
  carried: IAutoMovieMotionHumanLexiconCarriedParams;

  /**
   * Export-name to open parameters for the sport family; registered law names
   * are read from the runtime law records.
   */
  sport: IAutoMovieMotionHumanLexiconSportParams;

  /**
   * Export-name to open parameters for the sportGym family; registered law
   * names are read from the runtime law records.
   */
  sportGym: IAutoMovieMotionHumanLexiconSportGymParams;

  /**
   * Export-name to open parameters for the sportCarry family; registered law
   * names are read from the runtime law records.
   */
  sportCarry: IAutoMovieMotionHumanLexiconSportCarryParams;

  /**
   * Export-name to open parameters for the floorRoll family; registered law
   * names are read from the runtime law records.
   */
  floorRoll: IAutoMovieMotionHumanLexiconFloorRollParams;

  /**
   * Export-name to open parameters for the floorFall family; registered law
   * names are read from the runtime law records.
   */
  floorFall: IAutoMovieMotionHumanLexiconFloorFallParams;

  /**
   * Export-name to open parameters for the support family; registered law names
   * are read from the runtime law records.
   */
  support: IAutoMovieMotionHumanLexiconSupportParams;

  /**
   * Export-name to open parameters for the sportSwing family; registered law
   * names are read from the runtime law records.
   */
  sportSwing: IAutoMovieMotionHumanLexiconSportSwingParams;

  /**
   * Export-name to open parameters for the sportThrow family; registered law
   * names are read from the runtime law records.
   */
  sportThrow: IAutoMovieMotionHumanLexiconSportThrowParams;

  /**
   * Export-name to open parameters for the sportWorkout family; registered law
   * names are read from the runtime law records.
   */
  sportWorkout: IAutoMovieMotionHumanLexiconSportWorkoutParams;

  /**
   * Export-name to open parameters for the gymnastics family; registered law
   * names are read from the runtime law records.
   */
  gymnastics: IAutoMovieMotionHumanLexiconGymnasticsParams;

  /**
   * Export-name to open parameters for the sword family; registered law names
   * are read from the runtime law records.
   */
  sword: IAutoMovieMotionHumanLexiconSwordParams;

  /**
   * Export-name to open parameters for the weaponFirearm family; registered law
   * names are read from the runtime law records.
   */
  weaponFirearm: IAutoMovieMotionHumanLexiconWeaponFirearmParams;

  /**
   * Export-name to open parameters for the weaponMelee family; registered law
   * names are read from the runtime law records.
   */
  weaponMelee: IAutoMovieMotionHumanLexiconWeaponMeleeParams;

  /**
   * Export-name to open parameters for the manipulate family; registered law
   * names are read from the runtime law records.
   */
  manipulate: IAutoMovieMotionHumanLexiconManipulateParams;

  /**
   * Export-name to open parameters for the regrasp family; registered law names
   * are read from the runtime law records.
   */
  regrasp: IAutoMovieMotionHumanLexiconRegraspParams;

  /**
   * Export-name to open parameters for the upperPhrase family; registered law
   * names are read from the runtime law records.
   */
  upperPhrase: IAutoMovieMotionHumanLexiconUpperPhraseParams;

  /**
   * Export-name to open parameters for the upperGesture family; registered law
   * names are read from the runtime law records.
   */
  upperGesture: IAutoMovieMotionHumanLexiconUpperGestureParams;

  /**
   * Export-name to open parameters for the upperRest family; registered law
   * names are read from the runtime law records.
   */
  upperRest: IAutoMovieMotionHumanLexiconUpperRestParams;

  /**
   * Export-name to open parameters for the upperTouch family; registered law
   * names are read from the runtime law records.
   */
  upperTouch: IAutoMovieMotionHumanLexiconUpperTouchParams;

  /**
   * Export-name to open parameters for the upperFace family; registered law
   * names are read from the runtime law records.
   */
  upperFace: IAutoMovieMotionHumanLexiconUpperFaceParams;

  /**
   * Export-name to open parameters for the upperDress family; registered law
   * names are read from the runtime law records.
   */
  upperDress: IAutoMovieMotionHumanLexiconUpperDressParams;

  /**
   * Export-name to open parameters for the upperTool family; registered law
   * names are read from the runtime law records.
   */
  upperTool: IAutoMovieMotionHumanLexiconUpperToolParams;

  /**
   * Export-name to open parameters for the strike family; registered law names
   * are read from the runtime law records.
   */
  strike: IAutoMovieMotionHumanLexiconStrikeParams;

  /**
   * Export-name to open parameters for the defence family; registered law names
   * are read from the runtime law records.
   */
  defence: IAutoMovieMotionHumanLexiconDefenceParams;

  /**
   * Export-name to open parameters for the thrownWeapon family; registered law
   * names are read from the runtime law records.
   */
  thrownWeapon: IAutoMovieMotionHumanLexiconThrownWeaponParams;

  /**
   * Export-name to open parameters for the gunDrill family; registered law
   * names are read from the runtime law records.
   */
  gunDrill: IAutoMovieMotionHumanLexiconGunDrillParams;

  /**
   * Export-name to open parameters for the musketDrill family; registered law
   * names are read from the runtime law records.
   */
  musketDrill: IAutoMovieMotionHumanLexiconMusketDrillParams;

  /**
   * Export-name to open parameters for the boltAction family; registered law
   * names are read from the runtime law records.
   */
  boltAction: IAutoMovieMotionHumanLexiconBoltActionParams;

  /**
   * Export-name to open parameters for the revolver family; registered law
   * names are read from the runtime law records.
   */
  revolver: IAutoMovieMotionHumanLexiconRevolverParams;

  /**
   * Export-name to open parameters for the archery family; registered law names
   * are read from the runtime law records.
   */
  archery: IAutoMovieMotionHumanLexiconArcheryParams;
}

/** Contracts used by HumanBlade.enGarde, HumanBlade.vomTag, HumanBlade.ochs. */
export namespace IAutoMovieMotionHumanLexiconParams {
  /**
   * Parameters accepted by a named law's plan; never when the member is not a
   * law.
   */
  export type Of<Member> = Member extends {
    /**
     * Action-law name required for structural recognition by this
     * parameter-extraction utility.
     */
    name: string;
    /**
     * Planning function whose context parameter determines the extracted
     * parameter type; never invoked by this type utility.
     */
    plan: (context: IAutoMovieMotionHumanActionContext<infer P>) => unknown;
  }
    ? P
    : never;

  /**
   * Only a namespace's law-valued keys, mapped to the open parameters their
   * plan accepts.
   */
  export type Space<S> = {
    [K in keyof S as [Of<S[K]>] extends [never] ? never : K]: Of<S[K]>;
  };

  /** Distribute the law-key projection across a union of contributed namespaces. */
  export type Rows<S> = S extends unknown ? Space<S> : never;

  /**
   * Merge contributed row records into one schema-readable object; shared keys
   * retain the union of their parameter types.
   */
  export type Merged<U> = {
    [K in U extends unknown ? keyof U : never]: U extends unknown
      ? K extends keyof U
        ? U[K]
        : never
      : never;
  };
}
