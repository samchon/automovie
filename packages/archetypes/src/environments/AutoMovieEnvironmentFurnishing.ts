import {
  type IAutoMovieEnvironmentModule,
  type IAutoMovieFurnishingLayout,
  type IAutoMovieFurnishingPiece,
  type IAutoMoviePropSpec,
} from "@automovie/interface";

import { createBedroomKit as createBedroomKitImplementation } from "./furnishings/createBedroomKit";
import { createCafeKit as createCafeKitImplementation } from "./furnishings/createCafeKit";
import { createFurnishedRoom as createFurnishedRoomImplementation } from "./furnishings/createFurnishedRoom";
import { createGymKit as createGymKitImplementation } from "./furnishings/createGymKit";
import { createKitchenKit as createKitchenKitImplementation } from "./furnishings/createKitchenKit";
import { createLivingRoomKit as createLivingRoomKitImplementation } from "./furnishings/createLivingRoomKit";
import { createOfficeKit as createOfficeKitImplementation } from "./furnishings/createOfficeKit";
import { createEnvironmentProp as createEnvironmentPropImplementation } from "./furnishings/internal/createEnvironmentProp";

/** Public operations for Auto Movie Environment Furnishing. */
export namespace AutoMovieEnvironmentFurnishing {
  /** The room layout and the positive integer count of the kit's repeated group. */
  export interface ICafeKitParams extends IAutoMovieFurnishingLayout {
    /** Positive integer count of dining groups. */
    readonly tables: number;
  }

  /** The room layout and the positive integer count of desks. */
  export interface IOfficeKitParams extends IAutoMovieFurnishingLayout {
    /** Positive integer count of desk groups. */
    readonly desks: number;
  }

  /**
   * The default gap in metres between the wardrobe and the chest: an authored
   * layout default.
   */
  export const AUTO_MOVIE_ENVIRONMENT_FURNISHING_BEDROOM_CHEST_GAP: number = 0.1;

  /** The room layout, the bed size and the wardrobe-to-chest gap. */
  export interface IBedroomKitParams extends IAutoMovieFurnishingLayout {
    /** The household bed size. The default is `"double"`. */
    readonly bed?: "single" | "double";

    /**
     * Gap in metres between the wardrobe's and the chest's boxes along the `+z`
     * wall. The default is
     * {@link AUTO_MOVIE_ENVIRONMENT_FURNISHING_BEDROOM_CHEST_GAP}.
     */
    readonly chestGap?: number;
  }

  /** The room layout and its ordered pieces. */
  export interface IFurnishedRoomParams extends IAutoMovieFurnishingLayout {
    /** Pieces by role, resolved in record order. */
    readonly pieces: Readonly<Record<string, IAutoMovieFurnishingPiece>>;
  }

  /** The room layout and the positive integer count of the kit's repeated group. */
  export interface IGymKitParams extends IAutoMovieFurnishingLayout {
    /** Positive integer count of free-weight stations. */
    readonly stations: number;
  }

  /** The room layout and the number of cooks the work aisle serves. */
  export interface IKitchenKitParams extends IAutoMovieFurnishingLayout {
    /** One or two cooks, choosing the NKBA work aisle. The default is 1. */
    readonly cooks?: 1 | 2;
  }

  /**
   * The default clear floor in metres between the sofa's and the coffee table's
   * front faces: an authored layout default, not a published clearance.
   */
  export const AUTO_MOVIE_ENVIRONMENT_FURNISHING_LIVING_ROOM_TABLE_GAP: number = 0.45;

  /** The room layout and the sofa-to-table gap. */
  export interface ILivingRoomKitParams extends IAutoMovieFurnishingLayout {
    /**
     * Clear floor in metres between the sofa's and the coffee table's front
     * faces, and between the table and the armchairs. The default is
     * {@link AUTO_MOVIE_ENVIRONMENT_FURNISHING_LIVING_ROOM_TABLE_GAP}.
     */
    readonly tableGap?: number;
  }

  /**
   * Make a placeable environment prop from a model and its declared
   * affordances.
   *
   * The occurrence receives one id for its staged node, model and prop spec.
   * Its anchors expose every model-local affordance under the affordance's own
   * id. Place the occurrence at an ordinary environment point or at another
   * item's named frame, such as a room floor or a table's `stack` affordance.
   * Use `placement` to declare any support or containment relation that needs
   * validation. An imported appearance keeps the model's own proxy geometry and
   * contacts.
   *
   * @param props The model and any existing prop claims, articulation or asset
   *   reference.
   * @returns The environment module that emits the staged prop.
   */
  export function prop(
    props: Readonly<
      Pick<IAutoMoviePropSpec, "model" | "placement" | "modelRef"> &
        Partial<Pick<IAutoMoviePropSpec, "articulation">>
    >,
  ): IAutoMovieEnvironmentModule {
    return createEnvironmentPropImplementation(props);
  }

