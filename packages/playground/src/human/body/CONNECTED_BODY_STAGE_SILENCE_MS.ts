/**
 * How long a resident numerical worker may stay silent during one stage
 * before its transport treats it as lost, in milliseconds.
 *
 * A worker evaluates synchronously, so it cannot answer a liveness probe
 * while it works; the transport can only bound the silence of one stage and
 * the worker reports each stage it finishes (`IConnectedBodyProgress`). The
 * bound is a transport convention carried over from the editor's earlier
 * per-request deadline, not a measured evaluation time: a single stage that
 * runs longer on some generation is retired as lost, and the remedy is to
 * report stages inside that evaluation, not to enlarge this number.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Bounds how long a failed worker can leave the editor waiting before the last valid person is confirmed.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Names the one silence bound the transports of a shared worker use.
 * @author Samchon
 */
export const CONNECTED_BODY_STAGE_SILENCE_MS = 60_000;
