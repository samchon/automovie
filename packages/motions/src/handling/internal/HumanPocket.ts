import { AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
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

/*
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
 */
export namespace HumanPocket {
  /*
   * A pocket site.
   */
  export type Site =
    | "frontLeft"
    | "frontRight"
    | "back"
    | "jacketLeft"
    | "jacketRight"
    | "breastLeft"
    | "breastRight";

  /*
   * The body region each site's opening lies on.
   */
  export const REGIONS: Readonly<Record<Site, AutoMovieHumanoidRegion>> = {
    frontLeft: "pocketFrontLeft",
    frontRight: "pocketFrontRight",
    back: "seat",
    jacketLeft: "hipLeft",
    jacketRight: "hipRight",
    breastLeft: "chestLeft",
    breastRight: "chestRight",
  };

  /*
   * A site's mount: the bone its region rides and the prop's frame in that
   * bone's posed frame, metres.
   */
  export interface IMount {
    /*
     * The bone the region rides.
     */
    bone: IAutoMovieHumanoidSurfaces.IFrame["bone"];

    /*
     * The prop's frame in the bone's frame: at the region's point, unrotated.
     */
    offset: IAutoMovieRigidTransform;
  }

  /*
   * The mount of a pocket site on a body.
   * Parameter body: The performer's body.
   * Parameter site: The pocket.
   * Returns: The bone and the prop's offset on it.
   */
  export function mount(body: IAutoMovieMotionHumanBody, site: Site): IMount {
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[REGIONS[site]];
    // The prop stands upright in the pocket, its front against the body:
    // its +Y up along the body, its +Z into the region, as a phone slides
    // into a pocket on its edge (a prop stands on its bottom edge with its
    // front toward +Z, `createPhone`).
    const inward: IAutoMovieVector3 = AutoMovieEngineVector3.scale(region.normal, -1);
    const up: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract({ x: 0, y: 1, z: 0 }, AutoMovieEngineVector3.scale(inward, inward.y)),
    );
    return {
      bone: region.bone,
      offset: {
        position: region.point,
        rotation: AutoMovieEngineMath.quaternionFromBasis(
          AutoMovieEngineVector3.cross(up, inward),
          up,
          inward,
        ),
      },
    };
  }

  /*
   * A prop that starts stowed in a performer's pocket.
   * Parameter prop: The placed prop.
   * Parameter subject: The performer.
   * Parameter body: The performer's body.
   * Parameter site: The pocket.
   * Returns: The prop, worn at the pocket from the film's start.
   */
  export function stow(
    prop: IAutoMovieMotionHumanProp,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    site: Site,
  ): IAutoMovieMotionHumanProp {
    return { ...prop, worn: { subject, ...mount(body, site) } };
  }

  /*
   * Take a stowed prop out of its pocket into a hand.
   * Parameter chain: The performer's chain.
   * Parameter prop: The stowed prop.
   * Parameter handle: The prop's grip affordance.
   * Parameter hand: The taking hand.
   * Returns: The chain with the pickup appended.
   */
  export function takeOut<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    prop: string,
    handle: string,
    hand: AutoMovieHumanSide,
  ): Chain {
    return chain.act("pickUp", { prop, handle, hand, lift: 0 });
  }

  /*
   * Put a held prop back into a pocket.
   * Parameter chain: The performer's chain.
   * Parameter prop: The held prop.
   * Parameter body: The performer's body.
   * Parameter site: The pocket.
   * Parameter hand: The holding hand.
   * Returns: The chain with the put-down onto the pocket appended.
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
