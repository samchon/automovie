import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { pour } from "../../affordance/internal/pour";
import { coverFace } from "../../daily/internal/coverFace";
import { playWindInstrument } from "../../daily/internal/playWindInstrument";
import { wipeTears } from "../../daily/internal/wipeTears";
import { tipHat } from "../../dressing/internal/tipHat";
import { wardrobe } from "../../dressing/internal/wardrobe";
import { headTilt } from "../../everyday/internal/headTilt";
import { swipeTouchscreen } from "../../everyday/internal/swipeTouchscreen";
import { ropeSkip } from "../../exercise/internal/ropeSkip";
import { button } from "../../handling/internal/button";
import { drawFromCarrier } from "../../handling/internal/drawFromCarrier";
import { guitarChord } from "../../handling/internal/guitarChord";
import { guitarNote } from "../../handling/internal/guitarNote";
import { pianoPedal } from "../../handling/internal/pianoPedal";
import { pianoPerformance } from "../../handling/internal/pianoPerformance";
import { pianoScore } from "../../handling/internal/pianoScore";
import { pickUpMoving } from "../../handling/internal/pickUpMoving";
import { putDownAperture } from "../../handling/internal/putDownAperture";
import { throwPottery } from "../../handling/internal/throwPottery";
import { workHeld } from "../../handling/internal/workHeld";
import { write } from "../../handling/internal/write";
import { zip } from "../../handling/internal/zip";
import { bowViolin } from "../../music/internal/bowViolin";
import { conduct } from "../../music/internal/conduct";
import { collapse } from "../../reaction/internal/collapse";
import { stopDropRoll } from "../../reaction/internal/stopDropRoll";
import { thrown } from "../../reaction/internal/thrown";
import { wireArrest } from "../../reaction/internal/wireArrest";
import { wireFlight } from "../../reaction/internal/wireFlight";
import { beatFlames } from "../../tasks/internal/beatFlames";
import { cymbalStrike } from "../../tasks/internal/cymbalStrike";
import { extinguish } from "../../tasks/internal/extinguish";
import { hoseLine } from "../../tasks/internal/hoseLine";
import { sideDrumStrike } from "../../tasks/internal/sideDrumStrike";
import { stageDeflect } from "../../throwing/internal/stageDeflect";
import { HumanAidWalk } from "./HumanAidWalk";
import { HumanAssistedTransfer } from "./HumanAssistedTransfer";
import { HumanCarrierCustody } from "./HumanCarrierCustody";
import { HumanDefence } from "./HumanDefence";
import { HumanDressRows } from "./HumanDressRows";
import { HumanFloorFall } from "./HumanFloorFall";
import { HumanGestureRows } from "./HumanGestureRows";
import { HumanGymnastics } from "./HumanGymnastics";
import { HumanHandToFaceRows } from "./HumanHandToFaceRows";
import { HumanManipulate } from "./HumanManipulate";
import { HumanRegrasp } from "./HumanRegrasp";
import { HumanRestRows } from "./HumanRestRows";
import { HumanSelfActionRows } from "./HumanSelfActionRows";
import { HumanSportSwing } from "./HumanSportSwing";
import { HumanSportThrow } from "./HumanSportThrow";
import { HumanSportWorkout } from "./HumanSportWorkout";
import { HumanStrike } from "./HumanStrike";
import { HumanSupportRows } from "./HumanSupportRows";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";
import { HumanSwordParry } from "./HumanSwordParry";
import { HumanSwordThrust } from "./HumanSwordThrust";
import { HumanToolRows } from "./HumanToolRows";
import { HumanTouchRows } from "./HumanTouchRows";
import { HumanUpperRows } from "./HumanUpperRows";
import { HumanVehicleHit } from "./HumanVehicleHit";
import { HumanWeaponFirearm } from "./HumanWeaponFirearm";
import { HumanWeaponMelee } from "./HumanWeaponMelee";
import { tuckHair } from "./tuckHair";

/*
 * The laws of the lexicon's hand and upper-body families, from the floor falls
 * to the defences, by export key (`HUMAN_LEXICON_FAMILIES`).
 */
