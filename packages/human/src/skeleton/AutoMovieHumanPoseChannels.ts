import type { IAutoMovieHumanPoseChannels } from "@automovie/interface";
import { AutoMovieHumanPoseChannelsData } from "./internal/AutoMovieHumanPoseChannelsData";

/**
 * Canonical ordered Human pose channels. Each row identifies the dotted input
 * path, joint, clinical axis, sign and nominal bounds. Angular limits use
 * degrees and jaw limits use millimetres. A side placeholder expands to
 * anatomical left and right. A true final flag reflects the right-side sign
 * for a shared direction.
 */

export const AutoMovieHumanPoseChannels: readonly IAutoMovieHumanPoseChannels.Channel[] =
  ((): IAutoMovieHumanPoseChannels.Channel[] => {
    const rows: IAutoMovieHumanPoseChannels.Channel[] = [...AutoMovieHumanPoseChannelsData.INITIAL];
    for (const [key, bone] of AutoMovieHumanPoseChannelsData.FINGERS)
      rows.push(
        [
          `arms.<side>.hand.${key}.mcpFlexion`,
          `<side>${bone}Proximal`,
          "flexion",
          1,
          0,
          80,
        ],
        [
          `arms.<side>.hand.${key}.mcpAbduction`,
          `<side>${bone}Proximal`,
          "abduction",
          1,
          -20,
          20,
        ],
        [
          `arms.<side>.hand.${key}.pipFlexion`,
          `<side>${bone}Intermediate`,
          "flexion",
          1,
          0,
          90,
        ],
        [
          `arms.<side>.hand.${key}.dipFlexion`,
          `<side>${bone}Distal`,
          "flexion",
          1,
          0,
          65,
        ],
      );
    rows.push(...AutoMovieHumanPoseChannelsData.AXIAL);
    for (const [key, n] of AutoMovieHumanPoseChannelsData.TOES)
      rows.push(
        [
          `legs.<side>.foot.${key}.mtpFlexion`,
          `<side>Toe${n}Proximal`,
          "flexion",
          1,
          -40,
          40,
        ],
        [
          `legs.<side>.foot.${key}.mtpAbduction`,
          `<side>Toe${n}Proximal`,
          "abduction",
          1,
          -10,
          10,
        ],
        [
          `legs.<side>.foot.${key}.pipFlexion`,
          `<side>Toe${n}Intermediate`,
          "flexion",
          1,
          0,
          35,
        ],
        [
          `legs.<side>.foot.${key}.dipFlexion`,
          `<side>Toe${n}Distal`,
          "flexion",
          1,
          0,
          60,
        ],
      );
    return rows;
  })();
