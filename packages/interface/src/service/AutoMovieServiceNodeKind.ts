/** Computational family of a node. */
export type AutoMovieServiceNodeKind =
  /** Where the medium enters or leaves the building: a main, a panel, a stack. */
  | "source"

  /** Something a person uses: a basin, a tap, an outlet, a sprinkler head. */
  | "fixture"

  /** Plant: an air handling unit, a pump, a boiler, a switchboard. */
  | "equipment"

  /** Where the medium meets the room: a diffuser, a grille, a luminaire. */
  | "terminal"

  /** A tee, an elbow, a manifold, a junction box. */
  | "junction"

  /** An inline device with a state: a valve, a damper, a switch. */
  | "valve";
