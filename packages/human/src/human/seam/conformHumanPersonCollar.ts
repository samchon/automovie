import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Move the body's collar onto the face's neck, and the skin below it in
 * proportion, so the two skins meet with no gap whatever the two documents
 * ask of the neck.
 *
 * The face owns the neck (its shape, its size, its motion with the head), so
 * the body's retained loop is placed on the face's loop: each loop vertex goes
 * to the point of the face loop's nearest edge that `seam.collar.follow`
 * names (the foot at `fraction` along edge `edge`, on the evaluated face). The
 * mismatch to where the body's own evaluation left that vertex is
 * `delta = target - own`. Body skin within the seam's reach then moves by
 * `weight * (interpolated delta)`, where the delta is interpolated by azimuth
 * between the two loop vertices that bracket the skin vertex and the weight
 * is one at the loop and falls smoothly (C2) to zero at the reach.
 *
 * Each retained body-loop vertex lies on the face polyline. Unequal boundary
 * partitions can still span a face corner with a body chord; the person
 * builder's boundary subdivision makes both skins follow the same union
 * of samples and closes that wedge. The price is local: the body's skin below the collar takes up
 * the whole mismatch (a few millimetres at the neutral, where the body's loop
 * stands a little under the face's, and whatever two different necks ask for)
 * within the reach, so a mismatch of the order of the reach itself compresses
 * the neck there, which is the configuration to observe. The function returns
 * a new array and leaves every input unchanged; the arrays are the connected
 * skin surfaces' flat shared vertices, in metres.
 */
export function conformHumanPersonCollar(props: {
  seam: IAutoMovieHumanPersonSeam;
  /** The face skin surface's evaluated positions, in the shared frame. */
  face: readonly number[];
  /** The body skin surface's evaluated positions. */
  body: readonly number[];
}): number[] {
  const { seam, face, body } = props;
  const delta = seam.bodyLoop.map((vertex, j) => {
    const { edge, fraction } = seam.collar.follow[j];
    const a = seam.faceLoop[edge];
    const b = seam.faceLoop[(edge + 1) % seam.faceLoop.length];
    return [0, 1, 2].map(
      (axis) =>
        face[a * 3 + axis] * (1 - fraction) +
        face[b * 3 + axis] * fraction -
        body[vertex * 3 + axis],
    );
  });
  const output = body.slice();
  for (const { vertex, low, high, along, weight } of seam.collar.band)
    for (let axis = 0; axis < 3; axis++)
      output[vertex * 3 + axis] +=
        weight * (delta[low][axis] * (1 - along) + delta[high][axis] * along);
  return output;
}
