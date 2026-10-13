/**
 * Where the human compile runs and writes.
 *
 * @evidence contracts/common.md#principled-implementation The compile request names the actual viewer entry directory, Human package and output directory.
 * @evidence contracts/common.md#clear-and-simple-design Explicit paths leave process execution and compiler lifetime with the compile owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The path record introduces no source rewriting, alternative compiler or runtime patch.
 * @evidence contracts/common.md#meaningful-documentation Documents where the existing compile entry runs and where its output is written.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The compile request names the actual viewer entry directory, Human package and output directory.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Explicit paths leave process execution and compiler lifetime with the compile owner.
 * @author Samchon
 */
export interface IRunHumanViewerCompileProps {
  /**
   * The viewer script directory holding `compile-human.mts`.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The viewer script directory holding `compile-human.mts`. The compile request names the actual viewer entry directory, Human package and output directory.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The viewer script directory holding `compile-human.mts`. Explicit paths leave process execution and compiler lifetime with the compile owner.
   */
  directory: string;

  /**
   * The human package directory to compile.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The human package directory to compile. The compile request names the actual viewer entry directory, Human package and output directory.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The human package directory to compile. Explicit paths leave process execution and compiler lifetime with the compile owner.
   */
  human: string;

  /**
   * Directory for the compile output file.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Directory for the compile output file. The compile request names the actual viewer entry directory, Human package and output directory.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Directory for the compile output file. Explicit paths leave process execution and compiler lifetime with the compile owner.
   */
  outputDirectory: string;
}
