import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { crossAnkleOverKnee } from "../everyday/internal/crossAnkleOverKnee";
import { curtsy } from "../everyday/internal/curtsy";
import { seatedHeelBounce } from "../everyday/internal/seatedHeelBounce";
import { shiftStandingWeight } from "../everyday/internal/shiftStandingWeight";
import { crabWalk } from "../floor/internal/crabWalk";
import { disarm } from "../grappling/internal/disarm";
import { disarmed } from "../grappling/internal/disarmed";
import { grapple } from "../grappling/internal/grapple";
import { heldHostage } from "../grappling/internal/heldHostage";
import { hostageHold } from "../grappling/internal/hostageHold";
import { spacecraftGlide } from "../spacecraft/internal/spacecraftGlide";
import { aquatic } from "../sport/internal/aquatic";
import { stickBall } from "../sport/internal/stickBall";
import { swimImmersed } from "../sport/internal/swimImmersed";
import { lungeGrab } from "../touch/internal/lungeGrab";
import { HumanBicycleEffort } from "./HumanBicycleEffort";
import { HumanBikeGuide } from "./HumanBikeGuide";
import { HumanBikeTransfer } from "./HumanBikeTransfer";
import { HumanBlade } from "./HumanBlade";
import { HumanBoard } from "./HumanBoard";
import { HumanCarried } from "./HumanCarried";
import { HumanClasp } from "./HumanClasp";
import { HumanCover } from "./HumanCover";
import { HumanDanceStyles } from "./HumanDanceStyles";
import { HumanDrape } from "./HumanDrape";
import { HumanDrill } from "./HumanDrill";
import { HumanEdgeRescue } from "./HumanEdgeRescue";
import { HumanEmblem } from "./HumanEmblem";
import { HumanEnvironmentRecovery } from "./HumanEnvironmentRecovery";
import { HumanFirearm } from "./HumanFirearm";
import { HumanFloatBeside } from "./HumanFloatBeside";
import { HumanFloorRoll } from "./HumanFloorRoll";
import { HumanFrailWalk } from "./HumanFrailWalk";
import { HumanGait } from "./HumanGait";
import { HumanHabit } from "./HumanHabit";
import { HumanHandrimStroke } from "./HumanHandrimStroke";
import { HumanHoldHandles } from "./HumanHoldHandles";
import { HumanHorrorGait } from "./HumanHorrorGait";
import { HumanLabour } from "./HumanLabour";
import { HumanLanceCouch } from "./HumanLanceCouch";
import { HumanLasso } from "./HumanLasso";
import { HumanLeadHorse } from "./HumanLeadHorse";
import { HumanLunge } from "./HumanLunge";
import { HumanMounted } from "./HumanMounted";
import { HumanPartner } from "./HumanPartner";
import { HumanPolo } from "./HumanPolo";
import { HumanPose } from "./HumanPose";
import { HumanPursuit } from "./HumanPursuit";
import { HumanRaceGait } from "./HumanRaceGait";
import { HumanRide } from "./HumanRide";
import { HumanRoman } from "./HumanRoman";
import { HumanRope } from "./HumanRope";
import { HumanSabre } from "./HumanSabre";
import { HumanSittingVolley } from "./HumanSittingVolley";
import { HumanSkydive } from "./HumanSkydive";
import { HumanSocial } from "./HumanSocial";
import { HumanSport } from "./HumanSport";
import { HumanSportCarry } from "./HumanSportCarry";
import { HumanSportGym } from "./HumanSportGym";
import { HumanStageFight } from "./HumanStageFight";
import { HumanStageProp } from "./HumanStageProp";
import { HumanStance } from "./HumanStance";
import { HumanStuntFall } from "./HumanStuntFall";
import { HumanTravelCar } from "./HumanTravelCar";
import { HumanTravelCarExit } from "./HumanTravelCarExit";
import { HumanTravelDoor } from "./HumanTravelDoor";
import { HumanTravelLeaf } from "./HumanTravelLeaf";
import { HumanTraversal } from "./HumanTraversal";
import { HumanTreeClimb } from "./HumanTreeClimb";
import { HumanTrick } from "./HumanTrick";
import { HumanUnseat } from "./HumanUnseat";
import { HumanWallRun } from "./HumanWallRun";
import { stageBladeFootwork } from "./internal/stageBladeFootwork";

