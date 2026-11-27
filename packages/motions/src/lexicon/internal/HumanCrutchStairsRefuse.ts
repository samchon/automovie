import { HumanRefusal } from "../../law/HumanRefusal";

/** Refuse a crutch setting with its reason. */
export function HumanCrutchStairsRefuse(
  axis: string,
  value: unknown,
  reason: string,
): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix: "stage both crutches on the floor level with the toes, each with a grip and a tip",
  });
}
