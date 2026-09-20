import { IAutoMoviePose } from "@automovie/interface";
import { IAutoMovieImpact } from "./IAutoMovieImpact";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * A suggested collision response: the abstracted {@link IAutoMovieImpact}, the
 * {@link IAutoMovieRecoilPush} its impulse maps to, and (when a struck chain is
 * given) the ROM-bounded flinch {@link IAutoMoviePose}. It is advice an agent
 * can accept, not an imposed result (see D010): a warning carries this so the
 * model can adopt the plausible bounce or override it as intentional.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Carries the computed impact and bounded reaction suggestion together.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Exposes the contact output consumed by authored aftermath.
 * @author Samchon
 */
export interface IAutoMovieCollisionResponse {
  /**
   * The resolved impact between the two bodies.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Preserves the deterministic impulse and outcome of contact.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the primary world-contact result.
   */
  impact: IAutoMovieImpact;
  /**
   * The recoil deflection its impulse maps to.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Maps contact impulse into an inspectable reaction cue.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the reaction input derived from the contact output.
   */
  push: IAutoMovieRecoilPush;
  /**
   * The ROM-bounded flinch pose, or `null` when no struck chain was given.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes the bounded pose consequence when a reaction chain is supplied.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Joins the computed contact to its optional deterministic reaction.
   */
  recoil: IAutoMoviePose | null;
}
