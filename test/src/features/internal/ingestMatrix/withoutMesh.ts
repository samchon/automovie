import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { baseDocument } from "./baseDocument";

/**
 * Remove render meshes and dependent nodes to isolate the static profile requirement.
 */
export const withoutMesh: () => ExternalModelMatrixObject =
  (): ExternalModelMatrixObject => {
    const document: ExternalModelMatrixObject = baseDocument();
    document.meshes = [];
    document.nodes = [];
    document.scenes = [];
    return document;
  };
