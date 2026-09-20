/**
 * One vertical column a runtime model certainly fills, about its own axis.
 *
 * Not the extent of the model but a disc inside it: the largest circle that
 * fits in one part's own horizontal cross-section, centred on the axis the
 * member stands on, over the height that part covers. Two members standing
 * closer than the sum of two such radii, at heights whose intervals meet, are
 * two bodies in one place, and that is what lets a refusal be sound. Everything
 * the measure leaves out — an arm reaching outside the column, a part hung off
 * the axis — costs the gate an overlap it does not find, and can never make it
 * invent one.
 *
 * This is the model as it rests, which is the shape a unit is staged in and the
 * shape a crowd holds. What one member's own performance does to one of its
 * parts is not read here, in either direction: a gate that tried to would be
 * measuring a solver's output rather than a design's arrangement.
 *
 * @author Samchon
 */
export interface IAutoMovieModelColumn {
  /**
   * Radius of the disc the model fills, in metres.
   */
  radius: number;
  /**
   * Bottom of the column, in metres above where the model stands.
   */
  bottom: number;
  /**
   * Top of the column, in metres above where the model stands.
   */
  top: number;
}
