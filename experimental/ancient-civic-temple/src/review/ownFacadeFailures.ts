import { OwnFacadeRow } from "./OwnFacadeRow";

/** Facades whose addressed side is visible for less than `minimum` of its samples. */
export const ownFacadeFailures = (rows: readonly OwnFacadeRow[], minimum = 0.5): string[] => rows.filter((row) => !row.sides.some((side) => side.addressSide && side.ratio >= minimum)).map((row) => row.id);
