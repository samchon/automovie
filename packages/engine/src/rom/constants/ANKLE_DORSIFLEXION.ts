/**
 * The ankle's dorsiflexion limits, degrees, each with the condition it holds
 * under.
 *
 * - `loaded`: a foot bearing the body's weight, the tibia leaning over the
 *   flat foot: 39, the mean maximal weight-bearing lunge of healthy adults
 *   measured by inclinometer on the tibia (38.8 +- 5.2 degrees, Konor, Morton,
 *   Eckerson and Grindstaff 2012, Int J Sports Phys Ther 7(3):279), to the
 *   degree.
 * - `unloaded`: a foot bearing no weight: 20, the passive non-weight-bearing
 *   norm the range table's foot row already holds (`DEFAULT_HUMANOID_ROM`,
 *   dorsiflexion 20 and plantarflexion 50, the AAOS norms as relayed and not
 *   checked against a primary source here).
 *
 * A planner that knows whether a foot bears weight reads the limit of that
 * condition.
 */
export const ANKLE_DORSIFLEXION: Readonly<
  Record<"loaded" | "unloaded", number>
> = { loaded: 39, unloaded: 20 };
