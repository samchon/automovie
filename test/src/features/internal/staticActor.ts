import type { IAutoMovieCollisionActor } from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Place the original hips-to-spine capsule at the requested world endpoints with an identity pose and one static keyframe. */
export const staticActor: (props: {
  /** Actor identity retained by collision observations. */
  node: string;

  /** World-space first capsule endpoint. */
  a: IAutoMovieVector3;

  /** World-space second capsule endpoint. */
  b: IAutoMovieVector3;

  /** Capsule radius in metres. */
  radius: number;

  /** Optional authored physical body copied into the actor. */
  body?: IAutoMovieBody | null;
}) => IAutoMovieCollisionActor = (props: {
  node: string;
  a: IAutoMovieVector3;
  b: IAutoMovieVector3;
  radius: number;
  body?: IAutoMovieBody | null;
}): IAutoMovieCollisionActor => {
  const { a, b }: { a: IAutoMovieVector3; b: IAutoMovieVector3 } = props;
  const skeleton: IAutoMovieSkeleton = {
    id: `${props.node}-rig`,
    bones: [
      { bone: "hips", parent: null, rest: T(a.x, a.y, a.z), constraint: null },
      {
        bone: "spine",
        parent: "hips",
        rest: T(b.x - a.x, b.y - a.y, b.z - a.z),
        constraint: null,
      },
    ],
  };
  const motion: IAutoMovieMotion = {
    id: `${props.node}-motion`,
    skeleton: skeleton.id,
    duration: 1,
    loop: false,
    keyframes: [
      {
        time: 0,
        pose: { skeleton: skeleton.id, root: null, joints: [] },
        expression: null,
        easing: "linear",
        bezier: null,
      },
    ],
  };
  return {
    node: props.node,
    skeleton,
    motion,
    capsules: [{ from: "hips", to: "spine", radius: props.radius }],
    body: props.body ?? null,
  };
};

/** Build an identity rotation and scale at the given local translation. */
const T: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
