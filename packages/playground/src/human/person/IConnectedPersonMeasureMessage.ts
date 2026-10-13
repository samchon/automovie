import type { IConnectedPersonBodySolveMessage } from "./IConnectedPersonBodySolveMessage";
import type { IConnectedPersonFaceReadMessage } from "./IConnectedPersonFaceReadMessage";
import type { IConnectedPersonFaceSolveMessage } from "./IConnectedPersonFaceSolveMessage";
import type { IConnectedPersonHeadReadMessage } from "./IConnectedPersonHeadReadMessage";
import type { IConnectedPersonHeadSolveMessage } from "./IConnectedPersonHeadSolveMessage";
import type { IConnectedPersonReadMessage } from "./IConnectedPersonReadMessage";
import type { IConnectedPersonSimpleExpandMessage } from "./IConnectedPersonSimpleExpandMessage";
import type { IConnectedPersonSimpleProjectMessage } from "./IConnectedPersonSimpleProjectMessage";
import type { IConnectedPersonSolveMessage } from "./IConnectedPersonSolveMessage";

/**
 * One request the person editor posts to its measurement worker, discriminated by `kind`. The nine alternatives retain each operation's own context and units, including paired body shape inverses, complete-person rest measurements, head/face solves and simple projection/expansion. The runtime returns a request-correlated refusal for an unsupported kind at its transport boundary.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union retains operation-specific document, target and measurement payloads rather than one unchecked generic solver shape.
 * @evidence contracts/common.md#clear-and-simple-design Message alternatives describe the numerical transport while runtime dispatch and complete-person editor admission remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shape-only body inverses are not confused with complete-person measurements and an unsupported transport kind remains a named refusal.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies all operation families, their preserved units/context and correlated refusal behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union implements no dispatch, geometry evaluation or inverse algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Message kinds and ids define request identity without numerical cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Requests own no transport queue, compiled generation or retained result by their type declaration.
 *
 * @author Samchon
 */
export type IConnectedPersonMeasureMessage =
  | IConnectedPersonBodySolveMessage
  | IConnectedPersonReadMessage
  | IConnectedPersonSolveMessage
  | IConnectedPersonHeadReadMessage
  | IConnectedPersonHeadSolveMessage
  | IConnectedPersonFaceReadMessage
  | IConnectedPersonFaceSolveMessage
  | IConnectedPersonSimpleExpandMessage
  | IConnectedPersonSimpleProjectMessage;
