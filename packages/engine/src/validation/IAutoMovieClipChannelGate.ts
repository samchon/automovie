import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * The per-field rule for which channels one clip's tracks may address. A shot
 * field admits exactly the targets its own applier writes, so the gate is a
 * parameter of the field rather than one fixed rule for every clip.
 *
 * Exported because {@link validateClipArtifact} takes one: a parameter type a
 * declaration cannot name is not a contract a caller can meet.
 */
export type IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void;
