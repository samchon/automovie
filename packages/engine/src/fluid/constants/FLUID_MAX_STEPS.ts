/** validateFluidDomain's maximum admitted solver.maxSteps. simulateFluidDomain checks against the domain's own budget and replays from zero each call, so this ceiling requires prior admission and does not bound repeated seeks' total work. */
export const FLUID_MAX_STEPS: 100_000 = 100_000 as const;
