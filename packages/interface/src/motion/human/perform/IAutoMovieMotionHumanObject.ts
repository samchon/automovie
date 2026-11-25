import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieAffordance } from "../../../model/IAutoMovieAffordance";
import type { IAutoMovieBody } from "../../../model/IAutoMovieBody";
import type { IAutoMoviePhysicalShape } from "../../../physics/IAutoMoviePhysicalShape";
import type { IAutoMovieSoftCollider } from "../../../soft/IAutoMovieSoftCollider";
import type { IAutoMovieSoftSolver } from "../../../soft/IAutoMovieSoftSolver";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";

/**
 * Attach actions to an object: an object says where a person meets it through
 * its affordances (a seat, a handle, a surface), and this gives the actions
 * what they read of it, placed in the world.
 *
 * The object is any model that declares affordances in its own space, such as
 * an archetype; nothing here depends on how it was made. Its place is where the
 * scene puts it. A sitting action then sits on the seat the chair declares, at
 * the height and depth the chair has, and a grasp, a touch or a look goes to
 * the contact the object names instead of to coordinates written by hand.
 */
export namespace IAutoMovieMotionHumanObject {
  /**
   * An object as a prop of a performance: actions aim at its contacts by their
   * ids, hands grasp its handles, and it rides the hand that holds it. What is
   * read of an object.
   */
  export interface IModel {
    /**
     * Whether the model declares internal articulation. Omission leaves the
     * adapter unable to certify that a model with a pose method is rigid.
     */
    readonly hasArticulations?: boolean;

    /** Its contacts, in its own space. */
    affordances?: readonly IAutoMovieAffordance[] | null;

    /** Endpoints of a declared span at this model's current articulation state. */
    span?(id: string): ISpanEnds;

    /** Its colliders in its own space, for a hand to close on. */
    shapes?(): IAutoMoviePhysicalShape[];

    /**
     * The object with its articulations at stated travels, for an object whose
     * parts move (an archetype's `articulate`). Providers may expose this
     * method on rigid models with `hasArticulations: false`.
     *
     * @param state Travel by articulation id.
     * @returns The posed object.
     */
    articulate?(
      state: Readonly<Record<string, number>>,
    ): IAutoMovieMotionHumanObject.IModel;

    /**
     * Prepare a single-contact projection of the same absolute articulation as
     * `articulate`, when the model supports selected reads.
     */
    prepareArticulateSite?(): IAutoMovieMotionHumanProp["articulateSite"];

    /** Its physical data (an archetype's model body); none when absent or null. */
    body?: IAutoMovieBody | null;
  }

  /** Two endpoints in the current model pose, in model-space metres. */
  export interface ISpanEnds {
    /** The first endpoint in the model's posed space, in metres. */
    from: IAutoMovieVector3;

    /** The second endpoint in the model's posed space, in metres. */
    to: IAutoMovieVector3;
  }

  /** The model's declared span geometry and its current endpoint reader. */
  export type ISpanModel = IModel &
    Required<Pick<IModel, "span">> & {
      /**
       * Each line's stable id, radius and declared length, null for a rigid
       * span.
       */
      readonly spans: readonly {
        readonly id: string;
        readonly radius: number;
        readonly length: number | null;
      }[];
    };

  /** A declared span's soft-cord placement and physical discretization. */
  export interface ICord {
    /** Unique subject id of the soft cord in the performance. */
    subject: string;

    /** The existing prop built from the same model, included in the performance. */
    owner: Pick<IAutoMovieMotionHumanProp, "subject" | "frame" | "motion">;

    /** Number of cord links, at least two. The soft body has one more particle. */
    links: number;

    /** Total cord mass in kilograms, distributed along the line. */
    mass: number;

    /** The fixed-step solver's integration, stiffness and budget settings. */
    solver: IAutoMovieSoftSolver;

    /** Coulomb friction coefficient used for cord contact. */
    friction: number;

    /** Whether the cord asks the engine to project self-contact. */
    selfCollision?: boolean;

    /** Additional collision boundaries, absent for a free-hanging cord. */
    colliders?: readonly IAutoMovieSoftCollider[];
  }

  /**
   * Where the scene puts an object: a rigid world frame, or the floor point
   * under its origin and the heading its own `+Z` faces, degrees about +Y;
   * `fixed` sets it as a fixture, which hands grip and never carry
   * (`IAutoMovieMotionHumanProp.fixed`).
   */
  export type Placement = (
    | IAutoMovieRigidTransform
    | {
        /**
         * World floor point beneath the object's origin, metres; the object
         * builder places its origin above this floor point.
         */
        at: IAutoMovieVector3;
        /** Object yaw in degrees about world +Y. */
        yaw: number;
      }
  ) & {
    /**
     * Whether the object is immovable; omitted leaves the normal movable
     * placement behavior.
     */
    fixed?: boolean;
  };
}
