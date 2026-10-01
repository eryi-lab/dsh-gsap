# dsh-gsap

English | [中文](README.zh.md)

A single-package [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that registers the eight official [GSAP AI skills](https://github.com/greensock/gsap-skills).

Install, restart, done. No toggle button, no browser half, no RPC, no state file, no configuration, account or API key.

## Install

From the plugin market (Settings → Plugins), or:

```sh
dsh plugin --profile <your-profile> add dsh-gsap
```

Installing the prebuilt tarball from the GitHub release (no npm account or build step needed):

```sh
dsh plugin --profile <your-profile> add https://github.com/eryi-lab/dsh-gsap/releases/latest/download/dsh-gsap.tgz
```

Installing from source instead:

```sh
dsh plugin --profile <your-profile> add github:eryi-lab/dsh-gsap
```

Restart DSH Desktop afterwards — a bundle is read at boot and cannot be hot-loaded.

## What it registers

| Skill | Covers |
|---|---|
| `gsap-core` | Core API: `gsap.to()/from()/fromTo()`, easing, duration, stagger, defaults, `matchMedia()` |
| `gsap-timeline` | Timelines: labels, nesting, position parameter |
| `gsap-scrolltrigger` | Scroll-driven animation: ScrollTrigger, scrub, pin, refresh |
| `gsap-react` | React: `useGSAP()`, cleanup, SSR |
| `gsap-frameworks` | Vue / Svelte / Nuxt and other framework integration |
| `gsap-plugins` | Official plugins: SplitText, MorphSVG, Flip, Draggable and more |
| `gsap-utils` | `gsap.utils`: clamp, mapRange, random, snap, toArray |
| `gsap-performance` | Performance: prefer transforms, avoid layout thrashing, will-change, batching |

Skill bodies ship inside the package under `skills/<name>/SKILL.md`, taken from
`greensock/gsap-skills` (MIT — see `LICENSE.gsap-skills`). Registration reads only the
frontmatter; the body is read when an agent actually loads that skill.

## Optional configuration

All eight skills are registered by default. To register a subset, override the row by id in
your profile's `cordis.patch.yml`:

```yaml
- id: gsap
  config:
    skills: [gsap-core, gsap-scrolltrigger]
```

## Design notes

- **One dependency only**: the cordis `skills` service (`inject: ['skills']`). It registers no
  tools, does not touch the composer, and adds nothing to the session token baseline.
- **A missing registration surface is an error**: without the skills registry the plugin throws
  instead of silently skipping, because "installed but empty" is harder to diagnose than a
  failed boot.
- **One broken skill does not take the host down**: a damaged `SKILL.md` is warned about and
  skipped. All eight failing throws, because that indicates an environment problem rather than
  a file problem.

## License

MIT for this plugin. The bundled skill documents are MIT, from greensock/gsap-skills.
