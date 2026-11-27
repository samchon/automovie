import type { IAutoMovieHumanPoseChannels } from "@automovie/interface";
import * as AutoMovieHumanPoseChannelsData from "./internal/AutoMovieHumanPoseChannelsData";

/**
 * Every degree of freedom of `IAutoMovieHumanPose`, top to bottom, with the
 * stickman bone and axis it turns and its range of motion.
 *
 * Each row is `[path, bone, axis, sign, min, max]`. `path` is the field's
 * dotted path in the pose and `bone` the stickman bone; `<side>` stands for
 * `left` or `right` in both. `axis` names the bone's clinical axis (see
 * `AutoMovieHumanSkeleton`), or a jaw translation (`forward`, `lateral`);
 * `sign` maps the field's positive motion onto that axis. `min` and `max` are
 * the same range of motion as the field's type tags, in degrees, or
 * millimetres for the jaw; the field comments and
 * `docs/anatomy/joint-range.md` give their sources.
 * A seventh `world` flag marks a direction both sides share; its right-side
 * sign is reflected because the clinical axes otherwise mirror each other.
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
