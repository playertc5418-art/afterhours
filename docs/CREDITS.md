# Third-party work & attribution

[简体中文](CREDITS.zh-CN.md) · [Back to README](../README.md)

AFTERHOURS combines third-party software, an adapted visual component, downloaded materials, and credited audio with website-specific scene construction, interaction, and integration. The technical walkthrough describes how this website works; it does not claim that every algorithm, effect, or asset was invented here.

## Adapted implementation: React Bits / Hyperspeed

**Upstream:** [Hyperspeed](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/src/content/Backgrounds/Hyperspeed/Hyperspeed.jsx) by **David Haz / React Bits**. The recorded upstream revision is `e12c22192ac7b4b452c5e2feb9b586d74765d696`.

**Used in:** the opening road, light trails, and associated visual component. This is a modified upstream implementation, rather than an effect authored entirely from scratch for AFTERHOURS.

**Local integration and changes:** readiness callbacks, capped pixel ratio, configurable boost response and release, route-controlled curvature and road alignment, pause/background handling, palette interpolation, and arrival coordination. The active component also integrates with the host site's shared renderer and frame scheduling. These additions do not change the origin of the road effect.

**License:** the pinned upstream license is **MIT + Commons Clause License Condition v1.0**, not plain MIT. Preserve its copyright and terms; the notice includes restrictions on redistribution of the components themselves. Consult the [preserved full license](../licenses/react-bits.md) and [pinned upstream license](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/LICENSE.md) for the actual wording.

[Recorded upstream files and changes](../licenses/react-bits-source.json)

## Software dependencies, not claims of original authorship

