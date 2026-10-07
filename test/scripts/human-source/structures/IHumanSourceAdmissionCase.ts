/**
 * One consumer admission attempt: whether the public builder admitted it, and its result or refusal.
 *
 * @author Samchon
 */
export interface IHumanSourceAdmissionCase {
  name: string;
  admitted: boolean;
  result: string;
  milliseconds: number;
}
