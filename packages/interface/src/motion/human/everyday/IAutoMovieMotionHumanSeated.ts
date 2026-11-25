import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalShape } from "../../../physics/IAutoMoviePhysicalShape";

/**
 * The geometry every seat law shares: where on a seat the body's seat socket
 * rests, the root that puts it there under a trunk pitch, whether a seat suits
 * the body, and the hands resting on the thighs.
 *
 * A seat is given as the sitting surface's frame the way an
 * `IAutoMovieAffordance` of kind `seat` states it: a world point at the middle
 * of the front edge, the heading the sitter faces, an optional depth back from
 * the edge and an optional backrest height. Sitting brings the body's `seat`
 * socket (under the ischial tuberosities) onto the seat; everything else
 * follows by inverse kinematics and the trunk's pitch.
 *
 * The socket rests `thigh - 0.05 m` behind the edge, corrected by the socket's
 * own offset from the hip joints, so with a level thigh the knee stands 5 cm
 * ahead of the front edge and the thigh is supported almost to the knee
 * (provisional clearance; seating standards keep the seat shorter than the
 * buttock-to-popliteal length); a shallower seat moves the socket forward to 2
 * cm inside its depth.
 *
 * A seat is sat on with both feet on the floor when its height above the floor
 * under the feet (the ground, or the floor of a prop they stand on, as a
 * boat's) lies within 0.8 to 1.2 of the popliteal height, the ratio the
 * campaign sets: a lower seat needs more trunk flexion and a longer rise
 * (Janssen, Bussmann and Stam 2002, Phys Ther 82:866) and is refused for
 * ordinary furniture. A seat fixed by a task, such as a rowing thwart, uses the
 * actor's actual reach to its contacts. A higher seat instead is a high seat: a
 * bar stool, a saddle, a wall. The feet leave the floor for its rests or hang,
 * and the body gets onto it by a step up or a swing of a leg. The popliteal
 * height is the knee joint's height less the thigh's radius, where the thigh's
 * underside meets a level seat.
 */
export namespace IAutoMovieMotionHumanSeated {
  /** The model colliders of a static seat in their actual placed frame. */
  export interface IStaticSolid {
    /** The model's fixed world frame. */
    frame: IAutoMovieRigidTransform;

    /** The model's actual colliders, expressed in that frame. */
    shapes: readonly IAutoMoviePhysicalShape[];
  }

  /**
   * Whether a seat is a high one for a body: above the band, so the feet cannot
   * stay on the floor and the body gets onto it by a step up or a swing of a
   * leg, then sits with the feet on its rests or hanging, as on a bar stool, a
   * saddle or a wall. A seat in the world.
   */
  export interface ISeat {
    /**
     * The middle of the sitting surface's front edge, world metres; its height
     * is the seat height.
     */
    at: IAutoMovieVector3;

    /** The heading a sitter faces, degrees about +Y. */
    yaw: number;

    /**
     * The sitting surface's forward tip, degrees, front edge down, as a
     * posture's pitch; level when absent, as on a horse standing on a grade.
     */
    pitch?: number;

    /**
     * The sitting surface's sideways tilt, degrees, as a posture's roll; level
     * when absent.
     */
    roll?: number;

    /**
     * The subject of the prop the seat belongs to, when that prop may move: the
     * seat is then read where the prop stands when the sit begins, and the sit
     * follows it in the prop's frame (`sitCarried`). A seat in the world when
     * absent.
     */
    carrier?: string;

    /**
     * The seat's own contact id on its `carrier`, read only with it: the sit
     * also follows that contact as it moves within the carrier, as a saddle
     * rises and falls on a walking horse's back, the way a ride follows its
     * seat. Carried with the carrier alone when absent.
     */
    point?: string;

    /** Material of an explicitly prepared static astride seat. */
    solid?: IStaticSolid;

    /**
     * Depth back from the front edge, metres; deep enough for the thigh when
     * absent.
     */
    depth?: number;

    /** Backrest height above the surface, metres; backless when absent. */
    back?: number;

    /** For a seat fixed by task geometry, use the body's reachable contacts. */
    workingSeat?: boolean;

    /**
     * Whether the seat is sat astride, a leg on either side, as a saddle is;
     * both legs ahead when absent.
     */
    astride?: boolean;

    /**
     * Where a palm rests on each armrest, world metres: the top of the armrest
     * beside the sitter. A hand with one goes to it while sitting down and
     * bears on it; a hand with none rests on its thigh.
     */
    armrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;

    /**
     * The side a seat sat astride is got onto and off from, as a horse is
     * mounted from its left; either side when absent or `either`.
     */
    mount?: "left" | "right" | "either";

    /**
     * Where a foot rests while seated, world metres: the tread a foot's ball
     * bears on (a stool's bar, a pedal, a peg, a stirrup). Read only on a seat
     * higher than the band, where the feet leave the floor; a foot with no
     * rest, or whose rest the leg cannot reach, hangs.
     */
    footrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;

    /**
     * Each footrest's affordance on the carrier. A point on a bar may be
     * offset from the affordance's origin.
     */
    footrestPoints?: Partial<Record<"left" | "right", string>>;
  }
}
