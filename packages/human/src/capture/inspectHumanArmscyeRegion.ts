import type {
  IAutoMovieConstructionNode,
  IAutoMovieHumanParameters,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanArmscyeOpening } from "../generation/arm/AutoMovieHumanArmscyeOpening";
import { inspectHumanArmscyeAssembly } from "./inspectHumanArmscyeAssembly";

/** Read both stock production ports with only their actual original sources. */
export function inspectHumanArmscyeRegion(
  parameters: IAutoMovieHumanParameters,
): ReturnType<typeof inspectHumanArmscyeAssembly> {
  const context = AutoMovieHumanBodyLaw.prepareSources(parameters);
  const common = context.common();
  const boundary = context.neckBoundary(common);
  const scoped: typeof context = {
    ...context,
    common: () => common,
    neckBoundary: () => boundary,
  };
  const input = AutoMovieHumanBodyLaw.bodyInput(scoped);
  const trunk = AutoMovieHumanBodyLaw.trunkSource(scoped, input);
  const torso: IAutoMovieViewPart | null | undefined = trunk.sources
    .filter(({ name }): boolean => name === trunk.trunk?.name)
    .at(-1)?.result.part;
  const datum = input.trunk.views.shoulder;
  if (torso == null || datum === undefined)
    throw new Error(
      `The production torso is missing: ${JSON.stringify(trunk.diagnostics)}`,
    );
  const opening = AutoMovieHumanArmscyeOpening.production(torso, datum);
  const limbs = context.limbSources(context.limbRest(boundary));
  const sourceParts: Map<string, IAutoMovieViewPart> = new Map([
    [torso.name, torso],
  ]);
  let root: IAutoMovieConstructionNode = {
    type: "source",
    name: torso.name,
    source: torso.name,
  };
  for (const side of ["left", "right"] as const) {
    const original = limbs.arm(side).definition();
    if (original.part === null)
      throw new Error(
        `The actual ${side} arm is missing: ${JSON.stringify(original.diagnostics)}`,
      );
    const port = opening(original.part, side);
    sourceParts.set(original.part.name, original.part);
    root = { ...port, host: root };
  }
  return inspectHumanArmscyeAssembly({
    root,
    limits: { gap: input.gap },
    sourceParts,
    diagnostics: trunk.diagnostics,
  });
}
