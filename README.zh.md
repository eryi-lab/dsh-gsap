# dsh-gsap

[English](README.md) | 中文

把 [GSAP 官方 8 个 AI 技能](https://github.com/greensock/gsap-skills)注册进 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的**单包插件**。

装上、重启，技能就能用。没有开关按钮，没有浏览器半边，没有 RPC，没有状态文件，不需要配置、账号或密钥。

## 安装

从插件市场（设置 → 插件）安装，或：

```sh
dsh plugin --profile <你的 profile> add dsh-gsap
```

从 GitHub Release 安装预构建包（无需 npm 账号，也不需要本地构建）：

```sh
dsh plugin --profile <你的 profile> add https://github.com/eryi-lab/dsh-gsap/releases/latest/download/dsh-gsap.tgz
```

从源码仓库安装：

```sh
dsh plugin --profile <你的 profile> add github:eryi-lab/dsh-gsap
```

装完**重启 DSH Desktop**（bundle 在启动时读取，不能热加载）。

## 它注册什么

| 技能 | 覆盖内容 |
|---|---|
| `gsap-core` | 核心 API：`gsap.to()/from()/fromTo()`、缓动、duration、stagger、defaults、`matchMedia()` |
| `gsap-timeline` | 时间线：label、嵌套、position parameter |
| `gsap-scrolltrigger` | 滚动驱动动画：ScrollTrigger、scrub、pin、refresh |
| `gsap-react` | React 集成：`useGSAP()`、cleanup、SSR |
| `gsap-frameworks` | Vue / Svelte / Nuxt 等框架集成 |
| `gsap-plugins` | 官方插件：SplitText、MorphSVG、Flip、Draggable 等 |
| `gsap-utils` | `gsap.utils`：clamp、mapRange、random、snap、toArray |
| `gsap-performance` | 性能：transform 优先、避免布局抖动、will-change、批处理 |

技能正文随包分发在 `skills/<name>/SKILL.md`，来源 `greensock/gsap-skills`（MIT，见 `LICENSE.gsap-skills`）。
注册时只读 frontmatter，正文在 agent 真正加载该技能时才被读取。

## 可选配置

默认注册全部 8 个。只要子集时，在自己 profile 的 `cordis.patch.yml` 里按 id 覆盖：

```yaml
- id: gsap
  config:
    skills: [gsap-core, gsap-scrolltrigger]
```

## 设计取舍

- **只依赖 `skills` 服务**（`inject: ['skills']`）：不注册工具、不碰输入框、不影响会话 token 基线。
- **注册面缺失就报错**：拿不到技能注册表时显式抛错而不是静默跳过——"装上了却什么都没有"比启动时报错更难排查。
- **单个技能坏掉不拖垮宿主**：某个 `SKILL.md` 损坏只告警并跳过；8 个全部失败会抛错，因为那说明是环境问题而不是文件问题。

## 许可

本插件为 MIT。随包的技能文档来自 greensock/gsap-skills，同为 MIT。
