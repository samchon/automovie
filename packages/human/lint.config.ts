import { type ITtscEvidenceGraphConfig, evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * Every authored type and function in the human package answers the contracts
 * checklists at `.agents/skills/contracts`; the package cites no requirement
 * or specification page. Each population derives from the source-tree glob, so
 * a new source file enters it by default. Barrels only re-export declarations
 * that already answer at their definition.
 *
 * - The common chapters apply to every declaration.
 * - The modeling chapters apply to declarations that define, build or measure
 *   a form, including document and editor declarations that own channels,
 *   conversions or admission. Exports and the three named override containers
 *   define no form and stay outside this population. Helpers answer only
 *   their applicable chapters through individual chapter exclusions.
 * - The anatomy chapters apply to anatomical value, control, range and
 *   conversion owners. Export and the individually named representation
 *   helpers below carry no physiological value or admission responsibility.
 *   New files in the anatomical domain enter the residual; only the declared
 *   export domain and reviewed existing helpers are subtracted. A helper
 *   directory name alone excludes nothing.
 *
 * The rules currently warn while the checklists are being answered component
 * by component.
 */
const declarations = ["src/**/*.ts", "!src/**/index.ts"];
const formDeclarations = [
  ...declarations,
  "!src/**/export/**",
  // Existing override aliases transport scalar/array shape; new root owners join.
  "!src/face/AutoMovieHumanFaceEditableEyeOverride.ts",
  "!src/face/AutoMovieHumanFaceEditableOverride.ts",
  "!src/face/AutoMovieHumanFaceOverride.ts",
];
const anatomicalDeclarations = [
  ...declarations,
  "!src/**/export/**",
  // Existing index/UV and displacement-result carriers do not establish anatomy.
  "!src/common/structures/IHumanMaterialRegion.ts",
  "!src/common/structures/IAutoMovieHumanEndpointScale.ts",
  // Text resource admission and IEC sRGB conversion own no physiological range.
  "!src/common/document/assertTextSize.ts",
  "!src/common/colour/srgbByteToLinear.ts",
  "!src/common/colour/linearToSrgbByte.ts",
  // Correspondence and gathering preserve geometry supplied by the basis owner.
  "!src/common/basis/humanBasisRegionCorners.ts",
  "!src/common/basis/createHumanBasisRegion.ts",
  // Numerical mesh representation preserves faces, orientation and precision.
  "!src/common/mesh/triangleAreaVector.ts",
  "!src/common/mesh/assertDirection.ts",
  "!src/common/mesh/areaWeightedNormals.ts",
  "!src/common/mesh/placeMeshPreservingFaces.ts",
  "!src/common/mesh/float32MeshBuffers.ts",
  // PNG format carriers/codecs do not decide the tissue colour they transport.
  "!src/common/mesh/structures/IPngImage.ts",
  "!src/common/mesh/decodePng.ts",
  "!src/common/mesh/encodePng.ts",
  // Coordinates, curves and unit conversion preserve caller-owned quantities.
  "!src/face/mesh/structures/Point.ts",
  "!src/face/mesh/structures/IControlMesh.ts",
  "!src/face/mesh/millimetrePoint.ts",
  "!src/face/mesh/linearInterpolate.ts",
  "!src/face/mesh/catmullRomPoint.ts",
  "!src/face/mesh/intersectRayWithHeightField.ts",
  "!src/face/mesh/createMetricMeshPart.ts",
  // Supplied topology and sampling own representation, not anatomical bounds.
  "!src/face/mesh/extractTriangleRegion.ts",
  "!src/face/mesh/orderCutPatchBoundary.ts",
  "!src/face/mesh/selectHostFacesInsideLoop.ts",
  "!src/face/mesh/weldLatticeSeamNormals.ts",
  "!src/face/mesh/triangulateSurfaceLattice.ts",
  "!src/face/mesh/sweepEightSidedTube.ts",
  "!src/face/mesh/subdivideControlMesh.ts",
];

const checklist = (
  name: string,
  files: string[],
  document: "common" | "modeling" | "anatomy",
): ITtscEvidenceGraphConfig["claims"][number] => ({
  name,
  type: "typescript",
  files,
  symbol: ["type", "function"],
  reference: {
    type: "markdown",
    root: "../../.agents/skills",
    files: [`contracts/${document}.md`],
    symbol: "h2",
    checklist: true,
  },
});

const graph: ITtscEvidenceGraphConfig = {
  claims: [
    checklist(
      "human declarations answer the common implementation principles",
      declarations,
      "common",
    ),
    checklist(
      "human form declarations answer the modeling principles",
      formDeclarations,
      "modeling",
    ),
    checklist(
      "human anatomical declarations answer the anatomical principles",
      anatomicalDeclarations,
      "anatomy",
    ),
  ],
};

export default {
  extends: "../../config/lint.config.ts",
  plugins: { evidence },
  rules: {
    // Contract evidence remains visible but does not block this editor work.
    "evidence/documented": [
      "warning",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/graph": ["warning", graph],
    "evidence/singular": "warning",
    "evidence/todo": "warning",
    // Dependencies run face -> common <- body, and `human` composes both.
    // `common` imports neither anatomy, the two anatomies never import each
    // other, and neither imports the composition.
    "boundaries/element-types": [
      "error",
      {
        elements: [
          { type: "common", pattern: "src/common/**" },
          { type: "body", pattern: "src/body/**" },
          { type: "face", pattern: "src/face/**" },
          { type: "human", pattern: "src/human/**" },
        ],
        rules: [
          { from: "common", disallow: ["body", "face", "human"] },
          { from: "body", disallow: ["face", "human"] },
          { from: "face", disallow: ["body", "human"] },
        ],
      },
    ],
  },
} satisfies ITtscLintConfig;
