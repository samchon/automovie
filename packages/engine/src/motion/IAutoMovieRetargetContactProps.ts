import { IAutoMovieRetargetHandContact } from "./IAutoMovieRetargetHandContact";

/**
 * Contact policy input for {@link retargetHumanoidMotion}. Every field is
 * optional: the pass runs with humanoid legs and no declared hand contact
 * unless the caller says otherwise.
 *
 * @author Samchon
 */
export interface IAutoMovieRetargetContactProps {
  /**
   * Run the contact-preserving pass. Defaults to `true`; `false` restores v1's
   * verbatim angle copy.
   */
  enabled?: boolean;

  /**
   * Ground height for source stance detection: a plane scalar or an `(x, z) →
   * y` source. Defaults to the **source rig's own rest floor** (the lowest
   * world Y of its zero pose), so a rig authored with its feet above the origin
   * still detects stance instead of never touching down.
   */
  groundY?: number | ((x: number, z: number) => number);

  /**
   * Contact tolerance above the ground counted as stance, in source model
   * units. Defaults to `0.02`, the same band {@link plantStanceFeet} and
   * {@link validateGroundContact} use. It doubles as the residual budget: a
   * pinned effector that ends further than `tolerance * rootScale` from its
   * contact is reported as a plausibility warning.
   */
  tolerance?: number;

  /** Hand contacts to preserve. Defaults to none. */
  hands?: readonly IAutoMovieRetargetHandContact[];
}