  /**
   * Furnish a room with a service counter and dining groups of one table and
   * two chairs.
   *
   * Place the kit at the centre of a floor with its local +Z facing customers
   * from the service counter. Name a role as `counter`, `table-1`,
   * `table-1/chair-near` on +Z or `table-1/chair-far` on -Z. Append the prop's
   * native affordance id to place or address a contact. For example,
   * `table-1/stack` is the support for a cup and `table-1/chair-near/seat` is a
   * sitting contact. The grid, aisle and approach reservations remain in the
   * room frame when the room is rotated.
   *
   * @param params The room layout and positive number of dining tables.
   * @returns The placed-room module, with both stage nodes and prop claims.
   * @throws When the room cannot accommodate the tables and clear approaches.
   */
  export function cafeKit(
    params: ICafeKitParams,
  ): IAutoMovieEnvironmentModule {
    return createCafeKitImplementation(params);
  }

  /**
   * Furnish an office: repeated desks, each with an office chair facing it, on
   * the room's grid, a filing cabinet on the `-x` wall and a bookcase on the
   * `+x` wall.
   *
   * The roles are `filing`, `bookcase`, `desk-1`, `desk-1/chair` and so on for
   * each desk; each producer affordance is `<role>/<affordance id>`, such as
   * `desk-1/chair/seat`. Each chair stands on its desk's local +Z side, turned
   * to face the desk, with its front at the desk's edge. The filing cabinet
   * stands near the `-x` wall's run corner, as far from it as its clear floor
   * overhangs the cabinet, and keeps the forward-approach clear floor of
   * {@link ROOM_CLEARANCES}.clearFloor in front, named `forward approach`; the
   * bookcase starts at the `+x` wall's run corner. The desk groups take the
   * first grid slots clear of both and of that clearance. The figure is a
   * coarse layout rule, not an accessibility claim.
   *
   * @param params The room layout and the positive number of desks.
   * @returns The placed-room module.
   * @throws When a piece or clearance leaves the room or overlaps, or the desks
   *   do not fit, naming the role or the `desks` count.
   */
  export function officeKit(
    params: IOfficeKitParams,
  ): IAutoMovieEnvironmentModule {
    return createOfficeKitImplementation(params);
  }

  /**
   * Furnish a bedroom: a bed with its head centred on the `-z` wall, and a
   * wardrobe and a chest on the `+z` wall facing the bed's foot.
   *
   * The roles are `bed`, `wardrobe` and `chest`; each producer affordance is
   * `<role>/<affordance id>`, such as `bed/surface`. The bed keeps the clear
   * floor of {@link ROOM_CLEARANCES}.bedSide beside both long sides, the 2010
   * ADA Standards' parallel approach of 806.2.3, named `left side` and `right
   * side`. The wardrobe starts at the `+z` wall's run corner and the chest
   * follows it `chestGap` metres along the run; each keeps the forward-approach
   * clear floor of {@link ROOM_CLEARANCES}.clearFloor in front, named `forward
   * approach`. A room narrower than the bed plus both side clearances is
   * refused naming the bed's side clearance, and one shallower than the bed
   * plus the wardrobe and its clear floor is refused naming the wardrobe. The
   * figures are a coarse layout rule, not an accessibility or code compliance
   * claim.
   *
   * @param params The room layout, the bed size and the wardrobe-to-chest gap.
   * @returns The placed-room module.
   * @throws When a piece or clearance leaves the room or overlaps another
   *   piece, clearance or `keepClear` area, naming the role and clearance.
   */
  export function bedroomKit(
    params: IBedroomKitParams,
  ): IAutoMovieEnvironmentModule {
    return createBedroomKitImplementation(
      params,
      AUTO_MOVIE_ENVIRONMENT_FURNISHING_BEDROOM_CHEST_GAP,
    );
  }

