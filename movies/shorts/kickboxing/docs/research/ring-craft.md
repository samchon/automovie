# Ring craft: footwork, officiating and coverage

The owner judged an earlier cut static: the fighters only moved forward and back, the referee stood still, and the camera held one framing. This page records the sources for three relational laws that replace it. These laws cover ring generalship in [BoutRing](../../src/motion/footwork/BoutRing.ts), the referee's positioning in [RefereePosition](../../src/motion/referee/RefereePosition.ts) and the bout camera in [BoutCamera](../../src/shots/kickboxing/ring-bout/BoutCamera.ts). It also records the measurable targets that the movie's unit tests check against the composed bout. None of the sources supplies joint angles or exact speeds. Those come from the rig and the stance geometry, and each one is named where the law uses it.

## Activity structure of elite kickboxing {#activity}

Ouergui et al. timed 45 elite bouts from two WAKO world championships ([Time-motion analysis of elite male kickboxing competition](https://paulogentil.com/pdf/Time-Motion%20Analysis%20of%20Elite%20Male%20Kickboxing%20Competition.pdf), J Strength Cond Res 28(12), 2014). Their findings:

- High-intensity actions last 2.2 ± 1.2 s.
- Low-intensity footwork phases last 2.3 ± 0.8 s.
- Consecutive high-intensity actions are 3.4 ± 1.2 s apart.
- Fighters perform about 25 high-intensity actions per two-minute round.
- Fighting and non-fighting time stand at about 1:1.

The study counts steps, slides, bounces, turns and feints as low-intensity activity. Movement between attacks therefore fills about half of the fight.

Adopted targets for the composed bout:

- Exchanges separated by resets whose mean lies inside one standard deviation of 3.4 s.
- At least 75% of strikes are thrown inside combinations of two or more, and at least 85% of exchanges contain a combination, following the Dutch combination style in [championship exchanges](championship-exchanges.md#combinations). The exceptions are single counters, the teep that resets range and the clinch knee, which GLORY limits to one strike.

## Ring generalship and footwork {#footwork}

Coaching sources agree on four behaviors:

- Do not chase or back straight up. Move laterally, take angles, and keep the opponent in front ([Evolve MMA: strategic footwork, angles and lateral movement in Muay Thai](https://evolve-mma.com/blog/strategic-footwork-using-angles-and-lateral-movement-to-control-the-ring-in-muay-thai/), [Evolve MMA: ring generalship for boxing](https://evolve-mma.com/blog/how-to-improve-ring-generalship-for-boxing/)).
- To cut off the ring, mirror the opponent's lateral escape rather than following his path, and take away the directions he can move until he reaches the ropes or a corner ([Dynamic Striking: how to cut off the ring with Teddy Atlas](https://dynamicstriking.com/blogs/news/how-to-cut-off-the-ring-with-teddy-atlas), [Fight Primer: cutting off the ring](https://www.fightprimer.com/finding-the-art-cutting-the-ring-99-yo)).
- Circle away from the opponent's power hand. For two orthodox fighters, that means toward one's own left, away from the opponent's rear hand.
- Pivot off the line instead of retreating straight back. A fighter on the ropes circles out toward the side with more room.

Adopted laws, each driven by the screenplay's ring beat for one fighter:

| Beat | Law |
| --- | --- |
| circle | Lateral steps toward the mover's lead side, so the pair rotates about the opponent. |
| press | The presser walks in. The receiver gives ground on a 45° diagonal toward his lead side while the presser cuts across at half that lateral speed. In the rope zone, the receiver circles off toward the open side. |
| pivot | The mover swings a quarter circle around the opponent on his lead side. |
| center | The pair walks toward the middle of the ring. |

Both stances hold their ground while any strike is in flight. A stance origin keeps a 0.45 m body margin inside the rope line. The rope zone is that margin plus two steps.

Speeds come from the stance: one step is 0.25 m, under half the 0.58 m orthodox stance length, and the low-intensity cadence is two steps per second.

Adopted targets:

- At least 30% of the fighters' footwork path is lateral to their line.
- The line turns through at least one full revolution over the bout.
- The pair works on the ropes for some of the bout but no more than a quarter of it.
- Both fighters always stay inside the ropes.

## Referee mechanics {#referee}

The [Association of Boxing Commissions Referee Manual of Professional Boxing](https://www.abcboxing.com/wp-content/uploads/2022/08/box-ref-manual-july-2022.pdf) (rev. July 2022) sets out the positioning rules adopted here:

- Stay as far from the boxers as possible, use the perimeter of the ring and move gracefully, without bouncing.
- Keep the pace of circling boxers while holding a side view of both.
- Keep a window between the boxers and never get caught behind them or the action.
- Shorten the distance when they fight on or near the ropes, in infighting and clinches, and when a stoppage may be near.
- Break at an angle, never from behind, and never walk between the boxers after a break.
- At a knockdown, send the standing boxer to the farthest neutral corner. Keep him in view while counting, and stop the count if he leaves.

The knockdown rules match the state regulations the [technique research](technique.md#rules) already adopts.

Adopted law: the referee's desired point lies across the fighters' line from their centre. He stays as far out as the ring allows, from 1.3 to 2.1 m, and keeps 0.4 m inside the ropes. On the ropes and in the clinch he closes to 1.3 m. He keeps his side unless it runs out of room, and he walks toward the desired point at no more than 1.2 m/s with a 0.6 s lag. While the fighters work he holds an officiating stance: knees soft and both hands ready at the waist. The existing cue table owns the bell, the knockdown, the neutral corner, the count and the decision.

Adopted targets:

- A side view of the fighters' line for at least 90% of the bout, meaning the angle between his direction from their centre and their line is at least 60°.
- He never stands between the fighters.
- He keeps moving: at least 1 m of walking in every fifteen-second group.

## Fight coverage {#camera}

Broadcast boxing centres on a fixed hard camera with the broadest view of the ring. Ringside handheld cameras move with the action for closer sizes, and a knockdown is the moment to change angle ([Fightful: wrestling and combat camera roles](https://www.fightful.com/?p=333755), [SVG: Wilder–Fury II production](https://www.sportsvideo.org/2020/02/21/wilder-vs-fury-2-espn-fox-sports-team-up-on-outsize-boxing-production-in-vegas), [DVinfo: shooting boxing](https://www.dvinfo.net/forum/open-dv-discussion/465615-shooting-boxing.html)).

Fiction films took two routes. *Raging Bull* keeps the camera inside the ring and moving with the fighters ([No Film School](https://nofilmschool.com/raging-bull-fight-scenes)). *Creed* stages a whole fight as one moving take that changes from mid-shot to close-up without cutting ([Adorama: Creed and the evolution of the fight scene](https://www.adorama.com/alc/shooting-holiday-blockbuster-creed-and-evolution-fight-scene/)).

Bordwell's survey of intensified continuity gives action films average shot lengths near 2.7 s, against 8–11 s in the studio era ([Intensified continuity](https://www.scribd.com/doc/310344009/Bordwell-Intensified-Continuity)).

Adopted law: one continuous inside-the-ring take, as in *Creed*. The camera keeps a side view of both fighters from across their line, on the side opposite the referee, so he never blocks the action. It is wide during resets, medium while an exchange is live, and pushes in on every clean landing. Each size holds for at least 2.4 s. The camera orbits at no more than 0.9 rad/s instead of cutting through the fighters, and it follows with operator lag. The screenplay's widening at 143 s and the held knockout view remain anchors of the film plan.

Adopted targets:

- Mean interval between shot-size changes between 2 and 8 s, bracketing the 2.7 s action-film average and longer broadcast holds.
- The camera is moving for at least 60% of the bout.
- The lens stays inside the ropes.
