import type { IAutoMovieDiagnostic } from "@automovie/interface";
import { createRequire } from "node:module";
import path from "node:path";
import type { IValidation } from "typia";
import type { ISourceBuildResult } from "./ISourceBuildResult";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";
import type { IProductionSourceBuildProps as ISourceBuildProps } from "./IProductionSourceBuildProps";

/**
 * Execute the selected authored Node registration and admit its synchronous result.
 *
 * The registration object remains the build call's receiver, and the supplied normalized source field is not read by this loader. Object-valued thenables are refused before schema admission; function-valued thenables are not detected by that check, and the supplied validator decides their shape. Rendering a caught cause can itself throw through a message getter or String conversion, and this boundary cannot roll back arbitrary authored side effects.
 *
 * @evidence contracts/common.md#principled-implementation Node require resolves the exact selected file/export, optional shot id/scene/contract is compared before build, object-valued thenables are refused and the supplied schema validates the actual return value.
 * @evidence contracts/common.md#clear-and-simple-design Shot and film source assembly use one execution boundary; Node owns module loading, registration admission owns exact identity and the provided validator owns output shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored code must remain deterministic, but this host does not sandbox Node, ban imports or prove effects deterministic. It executes current file bytes through Node rather than the supplied normalized source snapshot; outer current-input fences refuse observed changes with the usual change-and-return limitation.
 * @evidence contracts/common.md#meaningful-documentation States ordinary Node execution, registration receiver, object-thenable versus validator admission, registration checks, effectful error-rendering escape and determinism/current-input limitations.
 * @evidence contracts/performance.md#efficient-algorithms Total work includes Node dependency loading and arbitrary authored computation, canonical contract encoding and the supplied schema scan. No host timeout or authored-computation bound is imposed; source byte hashing/currentness belongs to the attempt coordinator.
 * @evidence contracts/performance.md#reuse-equivalent-work The attempt evicts project modules before evaluation; Node shares its ordinary module cache during execution. This function caches no build result, and authored effects execute when build is called.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The attempt owns output and diagnostic records while Node module cache retains loaded exports until eviction. Authored code owns any handles/tasks it creates; this boundary cannot clean up arbitrary effects and adds no sandbox or cancellation facility.
 */
export function buildSourceExport<T>(props: ISourceBuildProps<T>): ISourceBuildResult<T> {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  let registrationScene: string | undefined;
  try {
    const require: ReturnType<typeof createRequire> = createRequire(path.join(props.sourceRoot, "package.json"));
    const exports: Record<string, {
      id?: unknown;
      scene?: unknown;
      contract?: unknown;
      build?: (context: unknown) => unknown;
    } | undefined> = require(
      path.resolve(props.sourceRoot, props.path),
    ) as Record<
      string,
      | {
          id?: unknown;
          scene?: unknown;
          contract?: unknown;
          build?: (context: unknown) => unknown;
        }
      | undefined
    >;
    const entry: typeof exports[string] = exports[props.exportName];
    if (typeof entry?.build !== "function")
      return {
        value: null,
        diagnostics: [
          ...diagnostics,
          {
            code: "source-export-missing",
            category: "error",
            phase: "source",
            target: props.target,
            path: props.path,
            message: `Export "${props.exportName}" with a build(context) function was not found. Add that named export to ${props.path}.`,
          },
        ],
      };
    if (props.registration !== undefined) {
      const registration: typeof entry | null = typeof entry.id === "string" ? entry : null;
      const contractMatches: boolean =
        registration !== null &&
        typeof registration.contract === "object" &&
        registration.contract !== null &&
        Buffer.from(canonicalAutoMovieJsonBytes(registration.contract)).equals(
          Buffer.from(canonicalAutoMovieJsonBytes(props.registration.contract)),
        );
      if (
        registration === null ||
        registration.id !== props.registration.id ||
        typeof registration.scene !== "string" ||
        registration.scene.trim().length === 0 ||
        contractMatches === false
      )
        return {
          value: null,
          diagnostics: [
            ...diagnostics,
            {
              code: "source-registration-mismatch",
              category: "error",
              phase: "source",
              target: props.target,
              path: props.path,
              message:
                registration === null
                  ? `Contract id "${props.registration.id}" points to export "${props.exportName}" in ${props.path}, but that export is not a defineShot registration. Export defineShot("${props.registration.id}", { scene, contract, build }) so module path, named export, id, and measurable contract identify one artifact.`
                  : `Contract id "${props.registration.id}" points to export "${props.exportName}" in ${props.path}, but its registration has id ${JSON.stringify(registration.id)}, scene ${JSON.stringify(registration.scene)}, or a contract that differs from the design. Make the defineShot registration id and measurable contract exactly match the selected design contract, and keep scene non-blank.`,
            },
          ],
        };
      registrationScene = registration.scene;
    }
    const value: unknown = entry.build(props.context);
    if (
      value !== null &&
      typeof value === "object" &&
      "then" in value &&
      typeof value.then === "function"
    )
      return {
        value: null,
        diagnostics: [
          ...diagnostics,
          {
            code: "source-export-invalid",
            category: "error",
            phase: "source",
            target: props.target,
            path: props.path,
            message: `Export "${props.exportName}" returned a Promise. Return a synchronous deterministic ${props.label} from ${props.path}.`,
          },
        ],
      };
    const validation: IValidation<T> = props.validate(value);
    if (validation.success === false)
      return {
        value: null,
        diagnostics: [
          ...diagnostics,
          ...validation.errors.map(
            (error: IValidation.IError): IAutoMovieDiagnostic => ({
              code: "source-export-invalid",
              category: "error",
              phase: "source",
              target: props.target,
              path: props.path,
              message: `${error.path} expects ${error.expected}. Fix the returned ${props.label} in ${props.path}.`,
            }),
          ),
        ],
      };
    return { value: validation.data, diagnostics, registrationScene };
  } catch (error) {
    const message: string =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return {
      value: null,
      diagnostics: [
        ...diagnostics,
        {
          code: "source-execution-failed",
          category: "error",
          phase: "source",
          target: props.target,
          path: props.path,
          message: `Source export "${props.exportName}" in ${props.path} failed while building ${props.label}: ${message}. No generated artifact was published. Correct the operation or precondition named by this fact, then rerun the same compile scope.`,
        },
      ],
    };
  }
}
