import {
  createHumanPersonGenerationBuilder,
  joinHumanPersonGeneration,
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonDocument,
  type IAutoMovieHumanPersonGenerationBuild,
  type IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

import { createHumanSourceAdmissionDocument } from "./createHumanSourceAdmissionDocument.ts";
import type { IHumanSourceAdmissionLog } from "./structures/IHumanSourceAdmissionLog.ts";

/**
 * Admit the published person files: join the head and body views, construct
 * the one-skin generation builder, and build the neutral and two body-macro
 * linked persons through it.
 */
export function admitHumanSourcePersonViews(log: IHumanSourceAdmissionLog, head: IAutoMovieHumanPersonHeadView, body: IAutoMovieHumanPersonBodyView): void {
  let build: ((document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild) | null = null;
  log.attempt("person views join and generation builder construction", () => {
    build = createHumanPersonGenerationBuilder({ generation: joinHumanPersonGeneration(head, body) });
    return `generation ${head.id}`;
  });
  for (const [name, shape] of [["neutral", {}], ["macroWeight 0.5", { macroWeight: 0.5 }], ["macroHeight 1", { macroHeight: 1 }]] as const)
    log.attempt(`person views ${name}`, () => {
      if (build === null) throw new Error("generation builder unavailable");
      const document = createHumanSourceAdmissionDocument({ face: head.face.id, body: body.body.id, bodyShape: { ...shape }, faceShape: {}, population: "linked" });
      const before = JSON.stringify(document);
      return `parts ${build(document).model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
    });
}
