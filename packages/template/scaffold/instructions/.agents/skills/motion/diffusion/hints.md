# Hints

## Bring the performance to the model

1. Sample the composed performance at the model's frame rate, from the installed vocabulary's own evaluation.
2. Map the polygon man's joints onto the model's skeleton through a stated joint table, in its units, up axis and facing, with the start placed as the model expects.
3. Scale onto the model's canonical body, or fit the model's body to the cast member's, because most models assume one proportion. A contact exact on the polygon man arrives only approximately.

## Techniques

| Technique | Give the model | Keeps the hint |
| --- | --- | --- |
| Keyframe in-betweening | Full or partial poses at the beat's instants | Exactly in a tool that preserves keys; otherwise near them, so correct afterwards |
| Joint and path control | Global positions of chosen joints, or the root's path on the ground, per frame with a mask | Close, more loosely when several joints conflict |
| Interval regeneration | The whole clip, with a time window or a body part to regenerate | Outside the window or part, as the model documents it |
| Style transfer | The clip and a reference of the style | The timing and path, while the manner changes |
| Text or music | A description of the manner, or the score | Nothing of the performance, so use it only beside one of the above |

Keep the keys few and far enough apart for the model to fill, within its documented gap and length, and give it the beat's [manner](../compose/SKILL.md#decide-each-action) as text where it takes text.

Plain imputation of keys at every step leaves jumps around each key, and loose guidance drifts off them. Prefer a model trained for in-betweening, or one that enforces its constraints by a final optimization, and check the result either way.

## Check the result

After retargeting back, measure on the polygon man:

- the distance from each authored key and target;
- every authored contact and grip, checked under [retargeting](../retargeting.md#preserve-contacts-and-time).

A clip that misses a key or contact the beat decides is generated again or replaced by the composed motion, never accepted for its look.

Sources: [CondMDI](https://arxiv.org/html/2405.11126), [Kimodo constraints](https://research.nvidia.com/labs/sil/projects/kimodo/docs/user_guide/constraints.html), [Kimodo limitations](https://research.nvidia.com/labs/sil/projects/kimodo/docs/key_concepts/limitations.html), [OmniControl](https://arxiv.org/html/2310.08580), [GMD](https://arxiv.org/html/2305.12577), [MDM editing](https://github.com/GuyTevet/motion-diffusion-model), [MoMask](https://github.com/EricGuo5513/momask-codes), [HumanML3D representation](https://raw.githubusercontent.com/EricGuo5513/HumanML3D/main/motion_representation.ipynb), [PHC retargeting](https://github.com/ZhengyiLuo/PHC/blob/master/docs/retargeting.md), [Cascadeur inbetweening](https://cascadeur.com/help/category/278), [Cascadeur on control](https://digitalproduction.com/2026/02/18/cascadeur-on-physics-ai-and-control/), [Animaj in-betweening](https://www.animaj.com/post/inside-animajs-siggraph-2026-paper-anton-rael-on-ai-motion-in-betweening).
