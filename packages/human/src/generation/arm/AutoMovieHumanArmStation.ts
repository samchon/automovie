/**
 * The landmark stations at which the arm's shape rule is read, from the
 * shoulder to the wrist, by name:
 *
 * - `u0.3`, `u0.45`, `u0.6`, `u0.75`: shares of the humerus' joint-centre
 *   length from the glenohumeral centre (the deltoid and the upper arm's
 *   compartments; `u0.45` stands for the deltoid insertion);
 * - `ridge`: the supracondylar ridge above the elbow;
 * - `elbow`: the elbow centre, in the plane bisecting the corner;
 * - `f0.1`, `f0.22`, `f0.4`, `f0.6`, `f0.8`, `f0.95`: shares of the elbow
 *   centre to stylion along the forearm (the elbow's distal edge, the belly,
 *   the junction and the wrist).
 *
 * Every column of the shape rule (a guide line or a sector) keeps one value
 * set for each of these stations.
 */
export type AutoMovieHumanArmStation =
  | "u0.3"
  | "u0.45"
  | "u0.6"
  | "u0.75"
  | "ridge"
  | "elbow"
  | "f0.1"
  | "f0.22"
  | "f0.4"
  | "f0.6"
  | "f0.8"
  | "f0.95";
