/**
 * Character age or a person's known age at the time of observation.
 *
 * Age is context for model admission and tissue maturation, not a geometric
 * morph weight. Chronological age alone cannot determine muscle mass, fat
 * distribution, breast support or a skin fold for an individual. A model may
 * use it only inside a validated age domain and report its prediction error.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAge =
  | { readonly kind: "target"; readonly years: number }
  | { readonly kind: "observed"; readonly years: number };
