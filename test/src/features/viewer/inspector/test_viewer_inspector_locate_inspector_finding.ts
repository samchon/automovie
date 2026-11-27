import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  type IAutoMovieInspectorState,

  AutoMovieViewerInspector,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * A finding moves the inspector to its witness second with the drawn owners of
 * its paths labelled.
 *
 * Scenarios:
 *
 * 1. A witness at 2.25 s naming a drawn actor, a cord segment, a formation slot, a
 *    batch instance and a transform field below a dotted bone name labels the
 *    actor, the cord, the formation, the batch mesh and the whole dotted bone,
 *    each once, in finding order.
 * 2. A path with no drawn owner, such as an anonymous mesh key, is left out, and a
 *    finding with no drawn path clears the labels.
 * 3. The reducer accepts the located edit from a playing range: the request names
 *    one explicit second and only the located labels.
 */
export function test_viewer_inspector_locate_inspector_finding(): void {
  const drawn: string[] = [
    "stage",
    "hero",
    "rope",
    "guards",
    "crowd",
    "rig",
    "rig/hand.L",
  ];
  const observation: (
    paths: string[],
  ) => IAutoMovieInspectionDiagnostics.IObservation = (
    paths: string[],
  ): IAutoMovieInspectionDiagnostics.IObservation => ({
    time: { filmSeconds: 2.25, outputFrame: 54 },
    finding: {
      check: "collision",
      key: "k",
      code: "penetration",
      paths,
      category: "error",
      confidence: "confirmed",
      message: "Overlap.",
      witness: {},
    },
  });

  // 1. Owners of part paths.
  TestValidator.equals(
    "each path is labelled by its drawn owner, once",
    AutoMovieViewerInspector.locateFinding({
      observation: observation([
        "hero",
        "rope/segment/4",
        "guards/slot/2",
        "crowd#17",
        "hero",
        "rig/hand.L.children[0].matrixWorld",
      ]),
      paths: drawn,
    }),
    {
      type: "locate",
      seconds: 2.25,
      label: ["hero", "rope", "guards", "crowd", "rig/hand.L"],
    },
  );

  // 2. Unowned paths.
  TestValidator.equals(
    "an unowned path is left out",
    AutoMovieViewerInspector.locateFinding({ observation: observation(['["scene-mesh",2.25,3]', "hero"]), paths: drawn }).label,
    ["hero"],
  );
  TestValidator.equals(
    "no drawn path clears the labels",
    AutoMovieViewerInspector.locateFinding({ observation: observation(["ghost/arm"]), paths: drawn }).label,
    [],
  );

  // 3. Through the reducer.
  const playing: IAutoMovieInspectorState = AutoMovieViewerInspector.createState(
    "?from=0&to=4&rate=24&label=stage",
  );
  const located: IAutoMovieInspectorState = AutoMovieViewerInspector.reduceState(
    playing,
    AutoMovieViewerInspector.locateFinding({ observation: observation(["rope/segment/1"]), paths: drawn }),
  );
  TestValidator.equals(
    "the located request names one second and the located label",
    [located.error, located.request.sampling, located.request.inspection.label],
    [null, { kind: "at", seconds: [2.25] }, ["rope"]],
  );
}
