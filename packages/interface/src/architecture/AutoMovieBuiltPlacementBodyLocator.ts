/**
 * An addressable placed body whose current world bounds a building query can
 * derive without expanding authored repetition.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Gives project source a stable element-or-population subject for the promised placement-support query.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Types the two body identities whose current world bounds the support contract can resolve.
 * @author Samchon
 */
export type AutoMovieBuiltPlacementBodyLocator =
  | {
      /** Address an individual visible building element. */
      kind: "element";

      /** Stable element identity inside the queried built environment. */
      id: string;
    }
  | {
      /** Address one compact repeated population without expanding its members. */
      kind: "population";

      /** Stable instance-set identity inside the queried built environment. */
      id: string;
    };
