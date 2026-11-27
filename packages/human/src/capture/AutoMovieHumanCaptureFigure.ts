import type { IAutoMovieHumanF1, IAutoMovieMark } from "@automovie/interface";
import * as THREE from "three";

import { HUMAN_CAPTURE_PEOPLE } from "./HUMAN_CAPTURE_PEOPLE";
import { AutoMovieHumanCaptureCurves } from "./AutoMovieHumanCaptureCurves";
import { AutoMovieHumanCaptureProbes } from "./AutoMovieHumanCaptureProbes";
import { AutoMovieHumanCaptureSubject } from "./AutoMovieHumanCaptureSubject";

/*
 * Builds the inspection figure and marks for one capture subject.
 */
export namespace AutoMovieHumanCaptureFigure {
  /*
   * The selected Human subject to build.
   */
  export interface IInput {
    /*
     * The person's name, such as `f1`.
     */
    name: string;
  }

  /*
   * The generated figure and its inspection marks.
   */
  export interface IOutput {
    /*
     * The person's meshes, grouped under the subject name.
     */
    object: THREE.Group;

    /*
     * Construction and empty-probe marks attached to the person.
     */
    marks: IAutoMovieMark[];

    /*
     * Releases the geometry and material created for the figure.
     */
    dispose: () => void;
  }

  /*
   * Build one capture subject's figure: the person's generated surface as
   * three.js meshes named by the pieces the generator emits, its construction as
   * marks named by its families, and its empty probes as marks under
   * `<person>/probe/`, each measured against the skin and the families' convex
   * hull (`AutoMovieHumanCaptureProbes.mark`).
   *
   * The object is a group named after the person; each generated piece is one
   * mesh beneath it named by its piece: `body` for the skin every sewn family
   * shares, and a loose family's name or `<family>.mirror` for its reflected
   * twin. So the sewn skin's path is `<person>/body`, and a family sewn into it
   * has no surface of its own to select; its curves name it. The group turns the
   * figure's frame (forward +X, up +Y, left +Z) a quarter turn about the vertical
   * so the figure faces +Z, the side the `front` view stands on. Pieces are
   * shaded in one light skin tone on both sides, because a loose family is an
   * open tube whose inside shows at its ends. A piece the generator could not
   * build has no mesh.
   *
   * It throws as `AutoMovieHumanCaptureSubject.resolve` does for an unknown person or pose.
   * Parameter input: The name of the subject to draw.
   * Returns: The figure's object, its marks, and the call that releases its
   * geometry and material.
   */
  export function build(input: IInput): IOutput {
    const { name } = input;
    const person: string = AutoMovieHumanCaptureSubject.resolve({ name: name }).person;
    const offered: (typeof HUMAN_CAPTURE_PEOPLE)[string] =
      HUMAN_CAPTURE_PEOPLE[person]!;
    const object: THREE.Group = new THREE.Group();
    object.name = person;
    object.rotation.y = -Math.PI / 2;
    const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9b8a3,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const geometries: THREE.BufferGeometry[] = [];
    const pieces: IAutoMovieHumanF1.IPiece[] = offered.create();
    for (const piece of pieces) {
      if (piece.indices.length === 0) continue;
      const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(piece.positions, 3),
      );
      geometry.setIndex(piece.indices);
      geometry.computeVertexNormals();
      geometries.push(geometry);
      const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
      mesh.name = piece.name;
      object.add(mesh);
    }
    object.updateMatrixWorld(true);
    return {
      object,
      marks: [
        ...AutoMovieHumanCaptureCurves.mark({ person: person, members: offered.members }),
        ...AutoMovieHumanCaptureProbes.mark({
          person: person,
          probes: offered.probes(),
          members: offered.members,
          pieces: pieces,
        }),
      ],
      dispose: (): void => {
        for (const geometry of geometries) geometry.dispose();
        material.dispose();
      },
    };
  }
}