export const HUMAN_LEXICON_HAND_LAWS: Pick<
  IAutoMovieMotionHumanLexiconFamilies,
  | "floorFall"
  | "support"
  | "sportSwing"
  | "sportThrow"
  | "sportWorkout"
  | "gymnastics"
  | "sword"
  | "weaponFirearm"
  | "weaponMelee"
  | "manipulate"
  | "regrasp"
  | "upperPhrase"
  | "upperGesture"
  | "upperRest"
  | "upperTouch"
  | "upperFace"
  | "upperDress"
  | "upperTool"
  | "strike"
  | "defence"
> = {
  floorFall: {
    goalkeeperDiveLeft: HumanFloorFall.goalkeeperDiveLeft,
    goalkeeperDiveRight: HumanFloorFall.goalkeeperDiveRight,
    slidingTackle: HumanFloorFall.slidingTackle,
    collapse,
    thrown,
    vehicleHit: HumanVehicleHit.vehicleHit,
    vehicleDive: HumanVehicleHit.vehicleDive,
    wireFlight,
    stopDropRoll,
    wireArrest,
  },
  support: {
    scramble: HumanSupportRows.scramble,
    slideOff: HumanSupportRows.slideOff,
    HumanAidWalk,
    HumanAssistedTransfer,
  },
  sportSwing: {
    batSwing: HumanSportSwing.batSwing,
    checkSwing: HumanSportSwing.checkSwing,
    bunt: HumanSportSwing.bunt,
    forehand: HumanSportSwing.forehand,
    backhandDrive: HumanSportSwing.backhandDrive,
    twoHandBackhand: HumanSportSwing.twoHandBackhand,
    topspin: HumanSportSwing.topspin,
    overheadSmash: HumanSportSwing.overheadSmash,
    volley: HumanSportSwing.volley,
    golfSwing: HumanSportSwing.golfSwing,
    putt: HumanSportSwing.putt,
    spike: HumanSportSwing.spike,
  },
  sportThrow: {
    pitch: HumanSportThrow.pitch,
    underarmPitch: HumanSportThrow.underarmPitch,
    softballWindmill: HumanSportThrow.softballWindmill,
    cricketBowl: HumanSportThrow.cricketBowl,
    bowlingSlide: HumanSportThrow.bowlingSlide,
    bowlingDelivery: HumanSportThrow.bowlingDelivery,
    pushPass: HumanSportThrow.pushPass,
    rugbyPass: HumanSportThrow.rugbyPass,
    gridironPass: HumanSportThrow.gridironPass,
    gridironSnap: HumanSportThrow.gridironSnap,
    gloveCatch: HumanSportThrow.gloveCatch,
    twoHandCatch: HumanSportThrow.twoHandCatch,
    kickRight: HumanSportThrow.kickRight,
    kickLeft: HumanSportThrow.kickLeft,
    leap: HumanSportThrow.leap,
    boxJump: HumanSportThrow.boxJump,
    frontSalto: HumanSportThrow.frontSalto,
    backSalto: HumanSportThrow.backSalto,
    cartwheelLeft: HumanSportThrow.cartwheelLeft,
    au: HumanSportThrow.au,
    cartwheelRight: HumanSportThrow.cartwheelRight,
    dash: HumanSportThrow.dash,
    stageDeflect,
  },
  sportWorkout: {
    pushUp: HumanSportWorkout.pushUp,
    widePushUp: HumanSportWorkout.widePushUp,
    plank: HumanSportWorkout.plank,
    mountainClimber: HumanSportWorkout.mountainClimber,
    burpee: HumanSportWorkout.burpee,
    downwardDog: HumanSportWorkout.downwardDog,
    cobra: HumanSportWorkout.cobra,
    sitUp: HumanSportWorkout.sitUp,
    crunch: HumanSportWorkout.crunch,
    gluteBridge: HumanSportWorkout.gluteBridge,
    pnfHamstring: HumanSportWorkout.pnfHamstring,
    sidePlank: HumanSportWorkout.sidePlank,
    seatedFold: HumanSportWorkout.seatedFold,
    hurdlerStretch: HumanSportWorkout.hurdlerStretch,
    benchPress: HumanSportWorkout.benchPress,
    rowing: HumanSportWorkout.rowing,
    cycling: HumanSportWorkout.cycling,
    deadlift: HumanSportWorkout.deadlift,
    backSquat: HumanSportWorkout.backSquat,
    kettlebellSwing: HumanSportWorkout.kettlebellSwing,
    overheadPress: HumanSportWorkout.overheadPress,
    armCircles: HumanSportWorkout.armCircles,
    legSwings: HumanSportWorkout.legSwings,
    buttKicks: HumanSportWorkout.buttKicks,
    aSkip: HumanSportWorkout.aSkip,
    bSkip: HumanSportWorkout.bSkip,
    strides: HumanSportWorkout.strides,
    jumpRope: HumanSportWorkout.jumpRope,
    calfStretch: HumanSportWorkout.calfStretch,
    chestStretch: HumanSportWorkout.chestStretch,
    tricepsStretch: HumanSportWorkout.tricepsStretch,
    lungeTwist: HumanSportWorkout.lungeTwist,
    mountainPose: HumanSportWorkout.mountainPose,
    warriorOne: HumanSportWorkout.warriorOne,
    warriorTwo: HumanSportWorkout.warriorTwo,
    sunSalutation: HumanSportWorkout.sunSalutation,
    triangle: HumanSportWorkout.triangle,
    frontStance: HumanSportWorkout.frontStance,
    lowBlock: HumanSportWorkout.lowBlock,
    risingBlock: HumanSportWorkout.risingBlock,
    header: HumanSportWorkout.header,
    chestTrap: HumanSportWorkout.chestTrap,
    thighTrap: HumanSportWorkout.thighTrap,
    spin: HumanSportWorkout.spin,
    underarmTurn: HumanSportWorkout.underarmTurn,
    hammerTurn: HumanSportWorkout.hammerTurn,
    closedHold: HumanSportWorkout.closedHold,
    arabesque: HumanSportWorkout.arabesque,
    babyFreeze: HumanSportWorkout.babyFreeze,
    streetRock: HumanSportWorkout.streetRock,
    deadHang: HumanSportWorkout.deadHang,
    pullUp: HumanSportWorkout.pullUp,
    chinUp: HumanSportWorkout.chinUp,
    kneeRaise: HumanSportWorkout.kneeRaise,
    barSwing: HumanSportWorkout.barSwing,
    ropeSkip,
  },
  gymnastics: {
    roundOffLeft: HumanGymnastics.roundOffLeft,
    roundOffRight: HumanGymnastics.roundOffRight,
    frontHandspring: HumanGymnastics.frontHandspring,
    handspringVault: HumanGymnastics.handspringVault,
    boxVault: HumanGymnastics.boxVault,
    fosburyFlop: HumanGymnastics.fosburyFlop,
    vaultOnPole: HumanGymnastics.vaultOnPole,
    longJump: HumanGymnastics.longJump,
    hurdleClear: HumanGymnastics.hurdleClear,
    fieldThrow: HumanGymnastics.fieldThrow,
    lineWalk: HumanGymnastics.lineWalk,
    juggling: HumanGymnastics.juggling,
    stilts: HumanGymnastics.stilts,
    trampoline: HumanGymnastics.trampoline,
  },
  sword: {
    cut: HumanSword.cut,
    guard: HumanSwordGuard.guard,
    parry: HumanSwordParry.parry,
    thrust: HumanSwordThrust.thrust,
  },
  weaponFirearm: {
    present: HumanWeaponFirearm.present,
    fire: HumanWeaponFirearm.fire,
    draw: HumanWeaponFirearm.draw,
    holster: HumanWeaponFirearm.holster,
  },
  weaponMelee: {
    clubSwing: HumanWeaponMelee.clubSwing,
    clubStrike: HumanWeaponMelee.clubStrike,
    knifeSlash: HumanWeaponMelee.knifeSlash,
    knifeBackslash: HumanWeaponMelee.knifeBackslash,
    knifeStab: HumanWeaponMelee.knifeStab,
    stabOverhand: HumanWeaponMelee.stabOverhand,
    reload: HumanWeaponMelee.reload,
  },
  manipulate: {
    sequence: HumanManipulate.sequence,
    type: HumanManipulate.type,
    typeTwoFinger: HumanManipulate.typeTwoFinger,
    play: HumanManipulate.play,
    fret: HumanManipulate.fret,
    strum: HumanManipulate.strum,
    dial: HumanManipulate.dial,
    thumbText: HumanManipulate.thumbText,
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
  regrasp: {
    twist: HumanRegrasp.twist,
    regrip: HumanRegrasp.regrip,
    roll: HumanRegrasp.roll,
  },
  upperPhrase: {
    phrase: HumanUpperRows.phrase,
    waveHand: HumanUpperRows.waveHand,
    raiseHandHigh: HumanUpperRows.raiseHandHigh,
    stopHand: HumanUpperRows.stopHand,
    pointAt: HumanUpperRows.pointAt,
    tapOn: HumanUpperRows.tapOn,
    pressOn: HumanUpperRows.pressOn,
    rubOn: HumanUpperRows.rubOn,
    strokeDown: HumanUpperRows.strokeDown,
    handOnHip: HumanUpperRows.handOnHip,
    chinOnFist: HumanUpperRows.chinOnFist,
    wipeMouthAcross: HumanUpperRows.wipeMouthAcross,
    wipeAcross: HumanUpperRows.wipeAcross,
    hammerStrokes: HumanUpperRows.hammerStrokes,
    sawStrokes: HumanUpperRows.sawStrokes,
    stirStrokes: HumanUpperRows.stirStrokes,
    hatOnHead: HumanUpperRows.hatOnHead,
    palmUp: HumanUpperRows.palmUp,
    glassesUp: HumanUpperRows.glassesUp,
    headScratch: HumanUpperRows.headScratch,
    cheekInHand: HumanUpperRows.cheekInHand,
    handInPocket: HumanUpperRows.handInPocket,
    handBehindHead: HumanUpperRows.handBehindHead,
    phoneToEar: HumanUpperRows.phoneToEar,
    teethBrushing: HumanUpperRows.teethBrushing,
    hairCombing: HumanUpperRows.hairCombing,
    clapHands: HumanUpperRows.clapHands,
    rubPalms: HumanUpperRows.rubPalms,
    handsTogetherFront: HumanUpperRows.handsTogetherFront,
    cheerHands: HumanUpperRows.cheerHands,
    beckonHand: HumanUpperRows.beckonHand,
    foldArms: HumanUpperRows.foldArms,
    handsClaspedBehind: HumanUpperRows.handsClaspedBehind,
    armAtSide: HumanUpperRows.armAtSide,
    patOn: HumanUpperRows.patOn,
    squeezeOn: HumanUpperRows.squeezeOn,
    holdOn: HumanUpperRows.holdOn,
    drinkFrom: HumanUpperRows.drinkFrom,
    eatWith: HumanUpperRows.eatWith,
    scratchOn: HumanUpperRows.scratchOn,
  },
  upperGesture: {
    gestureWave: HumanGestureRows.gestureWave,
    gestureRaiseHand: HumanGestureRows.gestureRaiseHand,
    gestureCheer: HumanGestureRows.gestureCheer,
    gestureStopPalm: HumanGestureRows.gestureStopPalm,
    gesturePoint: HumanGestureRows.gesturePoint,
    gesturePalmsUp: HumanGestureRows.gesturePalmsUp,
    gestureBeckon: HumanGestureRows.gestureBeckon,
    gestureClap: HumanGestureRows.gestureClap,
    gestureRubHands: HumanGestureRows.gestureRubHands,
    gesturePalmsTogether: HumanGestureRows.gesturePalmsTogether,
    gestureThumbsDown: HumanGestureRows.gestureThumbsDown,
    gestureTouchFace: HumanGestureRows.gestureTouchFace,
    gesturePushGlasses: HumanGestureRows.gesturePushGlasses,
    gestureScratchHead: HumanGestureRows.gestureScratchHead,
    gestureShrug: HumanGestureRows.gestureShrug,
    gestureNod: HumanGestureRows.gestureNod,
    gestureShakeHead: HumanGestureRows.gestureShakeHead,
    gestureBow: HumanGestureRows.gestureBow,
    gestureChinLift: HumanGestureRows.gestureChinLift,
    gestureSquareShoulders: HumanGestureRows.gestureSquareShoulders,
    gestureSlump: HumanGestureRows.gestureSlump,
    headTilt,
  },
  upperRest: {
    restSide: HumanRestRows.restSide,
    restPocket: HumanRestRows.restPocket,
    restHip: HumanRestRows.restHip,
    restCrossed: HumanRestRows.restCrossed,
    restClaspedFront: HumanRestRows.restClaspedFront,
    restClaspedBehind: HumanRestRows.restClaspedBehind,
    restBehindHead: HumanRestRows.restBehindHead,
    restChinRest: HumanRestRows.restChinRest,
    restElbowSupport: HumanRestRows.restElbowSupport,
  },
  upperTouch: {
    touchTap: HumanTouchRows.touchTap,
    touchPat: HumanTouchRows.touchPat,
    touchStroke: HumanTouchRows.touchStroke,
    touchRub: HumanTouchRows.touchRub,
    touchPress: HumanTouchRows.touchPress,
    touchSqueeze: HumanTouchRows.touchSqueeze,
    touchHold: HumanTouchRows.touchHold,
    touchScratch: HumanTouchRows.touchScratch,
    selfStretch: HumanSelfActionRows.selfStretch,
    selfVictory: HumanSelfActionRows.selfVictory,
    selfFistPump: HumanSelfActionRows.selfFistPump,
    selfNeckRoll: HumanSelfActionRows.selfNeckRoll,
    selfShoulderRoll: HumanSelfActionRows.selfShoulderRoll,
    tuckHair,
  },
  upperFace: {
    faceDrink: HumanHandToFaceRows.faceDrink,
    faceSip: HumanHandToFaceRows.faceSip,
    faceEat: HumanHandToFaceRows.faceEat,
    faceBite: HumanHandToFaceRows.faceBite,
    facePhone: HumanHandToFaceRows.facePhone,
    faceRead: HumanHandToFaceRows.faceRead,
    faceBrushTeeth: HumanHandToFaceRows.faceBrushTeeth,
    faceComb: HumanHandToFaceRows.faceComb,
    faceWashFace: HumanHandToFaceRows.faceWashFace,
    faceWipeMouth: HumanHandToFaceRows.faceWipeMouth,
    facePinchNose: HumanHandToFaceRows.facePinchNose,
    coverFace,
    wipeTears,
  },
  upperDress: {
    dressHat: HumanDressRows.dressHat,
    dressGlasses: HumanDressRows.dressGlasses,
    tipHat,
    button,
    zip,
    wardrobe,
  },
  upperTool: {
    toolHammer: HumanToolRows.toolHammer,
    toolSaw: HumanToolRows.toolSaw,
    toolStir: HumanToolRows.toolStir,
    toolScrewdriver: HumanToolRows.toolScrewdriver,
  },
  strike: {
    jab: HumanStrike.jab,
    cross: HumanStrike.cross,
    leadHook: HumanStrike.leadHook,
    rearHook: HumanStrike.rearHook,
    leadUppercut: HumanStrike.leadUppercut,
    rearUppercut: HumanStrike.rearUppercut,
    chainPunch: HumanStrike.chainPunch,
    rearChainPunch: HumanStrike.rearChainPunch,
    meiaLuaDeFrente: HumanStrike.meiaLuaDeFrente,
    armada: HumanStrike.armada,
    backfist: HumanStrike.backfist,
    hammerfist: HumanStrike.hammerfist,
    palmHeel: HumanStrike.palmHeel,
    horizontalElbow: HumanStrike.horizontalElbow,
    risingElbow: HumanStrike.risingElbow,
    descendingElbow: HumanStrike.descendingElbow,
    spinningElbow: HumanStrike.spinningElbow,
    spinningBackfist: HumanStrike.spinningBackfist,
    headbutt: HumanStrike.headbutt,
    sideKick: HumanStrike.sideKick,
    backKick: HumanStrike.backKick,
    hookKick: HumanStrike.hookKick,
    crescentKick: HumanStrike.crescentKick,
    axeKick: HumanStrike.axeKick,
    stomp: HumanStrike.stomp,
    legSweep: HumanStrike.legSweep,
    spinningHookKick: HumanStrike.spinningHookKick,
    jumpingSideKick: HumanStrike.jumpingSideKick,
    roundKick: HumanStrike.roundKick,
    switchKick: HumanStrike.switchKick,
    pushKick: HumanStrike.pushKick,
    teep: HumanStrike.teep,
    leadKnee: HumanStrike.leadKnee,
    rearKnee: HumanStrike.rearKnee,
  },
  defence: {
    cover: HumanDefence.cover,
    handParry: HumanDefence.handParry,
    elbowBlock: HumanDefence.elbowBlock,
    highBlock: HumanDefence.highBlock,
    checkKick: HumanDefence.checkKick,
    slip: HumanDefence.slip,
    rollUnder: HumanDefence.rollUnder,
    swayBack: HumanDefence.swayBack,
    braceImpact: HumanDefence.braceImpact,
    bracePush: HumanDefence.bracePush,
  },
};
