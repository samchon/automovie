import { createHumanBodyBasisBuilder } from "@automovie/human/body/basis/createHumanBodyBasisBuilder";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import type { IAutoMovieHumanPersonDocument } from "@automovie/human/human/structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "@automovie/human/human/structures/IAutoMovieHumanPersonGenerationBuild";

import { authorHumanSourceHeadViewRows } from "./authorHumanSourceHeadViewRows.ts";
import { createHumanSourceAdmissionDocument } from "./createHumanSourceAdmissionDocument.ts";
import { splitHumanSourcePersonViews } from "./splitHumanSourcePersonViews.ts";
import type { IHumanSourceAdmissionLog } from "./structures/IHumanSourceAdmissionLog.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

/**
 * Admit the P1 pair: the body alone at neutral, then the P1 pair split into
 * person views against its generation (`splitHumanSourcePersonViews`) and
 * joined into the one-skin generation builder, the neutral person, one
 * person with a body and a face channel set, and one person asking for an
 * endpoint the body lists as unavailable, which the builder must refuse by
 * name.
 */
export function admitHumanSourceP1(
  log: IHumanSourceAdmissionLog,
  face: IAutoMovieHumanFaceBasis,
  body: IAutoMovieHumanBodyBasis,
  generation: IHumanSourceGeneration,
): void {
  log.attempt("P1 body neutral", () => {
    const document = { id: "body", name: "body", basis: body.id, shape: {} };
    const before = JSON.stringify(document);
    const build = createHumanBodyBasisBuilder(body)(document);
    return `parts ${build.model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
  });
  let buildPerson:
    | ((
        document: IAutoMovieHumanPersonDocument,
      ) => IAutoMovieHumanPersonGenerationBuild)
    | null = null;
  log.attempt("P1 person builder construction", () => {
    const views = splitHumanSourcePersonViews({
      generation,
      p1: { face, body },
    });
    // A person is only ever built from authored views; the P1 files stay the pair before that authoring.
    authorHumanSourceHeadViewRows(views.head.face);
    buildPerson = createHumanPersonGenerationBuilder({
      generation: joinHumanPersonGeneration(views.head, views.body),
    });
    return "constructed";
  });
  const person = (
    name: string,
    bodyShape: Record<string, number>,
    faceShape: Record<string, number>,
  ): void =>
    log.attempt(name, () => {
      if (buildPerson === null) throw new Error("person builder unavailable");
      const document = createHumanSourceAdmissionDocument({
        face: face.id,
        body: body.id,
        bodyShape,
        faceShape,
        population: "linked",
      });
      const before = JSON.stringify(document);
      const build = buildPerson(document);
      return `parts ${build.model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
    });
  person("P1 person neutral", {}, {});
  person(
    "P1 person macroWeight 0.5 + chinHeight 0.5",
    { macroWeight: 0.5 },
    { chinHeight: 0.5 },
  );
  const unavailable = (body.unavailableTargets ?? []).find((t) =>
    body.channels.some((c) => c.positive === t || c.negative === t),
  );
  const owner = body.channels.find(
    (c) => c.positive === unavailable || c.negative === unavailable,
  );
  if (owner !== undefined)
    person(
      `P1 person requesting unavailable ${unavailable} through ${owner.id}`,
      {
        [owner.id]:
          owner.positive === unavailable ? owner.maximum : owner.minimum,
      },
      {},
    );
}
