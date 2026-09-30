import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * What one evaluation of a person document produces.
 *
 * `model` is the whole person as one static resident model: the face's parts
 * and materials under `face:` names, the body's under `body:` names, and the
 * ribbon that joins their skins as the part `seam:skin`, all in the body
 * basis frame (metres, Y up, +Z forward), posed. The face's skin parts and
 * the body's are the same shared skin joined into one manifold at the neck,
 * with one normal at each seam vertex for every part that has it. `body` is
 * the body builder's own evaluation of the (colour-derived) body document,
 * before the collar followed the face, for rig inspection and tools that
 * need the body alone. `seam` reads the join on this evaluation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBuild {
  /** The posed person, validated as a resident model. */
  model: IAutoMovieModel;

  /** The body's own evaluation, before its collar followed the face. */
  body: IAutoMovieHumanBodyBuild;

  /**
   * Rest and posed world frames of every joint of the person: the body's
   * bones, then the face's `jaw`, `leftEye` and `rightEye` hung under the
   * `head` bone, in the basis frame.
   */
  bones: IAutoMovieHumanBodyBuild["bones"];

  /** The state of the join at the neck on this evaluation. */
  seam: {
    /** Triangles of the ribbon between the two skins (zero area: the body collar lies on the face loop). */
    ribbonTriangles: number;

    /**
     * The most the body's own collar had to move to lie on the face's neck,
     * in metres: how far the two documents disagreed about the neck. It is a
     * few millimetres at the neutral, where the bases differ, and grows with
     * a face neck and a body neck asking for different sizes or places.
     */
    collarShiftMetres: number;
  };
}
