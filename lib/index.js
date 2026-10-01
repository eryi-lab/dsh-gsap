/**
 * dsh-gsap —— 把 GSAP 官方 8 个 AI 技能随包注册进 DeepSeek Harness。
 *
 * 设计目标只有一个：装上、重启，技能就能用。因此刻意保持最小面：
 *   - 只有宿主半边，没有浏览器半边、没有开关按钮、没有 RPC、没有状态文件；
 *   - 不注册工具，不访问网络，不需要账号或密钥；
 *   - 技能正文随包分发（skills/ 目录，来源 greensock/gsap-skills，MIT），
 *     注册时拿到内容的引用，加载时才读取。
 *
 * 唯一硬依赖是 cordis 的 `skills` 服务（技能注册表）。它由 DSH 基础层提供。
 *
 * @module dsh-gsap
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** 随包分发的技能名，与 skills/ 下的目录名一一对应。 */
export const SKILL_NAMES = [
    'gsap-core',
    'gsap-timeline',
    'gsap-scrolltrigger',
    'gsap-react',
    'gsap-frameworks',
    'gsap-plugins',
    'gsap-utils',
    'gsap-performance'
];

/** 随包分发的技能目录绝对路径。 */
export function bundledSkillsDir() {
    return fileURLToPath(new URL('../skills/', import.meta.url));
}

function unquoteYamlScalar(value) {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    }
    return trimmed;
}

/**
 * 解析 SKILL.md 的 YAML frontmatter，只取 name/description 两个单行字段。
 * 零依赖实现，避免为了两个字段引入 yaml 解析器。
 */
export function parseSkillFile(text) {
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/.exec(normalized);
    if (!match) {
        return { name: '', description: '', content: normalized };
    }
    let name = '';
    let description = '';
    for (const rawLine of match[1].split('\n')) {
        const keyMatch = /^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/.exec(rawLine.trim());
        if (keyMatch === null) {
            continue;
        }
        if (keyMatch[1] === 'name') {
            name = unquoteYamlScalar(keyMatch[2]);
        }
        else if (keyMatch[1] === 'description') {
            description = unquoteYamlScalar(keyMatch[2]);
        }
    }
    return { name, description, content: normalized.slice(match[0].length).trimStart() };
}

/** cordis 硬依赖：技能注册表。 */
export const inject = ['skills'];
export const name = 'dsh-gsap';

/** 读取一个技能目录里的 SKILL.md 并注册，返回释放函数。 */
function registerOne(ctx, skillName, base) {
    const dir = join(base, skillName);
    const parsed = parseSkillFile(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
    if (parsed.name === '' || parsed.description === '' || parsed.content === '') {
        ctx.logger?.warn?.(`[dsh-gsap] 跳过 ${skillName}：frontmatter 的 name/description 为空`);
        return undefined;
    }
    return ctx.skills.register({
        name: parsed.name,
        description: parsed.description,
        content: parsed.content,
        resourceBase: { kind: 'directory', path: dir },
        source: 'bundled'
    });
}

export function apply(ctx, config = {}) {
    // 注册面缺失是配置错误，必须显式失败：静默跳过会让"装上了却没技能"，
    // 那比启动时报错更难排查。
    if (ctx?.skills?.register === undefined) {
        throw new Error('[dsh-gsap] 未取得 skills 服务（技能注册表），插件无法注册任何技能');
    }

    const requested = Array.isArray(config?.skills) && config.skills.length > 0
        ? config.skills.filter((value) => typeof value === 'string')
        : SKILL_NAMES;
    const base = bundledSkillsDir();
    const disposers = [];
    const failures = [];
    for (const skillName of requested) {
        if (!SKILL_NAMES.includes(skillName)) {
            ctx.logger?.warn?.(`[dsh-gsap] 未知技能 "${skillName}"，已跳过（可用：${SKILL_NAMES.join(', ')}）`);
            continue;
        }
        try {
            const dispose = registerOne(ctx, skillName, base);
            if (dispose !== undefined) {
                disposers.push(dispose);
            }
        }
        catch (error) {
            // 单个技能文件坏掉不能让宿主启动失败。
            failures.push(`${skillName}: ${error instanceof Error ? error.message : String(error)}`);
            ctx.logger?.warn?.(`[dsh-gsap] 技能 ${skillName} 注册失败：${failures[failures.length - 1]}`);
        }
    }

    // 全都注册不上，说明不是"某个文件坏了"而是环境不对（例如 API 变了），
    // 这种情况宁可让它响，也不要留一个看起来装好的空插件。
    if (disposers.length === 0 && requested.length > 0) {
        throw new Error(`[dsh-gsap] 8 个技能全部注册失败：${failures.join(' | ') || '无可用技能'}`);
    }
    ctx.logger?.info?.(`[dsh-gsap] 已注册 ${disposers.length}/${requested.length} 个 GSAP 技能`);
    return () => {
        for (const dispose of disposers) {
            try {
                dispose();
            }
            catch {
                /* 释放失败不影响其他技能 */
            }
        }
    };
}

export { registerOne as registerSkill };
