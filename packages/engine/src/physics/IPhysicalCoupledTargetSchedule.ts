import type { IPhysicalCoupledTargetGroup } from "./IPhysicalCoupledTargetGroup";

/** Sparse schedule of coupled groups in exact authored interval order. */
export type IPhysicalCoupledTargetSchedule = ReadonlyMap<
  number,
  readonly IPhysicalCoupledTargetGroup[]
>;
