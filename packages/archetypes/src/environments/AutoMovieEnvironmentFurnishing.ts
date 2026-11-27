import { type IAutoMovieEnvironmentModule, type IAutoMoviePropSpec, type IAutoMovieFurnishingLayout } from "@automovie/interface";
import { createEnvironmentProp as createEnvironmentPropImplementation } from "./furnishings/internal/createEnvironmentProp";
import { createCafeKit as createCafeKitImplementation } from "./furnishings/createCafeKit";
import { createOfficeKit as createOfficeKitImplementation } from "./furnishings/createOfficeKit";

/** Public operations for Auto Movie Environment Furnishing. */
export namespace AutoMovieEnvironmentFurnishing {
  /**
   * Make a placeable environment prop from a model and its declared affordances.
   *
   * The occurrence receives one id for its staged node, model and prop spec. Its
   * anchors expose every model-local affordance under the affordance's own id.
   * Place the occurrence at an ordinary environment point or at another item's
   * named frame, such as a room floor or a table's `stack` affordance. Use
   * `placement` to declare any support or containment relation that needs
   * validation. An imported appearance keeps the model's own proxy geometry and
   * contacts.
   *
   * @param props The model and any existing prop claims, articulation or asset
   *   reference.
   * @returns The environment module that emits the staged prop.
   */
  export function prop(props: Readonly<
    Pick<IAutoMoviePropSpec, "model" | "placement" | "modelRef"> &
      Partial<Pick<IAutoMoviePropSpec, "articulation">>
  >): IAutoMovieEnvironmentModule {
    return createEnvironmentPropImplementation(props);
  }

  /**
   * Furnish a room with a service counter and dining groups of one table and two
   * chairs.
   *
   * Place the kit at the centre of a floor with its local +Z facing customers
   * from the service counter. Name a role as `counter`, `table-1`,
   * `table-1/chair-near` on +Z or `table-1/chair-far` on -Z. Append the prop's
   * native affordance id to place or address a contact. For example,
   * `table-1/stack` is the support for a cup and `table-1/chair-near/seat` is a
   * sitting contact. The grid, aisle and approach reservations remain in the room
   * frame when the room is rotated.
   *
   * @param params The room layout and positive number of dining tables.
   * @returns The placed-room module, with both stage nodes and prop claims.
   * @throws When the room cannot accommodate the tables and clear approaches.
   */
  export function cafeKit(
    params: CafeKit.IParams,
  ): IAutoMovieEnvironmentModule {
    return createCafeKitImplementation(params);
  }

  /**
   * Furnish an office: repeated desks, each with an office chair facing it, on
   * the room's grid, a filing cabinet on the `-x` wall and a bookcase on the `+x`
   * wall.
   *
   * The roles are `filing`, `bookcase`, `desk-1`, `desk-1/chair` and so on for
   * each desk; each producer affordance is `<role>/<affordance id>`, such as
   * `desk-1/chair/seat`. Each chair stands on its desk's local +Z side, turned to
   * face the desk, with its front at the desk's edge. The filing cabinet stands
   * near the `-x` wall's run corner, as far from it as its clear floor overhangs
   * the cabinet, and keeps the forward-approach clear floor of
   * {@link ROOM_CLEARANCES}.clearFloor in front, named `forward approach`; the
   * bookcase starts at the `+x` wall's run corner. The desk groups take the first
   * grid slots clear of both and of that clearance. The figure is a coarse layout
   * rule, not an accessibility claim.
   *
   * @param params The room layout and the positive number of desks.
   * @returns The placed-room module.
   * @throws When a piece or clearance leaves the room or overlaps, or the desks
   *   do not fit, naming the role or the `desks` count.
   */
  export function officeKit(
    params: OfficeKit.IParams,
  ): IAutoMovieEnvironmentModule {
    return createOfficeKitImplementation(params);
  }

  /** Types of the cafe kit producer. */
  export namespace CafeKit {
    /** The room layout and the positive integer count of the kit's repeated group. */
    export interface IParams extends IAutoMovieFurnishingLayout {
      /** Positive integer count of dining groups. */
      readonly tables: number;
    }
  }

  /** The office kit's parameters. */
  export namespace OfficeKit {
    /** The room layout and the positive integer count of desks. */
    export interface IParams extends IAutoMovieFurnishingLayout {
      /** Positive integer count of desk groups. */
      readonly desks: number;
    }
  }
}
