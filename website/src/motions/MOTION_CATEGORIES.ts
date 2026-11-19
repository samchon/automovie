/**
 * How the motion catalogue arranges the vocabulary: the core actions first,
 * then the lexicon's families under a few categories a reader looks for,
 * each family with the label its section shows. A family the installed
 * release adds and this table does not name is listed under "More" with its
 * name spelled out, so a new family is shown without a change here.
 */
export const MOTION_CATEGORIES: readonly IMotionCategory[] = [
  {
    id: "core",
    title: "Core actions",
    summary:
      "The vocabulary every chain is written in: stand, walk, punch, sit, pick up, hand over and the rest. Each lexicon row is one of these with some parameters fixed.",
    families: { actions: "Core actions" },
  },
  {
    id: "movement",
    title: "Movement and position",
    summary:
      "Ways of walking and running, following and fleeing, getting down, falling and rolling, riding and being carried.",
    families: {
      gait: "Gait",
      pursuit: "Pursuit",
      pose: "Poses",
      support: "Support",
      floorRoll: "Rolls",
      floorFall: "Dives and falls",
      ride: "Riding",
      carried: "Carried",
    },
  },
  {
    id: "combat",
    title: "Combat",
    summary:
      "Strikes and defences, stage fighting, the sword and the knife, firearms, bows and thrown weapons, and period drill.",
    families: {
      strike: "Strikes",
      defence: "Defence",
      drill: "Drill",
      stageFight: "Stage fight",
      blade: "Blade",
      sword: "Sword",
      weaponMelee: "Melee weapons",
      firearm: "Firearm stances",
      weaponFirearm: "Firearm handling",
      boltAction: "Bolt action",
      revolver: "Revolver",
      archery: "Archery",
      thrownWeapon: "Thrown weapons",
      musketDrill: "Musket drill",
      gunDrill: "Cannon drill",
    },
  },
  {
    id: "sport",
    title: "Sport and exercise",
    summary:
      "Swings, throws and catches, gymnastics, gym lifts, workouts, stretches and loaded carries.",
    families: {
      sport: "Sport",
      sportSwing: "Swings and strokes",
      sportThrow: "Throws, catches and jumps",
      gymnastics: "Gymnastics",
      sportGym: "Gym exercise",
      sportWorkout: "Workout",
      sportCarry: "Loaded carries",
    },
  },
  {
    id: "expression",
    title: "Gesture and expression",
    summary:
      "Emblems a viewer reads at a glance, gestures and arm phrases for speech, standing attitudes and the touches between people.",
    families: {
      emblem: "Emblems",
      upperGesture: "Gestures",
      upperPhrase: "Arm phrases",
      stance: "Stances",
      upperRest: "Resting arms",
      social: "Social",
    },
  },
  {
    id: "daily",
    title: "Daily habits",
    summary:
      "What people do with their own bodies: checking a phone, smoking, eating and drinking, grooming, dressing and touching themselves.",
    families: {
      habit: "Habits",
      upperFace: "Hand to face",
      upperTouch: "Touch",
      upperDress: "Dress",
    },
  },
  {
    id: "hands",
    title: "Hands and work",
    summary:
      "Handling objects and instruments, changing a grip, and the labour of carrying, hammering, sawing and pushing.",
    families: {
      manipulate: "Handling",
      regrasp: "Regrasp",
      upperTool: "Tools",
      labour: "Labour",
    },
  },
];

/** One category of the catalogue. */
export interface IMotionCategory {
  /** Its anchor on the catalogue page. */
  id: string;

  /** Its heading. */
  title: string;

  /** One sentence saying what it holds. */
  summary: string;

  /** Its families by the lexicon's name, in order, with each section's label; `actions` names the core vocabulary. */
  families: Readonly<Record<string, string>>;
}
