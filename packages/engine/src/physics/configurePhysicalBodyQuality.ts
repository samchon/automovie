import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalReleasedQuality } from "./physicalReleasedQuality";

/**
 * Apply the declared native articulation budget only when effective release changes; redundant native setters are avoided to preserve snapshot warm starts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Apply the declared native articulation budget only when effective release changes; redundant native setters are avoided to preserve snapshot warm starts) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Apply the declared native articulation budget only when effective release changes; redundant native setters are avoided to preserve snapshot warm starts) directly over its typed inputs (`bound`, `input`, `body`, `released`) as a single pass (for-of over bound.segments.get(body.id)!.values()), delegating to `physicalReleasedQuality`, `rigid.additionalSolverIterations`, `rigid.setAdditionalSolverIterations`, `rigid.additionalPgsIterations`, `rigid.setAdditionalPgsIterations`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 24 lines and 6 top-level statements that reuses `physicalReleasedQuality`, `rigid.additionalSolverIterations`, `rigid.setAdditionalSolverIterations`, `rigid.additionalPgsIterations`, `rigid.setAdditionalPgsIterations` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `bound`, `input`, `body`, `released`; the dominant cost is a single pass (for-of over bound.segments.get(body.id)!.values()), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
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
