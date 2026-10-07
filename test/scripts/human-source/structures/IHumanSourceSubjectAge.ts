/**
 * How one subject's body age was set: the macroAge weight and the path that
 * produced it, recorded per person in the conversion manifest.
 *
 * @author Samchon
 */
export interface IHumanSourceSubjectAge {
  /** The body macroAge weight, or null when the subject is refused. */
  macroAge: number | null;

  /** Which rule produced it. */
  path:
    | "subject-facts age through the body age curve"
    | "face value inverse (unique)"
    | "face value omitted (zero by document convention)"
    | "refused";

  /** The facts or face value it was read from, and why a refusal happened. */
  note: string;
}
