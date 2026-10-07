import { reviewFileName } from "../review/reviewFileName";
import type { IBodyCaptureDocumentEntry } from "./IBodyCaptureDocumentEntry";
import type { IBodyCaptureProps } from "./IBodyCaptureProps";
import type { IBodyCaptureResult } from "./IBodyCaptureResult";

/**
 * Draw the requested frames of a body through the resident viewer and write
 * the PNGs.
 *
 * Every distinct state is composed into a body document (`id` and `name` the
 * state, `basis` the body basis the states are built on, then the state's shape,
 * joint rows and shoulder goals) and offered to the viewer once under
 * `label`, so a state is built once for all the views and passes that share it.
 * A frame is one render of `file:<label>/<state>` at a named view and pass with
 * its parts isolated. A state the numerical builder refuses is refused by the
 * viewer with a reason: with `onRefused: "throw"` that stops the run with the
 * text, with `"record"` the state's remaining frames are skipped and the
 * refusal is returned with the state name, so an extreme the validator still
 * refuses is visible in the record instead of vanishing. A part name no
 * displayed part carries stops the run either way, because isolating nothing
 * would draw and record a blank frame. A candidate basis, when given, is the
 * one the documents are built against (it must keep the basis identity they
 * name).
 *
 * Frame files are named from the state, the view and the pass, with the
 * isolated parts in the state so an isolated and an assembled frame of the same
 * state never share a file. Frames are returned in the order drawn with their
 * bytes, response revision and renderer; the caller writes them
 * (`writeBodyFrames`) and builds the record. A source or device change during
 * the run refuses the combined observation instead of mixing its authority.
 */
export async function captureBodyFrames(
  input: IBodyCaptureProps,
): Promise<IBodyCaptureResult> {
  const { viewer } = input;
  const documents = new Map<string, IBodyCaptureDocumentEntry>();
  const names = new Set<string>();
  for (const frame of input.frames) {
    const key = JSON.stringify([frame.state, frame.document]);
    if (documents.has(key)) continue;
    let id = frame.state;
    for (let copy = 2; names.has(id); ++copy) id = `${frame.state}~${copy}`;
    names.add(id);
    documents.set(key, {
      id,
      document: {
        id,
        name: id,
        basis: input.basisId,
        ...frame.document,
      },
    });
  }
  await viewer.drop({
    label: input.label,
    documents: [...documents.values()].map((entry) => entry.document),
    candidateBasis: input.candidateBasis,
  });
  const drawn: IBodyCaptureResult["drawn"] = [];
  const refused: IBodyCaptureResult["refused"] = [];
  const skipped = new Set<string>();
  for (const frame of input.frames) {
    const key = JSON.stringify([frame.state, frame.document]);
    if (skipped.has(key)) continue;
    const rendered = await viewer.render({
      doc: `file:${input.label}/${documents.get(key)!.id}`,
      view: frame.view,
      pass: frame.pass,
      ...(frame.isolate === null ? {} : { parts: frame.isolate.join(",") }),
      size: "900",
    });
    if (!rendered.ok) {
      if (rendered.error.startsWith("Unknown mesh"))
        throw new Error(
          `No displayed part is named ${rendered.error.slice("Unknown mesh: ".length)}; isolating it would draw a blank frame.`,
        );
      if (input.onRefused === "throw")
        throw new Error(
          `The viewer refused state "${frame.state}": ${rendered.error}`,
        );
      refused.push({ state: frame.state, reason: rendered.error });
      skipped.add(key);
      continue;
    }
    const first = drawn[0];
    if (
      first !== undefined &&
      (rendered.revision !== first.revision ||
        rendered.renderer !== first.renderer)
    )
      throw new Error(
        "The viewer source revision or renderer changed during the capture run; its frames cannot form one observation",
      );
    const state =
      frame.isolate === null
        ? frame.state
        : `${frame.state}-only-${frame.isolate.join("-")}`;
    const file = reviewFileName({ state, view: frame.view, pass: frame.pass });
    drawn.push({
      state,
      view: frame.view,
      pass: frame.pass,
      file,
      bytes: rendered.bytes,
      revision: rendered.revision,
      renderer: rendered.renderer,
      isolate: frame.isolate,
    });
  }
  return { drawn, refused };
}
