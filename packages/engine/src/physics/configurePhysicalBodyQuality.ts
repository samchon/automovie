import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalReleasedQuality } from "./physicalReleasedQuality";

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
  const budget: ReturnType<typeof physicalReleasedQuality> =
    physicalReleasedQuality({
      quality: body.releasedQuality,
      released,
      iterations: input.iterations,
      internalIterations: input.internalIterations!,
    });
  const iterations: number = budget.solver;
  const internal: number = budget.pgs;
  for (const rigid of bound.segments.get(body.id)!.values()) {
    if (rigid.additionalSolverIterations() !== iterations)
      rigid.setAdditionalSolverIterations(iterations);
    if (rigid.additionalPgsIterations() !== internal)
      rigid.setAdditionalPgsIterations(internal);
  }
  if (released) bound.reflexQuality.add(body.id);
  else bound.reflexQuality.delete(body.id);
}
