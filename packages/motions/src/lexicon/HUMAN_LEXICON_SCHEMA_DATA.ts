// Written by `pnpm --filter @automovie/motions schemas` from the lexicon laws' parameter types (src/executable/lexiconSchemas.ts); do not edit by hand.
import type { HUMAN_LEXICON_SCHEMAS } from "./HUMAN_LEXICON_SCHEMAS";

/**
 * The generated schemas as data: OpenAPI 3.1 JSON schemas of every lexicon
 * row's and every action's parameters, as one typed constant the package
 * and the website read through `HUMAN_LEXICON_SCHEMAS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the data is and who reads it.
 * @evidence contracts/development/design.md#principled-representation The JSON schemas as one typed object, written by the generator.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One constant, read by `HUMAN_LEXICON_SCHEMAS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is written by hand; a stale file fails CI.
 */
export const HUMAN_LEXICON_SCHEMA_DATA: HUMAN_LEXICON_SCHEMAS.ICollection = {
  "$comment": "Written by `pnpm --filter @automovie/motions schemas` from the lexicon laws' parameter types (src/executable/lexiconSchemas.ts); do not edit by hand.",
  "version": "3.1",
  "rows": {
    "advance": {
      "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
    },
    "aim": {
      "$ref": "#/components/schemas/OmitIParamsholdkind"
    },
    "airQuotes": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "alber": {
      "$ref": "#/components/schemas/OmitIParamsguard"
    },
    "applyCream": {
      "$ref": "#/components/schemas/OmitIParamscounttask"
    },
    "applyLipstick": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "armCircles": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "armsCrossed": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "ashTap": {
      "$ref": "#/components/schemas/OmitIParamscountkindpoint"
    },
    "aSkip": {
      "$ref": "#/components/schemas/OmitIParamskind-o4"
    },
    "backhand": {
      "$ref": "#/components/schemas/OmitIParamscountkindtangentwith"
    },
    "backhandDrive": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "backSalto": {
      "$ref": "#/components/schemas/OmitIParamsway"
    },
    "backslash": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "backSquat": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "backstroke": {
      "$ref": "#/components/schemas/OmitIParamskind-o6"
    },
    "backwardRoll": {
      "$ref": "#/components/schemas/OmitIParamsdirection"
    },
    "barSwing": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "batSwing": {
      "$ref": "#/components/schemas/OmitICutfromhands"
    },
    "battingStance": {
      "$ref": "#/components/schemas/OmitIParamskind-o7"
    },
    "bearCrawl": {
      "$ref": "#/components/schemas/OmitIParamskind-o12"
    },
    "bearing": {
      "$ref": "#/components/schemas/HumanCarried.IBearing"
    },
    "beat": {
      "$ref": "#/components/schemas/OmitIParryhold"
    },
    "benchPress": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "bentOverRow": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "bicycleCrunch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "bigStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o1"
    },
    "bind": {
      "$ref": "#/components/schemas/OmitIParryhold"
    },
    "birdDog": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "blownKiss": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "blownKissSend": {
      "$ref": "#/components/schemas/OmitIParamsholdkindtargetwith"
    },
    "blowNose": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "borne": {
      "$ref": "#/components/schemas/HumanCarried.IBorne"
    },
    "bounce": {
      "$ref": "#/components/schemas/OmitIParamskind-o5"
    },
    "boxJump": {
      "$ref": "#/components/schemas/OmitIParamsnever-o3"
    },
    "boxStep": {
      "$ref": "#/components/schemas/OmitIParamskind-o5"
    },
    "braceForImpact": {
      "$ref": "#/components/schemas/OmitIParamskind-o2"
    },
    "breaststroke": {
      "$ref": "#/components/schemas/OmitIParamskind-o6"
    },
    "bSkip": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "bunt": {
      "$ref": "#/components/schemas/OmitIParamsguardhands"
    },
    "burpee": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "buttKicks": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "calfRaise": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "calfStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "carried": {
      "$ref": "#/components/schemas/HumanCarried.IParams"
    },
    "carryBag": {
      "$ref": "#/components/schemas/OmitIParamshow"
    },
    "carryBox": {
      "$ref": "#/components/schemas/OmitIParamshow"
    },
    "carryOnHip": {
      "$ref": "#/components/schemas/OmitIParamshow"
    },
    "cartwheelLeft": {
      "$ref": "#/components/schemas/OmitIParamsto"
    },
    "cartwheelRight": {
      "$ref": "#/components/schemas/OmitIParamsto"
    },
    "catcherCrouch": {
      "$ref": "#/components/schemas/OmitIParamskind-o7"
    },
    "chairPose": {
      "$ref": "#/components/schemas/OmitIParamsdepthhold"
    },
    "chase": {
      "$ref": "#/components/schemas/OmitIParamsatpacetrack"
    },
    "checkPhone": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "checkSwing": {
      "$ref": "#/components/schemas/OmitICutfeintfromhands"
    },
    "checkWatch": {
      "$ref": "#/components/schemas/OmitIParamssidetask"
    },
    "cheekKiss": {
      "$ref": "#/components/schemas/OmitIParamsregion"
    },
    "chestStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "chestTrap": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "childsPose": {
      "$ref": "#/components/schemas/OmitIParamsholdkind-o1"
    },
    "chinUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "choke": {
      "$ref": "#/components/schemas/OmitIParamscountholdkindwith"
    },
    "closedHold": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "clubStrike": {
      "$ref": "#/components/schemas/OmitICutfromtip"
    },
    "clubSwing": {
      "$ref": "#/components/schemas/OmitICutfromtip"
    },
    "cobra": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "comeHere": {
      "$ref": "#/components/schemas/OmitIParamskind"
    },
    "comfort": {
      "$ref": "#/components/schemas/OmitIParamsholdkindwith"
    },
    "confront": {
      "$ref": "#/components/schemas/OmitIParamsatside"
    },
    "corpsePose": {
      "$ref": "#/components/schemas/OmitIParamsholdposition"
    },
    "countFive": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "countFour": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "countOne": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "countThree": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "countTwo": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "coverEars": {
      "$ref": "#/components/schemas/OmitIParamskindothersidetargetwith"
    },
    "coverMouth": {
      "$ref": "#/components/schemas/OmitIParamskindsidetargetwith"
    },
    "cross": {
      "$ref": "#/components/schemas/OmitIParamshandtechnique"
    },
    "crossedFingers": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "crunch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "curl": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "cut": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "cycling": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "danceFollow": {
      "$ref": "#/components/schemas/OmitIParamsatpacesidetrack"
    },
    "danceHold": {
      "$ref": "#/components/schemas/OmitIParamsholdkindsidewith"
    },
    "danceLead": {
      "$ref": "#/components/schemas/OmitIParamspace"
    },
    "dash": {
      "$ref": "#/components/schemas/OmitIParamspace-o1"
    },
    "deadBug": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "deadHang": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "deadlift": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "declinePushUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "defensiveSlide": {
      "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
    },
    "dip": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "disengage": {
      "$ref": "#/components/schemas/OmitIAttacknever"
    },
    "diveForCover": {
      "$ref": "#/components/schemas/OmitIParamsholdposition"
    },
    "dodge": {
      "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
    },
    "dontKnow": {
      "$ref": "#/components/schemas/OmitIParamskind"
    },
    "doubleTime": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "downwardDog": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "draw": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "drawFirearm": {
      "$ref": "#/components/schemas/OmitIParamshandleliftuse"
    },
    "dribble": {
      "$ref": "#/components/schemas/OmitIParamskind-o8"
    },
    "drunk": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "duck": {
      "$ref": "#/components/schemas/OmitIParamsdepthhold"
    },
    "enGarde": {
      "$ref": "#/components/schemas/OmitIParamsguard"
    },
    "escort": {
      "$ref": "#/components/schemas/OmitIParamsatsidetrack"
    },
    "facepalm": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "fanSelf": {
      "$ref": "#/components/schemas/OmitIParamscountkind"
    },
    "farmersHold": {
      "$ref": "#/components/schemas/OmitIParamsnever-o2"
    },
    "farmersWalk": {
      "$ref": "#/components/schemas/OmitIParamsarmSwingpace"
    },
    "feint": {
      "$ref": "#/components/schemas/OmitICutfeint"
    },
    "fieldGrounder": {
      "$ref": "#/components/schemas/OmitIParamskind-o7"
    },
    "fingerSnap": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "fireFirearm": {
      "$ref": "#/components/schemas/HumanWeaponFirearm.IWield"
    },
    "firmPress": {
      "$ref": "#/components/schemas/OmitIParamskindmannerwith"
    },
    "fistBump": {
      "$ref": "#/components/schemas/OmitIParamskind-o3"
    },
    "fistPump": {
      "$ref": "#/components/schemas/OmitIParamskind-o1"
    },
    "flee": {
      "$ref": "#/components/schemas/HumanPursuit.IFlee"
    },
    "flickHair": {
      "$ref": "#/components/schemas/OmitIParamskindsidetargetwith"
    },
    "flickOff": {
      "$ref": "#/components/schemas/OmitIParamskindmannerwith"
    },
    "floating": {
      "$ref": "#/components/schemas/OmitIParamskind-o6"
    },
    "follow": {
      "$ref": "#/components/schemas/OmitIParamsatsidetrack"
    },
    "forehand": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "foreheadKiss": {
      "$ref": "#/components/schemas/OmitIParamsregion"
    },
    "forwardRoll": {
      "$ref": "#/components/schemas/OmitIParamsdirection"
    },
    "fosburyFlop": {
      "$ref": "#/components/schemas/OmitIParamsnever-o4"
    },
    "frontCrawl": {
      "$ref": "#/components/schemas/OmitIParamskind-o6"
    },
    "frontHandspring": {
      "$ref": "#/components/schemas/OmitIParamsnever-o5"
    },
    "frontKick": {
      "$ref": "#/components/schemas/OmitIParamslegtechnique"
    },
    "frontRaise": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "frontSalto": {
      "$ref": "#/components/schemas/OmitIParamsway"
    },
    "frontSquat": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "frontStance": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "getIn": {
      "$ref": "#/components/schemas/HumanTravelCar.IParams"
    },
    "gloveCatch": {
      "$ref": "#/components/schemas/OmitIParamshands"
    },
    "gluteBridge": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "goalkeeperDiveLeft": {
      "$ref": "#/components/schemas/OmitIParamskindside"
    },
    "goalkeeperDiveRight": {
      "$ref": "#/components/schemas/OmitIParamskindside"
    },
    "gobletSquat": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "golfAddress": {
      "$ref": "#/components/schemas/OmitIParamskind-o9"
    },
    "golfSwing": {
      "$ref": "#/components/schemas/OmitICutfromhands"
    },
    "goodMorning": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "grab": {
      "$ref": "#/components/schemas/OmitIParamscountkindwith"
    },
    "grabbed": {
      "$ref": "#/components/schemas/OmitIParamspartway"
    },
    "hairPull": {
      "$ref": "#/components/schemas/OmitIParamscountholdkindwith"
    },
    "halt": {
      "$ref": "#/components/schemas/OmitIParamskind"
    },
    "hammer": {
      "$ref": "#/components/schemas/OmitIParamscyclestool"
    },
    "hammerTurn": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "handOnHeart": {
      "$ref": "#/components/schemas/OmitIParamskindsidetargetwith"
    },
    "handsBehindHead": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "handsClasped": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "handsInPockets": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "handsOnHips": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "handspringVault": {
      "$ref": "#/components/schemas/OmitIParamsnever-o6"
    },
    "handstand": {
      "$ref": "#/components/schemas/OmitIParamsnever"
    },
    "handsUp": {
      "$ref": "#/components/schemas/OmitIParamskind"
    },
    "haul": {
      "$ref": "#/components/schemas/OmitIParamshowloadpace"
    },
    "header": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "headlock": {
      "$ref": "#/components/schemas/OmitIParamshold-o2"
    },
    "highKnees": {
      "$ref": "#/components/schemas/OmitIParamskind-o4"
    },
    "highReady": {
      "$ref": "#/components/schemas/OmitIPresentcarriage"
    },
    "hipFlexorStretch": {
      "$ref": "#/components/schemas/OmitIParamsholdkind-o1"
    },
    "hipThrust": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "holsterFirearm": {
      "$ref": "#/components/schemas/OmitIParamsnever-o8"
    },
    "hook": {
      "$ref": "#/components/schemas/OmitIParamshandtechnique"
    },
    "horseStance": {
      "$ref": "#/components/schemas/OmitIParamskind-o10"
    },
    "hurdlerStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "hurl": {
      "$ref": "#/components/schemas/OmitIParamsstyle"
    },
    "hurry": {
      "$ref": "#/components/schemas/OmitIParamsarmSwingpacestride"
    },
    "hush": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "inchworm": {
      "$ref": "#/components/schemas/OmitIParamskind-o12"
    },
    "inclinePushUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "intercept": {
      "$ref": "#/components/schemas/HumanPursuit.IIntercept"
    },
    "jab": {
      "$ref": "#/components/schemas/OmitIParamshandtechnique"
    },
    "jog": {
      "$ref": "#/components/schemas/OmitIParamspace-o1"
    },
    "judoBroken": {
      "$ref": "#/components/schemas/OmitIParamsdepth"
    },
    "judoGrip": {
      "$ref": "#/components/schemas/OmitIParamsgriphold"
    },
    "jumpingJacks": {
      "$ref": "#/components/schemas/OmitIParamskind-o4"
    },
    "jumpRope": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "karatePunches": {
      "$ref": "#/components/schemas/OmitIParamskind-o10"
    },
    "kettlebellSwing": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "kickLeft": {
      "$ref": "#/components/schemas/OmitIParamsfoot"
    },
    "kickRight": {
      "$ref": "#/components/schemas/OmitIParamsfoot"
    },
    "kneelBriefly": {
      "$ref": "#/components/schemas/OmitIParamsholdrise"
    },
    "kneelSit": {
      "$ref": "#/components/schemas/OmitIParamsholdkindrise"
    },
    "kneeRaise": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "knifeBackslash": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "knifeSlash": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "knifeStab": {
      "$ref": "#/components/schemas/OmitIAttacknever"
    },
    "lateralRaise": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "leanBack": {
      "$ref": "#/components/schemas/OmitIParamspartway"
    },
    "leap": {
      "$ref": "#/components/schemas/OmitIParamsnever-o3"
    },
    "legSwings": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "lieStill": {
      "$ref": "#/components/schemas/OmitIParamshold"
    },
    "lightCigarette": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "limp": {
      "$ref": "#/components/schemas/HumanGait.ILimp"
    },
    "lowBlock": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "lowFive": {
      "$ref": "#/components/schemas/OmitIParamskind-o3"
    },
    "lowReady": {
      "$ref": "#/components/schemas/OmitIPresentcarriage"
    },
    "lunge": {
      "$ref": "#/components/schemas/OmitIAttackadvance"
    },
    "lunges": {
      "$ref": "#/components/schemas/OmitIParamskind-o4"
    },
    "lungeTwist": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "lyingLegRaise": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "march": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "mountainClimber": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "mountainPose": {
      "$ref": "#/components/schemas/OmitIParamsseconds"
    },
    "neckRoll": {
      "$ref": "#/components/schemas/OmitIParamskind-o1"
    },
    "neckStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o11"
    },
    "ochs": {
      "$ref": "#/components/schemas/OmitIParamsguard"
    },
    "okSign": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "openDoor": {
      "$ref": "#/components/schemas/HumanTravelLeaf.IParams"
    },
    "overheadPress": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "overheadSmash": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "palmsTogether": {
      "$ref": "#/components/schemas/OmitIParamskind"
    },
    "paradeRest": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "parry": {
      "$ref": "#/components/schemas/OmitIParrynever"
    },
    "passThrough": {
      "$ref": "#/components/schemas/HumanTravelDoor.IParams"
    },
    "pflug": {
      "$ref": "#/components/schemas/OmitIParamsguard"
    },
    "photograph": {
      "$ref": "#/components/schemas/OmitIParamsgraspotherpointtask"
    },
    "pikePushUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "pinkyPromise": {
      "$ref": "#/components/schemas/OmitIParamskind-o3"
    },
    "pitch": {
      "$ref": "#/components/schemas/OmitIParamsstyle"
    },
    "plank": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "pnfHamstring": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "poke": {
      "$ref": "#/components/schemas/OmitIParamskindwith"
    },
    "powerClean": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "presentFirearm": {
      "$ref": "#/components/schemas/HumanWeaponFirearm.IPresent"
    },
    "proud": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "prowl": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "pullUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "pushCart": {
      "$ref": "#/components/schemas/OmitIParamshow"
    },
    "pushed": {
      "$ref": "#/components/schemas/OmitIParamsintensitypartway"
    },
    "pushPass": {
      "$ref": "#/components/schemas/OmitIParamsstyle"
    },
    "pushUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "putt": {
      "$ref": "#/components/schemas/OmitICutfromhands"
    },
    "quadStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o11"
    },
    "reachHolster": {
      "$ref": "#/components/schemas/OmitIParamsholdkindsidetargetwith"
    },
    "readingWalk": {
      "$ref": "#/components/schemas/OmitIParamspace"
    },
    "readyPosition": {
      "$ref": "#/components/schemas/OmitIParamskind-o9"
    },
    "recoil": {
      "$ref": "#/components/schemas/OmitIWieldnever"
    },
    "relayIncoming": {
      "$ref": "#/components/schemas/OmitIParamsrole"
    },
    "relayOutgoing": {
      "$ref": "#/components/schemas/OmitIParamsrole"
    },
    "reloadFirearm": {
      "$ref": "#/components/schemas/OmitIParamscountkindsidewith"
    },
    "restrain": {
      "$ref": "#/components/schemas/OmitIParamshold-o2"
    },
    "retreat": {
      "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
    },
    "ride": {
      "$ref": "#/components/schemas/HumanRide.IParams"
    },
    "riposte": {
      "$ref": "#/components/schemas/OmitIAttacknever"
    },
    "risingBlock": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "romanianDeadlift": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "roundKick": {
      "$ref": "#/components/schemas/OmitIParamslegtechnique"
    },
    "roundOffLeft": {
      "$ref": "#/components/schemas/OmitIParamslead"
    },
    "roundOffRight": {
      "$ref": "#/components/schemas/OmitIParamslead"
    },
    "rowing": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "rubEyes": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "russianTwist": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "sad": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "salute": {
      "$ref": "#/components/schemas/OmitIParamselbowkindsidetargetwith"
    },
    "saw": {
      "$ref": "#/components/schemas/OmitIParamstool"
    },
    "scratchNape": {
      "$ref": "#/components/schemas/OmitIParamskindtargetwith"
    },
    "screw": {
      "$ref": "#/components/schemas/OmitIParamstool"
    },
    "scrub": {
      "$ref": "#/components/schemas/OmitIParamscycles"
    },
    "seatedFold": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "selfie": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "shakeFist": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "shave": {
      "$ref": "#/components/schemas/OmitIParamscountholdkindtangenttarget"
    },
    "shoulderPat": {
      "$ref": "#/components/schemas/OmitIParamscountkindwith"
    },
    "shoulderStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o11"
    },
    "shove": {
      "$ref": "#/components/schemas/OmitIParamscountkindwith"
    },
    "shoved": {
      "$ref": "#/components/schemas/OmitIParamsspeed"
    },
    "shrug": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "sidePlank": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "sideStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o11"
    },
    "sitCrossLegged": {
      "$ref": "#/components/schemas/OmitIParamsholdposition"
    },
    "sitOnFloor": {
      "$ref": "#/components/schemas/OmitIParamsholdposition"
    },
    "sitSideways": {
      "$ref": "#/components/schemas/OmitIParamsholdposition"
    },
    "sitUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "slap": {
      "$ref": "#/components/schemas/OmitIParamscountkindtangentwith"
    },
    "slapped": {
      "$ref": "#/components/schemas/OmitIParamspartway"
    },
    "slash": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "sledPush": {
      "$ref": "#/components/schemas/OmitIParamslean"
    },
    "slidingTackle": {
      "$ref": "#/components/schemas/OmitIParamskind-o14"
    },
    "smoke": {
      "$ref": "#/components/schemas/OmitIParamssecondstask"
    },
    "snatch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "sneak": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "sniff": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "southpaw": {
      "$ref": "#/components/schemas/OmitIParamsstance"
    },
    "spike": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "spin": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "splitSquat": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "splitStep": {
      "$ref": "#/components/schemas/OmitIParamskind-o9"
    },
    "sprint": {
      "$ref": "#/components/schemas/OmitIParamspace-o1"
    },
    "sprintStart": {
      "$ref": "#/components/schemas/OmitIParamsnever-o1"
    },
    "squats": {
      "$ref": "#/components/schemas/OmitIParamskind-o4"
    },
    "squatSit": {
      "$ref": "#/components/schemas/OmitIParamsdepthheelshold"
    },
    "stab": {
      "$ref": "#/components/schemas/OmitIAttacknever"
    },
    "stabOverhand": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "stageSlap": {
      "$ref": "#/components/schemas/OmitIParamsclearcountkindtangentwith"
    },
    "startle": {
      "$ref": "#/components/schemas/OmitIParamsintensity"
    },
    "stepTouch": {
      "$ref": "#/components/schemas/OmitIParamskind-o5"
    },
    "stepUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "stiffLimp": {
      "$ref": "#/components/schemas/HumanGait.ILimp"
    },
    "stir": {
      "$ref": "#/components/schemas/OmitIParamstool"
    },
    "strides": {
      "$ref": "#/components/schemas/OmitIParamspace-o1"
    },
    "stroll": {
      "$ref": "#/components/schemas/OmitIParamsarmSwingpacestride"
    },
    "struggle": {
      "$ref": "#/components/schemas/OmitIParamscountholdkindwith"
    },
    "stubOut": {
      "$ref": "#/components/schemas/OmitIParamscountkindpoint"
    },
    "stumble": {
      "$ref": "#/components/schemas/OmitIParamsspeed"
    },
    "sunSalutation": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "superman": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "surrender": {
      "$ref": "#/components/schemas/OmitIParamsholdkind"
    },
    "swagger": {
      "$ref": "#/components/schemas/OmitIParamsarmSwingelbowspace"
    },
    "sway": {
      "$ref": "#/components/schemas/OmitIParamskind-o5"
    },
    "swordCut": {
      "$ref": "#/components/schemas/HumanSword.ICut"
    },
    "swordGuard": {
      "$ref": "#/components/schemas/HumanSwordGuard.IParams"
    },
    "swordParry": {
      "$ref": "#/components/schemas/HumanSwordParry.IParry"
    },
    "swordThrust": {
      "$ref": "#/components/schemas/HumanSword.IAttack"
    },
    "taiChiPush": {
      "$ref": "#/components/schemas/OmitIParamskind-o10"
    },
    "takeAim": {
      "$ref": "#/components/schemas/OmitIPresentcarriage"
    },
    "takeAKnee": {
      "$ref": "#/components/schemas/OmitIParamsholdrise"
    },
    "takeCover": {
      "$ref": "#/components/schemas/OmitIParamshold-o1"
    },
    "thighTrap": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "thinking": {
      "$ref": "#/components/schemas/OmitIParamsleftright"
    },
    "throwIn": {
      "$ref": "#/components/schemas/OmitIParamskind-o8"
    },
    "thrust": {
      "$ref": "#/components/schemas/OmitIAttacknever"
    },
    "thumbsDown": {
      "$ref": "#/components/schemas/OmitIParamsaimkindshape"
    },
    "thumbsUp": {
      "$ref": "#/components/schemas/OmitIParamsaimkindshapeturn"
    },
    "tiptoe": {
      "$ref": "#/components/schemas/HumanGait.IParams"
    },
    "toastSip": {
      "$ref": "#/components/schemas/OmitIParamstask"
    },
    "toeTouch": {
      "$ref": "#/components/schemas/OmitIParamsholdtoward"
    },
    "topspin": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "toss": {
      "$ref": "#/components/schemas/OmitIParamsstyle"
    },
    "traverse": {
      "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
    },
    "treadWater": {
      "$ref": "#/components/schemas/OmitIParamskind-o6"
    },
    "treePose": {
      "$ref": "#/components/schemas/OmitIParamskind-o11"
    },
    "triangle": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "tricepsExtension": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "tricepsStretch": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "trudge": {
      "$ref": "#/components/schemas/OmitIParamsarmSwingpacestride"
    },
    "twoHandBackhand": {
      "$ref": "#/components/schemas/OmitICutfromhands"
    },
    "twoHandCatch": {
      "$ref": "#/components/schemas/OmitIParamshands"
    },
    "underarmPitch": {
      "$ref": "#/components/schemas/OmitIParamsstyle"
    },
    "underarmTurn": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "uppercut": {
      "$ref": "#/components/schemas/OmitIParamshandtechnique"
    },
    "vaultOnPole": {
      "$ref": "#/components/schemas/OmitIParamsnever-o7"
    },
    "victory": {
      "$ref": "#/components/schemas/OmitIParamskind-o1"
    },
    "victorySign": {
      "$ref": "#/components/schemas/OmitIParamskindshape"
    },
    "voidStep": {
      "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
    },
    "volley": {
      "$ref": "#/components/schemas/OmitICutfrom"
    },
    "volleyDig": {
      "$ref": "#/components/schemas/OmitIParamskind-o8"
    },
    "volleySet": {
      "$ref": "#/components/schemas/OmitIParamskind-o8"
    },
    "vomTag": {
      "$ref": "#/components/schemas/OmitIParamsguard"
    },
    "wallSit": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "warriorOne": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "warriorTwo": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "whisper": {
      "$ref": "#/components/schemas/OmitIParamsholdregion"
    },
    "widePushUp": {
      "$ref": "#/components/schemas/OmitIParamskind-o13"
    },
    "wince": {
      "$ref": "#/components/schemas/OmitIParamsintensity"
    },
    "wind": {
      "$ref": "#/components/schemas/OmitIAttacknever"
    }
  },
  "actions": {
    "approach": {
      "$ref": "#/components/schemas/approach.IParams",
      "description": "Walking up to a target."
    },
    "athletics": {
      "$ref": "#/components/schemas/athletics.IParams",
      "description": "The sprint start."
    },
    "ballSport": {
      "$ref": "#/components/schemas/ballSport.IParams",
      "description": "A team ball skill."
    },
    "baseball": {
      "$ref": "#/components/schemas/baseball.IParams",
      "description": "A baseball position."
    },
    "bend": {
      "$ref": "#/components/schemas/bend.IParams",
      "description": "Bending to a low point."
    },
    "brace": {
      "$ref": "#/components/schemas/brace.IParams",
      "description": "Bracing for a force."
    },
    "carry": {
      "$ref": "#/components/schemas/carry.IParams",
      "description": "Walking with a load."
    },
    "catchObject": {
      "$ref": "#/components/schemas/catchObject.IParams",
      "description": "Catching an object."
    },
    "climbLadder": {
      "$ref": "#/components/schemas/climbLadder.IParams",
      "description": "Climbing a ladder."
    },
    "climbStairs": {
      "$ref": "#/components/schemas/climbStairs.IParams",
      "description": "Climbing stairs."
    },
    "clinch": {
      "$ref": "#/components/schemas/clinch.IParams",
      "description": "A clinch grip."
    },
    "crawl": {
      "$ref": "#/components/schemas/crawl.IParams",
      "description": "Crawling."
    },
    "crouch": {
      "$ref": "#/components/schemas/crouch.IParams",
      "description": "A crouch or squat."
    },
    "dance": {
      "$ref": "#/components/schemas/dance.IParams",
      "description": "A dance step."
    },
    "defend": {
      "$ref": "#/components/schemas/defend.IParams",
      "description": "A defence against one strike."
    },
    "dress": {
      "$ref": "#/components/schemas/dress.IParams",
      "description": "Putting on a hat or glasses."
    },
    "exercise": {
      "$ref": "#/components/schemas/exercise.IParams",
      "description": "A bodyweight exercise."
    },
    "flinch": {
      "$ref": "#/components/schemas/flinch.IParams",
      "description": "The protective startle."
    },
    "gesture": {
      "$ref": "#/components/schemas/gesture.IParams",
      "description": "A communicative gesture."
    },
    "guard": {
      "$ref": "#/components/schemas/guard.IParams",
      "description": "The fighting guard."
    },
    "gymnastics": {
      "$ref": "#/components/schemas/gymnastics.IParams",
      "description": "A handstand."
    },
    "handOver": {
      "$ref": "#/components/schemas/handOver.IParams",
      "description": "Handing a prop over."
    },
    "handshake": {
      "$ref": "#/components/schemas/handshake.IParams",
      "description": "A handshake."
    },
    "handToFace": {
      "$ref": "#/components/schemas/handToFace.IParams",
      "description": "A hand-to-face task."
    },
    "highFive": {
      "$ref": "#/components/schemas/highFive.IParams",
      "description": "A high five."
    },
    "jump": {
      "$ref": "#/components/schemas/jump.IParams",
      "description": "Jumping to a floor point."
    },
    "kick": {
      "$ref": "#/components/schemas/kick.IParams",
      "description": "A kick."
    },
    "kickBall": {
      "$ref": "#/components/schemas/kickBall.IParams",
      "description": "Kicking a ball."
    },
    "kiss": {
      "$ref": "#/components/schemas/kiss.IParams",
      "description": "A kiss."
    },
    "knee": {
      "$ref": "#/components/schemas/knee.IParams",
      "description": "A knee strike."
    },
    "kneel": {
      "$ref": "#/components/schemas/kneel.IParams",
      "description": "Kneeling."
    },
    "knockdown": {
      "$ref": "#/components/schemas/knockdown.IParams",
      "description": "Going down to lie supine."
    },
    "lieDown": {
      "$ref": "#/components/schemas/lieDown.IParams",
      "description": "Lying down."
    },
    "look": {
      "$ref": "#/components/schemas/look.IParams",
      "description": "Looking at a target."
    },
    "martialArt": {
      "$ref": "#/components/schemas/martialArt.IParams",
      "description": "A martial-art technique."
    },
    "operate": {
      "$ref": "#/components/schemas/operate.IParams",
      "description": "Operating a mechanism."
    },
    "pickUp": {
      "$ref": "#/components/schemas/pickUp.IParams",
      "description": "Picking a prop up."
    },
    "punch": {
      "$ref": "#/components/schemas/punch.IParams",
      "description": "A punch."
    },
    "putDown": {
      "$ref": "#/components/schemas/putDown.IParams",
      "description": "Putting a prop down."
    },
    "racket": {
      "$ref": "#/components/schemas/racket.IParams",
      "description": "A racket or golf position."
    },
    "receive": {
      "$ref": "#/components/schemas/receive.IParams",
      "description": "Receiving a prop."
    },
    "rest": {
      "$ref": "#/components/schemas/rest.IParams",
      "description": "The hands at rest places."
    },
    "rise": {
      "$ref": "#/components/schemas/rise.IParams",
      "description": "Standing up from a seat."
    },
    "run": {
      "$ref": "#/components/schemas/run.IParams",
      "description": "Running to a floor point."
    },
    "selfAction": {
      "$ref": "#/components/schemas/selfAction.IParams",
      "description": "A whole-body self action."
    },
    "shift": {
      "$ref": "#/components/schemas/shift.IParams",
      "description": "Edging along a seat."
    },
    "sit": {
      "$ref": "#/components/schemas/sit.IParams",
      "description": "Sitting down."
    },
    "stagger": {
      "$ref": "#/components/schemas/stagger.IParams",
      "description": "A capture step after a push."
    },
    "stand": {
      "$ref": "#/components/schemas/stand.IParams",
      "description": "Quiet standing."
    },
    "step": {
      "$ref": "#/components/schemas/step.IParams",
      "description": "Fighting-stance footwork."
    },
    "stepOver": {
      "$ref": "#/components/schemas/stepOver.IParams",
      "description": "Stepping over an obstacle."
    },
    "stretch": {
      "$ref": "#/components/schemas/stretch.IParams",
      "description": "A static stretch."
    },
    "swim": {
      "$ref": "#/components/schemas/swim.IParams",
      "description": "Swimming."
    },
    "throwObject": {
      "$ref": "#/components/schemas/throwObject.IParams",
      "description": "Throwing an object."
    },
    "touch": {
      "$ref": "#/components/schemas/touch.IParams",
      "description": "A touch on a region."
    },
    "typeText": {
      "$ref": "#/components/schemas/typeText.IParams",
      "description": "Typing a text."
    },
    "useTool": {
      "$ref": "#/components/schemas/useTool.IParams",
      "description": "Working a tool."
    },
    "walk": {
      "$ref": "#/components/schemas/walk.IParams",
      "description": "Walking to a floor point."
    },
    "wipe": {
      "$ref": "#/components/schemas/wipe.IParams",
      "description": "Wiping a surface."
    }
  },
  "components": {
    "schemas": {
      "IHumanLexiconParams": {
        "type": "object",
        "properties": {
          "emblem": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged"
          },
          "habit": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o1"
          },
          "stance": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o2"
          },
          "pose": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o3"
          },
          "gait": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o4"
          },
          "pursuit": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o5"
          },
          "social": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o6"
          },
          "stageFight": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o7"
          },
          "drill": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o8"
          },
          "blade": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o9"
          },
          "firearm": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o10"
          },
          "labour": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o11"
          },
          "ride": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o12"
          },
          "carried": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o13"
          },
          "sport": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o14"
          },
          "sportGym": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o15"
          },
          "sportCarry": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o16"
          },
          "floorRoll": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o17"
          },
          "floorFall": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o18"
          },
          "sportSwing": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o19"
          },
          "sportThrow": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o20"
          },
          "sportWorkout": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o21"
          },
          "gymnastics": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o22"
          },
          "sword": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o23"
          },
          "weaponFirearm": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o24"
          },
          "weaponMelee": {
            "$ref": "#/components/schemas/IHumanLexiconParams.Merged-o25"
          }
        },
        "required": [
          "emblem",
          "habit",
          "stance",
          "pose",
          "gait",
          "pursuit",
          "social",
          "stageFight",
          "drill",
          "blade",
          "firearm",
          "labour",
          "ride",
          "carried",
          "sport",
          "sportGym",
          "sportCarry",
          "floorRoll",
          "floorFall",
          "sportSwing",
          "sportThrow",
          "sportWorkout",
          "gymnastics",
          "sword",
          "weaponFirearm",
          "weaponMelee"
        ],
        "additionalProperties": false,
        "description": "The parameters every row of the lexicon leaves open, by family and by the\nrow's export name in its namespace: what an author writes in\n`registered(row, params)`, read from the row's own law type, so a page or\na generator reads the same parameters the checker does. A row's fixed\nparameters are not among them. A row is registered under its law's\n`name`, which a type cannot read, so a reader that wants rows by name\n(`HUMAN_LEXICON_SCHEMAS`) pairs each export with its law at run time.\n\nIt is derived from `HUMAN_LEXICON_FAMILIES`: each family namespace's\nmembers that plan, keyed by their export name, each with the parameters\nits `plan` takes."
      },
      "IHumanLexiconParams.Merged": {
        "type": "object",
        "properties": {
          "airQuotes": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "blownKiss": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "blownKissSend": {
            "$ref": "#/components/schemas/OmitIParamsholdkindtargetwith"
          },
          "comeHere": {
            "$ref": "#/components/schemas/OmitIParamskind"
          },
          "countFive": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "countFour": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "countOne": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "countThree": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "countTwo": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "coverEars": {
            "$ref": "#/components/schemas/OmitIParamskindothersidetargetwith"
          },
          "coverMouth": {
            "$ref": "#/components/schemas/OmitIParamskindsidetargetwith"
          },
          "crossedFingers": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "dontKnow": {
            "$ref": "#/components/schemas/OmitIParamskind"
          },
          "facepalm": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "fingerSnap": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "halt": {
            "$ref": "#/components/schemas/OmitIParamskind"
          },
          "handOnHeart": {
            "$ref": "#/components/schemas/OmitIParamskindsidetargetwith"
          },
          "handsUp": {
            "$ref": "#/components/schemas/OmitIParamskind"
          },
          "hush": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "okSign": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "palmsTogether": {
            "$ref": "#/components/schemas/OmitIParamskind"
          },
          "salute": {
            "$ref": "#/components/schemas/OmitIParamselbowkindsidetargetwith"
          },
          "shakeFist": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          },
          "thumbsDown": {
            "$ref": "#/components/schemas/OmitIParamsaimkindshape"
          },
          "thumbsUp": {
            "$ref": "#/components/schemas/OmitIParamsaimkindshapeturn"
          },
          "victorySign": {
            "$ref": "#/components/schemas/OmitIParamskindshape"
          }
        },
        "required": [
          "airQuotes",
          "blownKiss",
          "blownKissSend",
          "comeHere",
          "countFive",
          "countFour",
          "countOne",
          "countThree",
          "countTwo",
          "coverEars",
          "coverMouth",
          "crossedFingers",
          "dontKnow",
          "facepalm",
          "fingerSnap",
          "halt",
          "handOnHeart",
          "handsUp",
          "hush",
          "okSign",
          "palmsTogether",
          "salute",
          "shakeFist",
          "thumbsDown",
          "thumbsUp",
          "victorySign"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamskindshape": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Stroke repetitions (waves, nods, claps); the gesture's own count when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Post-stroke hold, seconds; 0 when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "turn": {
            "type": "number",
            "description": "Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent."
          },
          "aim": {
            "type": "object",
            "properties": {
              "digit": {
                "oneOf": [
                  {
                    "const": "forefinger"
                  },
                  {
                    "const": "thumb"
                  }
                ]
              },
              "toward": {
                "oneOf": [
                  {
                    "const": "down"
                  },
                  {
                    "const": "up"
                  }
                ]
              }
            },
            "required": [
              "digit",
              "toward"
            ],
            "additionalProperties": false,
            "description": "A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "AutoMovieHumanoidRegion": {
        "oneOf": [
          {
            "const": "abdomen"
          },
          {
            "const": "calfLeft"
          },
          {
            "const": "calfRight"
          },
          {
            "const": "cheekLeft"
          },
          {
            "const": "cheekRight"
          },
          {
            "const": "chestLeft"
          },
          {
            "const": "chestRight"
          },
          {
            "const": "chin"
          },
          {
            "const": "crown"
          },
          {
            "const": "earLeft"
          },
          {
            "const": "earRight"
          },
          {
            "const": "elbowLeft"
          },
          {
            "const": "elbowRight"
          },
          {
            "const": "face"
          },
          {
            "const": "footTopLeft"
          },
          {
            "const": "footTopRight"
          },
          {
            "const": "forearmLeft"
          },
          {
            "const": "forearmRight"
          },
          {
            "const": "forehead"
          },
          {
            "const": "groin"
          },
          {
            "const": "handBackLeft"
          },
          {
            "const": "handBackRight"
          },
          {
            "const": "headBack"
          },
          {
            "const": "heelLeft"
          },
          {
            "const": "heelRight"
          },
          {
            "const": "hipLeft"
          },
          {
            "const": "hipRight"
          },
          {
            "const": "indexTipLeft"
          },
          {
            "const": "indexTipRight"
          },
          {
            "const": "jawLeft"
          },
          {
            "const": "jawRight"
          },
          {
            "const": "kidneyLeft"
          },
          {
            "const": "kidneyRight"
          },
          {
            "const": "kneeLeft"
          },
          {
            "const": "kneeRight"
          },
          {
            "const": "liver"
          },
          {
            "const": "lowerBack"
          },
          {
            "const": "mouth"
          },
          {
            "const": "nape"
          },
          {
            "const": "neckLeft"
          },
          {
            "const": "neckRight"
          },
          {
            "const": "nose"
          },
          {
            "const": "noseBridge"
          },
          {
            "const": "palmLeft"
          },
          {
            "const": "palmRight"
          },
          {
            "const": "pocketFrontLeft"
          },
          {
            "const": "pocketFrontRight"
          },
          {
            "const": "ribsLeft"
          },
          {
            "const": "ribsRight"
          },
          {
            "const": "seat"
          },
          {
            "const": "shinLeft"
          },
          {
            "const": "shinRight"
          },
          {
            "const": "shoulderLeft"
          },
          {
            "const": "shoulderRight"
          },
          {
            "const": "solarPlexus"
          },
          {
            "const": "soleLeft"
          },
          {
            "const": "soleRight"
          },
          {
            "const": "spleen"
          },
          {
            "const": "sternum"
          },
          {
            "const": "templeLeft"
          },
          {
            "const": "templeRight"
          },
          {
            "const": "thighFrontLeft"
          },
          {
            "const": "thighFrontRight"
          },
          {
            "const": "thighInnerLeft"
          },
          {
            "const": "thighInnerRight"
          },
          {
            "const": "thighOuterLeft"
          },
          {
            "const": "thighOuterRight"
          },
          {
            "const": "throat"
          },
          {
            "const": "upperArmLeft"
          },
          {
            "const": "upperArmRight"
          },
          {
            "const": "upperBack"
          },
          {
            "const": "wristLeft"
          },
          {
            "const": "wristRight"
          }
        ],
        "description": "Closed vocabulary of anatomical surface regions on a humanoid body: the\nplaces another body or an object touches, strikes, grips or presents to.\n\nNames follow surface anatomy (Gray's Anatomy surface landmarks; the region\ndivisions of anatomical charts): head and face, neck, the anterior and\nposterior trunk with the hypochondriac regions over the liver (right) and\nspleen (left) and the lumbar regions over the kidneys, and the limbs by\nsegment and aspect. Paired regions carry their side, the body's own left\nor right. Contact points the body itself presents (the palm, the index\nfingertip, the sole, the heel, the seat) are regions too, so another body\nor an object can be aimed at them. Each region is anchored to one humanoid bone and resolved to a\npoint and an outward normal on that bone's collision shapes by the engine,\nso the same name serves a generated Human, an imported character or a\nparametric figure. The list grows additively; no name is ever repurposed."
      },
      "IAutoMovieVector3": {
        "type": "object",
        "properties": {
          "x": {
            "type": "number",
            "description": "X: toward the left (+) of a character facing +Z, its right (−)."
          },
          "y": {
            "type": "number",
            "description": "Y: up (+) / down (−)."
          },
          "z": {
            "type": "number",
            "description": "Z: the front (+) of a character at zero heading, its back (−)."
          }
        },
        "required": [
          "x",
          "y",
          "z"
        ],
        "additionalProperties": false,
        "description": "A 3D vector in automovie's right-handed, y-up frame, as in glTF 2.0 and VRM 1.0.\n\nThe same shape carries metre positions/translations, unitless directions and per-axis factors such as scale. The containing field states its meaning and required range; this type enforces neither finiteness nor length, which remain the owning record's admission responsibility."
      },
      "HumanEffort.IEffort": {
        "type": "object",
        "properties": {
          "weight": {
            "type": "number",
            "description": "-1 light to 1 strong."
          },
          "time": {
            "type": "number",
            "description": "-1 sustained to 1 sudden."
          },
          "space": {
            "type": "number",
            "description": "-1 indirect to 1 direct."
          },
          "flow": {
            "type": "number",
            "description": "-1 free to 1 bound."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "The four factors, each in [-1, 1]; absent is 0."
      },
      "PickIMannerproficiencyvariation": {
        "type": "object",
        "properties": {
          "proficiency": {
            "type": "number",
            "description": "Skill in [0, 1], which narrows the variation; the performer's own when absent."
          },
          "variation": {
            "type": "number",
            "description": "How much one performance differs from the next, in [0, 1]; 0 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamstask": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand task; `right` when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions at the face; the row's when absent."
          },
          "seconds": {
            "oneOf": [
              {
                "type": "number",
                "minimum": 0
              },
              {
                "type": "object",
                "properties": {
                  "between": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "number"
                      }
                    ],
                    "additionalItems": false
                  }
                },
                "required": [
                  "between"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop`, the grasp it was taken up by for its use\n(`HumanHeldUse.IGrasp`): the hand holds the prop at the face as that\ngrasp presents it at the row's region, the prop's point as the use's\nworking point, and moves only the point. The prop's point faces into\nthe region when absent."
          },
          "other": {
            "type": "string",
            "description": "With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "HumanHeldUse.IGrasp": {
        "type": "object",
        "properties": {
          "handle": {
            "type": "string",
            "description": "The handle the tool was taken by."
          },
          "line": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "along"
              },
              {
                "const": "forearm"
              },
              {
                "const": "oblique"
              },
              {
                "const": "square"
              }
            ],
            "description": "The line its use names (`HumanGraspUse.IUse.line`)."
          }
        },
        "required": [
          "handle",
          "line"
        ],
        "additionalProperties": false,
        "description": "The grasp a held tool was taken up by for its use (`pickUp`'s `handle` and `use.line`), which an act that uses it keeps."
      },
      "AutoMovieMotionManner.IManner": {
        "type": "object",
        "properties": {
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Laban Effort, each factor in [-1, 1]; neutral when absent."
          },
          "intensity": {
            "type": "number",
            "description": "How much of the action's full size is performed, in (0, 1]; 1 when absent."
          },
          "pace": {
            "type": "number",
            "description": "The rate as a multiple of the action's natural rate; positive, 1 when absent."
          },
          "proficiency": {
            "type": "number",
            "description": "Skill in [0, 1], which narrows the variation; the performer's own when absent."
          },
          "variation": {
            "type": "number",
            "description": "How much one performance differs from the next, in [0, 1]; 0 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "A manner; every member is optional and neutral when absent."
      },
      "OmitIParamsholdkindtargetwith": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "AutoMovieMotionHumanTouchContacts.IDeclared": {
        "type": "object",
        "properties": {
          "hand": {
            "oneOf": [
              {
                "const": "first"
              },
              {
                "const": "other"
              }
            ],
            "description": "Whose arm: the leading hand's or the other's."
          },
          "part": {
            "oneOf": [
              {
                "const": "lowerArm"
              },
              {
                "const": "upperArm"
              }
            ],
            "description": "The arm's segment."
          },
          "on": {
            "$ref": "#/components/schemas/AutoMovieHumanoidBone",
            "description": "The bone it lies along, named as for the right hand leading; its side is exchanged when the left hand leads."
          }
        },
        "required": [
          "hand",
          "part",
          "on"
        ],
        "additionalProperties": false,
        "description": "A rest as a touch row declares it."
      },
      "AutoMovieHumanoidBone": {
        "oneOf": [
          {
            "const": "chest"
          },
          {
            "const": "head"
          },
          {
            "const": "hips"
          },
          {
            "const": "jaw"
          },
          {
            "const": "leftEye"
          },
          {
            "const": "leftFoot"
          },
          {
            "const": "leftHand"
          },
          {
            "const": "leftIndexDistal"
          },
          {
            "const": "leftIndexIntermediate"
          },
          {
            "const": "leftIndexProximal"
          },
          {
            "const": "leftLittleDistal"
          },
          {
            "const": "leftLittleIntermediate"
          },
          {
            "const": "leftLittleProximal"
          },
          {
            "const": "leftLowerArm"
          },
          {
            "const": "leftLowerLeg"
          },
          {
            "const": "leftMiddleDistal"
          },
          {
            "const": "leftMiddleIntermediate"
          },
          {
            "const": "leftMiddleProximal"
          },
          {
            "const": "leftRingDistal"
          },
          {
            "const": "leftRingIntermediate"
          },
          {
            "const": "leftRingProximal"
          },
          {
            "const": "leftShoulder"
          },
          {
            "const": "leftThumbDistal"
          },
          {
            "const": "leftThumbMetacarpal"
          },
          {
            "const": "leftThumbProximal"
          },
          {
            "const": "leftToes"
          },
          {
            "const": "leftUpperArm"
          },
          {
            "const": "leftUpperLeg"
          },
          {
            "const": "neck"
          },
          {
            "const": "rightEye"
          },
          {
            "const": "rightFoot"
          },
          {
            "const": "rightHand"
          },
          {
            "const": "rightIndexDistal"
          },
          {
            "const": "rightIndexIntermediate"
          },
          {
            "const": "rightIndexProximal"
          },
          {
            "const": "rightLittleDistal"
          },
          {
            "const": "rightLittleIntermediate"
          },
          {
            "const": "rightLittleProximal"
          },
          {
            "const": "rightLowerArm"
          },
          {
            "const": "rightLowerLeg"
          },
          {
            "const": "rightMiddleDistal"
          },
          {
            "const": "rightMiddleIntermediate"
          },
          {
            "const": "rightMiddleProximal"
          },
          {
            "const": "rightRingDistal"
          },
          {
            "const": "rightRingIntermediate"
          },
          {
            "const": "rightRingProximal"
          },
          {
            "const": "rightShoulder"
          },
          {
            "const": "rightThumbDistal"
          },
          {
            "const": "rightThumbMetacarpal"
          },
          {
            "const": "rightThumbProximal"
          },
          {
            "const": "rightToes"
          },
          {
            "const": "rightUpperArm"
          },
          {
            "const": "rightUpperLeg"
          },
          {
            "const": "spine"
          },
          {
            "const": "upperChest"
          }
        ],
        "description": "Closed 55-name vocabulary matching the VRM 1.0 humanoid specification.\n\nTyped authoring and runtime admission use these semantic names. A valid name does not guarantee membership in a particular rig or compatibility of its rest basis; retargeting must check both.\n\nVRM 1.0 requires 15 slots: hips, spine, head and the four limb chains. Chest, fingers, eyes, jaw, upperChest, neck, toes and shoulders are optional and may be absent from an imported rig.\n\nThirty names address fingers; a pose can author only the joints its target rig declares.\n\nReference: VRM 1.0 humanoid specification (https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/humanoid.md)."
      },
      "OmitIParamskind": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Stroke repetitions (waves, nods, claps); the gesture's own count when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Post-stroke hold, seconds; 0 when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "turn": {
            "type": "number",
            "description": "Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent."
          },
          "shape": {
            "oneOf": [
              {
                "const": "count1"
              },
              {
                "const": "count2"
              },
              {
                "const": "count3"
              },
              {
                "const": "count4"
              },
              {
                "const": "count5"
              },
              {
                "const": "crossed"
              },
              {
                "const": "ok"
              },
              {
                "const": "quotes"
              },
              {
                "const": "snap"
              },
              {
                "const": "thumbUp"
              },
              {
                "const": "victory"
              }
            ],
            "description": "A hand shape with a meaning of its own, taken by the moving hands in place of the gesture's working shape: a thumbs up, an OK ring, a V, a count; the gesture's own shape when absent."
          },
          "aim": {
            "type": "object",
            "properties": {
              "digit": {
                "oneOf": [
                  {
                    "const": "forefinger"
                  },
                  {
                    "const": "thumb"
                  }
                ]
              },
              "toward": {
                "oneOf": [
                  {
                    "const": "down"
                  },
                  {
                    "const": "up"
                  }
                ]
              }
            },
            "required": [
              "digit",
              "toward"
            ],
            "additionalProperties": false,
            "description": "A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskindothersidetargetwith": {
        "type": "object",
        "properties": {
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskindsidetargetwith": {
        "type": "object",
        "properties": {
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamselbowkindsidetargetwith": {
        "type": "object",
        "properties": {
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsaimkindshape": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Stroke repetitions (waves, nods, claps); the gesture's own count when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Post-stroke hold, seconds; 0 when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "turn": {
            "type": "number",
            "description": "Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsaimkindshapeturn": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Stroke repetitions (waves, nods, claps); the gesture's own count when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Post-stroke hold, seconds; 0 when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o1": {
        "type": "object",
        "properties": {
          "applyCream": {
            "$ref": "#/components/schemas/OmitIParamscounttask"
          },
          "applyLipstick": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "ashTap": {
            "$ref": "#/components/schemas/OmitIParamscountkindpoint"
          },
          "blowNose": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "checkPhone": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "checkWatch": {
            "$ref": "#/components/schemas/OmitIParamssidetask"
          },
          "fanSelf": {
            "$ref": "#/components/schemas/OmitIParamscountkind"
          },
          "flickHair": {
            "$ref": "#/components/schemas/OmitIParamskindsidetargetwith"
          },
          "lightCigarette": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "photograph": {
            "$ref": "#/components/schemas/OmitIParamsgraspotherpointtask"
          },
          "readingWalk": {
            "$ref": "#/components/schemas/OmitIParamspace"
          },
          "rubEyes": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "scratchNape": {
            "$ref": "#/components/schemas/OmitIParamskindtargetwith"
          },
          "selfie": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "shave": {
            "$ref": "#/components/schemas/OmitIParamscountholdkindtangenttarget"
          },
          "smoke": {
            "$ref": "#/components/schemas/OmitIParamssecondstask"
          },
          "sniff": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "stubOut": {
            "$ref": "#/components/schemas/OmitIParamscountkindpoint"
          }
        },
        "required": [
          "applyCream",
          "applyLipstick",
          "ashTap",
          "blowNose",
          "checkPhone",
          "checkWatch",
          "fanSelf",
          "flickHair",
          "lightCigarette",
          "photograph",
          "readingWalk",
          "rubEyes",
          "scratchNape",
          "selfie",
          "shave",
          "smoke",
          "sniff",
          "stubOut"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamscounttask": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand task; `right` when absent."
          },
          "seconds": {
            "oneOf": [
              {
                "type": "number",
                "minimum": 0
              },
              {
                "type": "object",
                "properties": {
                  "between": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "number"
                      }
                    ],
                    "additionalItems": false
                  }
                },
                "required": [
                  "between"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop`, the grasp it was taken up by for its use\n(`HumanHeldUse.IGrasp`): the hand holds the prop at the face as that\ngrasp presents it at the row's region, the prop's point as the use's\nworking point, and moves only the point. The prop's point faces into\nthe region when absent."
          },
          "other": {
            "type": "string",
            "description": "With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamscountkindpoint": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "with": {
            "oneOf": [
              {
                "const": "fingertips"
              },
              {
                "const": "fist"
              },
              {
                "const": "forefinger"
              },
              {
                "const": "handBack"
              },
              {
                "const": "handEdge"
              },
              {
                "const": "heel"
              },
              {
                "const": "palm"
              }
            ],
            "description": "The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "AutoMovieMotionTarget": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "person",
                "description": "Discriminator."
              },
              "subject": {
                "type": "string",
                "description": "The other subject's id."
              },
              "region": {
                "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                "description": "The region aimed at."
              }
            },
            "required": [
              "kind",
              "subject",
              "region"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "self",
                "description": "Discriminator."
              },
              "region": {
                "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                "description": "The region of the performer's own body."
              }
            },
            "required": [
              "kind",
              "region"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "prop",
                "description": "Discriminator."
              },
              "subject": {
                "type": "string",
                "description": "The prop subject's id."
              },
              "point": {
                "type": "string",
                "description": "The prop's named point."
              }
            },
            "required": [
              "kind",
              "subject",
              "point"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "point",
                "description": "Discriminator."
              },
              "at": {
                "$ref": "#/components/schemas/IAutoMovieVector3",
                "description": "The point, metres."
              },
              "frame": {
                "oneOf": [
                  {
                    "const": "performer"
                  },
                  {
                    "const": "world"
                  }
                ],
                "description": "The frame the point is stated in."
              },
              "normal": {
                "$ref": "#/components/schemas/IAutoMovieVector3",
                "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
              }
            },
            "required": [
              "kind",
              "at",
              "frame"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "none",
                "description": "Discriminator."
              },
              "line": {
                "oneOf": [
                  {
                    "const": "high"
                  },
                  {
                    "const": "low"
                  },
                  {
                    "const": "middle"
                  }
                ],
                "description": "The virtual opponent's height line; `middle` when absent."
              },
              "range": {
                "type": "number",
                "description": "Distance to the virtual opponent, metres; the technique's range when absent."
              }
            },
            "required": [
              "kind"
            ],
            "additionalProperties": false
          }
        ],
        "description": "What a directed action aims at: another person's anatomical region, a\nregion of the performer's own body, a named point on a prop, a free point,\nor nothing at all.\n\n- `person`: a region of another subject's body; the action commits to its\n  position at its commit event and tracks it afterwards.\n- `self`: a region of the performer's own body (a hand to the chin, to the\n  hip, to the chest), read on the posture the performer is in.\n- `prop`: a named point of a prop (a bag's centre, a pad's face, a\n  handle), as the prop's profile declares it.\n- `point`: a fixed point in metres, in the world or in the performer's own\n  frame (+Z forward, +X left, +Y up, origin on the floor under the root).\n  Its `normal` says which way the surface at the point faces (a table top\n  faces up, a wall faces the room); without one the point faces back at the\n  performer.\n- `none`: shadow work and drills in the air; the aim point is that of a\n  virtual opponent of the performer's own measure at `range` metres\n  (default: the technique's own range), at the `line` height (default\n  `middle`), so contact checks become extension checks."
      },
      "OmitIParamssidetask": {
        "type": "object",
        "properties": {
          "count": {
            "type": "number",
            "description": "Repetitions at the face; the row's when absent."
          },
          "seconds": {
            "oneOf": [
              {
                "type": "number",
                "minimum": 0
              },
              {
                "type": "object",
                "properties": {
                  "between": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "number"
                      }
                    ],
                    "additionalItems": false
                  }
                },
                "required": [
                  "between"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop`, the grasp it was taken up by for its use\n(`HumanHeldUse.IGrasp`): the hand holds the prop at the face as that\ngrasp presents it at the row's region, the prop's point as the use's\nworking point, and moves only the point. The prop's point faces into\nthe region when absent."
          },
          "other": {
            "type": "string",
            "description": "With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamscountkind": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Post-stroke hold, seconds; 0 when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "turn": {
            "type": "number",
            "description": "Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent."
          },
          "shape": {
            "oneOf": [
              {
                "const": "count1"
              },
              {
                "const": "count2"
              },
              {
                "const": "count3"
              },
              {
                "const": "count4"
              },
              {
                "const": "count5"
              },
              {
                "const": "crossed"
              },
              {
                "const": "ok"
              },
              {
                "const": "quotes"
              },
              {
                "const": "snap"
              },
              {
                "const": "thumbUp"
              },
              {
                "const": "victory"
              }
            ],
            "description": "A hand shape with a meaning of its own, taken by the moving hands in place of the gesture's working shape: a thumbs up, an OK ring, a V, a count; the gesture's own shape when absent."
          },
          "aim": {
            "type": "object",
            "properties": {
              "digit": {
                "oneOf": [
                  {
                    "const": "forefinger"
                  },
                  {
                    "const": "thumb"
                  }
                ]
              },
              "toward": {
                "oneOf": [
                  {
                    "const": "down"
                  },
                  {
                    "const": "up"
                  }
                ]
              }
            },
            "required": [
              "digit",
              "toward"
            ],
            "additionalProperties": false,
            "description": "A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsgraspotherpointtask": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand task; `right` when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions at the face; the row's when absent."
          },
          "seconds": {
            "oneOf": [
              {
                "type": "number",
                "minimum": 0
              },
              {
                "type": "object",
                "properties": {
                  "between": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "number"
                      }
                    ],
                    "additionalItems": false
                  }
                },
                "required": [
                  "between"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamspace": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "stride": {
            "type": "number",
            "minimum": 0.6,
            "maximum": 1.3,
            "description": "Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6, 1.3]; 1 when absent.",
            "default": 1
          },
          "armSwing": {
            "type": "number",
            "minimum": 0,
            "maximum": 2,
            "description": "Arm-swing scale, an Effort hook, in [0, 2]; 1 when absent.",
            "default": 1
          },
          "elbows": {
            "type": "number",
            "minimum": 0,
            "maximum": 30,
            "description": "Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.",
            "default": 0
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamskindtargetwith": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamscountholdkindtangenttarget": {
        "type": "object",
        "properties": {
          "with": {
            "oneOf": [
              {
                "const": "fingertips"
              },
              {
                "const": "fist"
              },
              {
                "const": "forefinger"
              },
              {
                "const": "handBack"
              },
              {
                "const": "handEdge"
              },
              {
                "const": "heel"
              },
              {
                "const": "palm"
              }
            ],
            "description": "The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamssecondstask": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand task; `right` when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions at the face; the row's when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop`, the grasp it was taken up by for its use\n(`HumanHeldUse.IGrasp`): the hand holds the prop at the face as that\ngrasp presents it at the row's region, the prop's point as the use's\nworking point, and moves only the point. The prop's point faces into\nthe region when absent."
          },
          "other": {
            "type": "string",
            "description": "With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o2": {
        "type": "object",
        "properties": {
          "armsCrossed": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "bigStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o1"
          },
          "fistPump": {
            "$ref": "#/components/schemas/OmitIParamskind-o1"
          },
          "handsBehindHead": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "handsClasped": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "handsInPockets": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "handsOnHips": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "neckRoll": {
            "$ref": "#/components/schemas/OmitIParamskind-o1"
          },
          "paradeRest": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "thinking": {
            "$ref": "#/components/schemas/OmitIParamsleftright"
          },
          "victory": {
            "$ref": "#/components/schemas/OmitIParamskind-o1"
          }
        },
        "required": [
          "armsCrossed",
          "bigStretch",
          "fistPump",
          "handsBehindHead",
          "handsClasped",
          "handsInPockets",
          "handsOnHips",
          "neckRoll",
          "paradeRest",
          "thinking",
          "victory"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsleftright": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "How long, seconds; 2 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o1": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The arm of a fist pump; `right` when absent."
          },
          "count": {
            "type": "number",
            "description": "Pumps or rolls; 3 for a pump, 2 for a roll when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o3": {
        "type": "object",
        "properties": {
          "braceForImpact": {
            "$ref": "#/components/schemas/OmitIParamskind-o2"
          },
          "kneelBriefly": {
            "$ref": "#/components/schemas/OmitIParamsholdrise"
          },
          "kneelSit": {
            "$ref": "#/components/schemas/OmitIParamsholdkindrise"
          },
          "lieStill": {
            "$ref": "#/components/schemas/OmitIParamshold"
          },
          "sitCrossLegged": {
            "$ref": "#/components/schemas/OmitIParamsholdposition"
          },
          "sitOnFloor": {
            "$ref": "#/components/schemas/OmitIParamsholdposition"
          },
          "sitSideways": {
            "$ref": "#/components/schemas/OmitIParamsholdposition"
          },
          "squatSit": {
            "$ref": "#/components/schemas/OmitIParamsdepthheelshold"
          },
          "startle": {
            "$ref": "#/components/schemas/OmitIParamsintensity"
          },
          "stumble": {
            "$ref": "#/components/schemas/OmitIParamsspeed"
          },
          "takeAKnee": {
            "$ref": "#/components/schemas/OmitIParamsholdrise"
          },
          "takeCover": {
            "$ref": "#/components/schemas/OmitIParamshold-o1"
          },
          "wince": {
            "$ref": "#/components/schemas/OmitIParamsintensity"
          }
        },
        "required": [
          "braceForImpact",
          "kneelBriefly",
          "kneelSit",
          "lieStill",
          "sitCrossLegged",
          "sitOnFloor",
          "sitSideways",
          "squatSit",
          "startle",
          "stumble",
          "takeAKnee",
          "takeCover",
          "wince"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamskind-o2": {
        "type": "object",
        "properties": {
          "toward": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the force comes from; straight ahead when absent."
          },
          "seconds": {
            "type": "number",
            "description": "How long the brace lasts, seconds; 1.5 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsholdrise": {
        "type": "object",
        "properties": {
          "kind": {
            "oneOf": [
              {
                "const": "both"
              },
              {
                "const": "one"
              },
              {
                "const": "sitBack"
              }
            ],
            "description": "The kneeling posture; `one` when absent."
          },
          "knee": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The knee that goes down first; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsholdkindrise": {
        "type": "object",
        "properties": {
          "knee": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The knee that goes down first; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamshold": {
        "type": "object",
        "properties": {
          "position": {
            "oneOf": [
              {
                "const": "lateralLeft"
              },
              {
                "const": "lateralRight"
              },
              {
                "const": "prone"
              },
              {
                "const": "sitCrossed"
              },
              {
                "const": "sitLong"
              },
              {
                "const": "sitSide"
              },
              {
                "const": "supine"
              }
            ],
            "description": "The position; `supine` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsholdposition": {
        "type": "object",
        "properties": {
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsdepthheelshold": {
        "type": "object",
        "properties": {
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsintensity": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the threat comes from; a place ahead of the performer when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed; its intensity is `intensity` unless it states one."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsspeed": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the blow comes from: the body is pushed away from it; a place ahead of the performer when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed: the tempo scales the righting after the step."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamshold-o1": {
        "type": "object",
        "properties": {
          "depth": {
            "oneOf": [
              {
                "const": "full"
              },
              {
                "const": "partial"
              }
            ],
            "description": "How deep; `partial` when absent."
          },
          "heels": {
            "oneOf": [
              {
                "const": "flat"
              },
              {
                "const": "up"
              }
            ],
            "description": "The heels; `flat` for a partial and `up` for a full squat when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o4": {
        "type": "object",
        "properties": {
          "doubleTime": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "drunk": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "getIn": {
            "$ref": "#/components/schemas/HumanTravelCar.IParams"
          },
          "hurry": {
            "$ref": "#/components/schemas/OmitIParamsarmSwingpacestride"
          },
          "jog": {
            "$ref": "#/components/schemas/OmitIParamspace-o1"
          },
          "limp": {
            "$ref": "#/components/schemas/HumanGait.ILimp"
          },
          "march": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "openDoor": {
            "$ref": "#/components/schemas/HumanTravelLeaf.IParams"
          },
          "passThrough": {
            "$ref": "#/components/schemas/HumanTravelDoor.IParams"
          },
          "proud": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "prowl": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "sad": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "sneak": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "sprint": {
            "$ref": "#/components/schemas/OmitIParamspace-o1"
          },
          "stiffLimp": {
            "$ref": "#/components/schemas/HumanGait.ILimp"
          },
          "stroll": {
            "$ref": "#/components/schemas/OmitIParamsarmSwingpacestride"
          },
          "swagger": {
            "$ref": "#/components/schemas/OmitIParamsarmSwingelbowspace"
          },
          "tiptoe": {
            "$ref": "#/components/schemas/HumanGait.IParams"
          },
          "trudge": {
            "$ref": "#/components/schemas/OmitIParamsarmSwingpacestride"
          }
        },
        "required": [
          "doubleTime",
          "drunk",
          "getIn",
          "hurry",
          "jog",
          "limp",
          "march",
          "openDoor",
          "passThrough",
          "proud",
          "prowl",
          "sad",
          "sneak",
          "sprint",
          "stiffLimp",
          "stroll",
          "swagger",
          "tiptoe",
          "trudge"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "HumanGait.IParams": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "elbows": {
            "type": "number",
            "minimum": 0,
            "maximum": 30,
            "description": "Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.",
            "default": 0
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false,
        "description": "What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows."
      },
      "HumanTravelCar.IParams": {
        "type": "object",
        "properties": {
          "seat": {
            "$ref": "#/components/schemas/seated.ISeat",
            "description": "The seat sat on, as `HumanObject.seat` reads it from the car."
          },
          "through": {
            "$ref": "#/components/schemas/HumanObstacle.IAperture",
            "description": "The door's opening, as `HumanObstacle.apertures` reads it from the car."
          },
          "seconds": {
            "type": "number",
            "description": "Seconds of the sitting down; `sit`'s own when absent."
          }
        },
        "required": [
          "seat",
          "through"
        ],
        "additionalProperties": false,
        "description": "Parameters of getting in."
      },
      "seated.ISeat": {
        "type": "object",
        "properties": {
          "at": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The middle of the sitting surface's front edge, world metres; its height is the seat height."
          },
          "yaw": {
            "type": "number",
            "description": "The heading a sitter faces, degrees about +Y."
          },
          "depth": {
            "type": "number",
            "description": "Depth back from the front edge, metres; deep enough for the thigh when absent."
          },
          "back": {
            "type": "number",
            "description": "Backrest height above the surface, metres; backless when absent."
          },
          "astride": {
            "type": "boolean",
            "description": "Whether the seat is sat astride, a leg on either side, as a saddle is; both legs ahead when absent."
          },
          "armrests": {
            "$ref": "#/components/schemas/PartialRecordleftrightIAutoMovieVector3",
            "description": "Where a palm rests on each armrest, world metres: the top of the\narmrest beside the sitter. A hand with one goes to it while sitting\ndown and bears on it; a hand with none rests on its thigh."
          },
          "mount": {
            "oneOf": [
              {
                "const": "either"
              },
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The side a seat sat astride is got onto and off from, as a horse is mounted from its left; either side when absent or `either`."
          },
          "footrests": {
            "$ref": "#/components/schemas/PartialRecordleftrightIAutoMovieVector3",
            "description": "Where a foot rests while seated, world metres: the tread a foot's ball\nbears on (a stool's bar, a pedal, a peg, a stirrup). Read only on a\nseat higher than the band, where the feet leave the floor; a foot with\nno rest, or whose rest the leg cannot reach, hangs."
          }
        },
        "required": [
          "at",
          "yaw"
        ],
        "additionalProperties": false,
        "description": "A seat in the world."
      },
      "PartialRecordleftrightIAutoMovieVector3": {
        "type": "object",
        "properties": {
          "left": {
            "$ref": "#/components/schemas/IAutoMovieVector3"
          },
          "right": {
            "$ref": "#/components/schemas/IAutoMovieVector3"
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "HumanObstacle.IAperture": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Its id within the obstacle."
          },
          "at": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The middle of its sill on the floor plan, world metres; `y` is the sill's height."
          },
          "across": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The level unit direction its width runs along, world."
          },
          "width": {
            "type": "number",
            "description": "Its clear width, metres."
          },
          "height": {
            "type": "number",
            "description": "Its clear height above the sill, metres."
          }
        },
        "required": [
          "id",
          "at",
          "across",
          "width",
          "height"
        ],
        "additionalProperties": false,
        "description": "An opening through an obstacle."
      },
      "OmitIParamsarmSwingpacestride": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "elbows": {
            "type": "number",
            "minimum": 0,
            "maximum": 30,
            "description": "Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.",
            "default": 0
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamspace-o1": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y."
          },
          "stride": {
            "type": "number",
            "description": "Step-length scale in [0.6, 1.3]; 1 when absent."
          },
          "armSwing": {
            "type": "number",
            "description": "Arm-swing scale in [0, 2]; 1 when absent."
          },
          "elbows": {
            "type": "number",
            "description": "Elbows held out, degrees in [0, 30]; 0 when absent."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "HumanGait.ILimp": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "elbows": {
            "type": "number",
            "minimum": 0,
            "maximum": 30,
            "description": "Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.",
            "default": 0
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The leg spared; the right when absent."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false,
        "description": "What a limp leaves to the composition: the walk's, and the leg spared."
      },
      "HumanTravelLeaf.IParams": {
        "type": "object",
        "properties": {
          "door": {
            "type": "string",
            "description": "The door: its prop's subject id in the performance."
          },
          "handle": {
            "type": "string",
            "description": "The handle taken: one of the prop's points, such as a door's `pull` or `push`."
          },
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0.6,
            "description": "Seconds the hand holds the handle, from the start of the reach; more than the reach's `TAKE`."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; the right when absent."
          }
        },
        "required": [
          "door",
          "handle",
          "seconds"
        ],
        "additionalProperties": false,
        "description": "Parameters of opening a door."
      },
      "HumanTravelDoor.IParams": {
        "type": "object",
        "properties": {
          "through": {
            "type": "string",
            "description": "The obstacle whose opening is passed: its subject id."
          },
          "aperture": {
            "type": "string",
            "description": "The opening's id within that obstacle; its only opening when absent."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The pace; `normal` when absent."
          }
        },
        "required": [
          "through"
        ],
        "additionalProperties": false,
        "description": "Parameters of a passage."
      },
      "OmitIParamsarmSwingelbowspace": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "stride": {
            "type": "number",
            "minimum": 0.6,
            "maximum": 1.3,
            "description": "Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6, 1.3]; 1 when absent.",
            "default": 1
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o5": {
        "type": "object",
        "properties": {
          "chase": {
            "$ref": "#/components/schemas/OmitIParamsatpacetrack"
          },
          "confront": {
            "$ref": "#/components/schemas/OmitIParamsatside"
          },
          "escort": {
            "$ref": "#/components/schemas/OmitIParamsatsidetrack"
          },
          "flee": {
            "$ref": "#/components/schemas/HumanPursuit.IFlee"
          },
          "follow": {
            "$ref": "#/components/schemas/OmitIParamsatsidetrack"
          },
          "intercept": {
            "$ref": "#/components/schemas/HumanPursuit.IIntercept"
          }
        },
        "required": [
          "chase",
          "confront",
          "escort",
          "flee",
          "follow",
          "intercept"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsatpacetrack": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What to approach."
          },
          "side": {
            "oneOf": [
              {
                "const": "behind"
              },
              {
                "const": "front"
              },
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "Where around a person target to stop, in that person's own frame:\n`front`, `left`, `right` or `behind`; along the line from the start\nwhen absent (and always for a prop or point)."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality: steps, arm swing and elbow width of the walk."
          },
          "avoid": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "People to walk round on the way, by subject id."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsatside": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What to approach."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The pace; `normal` when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality: steps, arm swing and elbow width of the walk."
          },
          "avoid": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "People to walk round on the way, by subject id."
          },
          "track": {
            "oneOf": [
              {
                "const": "pace"
              },
              {
                "type": "boolean"
              }
            ],
            "description": "Whether a person target is followed where they go: the stop is taken\nat the place they come to rest, read from their placed actions, and\nthe walk begins late enough to arrive just after them. The person is\nthen composed before this performer, or the read is refused. With\n`pace` the walk instead matches the person's speed on the way\n(`walkFollowed`), so the gap holds while they walk, and closes to\nthe stop once they have stopped. Absent, the target is read once,\nwhere it is when the approach begins."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsatsidetrack": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What to approach."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The pace; `normal` when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality: steps, arm swing and elbow width of the walk."
          },
          "avoid": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "People to walk round on the way, by subject id."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "HumanPursuit.IFlee": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "description": "The person fled from, by subject id."
          },
          "metres": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "How far to run, metres; `FLIGHT` hip heights when absent."
          },
          "pace": {
            "oneOf": [
              {
                "const": "jog"
              },
              {
                "const": "run"
              },
              {
                "const": "sprint"
              }
            ],
            "description": "The pace; `run` when absent."
          }
        },
        "required": [
          "from"
        ],
        "additionalProperties": false,
        "description": "Parameters of a flight from a person."
      },
      "HumanPursuit.IIntercept": {
        "type": "object",
        "properties": {
          "target": {
            "type": "string",
            "description": "The person headed off, by subject id; composed before the performer."
          },
          "pace": {
            "oneOf": [
              {
                "const": "jog"
              },
              {
                "const": "run"
              },
              {
                "const": "sprint"
              }
            ],
            "description": "The pace; `run` when absent."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false,
        "description": "Parameters of an interception."
      },
      "IHumanLexiconParams.Merged-o6": {
        "type": "object",
        "properties": {
          "cheekKiss": {
            "$ref": "#/components/schemas/OmitIParamsregion"
          },
          "comfort": {
            "$ref": "#/components/schemas/OmitIParamsholdkindwith"
          },
          "danceFollow": {
            "$ref": "#/components/schemas/OmitIParamsatpacesidetrack"
          },
          "danceHold": {
            "$ref": "#/components/schemas/OmitIParamsholdkindsidewith"
          },
          "danceLead": {
            "$ref": "#/components/schemas/OmitIParamspace"
          },
          "firmPress": {
            "$ref": "#/components/schemas/OmitIParamskindmannerwith"
          },
          "fistBump": {
            "$ref": "#/components/schemas/OmitIParamskind-o3"
          },
          "flickOff": {
            "$ref": "#/components/schemas/OmitIParamskindmannerwith"
          },
          "foreheadKiss": {
            "$ref": "#/components/schemas/OmitIParamsregion"
          },
          "judoBroken": {
            "$ref": "#/components/schemas/OmitIParamsdepth"
          },
          "judoGrip": {
            "$ref": "#/components/schemas/OmitIParamsgriphold"
          },
          "lowFive": {
            "$ref": "#/components/schemas/OmitIParamskind-o3"
          },
          "pinkyPromise": {
            "$ref": "#/components/schemas/OmitIParamskind-o3"
          },
          "relayIncoming": {
            "$ref": "#/components/schemas/OmitIParamsrole"
          },
          "relayOutgoing": {
            "$ref": "#/components/schemas/OmitIParamsrole"
          },
          "shoulderPat": {
            "$ref": "#/components/schemas/OmitIParamscountkindwith"
          },
          "toastSip": {
            "$ref": "#/components/schemas/OmitIParamstask"
          },
          "whisper": {
            "$ref": "#/components/schemas/OmitIParamsholdregion"
          }
        },
        "required": [
          "cheekKiss",
          "comfort",
          "danceFollow",
          "danceHold",
          "danceLead",
          "firmPress",
          "fistBump",
          "flickOff",
          "foreheadKiss",
          "judoBroken",
          "judoGrip",
          "lowFive",
          "pinkyPromise",
          "relayIncoming",
          "relayOutgoing",
          "shoulderPat",
          "toastSip",
          "whisper"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsregion": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "Which way the head turns for a cheek or the lips; `right` when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the lips stay; `HOLD` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false
      },
      "OmitIParamsholdkindwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsatpacesidetrack": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What to approach."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality: steps, arm swing and elbow width of the walk."
          },
          "avoid": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "People to walk round on the way, by subject id."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsholdkindsidewith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamskindmannerwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamskind-o3": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets, one of its affordance ids; `lip` when absent."
          },
          "window": {
            "$ref": "#/components/schemas/AutoMovieMotionMeeting.IWindow",
            "description": "The film seconds the hands meet over (`AutoMovieMotionMeeting.IWindow`), which both roles give alike: they meet no earlier than `from`, each hand leaving its rest only its own reach's time before, and part at `to`; the natural meeting when absent."
          },
          "at": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "A world point the hand is brought to in place of the pair's own meeting point, metres: the one point several pairs meet at, as glasses in a toast of four. The pair's shared instants are kept. The pair's own point when absent."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false
      },
      "AutoMovieMotionMeeting.IWindow": {
        "type": "object",
        "properties": {
          "from": {
            "type": "number",
            "description": "The earliest film second of the contact; the natural one when absent."
          },
          "to": {
            "type": "number",
            "description": "The film second the contact is left; the natural one when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "The film seconds a meeting holds over, as the composition states them:\nthe contact is made no earlier than `from` and left at `to`, and the\npartners are free before and after. A meeting whose natural contact\ncomes before `from` is moved later as a whole; one that would leave\nbefore `to` is held until then."
      },
      "OmitIParamsdepth": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner who breaks the base, for the mutual join; unread by the tip."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the tip is held; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsgriphold": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner gripped."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The collar hand of `collarSleeve`; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false
      },
      "OmitIParamsrole": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The other runner."
          },
          "at": {
            "type": "number",
            "description": "The film second the baton reaches the outgoing hand; both roles give the same one."
          },
          "baton": {
            "type": "string",
            "description": "The baton's subject id, worn on the incoming runner's passing hand; mimed when absent."
          },
          "end": {
            "type": "string",
            "description": "The baton's point that is pushed into the outgoing hand, one of its points; required with `baton`."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The passing hand of both runners; `right` when absent."
          }
        },
        "required": [
          "partner",
          "at"
        ],
        "additionalProperties": false
      },
      "OmitIParamscountkindwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsholdregion": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "Which way the head turns for a cheek or the lips; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o7": {
        "type": "object",
        "properties": {
          "backhand": {
            "$ref": "#/components/schemas/OmitIParamscountkindtangentwith"
          },
          "choke": {
            "$ref": "#/components/schemas/OmitIParamscountholdkindwith"
          },
          "diveForCover": {
            "$ref": "#/components/schemas/OmitIParamsholdposition"
          },
          "dodge": {
            "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
          },
          "duck": {
            "$ref": "#/components/schemas/OmitIParamsdepthhold"
          },
          "grab": {
            "$ref": "#/components/schemas/OmitIParamscountkindwith"
          },
          "grabbed": {
            "$ref": "#/components/schemas/OmitIParamspartway"
          },
          "hairPull": {
            "$ref": "#/components/schemas/OmitIParamscountholdkindwith"
          },
          "headlock": {
            "$ref": "#/components/schemas/OmitIParamshold-o2"
          },
          "leanBack": {
            "$ref": "#/components/schemas/OmitIParamspartway"
          },
          "poke": {
            "$ref": "#/components/schemas/OmitIParamskindwith"
          },
          "pushed": {
            "$ref": "#/components/schemas/OmitIParamsintensitypartway"
          },
          "restrain": {
            "$ref": "#/components/schemas/OmitIParamshold-o2"
          },
          "shove": {
            "$ref": "#/components/schemas/OmitIParamscountkindwith"
          },
          "shoved": {
            "$ref": "#/components/schemas/OmitIParamsspeed"
          },
          "slap": {
            "$ref": "#/components/schemas/OmitIParamscountkindtangentwith"
          },
          "slapped": {
            "$ref": "#/components/schemas/OmitIParamspartway"
          },
          "stageSlap": {
            "$ref": "#/components/schemas/OmitIParamsclearcountkindtangentwith"
          },
          "struggle": {
            "$ref": "#/components/schemas/OmitIParamscountholdkindwith"
          }
        },
        "required": [
          "backhand",
          "choke",
          "diveForCover",
          "dodge",
          "duck",
          "grab",
          "grabbed",
          "hairPull",
          "headlock",
          "leanBack",
          "poke",
          "pushed",
          "restrain",
          "shove",
          "shoved",
          "slap",
          "slapped",
          "stageSlap",
          "struggle"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamscountkindtangentwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamscountholdkindwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsdirectionsteps": {
        "type": "object",
        "properties": {
          "length": {
            "type": "number",
            "description": "Each step's length, metres; half a stance length when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsdepthhold": {
        "type": "object",
        "properties": {
          "heels": {
            "oneOf": [
              {
                "const": "flat"
              },
              {
                "const": "up"
              }
            ],
            "description": "The heels; `flat` for a partial and `up` for a full squat when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamspartway": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the contact comes from; a place ahead of the performer when absent."
          },
          "intensity": {
            "type": "number",
            "exclusiveMinimum": 0,
            "maximum": 1,
            "description": "How strong, in (0, 1]; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamshold-o2": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner gripped."
          },
          "grip": {
            "oneOf": [
              {
                "const": "collarSleeve"
              },
              {
                "const": "plum"
              }
            ],
            "description": "The grip; `plum` when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The collar hand of `collarSleeve`; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false
      },
      "OmitIParamskindwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "OmitIParamsintensitypartway": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the contact comes from; a place ahead of the performer when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsclearcountkindtangentwith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o8": {
        "type": "object",
        "properties": {
          "aim": {
            "$ref": "#/components/schemas/OmitIParamsholdkind"
          },
          "cross": {
            "$ref": "#/components/schemas/OmitIParamshandtechnique"
          },
          "frontKick": {
            "$ref": "#/components/schemas/OmitIParamslegtechnique"
          },
          "hook": {
            "$ref": "#/components/schemas/OmitIParamshandtechnique"
          },
          "jab": {
            "$ref": "#/components/schemas/OmitIParamshandtechnique"
          },
          "jumpingJacks": {
            "$ref": "#/components/schemas/OmitIParamskind-o4"
          },
          "roundKick": {
            "$ref": "#/components/schemas/OmitIParamslegtechnique"
          },
          "southpaw": {
            "$ref": "#/components/schemas/OmitIParamsstance"
          },
          "squats": {
            "$ref": "#/components/schemas/OmitIParamskind-o4"
          },
          "sway": {
            "$ref": "#/components/schemas/OmitIParamskind-o5"
          },
          "uppercut": {
            "$ref": "#/components/schemas/OmitIParamshandtechnique"
          }
        },
        "required": [
          "aim",
          "cross",
          "frontKick",
          "hook",
          "jab",
          "jumpingJacks",
          "roundKick",
          "southpaw",
          "squats",
          "sway",
          "uppercut"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsholdkind": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Stroke repetitions (waves, nods, claps); the gesture's own count when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "turn": {
            "type": "number",
            "description": "Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent."
          },
          "shape": {
            "oneOf": [
              {
                "const": "count1"
              },
              {
                "const": "count2"
              },
              {
                "const": "count3"
              },
              {
                "const": "count4"
              },
              {
                "const": "count5"
              },
              {
                "const": "crossed"
              },
              {
                "const": "ok"
              },
              {
                "const": "quotes"
              },
              {
                "const": "snap"
              },
              {
                "const": "thumbUp"
              },
              {
                "const": "victory"
              }
            ],
            "description": "A hand shape with a meaning of its own, taken by the moving hands in place of the gesture's working shape: a thumbs up, an OK ring, a V, a count; the gesture's own shape when absent."
          },
          "aim": {
            "type": "object",
            "properties": {
              "digit": {
                "oneOf": [
                  {
                    "const": "forefinger"
                  },
                  {
                    "const": "thumb"
                  }
                ]
              },
              "toward": {
                "oneOf": [
                  {
                    "const": "down"
                  },
                  {
                    "const": "up"
                  }
                ]
              }
            },
            "required": [
              "digit",
              "toward"
            ],
            "additionalProperties": false,
            "description": "A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamshandtechnique": {
        "type": "object",
        "properties": {
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What it strikes."
          },
          "accuracy": {
            "oneOf": [
              {
                "const": "graze"
              },
              {
                "const": "hit"
              },
              {
                "const": "miss"
              },
              {
                "$ref": "#/components/schemas/IAutoMovieVector3"
              }
            ],
            "description": "Declared accuracy; `hit` when absent."
          },
          "feint": {
            "type": "number",
            "description": "A feint: the share of the delivery shown before returning, in (0, 1)."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the punch differ: `variation` in [0, 1] scales the\nspread of the point aimed at within a person's region, and\n`proficiency` replaces the performer's skill for that spread. Absent or\n0, every repeat is aimed at the region's own point."
          }
        },
        "required": [
          "at"
        ],
        "additionalProperties": false
      },
      "OmitIParamslegtechnique": {
        "type": "object",
        "properties": {
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What it strikes."
          },
          "accuracy": {
            "oneOf": [
              {
                "const": "graze"
              },
              {
                "const": "hit"
              },
              {
                "const": "miss"
              },
              {
                "$ref": "#/components/schemas/IAutoMovieVector3"
              }
            ],
            "description": "Declared accuracy; `hit` when absent."
          },
          "feint": {
            "type": "boolean",
            "description": "A feint: the kick shows its chamber and returns without extending."
          }
        },
        "required": [
          "at"
        ],
        "additionalProperties": false
      },
      "OmitIParamskind-o4": {
        "type": "object",
        "properties": {
          "reps": {
            "type": "integer",
            "minimum": 1,
            "description": "Repetitions; 3 when absent."
          },
          "depth": {
            "oneOf": [
              {
                "const": "half"
              },
              {
                "const": "parallel"
              },
              {
                "const": "quarter"
              }
            ],
            "description": "A squat's depth; `parallel` when absent."
          },
          "tempo": {
            "type": "array",
            "prefixItems": [
              {
                "type": "number"
              },
              {
                "type": "number"
              },
              {
                "type": "number"
              }
            ],
            "description": "Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent.",
            "additionalItems": false
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The lunge's lead leg, or the first knee raised; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsstance": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "description": "How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set."
          },
          "facing": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to face; the entry's line when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o5": {
        "type": "object",
        "properties": {
          "bpm": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Beats per minute; `BPM` when absent."
          },
          "beats": {
            "type": "integer",
            "minimum": 1,
            "description": "How many beats; 8 when absent."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The foot that steps first; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o9": {
        "type": "object",
        "properties": {
          "advance": {
            "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
          },
          "alber": {
            "$ref": "#/components/schemas/OmitIParamsguard"
          },
          "backslash": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "beat": {
            "$ref": "#/components/schemas/OmitIParryhold"
          },
          "bind": {
            "$ref": "#/components/schemas/OmitIParryhold"
          },
          "cut": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "disengage": {
            "$ref": "#/components/schemas/OmitIAttacknever"
          },
          "draw": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "enGarde": {
            "$ref": "#/components/schemas/OmitIParamsguard"
          },
          "feint": {
            "$ref": "#/components/schemas/OmitICutfeint"
          },
          "lunge": {
            "$ref": "#/components/schemas/OmitIAttackadvance"
          },
          "ochs": {
            "$ref": "#/components/schemas/OmitIParamsguard"
          },
          "parry": {
            "$ref": "#/components/schemas/OmitIParrynever"
          },
          "pflug": {
            "$ref": "#/components/schemas/OmitIParamsguard"
          },
          "retreat": {
            "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
          },
          "riposte": {
            "$ref": "#/components/schemas/OmitIAttacknever"
          },
          "slash": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "stab": {
            "$ref": "#/components/schemas/OmitIAttacknever"
          },
          "thrust": {
            "$ref": "#/components/schemas/OmitIAttacknever"
          },
          "traverse": {
            "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
          },
          "voidStep": {
            "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
          },
          "vomTag": {
            "$ref": "#/components/schemas/OmitIParamsguard"
          },
          "wind": {
            "$ref": "#/components/schemas/OmitIAttacknever"
          }
        },
        "required": [
          "advance",
          "alber",
          "backslash",
          "beat",
          "bind",
          "cut",
          "disengage",
          "draw",
          "enGarde",
          "feint",
          "lunge",
          "ochs",
          "parry",
          "pflug",
          "retreat",
          "riposte",
          "slash",
          "stab",
          "thrust",
          "traverse",
          "voidStep",
          "vomTag",
          "wind"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsguard": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitICutfrom": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParryhold": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "against": {
            "type": "string",
            "description": "The anchor of the cut or thrust it meets; a drill to `line` when absent."
          },
          "line": {
            "oneOf": [
              {
                "const": "highInside"
              },
              {
                "const": "highOutside"
              },
              {
                "const": "lowInside"
              },
              {
                "const": "lowOutside"
              }
            ],
            "description": "The line closed when it answers no attack; `highOutside` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIAttacknever": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitICutfeint": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "from": {
            "oneOf": [
              {
                "const": "above"
              },
              {
                "const": "aboveBackhand"
              },
              {
                "const": "aboveForehand"
              },
              {
                "const": "backhand"
              },
              {
                "const": "below"
              },
              {
                "const": "belowBackhand"
              },
              {
                "const": "belowForehand"
              },
              {
                "const": "forehand"
              }
            ],
            "description": "Where the cut comes from; `above` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIAttackadvance": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParrynever": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "against": {
            "type": "string",
            "description": "The anchor of the cut or thrust it meets; a drill to `line` when absent."
          },
          "line": {
            "oneOf": [
              {
                "const": "highInside"
              },
              {
                "const": "highOutside"
              },
              {
                "const": "lowInside"
              },
              {
                "const": "lowOutside"
              }
            ],
            "description": "The line closed when it answers no attack; `highOutside` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o10": {
        "type": "object",
        "properties": {
          "highReady": {
            "$ref": "#/components/schemas/OmitIPresentcarriage"
          },
          "lowReady": {
            "$ref": "#/components/schemas/OmitIPresentcarriage"
          },
          "reachHolster": {
            "$ref": "#/components/schemas/OmitIParamsholdkindsidetargetwith"
          },
          "recoil": {
            "$ref": "#/components/schemas/OmitIWieldnever"
          },
          "surrender": {
            "$ref": "#/components/schemas/OmitIParamsholdkind"
          },
          "takeAim": {
            "$ref": "#/components/schemas/OmitIPresentcarriage"
          }
        },
        "required": [
          "highReady",
          "lowReady",
          "reachHolster",
          "recoil",
          "surrender",
          "takeAim"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIPresentcarriage": {
        "type": "object",
        "properties": {
          "track": {
            "type": "boolean",
            "description": "Whether the aim follows the target while the carriage is held; `false` when absent."
          },
          "gun": {
            "type": "string",
            "description": "The held firearm's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The shooting hand; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands hold it; 2 when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place straight ahead at eye height when absent. A ready position faces it without aiming."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the carriage is held once reached; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsholdkindsidetargetwith": {
        "type": "object",
        "properties": {
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIWieldnever": {
        "type": "object",
        "properties": {
          "gun": {
            "type": "string",
            "description": "The held firearm's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The shooting hand; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands hold it; 2 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o11": {
        "type": "object",
        "properties": {
          "carryBag": {
            "$ref": "#/components/schemas/OmitIParamshow"
          },
          "carryBox": {
            "$ref": "#/components/schemas/OmitIParamshow"
          },
          "carryOnHip": {
            "$ref": "#/components/schemas/OmitIParamshow"
          },
          "hammer": {
            "$ref": "#/components/schemas/OmitIParamscyclestool"
          },
          "haul": {
            "$ref": "#/components/schemas/OmitIParamshowloadpace"
          },
          "hurl": {
            "$ref": "#/components/schemas/OmitIParamsstyle"
          },
          "pushCart": {
            "$ref": "#/components/schemas/OmitIParamshow"
          },
          "saw": {
            "$ref": "#/components/schemas/OmitIParamstool"
          },
          "screw": {
            "$ref": "#/components/schemas/OmitIParamstool"
          },
          "scrub": {
            "$ref": "#/components/schemas/OmitIParamscycles"
          },
          "stir": {
            "$ref": "#/components/schemas/OmitIParamstool"
          },
          "toss": {
            "$ref": "#/components/schemas/OmitIParamsstyle"
          }
        },
        "required": [
          "carryBag",
          "carryBox",
          "carryOnHip",
          "hammer",
          "haul",
          "hurl",
          "pushCart",
          "saw",
          "screw",
          "scrub",
          "stir",
          "toss"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamshow": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point walked to, world metres."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The loaded side for `oneHand` and `hip`; `right` when absent."
          },
          "load": {
            "type": "number",
            "minimum": 0,
            "maximum": 0.25,
            "description": "The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The walk's pace; `normal` when absent."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamscyclestool": {
        "type": "object",
        "properties": {
          "on": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The work point: a nail, a cut line's middle, a pot's centre, a screw."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The working hand; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "on"
        ],
        "additionalProperties": false
      },
      "OmitIParamshowloadpace": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point walked to, world metres."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The loaded side for `oneHand` and `hip`; `right` when absent."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamsstyle": {
        "type": "object",
        "properties": {
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "Where the object goes."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The throwing hand; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "at"
        ],
        "additionalProperties": false
      },
      "OmitIParamstool": {
        "type": "object",
        "properties": {
          "on": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The work point: a nail, a cut line's middle, a pot's centre, a screw."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The working hand; `right` when absent."
          },
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "How many cycles; 4 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "on"
        ],
        "additionalProperties": false
      },
      "OmitIParamscycles": {
        "type": "object",
        "properties": {
          "on": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The middle of the patch wiped, on the surface's top."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "on"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o12": {
        "type": "object",
        "properties": {
          "ride": {
            "$ref": "#/components/schemas/HumanRide.IParams"
          }
        },
        "required": [
          "ride"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "HumanRide.IParams": {
        "type": "object",
        "properties": {
          "on": {
            "type": "string",
            "description": "The moving prop ridden: its subject id in the performance."
          },
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Seconds ridden, more than none."
          },
          "rising": {
            "oneOf": [
              {
                "type": "number",
                "exclusiveMinimum": 0
              },
              {
                "type": "object",
                "properties": {
                  "cue": {
                    "type": "string"
                  }
                },
                "required": [
                  "cue"
                ],
                "additionalProperties": false
              }
            ],
            "description": "A rising trot: the mount's stride time, seconds, or the cue track of\nthe performance that holds its strides (the footfalls of one\ndiagonal, as the mount's own ride publishes them). The rider stands\nin the stirrups and sits again once a stride, the seat rising `POST`\nthigh lengths off the saddle, so both feet must rest on the support.\nOn a cue track the seat is down at each of its instants and seated\nbefore the first and after the last. Seated throughout when absent."
          },
          "feet": {
            "$ref": "#/components/schemas/PartialRecordleftrightstring",
            "description": "The support's point each foot stays on, by its id, for a part that\nmoves within the support: a pedal on its turning crank, a stirrup on\na trotting horse (`IHumanProp.point`). The foot keeps the place it\nhad on that point when the ride began. A foot not named, or a point\nthat only moves with the support, is carried rigidly."
          },
          "seat": {
            "type": "string",
            "description": "The support's point the seat stays on, by its id, where the seat\nitself moves within the support: a saddle on a horse's trunk, which\nrises and falls with the stride over the course its root follows.\nThe body is carried with the support alone when absent."
          },
          "hands": {
            "$ref": "#/components/schemas/PartialRecordleftrightstring",
            "description": "The support's point each hand holds, by its id: a handlebar grip, a\nrein, a wheel's rim. The hand goes to it over `TAKE` seconds from the\nride's start and stays on it, following a part that moves within the\nsupport. The arms are still yielded, so an arm action over the ride\ntakes a hand off for as long as it lasts. The hand turns to the\npoint and closes on it (`HumanMountRider.hold`)."
          }
        },
        "required": [
          "on",
          "seconds"
        ],
        "additionalProperties": false,
        "description": "Parameters of a ride."
      },
      "PartialRecordleftrightstring": {
        "type": "object",
        "properties": {
          "left": {
            "type": "string"
          },
          "right": {
            "type": "string"
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o13": {
        "type": "object",
        "properties": {
          "bearing": {
            "$ref": "#/components/schemas/HumanCarried.IBearing"
          },
          "borne": {
            "$ref": "#/components/schemas/HumanCarried.IBorne"
          },
          "carried": {
            "$ref": "#/components/schemas/HumanCarried.IParams"
          }
        },
        "required": [
          "bearing",
          "borne",
          "carried"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "HumanCarried.IBearing": {
        "type": "object",
        "properties": {
          "carry": {
            "oneOf": [
              {
                "const": "ankleDrag"
              },
              {
                "const": "armpitDrag"
              },
              {
                "const": "collarDrag"
              },
              {
                "const": "cradle"
              },
              {
                "const": "overShoulder"
              },
              {
                "const": "piggyback"
              },
              {
                "const": "supported"
              },
              {
                "const": "supportedLeft"
              }
            ],
            "description": "The carry; `piggyback` when absent."
          },
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Seconds held, more than none; 2 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of the carrier's hold in a named carry."
      },
      "HumanCarried.IBorne": {
        "type": "object",
        "properties": {
          "lift": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the lift into the carry takes, at the start; none when absent."
          },
          "setDown": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the set-down takes, at the end; none when absent."
          },
          "by": {
            "type": "string",
            "description": "The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing."
          },
          "carry": {
            "oneOf": [
              {
                "const": "ankleDrag"
              },
              {
                "const": "armpitDrag"
              },
              {
                "const": "collarDrag"
              },
              {
                "const": "cradle"
              },
              {
                "const": "overShoulder"
              },
              {
                "const": "piggyback"
              },
              {
                "const": "supported"
              },
              {
                "const": "supportedLeft"
              }
            ],
            "description": "The carry; `piggyback` when absent."
          },
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Seconds carried, more than none; 2 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of being carried in a named carry."
      },
      "HumanCarried.IParams": {
        "type": "object",
        "properties": {
          "by": {
            "type": "string",
            "description": "The carrier's subject id."
          },
          "on": {
            "oneOf": [
              {
                "const": "chest"
              },
              {
                "const": "head"
              },
              {
                "const": "hips"
              },
              {
                "const": "jaw"
              },
              {
                "const": "leftEye"
              },
              {
                "const": "leftFoot"
              },
              {
                "const": "leftHand"
              },
              {
                "const": "leftIndexDistal"
              },
              {
                "const": "leftIndexIntermediate"
              },
              {
                "const": "leftIndexProximal"
              },
              {
                "const": "leftLittleDistal"
              },
              {
                "const": "leftLittleIntermediate"
              },
              {
                "const": "leftLittleProximal"
              },
              {
                "const": "leftLowerArm"
              },
              {
                "const": "leftLowerLeg"
              },
              {
                "const": "leftMiddleDistal"
              },
              {
                "const": "leftMiddleIntermediate"
              },
              {
                "const": "leftMiddleProximal"
              },
              {
                "const": "leftRingDistal"
              },
              {
                "const": "leftRingIntermediate"
              },
              {
                "const": "leftRingProximal"
              },
              {
                "const": "leftShoulder"
              },
              {
                "const": "leftThumbDistal"
              },
              {
                "const": "leftThumbMetacarpal"
              },
              {
                "const": "leftThumbProximal"
              },
              {
                "const": "leftToes"
              },
              {
                "const": "leftUpperArm"
              },
              {
                "const": "leftUpperLeg"
              },
              {
                "const": "neck"
              },
              {
                "const": "rightEye"
              },
              {
                "const": "rightFoot"
              },
              {
                "const": "rightHand"
              },
              {
                "const": "rightIndexDistal"
              },
              {
                "const": "rightIndexIntermediate"
              },
              {
                "const": "rightIndexProximal"
              },
              {
                "const": "rightLittleDistal"
              },
              {
                "const": "rightLittleIntermediate"
              },
              {
                "const": "rightLittleProximal"
              },
              {
                "const": "rightLowerArm"
              },
              {
                "const": "rightLowerLeg"
              },
              {
                "const": "rightMiddleDistal"
              },
              {
                "const": "rightMiddleIntermediate"
              },
              {
                "const": "rightMiddleProximal"
              },
              {
                "const": "rightRingDistal"
              },
              {
                "const": "rightRingIntermediate"
              },
              {
                "const": "rightRingProximal"
              },
              {
                "const": "rightShoulder"
              },
              {
                "const": "rightThumbDistal"
              },
              {
                "const": "rightThumbMetacarpal"
              },
              {
                "const": "rightThumbProximal"
              },
              {
                "const": "rightToes"
              },
              {
                "const": "rightUpperArm"
              },
              {
                "const": "rightUpperLeg"
              },
              {
                "const": "spine"
              },
              {
                "const": "upperChest"
              }
            ],
            "description": "The carrier's bone the body goes with; the upper chest when absent."
          },
          "seconds": {
            "type": "number",
            "description": "Seconds carried."
          }
        },
        "required": [
          "by",
          "seconds"
        ],
        "additionalProperties": false,
        "description": "Parameters of being carried."
      },
      "IHumanLexiconParams.Merged-o14": {
        "type": "object",
        "properties": {
          "backstroke": {
            "$ref": "#/components/schemas/OmitIParamskind-o6"
          },
          "battingStance": {
            "$ref": "#/components/schemas/OmitIParamskind-o7"
          },
          "bounce": {
            "$ref": "#/components/schemas/OmitIParamskind-o5"
          },
          "boxStep": {
            "$ref": "#/components/schemas/OmitIParamskind-o5"
          },
          "breaststroke": {
            "$ref": "#/components/schemas/OmitIParamskind-o6"
          },
          "catcherCrouch": {
            "$ref": "#/components/schemas/OmitIParamskind-o7"
          },
          "chairPose": {
            "$ref": "#/components/schemas/OmitIParamsdepthhold"
          },
          "childsPose": {
            "$ref": "#/components/schemas/OmitIParamsholdkind-o1"
          },
          "corpsePose": {
            "$ref": "#/components/schemas/OmitIParamsholdposition"
          },
          "defensiveSlide": {
            "$ref": "#/components/schemas/OmitIParamsdirectionsteps"
          },
          "dribble": {
            "$ref": "#/components/schemas/OmitIParamskind-o8"
          },
          "fieldGrounder": {
            "$ref": "#/components/schemas/OmitIParamskind-o7"
          },
          "floating": {
            "$ref": "#/components/schemas/OmitIParamskind-o6"
          },
          "frontCrawl": {
            "$ref": "#/components/schemas/OmitIParamskind-o6"
          },
          "golfAddress": {
            "$ref": "#/components/schemas/OmitIParamskind-o9"
          },
          "handstand": {
            "$ref": "#/components/schemas/OmitIParamsnever"
          },
          "highKnees": {
            "$ref": "#/components/schemas/OmitIParamskind-o4"
          },
          "hipFlexorStretch": {
            "$ref": "#/components/schemas/OmitIParamsholdkind-o1"
          },
          "horseStance": {
            "$ref": "#/components/schemas/OmitIParamskind-o10"
          },
          "karatePunches": {
            "$ref": "#/components/schemas/OmitIParamskind-o10"
          },
          "lunges": {
            "$ref": "#/components/schemas/OmitIParamskind-o4"
          },
          "neckStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o11"
          },
          "quadStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o11"
          },
          "readyPosition": {
            "$ref": "#/components/schemas/OmitIParamskind-o9"
          },
          "shoulderStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o11"
          },
          "sideStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o11"
          },
          "splitStep": {
            "$ref": "#/components/schemas/OmitIParamskind-o9"
          },
          "sprintStart": {
            "$ref": "#/components/schemas/OmitIParamsnever-o1"
          },
          "stepTouch": {
            "$ref": "#/components/schemas/OmitIParamskind-o5"
          },
          "taiChiPush": {
            "$ref": "#/components/schemas/OmitIParamskind-o10"
          },
          "throwIn": {
            "$ref": "#/components/schemas/OmitIParamskind-o8"
          },
          "toeTouch": {
            "$ref": "#/components/schemas/OmitIParamsholdtoward"
          },
          "treadWater": {
            "$ref": "#/components/schemas/OmitIParamskind-o6"
          },
          "treePose": {
            "$ref": "#/components/schemas/OmitIParamskind-o11"
          },
          "volleyDig": {
            "$ref": "#/components/schemas/OmitIParamskind-o8"
          },
          "volleySet": {
            "$ref": "#/components/schemas/OmitIParamskind-o8"
          }
        },
        "required": [
          "backstroke",
          "battingStance",
          "bounce",
          "boxStep",
          "breaststroke",
          "catcherCrouch",
          "chairPose",
          "childsPose",
          "corpsePose",
          "defensiveSlide",
          "dribble",
          "fieldGrounder",
          "floating",
          "frontCrawl",
          "golfAddress",
          "handstand",
          "highKnees",
          "hipFlexorStretch",
          "horseStance",
          "karatePunches",
          "lunges",
          "neckStretch",
          "quadStretch",
          "readyPosition",
          "shoulderStretch",
          "sideStretch",
          "splitStep",
          "sprintStart",
          "stepTouch",
          "taiChiPush",
          "throwIn",
          "toeTouch",
          "treadWater",
          "treePose",
          "volleyDig",
          "volleySet"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamskind-o6": {
        "type": "object",
        "properties": {
          "water": {
            "type": "number",
            "description": "The water plane's world height, metres; the entry's chest height when absent."
          },
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "Cycles; 3 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o7": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held; 1 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsholdkind-o1": {
        "type": "object",
        "properties": {
          "knee": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The knee that goes down first; `right` when absent."
          },
          "rise": {
            "type": "boolean",
            "description": "Whether the body rises again at the end; `true` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o8": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The dribbling hand; `right` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Dribble bounces; 4 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o9": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The racket or lead hand; `right` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held; 0.6 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsnever": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held inverted; 2 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o10": {
        "type": "object",
        "properties": {
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Punches of a choku-zuki series; 4 when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the stance is held; 1 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o11": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The side stretched or lifted; `right` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held; `HOLD` when absent."
          },
          "intensity": {
            "oneOf": [
              {
                "const": "mild"
              },
              {
                "const": "moderate"
              }
            ],
            "description": "How far into the range; `moderate` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsnever-o1": {
        "type": "object",
        "properties": {
          "front": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The front foot; `left` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held in the set; 1.5 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsholdtoward": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "strategy": {
            "oneOf": [
              {
                "const": "auto"
              },
              {
                "const": "semiSquat"
              },
              {
                "const": "squat"
              },
              {
                "const": "stoop"
              }
            ],
            "description": "How the body lowers; `auto` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o15": {
        "type": "object",
        "properties": {
          "bearCrawl": {
            "$ref": "#/components/schemas/OmitIParamskind-o12"
          },
          "bentOverRow": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "bicycleCrunch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "birdDog": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "calfRaise": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "curl": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "deadBug": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "declinePushUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "dip": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "frontRaise": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "frontSquat": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "gobletSquat": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "goodMorning": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "hipThrust": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "inchworm": {
            "$ref": "#/components/schemas/OmitIParamskind-o12"
          },
          "inclinePushUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "lateralRaise": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "lyingLegRaise": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "pikePushUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "powerClean": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "romanianDeadlift": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "russianTwist": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "shrug": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "snatch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "splitSquat": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "stepUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "superman": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "tricepsExtension": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "wallSit": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          }
        },
        "required": [
          "bearCrawl",
          "bentOverRow",
          "bicycleCrunch",
          "birdDog",
          "calfRaise",
          "curl",
          "deadBug",
          "declinePushUp",
          "dip",
          "frontRaise",
          "frontSquat",
          "gobletSquat",
          "goodMorning",
          "hipThrust",
          "inchworm",
          "inclinePushUp",
          "lateralRaise",
          "lyingLegRaise",
          "pikePushUp",
          "powerClean",
          "romanianDeadlift",
          "russianTwist",
          "shrug",
          "snatch",
          "splitSquat",
          "stepUp",
          "superman",
          "tricepsExtension",
          "wallSit"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamskind-o12": {
        "type": "object",
        "properties": {
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "How many crawl cycles; 3 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o13": {
        "type": "object",
        "properties": {
          "reps": {
            "type": "integer",
            "minimum": 1,
            "description": "Repetitions; the kind's own count when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds a held pose is stayed in; the kind's own when absent."
          },
          "bar": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The middle of the bar between the hands, world metres, for a hanging kind; `WorkoutPlace.BAR` above the standing reach when absent."
          },
          "on": {
            "type": "object",
            "properties": {
              "prop": {
                "type": "string"
              },
              "affordance": {
                "type": "string"
              },
              "other": {
                "type": "string"
              }
            },
            "required": [
              "prop",
              "affordance"
            ],
            "additionalProperties": false,
            "description": "The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent."
          },
          "stay": {
            "type": "boolean",
            "description": "Whether the body stays on its support at the end instead of standing up; `false` when absent."
          },
          "load": {
            "$ref": "#/components/schemas/WorkoutLoad.IParams",
            "description": "The prop the exercise is done with, already held (`WorkoutLoad`); none when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "WorkoutLoad.IParams": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The held prop's subject id."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "other": {
            "type": "string",
            "description": "The prop's affordance the other hand takes (a bar's second handle); one hand holds when absent."
          },
          "handle": {
            "type": "string",
            "description": "The prop's affordance the holding hand took, which with `other` gives the bar's own line; the line from the hand's grip to `other` when absent, which leaves a bar a few degrees out of level by the palm's depth."
          }
        },
        "required": [
          "prop"
        ],
        "additionalProperties": false,
        "description": "The load's parameters."
      },
      "IHumanLexiconParams.Merged-o16": {
        "type": "object",
        "properties": {
          "farmersHold": {
            "$ref": "#/components/schemas/OmitIParamsnever-o2"
          },
          "farmersWalk": {
            "$ref": "#/components/schemas/OmitIParamsarmSwingpace"
          },
          "sledPush": {
            "$ref": "#/components/schemas/OmitIParamslean"
          }
        },
        "required": [
          "farmersHold",
          "farmersWalk",
          "sledPush"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsnever-o2": {
        "type": "object",
        "properties": {
          "left": {
            "type": "string",
            "description": "The prop the left hand holds; that arm is left to the walk when absent."
          },
          "right": {
            "type": "string",
            "description": "The prop the right hand holds; that arm is left to the walk when absent."
          },
          "seconds": {
            "type": "number",
            "description": "Seconds the carry lasts; 3 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsarmSwingpace": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "stride": {
            "type": "number",
            "minimum": 0.6,
            "maximum": 1.3,
            "description": "Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6, 1.3]; 1 when absent.",
            "default": 1
          },
          "elbows": {
            "type": "number",
            "minimum": 0,
            "maximum": 30,
            "description": "Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.",
            "default": 0
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamslean": {
        "type": "object",
        "properties": {
          "sled": {
            "type": "string",
            "description": "The pushed prop's subject id."
          },
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "Where the walk goes, world metres."
          },
          "left": {
            "type": "string",
            "description": "The handle the left hand takes, an affordance id; `left` when absent."
          },
          "right": {
            "type": "string",
            "description": "The handle the right hand takes, an affordance id; `right` when absent."
          }
        },
        "required": [
          "sled",
          "to"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o17": {
        "type": "object",
        "properties": {
          "backwardRoll": {
            "$ref": "#/components/schemas/OmitIParamsdirection"
          },
          "forwardRoll": {
            "$ref": "#/components/schemas/OmitIParamsdirection"
          }
        },
        "required": [
          "backwardRoll",
          "forwardRoll"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsdirection": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o18": {
        "type": "object",
        "properties": {
          "goalkeeperDiveLeft": {
            "$ref": "#/components/schemas/OmitIParamskindside"
          },
          "goalkeeperDiveRight": {
            "$ref": "#/components/schemas/OmitIParamskindside"
          },
          "slidingTackle": {
            "$ref": "#/components/schemas/OmitIParamskind-o14"
          }
        },
        "required": [
          "goalkeeperDiveLeft",
          "goalkeeperDiveRight",
          "slidingTackle"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamskindside": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamskind-o14": {
        "type": "object",
        "properties": {
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The side a dive goes to; `left` when absent; unread by a slide."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o19": {
        "type": "object",
        "properties": {
          "backhandDrive": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "batSwing": {
            "$ref": "#/components/schemas/OmitICutfromhands"
          },
          "bunt": {
            "$ref": "#/components/schemas/OmitIParamsguardhands"
          },
          "checkSwing": {
            "$ref": "#/components/schemas/OmitICutfeintfromhands"
          },
          "forehand": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "golfSwing": {
            "$ref": "#/components/schemas/OmitICutfromhands"
          },
          "overheadSmash": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "putt": {
            "$ref": "#/components/schemas/OmitICutfromhands"
          },
          "spike": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "topspin": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "twoHandBackhand": {
            "$ref": "#/components/schemas/OmitICutfromhands"
          },
          "volley": {
            "$ref": "#/components/schemas/OmitICutfrom"
          }
        },
        "required": [
          "backhandDrive",
          "batSwing",
          "bunt",
          "checkSwing",
          "forehand",
          "golfSwing",
          "overheadSmash",
          "putt",
          "spike",
          "topspin",
          "twoHandBackhand",
          "volley"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitICutfromhands": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsguardhands": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitICutfeintfromhands": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o20": {
        "type": "object",
        "properties": {
          "backSalto": {
            "$ref": "#/components/schemas/OmitIParamsway"
          },
          "boxJump": {
            "$ref": "#/components/schemas/OmitIParamsnever-o3"
          },
          "cartwheelLeft": {
            "$ref": "#/components/schemas/OmitIParamsto"
          },
          "cartwheelRight": {
            "$ref": "#/components/schemas/OmitIParamsto"
          },
          "dash": {
            "$ref": "#/components/schemas/OmitIParamspace-o1"
          },
          "frontSalto": {
            "$ref": "#/components/schemas/OmitIParamsway"
          },
          "gloveCatch": {
            "$ref": "#/components/schemas/OmitIParamshands"
          },
          "kickLeft": {
            "$ref": "#/components/schemas/OmitIParamsfoot"
          },
          "kickRight": {
            "$ref": "#/components/schemas/OmitIParamsfoot"
          },
          "leap": {
            "$ref": "#/components/schemas/OmitIParamsnever-o3"
          },
          "pitch": {
            "$ref": "#/components/schemas/OmitIParamsstyle"
          },
          "pushPass": {
            "$ref": "#/components/schemas/OmitIParamsstyle"
          },
          "twoHandCatch": {
            "$ref": "#/components/schemas/OmitIParamshands"
          },
          "underarmPitch": {
            "$ref": "#/components/schemas/OmitIParamsstyle"
          }
        },
        "required": [
          "backSalto",
          "boxJump",
          "cartwheelLeft",
          "cartwheelRight",
          "dash",
          "frontSalto",
          "gloveCatch",
          "kickLeft",
          "kickRight",
          "leap",
          "pitch",
          "pushPass",
          "twoHandCatch",
          "underarmPitch"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsway": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to land on, world metres."
          },
          "apex": {
            "type": "number",
            "description": "Apex height of the flight above take-off, metres; `APEX` of the stature when absent."
          },
          "turns": {
            "type": "integer",
            "minimum": 1,
            "description": "Whole turns; 1 when absent."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamsnever-o3": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's."
          },
          "on": {
            "type": "string",
            "description": "The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent."
          },
          "apex": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Apex height of the flight above take-off, metres; positive."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false
      },
      "OmitIParamsto": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Seconds the cartwheel takes; `SECONDS` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamshands": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "description": "The anchor of the throw caught."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The catching hand when one; `right` when absent."
          },
          "radius": {
            "type": "number",
            "description": "The object's radius, metres; 0.11 when absent (a handball, provisional)."
          }
        },
        "required": [
          "from"
        ],
        "additionalProperties": false
      },
      "OmitIParamsfoot": {
        "type": "object",
        "properties": {
          "ball": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The ball's centre."
          },
          "radius": {
            "type": "number",
            "description": "The ball's radius, metres; 0.11 when absent (a size 5 football)."
          },
          "toward": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the ball is kicked toward; along the heading when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "ball"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o21": {
        "type": "object",
        "properties": {
          "aSkip": {
            "$ref": "#/components/schemas/OmitIParamskind-o4"
          },
          "armCircles": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "bSkip": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "backSquat": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "barSwing": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "benchPress": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "burpee": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "buttKicks": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "calfStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "chestStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "chestTrap": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "chinUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "closedHold": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "cobra": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "crunch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "cycling": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "deadHang": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "deadlift": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "downwardDog": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "frontStance": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "gluteBridge": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "hammerTurn": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "header": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "hurdlerStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "jumpRope": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "kettlebellSwing": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "kneeRaise": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "legSwings": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "lowBlock": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "lungeTwist": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "mountainClimber": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "mountainPose": {
            "$ref": "#/components/schemas/OmitIParamsseconds"
          },
          "overheadPress": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "plank": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "pnfHamstring": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "pullUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "pushUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "risingBlock": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "rowing": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "seatedFold": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "sidePlank": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "sitUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "spin": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "strides": {
            "$ref": "#/components/schemas/OmitIParamspace-o1"
          },
          "sunSalutation": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "thighTrap": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "triangle": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "tricepsStretch": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "underarmTurn": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "warriorOne": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "warriorTwo": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          },
          "widePushUp": {
            "$ref": "#/components/schemas/OmitIParamskind-o13"
          }
        },
        "required": [
          "aSkip",
          "armCircles",
          "bSkip",
          "backSquat",
          "barSwing",
          "benchPress",
          "burpee",
          "buttKicks",
          "calfStretch",
          "chestStretch",
          "chestTrap",
          "chinUp",
          "closedHold",
          "cobra",
          "crunch",
          "cycling",
          "deadHang",
          "deadlift",
          "downwardDog",
          "frontStance",
          "gluteBridge",
          "hammerTurn",
          "header",
          "hurdlerStretch",
          "jumpRope",
          "kettlebellSwing",
          "kneeRaise",
          "legSwings",
          "lowBlock",
          "lungeTwist",
          "mountainClimber",
          "mountainPose",
          "overheadPress",
          "plank",
          "pnfHamstring",
          "pullUp",
          "pushUp",
          "risingBlock",
          "rowing",
          "seatedFold",
          "sidePlank",
          "sitUp",
          "spin",
          "strides",
          "sunSalutation",
          "thighTrap",
          "triangle",
          "tricepsStretch",
          "underarmTurn",
          "warriorOne",
          "warriorTwo",
          "widePushUp"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsseconds": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o22": {
        "type": "object",
        "properties": {
          "fosburyFlop": {
            "$ref": "#/components/schemas/OmitIParamsnever-o4"
          },
          "frontHandspring": {
            "$ref": "#/components/schemas/OmitIParamsnever-o5"
          },
          "handspringVault": {
            "$ref": "#/components/schemas/OmitIParamsnever-o6"
          },
          "roundOffLeft": {
            "$ref": "#/components/schemas/OmitIParamslead"
          },
          "roundOffRight": {
            "$ref": "#/components/schemas/OmitIParamslead"
          },
          "vaultOnPole": {
            "$ref": "#/components/schemas/OmitIParamsnever-o7"
          }
        },
        "required": [
          "fosburyFlop",
          "frontHandspring",
          "handspringVault",
          "roundOffLeft",
          "roundOffRight",
          "vaultOnPole"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamsnever-o4": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "Where the body comes down on its back, world metres: its height is the landing surface's, the floor's 0 or a mat's top."
          },
          "on": {
            "type": "string",
            "description": "The prop landed on, its subject id; the floor when absent."
          },
          "bar": {
            "type": "number",
            "description": "The bar's height, metres: the height the centre of mass peaks at."
          }
        },
        "required": [
          "to",
          "bar"
        ],
        "additionalProperties": false
      },
      "OmitIParamsnever-o5": {
        "type": "object",
        "properties": {
          "lead": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The leg that lunges; `left` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsnever-o6": {
        "type": "object",
        "properties": {
          "lead": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The leg that lunges; `left` when absent."
          },
          "on": {
            "type": "string",
            "description": "The prop vaulted over, its subject id; its `surface` is where the hands land."
          }
        },
        "required": [
          "on"
        ],
        "additionalProperties": false
      },
      "OmitIParamslead": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Seconds the round-off takes; `SECONDS` when absent."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamsnever-o7": {
        "type": "object",
        "properties": {
          "pole": {
            "type": "string",
            "description": "The pole, its subject id; a hand holds it at the entry."
          },
          "end": {
            "type": "string",
            "description": "The pole's affordance planted on the floor; `tip` when absent."
          },
          "on": {
            "type": "string",
            "description": "The prop landed on, its subject id, whose `surface` is the landing's height; the floor when absent."
          }
        },
        "required": [
          "pole"
        ],
        "additionalProperties": false
      },
      "IHumanLexiconParams.Merged-o23": {
        "type": "object",
        "properties": {
          "cut": {
            "$ref": "#/components/schemas/HumanSword.ICut"
          },
          "guard": {
            "$ref": "#/components/schemas/HumanSwordGuard.IParams"
          },
          "parry": {
            "$ref": "#/components/schemas/HumanSwordParry.IParry"
          },
          "thrust": {
            "$ref": "#/components/schemas/HumanSword.IAttack"
          }
        },
        "required": [
          "cut",
          "guard",
          "parry",
          "thrust"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "HumanSword.ICut": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          },
          "from": {
            "oneOf": [
              {
                "const": "above"
              },
              {
                "const": "aboveBackhand"
              },
              {
                "const": "aboveForehand"
              },
              {
                "const": "backhand"
              },
              {
                "const": "below"
              },
              {
                "const": "belowBackhand"
              },
              {
                "const": "belowForehand"
              },
              {
                "const": "forehand"
              }
            ],
            "description": "Where the cut comes from; `above` when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of a cut."
      },
      "HumanSwordGuard.IParams": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "guard": {
            "oneOf": [
              {
                "const": "hanging"
              },
              {
                "const": "high"
              },
              {
                "const": "low"
              },
              {
                "const": "middle"
              },
              {
                "const": "ox"
              },
              {
                "const": "shoulder"
              },
              {
                "const": "tail"
              }
            ],
            "description": "The guard; `middle` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of a guard."
      },
      "HumanSwordParry.IParry": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "against": {
            "type": "string",
            "description": "The anchor of the cut or thrust it meets; a drill to `line` when absent."
          },
          "line": {
            "oneOf": [
              {
                "const": "highInside"
              },
              {
                "const": "highOutside"
              },
              {
                "const": "lowInside"
              },
              {
                "const": "lowOutside"
              }
            ],
            "description": "The line closed when it answers no attack; `highOutside` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of a parry."
      },
      "HumanSword.IAttack": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "tip": {
            "type": "string",
            "description": "The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of a cut or a thrust."
      },
      "IHumanLexiconParams.Merged-o24": {
        "type": "object",
        "properties": {
          "draw": {
            "$ref": "#/components/schemas/OmitIParamshandleliftuse"
          },
          "fire": {
            "$ref": "#/components/schemas/HumanWeaponFirearm.IWield"
          },
          "holster": {
            "$ref": "#/components/schemas/OmitIParamsnever-o8"
          },
          "present": {
            "$ref": "#/components/schemas/HumanWeaponFirearm.IPresent"
          }
        },
        "required": [
          "draw",
          "fire",
          "holster",
          "present"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitIParamshandleliftuse": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The prop's subject id."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The grasping hand; `right` when absent."
          }
        },
        "required": [
          "prop"
        ],
        "additionalProperties": false
      },
      "HumanWeaponFirearm.IWield": {
        "type": "object",
        "properties": {
          "gun": {
            "type": "string",
            "description": "The held firearm's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The shooting hand; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands hold it; 2 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "What every firearm action takes."
      },
      "OmitIParamsnever-o8": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The held prop's subject id."
          },
          "at": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "Where the prop's origin goes, world metres; required unless `on` is given."
          },
          "on": {
            "type": "object",
            "properties": {
              "bone": {
                "$ref": "#/components/schemas/AutoMovieHumanoidBone",
                "description": "The bone."
              },
              "offset": {
                "$ref": "#/components/schemas/IHumanProp.IFrame",
                "description": "The prop's frame in the bone's posed frame, metres."
              }
            },
            "required": [
              "bone",
              "offset"
            ],
            "additionalProperties": false,
            "description": "The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent."
          },
          "yaw": {
            "type": "number",
            "description": "The prop's heading about +Y at rest, degrees; its current heading when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The holding hand; `right` when absent."
          }
        },
        "required": [
          "prop"
        ],
        "additionalProperties": false
      },
      "IHumanProp.IFrame": {
        "type": "object",
        "properties": {
          "position": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "Origin, world metres."
          },
          "rotation": {
            "$ref": "#/components/schemas/IAutoMovieQuaternion",
            "description": "Rotation from the prop's own axes to the world."
          }
        },
        "required": [
          "position",
          "rotation"
        ],
        "additionalProperties": false,
        "description": "A rigid world frame."
      },
      "IAutoMovieQuaternion": {
        "type": "object",
        "properties": {
          "x": {
            "type": "number",
            "description": "Imaginary i component."
          },
          "y": {
            "type": "number",
            "description": "Imaginary j component."
          },
          "z": {
            "type": "number",
            "description": "Imaginary k component."
          },
          "w": {
            "type": "number",
            "description": "Real (scalar) component."
          }
        },
        "required": [
          "x",
          "y",
          "z",
          "w"
        ],
        "additionalProperties": false,
        "description": "A unit quaternion `(x, y, z, w)` describing a 3D rotation.\n\nJoint articulation is authored as semantic degrees through IAutoMovieJointPose; jointToQuaternion converts those angles to bone-local rotations, motionToClip emits general node tracks, and decomposeJointRotation reads rotations back into semantic angles during imported-motion conversion. Placement records, including IAutoMovieExplicitInstanceTransform, may carry a quaternion directly.\n\nComponent order is glTF's `(x, y, z, w)`, and Quaternion.multiply(a, b) applies b first without normalization. validateTransformScalars refuses nonfinite components and a norm more than 1e-6 from one, retaining admitted components unchanged. Direct rotateVector and matrix composition likewise do not normalize; callers needing a unit copy use Quaternion.normalize, whose zero-input convention returns identity. q and -q represent the same rotation, and no record requires either sign."
      },
      "HumanWeaponFirearm.IPresent": {
        "type": "object",
        "properties": {
          "track": {
            "type": "boolean",
            "description": "Whether the aim follows the target while the carriage is held; `false` when absent."
          },
          "gun": {
            "type": "string",
            "description": "The held firearm's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The shooting hand; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands hold it; 2 when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place straight ahead at eye height when absent. A ready position faces it without aiming."
          },
          "carriage": {
            "oneOf": [
              {
                "const": "aim"
              },
              {
                "const": "highReady"
              },
              {
                "const": "lowReady"
              }
            ],
            "description": "The carriage; `aim` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the carriage is held once reached; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of presenting the weapon."
      },
      "IHumanLexiconParams.Merged-o25": {
        "type": "object",
        "properties": {
          "clubStrike": {
            "$ref": "#/components/schemas/OmitICutfromtip"
          },
          "clubSwing": {
            "$ref": "#/components/schemas/OmitICutfromtip"
          },
          "knifeBackslash": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "knifeSlash": {
            "$ref": "#/components/schemas/OmitICutfrom"
          },
          "knifeStab": {
            "$ref": "#/components/schemas/OmitIAttacknever"
          },
          "reload": {
            "$ref": "#/components/schemas/OmitIParamscountkindsidewith"
          },
          "stabOverhand": {
            "$ref": "#/components/schemas/OmitICutfrom"
          }
        },
        "required": [
          "clubStrike",
          "clubSwing",
          "knifeBackslash",
          "knifeSlash",
          "knifeStab",
          "reload",
          "stabOverhand"
        ],
        "additionalProperties": false,
        "description": "A union of records merged into one record of every key of each, as one mapped type rather than an intersection, which schema generators read as one object."
      },
      "OmitICutfromtip": {
        "type": "object",
        "properties": {
          "blade": {
            "type": "string",
            "description": "The held blade's prop subject id; the bare hand when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand that holds it; `right` when absent."
          },
          "hands": {
            "oneOf": [
              {
                "const": 1
              },
              {
                "const": 2
              }
            ],
            "description": "How many hands are on the grip; 2 for a blade whose grip declares a two-hand grasp, else 1."
          },
          "edge": {
            "type": "string",
            "description": "See `tip`."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What it is aimed at; a place at the blade's reach ahead when absent."
          },
          "advance": {
            "oneOf": [
              {
                "const": "lunge"
              },
              {
                "const": "none"
              },
              {
                "const": "step"
              }
            ],
            "description": "How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "lands"
              },
              {
                "const": "parried"
              }
            ],
            "description": "Whether it lands or is stopped short for a parry to meet; `lands` when absent."
          },
          "feint": {
            "type": "number",
            "exclusiveMinimum": 0,
            "exclusiveMaximum": 1,
            "description": "A feint: the share of the stroke shown before it is withdrawn, in (0, 1); it then neither lands nor is parried."
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "OmitIParamscountkindsidewith": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false
      },
      "IHumanActionParams": {
        "type": "object",
        "properties": {
          "stand": {
            "$ref": "#/components/schemas/stand.IParams",
            "description": "Quiet standing."
          },
          "walk": {
            "$ref": "#/components/schemas/walk.IParams",
            "description": "Walking to a floor point."
          },
          "run": {
            "$ref": "#/components/schemas/run.IParams",
            "description": "Running to a floor point."
          },
          "jump": {
            "$ref": "#/components/schemas/jump.IParams",
            "description": "Jumping to a floor point."
          },
          "approach": {
            "$ref": "#/components/schemas/approach.IParams",
            "description": "Walking up to a target."
          },
          "look": {
            "$ref": "#/components/schemas/look.IParams",
            "description": "Looking at a target."
          },
          "gesture": {
            "$ref": "#/components/schemas/gesture.IParams",
            "description": "A communicative gesture."
          },
          "rest": {
            "$ref": "#/components/schemas/rest.IParams",
            "description": "The hands at rest places."
          },
          "punch": {
            "$ref": "#/components/schemas/punch.IParams",
            "description": "A punch."
          },
          "kick": {
            "$ref": "#/components/schemas/kick.IParams",
            "description": "A kick."
          },
          "guard": {
            "$ref": "#/components/schemas/guard.IParams",
            "description": "The fighting guard."
          },
          "step": {
            "$ref": "#/components/schemas/step.IParams",
            "description": "Fighting-stance footwork."
          },
          "defend": {
            "$ref": "#/components/schemas/defend.IParams",
            "description": "A defence against one strike."
          },
          "flinch": {
            "$ref": "#/components/schemas/flinch.IParams",
            "description": "The protective startle."
          },
          "stagger": {
            "$ref": "#/components/schemas/stagger.IParams",
            "description": "A capture step after a push."
          },
          "knockdown": {
            "$ref": "#/components/schemas/knockdown.IParams",
            "description": "Going down to lie supine."
          },
          "knee": {
            "$ref": "#/components/schemas/knee.IParams",
            "description": "A knee strike."
          },
          "sit": {
            "$ref": "#/components/schemas/sit.IParams",
            "description": "Sitting down."
          },
          "rise": {
            "$ref": "#/components/schemas/rise.IParams",
            "description": "Standing up from a seat."
          },
          "shift": {
            "$ref": "#/components/schemas/shift.IParams",
            "description": "Edging along a seat."
          },
          "bend": {
            "$ref": "#/components/schemas/bend.IParams",
            "description": "Bending to a low point."
          },
          "handshake": {
            "$ref": "#/components/schemas/handshake.IParams",
            "description": "A handshake."
          },
          "pickUp": {
            "$ref": "#/components/schemas/pickUp.IParams",
            "description": "Picking a prop up."
          },
          "putDown": {
            "$ref": "#/components/schemas/putDown.IParams",
            "description": "Putting a prop down."
          },
          "handOver": {
            "$ref": "#/components/schemas/handOver.IParams",
            "description": "Handing a prop over."
          },
          "receive": {
            "$ref": "#/components/schemas/receive.IParams",
            "description": "Receiving a prop."
          },
          "stepOver": {
            "$ref": "#/components/schemas/stepOver.IParams",
            "description": "Stepping over an obstacle."
          },
          "brace": {
            "$ref": "#/components/schemas/brace.IParams",
            "description": "Bracing for a force."
          },
          "typeText": {
            "$ref": "#/components/schemas/typeText.IParams",
            "description": "Typing a text."
          },
          "touch": {
            "$ref": "#/components/schemas/touch.IParams",
            "description": "A touch on a region."
          },
          "handToFace": {
            "$ref": "#/components/schemas/handToFace.IParams",
            "description": "A hand-to-face task."
          },
          "crouch": {
            "$ref": "#/components/schemas/crouch.IParams",
            "description": "A crouch or squat."
          },
          "kneel": {
            "$ref": "#/components/schemas/kneel.IParams",
            "description": "Kneeling."
          },
          "climbStairs": {
            "$ref": "#/components/schemas/climbStairs.IParams",
            "description": "Climbing stairs."
          },
          "throwObject": {
            "$ref": "#/components/schemas/throwObject.IParams",
            "description": "Throwing an object."
          },
          "catchObject": {
            "$ref": "#/components/schemas/catchObject.IParams",
            "description": "Catching an object."
          },
          "operate": {
            "$ref": "#/components/schemas/operate.IParams",
            "description": "Operating a mechanism."
          },
          "lieDown": {
            "$ref": "#/components/schemas/lieDown.IParams",
            "description": "Lying down."
          },
          "crawl": {
            "$ref": "#/components/schemas/crawl.IParams",
            "description": "Crawling."
          },
          "climbLadder": {
            "$ref": "#/components/schemas/climbLadder.IParams",
            "description": "Climbing a ladder."
          },
          "clinch": {
            "$ref": "#/components/schemas/clinch.IParams",
            "description": "A clinch grip."
          },
          "kickBall": {
            "$ref": "#/components/schemas/kickBall.IParams",
            "description": "Kicking a ball."
          },
          "useTool": {
            "$ref": "#/components/schemas/useTool.IParams",
            "description": "Working a tool."
          },
          "wipe": {
            "$ref": "#/components/schemas/wipe.IParams",
            "description": "Wiping a surface."
          },
          "dress": {
            "$ref": "#/components/schemas/dress.IParams",
            "description": "Putting on a hat or glasses."
          },
          "carry": {
            "$ref": "#/components/schemas/carry.IParams",
            "description": "Walking with a load."
          },
          "kiss": {
            "$ref": "#/components/schemas/kiss.IParams",
            "description": "A kiss."
          },
          "highFive": {
            "$ref": "#/components/schemas/highFive.IParams",
            "description": "A high five."
          },
          "selfAction": {
            "$ref": "#/components/schemas/selfAction.IParams",
            "description": "A whole-body self action."
          },
          "exercise": {
            "$ref": "#/components/schemas/exercise.IParams",
            "description": "A bodyweight exercise."
          },
          "stretch": {
            "$ref": "#/components/schemas/stretch.IParams",
            "description": "A static stretch."
          },
          "dance": {
            "$ref": "#/components/schemas/dance.IParams",
            "description": "A dance step."
          },
          "athletics": {
            "$ref": "#/components/schemas/athletics.IParams",
            "description": "The sprint start."
          },
          "gymnastics": {
            "$ref": "#/components/schemas/gymnastics.IParams",
            "description": "A handstand."
          },
          "martialArt": {
            "$ref": "#/components/schemas/martialArt.IParams",
            "description": "A martial-art technique."
          },
          "ballSport": {
            "$ref": "#/components/schemas/ballSport.IParams",
            "description": "A team ball skill."
          },
          "baseball": {
            "$ref": "#/components/schemas/baseball.IParams",
            "description": "A baseball position."
          },
          "racket": {
            "$ref": "#/components/schemas/racket.IParams",
            "description": "A racket or golf position."
          },
          "swim": {
            "$ref": "#/components/schemas/swim.IParams",
            "description": "Swimming."
          }
        },
        "required": [
          "stand",
          "walk",
          "run",
          "jump",
          "approach",
          "look",
          "gesture",
          "rest",
          "punch",
          "kick",
          "guard",
          "step",
          "defend",
          "flinch",
          "stagger",
          "knockdown",
          "knee",
          "sit",
          "rise",
          "shift",
          "bend",
          "handshake",
          "pickUp",
          "putDown",
          "handOver",
          "receive",
          "stepOver",
          "brace",
          "typeText",
          "touch",
          "handToFace",
          "crouch",
          "kneel",
          "climbStairs",
          "throwObject",
          "catchObject",
          "operate",
          "lieDown",
          "crawl",
          "climbLadder",
          "clinch",
          "kickBall",
          "useTool",
          "wipe",
          "dress",
          "carry",
          "kiss",
          "highFive",
          "selfAction",
          "exercise",
          "stretch",
          "dance",
          "athletics",
          "gymnastics",
          "martialArt",
          "ballSport",
          "baseball",
          "racket",
          "swim"
        ],
        "additionalProperties": false,
        "description": "The parameters of every action by its name: the one table that types a\nchain's `act(name, params)` and each vocabulary method, so a call names an\naction and the type checker supplies and checks its parameters.\n\nEach member is the law's own `IParams`; nothing is restated here. Its keys\nare exactly `HumanActionName`: `HumanChain.act` indexes it by the name, so\na name without a member, or a member without a name, fails to compile."
      },
      "stand.IParams": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "How long to stand, seconds; 1.5 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "walk.IParams": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The pace; `normal` when absent."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent."
          },
          "stride": {
            "type": "number",
            "minimum": 0.6,
            "maximum": 1.3,
            "description": "Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6, 1.3]; 1 when absent.",
            "default": 1
          },
          "armSwing": {
            "type": "number",
            "minimum": 0,
            "maximum": 2,
            "description": "Arm-swing scale, an Effort hook, in [0, 2]; 1 when absent.",
            "default": 1
          },
          "elbows": {
            "type": "number",
            "minimum": 0,
            "maximum": 30,
            "description": "Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.",
            "default": 0
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "run.IParams": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point to stop at, world metres."
          },
          "pace": {
            "oneOf": [
              {
                "const": "jog"
              },
              {
                "const": "run"
              },
              {
                "const": "sprint"
              }
            ],
            "description": "The pace; `run` when absent."
          },
          "via": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/IAutoMovieVector3"
            },
            "description": "Floor points passed in order before `to`, world metres."
          },
          "face": {
            "type": "number",
            "description": "The heading at arrival, degrees about +Y."
          },
          "stride": {
            "type": "number",
            "description": "Step-length scale in [0.6, 1.3]; 1 when absent."
          },
          "armSwing": {
            "type": "number",
            "description": "Arm-swing scale in [0, 2]; 1 when absent."
          },
          "elbows": {
            "type": "number",
            "description": "Elbows held out, degrees in [0, 30]; 0 when absent."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "jump.IParams": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's."
          },
          "on": {
            "type": "string",
            "description": "The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent."
          },
          "apex": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Apex height of the flight above take-off, metres; positive."
          }
        },
        "required": [
          "to"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "approach.IParams": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What to approach."
          },
          "at": {
            "oneOf": [
              {
                "const": "faceToFace"
              },
              {
                "const": "handing"
              },
              {
                "const": "intimate"
              },
              {
                "const": "personal"
              },
              {
                "const": "social"
              },
              {
                "type": "number"
              }
            ],
            "description": "The gap: a named band or metres; `personal` when absent."
          },
          "side": {
            "oneOf": [
              {
                "const": "behind"
              },
              {
                "const": "front"
              },
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "Where around a person target to stop, in that person's own frame:\n`front`, `left`, `right` or `behind`; along the line from the start\nwhen absent (and always for a prop or point)."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The pace; `normal` when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality: steps, arm swing and elbow width of the walk."
          },
          "avoid": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "People to walk round on the way, by subject id."
          },
          "track": {
            "oneOf": [
              {
                "const": "pace"
              },
              {
                "type": "boolean"
              }
            ],
            "description": "Whether a person target is followed where they go: the stop is taken\nat the place they come to rest, read from their placed actions, and\nthe walk begins late enough to arrive just after them. The person is\nthen composed before this performer, or the read is refused. With\n`pace` the walk instead matches the person's speed on the way\n(`walkFollowed`), so the gap holds while they walk, and closes to\nthe stop once they have stopped. Absent, the target is read once,\nwhere it is when the approach begins."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false,
        "description": "Parameters of an approach: what to walk up to, the gap to stop at, the\nside to stop on, the pace, the movement quality and the people to walk\nround. Every field but the target is optional with the default its doc\nnames."
      },
      "look.IParams": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What to look at."
          },
          "with": {
            "oneOf": [
              {
                "const": "auto"
              },
              {
                "const": "eyes"
              },
              {
                "const": "head"
              },
              {
                "const": "trunk"
              }
            ],
            "description": "Which segments may join; `auto` when absent."
          },
          "cue": {
            "oneOf": [
              {
                "const": "seen"
              },
              {
                "const": "signal"
              }
            ],
            "description": "What drew the look; an immediate, willed look when absent."
          },
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "How long the action lasts, seconds; 0.6 s after `settled` when absent."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false,
        "description": "Parameters of a look: the target, which segments may join, the cue that\ndrew the look and how long the action lasts."
      },
      "gesture.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/gestureStroke.Kind",
            "description": "The gesture."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand gesture; `right` when absent."
          },
          "target": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to point at; required by `point`."
          },
          "region": {
            "oneOf": [
              {
                "const": "chin"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              }
            ],
            "description": "The face region a `touchFace` reaches; `forehead` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Stroke repetitions (waves, nods, claps); the gesture's own count when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Post-stroke hold, seconds; 0 when absent."
          },
          "depth": {
            "type": "number",
            "description": "A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent."
          },
          "effort": {
            "$ref": "#/components/schemas/HumanEffort.IEffort",
            "description": "Movement quality."
          },
          "turn": {
            "type": "number",
            "description": "Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent."
          },
          "shape": {
            "oneOf": [
              {
                "const": "count1"
              },
              {
                "const": "count2"
              },
              {
                "const": "count3"
              },
              {
                "const": "count4"
              },
              {
                "const": "count5"
              },
              {
                "const": "crossed"
              },
              {
                "const": "ok"
              },
              {
                "const": "quotes"
              },
              {
                "const": "snap"
              },
              {
                "const": "thumbUp"
              },
              {
                "const": "victory"
              }
            ],
            "description": "A hand shape with a meaning of its own, taken by the moving hands in place of the gesture's working shape: a thumbs up, an OK ring, a V, a count; the gesture's own shape when absent."
          },
          "aim": {
            "type": "object",
            "properties": {
              "digit": {
                "oneOf": [
                  {
                    "const": "forefinger"
                  },
                  {
                    "const": "thumb"
                  }
                ]
              },
              "toward": {
                "oneOf": [
                  {
                    "const": "down"
                  },
                  {
                    "const": "up"
                  }
                ]
              }
            },
            "required": [
              "digit",
              "toward"
            ],
            "additionalProperties": false,
            "description": "A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the gesture differ: `variation` in [0, 1] scales\nthe spread of the preparation's length and of where a `wave` or a\n`stopPalm` holds the hand within its named place, and `proficiency`\nreplaces the performer's skill for those spreads. Absent or 0, every\nrepeat is the same."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters of a gesture: which gesture, which hand, what it points at or\ntouches, how many strokes, the hold, a bow's depth and the movement\nquality."
      },
      "gestureStroke.Kind": {
        "oneOf": [
          {
            "const": "beckon"
          },
          {
            "const": "bow"
          },
          {
            "const": "cheer"
          },
          {
            "const": "chinLift"
          },
          {
            "const": "clap"
          },
          {
            "const": "nod"
          },
          {
            "const": "palmsTogether"
          },
          {
            "const": "palmsUp"
          },
          {
            "const": "point"
          },
          {
            "const": "pushGlasses"
          },
          {
            "const": "raiseHand"
          },
          {
            "const": "rubHands"
          },
          {
            "const": "scratchHead"
          },
          {
            "const": "shakeHead"
          },
          {
            "const": "shrug"
          },
          {
            "const": "slump"
          },
          {
            "const": "squareShoulders"
          },
          {
            "const": "stopPalm"
          },
          {
            "const": "thumbsDown"
          },
          {
            "const": "touchFace"
          },
          {
            "const": "wave"
          }
        ],
        "description": "A gesture: the hand gestures, whose strokes are hand goals, and the head,\nshoulder and trunk gestures, whose strokes are joint angles; `bow` is\nthe trunk's pitch, which the gesture law applies."
      },
      "rest.IParams": {
        "type": "object",
        "properties": {
          "left": {
            "oneOf": [
              {
                "const": "behindHead"
              },
              {
                "const": "chinRest"
              },
              {
                "const": "claspedBehind"
              },
              {
                "const": "claspedFront"
              },
              {
                "const": "crossed"
              },
              {
                "const": "elbowSupport"
              },
              {
                "const": "hip"
              },
              {
                "const": "pocket"
              },
              {
                "const": "side"
              }
            ],
            "description": "The left hand's place; `side` when absent."
          },
          "right": {
            "oneOf": [
              {
                "const": "behindHead"
              },
              {
                "const": "chinRest"
              },
              {
                "const": "claspedBehind"
              },
              {
                "const": "claspedFront"
              },
              {
                "const": "crossed"
              },
              {
                "const": "elbowSupport"
              },
              {
                "const": "hip"
              },
              {
                "const": "pocket"
              },
              {
                "const": "side"
              }
            ],
            "description": "The right hand's place; `side` when absent."
          },
          "seconds": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "How long, seconds; 2 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "punch.IParams": {
        "type": "object",
        "properties": {
          "technique": {
            "oneOf": [
              {
                "const": "hook"
              },
              {
                "const": "straight"
              },
              {
                "const": "uppercut"
              }
            ],
            "description": "The technique."
          },
          "hand": {
            "oneOf": [
              {
                "const": "lead"
              },
              {
                "const": "rear"
              }
            ],
            "description": "Which hand: the stance's lead or rear; lead for a straight or a hook and rear for an uppercut when absent."
          },
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What it strikes."
          },
          "accuracy": {
            "oneOf": [
              {
                "const": "graze"
              },
              {
                "const": "hit"
              },
              {
                "const": "miss"
              },
              {
                "$ref": "#/components/schemas/IAutoMovieVector3"
              }
            ],
            "description": "Declared accuracy; `hit` when absent."
          },
          "feint": {
            "type": "number",
            "description": "A feint: the share of the delivery shown before returning, in (0, 1)."
          },
          "manner": {
            "$ref": "#/components/schemas/PickIMannerproficiencyvariation",
            "description": "How much repeats of the punch differ: `variation` in [0, 1] scales the\nspread of the point aimed at within a person's region, and\n`proficiency` replaces the performer's skill for that spread. Absent or\n0, every repeat is aimed at the region's own point."
          }
        },
        "required": [
          "technique",
          "at"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "kick.IParams": {
        "type": "object",
        "properties": {
          "technique": {
            "oneOf": [
              {
                "const": "push"
              },
              {
                "const": "round"
              }
            ],
            "description": "The technique: the round kick with the shin, or the push kick (teep) with the ball of the foot."
          },
          "leg": {
            "oneOf": [
              {
                "const": "lead"
              },
              {
                "const": "rear"
              }
            ],
            "description": "Which leg: the stance's lead or rear; rear for a round kick and lead for a push kick when absent."
          },
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What it strikes."
          },
          "accuracy": {
            "oneOf": [
              {
                "const": "graze"
              },
              {
                "const": "hit"
              },
              {
                "const": "miss"
              },
              {
                "$ref": "#/components/schemas/IAutoMovieVector3"
              }
            ],
            "description": "Declared accuracy; `hit` when absent."
          },
          "feint": {
            "type": "boolean",
            "description": "A feint: the kick shows its chamber and returns without extending."
          }
        },
        "required": [
          "technique",
          "at"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "guard.IParams": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "description": "How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set."
          },
          "stance": {
            "oneOf": [
              {
                "const": "orthodox"
              },
              {
                "const": "southpaw"
              }
            ],
            "description": "Which side leads; the entry's leading side when absent."
          },
          "facing": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "What to face; the entry's line when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "step.IParams": {
        "type": "object",
        "properties": {
          "direction": {
            "oneOf": [
              {
                "const": "back"
              },
              {
                "const": "forward"
              },
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The direction in the stance's own frame."
          },
          "steps": {
            "type": "integer",
            "minimum": 1,
            "description": "How many steps; 1 when absent."
          },
          "length": {
            "type": "number",
            "description": "Each step's length, metres; half a stance length when absent."
          }
        },
        "required": [
          "direction"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "defend.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "oneOf": [
              {
                "const": "check"
              },
              {
                "const": "cover"
              },
              {
                "const": "elbowBlock"
              },
              {
                "const": "highBlock"
              },
              {
                "const": "parry"
              },
              {
                "const": "roll"
              },
              {
                "const": "slip"
              },
              {
                "const": "sway"
              }
            ],
            "description": "The defence."
          },
          "against": {
            "type": "string",
            "description": "The anchor of the strike it answers."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "fail"
              },
              {
                "const": "inTime"
              },
              {
                "const": "late"
              }
            ],
            "description": "The forced outcome; drawn from the defender's skill when absent."
          }
        },
        "required": [
          "kind",
          "against"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "flinch.IParams": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the threat comes from; a place ahead of the performer when absent."
          },
          "intensity": {
            "type": "number",
            "description": "How strong, in (0, 1]; 1 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed; its intensity is `intensity` unless it states one."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "stagger.IParams": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the blow comes from: the body is pushed away from it; a place ahead of the performer when absent."
          },
          "speed": {
            "type": "number",
            "description": "The centre of mass's speed after the blow, m/s."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed: the tempo scales the righting after the step."
          }
        },
        "required": [
          "speed"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "knockdown.IParams": {
        "type": "object",
        "properties": {
          "from": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the blow came from; a place ahead of the performer when absent."
          },
          "seconds": {
            "type": "number",
            "description": "How long the body lies after landing, seconds; 1 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "knee.IParams": {
        "type": "object",
        "properties": {
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "What it strikes."
          },
          "leg": {
            "oneOf": [
              {
                "const": "lead"
              },
              {
                "const": "rear"
              }
            ],
            "description": "Which leg: lead or rear; rear when absent."
          }
        },
        "required": [
          "at"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "sit.IParams": {
        "type": "object",
        "properties": {
          "seat": {
            "$ref": "#/components/schemas/seated.ISeat",
            "description": "The seat."
          },
          "back": {
            "oneOf": [
              {
                "const": "lean"
              },
              {
                "const": "slump"
              },
              {
                "const": "upright"
              }
            ],
            "description": "The seated back; `upright` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds to stay seated after `seated`; 1 when absent."
          },
          "legs": {
            "oneOf": [
              {
                "const": "crossed"
              },
              {
                "const": "parallel"
              }
            ],
            "description": "How the legs rest once seated on a seat inside the band: `parallel`,\nboth feet where they stood, or `crossed`, the left ankle lifted and\nset down across the right one over `CROSS` seconds after `seated`,\nwhich the time seated must cover. `parallel` when absent; ignored on a\nhigh seat."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed: the manner's tempo stretches or shortens the descent, or the climb onto a high seat; neutral when absent. No span of sitting down is fixed by gravity, since the legs lower the body under control."
          }
        },
        "required": [
          "seat"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "rise.IParams": {
        "type": "object",
        "properties": {
          "to": {
            "oneOf": [
              {
                "const": "front"
              },
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "Where the body gets off a high seat: ahead of it, or to one side of a\nseat sat astride. When absent, the left of a seat the entry's base\nnames as sat astride (the side horses and cycles are mounted from, a\nprovisional convention) and ahead of any other. Read only where the\nfeet are off the floor; a seat inside the band is risen from over the\nplanted feet."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters; the rise starts from the seated entry."
      },
      "shift.IParams": {
        "type": "object",
        "properties": {
          "by": {
            "type": "number",
            "description": "Distance along the seat, metres; positive toward the performer's left."
          },
          "seconds": {
            "type": "number",
            "description": "Seconds to stay seated after setting down; 0.5 when absent."
          }
        },
        "required": [
          "by"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "bend.IParams": {
        "type": "object",
        "properties": {
          "toward": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The point the hand goes to."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "strategy": {
            "oneOf": [
              {
                "const": "auto"
              },
              {
                "const": "semiSquat"
              },
              {
                "const": "squat"
              },
              {
                "const": "stoop"
              }
            ],
            "description": "How the body lowers; `auto` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the hand stays at the target; 0.5 when absent."
          }
        },
        "required": [
          "toward"
        ],
        "additionalProperties": false,
        "description": "Parameters of a bend: the point the hand goes to, which hand, the\nstrategy and how long the hand stays there."
      },
      "handshake.IParams": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner's subject id."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The shaking hand; `right` when absent."
          },
          "pumps": {
            "type": "integer",
            "minimum": 1,
            "description": "Pump cycles; 2 when absent."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "pickUp.IParams": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The prop's subject id."
          },
          "handle": {
            "type": "string",
            "description": "The grip affordance's id."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The grasping hand; `right` when absent."
          },
          "lift": {
            "type": "number",
            "description": "How far the wrist rises after the grasp, metres; 0.1 when absent."
          },
          "use": {
            "$ref": "#/components/schemas/HumanGraspUse.IUse",
            "description": "What the prop is taken up for, when it is a tool: the grasp is then\nchosen for the use and not only for the reach. A handle can be wrapped\nfrom any side, and the side the hanging arm reaches most easily leaves\na blade or a barrel where the wrist cannot later aim it. With a use,\nthe grasp must also hold with the tool presented ahead of the shoulder\non the line the use names, and a handle no grasp serves so is refused.\nAbsent, the grasp is chosen for the reach and the lift alone."
          }
        },
        "required": [
          "prop",
          "handle"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "HumanGraspUse.IUse": {
        "type": "object",
        "properties": {
          "tip": {
            "type": "string",
            "description": "The affordance id of the tool's working point: a blade's point, a muzzle, a hammer's face. The tool's line runs from the handle to it."
          },
          "line": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "along"
              },
              {
                "const": "forearm"
              },
              {
                "const": "oblique"
              },
              {
                "const": "square"
              }
            ],
            "description": "How the tool's line lies to the forearm when it is presented: `forearm`\ncontinues it, as a pistol's bore and a thrusting point do; `oblique`\nrises 45 degrees from it, a sabre grip across the palm; `square`\nstands upright on it, a hammer grip; `across` runs level across the\nbody toward the other hand, as a camera or a bar held in both hands\nlies, whatever the place; `along` lays the tool along the surface of\nits place with the working point's own face on it, as a razor lies on\nthe jaw or a comb on the scalp, its way along the surface the hand's\nown (a place on the body only)."
          },
          "at": {
            "oneOf": [
              {
                "const": "ahead"
              },
              {
                "const": "mouth"
              },
              {
                "type": "object",
                "properties": {
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion"
                  }
                },
                "required": [
                  "region"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the tool is used, which is where the grasp must also hold:\n`ahead` presents it ahead of the shoulder, as a blade or a barrel is\naimed; `mouth` brings its working point to the performer's own mouth,\nas a vessel's lip is drunk from; a `region` brings it to that named\nregion of the performer's own body, as a razor's edge is laid on the\njaw or a comb on the scalp. `ahead` when absent. At the mouth or a\nregion the level part of the line runs from the hand back into the\nbody (a cigarette's or a spoon's `forearm` line points at the lips),\nand `square` stays upright."
          }
        },
        "required": [
          "tip",
          "line"
        ],
        "additionalProperties": false,
        "description": "The use a tool is taken up for."
      },
      "putDown.IParams": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The held prop's subject id."
          },
          "at": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "Where the prop's origin goes, world metres; required unless `on` is given."
          },
          "on": {
            "type": "object",
            "properties": {
              "bone": {
                "$ref": "#/components/schemas/AutoMovieHumanoidBone",
                "description": "The bone."
              },
              "offset": {
                "$ref": "#/components/schemas/IHumanProp.IFrame",
                "description": "The prop's frame in the bone's posed frame, metres."
              }
            },
            "required": [
              "bone",
              "offset"
            ],
            "additionalProperties": false,
            "description": "The bone of the performer's own body the prop is put on, worn there from `placed` with its frame `offset` in the bone's posed frame (a hat on the head, a pistol in a hip holster); set down at `at` when absent."
          },
          "yaw": {
            "type": "number",
            "description": "The prop's heading about +Y at rest, degrees; its current heading when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The holding hand; `right` when absent."
          }
        },
        "required": [
          "prop"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "handOver.IParams": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The held prop's subject id."
          },
          "to": {
            "type": "string",
            "description": "The receiver's subject id."
          },
          "handle": {
            "type": "string",
            "description": "The prop's grip affordance the receiver takes."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The giver's holding hand; `right` when absent."
          },
          "receiverHand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The receiver's taking hand; `right` when absent."
          },
          "mass": {
            "type": "number",
            "description": "The prop's mass, kilograms; 0.09 when absent."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "decline"
              },
              {
                "const": "transfer"
              },
              {
                "const": "withdraw"
              }
            ],
            "description": "How the handover ends; `transfer` when absent."
          }
        },
        "required": [
          "prop",
          "to",
          "handle"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "receive.IParams": {
        "type": "object",
        "properties": {
          "prop": {
            "type": "string",
            "description": "The offered prop's subject id."
          },
          "from": {
            "type": "string",
            "description": "The giver's subject id."
          },
          "handle": {
            "type": "string",
            "description": "The prop's grip affordance taken."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The receiver's taking hand; `right` when absent."
          },
          "giverHand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The giver's holding hand; `right` when absent."
          },
          "mass": {
            "type": "number",
            "description": "The prop's mass, kilograms; 0.09 when absent."
          },
          "outcome": {
            "oneOf": [
              {
                "const": "decline"
              },
              {
                "const": "transfer"
              },
              {
                "const": "withdraw"
              }
            ],
            "description": "How the handover ends; `transfer` when absent."
          }
        },
        "required": [
          "prop",
          "from",
          "handle"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "stepOver.IParams": {
        "type": "object",
        "properties": {
          "obstacle": {
            "type": "object",
            "properties": {
              "at": {
                "$ref": "#/components/schemas/IAutoMovieVector3"
              },
              "height": {
                "type": "number"
              },
              "depth": {
                "type": "number"
              }
            },
            "required": [
              "at",
              "height",
              "depth"
            ],
            "additionalProperties": false,
            "description": "The obstacle: the middle of its near side on the floor, its height and its depth along the heading, metres."
          },
          "lead": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The leading foot; `right` when absent."
          }
        },
        "required": [
          "obstacle"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "brace.IParams": {
        "type": "object",
        "properties": {
          "toward": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the force comes from; straight ahead when absent."
          },
          "kind": {
            "oneOf": [
              {
                "const": "catchBody"
              },
              {
                "const": "impact"
              },
              {
                "const": "push"
              }
            ],
            "description": "What is braced for; `impact` when absent."
          },
          "seconds": {
            "type": "number",
            "description": "How long the brace lasts, seconds; 1.5 when absent."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters of a brace: where the force comes from, what is braced for\nand how long the brace lasts."
      },
      "typeText.IParams": {
        "type": "object",
        "properties": {
          "keyboard": {
            "type": "object",
            "properties": {
              "at": {
                "$ref": "#/components/schemas/IAutoMovieVector3"
              },
              "yaw": {
                "type": "number"
              }
            },
            "required": [
              "at",
              "yaw"
            ],
            "additionalProperties": false,
            "description": "The keyboard: the middle of its home row, world metres, and the heading its user faces."
          },
          "text": {
            "type": "string",
            "description": "The text, of keys the layout has (letters and spaces)."
          }
        },
        "required": [
          "keyboard",
          "text"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "touch.IParams": {
        "type": "object",
        "properties": {
          "target": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The region touched: a partner's (`person`) or the performer's own (`self`)."
          },
          "kind": {
            "oneOf": [
              {
                "const": "hold"
              },
              {
                "const": "pat"
              },
              {
                "const": "press"
              },
              {
                "const": "rub"
              },
              {
                "const": "scratch"
              },
              {
                "const": "squeeze"
              },
              {
                "const": "stroke"
              },
              {
                "const": "tap"
              }
            ],
            "description": "The kind; `pat` when absent."
          },
          "with": {
            "oneOf": [
              {
                "const": "fingertips"
              },
              {
                "const": "fist"
              },
              {
                "const": "forefinger"
              },
              {
                "const": "handBack"
              },
              {
                "const": "handEdge"
              },
              {
                "const": "heel"
              },
              {
                "const": "palm"
              }
            ],
            "description": "The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "site": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "up": {
                    "type": "number",
                    "description": "Along the surface toward the head, metres; 0 when absent."
                  },
                  "out": {
                    "type": "number",
                    "description": "To the right of someone facing the surface, metres; 0 when absent."
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "draw": {
                    "type": "number",
                    "description": "The radius the seed draws the place within, metres, uniform over the disc."
                  }
                },
                "required": [
                  "draw"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "rule": {
                    "const": "reach",
                    "description": "The rule."
                  },
                  "within": {
                    "type": "number",
                    "description": "The radius the rule chooses within, metres."
                  }
                },
                "required": [
                  "rule",
                  "within"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "along": {
                    "type": "number",
                    "description": "On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`."
                  }
                },
                "required": [
                  "along"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The held prop's point that touches, one of its affordance ids; required with `prop`."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop` on a region of the performer's own, the grasp the tool was\ntaken up by for its use (`pickUp`'s `handle` and `use.line`): the\nstroke holds the tool as that grasp presents it at the region\n(`HumanGraspUse.presented`, the region as the use's place) and moves\nonly its point, as a razor keeps its angle on the jaw. Absent, the\nprop's point faces into the region."
          },
          "clear": {
            "type": "number",
            "description": "A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent."
          },
          "elbow": {
            "oneOf": [
              {
                "const": "level"
              },
              {
                "const": "natural"
              }
            ],
            "description": "Where the elbow lies while the hand is on the region: `natural`, the\nplace of least strain, or `level`, raised to the shoulder's height so\nthe upper arm is horizontal, as a salute or a hand shading the eyes\nholds it. `natural` when absent."
          },
          "other": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "The other hand's region, touched the same way at the same time; one hand when absent."
          },
          "rests": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AutoMovieMotionHumanTouchContacts.IDeclared"
            },
            "description": "The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`)."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "target"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "handToFace.IParams": {
        "type": "object",
        "properties": {
          "task": {
            "oneOf": [
              {
                "const": "bite"
              },
              {
                "const": "brushTeeth"
              },
              {
                "const": "comb"
              },
              {
                "const": "drink"
              },
              {
                "const": "eat"
              },
              {
                "const": "phone"
              },
              {
                "const": "read"
              },
              {
                "const": "sip"
              },
              {
                "const": "washFace"
              },
              {
                "const": "wipeMouth"
              },
              {
                "$ref": "#/components/schemas/handToFaceRows.IRow"
              }
            ],
            "description": "The task: one of the table's by name, or a row of the production's own."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand of a one-hand task; `right` when absent."
          },
          "count": {
            "type": "number",
            "description": "Repetitions at the face; the row's when absent."
          },
          "seconds": {
            "oneOf": [
              {
                "type": "number",
                "minimum": 0
              },
              {
                "type": "object",
                "properties": {
                  "between": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "number"
                      }
                    ],
                    "additionalItems": false
                  }
                },
                "required": [
                  "between"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the acting hand holds, performed with instead of the implied tool; no prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets the face, one of its affordance ids; the row's (`lip` for a drink, `screen` for a phone) when absent."
          },
          "grasp": {
            "$ref": "#/components/schemas/HumanHeldUse.IGrasp",
            "description": "With `prop`, the grasp it was taken up by for its use\n(`HumanHeldUse.IGrasp`): the hand holds the prop at the face as that\ngrasp presents it at the row's region, the prop's point as the use's\nworking point, and moves only the point. The prop's point faces into\nthe region when absent."
          },
          "other": {
            "type": "string",
            "description": "With `grasp`, the prop's handle the other hand takes (a camera's far end): that hand is laid on it where the holding hand carries the prop, in place of the row's other region. The row's other hand when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "task"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "handToFaceRows.IRow": {
        "type": "object",
        "properties": {
          "region": {
            "oneOf": [
              {
                "type": "null"
              },
              {
                "const": "abdomen"
              },
              {
                "const": "calfLeft"
              },
              {
                "const": "calfRight"
              },
              {
                "const": "cheekLeft"
              },
              {
                "const": "cheekRight"
              },
              {
                "const": "chestLeft"
              },
              {
                "const": "chestRight"
              },
              {
                "const": "chin"
              },
              {
                "const": "crown"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "elbowLeft"
              },
              {
                "const": "elbowRight"
              },
              {
                "const": "face"
              },
              {
                "const": "footTopLeft"
              },
              {
                "const": "footTopRight"
              },
              {
                "const": "forearmLeft"
              },
              {
                "const": "forearmRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "groin"
              },
              {
                "const": "handBackLeft"
              },
              {
                "const": "handBackRight"
              },
              {
                "const": "headBack"
              },
              {
                "const": "heelLeft"
              },
              {
                "const": "heelRight"
              },
              {
                "const": "hipLeft"
              },
              {
                "const": "hipRight"
              },
              {
                "const": "indexTipLeft"
              },
              {
                "const": "indexTipRight"
              },
              {
                "const": "jawLeft"
              },
              {
                "const": "jawRight"
              },
              {
                "const": "kidneyLeft"
              },
              {
                "const": "kidneyRight"
              },
              {
                "const": "kneeLeft"
              },
              {
                "const": "kneeRight"
              },
              {
                "const": "liver"
              },
              {
                "const": "lowerBack"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "neckLeft"
              },
              {
                "const": "neckRight"
              },
              {
                "const": "nose"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "palmLeft"
              },
              {
                "const": "palmRight"
              },
              {
                "const": "pocketFrontLeft"
              },
              {
                "const": "pocketFrontRight"
              },
              {
                "const": "ribsLeft"
              },
              {
                "const": "ribsRight"
              },
              {
                "const": "seat"
              },
              {
                "const": "shinLeft"
              },
              {
                "const": "shinRight"
              },
              {
                "const": "shoulderLeft"
              },
              {
                "const": "shoulderRight"
              },
              {
                "const": "solarPlexus"
              },
              {
                "const": "soleLeft"
              },
              {
                "const": "soleRight"
              },
              {
                "const": "spleen"
              },
              {
                "const": "sternum"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              },
              {
                "const": "thighFrontLeft"
              },
              {
                "const": "thighFrontRight"
              },
              {
                "const": "thighInnerLeft"
              },
              {
                "const": "thighInnerRight"
              },
              {
                "const": "thighOuterLeft"
              },
              {
                "const": "thighOuterRight"
              },
              {
                "const": "throat"
              },
              {
                "const": "upperArmLeft"
              },
              {
                "const": "upperArmRight"
              },
              {
                "const": "upperBack"
              },
              {
                "const": "wristLeft"
              },
              {
                "const": "wristRight"
              }
            ],
            "description": "The region the right hand works on; `null` for a held sheet before the eyes."
          },
          "other": {
            "oneOf": [
              {
                "const": "abdomen"
              },
              {
                "const": "calfLeft"
              },
              {
                "const": "calfRight"
              },
              {
                "const": "cheekLeft"
              },
              {
                "const": "cheekRight"
              },
              {
                "const": "chestLeft"
              },
              {
                "const": "chestRight"
              },
              {
                "const": "chin"
              },
              {
                "const": "crown"
              },
              {
                "const": "earLeft"
              },
              {
                "const": "earRight"
              },
              {
                "const": "elbowLeft"
              },
              {
                "const": "elbowRight"
              },
              {
                "const": "face"
              },
              {
                "const": "footTopLeft"
              },
              {
                "const": "footTopRight"
              },
              {
                "const": "forearmLeft"
              },
              {
                "const": "forearmRight"
              },
              {
                "const": "forehead"
              },
              {
                "const": "groin"
              },
              {
                "const": "handBackLeft"
              },
              {
                "const": "handBackRight"
              },
              {
                "const": "headBack"
              },
              {
                "const": "heelLeft"
              },
              {
                "const": "heelRight"
              },
              {
                "const": "hipLeft"
              },
              {
                "const": "hipRight"
              },
              {
                "const": "indexTipLeft"
              },
              {
                "const": "indexTipRight"
              },
              {
                "const": "jawLeft"
              },
              {
                "const": "jawRight"
              },
              {
                "const": "kidneyLeft"
              },
              {
                "const": "kidneyRight"
              },
              {
                "const": "kneeLeft"
              },
              {
                "const": "kneeRight"
              },
              {
                "const": "liver"
              },
              {
                "const": "lowerBack"
              },
              {
                "const": "mouth"
              },
              {
                "const": "nape"
              },
              {
                "const": "neckLeft"
              },
              {
                "const": "neckRight"
              },
              {
                "const": "nose"
              },
              {
                "const": "noseBridge"
              },
              {
                "const": "palmLeft"
              },
              {
                "const": "palmRight"
              },
              {
                "const": "pocketFrontLeft"
              },
              {
                "const": "pocketFrontRight"
              },
              {
                "const": "ribsLeft"
              },
              {
                "const": "ribsRight"
              },
              {
                "const": "seat"
              },
              {
                "const": "shinLeft"
              },
              {
                "const": "shinRight"
              },
              {
                "const": "shoulderLeft"
              },
              {
                "const": "shoulderRight"
              },
              {
                "const": "solarPlexus"
              },
              {
                "const": "soleLeft"
              },
              {
                "const": "soleRight"
              },
              {
                "const": "spleen"
              },
              {
                "const": "sternum"
              },
              {
                "const": "templeLeft"
              },
              {
                "const": "templeRight"
              },
              {
                "const": "thighFrontLeft"
              },
              {
                "const": "thighFrontRight"
              },
              {
                "const": "thighInnerLeft"
              },
              {
                "const": "thighInnerRight"
              },
              {
                "const": "thighOuterLeft"
              },
              {
                "const": "thighOuterRight"
              },
              {
                "const": "throat"
              },
              {
                "const": "upperArmLeft"
              },
              {
                "const": "upperArmRight"
              },
              {
                "const": "upperBack"
              },
              {
                "const": "wristLeft"
              },
              {
                "const": "wristRight"
              }
            ],
            "description": "The region the left hand works on at the same time; one hand when absent."
          },
          "effector": {
            "$ref": "#/components/schemas/AutoMovieMotionHumanTouchEffector.IEffector",
            "description": "The effector."
          },
          "kind": {
            "oneOf": [
              {
                "const": "hold"
              },
              {
                "const": "pat"
              },
              {
                "const": "press"
              },
              {
                "const": "rub"
              },
              {
                "const": "scratch"
              },
              {
                "const": "squeeze"
              },
              {
                "const": "stroke"
              },
              {
                "const": "tap"
              }
            ],
            "description": "The movement at the face."
          },
          "count": {
            "type": "number",
            "description": "Repetitions when the parameters give none."
          },
          "hold": {
            "type": "number",
            "description": "Seconds at the face after the repetitions when the parameters give none."
          },
          "tangent": {
            "oneOf": [
              {
                "const": "across"
              },
              {
                "const": "up"
              }
            ],
            "description": "The travel's direction."
          },
          "upright": {
            "type": "boolean",
            "description": "`true` when the held tool stands on the world's up at the face, as a vessel does, instead of lying on the region."
          },
          "level": {
            "type": "boolean",
            "description": "`true` when the region's normal is read level, so an effector laid along `up` stands on the world's up instead of on the region's slope: a forefinger held upright across the lips, whose surface faces down as well as forward. The region's own normal when absent."
          },
          "point": {
            "type": "string",
            "description": "The point of a held prop that meets the region when the task is performed with one (`handToFace.IParams.prop`): a vessel's `lip`, a phone's `screen`; the parameters name it when absent."
          },
          "head": {
            "type": "number",
            "description": "The head's flexion at the face, degrees; negative extends it."
          },
          "at": {
            "type": "string",
            "description": "The event name at `ready`."
          }
        },
        "required": [
          "region",
          "effector",
          "kind",
          "count",
          "hold",
          "tangent",
          "head",
          "at"
        ],
        "additionalProperties": false,
        "description": "One task's row."
      },
      "AutoMovieMotionHumanTouchEffector.IEffector": {
        "type": "object",
        "properties": {
          "surface": {
            "oneOf": [
              {
                "const": "fist"
              },
              {
                "const": "grip"
              },
              {
                "const": "handBack"
              },
              {
                "const": "indexTip"
              },
              {
                "const": "palm"
              },
              {
                "const": "wrist"
              }
            ],
            "description": "The hand surface."
          },
          "shape": {
            "oneOf": [
              {
                "const": "fist"
              },
              {
                "const": "flat"
              },
              {
                "const": "point"
              },
              {
                "const": "relaxed"
              }
            ],
            "description": "The hand's shape."
          },
          "tool": {
            "$ref": "#/components/schemas/PartialRecordfingerspalmthumbnumber",
            "description": "A held tool's tip from the surface, shares of the hand's length along each axis; none when absent."
          },
          "facing": {
            "oneOf": [
              {
                "const": "-fingers"
              },
              {
                "const": "-grasp"
              },
              {
                "const": "-palm"
              },
              {
                "const": "-thumb"
              },
              {
                "const": "fingers"
              },
              {
                "const": "grasp"
              },
              {
                "const": "palm"
              },
              {
                "const": "thumb"
              },
              {
                "$ref": "#/components/schemas/PartialRecordfingerspalmthumbnumber"
              }
            ],
            "description": "The direction of the hand turned into the region; the surface's own normal when absent."
          },
          "along": {
            "oneOf": [
              {
                "const": "-fingers"
              },
              {
                "const": "-grasp"
              },
              {
                "const": "-palm"
              },
              {
                "const": "-thumb"
              },
              {
                "const": "fingers"
              },
              {
                "const": "grasp"
              },
              {
                "const": "palm"
              },
              {
                "const": "thumb"
              },
              {
                "$ref": "#/components/schemas/PartialRecordfingerspalmthumbnumber"
              }
            ],
            "description": "The direction of the hand laid along the region's tangent; the surface's own forward when absent."
          },
          "curl": {
            "type": "number",
            "description": "Extra flexion of the fingers over the shape, degrees, as the touch's kind curls them (`AutoMovieMotionHumanTouchForm.curled`); none when absent."
          }
        },
        "required": [
          "surface",
          "shape"
        ],
        "additionalProperties": false,
        "description": "An effector."
      },
      "PartialRecordfingerspalmthumbnumber": {
        "type": "object",
        "properties": {
          "fingers": {
            "type": "number"
          },
          "palm": {
            "type": "number"
          },
          "thumb": {
            "type": "number"
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "crouch.IParams": {
        "type": "object",
        "properties": {
          "depth": {
            "oneOf": [
              {
                "const": "full"
              },
              {
                "const": "partial"
              }
            ],
            "description": "How deep; `partial` when absent."
          },
          "heels": {
            "oneOf": [
              {
                "const": "flat"
              },
              {
                "const": "up"
              }
            ],
            "description": "The heels; `flat` for a partial and `up` for a full squat when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held at the lowest pose; 1 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "kneel.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "oneOf": [
              {
                "const": "both"
              },
              {
                "const": "one"
              },
              {
                "const": "sitBack"
              }
            ],
            "description": "The kneeling posture; `one` when absent."
          },
          "knee": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The knee that goes down first; `right` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held kneeling; 1.5 when absent."
          },
          "rise": {
            "type": "boolean",
            "description": "Whether the body rises again at the end; `true` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "climbStairs.IParams": {
        "type": "object",
        "properties": {
          "count": {
            "type": "number",
            "description": "How many treads."
          },
          "riser": {
            "type": "number",
            "description": "Each riser's height, metres; 0.17 when absent."
          },
          "tread": {
            "type": "number",
            "description": "Each tread's depth, metres; 0.28 when absent."
          },
          "direction": {
            "oneOf": [
              {
                "const": "down"
              },
              {
                "const": "up"
              }
            ],
            "description": "Up the flight or down it; `up` when absent."
          },
          "start": {
            "type": "number",
            "description": "The first nosing's distance ahead of the toes, metres; 0.05 when absent."
          },
          "pattern": {
            "oneOf": [
              {
                "const": "stepByStep"
              },
              {
                "const": "stepOverStep"
              }
            ],
            "description": "One foot per tread, or both feet on each; `stepOverStep` when absent."
          },
          "lead": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The foot that steps first; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "count"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "throwObject.IParams": {
        "type": "object",
        "properties": {
          "at": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "Where the object goes."
          },
          "style": {
            "oneOf": [
              {
                "const": "overarm"
              },
              {
                "const": "toss"
              },
              {
                "const": "underarm"
              }
            ],
            "description": "The style; `overarm` when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The throwing hand; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "at"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "catchObject.IParams": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "description": "The anchor of the throw caught."
          },
          "hands": {
            "oneOf": [
              {
                "const": "one"
              },
              {
                "const": "two"
              }
            ],
            "description": "One hand or two; `two` when absent."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The catching hand when one; `right` when absent."
          },
          "radius": {
            "type": "number",
            "description": "The object's radius, metres; 0.11 when absent (a handball, provisional)."
          }
        },
        "required": [
          "from"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "operate.IParams": {
        "type": "object",
        "properties": {
          "mechanism": {
            "$ref": "#/components/schemas/operate.Mechanism",
            "description": "What is operated."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "mechanism"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "operate.Mechanism": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "button",
                "description": "A push button or switch pressed along its axis."
              },
              "at": {
                "$ref": "#/components/schemas/AutoMovieMotionTarget",
                "description": "The button's face, its normal pointing out."
              },
              "travel": {
                "type": "number",
                "description": "How far it goes in, metres; 0.005 when absent."
              }
            },
            "required": [
              "kind",
              "at"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "knob",
                "description": "A knob, lid, tap or dial turned about its axis."
              },
              "at": {
                "$ref": "#/components/schemas/AutoMovieMotionTarget",
                "description": "The knob's centre, its normal along the axis toward the hand."
              },
              "turn": {
                "type": "number",
                "description": "How far it turns, degrees; positive clockwise as the hand sees it."
              }
            },
            "required": [
              "kind",
              "at",
              "turn"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "slider",
                "description": "A drawer or slider moved along its axis."
              },
              "at": {
                "$ref": "#/components/schemas/AutoMovieMotionTarget",
                "description": "The handle, its normal along the slide toward the hand."
              },
              "travel": {
                "type": "number",
                "description": "How far it travels, metres; positive pulls toward the hand."
              }
            },
            "required": [
              "kind",
              "at",
              "travel"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "kind": {
                "const": "hinge",
                "description": "A door swung about a vertical hinge line by its handle."
              },
              "at": {
                "$ref": "#/components/schemas/AutoMovieMotionTarget",
                "description": "The handle, its normal out of the leaf toward the hand."
              },
              "hinge": {
                "$ref": "#/components/schemas/AutoMovieMotionTarget",
                "description": "A point on the hinge line."
              },
              "swing": {
                "type": "number",
                "description": "How far the leaf swings, degrees; positive pulls it toward the hand."
              }
            },
            "required": [
              "kind",
              "at",
              "hinge",
              "swing"
            ],
            "additionalProperties": false
          }
        ],
        "description": "An articulated part and how it moves."
      },
      "lieDown.IParams": {
        "type": "object",
        "properties": {
          "position": {
            "oneOf": [
              {
                "const": "lateralLeft"
              },
              {
                "const": "lateralRight"
              },
              {
                "const": "prone"
              },
              {
                "const": "sitCrossed"
              },
              {
                "const": "sitLong"
              },
              {
                "const": "sitSide"
              },
              {
                "const": "supine"
              }
            ],
            "description": "The position; `supine` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held lying; 2 when absent.",
            "default": 2
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "crawl.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "oneOf": [
              {
                "const": "bear"
              },
              {
                "const": "inchworm"
              },
              {
                "const": "knees"
              }
            ],
            "description": "On what it crawls: `knees` (hands and knees), `bear` (hands and feet, the knees off the floor) or `inchworm` (the hands walked out to a plank, the feet in to the hands); `knees` when absent."
          },
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "How many crawl cycles; 3 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "climbLadder.IParams": {
        "type": "object",
        "properties": {
          "rungs": {
            "type": "integer",
            "minimum": 1,
            "description": "How many rungs the feet climb; 3 when absent."
          },
          "spacing": {
            "type": "number",
            "minimum": 0.25,
            "maximum": 0.36,
            "description": "Rung spacing, metres, from 0.25 to 0.36; 0.3 when absent."
          },
          "start": {
            "type": "number",
            "description": "The rungs' distance ahead of the toes, metres; 0.15 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "clinch.IParams": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner gripped."
          },
          "grip": {
            "oneOf": [
              {
                "const": "collarSleeve"
              },
              {
                "const": "plum"
              }
            ],
            "description": "The grip; `plum` when absent."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The collar hand of `collarSleeve`; `right` when absent."
          },
          "hold": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the grip is held; 2 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "kickBall.IParams": {
        "type": "object",
        "properties": {
          "ball": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The ball's centre."
          },
          "radius": {
            "type": "number",
            "description": "The ball's radius, metres; 0.11 when absent (a size 5 football)."
          },
          "foot": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The kicking foot; `right` when absent."
          },
          "toward": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "person",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The other subject's id."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region aimed at."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "self",
                    "description": "Discriminator."
                  },
                  "region": {
                    "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
                    "description": "The region of the performer's own body."
                  }
                },
                "required": [
                  "kind",
                  "region"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "prop",
                    "description": "Discriminator."
                  },
                  "subject": {
                    "type": "string",
                    "description": "The prop subject's id."
                  },
                  "point": {
                    "type": "string",
                    "description": "The prop's named point."
                  }
                },
                "required": [
                  "kind",
                  "subject",
                  "point"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "point",
                    "description": "Discriminator."
                  },
                  "at": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The point, metres."
                  },
                  "frame": {
                    "oneOf": [
                      {
                        "const": "performer"
                      },
                      {
                        "const": "world"
                      }
                    ],
                    "description": "The frame the point is stated in."
                  },
                  "normal": {
                    "$ref": "#/components/schemas/IAutoMovieVector3",
                    "description": "The outward direction of the surface at the point, in the same frame; any non-zero vector. Faces the performer when absent."
                  }
                },
                "required": [
                  "kind",
                  "at",
                  "frame"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "kind": {
                    "const": "none",
                    "description": "Discriminator."
                  },
                  "line": {
                    "oneOf": [
                      {
                        "const": "high"
                      },
                      {
                        "const": "low"
                      },
                      {
                        "const": "middle"
                      }
                    ],
                    "description": "The virtual opponent's height line; `middle` when absent."
                  },
                  "range": {
                    "type": "number",
                    "description": "Distance to the virtual opponent, metres; the technique's range when absent."
                  }
                },
                "required": [
                  "kind"
                ],
                "additionalProperties": false
              }
            ],
            "description": "Where the ball is kicked toward; along the heading when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "ball"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "useTool.IParams": {
        "type": "object",
        "properties": {
          "tool": {
            "$ref": "#/components/schemas/useTool.Kind",
            "description": "The tool."
          },
          "on": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The work point: a nail, a cut line's middle, a pot's centre, a screw."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The working hand; `right` when absent."
          },
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "How many cycles; 4 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "tool",
          "on"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "useTool.Kind": {
        "oneOf": [
          {
            "const": "hammer"
          },
          {
            "const": "saw"
          },
          {
            "const": "screwdriver"
          },
          {
            "const": "stir"
          }
        ],
        "description": "A tool kind."
      },
      "wipe.IParams": {
        "type": "object",
        "properties": {
          "on": {
            "$ref": "#/components/schemas/AutoMovieMotionTarget",
            "description": "The middle of the patch wiped, on the surface's top."
          },
          "hand": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "How many circles; 3 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "on"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "dress.IParams": {
        "type": "object",
        "properties": {
          "item": {
            "$ref": "#/components/schemas/dress.Item",
            "description": "The item."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "item"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "dress.Item": {
        "oneOf": [
          {
            "const": "glasses"
          },
          {
            "const": "hat"
          }
        ],
        "description": "An item put on."
      },
      "carry.IParams": {
        "type": "object",
        "properties": {
          "to": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "The floor point walked to, world metres."
          },
          "how": {
            "$ref": "#/components/schemas/carry.How",
            "description": "How the load is held."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The loaded side for `oneHand` and `hip`; `right` when absent."
          },
          "load": {
            "type": "number",
            "minimum": 0,
            "maximum": 0.25,
            "description": "The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent."
          },
          "pace": {
            "oneOf": [
              {
                "const": "fast"
              },
              {
                "const": "normal"
              },
              {
                "const": "slow"
              }
            ],
            "description": "The walk's pace; `normal` when absent."
          }
        },
        "required": [
          "to",
          "how"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "carry.How": {
        "oneOf": [
          {
            "const": "hip"
          },
          {
            "const": "oneHand"
          },
          {
            "const": "push"
          },
          {
            "const": "twoHands"
          }
        ],
        "description": "How the load is held."
      },
      "kiss.IParams": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner."
          },
          "region": {
            "$ref": "#/components/schemas/AutoMovieHumanoidRegion",
            "description": "The partner's region."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "Which way the head turns for a cheek or the lips; `right` when absent."
          },
          "hold": {
            "type": "number",
            "description": "Seconds the lips stay; `HOLD` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "partner",
          "region"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "highFive.IParams": {
        "type": "object",
        "properties": {
          "partner": {
            "type": "string",
            "description": "The partner."
          },
          "kind": {
            "oneOf": [
              {
                "const": "fist"
              },
              {
                "const": "high"
              },
              {
                "const": "low"
              }
            ],
            "description": "The variant; `high` when absent."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The hand; `right` when absent."
          },
          "prop": {
            "type": "string",
            "description": "The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent."
          },
          "point": {
            "type": "string",
            "description": "The prop's point that meets, one of its affordance ids; `lip` when absent."
          },
          "window": {
            "$ref": "#/components/schemas/AutoMovieMotionMeeting.IWindow",
            "description": "The film seconds the hands meet over (`AutoMovieMotionMeeting.IWindow`), which both roles give alike: they meet no earlier than `from`, each hand leaving its rest only its own reach's time before, and part at `to`; the natural meeting when absent."
          },
          "at": {
            "$ref": "#/components/schemas/IAutoMovieVector3",
            "description": "A world point the hand is brought to in place of the pair's own meeting point, metres: the one point several pairs meet at, as glasses in a toast of four. The pair's shared instants are kept. The pair's own point when absent."
          }
        },
        "required": [
          "partner"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "selfAction.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/selfAction.Kind",
            "description": "The action."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The arm of a fist pump; `right` when absent."
          },
          "count": {
            "type": "number",
            "description": "Pumps or rolls; 3 for a pump, 2 for a roll when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "selfAction.Kind": {
        "oneOf": [
          {
            "const": "fistPump"
          },
          {
            "const": "neckRoll"
          },
          {
            "const": "shoulderRoll"
          },
          {
            "const": "stretch"
          },
          {
            "const": "victory"
          }
        ],
        "description": "The actions."
      },
      "exercise.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/exercise.Kind",
            "description": "The exercise."
          },
          "reps": {
            "type": "integer",
            "minimum": 1,
            "description": "Repetitions; 3 when absent."
          },
          "depth": {
            "oneOf": [
              {
                "const": "half"
              },
              {
                "const": "parallel"
              },
              {
                "const": "quarter"
              }
            ],
            "description": "A squat's depth; `parallel` when absent."
          },
          "tempo": {
            "type": "array",
            "prefixItems": [
              {
                "type": "number"
              },
              {
                "type": "number"
              },
              {
                "type": "number"
              }
            ],
            "description": "Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent.",
            "additionalItems": false
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The lunge's lead leg, or the first knee raised; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "exercise.Kind": {
        "oneOf": [
          {
            "const": "highKnees"
          },
          {
            "const": "jumpingJack"
          },
          {
            "const": "lunge"
          },
          {
            "const": "squat"
          }
        ],
        "description": "The exercises."
      },
      "stretch.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/stretch.Kind",
            "description": "The pose."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The side stretched or lifted; `right` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held; `HOLD` when absent."
          },
          "intensity": {
            "oneOf": [
              {
                "const": "mild"
              },
              {
                "const": "moderate"
              }
            ],
            "description": "How far into the range; `moderate` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "stretch.Kind": {
        "oneOf": [
          {
            "const": "crossBody"
          },
          {
            "const": "neckSide"
          },
          {
            "const": "overheadSide"
          },
          {
            "const": "quadriceps"
          },
          {
            "const": "tree"
          }
        ],
        "description": "The poses."
      },
      "dance.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/dance.Kind",
            "description": "The step."
          },
          "bpm": {
            "type": "number",
            "exclusiveMinimum": 0,
            "description": "Beats per minute; `BPM` when absent."
          },
          "beats": {
            "type": "integer",
            "minimum": 1,
            "description": "How many beats; 8 when absent."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The foot that steps first; `right` when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "dance.Kind": {
        "oneOf": [
          {
            "const": "bounce"
          },
          {
            "const": "boxStep"
          },
          {
            "const": "stepTouch"
          },
          {
            "const": "sway"
          }
        ],
        "description": "The steps."
      },
      "athletics.IParams": {
        "type": "object",
        "properties": {
          "front": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The front foot; `left` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held in the set; 1.5 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "gymnastics.IParams": {
        "type": "object",
        "properties": {
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held inverted; 2 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "martialArt.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/martialArt.Kind",
            "description": "The technique."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Punches of a choku-zuki series; 4 when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds the stance is held; 1 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "martialArt.Kind": {
        "oneOf": [
          {
            "const": "chokuZuki"
          },
          {
            "const": "horseStance"
          },
          {
            "const": "taiChiPush"
          }
        ],
        "description": "The techniques."
      },
      "ballSport.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/ballSport.Kind",
            "description": "The skill."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The dribbling hand; `right` when absent."
          },
          "count": {
            "type": "integer",
            "minimum": 1,
            "description": "Dribble bounces; 4 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "ballSport.Kind": {
        "oneOf": [
          {
            "const": "dig"
          },
          {
            "const": "dribble"
          },
          {
            "const": "set"
          },
          {
            "const": "throwIn"
          }
        ],
        "description": "The skills."
      },
      "baseball.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/baseball.Kind",
            "description": "The position."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held; 1 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "baseball.Kind": {
        "oneOf": [
          {
            "const": "battingStance"
          },
          {
            "const": "catcherCrouch"
          },
          {
            "const": "groundBall"
          }
        ],
        "description": "The positions."
      },
      "racket.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/racket.Kind",
            "description": "The position."
          },
          "side": {
            "oneOf": [
              {
                "const": "left"
              },
              {
                "const": "right"
              }
            ],
            "description": "The racket or lead hand; `right` when absent."
          },
          "seconds": {
            "type": "number",
            "minimum": 0,
            "description": "Seconds held; 0.6 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "racket.Kind": {
        "oneOf": [
          {
            "const": "golfAddress"
          },
          {
            "const": "readyPosition"
          },
          {
            "const": "splitStep"
          }
        ],
        "description": "The positions."
      },
      "swim.IParams": {
        "type": "object",
        "properties": {
          "kind": {
            "$ref": "#/components/schemas/swim.Kind",
            "description": "The stroke."
          },
          "water": {
            "type": "number",
            "description": "The water plane's world height, metres; the entry's chest height when absent."
          },
          "cycles": {
            "type": "integer",
            "minimum": 1,
            "description": "Cycles; 3 when absent."
          },
          "manner": {
            "$ref": "#/components/schemas/AutoMovieMotionManner.IManner",
            "description": "How it is performed."
          }
        },
        "required": [
          "kind"
        ],
        "additionalProperties": false,
        "description": "Parameters."
      },
      "swim.Kind": {
        "oneOf": [
          {
            "const": "backstroke"
          },
          {
            "const": "breaststroke"
          },
          {
            "const": "float"
          },
          {
            "const": "frontCrawl"
          },
          {
            "const": "treadWater"
          }
        ],
        "description": "The strokes."
      }
    }
  }
};
