/**
 * Keep one admitted basis evaluator in a worker. A preview packs transferable
 * geometry and measurements; export runs only on an explicit request. The last
 * evaluated document may be reused for export, while a different committed
 * document is evaluated independently of an in-flight draft.
 */
import {
  type IAutoMovieModelCrossing,
  measureAutoMovieModelCrossings,
} from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  exportHumanBody,
  parseHumanBodyBasisDocument,
  segmentHumanBodyModel,
  stepHumanBodyArmsDown,
} from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";

import { packConnectedBodyModel } from "./connectedBodyGeometry";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "./connectedBodyProtocol";

/** Compile the basis once and evaluate all later body requests against it.
 *
 * A contact reading takes a couple of seconds and the worker runs one thing
 * at a time, so a preview asked for while it ran used to wait behind it. The
 * reading is therefore taken one segment and one segment pair at a time
 * (the same entries in the same order as one `measureAutoMovieModelCrossings`
 * call), handing the thread back every `sliceMs`; a request that arrives in
 * the meantime is evaluated in that gap, and the reading it supersedes is
 * abandoned at its next slice and answers with no reading. An arms-down
 * solve is driven the same way, a build and crossing read at a time
 * (`stepHumanBodyArmsDown`), and refuses as superseded when a later request
 * arrives.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reuses one admitted body prior for preview edits and on-demand contact checks.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Encodes the committed static body only when export is requested.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps the body numerical builder resident across edit transactions.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Evaluates the requested document through the same builder before static GLB export.
 */
export function createConnectedBodyRuntime(
  basis: IAutoMovieHumanBodyBasis,
  options: {
    /** Longest stretch a contact reading holds the thread, milliseconds. */
    sliceMs?: number;
    /** Hand the thread back; a macrotask by default so queued messages run. */
    yieldThread?: () => Promise<unknown>;
  } = {},
) {
  const evaluate = createHumanBodyBasisBuilder(basis);
  const sliceMs = options.sliceMs ?? 25;
  const yieldThread =
    options.yieldThread ??
    ((): Promise<undefined> =>
      new Promise((resolve) => {
        setTimeout(() => resolve(undefined), 0);
      }));
  /** Requests received so far; a reading is superseded by any later one. */
  let received = 0;
  const readContacts = async (
    model: IAutoMovieModel,
    superseded: () => boolean,
  ): Promise<IAutoMovieModelCrossing[] | null> => {
    const parts = model.parts;
    const found: IAutoMovieModelCrossing[] = [];
    let since = Date.now();
    const pause = async (): Promise<boolean> => {
      if (Date.now() - since < sliceMs) return superseded();
      await yieldThread();
      since = Date.now();
      return superseded();
    };
    for (let first = 0; first < parts.length; first++) {
      // one continuous skin partitioned by bone: a segment passing through
      // itself is penetration the pairwise count cannot see
      found.push(
        ...measureAutoMovieModelCrossings(
          { ...model, parts: [parts[first]] },
          { withinParts: true },
        ),
      );
      if (await pause()) return null;
      for (let second = first + 1; second < parts.length; second++) {
        found.push(
          ...measureAutoMovieModelCrossings({
            ...model,
            parts: [parts[first], parts[second]],
          }),
        );
        if (await pause()) return null;
      }
    }
    return found;
  };
  let last:
    | { document: string; built: ReturnType<typeof evaluate> }
    | undefined;
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    const mine = ++received;
    // Canonical parsing is required even when the text matches the cache: a
    // caller cannot bypass document admission by reusing a previous string.
    const document = parseHumanBodyBasisDocument(request.document);
    if (request.operation === "armsDown") {
      // the same slicing as a contact reading: a step at a time, abandoned
      // when a later request supersedes it
      const steps = stepHumanBodyArmsDown(basis, evaluate, document);
      let since = Date.now();
      let next = steps.next();
      while (next.done !== true) {
        if (Date.now() - since >= sliceMs) {
          await yieldThread();
          since = Date.now();
        }
        if (received !== mine)
          throw new Error(
            "The arms-down solve was superseded by a later request.",
          );
        next = steps.next();
      }
      const solved = next.value;
      return {
        operation: "armsDown",
        pose: solved.pose ?? [],
        shoulders: solved.shoulders ?? [],
      };
    }
    const built =
      last?.document === request.document ? last.built : evaluate(document);
    last = { document: request.document, built };
    if (request.operation === "export") {
      const { glb } = await exportHumanBody(built.model);
      return { operation: "export", glb };
    }
    const model = packConnectedBodyModel(built.model);
    return {
      operation: "preview",
      model,
      crossings: request.measure
        ? await readContacts(
            segmentHumanBodyModel(basis, built).model,
            () => received !== mine,
          )
        : null,
      extras: { bones: built.bones, landmarks: built.landmarks },
    };
  };
}
