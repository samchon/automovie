import { Vector3, quaternionFromAutoMovieBasis } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Small props stowed in the body's pockets. A pocket is a named site on the
 * body, not a cloth: the region of the body surface its opening lies on, so a
 * stowed prop is worn on that region's bone at the region's point and follows
 * the bone through walking and sitting. Taking it out is the ordinary pickup of
 * a worn prop, which a grip takes off its bone; putting it back is the put-down
 * onto the same site, which wears it there again.
 *
 * - Trouser front pockets on the front of the hips (`pocketFrontLeft`,
 *   `pocketFrontRight`).
 * - The trouser back pocket on the seat (`seat`).
 * - Jacket side pockets at the hips (`hipLeft`, `hipRight`).
 * - Inner breast pockets on the chest (`chestLeft`, `chestRight`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a pocket is, its sites and how custody moves.
 * @evidence contracts/development/design.md#principled-representation A closed set of sites, each the body region its opening lies on; a stowed prop is the existing worn mount.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the sites, the stowing record and the two chain compositions the pocket scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pocket geometry is invented: every frame is the body's own region frame.
 */
export namespace HumanPocket {
  /** A pocket site. */
  export type Site =
    | "frontLeft"
    | "frontRight"
    | "back"
    | "jacketLeft"
    | "jacketRight"
    | "breastLeft"
    | "breastRight";

  /** The body region each site's opening lies on. */
  export const REGIONS: Readonly<Record<Site, AutoMovieHumanoidRegion>> = {
    frontLeft: "pocketFrontLeft",
    frontRight: "pocketFrontRight",
    back: "seat",
    jacketLeft: "hipLeft",
    jacketRight: "hipRight",
    breastLeft: "chestLeft",
    breastRight: "chestRight",
  };

  /**
   * A site's mount: the bone its region rides and the prop's frame in that
   * bone's posed frame, metres.
   */
  export interface IMount {
    /** The bone the region rides. */
    bone: IAutoMovieHumanoidSurfaces.IFrame["bone"];

    /** The prop's frame in the bone's frame: at the region's point, unrotated. */
    offset: IAutoMovieRigidTransform;
  }

  /**
   * The mount of a pocket site on a body.
   *
   * @param body The performer's body.
   * @param site The pocket.
   * @returns The bone and the prop's offset on it.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and units.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the region frame the body declares and places the prop at its point in the bone's frame, upright with its front against the region, so the hand that slides it in keeps its wrist as it holds it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No offset is tuned; the body's own region decides it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function mount(body: IAutoMovieMotionHumanBody, site: Site): IMount {
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[REGIONS[site]];
    // The prop stands upright in the pocket, its front against the body:
    // its +Y up along the body, its +Z into the region, as a phone slides
    // into a pocket on its edge (a prop stands on its bottom edge with its
    // front toward +Z, `createPhone`).
    const inward: IAutoMovieVector3 = Vector3.scale(region.normal, -1);
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract({ x: 0, y: 1, z: 0 }, Vector3.scale(inward, inward.y)),
    );
    return {
      bone: region.bone,
      offset: {
        position: region.point,
        rotation: quaternionFromAutoMovieBasis(
          Vector3.cross(up, inward),
          up,
          inward,
        ),
      },
    };
  }

  /**
   * A prop that starts stowed in a performer's pocket.
   *
   * @param prop The placed prop.
   * @param subject The performer.
   * @param body The performer's body.
   * @param site The pocket.
   * @returns The prop, worn at the pocket from the film's start.
   * @evidence contracts/development/common.md#meaningful-documentation States the start state.
   * @evidence contracts/development/implementation.md#principled-implementation Sets the prop's existing `worn` record to the site's mount.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record spread.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The performance's worn mount carries it; nothing is simulated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record.
   */
  export function stow(
    prop: IAutoMovieMotionHumanProp,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    site: Site,
  ): IAutoMovieMotionHumanProp {
    return { ...prop, worn: { subject, ...mount(body, site) } };
  }

  /**
   * Take a stowed prop out of its pocket into a hand.
   *
   * @param chain The performer's chain.
   * @param prop The stowed prop.
   * @param handle The prop's grip affordance.
   * @param hand The taking hand.
   * @returns The chain with the pickup appended.
   * @evidence contracts/development/common.md#meaningful-documentation States the custody change.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped pickup takes a worn prop off its bone at grip closure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pickup fits and refuses the grasp.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function takeOut<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    prop: string,
    handle: string,
    hand: AutoMovieHumanSide,
  ): Chain {
    return chain.act("pickUp", { prop, handle, hand, lift: 0 });
  }

  /**
   * Put a held prop back into a pocket.
   *
   * @param chain The performer's chain.
   * @param prop The held prop.
   * @param body The performer's body.
   * @param site The pocket.
   * @param hand The holding hand.
   * @returns The chain with the put-down onto the pocket appended.
   * @evidence contracts/development/common.md#meaningful-documentation States the custody change.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped put-down onto a bone wears the prop there from its release.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The put-down plans and refuses the placement.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function putBack<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    prop: string,
    body: IAutoMovieMotionHumanBody,
    site: Site,
    hand: AutoMovieHumanSide,
  ): Chain {
    return chain.act("putDown", { prop, on: mount(body, site), hand });
  }
}
