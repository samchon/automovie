/**
 * One parsed observation selection. A null id selects every unit of the
 * requested kind; whole has only its single whole-body unit.
 * @author Samchon
 */
export interface IBodyObservationRequest {
  /** Run name used under the selected storage's `body-review/observe-<name>/`. */
  name: string;

  /** Owner population to derive from the displayed parts or published rig. */
  unit: "part" | "joint" | "whole";

  /** Exact part or joint id, or null for all units; whole requires null. */
  id: string | null;
}
