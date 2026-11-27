import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieTransform,
} from "@automovie/interface";

/*
 * Admit a rigid environment frame before it can move geometry or a contact.
 * Parameter frame: Translation in metres, unit rotation and unit scale.
 * Parameter path: Source path used in the diagnostic.
 * If the transform has a malformed component or a scale other than one.
 */
export function requireEnvironmentFrame(
  frame: IAutoMovieTransform,
  path: string,
): void {
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  AutoMovieEngineValidation.validateTransformScalars({
    transform: frame,
    path,
    label: "environment frame",
    collector,
  });
  const violation: IAutoMovieConstraintViolation | undefined =
    collector.items[0];
  if (violation !== undefined)
    throw new Error(`${violation.path}: ${violation.expected}`);
  if (frame.scale.x !== 1 || frame.scale.y !== 1 || frame.scale.z !== 1)
    throw new Error(`${path}.scale: environment frames require unit scale`);
}
