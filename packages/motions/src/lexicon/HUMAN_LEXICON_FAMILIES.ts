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
 * Every lexicon family's laws, by export key: each family's record names its
 * laws one by one, so the registry (`HUMAN_LEXICON`) reads them without
 * probing what a namespace exports; a namespace's other members (a gait's
 * `MARCH`, its `MOODS`) are no law and stay out.
 */
export const HUMAN_LEXICON_FAMILIES: IAutoMovieMotionHumanLexiconFamilies = {
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
  thrownWeapon: {
    throwJavelin: HumanThrownWeapon.throwJavelin,
    throwSpear: HumanThrownWeapon.throwSpear,
    throwKnife: HumanThrownWeapon.throwKnife,
    throwGrenade: HumanThrownWeapon.throwGrenade,
    hurlStone: HumanThrownWeapon.hurlStone,
    hurlBottle: HumanThrownWeapon.hurlBottle,
    sling: HumanThrownWeapon.sling,
    castAtlatl: HumanThrownWeapon.castAtlatl,
  },
  gunDrill: {
    coverVent: HumanGunDrill.coverVent,
    spongeBore: HumanGunDrill.spongeBore,
    passCharge: HumanGunDrill.passCharge,
    loadCharge: HumanGunDrill.loadCharge,
    ramCharge: HumanGunDrill.ramCharge,
    prickVent: HumanGunDrill.prickVent,
    runUp: HumanGunDrill.runUp,
    layGun: HumanGunDrill.layGun,
    hookPrimer: HumanGunDrill.hookPrimer,
    standClear: HumanGunDrill.standClear,
    pullLanyard: HumanGunDrill.pullLanyard,
  },
  musketDrill: {
    takeFirelock: HumanMusketDrill.takeFirelock,
    shoulderArms: HumanMusketDrill.shoulderArms,
    orderArms: HumanMusketDrill.orderArms,
    handleCartridge: HumanMusketDrill.handleCartridge,
    biteCartridge: HumanMusketDrill.biteCartridge,
    prime: HumanMusketDrill.prime,
    shutPan: HumanMusketDrill.shutPan,
    castAbout: HumanMusketDrill.castAbout,
    charge: HumanMusketDrill.charge,
    drawRammer: HumanMusketDrill.drawRammer,
    ramDown: HumanMusketDrill.ramDown,
    returnRammer: HumanMusketDrill.returnRammer,
    seize: HumanMusketDrill.seize,
    recover: HumanMusketDrill.recover,
    makeReady: HumanMusketDrill.makeReady,
    presentMusket: HumanMusketDrill.presentMusket,
    fireMusket: HumanMusketDrill.fireMusket,
  },
  boltAction: {
    liftBolt: HumanBoltAction.liftBolt,
    drawBolt: HumanBoltAction.drawBolt,
    closeBolt: HumanBoltAction.closeBolt,
    lowerBolt: HumanBoltAction.lowerBolt,
    seatMagazine: HumanBoltAction.seatMagazine,
    pressRelease: HumanBoltAction.pressRelease,
    dropMagazine: HumanBoltAction.dropMagazine,
  },
  revolver: {
    cock: HumanRevolver.cock,
    fanHammer: HumanRevolver.fanHammer,
    openGate: HumanRevolver.openGate,
    loadChamber: HumanRevolver.loadChamber,
    closeGate: HumanRevolver.closeGate,
  },
  archery: {
    takeArrow: HumanArchery.takeArrow,
    nockArrow: HumanArchery.nockArrow,
    presentBow: HumanArchery.presentBow,
    drawBow: HumanArchery.drawBow,
    loose: HumanArchery.loose,
    spanCrossbow: HumanArchery.spanCrossbow,
    presentCrossbow: HumanArchery.presentCrossbow,
    shootCrossbow: HumanArchery.shootCrossbow,
  },
};
