import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { HumanArchery } from "./HumanArchery";
import { HumanBoltAction } from "./HumanBoltAction";
import { HumanGunDrill } from "./HumanGunDrill";
import { HumanMusketDrill } from "./HumanMusketDrill";
import { HumanRevolver } from "./HumanRevolver";
import { HumanThrownWeapon } from "./HumanThrownWeapon";

/*
 * The laws of the lexicon's arms-drill families, from the thrown weapons to
 * archery, by export key (`HUMAN_LEXICON_FAMILIES`).
 */
export const HUMAN_LEXICON_ARMS_LAWS: Pick<
  IAutoMovieMotionHumanLexiconFamilies,
  | "thrownWeapon"
  | "gunDrill"
  | "musketDrill"
  | "boltAction"
  | "revolver"
  | "archery"
> = {
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
