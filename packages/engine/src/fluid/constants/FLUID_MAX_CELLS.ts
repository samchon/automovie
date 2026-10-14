/** Per-domain cell-count admission ceiling used by validateFluidDomain. Bounds lattice-sized allocations only after caller-run admission; it is not a measured heap-byte or total retained-frame limit. */
export const FLUID_MAX_CELLS: 65_536 = 65_536 as const;
