import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The anatomical plan of one foot: its measurements, outline, dorsal profile, ankle section and toes, from which the cage's positions are shaped.
 *
 * Everything is in the foot's local frame, millimetres: origin on the standing surface below the ankle joint centre, +x lateral, +y up, +z forward. Both feet are planned in this frame, so the right foot is the mirror image of a left foot with the right leg's measurements. Positions along the foot are often given as `f`, the distance from the back of the heel over foot length.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFootPlan {
  /** Foot length, the back of the heel to the tip of the longest toe. */
  length: number;

  /** Foot breadth across the metatarsal heads. */
  breadth: number;

  /** Lateral malleolus height. */
  ankleHeight: number;

  /** Navicular height, the height of the medial arch. */
  navicularHeight: number;

  /** Local z of the back of the heel. */
  heel: number;

  /** How far lateral of the ankle joint centre the foot's long axis runs, the line its outline, crest and toes are laid about. */
  axis: number;

  /** Scale of the bony and tendinous relief, 1 as anatomy gives it and 0 for the bare block-out of the form. */
  relief: number;

  /** The ankle ring's section. */
  ankle: IAutoMovieHumanFootPlan.IAnkle;

  /** Medial border, along which the medial longitudinal arch rises. */
  medial: IAutoMovieHumanFootPlan.IBorder;

  /** Lateral border, which rests on the ground. */
  lateral: IAutoMovieHumanFootPlan.IBorder;

  /** The dorsal crest from the ankle to the toes. */
  ridge: IAutoMovieHumanFootPlan.IRidge;

  /** The heel's rounded back. */
  heelArc: IAutoMovieHumanFootPlan.IHeel;

  /** Toes from the hallux to the fifth. */
  toes: IAutoMovieHumanFootPlan.IToe[];

  /** Lowest point of the lateral malleolus. */
  lateralMalleolus: IAutoMovieVector3;

  /** Tip of the medial malleolus, sphyrion. */
  medialMalleolus: IAutoMovieVector3;
}
export namespace IAutoMovieHumanFootPlan {
  /** Pairs of `f` and a value as a fraction of foot length, read by `interpolateAutoMovieHumanFootProfile`. */
  export type IProfile = ReadonlyArray<readonly [number, number]>;

  /**
   * The ankle ring's section, the junction's shared shape seen from the foot: the origin and the distance of each ring vertex, in the left foot's order counterclockwise about +y from the anterior one.
   *
   * @author Samchon
   */
  export interface IAnkle {
    /** Centre of the cut, the ring frame's origin. */
    origin: IAutoMovieVector3;

    /** Distance of ring vertex `k`, at `k` eighths of a turn from the front toward the lateral side. */
    radii: number[];
  }

  /**
   * One border of the foot, from the heel to the toes, as profiles over `f`.
   *
   * @author Samchon
   */
  export interface IBorder {
    /** `f` of each rim vertex from the heel arc's end to the last before the toes. */
    stations: number[];

    /** Distance of the rim from the foot's axis, positive outward, of foot length. */
    offset: IProfile;

    /** Height of the rim's upper edge, where the side wall meets the upper, of foot length. */
    rim: IProfile;

    /** Height of the sole's edge, where the rim turns under the foot, of foot length. */
    sole: IProfile;

    /** How far the sole's edge lies inside the rim's upper edge. */
    inset: number;
  }

  /**
   * The dorsal crest, the summit line of the dorsum, along which the upper is highest.
   *
   * @author Samchon
   */
  export interface IRidge {
    /** Local x of the crest, of foot length. */
    x: IProfile;

    /** Height of the crest, of foot length, for a navicular height of 0.2 foot lengths. */
    height: IProfile;

    /** How much of the navicular height's departure from 0.2 foot lengths raises or lowers the crest over the midfoot. */
    lift: number;
  }

  /**
   * The back of the heel as a half ellipse in plan, from the medial border round to the lateral.
   *
   * @author Samchon
   */
  export interface IHeel {
    /** `f` of the ellipse's centre, where the two borders begin. */
    at: number;

    /** Local x of the centre. */
    x: number;

    /** Half the heel's breadth at the rim. */
    width: number;

    /** Reach of the rim behind the centre. */
    reach: number;

    /** Height of the upper's edge at the back and at the sides. */
    rim: [number, number];

    /** Height of the sole's edge. */
    sole: number;
  }

  /**
   * One toe, as a straight digit from its metatarsophalangeal joint.
   *
   * @author Samchon
   */
  export interface IToe {
    /** Metatarsophalangeal joint centre. */
    joint: IAutoMovieVector3;

    /** Unit direction of the toe in plan. */
    direction: IAutoMovieVector3;

    /** Joint centre to tip. */
    length: number;

    /** Breadth of the toe. */
    width: number;

    /** Dorsal height of the toe's free part above the standing surface. */
    height: number;

    /** Whether this is the hallux, which has two phalanges and no middle joint. */
    hallux: boolean;
  }
}
