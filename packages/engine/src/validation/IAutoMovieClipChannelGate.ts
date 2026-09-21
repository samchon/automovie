import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * The per-field rule for which channels one clip's tracks may address. A shot
 * field admits exactly the targets its own applier writes, so the gate is a
 * parameter of the field rather than one fixed rule for every clip.
 *
 * Exported because {@link validateClipArtifact} takes one: a parameter type a
 * declaration cannot name is not a contract a caller can meet.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieClipChannelGate` receives the concrete channel member path and appends findings for the shot field that owns that clip.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieClipChannelGate` makes channel-address scope an explicit parameter instead of applying one rule to unrelated clip consumers.
 */
export type IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void;