/**
 * The laws of the lexicon's body families, from the emblems to the floor rolls,
 * by export key (`HUMAN_LEXICON_FAMILIES`).
 */
export const HUMAN_LEXICON_BODY_LAWS: Pick<
  IAutoMovieMotionHumanLexiconFamilies,
  | "emblem"
  | "habit"
  | "stance"
  | "pose"
  | "gait"
  | "pursuit"
  | "social"
  | "stageFight"
  | "drill"
  | "blade"
  | "firearm"
  | "labour"
  | "ride"
  | "carried"
  | "sport"
  | "sportGym"
  | "sportCarry"
  | "floorRoll"
> = {
  emblem: {
    salute: HumanEmblem.salute,
    hush: HumanEmblem.hush,
    palmsTogether: HumanEmblem.palmsTogether,
    handOnHeart: HumanEmblem.handOnHeart,
    blownKissSend: HumanEmblem.blownKissSend,
    blownKiss: HumanEmblem.blownKiss,
    facepalm: HumanEmblem.facepalm,
    handsUp: HumanEmblem.handsUp,
    halt: HumanEmblem.halt,
    comeHere: HumanEmblem.comeHere,
    dontKnow: HumanEmblem.dontKnow,
    thumbsUp: HumanEmblem.thumbsUp,
    thumbsDown: HumanEmblem.thumbsDown,
    okSign: HumanEmblem.okSign,
    victorySign: HumanEmblem.victorySign,
    crossedFingers: HumanEmblem.crossedFingers,
    countOne: HumanEmblem.countOne,
    countTwo: HumanEmblem.countTwo,
    countThree: HumanEmblem.countThree,
    countFour: HumanEmblem.countFour,
    countFive: HumanEmblem.countFive,
    shakeFist: HumanEmblem.shakeFist,
    fingerSnap: HumanEmblem.fingerSnap,
    airQuotes: HumanEmblem.airQuotes,
    coverMouth: HumanEmblem.coverMouth,
    coverEars: HumanEmblem.coverEars,
  },
  habit: {
    smoke: HumanHabit.smoke,
    readingWalk: HumanHabit.readingWalk,
    photograph: HumanHabit.photograph,
    checkPhone: HumanHabit.checkPhone,
    checkWatch: HumanHabit.checkWatch,
    applyLipstick: HumanHabit.applyLipstick,
    shave: HumanHabit.shave,
    rubEyes: HumanHabit.rubEyes,
    scratchNape: HumanHabit.scratchNape,
    blowNose: HumanHabit.blowNose,
    applyCream: HumanHabit.applyCream,
    fanSelf: HumanHabit.fanSelf,
    sniff: HumanHabit.sniff,
    flickHair: HumanHabit.flickHair,
    selfie: HumanHabit.selfie,
    lightCigarette: HumanHabit.lightCigarette,
    ashTap: HumanHabit.ashTap,
    stubOut: HumanHabit.stubOut,
    seatedHeelBounce,
  },
  stance: {
    armsCrossed: HumanStance.armsCrossed,
    handsOnHips: HumanStance.handsOnHips,
    handsInPockets: HumanStance.handsInPockets,
    paradeRest: HumanStance.paradeRest,
    handsClasped: HumanStance.handsClasped,
    handsBehindHead: HumanStance.handsBehindHead,
    thinking: HumanStance.thinking,
    victory: HumanStance.victory,
    fistPump: HumanStance.fistPump,
    bigStretch: HumanStance.bigStretch,
    neckRoll: HumanStance.neckRoll,
  },
  pose: {
    takeAKnee: HumanPose.takeAKnee,
    kneelBriefly: HumanPose.kneelBriefly,
    kneelSit: HumanPose.kneelSit,
    sitOnFloor: HumanPose.sitOnFloor,
    sitCrossLegged: HumanPose.sitCrossLegged,
    sitSideways: HumanPose.sitSideways,
    squatSit: HumanPose.squatSit,
    takeCover: HumanPose.takeCover,
    lieStill: HumanPose.lieStill,
    braceForImpact: HumanPose.braceForImpact,
    startle: HumanPose.startle,
    wince: HumanPose.wince,
    stumble: HumanPose.stumble,
    crossAnkleOverKnee,
    shiftStandingWeight,
  },
  gait: {
    stroll: HumanGait.stroll,
    hurry: HumanGait.hurry,
    trudge: HumanGait.trudge,
    swagger: HumanGait.swagger,
    jog: HumanGait.jog,
    sprint: HumanGait.sprint,
    march: HumanGait.march,
    doubleTime: HumanGait.doubleTime,
    sneak: HumanGait.sneak,
    prowl: HumanGait.prowl,
    sad: HumanGait.sad,
    proud: HumanGait.proud,
    stiffLimp: HumanGait.stiffLimp,
    tiptoe: HumanGait.tiptoe,
    limp: HumanGait.limp,
    drunk: HumanGait.drunk,
    passThrough: HumanTravelDoor.passThrough,
    crossObstacle: HumanTraversal.crossObstacle,
    moveInCover: HumanCover.moveInCover,
    wallRun: HumanWallRun.wallRun,
    rope: HumanRope.rope,
    stuntFall: HumanStuntFall.stuntFall,
    climbTree: HumanTreeClimb.climbTree,
    skydive: HumanSkydive.skydive,
    edgeRescue: HumanEdgeRescue.edgeRescue,
    environmentalRecovery: HumanEnvironmentRecovery.environmentalRecovery,
    getIn: HumanTravelCar.getIn,
    openDoor: HumanTravelLeaf.openDoor,
    getOut: HumanTravelCarExit.getOut,
    shamble: HumanHorrorGait.shamble,
    lurch: HumanHorrorGait.lurch,
    stalk: HumanHorrorGait.stalk,
    crabWalk,
    raceWalk: HumanRaceGait.raceWalk,
    frailWalk: HumanFrailWalk.frailWalk,
  },
  pursuit: {
    follow: HumanPursuit.follow,
    escort: HumanPursuit.escort,
    chase: HumanPursuit.chase,
    confront: HumanPursuit.confront,
    intercept: HumanPursuit.intercept,
    flee: HumanPursuit.flee,
  },
  social: {
    whisper: HumanSocial.whisper,
    cheekKiss: HumanSocial.cheekKiss,
    foreheadKiss: HumanSocial.foreheadKiss,
    shoulderPat: HumanSocial.shoulderPat,
    comfort: HumanSocial.comfort,
    fistBump: HumanSocial.fistBump,
    lowFive: HumanSocial.lowFive,
    toastSip: HumanSocial.toastSip,
    pinkyPromise: HumanSocial.pinkyPromise,
    firmPress: HumanSocial.firmPress,
    flickOff: HumanSocial.flickOff,
    relayIncoming: HumanPartner.relayIncoming,
    relayOutgoing: HumanPartner.relayOutgoing,
    danceLead: HumanPartner.danceLead,
    danceFollow: HumanPartner.danceFollow,
    danceHold: HumanPartner.danceHold,
    judoGrip: HumanPartner.judoGrip,
    judoBroken: HumanPartner.judoBroken,
    curtsy,
  },
  stageFight: {
    HumanStageProp,
    grapple,
    lungeGrab,
    disarm,
    disarmed,
    hostageHold,
    heldHostage,
    stagePalmStrike: HumanStageFight.stagePalmStrike,
    stageHeadbutt: HumanStageFight.stageHeadbutt,
    slap: HumanStageFight.slap,
    stageSlap: HumanStageFight.stageSlap,
    backhand: HumanStageFight.backhand,
    shove: HumanStageFight.shove,
    grab: HumanStageFight.grab,
    poke: HumanStageFight.poke,
    restrain: HumanStageFight.restrain,
    slapped: HumanStageFight.slapped,
    shoved: HumanStageFight.shoved,
    grabbed: HumanStageFight.grabbed,
    choke: HumanStageFight.choke,
    headlock: HumanStageFight.headlock,
    hairPull: HumanStageFight.hairPull,
    struggle: HumanStageFight.struggle,
    diveForCover: HumanStageFight.diveForCover,
    duck: HumanStageFight.duck,
    esquiva: HumanStageFight.esquiva,
    dodge: HumanStageFight.dodge,
    leanBack: HumanStageFight.leanBack,
    pushed: HumanStageFight.pushed,
  },
  drill: {
    hook: HumanDrill.hook,
    uppercut: HumanDrill.uppercut,
    frontKick: HumanDrill.frontKick,
    southpaw: HumanDrill.southpaw,
    aim: HumanDrill.aim,
    squats: HumanDrill.squats,
    jumpingJacks: HumanDrill.jumpingJacks,
    sway: HumanDrill.sway,
  },
  blade: {
    stageBladeFootwork,
    enGarde: HumanBlade.enGarde,
    vomTag: HumanBlade.vomTag,
    ochs: HumanBlade.ochs,
    pflug: HumanBlade.pflug,
    alber: HumanBlade.alber,
    cut: HumanBlade.cut,
    slash: HumanBlade.slash,
    draw: HumanBlade.draw,
    thrust: HumanBlade.thrust,
    lunge: HumanBlade.lunge,
    stab: HumanBlade.stab,
    backslash: HumanBlade.backslash,
    advance: HumanBlade.advance,
    retreat: HumanBlade.retreat,
    traverse: HumanBlade.traverse,
    parry: HumanBlade.parry,
    beat: HumanBlade.beat,
    bind: HumanBlade.bind,
    wind: HumanBlade.wind,
    disengage: HumanBlade.disengage,
    feint: HumanBlade.feint,
    voidStep: HumanBlade.voidStep,
    riposte: HumanBlade.riposte,
    taken: HumanBlade.taken,
  },
  firearm: {
    reachHolster: HumanFirearm.reachHolster,
    takeAim: HumanFirearm.takeAim,
    lowReady: HumanFirearm.lowReady,
    highReady: HumanFirearm.highReady,
    recoil: HumanFirearm.recoil,
    surrender: HumanFirearm.surrender,
  },
  labour: {
    carryBox: HumanLabour.carryBox,
    carryBag: HumanLabour.carryBag,
    carryOnHip: HumanLabour.carryOnHip,
    pushCart: HumanLabour.pushCart,
    haul: HumanLabour.haul,
    hammer: HumanLabour.hammer,
    saw: HumanLabour.saw,
    stir: HumanLabour.stir,
    screw: HumanLabour.screw,
    scrub: HumanLabour.scrub,
    toss: HumanLabour.toss,
    hurl: HumanLabour.hurl,
    chop: HumanLabour.chop,
    sideChop: HumanLabour.sideChop,
    sledge: HumanLabour.sledge,
    dig: HumanLabour.dig,
    rake: HumanLabour.rake,
    cradleInfant: HumanLabour.cradleInfant,
    burpInfant: HumanLabour.burpInfant,
    feedInfant: HumanLabour.feedInfant,
  },
  ride: {
    ride: HumanRide.ride,
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
  carried: {
    carried: HumanCarried.carried,
    borne: HumanCarried.borne,
    bearing: HumanCarried.bearing,
    spacecraftGlide,
  },
  sport: {
    aquatic,
    stickBall,
    HumanSittingVolley,
    lunges: HumanSport.lunges,
    highKnees: HumanSport.highKnees,
    neckStretch: HumanSport.neckStretch,
    shoulderStretch: HumanSport.shoulderStretch,
    sideStretch: HumanSport.sideStretch,
    quadStretch: HumanSport.quadStretch,
    treePose: HumanSport.treePose,
    bounce: HumanSport.bounce,
    stepTouch: HumanSport.stepTouch,
    boxStep: HumanSport.boxStep,
    sprintStart: HumanSport.sprintStart,
    handstand: HumanSport.handstand,
    horseStance: HumanSport.horseStance,
    karatePunches: HumanSport.karatePunches,
    taiChiPush: HumanSport.taiChiPush,
    dribble: HumanSport.dribble,
    volleyDig: HumanSport.volleyDig,
    volleySet: HumanSport.volleySet,
    throwIn: HumanSport.throwIn,
    catcherCrouch: HumanSport.catcherCrouch,
    fieldGrounder: HumanSport.fieldGrounder,
    battingStance: HumanSport.battingStance,
    readyPosition: HumanSport.readyPosition,
    splitStep: HumanSport.splitStep,
    golfAddress: HumanSport.golfAddress,
    defensiveSlide: HumanSport.defensiveSlide,
    chairPose: HumanSport.chairPose,
    childsPose: HumanSport.childsPose,
    hipFlexorStretch: HumanSport.hipFlexorStretch,
    corpsePose: HumanSport.corpsePose,
    toeTouch: HumanSport.toeTouch,
    treadWater: HumanSport.treadWater,
    frontCrawl: HumanSport.frontCrawl,
    breaststroke: HumanSport.breaststroke,
    backstroke: HumanSport.backstroke,
    floating: HumanSport.floating,
    swimImmersed,
    tap: HumanDanceStyles.tap,
    ballet: HumanDanceStyles.ballet,
    streetGroove: HumanDanceStyles.streetGroove,
    socialDance: HumanDanceStyles.socialDance,
  },
  sportGym: {
    bearCrawl: HumanSportGym.bearCrawl,
    inchworm: HumanSportGym.inchworm,
    bentOverRow: HumanSportGym.bentOverRow,
    curl: HumanSportGym.curl,
    tricepsExtension: HumanSportGym.tricepsExtension,
    lateralRaise: HumanSportGym.lateralRaise,
    frontRaise: HumanSportGym.frontRaise,
    shrug: HumanSportGym.shrug,
    calfRaise: HumanSportGym.calfRaise,
    frontSquat: HumanSportGym.frontSquat,
    gobletSquat: HumanSportGym.gobletSquat,
    splitSquat: HumanSportGym.splitSquat,
    wallSit: HumanSportGym.wallSit,
    romanianDeadlift: HumanSportGym.romanianDeadlift,
    goodMorning: HumanSportGym.goodMorning,
    powerClean: HumanSportGym.powerClean,
    snatch: HumanSportGym.snatch,
    pikePushUp: HumanSportGym.pikePushUp,
    superman: HumanSportGym.superman,
    birdDog: HumanSportGym.birdDog,
    lyingLegRaise: HumanSportGym.lyingLegRaise,
    bicycleCrunch: HumanSportGym.bicycleCrunch,
    russianTwist: HumanSportGym.russianTwist,
    deadBug: HumanSportGym.deadBug,
    stepUp: HumanSportGym.stepUp,
    hipThrust: HumanSportGym.hipThrust,
    inclinePushUp: HumanSportGym.inclinePushUp,
    declinePushUp: HumanSportGym.declinePushUp,
    dip: HumanSportGym.dip,
  },
  sportCarry: {
    farmersWalk: HumanSportCarry.farmersWalk,
    farmersHold: HumanSportCarry.farmersHold,
    sledPush: HumanSportCarry.sledPush,
  },
  floorRoll: {
    forwardRoll: HumanFloorRoll.forwardRoll,
    backwardRoll: HumanFloorRoll.backwardRoll,
  },
};
