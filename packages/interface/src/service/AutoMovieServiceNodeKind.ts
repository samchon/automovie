/**
 * Computational role of an authored service node, independent of equipment catalog geometry.
 *
 * @evidence contracts/development/design.md#principled-representation Node admission checks the six role names for membership, while ports and explicit state determine connectivity and optional zero-opening isolation. No role-specific geometry, demand or state requirement is inferred.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One role union serves all disciplines without a class hierarchy or embedded fixture catalog.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Naming a valve or fixture does not infer dimensions, ports, load or opening state; productions author those quantities directly.
 * @evidence contracts/development/common.md#meaningful-documentation Explains every role with its supported network responsibility and examples.
 */
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
