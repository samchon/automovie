import { ViolationCollector } from "../../validation/ViolationCollector";

/**
 * One color component in `[0, 1]`, reported in
 * {@link ViolationCollector.range}'s own words.
 *
 * The collector's helper takes a `number`, and a component read off an untyped
 * payload is `unknown`. Casting it to `number` to satisfy that signature would
 * assert exactly the thing the check exists to doubt, so the comparison narrows
 * with `typeof` instead and the message is kept identical to the collector's,
 * so the two rungs read the same to an author.
 */
export const validateStageUnitColorComponent = (
  value: unknown,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  )
    return;
  out.push(
    "range",
    path,
    `${label} must be a finite number within [0, 1], but was ${String(value)}`,
    value,
  );
};
