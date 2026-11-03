import { assertHumanRows } from "../../internal/assertHumanRows";
import { HumanProfileRows } from "../../internal/HumanProfileRows";

/**
 * Every person's foot, cut by planes across its axis at every 2.5 percent of its
 * length, runs the way a foot does: the dorsum falls from its summit to the toes,
 * the medial arch rises to one apex and returns to the floor, the arch height
 * index lies in its published band, and the toes shorten laterally.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses each person to the anatomical neutral, locates each foot's axis by ISO 8559-1's definition and cuts the foot's skin across the axis at 39 stations. It reads the highest skin of each section (the dorsum), where its summit stands and the largest rise past it, the lowest skin of each section's medial half (the clearance of the arch) from heel to ball for a second hump, its apex's share, the arch height index (dorsal height at half the foot over 0.74 of its length), and the farthest skin of each toe along the axis. It catches a hump on the forefoot, a double arch, a flat or hollow foot, a fifth toe reaching past the fourth and a longest toe that is neither the first nor the second.
 * @evidence contracts/testing.md#independent-expectations The dorsum falls from a summit in the rear half (Gray 1918, `anatomy/foot.md`); the rise past it stays within ISO 20685-1's 2 mm for foot dimensions. The arch is one vault between the calcaneus (about 0.08 of the length) and the first metatarsal head (0.74, ANSUR II's ball-of-foot length), so its apex stands within 0.15 of the middle, 0.41: 0.26 to 0.56, and no second hump deeper than 2 mm. The arch height index lies within the union of two published 2.326 SD bands, 0.229 to 0.410: Williams and McClay 2000's 0.292, SD 0.027 at 90 percent weight bearing (`sources/williams-mcclay-2000-arch-height.md`) and Butler et al.'s 0.340, SD 0.030 (`sources/butler-arch-height-index.md`). The third, fourth and fifth toes end successively nearer the heel and the longest toe is the first or the second (Gray 1918; which leads varies between people). No construction constant or earlier output enters.
 * @evidence contracts/testing.md#distinguishing-cases All nine generated people, women and men, small and large feet, both feet. The foot test owns the length, breadth and floor rows, the curve tests the chains' soundness; the pieces and seams of the foot wait for the region's announcement.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_foot_profile`, reading each person's rows once from a `Singleton` per person, with no renderer, browser or GPU.
 */
export function test_human_foot_profile(): void {
  assertHumanRows("foot profile", HumanProfileRows.foot);
}
