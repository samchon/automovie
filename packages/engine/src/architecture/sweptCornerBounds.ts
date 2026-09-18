/** The world bounds one leaf corner reaches across a panel's whole travel.  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const sweptCornerBounds = (
  base: readonly number[],
  motion: IAutoMovieTravelMotion,
  corner: IAutoMovieVector3,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const axis = Vector3.normalize(motion.axis);
  if (motion.kind === "prismatic") {
    const ends = [motion.min, motion.max].map((value) =>
      applyMatrix(base, Vector3.add(corner, Vector3.scale(axis, value))),
    );
    return boundsOf(ends);
  }
  const offset = Vector3.subtract(corner, motion.pivot);
  const along = Vector3.scale(axis, Vector3.dot(axis, offset));
  const center = applyMatrix(base, Vector3.add(motion.pivot, along));
  const cosine = applyDirection(base, Vector3.subtract(offset, along));
  const sine = applyDirection(base, Vector3.cross(axis, offset));
  const reach = (component: "x" | "y" | "z"): { low: number; high: number } => {
    const phase = Math.atan2(sine[component], cosine[component]);
    const angles = [motion.min, motion.max];
    const first = Math.ceil((motion.min - phase) / Math.PI);
    const last = Math.floor((motion.max - phase) / Math.PI);
    for (let step = first; step <= last; ++step)
      angles.push(phase + step * Math.PI);
    const values = angles.map(
      (angle) =>
        center[component] +
        cosine[component] * Math.cos(angle) +
        sine[component] * Math.sin(angle),
    );
    return { low: Math.min(...values), high: Math.max(...values) };
  };
  const x = reach("x");
  const y = reach("y");
  const z = reach("z");
  return {
    min: { x: x.low, y: y.low, z: z.low },
    max: { x: x.high, y: y.high, z: z.high },
  };
};
