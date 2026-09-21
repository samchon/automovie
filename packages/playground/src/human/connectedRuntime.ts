import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceGroom,
  type IAutoMovieHumanFaceSkin,
  appendHumanFaceGroom,
  applyHumanFaceSkin,
  createHumanFaceBasisBuilder,
  exportHumanFace,
  parseHumanFaceBasisDocument,
} from "@automovie/human";

/**
 * Prepare reusable numerical resources for one connected face worker.
 * Both preview and export evaluate the same compact document. Preview returns
 * the resident model directly; only an explicit export constructs a GLB.
 * Resource lookup keys and exact basis binding are checked before attachment.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Preserves one admitted document's geometry across preview and export.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates numerical evaluation from file encoding in a resident worker.
 */
export function createConnectedFaceRuntime(props: {
  basis: IAutoMovieHumanFaceBasis;
  grooms: Record<string, IAutoMovieHumanFaceGroom>;
  skins: Record<string, IAutoMovieHumanFaceSkin>;
}) {
  const evaluate = createHumanFaceBasisBuilder(props.basis);
  const grooms = new Map(Object.entries(props.grooms));
  const skins = new Map(Object.entries(props.skins));
  return async (request: {
    document: string;
    operation: "preview" | "export";
    measure?: boolean;
  }) => {
    const document = parseHumanFaceBasisDocument(request.document);
    let model = evaluate(document);
    if (document.skin !== undefined && document.skin !== null) {
      const skin = skins.get(document.skin);
      if (skin === undefined || skin.basis !== document.basis)
        throw new Error(
          "This basis does not carry the named appearance: " + document.skin,
        );
      model = applyHumanFaceSkin({ model, skin });
    }
    if (document.hair !== undefined && document.hair !== null) {
      const groom = grooms.get(document.hair);
      if (groom === undefined || groom.basis !== document.basis)
        throw new Error(
          "This basis does not carry the named groom: " + document.hair,
        );
      model = appendHumanFaceGroom({ model, groom });
    }
    if (request.operation === "export") {
      const { glb } = await exportHumanFace(model);
      return { operation: "export" as const, glb };
    }
    return {
      operation: "preview" as const,
      model,
      crossings:
        request.measure === true ? measureAutoMovieModelCrossings(model) : null,
    };
  };
}

/** Numerical requests admitted by the connected runtime. */
export type ConnectedFaceRequest = Parameters<
  ReturnType<typeof createConnectedFaceRuntime>
>[0];

/** File bytes and resident previews are distinct reply alternatives. */
export type ConnectedFaceResult = Awaited<
  ReturnType<ReturnType<typeof createConnectedFaceRuntime>>
>;
