# Raven Flight — Motion Specification

## Source and intent
The approved visual reference is the 8-frame *Raven Flight Loop Animation* GIF supplied in the design conversation.
The raven must retain the high-detail front-facing feather textures while using a real 3D side-flight mesh during lateral travel. The model is decorative and should not block page links.

## Timing
- Reference cycle: **960 ms**, comprising **8 poses at 120 ms each**.
- Flight poses are sampled on a repeating Catmull-Rom spline so angular velocities are continuous at each sampled frame rather than freezing at every frame boundary.
- The 960 ms **wingbeat** timing is independent of navigation/heading. The bird must not switch front/side orientation every wingbeat.
- Brief glide modulation is applied without introducing a separate competing wingbeat frequency.

## Pose targets
| Frame | Position | Wing | Reference intent |
| --- | --- | ---: | --- |
| 0 | 0 ms | +0.98 | Face forward, wings fully raised |
| 1 | 120 ms | +0.64 | Enter bank, wings beginning to descend |
| 2 | 240 ms | +0.54 | Three-quarter turn |
| 3 | 360 ms | +0.99 | Side view, raised wings |
| 4 | 480 ms | -0.94 | Side view, strong downstroke |
| 5 | 600 ms | -0.76 | Return bank / recovery |
| 6 | 720 ms | +0.49 | Recover front pose |
| 7 | 840 ms | +0.94 | Front wings raised; seamless return to 0 |

## Directional behavior
- Autonomous target steering remains active throughout the page.
- Horizontal velocity controls front-to-side target weight and left/right mirroring.
- Low velocity or timed pause controls a **front-facing hover**. The side view fades out gradually; the detailed front model stays prominent.
- Both 3D rigs are fitted to comparable dimensions, eliminating size jumps.
- Side-flight feathers have their own locally generated barb texture; this is a stylized procedural side reconstruction, not photogrammetry.

## Presentation and performance
- Desktop rendering scales to a **415px canvas** maximum; small screens use smaller responsive sizes.
- Use transparent WebGL, a max device pixel ratio of 2, passive pointer/scroll handlers and reduced-motion support.
- The raven must never intercept pointer interactions.
- Prioritize readable text: keep important hero content above the decorative raven.
- The original high-detail GLB is loaded from `assets/raven_hd_articulated.glb`.

## Validation performed
- GitHub source modules compile as JavaScript.
- Model filenames, module import version tags and stylesheet references match.
- Eight frame specifications and the 0.96 second cycle are present.
- Full-page roaming and reduced motion are present.

## Remaining production visual QA
Verify appearance and frame pacing on the actual public GitHub Pages website at desktop and mobile widths. Automated source checks cannot prove visual similarity, frame pacing on every device, or WebGL success. The side mesh remains a stylized 3D reconstruction; exact photorealistic views from all angles would require a professionally sculpted and textured full-volume model.
