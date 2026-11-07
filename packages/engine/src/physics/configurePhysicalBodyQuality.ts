import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";

/** Apply the declared native articulation budget only when effective release changes; redundant native setters are avoided to preserve snapshot warm starts. */
export function configurePhysicalBodyQuality(
  bound: Bound,
  input: Simulation.IInput,
  body: Simulation.IBody,
  released: boolean,
): void {
  if (
    !body.releasedQuality?.duringReflex ||
    bound.reflexQuality.has(body.id) === released
  )
    return;
  const iterations: number = released
    ? Math.max(0, body.releasedQuality.iterations - input.iterations)
    : 0;
  const internal: number = released
    ? Math.max(
        0,
        body.releasedQuality.internalIterations - input.internalIterations!,
      )
    : 0;
  for (const rigid of bound.segments.get(body.id)!.values()) {
    if (rigid.additionalSolverIterations() !== iterations)
      rigid.setAdditionalSolverIterations(iterations);
    if (rigid.additionalPgsIterations() !== internal)
      rigid.setAdditionalPgsIterations(internal);
  }
  if (released) bound.reflexQuality.add(body.id);
  else bound.reflexQuality.delete(body.id);
}