| Software / authors | Use in this project | Terms / preserved notice |
| --- | --- | --- |
| [React / React DOM](https://github.com/facebook/react), React contributors | Interface composition and state | [React MIT](../licenses/react.txt), [React DOM MIT](../licenses/react-dom.txt), [Scheduler MIT](../licenses/scheduler.txt) |
| [Three.js](https://github.com/mrdoob/three.js), Three.js authors | Main-site architecture and Lab, Gravity Off, miniature scenes | [MIT](../licenses/three.txt) |
| [GSAP](https://gsap.com/), GreenSock / Webflow | Animation timelines, camera and transition coordination | [Standard no-charge license](https://gsap.com/community/standard-license/), not MIT; distributed code retains its notices |
| [Lenis](https://github.com/darkroomengineering/lenis), darkroom.engineering | Smooth scrolling and scroll coordination | [MIT](../licenses/lenis.txt) |
| [Rapier](https://rapier.rs/), Dimforge / contributors | Gravity Off rigid-body simulation and collisions | [Apache-2.0](../licenses/gravity-off-Rapier-Apache-2.0.txt) |
| [Vite](https://vite.dev/) / [TypeScript](https://www.typescriptlang.org/) | Local development and build tooling | Tooling dependencies; the complete development project is not distributed here |

Using a rendering or physics library is different from copying a particular demo. The Hyperspeed adaptation is identified separately above. Standard techniques such as ping-pong targets, particle interpolation, and ray picking are not evidence of a specific copied implementation; add an upstream source when a direct adaptation is identified.

## Downloaded architectural materials

These surface maps are third-party assets, not textures painted from scratch for this website. [ambientCG](https://docs.ambientcg.com/license/) and [Poly Haven](https://polyhaven.com/license) provide the listed assets under CC0; their creators are credited here even where attribution is optional.

| Asset | Creator / provider | Use and processing |
| --- | --- | --- |
| [Marble016](https://ambientcg.com/view?id=Marble016) | ambientCG | Dark marble columns; local JPEG encoding at original 2K dimensions |
| [Granite002A](https://ambientcg.com/view?id=Granite002A) | ambientCG | Counter and wall stone; neutralized diffuse color and reduced contrast |
| [Granite Tile](https://polyhaven.com/a/granite_tile) | Charlotte Baglioni / Poly Haven | Floor; original 1K maps |
| [Japanese Cedar Planks](https://polyhaven.com/a/japanese_cedar_planks) | Charlotte Baglioni, Rico Cilliers / Poly Haven | Timber in miniature architecture; original 1K maps |
| [Grey Cartago 03](https://polyhaven.com/a/grey_cartago_03) | Lucas Sánchez Ros / Poly Haven | Earlier comparison files retained in distribution; not loaded by the current material setup |

[Material provenance and processing](../materials/atelier/README.md) · [Per-file sources and hashes](../materials/atelier/sources.json)

## Fonts

- **Barlow Condensed**, The Barlow Project Authors: [SIL Open Font License 1.1](../licenses/barlow-condensed.txt).
- **IBM Plex Mono**, IBM Corp.: [SIL Open Font License 1.1](../licenses/ibm-plex-mono.txt).

## Music, recordings, and sound effects

| Material / creator | Where used and what changed | Attribution / terms |
| --- | --- | --- |
| **Meanwhile — Scott Buckley** | Main-site background music; leading silence trimmed, playback volume/fades/looping controlled by the site | CC BY 4.0; [track, source, and processing](../audio/credits.html) |
| **Perseus Cluster Sonification — NASA/CXC/SAO/K.Arcand, SYSTEM Sounds (M. Russo, A. Santaguida)** | Singularity; filtered and looped recording mixed with synthesized low-frequency ambience | [Full credits and official media-use links](../sites/blackhole/audio/credits.html); not a recording made near a black hole, and not an endorsement |
| **Interface Sounds / Impact Sounds — Kenney** | Gravity Off interface and impact sounds | CC0; [Interface notice](../licenses/gravity-off-kenney-interface-sounds.txt), [Impact notice](../licenses/gravity-off-kenney-impact-sounds.txt) |
| **HTS Voice Mei — MMDAgent Project Team / Nagoya Institute of Technology** | Xiaojian shop welcome synthesized with Open JTalk; adjusted pitch and speed | Voice model CC BY 3.0; [distributed audio credits](../sites/xiaojian/audio/credits.txt) |
| **Gingasen whistle — Cassiopeia sweet** | Xiaojian train horn; edited, filtered, extended, and encoded | CC BY-SA 3.0; source, changes, and adapted-recording terms in the same audio credits |
| **European Herring Gull — Sonothèque ADVL** | Xiaojian gull call; excerpt, filtering, gain and fades | CC0; source and changes in the same audio credits |
| **Flowing-water-100019 — Fg2** | Distributed Xiaojian water recording | Public domain; source in the same audio credits |
| **Water drops dripping — ZooFari** | Xiaojian water-contact cue; isolated and processed transient | CC BY-SA 3.0; adapted recording retains those terms, with source and changes in the same audio credits |

## Visual reference and contribution boundaries

Singularity's black-hole imagery cites [NASA's visualization](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/) as a visual reference. This is distinct from the directly reused sonification recording and does not identify NASA as the author of this website's shader code.

The site's contribution includes scene assembly, interaction state, camera/scroll/DOM coordination, readiness and renderer integration, experiment controls, and the presentation of independent worlds. That integration does not transfer authorship of the dependencies or assets listed above. Sources are based on the current provenance files and shipped notices; newly identified borrowed work should add its upstream link, version, use, and changes here.

No blanket license for the complete website is declared. Keep third-party notices and per-asset terms when discussing reuse; an eventual license for locally authored code would not relicense these upstream works.

## README presentation references

The cover, subject framing, and technical comparisons were informed by visual study of [Anime.js](https://github.com/juliangarnier/anime), [COBE](https://github.com/shuding/cobe), and [React Three Fiber](https://github.com/pmndrs/react-three-fiber). These are presentation references; runtime code and asset origins are listed above. The compositions use this project’s browser recordings and native HTML/SVG explanatory graphics.
