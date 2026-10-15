import { IValidation } from "typia";

/**
 * Refusal of a Human input document: an identity, traits, pose, expression or appearance that a living body cannot take or that breaks its type.
 *
 * It carries every finding in typia's error shape: `path` names the field in `$input` notation, `expected` states the bound, `value` is the refused value and `description` gives the cause of a bound that depends on other values. The message lists them all, so an authoring agent can correct every field in one round. Throwing it leaves the caller's document unchanged and builds nothing, so a host keeps its last valid person.
 *
 * @author Samchon
 */
export class AutoMovieHumanAdmissionError extends Error {
  /** Every finding, in the order admission found them. Non-empty. */
  public readonly errors: IValidation.IError[];

  /**
   * @param subject Name of the refused document, such as `identity`
   * @param errors Findings, at least one
   */
  public constructor(subject: string, errors: IValidation.IError[]) {
    super(
      [
        `Human ${subject} refused:`,
        ...errors.map(
          (error: IValidation.IError): string =>
            `- ${error.path} = ${JSON.stringify(error.value)}: expected ${error.expected}${
              error.description === undefined ? "" : `; ${error.description}`
            }`,
        ),
      ].join("\n"),
    );
    this.name = "AutoMovieHumanAdmissionError";
    this.errors = errors;
  }
}
