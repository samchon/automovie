/**
 * Separate numerical preparation goals from the existing transported-point budget.
 * @evidence contracts/common.md#implementation-and-ownership Uses the existing five-millimetre arm/material-target budget, finite nonnegative measured normal telemetry, native interval satisfaction and unclamped controls. Deliberately does not read request.tolerance: a tighter optimization goal does not become a new film threshold. Finite receiving-face distance/coverage, inward normal and complete skin clearance remain independent physical predicates in the actual consumer.
 * @evidence contracts/common.md#authoring-interface Supply actual public fitting/applied-point observations, or undefined for a missing result. Returns only fit-level admission; true is never a finite paper contact certificate. Native/applied distances are metres and normal telemetry is degrees. The caller must combine this result with actual face, skin, support and custody observations before enabling motion.
 */
export function admitSurfacePushFit(fit:{error:number;position:number;normal:number;constraintsSatisfied:boolean;clamps:readonly unknown[]}|undefined):boolean {
  return !!fit&&[fit.error,fit.position,fit.normal].every((v:number):boolean=>Number.isFinite(v)&&v>=0)&&fit.error<=.005&&fit.position<=.005&&fit.clamps.length===0&&fit.constraintsSatisfied;
}
