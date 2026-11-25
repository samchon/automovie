/** The labels and geometry records used by the sword prop catalogue. */
export namespace createSwordShapes {
  /** The kinds of blade. */
  export type Kind =
    | "longsword"
    | "armingSword"
    | "sabre"
    | "katana"
    | "rapier"
    | "dagger"
    | "knife";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "longsword",
    "armingSword",
    "sabre",
    "katana",
    "rapier",
    "dagger",
    "knife",
  ];

  /** The readable name of each kind. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    longsword: "longsword",
    armingSword: "arming sword",
    sabre: "sabre",
    katana: "katana",
    rapier: "rapier",
    dagger: "dagger",
    knife: "fighting knife",
  };

  /** What a kind is beyond its drawn dimensions. */
  export interface IShape {
    /** How many hands the grip takes. */
    hands: 1 | 2;

    /** Whether the back of the blade is sharpened too. */
    double: boolean;

    /** Whether the weapon is also held point down, in the reverse grip. */
    reverse: boolean;

    /**
     * How far the point lies back toward `-Z` from the line the blade leaves the
     * guard on, metres.
     */
    curve: number;

    /** The guard's span along `Z`, or a disc guard's diameter, metres. */
    guard: number;

    /** Whether the guard is a disc about the blade, as a katana's tsuba. */
    disc: boolean;

    /** The pommel's radius, metres. */
    pommel: number;

    /**
     * The shares of the hilt's mass in the guard, the grip and the pommel,
     * summing to 1.
     */
    hilt: readonly [number, number, number];
  }

  /**
   * Each kind's shape. Every number here is an estimate not read at a source,
   * except the hands and edges, which define the kinds: guard spans and pommel
   * sizes are picture and guard collider, the hilt's mass split only moves the
   * inertia (the balance is cited), a katana's curve stands for a sori of about
   * 18 mm and a sabre's for the "pronounced curve" of the 1796 pattern.
   */
  export const SHAPES: Readonly<Record<Kind, IShape>> = {
    longsword: {
      hands: 2,
      double: true,
      reverse: false,
      curve: 0,
      guard: 0.22,
      disc: false,
      pommel: 0.025,
      hilt: [0.3, 0.2, 0.5],
    },
    armingSword: {
      hands: 1,
      double: true,
      reverse: false,
      curve: 0,
      guard: 0.18,
      disc: false,
      pommel: 0.025,
      hilt: [0.3, 0.2, 0.5],
    },
    sabre: {
      hands: 1,
      double: false,
      reverse: false,
      curve: 0.07,
      guard: 0.1,
      disc: false,
      pommel: 0.018,
      hilt: [0.4, 0.3, 0.3],
    },
    katana: {
      hands: 2,
      double: false,
      reverse: false,
      curve: 0.018,
      guard: 0.075,
      disc: true,
      pommel: 0.018,
      hilt: [0.35, 0.5, 0.15],
    },
    rapier: {
      hands: 1,
      double: true,
      reverse: false,
      curve: 0,
      guard: 0.11,
      disc: false,
      pommel: 0.022,
      hilt: [0.5, 0.15, 0.35],
    },
    dagger: {
      hands: 1,
      double: true,
      reverse: true,
      curve: 0,
      guard: 0.08,
      disc: false,
      pommel: 0.018,
      hilt: [0.35, 0.35, 0.3],
    },
    knife: {
      hands: 1,
      double: false,
      reverse: true,
      curve: 0,
      guard: 0.05,
      disc: false,
      pommel: 0.014,
      hilt: [0.25, 0.55, 0.2],
    },
  };
}
