import type { IAutoMovieViewPart } from "@automovie/engine";

import type { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import type { AutoMovieHumanF1 as Figure } from "./AutoMovieHumanF1";
import { AutoMovieHumanF1NativeBuild as Build } from "./AutoMovieHumanF1NativeBuild";
import { AutoMovieHumanF1NativeCalibration as Calibration } from "./AutoMovieHumanF1NativeCalibration";
import type { AutoMovieHumanF1NativeFieldTypes as Types } from "./AutoMovieHumanF1NativeFieldTypes";
import type { AutoMovieHumanF1NativeRootLaw as Root } from "./AutoMovieHumanF1NativeRootLaw";

/** Public qualified F1 field/calibration/native-source entries, sharing one original invocation. */
export namespace AutoMovieHumanF1NativeLaw {
  /** Canonical ISize field and prepared-source contract owned by NativeFieldTypes. */
  export type ISize = Types.ISize;
  /** Canonical IFields field and prepared-source contract owned by NativeFieldTypes. */
  export type IFields = Types.IFields;
  /** Canonical ITapeFields field and prepared-source contract owned by NativeFieldTypes. */
  export type ITapeFields = Types.ITapeFields;
  /** Canonical IPrepared field and prepared-source contract owned by NativeFieldTypes. */
  export type IPrepared = Types.IPrepared;

  /**
   * F1's qualified input calibration from the accepted generating controls.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Current complete conic calipers are read at declared material proxy sites; supplied synthetic support separation is read from the resolved femur/pelvis frames, without a clinical regression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One calibration supplies the same field records used by the forward law and its diagnostic perturbations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts These are P calibration fields and are explicitly not a reference observation, survey target or verified HJC measurement.
   * @evidence contracts/development/common.md#meaningful-documentation Names the proxy scopes and held skeletal inputs of IFields.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded named-site reads prepare the actual current scalar prior and control calipers; no loft or skin is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers retain one calibration with their original-control invocation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns only the bounded scalar field records returned to its caller.
   */
  export function reference(
    figure: Figure.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
  ): IFields {
    return Calibration.reference(figure, originals);
  }

  /**
   * Resolve the actual F1 calibration once for this original assembly/source-bank lifetime.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A single original reader supplies complete and tape-only native builders; candidates never prepare the fixed original calipers again.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed owner captures originals and calibration, exposing the existing full and narrow source operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No global cache, mesh, partial figure, hidden numerical solve or replacement calibration/source pairing exists.
   * @evidence contracts/development/common.md#meaningful-documentation Names borrowed immutable lifetime and reports actual source-read attempts and milliseconds separately from candidate costs.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed21 caliper reads and original projection Point0/axis2 attempts are prepared once and reported separately; candidate work remains in the requested builder scope.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Complete assembly and every solver candidate reuse the same prepared original calibration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller-owned closures retain only one bounded original bank/calibration and are released together.
   */
  export function prepare(
    original: Figure.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
  ): IPrepared {
    const began: number = performance.now();
    let nativeSourceReadAttempts: number = 0;
    const { fields, projectionOwner }: Calibration.IReference = Calibration.readReference(
      original,
      originals,
      (): void => {
        nativeSourceReadAttempts++;
      },
    );
    const rootCalibrations: Map<string, Root.ICalibration> = new Map();
    return {
      fields,
      calibration: {
        nativeSourceReadAttempts,
        originalProjection: projectionOwner.calibration,
        milliseconds: performance.now() - began,
      },
      apply: (next: IFields, bone: Figure.IAssembly): Figure.IAssembly => {
        const result: Build.Result = Build.create(
          { scope: "all", fields: next },
          original,
          bone,
          originals,
          fields,
          rootCalibrations,
          projectionOwner,
        );
        if (result.scope !== "all")
          throw new Error("complete native builder returned another scope");
        return result.assembly;
      },
      tapeFamilies: (
        next: ITapeFields,
      ): { trunk: H.IFamily; breast: H.IFamily } => {
        const result: Build.Result = Build.create(
          { scope: "tapes", fields: next },
          original,
          original,
          originals,
          fields,
          rootCalibrations,
          projectionOwner,
        );
        if (result.scope !== "tapes")
          throw new Error("tape native builder returned another scope");
        return { trunk: result.trunk, breast: result.breast };
      },
    };
  }

  /**
   * Generate all active native sources and coupled root controls from one resolved anatomy invocation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Directional tissue ratios generate complete native controls; independent skin datums determine proximal courses while bone-placed definitions own distal courses. Normalized F1 parent-chart footprints, source rails and root calipers share these fields.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One invocation resolves wall/limb profiles, material addresses, original native factories, roots and dependent points; constructionFrom subsequently consumes it unchanged.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No child loft or mesh generates a parent footprint, no source map is replaced after construction, and bands/margins/nets are not tuned. Given calipers drive the wall; girths remain measured checks.
   * @evidence contracts/development/common.md#meaningful-documentation IFields declares qualifications, independent skeleton/tissue inputs, fixed bilateral frame and fixed accepted lengths/rotations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded site/profile construction precedes one native-family pass; the caller supplies one original control bank shared by all generated sources.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One calibration, original bank and skin-root definition serve all sources, reflection, ports, caps, features and downstream consumer calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned families/readers borrow bounded original controls and call-owned maps for assembly lifetime; no module cache or process is created.
   */
  export function apply(
    fields: IFields,
    original: Figure.IAssembly,
    bone: Figure.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
  ): Figure.IAssembly {
    return prepare(original, originals).apply(fields, bone);
  }

  /**
   * Generate only the actual trunk/breast definitions needed by the shared tape solve.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same closed builder generates both families for full assembly and tape inversion. Its tape arm returns before other root, hand, head-appendage or digit construction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A closed narrow request returns two actual owned families; no full assembly, late source replacement or hidden solve exists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not build other candidate families or lofts. Authored immutable calibration remains separate from candidate construction; absent required source controls are refused.
   * @evidence contracts/development/common.md#meaningful-documentation Fixed accepted skeleton planes, mm fields and the bare tape consumer's relief exclusion remain explicit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two family-control/feature passes and their shared source targets replace the former eager complete-figure preparation; native evaluation and sampling remain downstream costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller supplies one original bank shared by all candidates, and full generation consumes these same original definitions rather than a second solver law.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned two families retain invocation-owned readers and borrowed original controls only.
   */
  export function tapeFamilies(
    fields: ITapeFields,
    original: Figure.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
  ): { trunk: H.IFamily; breast: H.IFamily } {
    return prepare(original, originals).tapeFamilies(fields);
  }
}