  /**
   * Furnish a room by relations: pieces against walls, after one another along
   * a wall, facing an earlier piece, or at an absolute position.
   *
   * Place the module at the floor centre of the room, with walls at `x =
   * ±width/2` and `z = ±depth/2`. Each piece is measured from its model's rest
   * box, so a reseeded sofa that grows moves the end table placed after it and
   * keeps the coffee table facing it centred. Pieces resolve in record order
   * and a relation names only an earlier piece. Each piece is staged as the
   * role `<role>`, and its model affordances as `<role>/<affordance id>`. Each
   * piece a `wall` relation placed is returned in `mounts` with its wall, so a
   * support check can judge a hung mirror or board against it.
   *
   * @param params The room layout and its pieces by role.
   * @returns The placed-room module.
   * @throws When a relation or clearance is malformed, names a missing, later
   *   or other-wall piece, or leaves a piece or clearance outside the room or
   *   overlapping another piece, clearance or `keepClear` area; each refusal
   *   names the role.
   */
  export function furnishedRoom(
    params: IFurnishedRoomParams,
  ): IAutoMovieEnvironmentModule {
    return createFurnishedRoomImplementation(params);
  }

  /**
   * Furnish a room with bench and free-weight stations.
   *
   * Each station has one bench and one dumbbell on each side, resting on the
   * floor. A bench's +Z end faces its seated approach. Use `bench-1/seat` for a
   * sitting contact and `bench-1/dumbbell-left/grip` to aim at a weight. Left
   * means +X for a person facing local +Z. The room layout is measured from the
   * floor centre and follows the kit's placement frame.
   *
   * @param params The useful room layout and positive number of stations.
   * @returns The placed-room module, with stage nodes and operative prop
   *   records.
   * @throws When the requested stations or their clearances do not fit.
   */
  export function gymKit(
    params: IGymKitParams,
  ): IAutoMovieEnvironmentModule {
    return createGymKitImplementation(params);
  }

  /**
   * Furnish a kitchen: one run along the `-z` wall of a refrigerator, a
   * counter, a range and a second counter, each abutting the one before.
   *
   * The roles are `refrigerator`, `counter-1`, `range` and `counter-2`; each
   * producer affordance is `<role>/<affordance id>`. The refrigerator starts at
   * the run's corner. Each counter and the range keeps the NKBA work aisle in
   * front of it, as wide as its own box and named `work aisle`:
   * {@link ROOM_CLEARANCES}.workAisle for one cook and
   * {@link ROOM_CLEARANCES}.sharedWorkAisle for two. A room too shallow for the
   * aisle is refused naming it. No archetype draws a kitchen sink, so the kit
   * has no sink role; a production that needs one adds a coarse form. The
   * figures are a coarse layout rule, not a code compliance claim.
   *
   * @param params The room layout and the number of cooks.
   * @returns The placed-room module.
   * @throws When the run leaves the room or its work aisle does not fit, naming
   *   the role and the work aisle, or when `cooks` is not 1 or 2.
   */
  export function kitchenKit(
    params: IKitchenKitParams,
  ): IAutoMovieEnvironmentModule {
    return createKitchenKitImplementation(params);
  }

  /**
   * Furnish a living room: a sofa centred on the `-z` wall, a coffee table
   * facing it, two armchairs facing the sofa across the table and a bookcase
   * centred on the `-x` wall.
   *
   * The roles are `sofa`, `coffee`, `armchair-left` (on the sofa's local -X
   * side), `armchair-right` and `bookcase`; each producer affordance is
   * `<role>/<affordance id>`, such as `sofa/seat`. The coffee table stands
   * `tableGap` metres of clear floor out from the sofa's front face, centred on
   * it. Each armchair faces the sofa with its front face `tableGap` beyond the
   * table's far face, and the two stand `tableGap` apart, centred on the sofa.
   * The room is measured from its floor centre and follows the kit's placement
   * frame. No clearance is cited: no published standard read for this kit gives
   * a distance between a sofa and a coffee table.
   *
   * @param params The room layout and the sofa-to-table gap.
   * @returns The placed-room module.
   * @throws When a piece leaves the room or overlaps another piece or a
   *   `keepClear` area, naming the role.
   */
  export function livingRoomKit(
    params: ILivingRoomKitParams,
  ): IAutoMovieEnvironmentModule {
    return createLivingRoomKitImplementation(
      params,
      AUTO_MOVIE_ENVIRONMENT_FURNISHING_LIVING_ROOM_TABLE_GAP,
    );
  }

  /** Types of the cafe kit producer. */

  /** The office kit's parameters. */

  /** The bedroom kit's parameters and its default wardrobe-to-chest gap. */

  /** The furnished room's parameters. */

  /** Types of the gym kit producer. */

  /** The kitchen kit's parameters. */

  /** The living-room kit's parameters and its default sofa-to-table gap. */
}
