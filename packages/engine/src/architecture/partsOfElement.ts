/** The single-pair lookup: one element's parts, resolved on the spot.  * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
 * @author Samchon
 */
export const partsOfElement =
  (environment: IAutoMovieBuiltEnvironment) =>
  (id: string): readonly IWorldBox[] | null =>
    builtEnvironmentElementPartBounds(environment, id);
