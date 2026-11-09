import type { IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";
import { AutoMovieHumanSiteControls } from "./AutoMovieHumanSiteControls";
import type { AutoMovieHumanSiteViewPart as Site } from "./AutoMovieHumanSiteViewPart";

/** Publish a part from its shared original scalar controls; preparation and contact acquisition remain separate. */
export namespace AutoMovieHumanSiteDefinition {
  /** Preserve ordinary source definition while both consumers can explicitly share its preceding mathematical controls. */
  export function of(input: Site.IInput): Site.IDefinition {
    return publish(AutoMovieHumanSiteControls.prepare(input));
  }

  /** Construct the actual original part/view from the same admitted controls, without solving or rebuilding another part. */
  export function publish(
    prepared: AutoMovieHumanSiteControls.IOutput,
  ): Site.IDefinition {
    const controls: AutoMovieHumanSiteControls.IControls | null =
      prepared.controls;
    if (controls === null)
      return { part: null, view: null, diagnostics: prepared.diagnostics };
    const part: IAutoMovieViewPart = {
      ...controls.scalars,
      name: controls.input.name,
      axis: controls.axis,
      order: controls.input.order,
      samples: controls.input.samples,
    };
    return {
      part,
      view: AutoMovieHumanConstructionView.of(part, controls.input.axis),
      diagnostics: prepared.diagnostics,
    };
  }

  /** Preserve the original signed scalar declaration and qualified normalized jets at its actual parameter. */
  export function outline(
    input: Pick<
      Site.IInput,
      "sites" | "pole" | "poleJets" | "ranges" | "parameter"
    >,
    quarter: 0 | 1 | 2 | 3,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieHumanSiteControls.outline(input, quarter);
  }
}
