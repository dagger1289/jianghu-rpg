"use strict";

(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas && canvas.getContext("2d");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const interactionHint = document.getElementById("interactionHint");
    const dialoguePanel = document.getElementById("dialogue");
    const dialogueName = document.getElementById("dialogueName");
    const dialogueText = document.getElementById("dialogueText");
    const dialogueNext = document.getElementById("dialogueNext");
    const dialoguePortraitFrame = document.getElementById("dialoguePortraitFrame");
    const dialoguePortrait = document.getElementById("dialoguePortrait");
    const battleStatus = document.getElementById("battleStatus");
    const battleUI = document.getElementById("battleUI");
    const battleMessage = document.getElementById("battleMessage");
    const playerHpLabel = document.getElementById("playerHp");
    const banditHpLabel = document.getElementById("banditHp");
    const playerMpLabel = document.getElementById("playerMp");
    const banditMpLabel = document.getElementById("banditMp");
    const battleEffectsLabel = document.getElementById("battleEffects");
    const attackButton = document.getElementById("attackBtn");
    const skillButton = document.getElementById("skillBtn");
    const skillPanel = document.getElementById("skillPanel");
    const skillPanelClose = document.getElementById("skillPanelClose");
    const skillList = document.getElementById("skillList");
    const runButton = document.getElementById("runBtn");
    const moveButton = document.getElementById("moveBtn");
    const defendButton = document.getElementById("defendBtn");

    const WIDTH = canvas ? canvas.width : 1200;
    const HEIGHT = canvas ? canvas.height : 700;
    const PLAYER_SPEED = 210;
    const NPC_INTERACT_DISTANCE = 104;
    const BANDIT_CONTACT_DISTANCE = 72;
    const SPRITE_COLUMNS = 4;
    const SPRITE_ROWS = 2;
    const MOVE_DURATION = 300;
    const BOARD = { cols: 8, rows: 6, tileW: 100, tileH: 50, centerX: 600, top: 170 };
    const EFFECT_FRAME_WIDTH = 512;
    const EFFECT_FRAME_HEIGHT = 512;
    const EFFECT_FRAME_COUNT = 8;
    const EFFECT_SHEET_WIDTH = 2048;
    const EFFECT_SHEET_HEIGHT = 1024;
    const EFFECT_FRAME_DURATION = 70;
    const EFFECT_FRAME_DURATIONS = { dragon: 70, dragon_burst: 44, palm: 70, ice_palm: 70, sword: 70,
        blade: 70, hidden_weapon: 70, absorb: 70, dark_absorb: 70 };
    const DRAGON_SEQUENCE = { duration: 1550, charge: 400, palm: 150, pause: 150,
        beam: 350, impactAt: 1050, shake: 125, afterglow: 500 };
    const SKILL_VFX_PROFILES = {
        ice_palm: { duration: 1300, impactAt: 650, sound: "ice_palm" },
        nine_yin: { duration: 1400, impactAt: 820, sound: "nine_yin" },
        nine_sun: { duration: 1400, impactAt: 1120, sound: "nine_sun" }
    };

    const assets = {};
    const effectSheets = new Map();
    const activeEffects = [];
    const portraitExpressions = {
        calm: { column: 0, row: 0 },
        happy: { column: 1, row: 0 },
        angry: { column: 2, row: 0 },
        sad: { column: 0, row: 1 },
        surprised: { column: 1, row: 1 },
        scared: { column: 2, row: 1 }
    };
    const portraitAssetKeys = {
        player: "playerPortrait",
        heroine: "heroinePortrait",
        old_man: "old_manPortrait",
        bandit: "banditPortrait"
    };
    const portraitPositionX = [7.8947, 50, 92.1053];
    const SKILL_ANIMATION_DURATION = 900;
    const martialArts = [
        { id: "nine_sun", name: "九陽神功", type: "內功", damage: 0, mpCost: 18, range: 0, targetType: "自己", cooldown: 2, description: "回復氣血並凝成護體真氣。", effect: [{ kind: "heal", amount: 18 }, { kind: "status", id: "護體", potency: 0.3 }], effectDuration: 2, animation: "absorb", requiredLevel: 1, unlocked: true },
        { id: "nine_yin", name: "九陰真經", type: "內功", damage: 27, mpCost: 20, range: 3, targetType: "單體", cooldown: 1, description: "以陰柔內勁隔空攻敵，並有機會造成流血。", effect: { kind: "status", id: "流血", chance: 0.35, potency: 4 }, effectDuration: 2, animation: "palm", requiredLevel: 1, unlocked: true },
        { id: "yijin", name: "易筋經", type: "內功", damage: 0, mpCost: 22, range: 0, targetType: "自己", cooldown: 2, description: "調息療傷，並提升護體能力。", effect: [{ kind: "heal", amount: 28 }, { kind: "status", id: "護體", potency: 0.4 }], effectDuration: 2, animation: "absorb", requiredLevel: 1, unlocked: true },
        { id: "beiming", name: "北冥神功", type: "內功", damage: 18, mpCost: 16, range: 2, targetType: "單體", cooldown: 1, description: "擊中後吸取敵方內力補充自身。", effect: { kind: "drainMp", amount: 14 }, effectDuration: 0, animation: "absorb", requiredLevel: 1, unlocked: true },
        { id: "xiaowuxiang", name: "小無相功", type: "內功", damage: 22, mpCost: 18, range: 2, targetType: "單體", cooldown: 1, description: "模擬敵招，並有機會削弱敵人攻勢。", effect: { kind: "status", id: "攻弱", chance: 0.5, potency: 0.25 }, effectDuration: 2, animation: "palm", requiredLevel: 1, unlocked: true },
        { id: "xixing", name: "吸星大法", type: "內功／特殊", damage: 20, mpCost: 20, range: 2, targetType: "單體", cooldown: 2, description: "傷敵並吸取部分氣血與內力。", effect: { kind: "lifeDrain", ratio: 0.35, mp: 8 }, effectDuration: 0, animation: "dark_absorb", requiredLevel: 1, unlocked: true },
        { id: "kuihua", name: "葵花寶典", type: "內功", damage: 31, mpCost: 24, range: 3, targetType: "單體", cooldown: 2, description: "迅捷出手，遠距造成傷害並有機會使敵流血。", effect: { kind: "status", id: "流血", chance: 0.3, potency: 4 }, effectDuration: 2, animation: "blade", requiredLevel: 1, unlocked: true },
        { id: "tianshan", name: "天山折梅手", type: "特殊技", damage: 26, mpCost: 18, range: 1, targetType: "單體", cooldown: 1, description: "連綿掌勢，有機率降低敵人攻擊力。", effect: { kind: "status", id: "攻弱", chance: 0.55, potency: 0.3 }, effectDuration: 2, animation: "palm", requiredLevel: 1, unlocked: true },
        { id: "dragon_eighteen", name: "降龍十八掌", type: "掌法", damage: 42, mpCost: 30, range: 1, targetType: "單體", cooldown: 2, description: "近身重掌造成高額傷害並擊退敵人。", effect: { kind: "status", id: "擊退", cells: 1 }, effectDuration: 0, animation: "dragon", requiredLevel: 1, unlocked: true },
        { id: "ice_palm", name: "寒冰掌", type: "掌法", damage: 23, mpCost: 16, range: 2, targetType: "單體", cooldown: 1, description: "以寒勁攻擊，並有機會使敵人滯行。", effect: { kind: "status", id: "滯", chance: 0.7, potency: 0.5 }, effectDuration: 2, animation: "ice_palm", requiredLevel: 1, unlocked: true },
        { id: "blade_art", name: "刀法", type: "刀法", damage: 21, mpCost: 10, range: 1, targetType: "單體", cooldown: 0, description: "斬出普通傷害，並有機會造成流血。", effect: { kind: "status", id: "流血", chance: 0.65, potency: 5 }, effectDuration: 2, animation: "blade", requiredLevel: 1, unlocked: true },
        { id: "hidden_weapon", name: "暗器", type: "暗器", damage: 16, mpCost: 12, range: 4, targetType: "單體", cooldown: 0, description: "遠距投擲暗器，並有機會使敵人中毒。", effect: { kind: "status", id: "中毒", chance: 0.65, potency: 4 }, effectDuration: 2, animation: "hidden_weapon", requiredLevel: 1, unlocked: true }
    ];
    const statusEffectDefinitions = {
        "滯": { description: "移動距離降低", movementMultiplier: 0.5 },
        "流血": { description: "每回合損失氣血", damagePerTurn: true },
        "瘀": { description: "受到的治療降低", healingMultiplier: 0.5 },
        "中毒": { description: "每回合損失氣血", damagePerTurn: true },
        "擊退": { description: "被推離施招者", instant: true },
        "護體": { description: "受到的傷害降低", damageReduction: true },
        "攻弱": { description: "攻擊力降低", attackMultiplier: true }
    };
    const martialArtTypes = ["掌法", "拳法", "劍法", "刀法", "棍法", "暗器", "內功", "特殊技"];
    const assetList = [
        ["map", "assets/maps/village.png", "村莊地圖"],
        ["player", "assets/characters/player.png", "主角圖片"],
        ["heroine", "assets/characters/heroine.png", "女性 NPC 圖片"],
        ["oldMan", "assets/characters/old_man.png", "老者 NPC 圖片"],
        ["bandit", "assets/characters/bandit.png", "山賊地圖圖片"],
        ["playerBattle", "assets/animations/player/player_battle.png", "主角戰鬥圖集"],
        ["banditBattle", "assets/animations/bandit/bandit_battle.png", "山賊戰鬥圖集"],
        ["playerPortrait", "assets/portraits/player.png", "主角表情肖像"],
        ["heroinePortrait", "assets/portraits/heroine.png", "青衣姑娘表情肖像"],
        ["old_manPortrait", "assets/portraits/old_man.png", "老者表情肖像"],
        ["banditPortrait", "assets/portraits/bandit.png", "山賊表情肖像"]
    ];

    const state = {
        ready: false,
        mode: "map",
        dialogue: null,
        battle: null,
        banditDefeated: false,
        lastTime: 0,
        moving: false,
        facing: 1,
        keys: new Set(),
        player: { x: 320, y: 540, hp: 100, mp: 100, maxMp: 100, level: 1 },
        npcList: [],
        bandit: { x: 900, y: 380, image: null, portrait: "bandit" },
        interactionHint: "",
        assetFailures: []
    };

    const npcDefinitions = [
        {
            id: "heroine",
            name: "青衣姑娘",
            x: 470,
            y: 480,
            asset: "heroine",
            portrait: "heroine",
            lines: [
                { text: "姑娘：少俠也是初到此地嗎？村外近來不太平，走動時多留神。", expression: "calm" },
                { text: "姑娘：若遇上山賊，切莫逞強。看準時機出手，才有勝算。", expression: "scared" }
            ]
        },
        {
            id: "oldMan",
            name: "村中老者",
            x: 690,
            y: 335,
            asset: "oldMan",
            portrait: "old_man",
            lines: [
                { text: "老者：這條村道通往溪邊，平日村民往來都走這裡。", expression: "calm" },
                { text: "老者：前方有個山賊攔路。少俠若要過去，先把氣力養足。", expression: "surprised" }
            ]
        }
    ];

    function setOverlay(message, isError) {
        if (!loadingOverlay) return;
        loadingOverlay.textContent = message;
        loadingOverlay.classList.toggle("error", Boolean(isError));
        loadingOverlay.classList.remove("hidden");
    }

    function hideOverlay() {
        if (loadingOverlay) loadingOverlay.classList.add("hidden");
    }

    function showHint(message) {
        state.interactionHint = message || "";
        if (!interactionHint) return;
        interactionHint.textContent = state.interactionHint;
        interactionHint.classList.toggle("hidden", !state.interactionHint);
    }

    function loadGameAsset(key, source, label) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                assets[key] = image;
                resolve(image);
            };
            image.onerror = () => reject(new Error(`${label}載入失敗（${source}）`));
            image.src = source;
        });
    }

    async function loadAssets() {
        const results = await Promise.allSettled(
            assetList.map(([key, source, label]) => loadGameAsset(key, source, label))
        );

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                state.assetFailures.push(result.reason.message);
                console.error(result.reason);
            } else {
                const [key] = assetList[index];
                const image = result.value;
                if (!image.naturalWidth || !image.naturalHeight) {
                    state.assetFailures.push(`${key} 圖片尺寸無效`);
                    delete assets[key];
                }
            }
        });

        if (!assets.map || !assets.player) {
            setOverlay(
                `必要圖片無法載入，遊戲暫時不能開始。\n${state.assetFailures.join("\n")}`,
                true
            );
            return;
        }

        state.npcList = npcDefinitions
            .filter((npc) => assets[npc.asset])
            .map((npc) => ({ ...npc, image: assets[npc.asset] }));
        state.bandit.image = assets.bandit || null;
        state.ready = true;

        if (state.assetFailures.length) {
            setOverlay(
                `部分圖片載入失敗，相關角色或戰鬥可能無法使用：\n${state.assetFailures.join("\n")}`,
                true
            );
            window.setTimeout(hideOverlay, 6500);
        } else {
            hideOverlay();
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function distanceBetween(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function setMode(mode) {
        state.mode = mode;
        const inBattle = mode === "battle";
        battleStatus.classList.toggle("hidden", !inBattle);
        battleUI.classList.toggle("hidden", !inBattle);
        skillPanel.classList.add("hidden");
        dialoguePanel.classList.toggle("hidden", !state.dialogue);
        if (inBattle) showHint("");
    }

    function renderSkillList() {
        const b = state.battle;
        if (!b) return;
        skillList.replaceChildren();
        const availableSkills = martialArts.filter((skill) =>
            skill.unlocked && skill.requiredLevel <= state.player.level);
        if (!availableSkills.length) {
            const empty = document.createElement("div");
            empty.textContent = "目前尚未學會武學。";
            skillList.append(empty);
            return;
        }
        for (const skill of availableSkills) {
            const cooldown = b.skillCooldowns[skill.id] || 0;
            const enoughMp = b.playerMp >= skill.mpCost;
            const canUse = enoughMp && cooldown === 0;
            const option = document.createElement("button");
            option.type = "button";
            option.className = `skillOption${canUse ? "" : " unavailable"}`;
            const name = document.createElement("span");
            name.className = "skillOptionName";
            name.textContent = `${skill.name}・${skill.type}`;
            const meta = document.createElement("span");
            meta.className = "skillOptionMeta";
            const rangeLabel = skill.targetType === "自己" ? "自身" : String(skill.range);
            meta.textContent = `內力：${skill.mpCost}　距離：${rangeLabel}${cooldown ? `　冷卻：${cooldown} 回合` : ""}${!enoughMp ? "　內力不足" : ""}`;
            const description = document.createElement("span");
            description.className = "skillOptionDescription";
            description.textContent = skill.description;
            option.append(name, meta, description);
            option.addEventListener("click", () => castSkill(skill.id));
            skillList.append(option);
        }
    }

    function openSkillPanel() {
        const b = state.battle;
        if (!b || b.phase !== "player") {
            if (b) {
                b.message = "目前不是少俠的行動時機。";
                updateBattleLabels();
            }
            return;
        }
        renderSkillList();
        skillPanel.classList.remove("hidden");
    }

    function getStatuses(b, actor) {
        return b.statuses[actor] || [];
    }

    function findStatus(b, actor, id) {
        return getStatuses(b, actor).find((effect) => effect.id === id);
    }

    function actorHp(b, actor) {
        return actor === "player" ? b.playerHp : b.banditHp;
    }

    function setActorHp(b, actor, value) {
        if (actor === "player") b.playerHp = value;
        else b.banditHp = value;
    }

    function actorMp(b, actor) {
        return actor === "player" ? b.playerMp : b.banditMp;
    }

    function setActorMp(b, actor, value) {
        if (actor === "player") b.playerMp = clamp(value, 0, state.player.maxMp);
        else b.banditMp = clamp(value, 0, 60);
    }

    function restoreHp(b, actor, amount) {
        const healingStatus = findStatus(b, actor, "瘀");
        const multiplier = healingStatus ? (statusEffectDefinitions["瘀"].healingMultiplier || 1) : 1;
        const restored = Math.max(0, Math.floor(amount * multiplier));
        const maxHp = actor === "player" ? 100 : 100;
        setActorHp(b, actor, Math.min(maxHp, actorHp(b, actor) + restored));
        return restored;
    }

    function applyKnockback(b, sourceId, targetId, cells) {
        const source = b[sourceId];
        const target = b[targetId];
        if (!source || !target) return false;
        let dc = Math.sign(target.col - source.col);
        let dr = Math.sign(target.row - source.row);
        if (dc && dr) dr = 0;
        if (!dc && !dr) dr = target.row === 0 ? 1 : -1;
        let destination = { ...target };
        for (let step = 0; step < cells; step += 1) {
            const next = { col: destination.col + dc, row: destination.row + dr };
            if (next.col < 0 || next.col >= BOARD.cols || next.row < 0 || next.row >= BOARD.rows) break;
            const otherId = targetId === "player" ? "bandit" : "player";
            if (next.col === b[otherId].col && next.row === b[otherId].row) break;
            destination = next;
        }
        if (destination.col === target.col && destination.row === target.row) return false;
        b.pendingKnockback = { actor: targetId, destination };
        return true;
    }

    function applyStatusEffect(b, targetId, id, duration, potency = 1, sourceId = "player", extra = {}) {
        const definition = statusEffectDefinitions[id];
        if (!definition) return false;
        if (definition.instant) return applyKnockback(b, sourceId, targetId, extra.cells || 1);
        const remaining = Math.max(1, duration || 1);
        const statuses = getStatuses(b, targetId);
        const existing = statuses.find((status) => status.id === id);
        if (existing) {
            existing.remaining = Math.max(existing.remaining, remaining);
            existing.potency = Math.max(existing.potency, potency);
        } else {
            statuses.push({ id, remaining, potency, sourceId, fresh: targetId === sourceId });
        }
        return true;
    }

    function applySkillEffect(effect, b, sourceId, targetId, duration, damageDone, skill) {
        if (!effect) return;
        const effects = Array.isArray(effect) ? effect : [effect];
        for (const item of effects) {
            if (item.kind === "heal") {
                const restored = restoreHp(b, sourceId, item.amount || 0);
                b.message += ` 回復 ${restored} 點氣血。`;
            } else if (item.kind === "drainMp") {
                const drained = Math.min(actorMp(b, targetId), item.amount || 0);
                setActorMp(b, targetId, actorMp(b, targetId) - drained);
                setActorMp(b, sourceId, actorMp(b, sourceId) + drained);
                b.message += ` 吸取 ${drained} 點內力。`;
            } else if (item.kind === "lifeDrain") {
                const restored = restoreHp(b, sourceId, Math.floor(damageDone * (item.ratio || 0)));
                setActorMp(b, sourceId, actorMp(b, sourceId) + (item.mp || 0));
                b.message += ` 吸取氣血 ${restored} 點與內力 ${item.mp || 0} 點。`;
            } else if (item.kind === "status") {
                if (Math.random() <= (item.chance ?? 1)) {
                    const applied = applyStatusEffect(
                        b, targetId, item.id, skill.effectDuration || duration,
                        item.potency ?? 1, sourceId, item
                    );
                    if (applied) b.message += ` ${targetId === "player" ? "少俠" : "山賊"}受到「${item.id}」效果。`;
                } else {
                    b.message += ` 未能使敵人陷入${item.id}。`;
                }
            }
        }
    }

    function playSkillAnimation(animationId, sourceId = "player", targetId = "bandit", now = performance.now(), skillId = null) {
        const b = state.battle;
        if (!b) return;
        const profile = skillId && SKILL_VFX_PROFILES[skillId];
        if (profile) {
            activeEffects.push({
                kind: "skillSequence", name: animationId, skillId,
                start: now, duration: profile.duration, impactAt: profile.impactAt,
                sourceId, targetId, sound: profile.sound, soundPlayed: false
            });
            b.skillEffect = { id: animationId, sourceId, targetId, start: now,
                duration: profile.duration, cinematic: true };
            return;
        }
        if (animationId === "dragon") {
            activeEffects.push({
                kind: "dragonSequence", name: "dragon", start: now,
                duration: DRAGON_SEQUENCE.duration,
                impactAt: DRAGON_SEQUENCE.impactAt,
                sourceId, targetId, followSource: true, followTarget: true,
                soundPlayed: false
            });
            b.skillEffect = { id: animationId, sourceId, targetId, start: now,
                duration: SKILL_ANIMATION_DURATION, cinematic: true };
            return;
        }
        const sheetEffect = playEffect(animationId, {
            from: sourceId,
            to: targetId,
            followSource: true,
            followTarget: true,
            frameDuration: EFFECT_FRAME_DURATIONS[animationId] || EFFECT_FRAME_DURATION,
            size: animationId === "dragon" ? 230 : 180,
            travel: animationId === "dragon"
        }, now);
        sheetEffect.battleManaged = true;
        b.skillEffect = { id: animationId, sourceId, targetId, start: now,
            duration: SKILL_ANIMATION_DURATION, sheetEffect };
    }

    function playSkillSound(name) {
        const sound = assets.skillSounds?.[name];
        if (!sound || typeof sound.play !== "function") return false;
        try {
            const playback = sound.play();
            if (playback && typeof playback.catch === "function") playback.catch(() => {});
            return true;
        } catch (_error) {
            return false;
        }
    }

    window.playSkillSound = playSkillSound;

    function loadEffectSheet(name) {
        if (!/^[a-z0-9_-]+$/i.test(name)) return null;
        if (effectSheets.has(name)) return effectSheets.get(name);
        const entry = { image: null, ready: false, failed: false,
            frameWidth: EFFECT_FRAME_WIDTH, frameHeight: EFFECT_FRAME_HEIGHT };
        effectSheets.set(name, entry);
        const image = new Image();
        image.onload = () => {
            const frameWidth = image.naturalWidth / 4;
            const frameHeight = image.naturalHeight / 2;
            const standardSheet = image.naturalWidth === EFFECT_SHEET_WIDTH
                && image.naturalHeight === EFFECT_SHEET_HEIGHT;
            const squareBurstFrames = name === "dragon_burst"
                && Number.isFinite(frameWidth) && Math.abs(frameWidth - frameHeight) < 0.01;
            if (standardSheet || squareBurstFrames) {
                entry.image = image;
                entry.frameWidth = frameWidth;
                entry.frameHeight = frameHeight;
                entry.ready = true;
            } else {
                entry.failed = true;
            }
        };
        image.onerror = () => { entry.failed = true; };
        image.src = `assets/effects/${name}_8frame.png`;
        return entry;
    }

    function effectPoint(spec, battle) {
        if (typeof spec === "string") {
            if (battle && battle[spec] && Number.isFinite(battle[spec].col)) {
                const unit = visualTile(battle, spec, performance.now());
                return tilePoint(unit.col, unit.row);
            }
            if (spec === "player") return { x: state.player.x, y: state.player.y };
            if (spec === "bandit") return { x: state.bandit.x, y: state.bandit.y };
        }
        if (spec && Number.isFinite(spec.col) && Number.isFinite(spec.row)) return tilePoint(spec.col, spec.row);
        if (spec && Number.isFinite(spec.x) && Number.isFinite(spec.y)) return { x: spec.x, y: spec.y };
        return { x: WIDTH / 2, y: HEIGHT / 2 };
    }

    // Public, non-blocking effect API. Positions accept actor IDs, canvas points, or board cells.
    function playEffect(name, options = {}, now = performance.now()) {
        const duration = Math.max(16, Number(options.frameDuration) || EFFECT_FRAME_DURATIONS[name] || EFFECT_FRAME_DURATION);
        const battle = state.battle;
        const fromSpec = options.start ?? options.from ?? "player";
        const toSpec = options.target ?? options.end ?? options.to ?? "bandit";
        const followSource = Boolean(options.followSource ?? options.followPlayer);
        const followTarget = Boolean(options.followTarget ?? options.followEnemy);
        const effect = {
            name, sheet: loadEffectSheet(name), start: now,
            frameDuration: duration, duration: duration * EFFECT_FRAME_COUNT,
            fromSpec, toSpec,
            from: effectPoint(fromSpec, battle), to: effectPoint(toSpec, battle),
            followSource, followTarget, flipX: Boolean(options.flipX),
            size: Math.max(1, Number(options.size) || 180),
            travel: options.travel ?? name === "dragon",
            travelFrames: Math.max(1, Number(options.travelFrames) || EFFECT_FRAME_COUNT - 3),
            battleManaged: false
        };
        activeEffects.push(effect);
        return effect;
    }

    window.playEffect = playEffect;

    function currentEffectPoint(effect, endpoint, battle) {
        const follow = endpoint === "from" ? effect.followSource : effect.followTarget;
        if (!follow) return effect[endpoint];
        return effectPoint(endpoint === "from" ? effect.fromSpec : effect.toSpec, battle);
    }

    function drawEffectSprite(effect, battle, now) {
        if (!effect.sheet?.ready || !effect.sheet.image) {
            if (effect.name !== "dragon_burst") return false;
            const from = currentEffectPoint(effect, "from", battle);
            const to = currentEffectPoint(effect, "to", battle);
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy) || 1;
            drawDragonBurst({ ...effect, x: from.x, y: from.y, directionX: dx / distance,
                directionY: dy / distance }, now);
            return true;
        }
        const elapsed = now - effect.start;
        if (elapsed < 0 || elapsed >= effect.duration) return true;
        const framePosition = elapsed / effect.frameDuration;
        const frameIndex = Math.min(EFFECT_FRAME_COUNT - 1, Math.floor(framePosition));
        const frameProgress = framePosition - frameIndex;
        const source = currentEffectPoint(effect, "from", battle);
        const target = currentEffectPoint(effect, "to", battle);
        const travelFrames = effect.travel ? effect.travelFrames : 0;
        const progress = effect.travel
            ? Math.min(1, (frameIndex + frameProgress) / travelFrames)
            : 1;
        const x = source.x + (target.x - source.x) * progress;
        const y = source.y + (target.y - source.y) * progress;
        const frameWidth = effect.sheet.frameWidth || EFFECT_FRAME_WIDTH;
        const frameHeight = effect.sheet.frameHeight || EFFECT_FRAME_HEIGHT;
        const column = frameIndex % 4;
        const row = Math.floor(frameIndex / 4);
        const burstScale = effect.travel && frameIndex >= travelFrames
            ? 1 + Math.min(0.35, (frameIndex - travelFrames + frameProgress) * 0.12) : 1;
        const size = effect.size * burstScale;
        context.save();
        context.globalAlpha = Math.max(0, 1 - Math.max(0, framePosition - 6) / 2);
        if (effect.flipX) {
            context.translate(x, y);
            context.scale(-1, 1);
            context.drawImage(effect.sheet.image,
                column * frameWidth, row * frameHeight, frameWidth, frameHeight,
                -size / 2, -size / 2, size, size);
        } else {
            context.drawImage(effect.sheet.image,
                column * frameWidth, row * frameHeight, frameWidth, frameHeight,
                x - size / 2, y - size / 2, size, size);
        }
        context.restore();
        return true;
    }

    function drawActiveEffects(now) {
        for (let i = activeEffects.length - 1; i >= 0; i -= 1) {
            const effect = activeEffects[i];
            if (now - effect.start >= effect.duration) {
                activeEffects.splice(i, 1);
                continue;
            }
            if (effect.kind === "dragonSequence") {
                if (!effect.soundPlayed && now - effect.start >= effect.impactAt) {
                    effect.soundPlayed = true;
                    playSkillSound("dragon_impact");
                }
                drawDragonSequence(effect, state.battle, now);
                continue;
            }
            if (effect.kind === "skillSequence") {
                if (!effect.soundPlayed && now - effect.start >= effect.impactAt) {
                    effect.soundPlayed = true;
                    playSkillSound(effect.sound);
                }
                drawSkillVfxSequence(effect, state.battle, now);
                continue;
            }
            if (effect.kind === "dragonBurst") {
                drawEffectSprite(effect, state.battle, now);
                continue;
            }
            if (!effect.battleManaged && !drawEffectSprite(effect, state.battle, now)) {
                const progress = clamp((now - effect.start) / effect.duration, 0, 1);
                const source = currentEffectPoint(effect, "from", state.battle);
                const target = currentEffectPoint(effect, "to", state.battle);
                const travelProgress = effect.travel ? Math.min(1, progress / 0.625) : 1;
                const x = source.x + (target.x - source.x) * travelProgress;
                const y = source.y + (target.y - source.y) * travelProgress;
                const pulse = Math.sin(progress * Math.PI);
                context.save();
                context.globalAlpha = 0.25 + pulse * 0.65;
                context.strokeStyle = effect.name === "ice_palm" ? "#9cecff"
                    : effect.name === "dark_absorb" ? "#c394ff" : "#ffd47a";
                context.fillStyle = context.strokeStyle;
                context.lineWidth = 5;
                context.shadowColor = context.strokeStyle;
                context.shadowBlur = 18;
                context.beginPath();
                context.ellipse(x, y - 12, 18 + pulse * 30, 10 + pulse * 16, 0, 0, Math.PI * 2);
                context.stroke();
                if (effect.travel) {
                    context.beginPath();
                    context.moveTo(source.x, source.y - 12);
                    context.quadraticCurveTo((source.x + x) / 2, source.y - 48 * pulse, x, y - 12);
                    context.stroke();
                }
                context.restore();
            }
        }
    }

    function drawSkillVfxSequence(effect, battle, now) {
        if (!battle) return;
        const age = now - effect.start;
        const progress = clamp(age / effect.duration, 0, 1);
        const sourceTile = visualTile(battle, effect.sourceId, now);
        const targetTile = visualTile(battle, effect.targetId, now);
        const source = tilePoint(sourceTile.col, sourceTile.row);
        const target = tilePoint(targetTile.col, targetTile.row);
        const isSelf = effect.skillId === "nine_sun";
        const center = isSelf ? source : target;
        const impactFade = clamp(1 - Math.max(0, age - effect.impactAt) / (effect.duration - effect.impactAt), 0, 1);

        context.save();
        context.globalCompositeOperation = "lighter";
        if (effect.skillId === "ice_palm") {
            const color = "#9cecff";
            if (age < effect.impactAt) {
                const charge = clamp(age / 500, 0, 1);
                const handX = source.x + (target.x - source.x) * 0.18;
                const handY = source.y - 27;
                context.globalAlpha = 0.25 + charge * 0.65;
                context.strokeStyle = color;
                context.fillStyle = "#e8fcff";
                context.shadowColor = color;
                context.shadowBlur = 14 + charge * 18;
                context.lineWidth = 3 + charge * 3;
                context.beginPath();
                context.ellipse(source.x, source.y - 12, 20 + charge * 24, 11 + charge * 14, 0, 0, Math.PI * 2);
                context.stroke();
                for (let i = 0; i < 5; i += 1) {
                    const angle = age * 0.006 + i * Math.PI * 2 / 5;
                    const radius = 22 + charge * 18;
                    context.globalAlpha = 0.35 + charge * 0.55;
                    context.beginPath();
                    context.arc(source.x + Math.cos(angle) * radius, source.y - 18 + Math.sin(angle) * radius * 0.55, 2.5 + charge * 2, 0, Math.PI * 2);
                    context.fill();
                }
                if (age > 350) {
                    const strike = clamp((age - 350) / 300, 0, 1);
                    context.globalAlpha = 0.25 + strike * 0.65;
                    context.lineWidth = 5 + strike * 4;
                    context.beginPath();
                    context.moveTo(handX, handY);
                    context.quadraticCurveTo(handX + (target.x - handX) * 0.55, handY - 34, target.x, target.y - 12);
                    context.stroke();
                }
            } else {
                const hit = age - effect.impactAt;
                const burst = clamp(hit / 150, 0, 1);
                context.globalAlpha = impactFade * (0.7 - burst * 0.4);
                context.shadowColor = color;
                context.shadowBlur = 24;
                context.fillStyle = "#eaffff";
                context.beginPath();
                context.ellipse(center.x, center.y - 18, 25 + burst * 40, 12 + burst * 18, 0, 0, Math.PI * 2);
                context.fill();
                context.strokeStyle = color;
                context.lineWidth = 3;
                context.beginPath();
                context.ellipse(center.x, center.y - 12, 24 + burst * 54, 10 + burst * 25, 0, 0, Math.PI * 2);
                context.stroke();
                for (let i = 0; i < 8; i += 1) {
                    const angle = i * Math.PI / 4 + 0.2;
                    const radius = 15 + burst * 42;
                    context.globalAlpha = impactFade * (0.8 - burst * 0.45);
                    context.beginPath();
                    context.moveTo(center.x + Math.cos(angle) * radius, center.y - 16 + Math.sin(angle) * radius * 0.45);
                    context.lineTo(center.x + Math.cos(angle) * (radius + 11), center.y - 16 + Math.sin(angle) * (radius + 11) * 0.45);
                    context.lineWidth = 3;
                    context.stroke();
                }
            }
        } else if (effect.skillId === "nine_yin") {
            const color = "#b782ff";
            if (age < effect.impactAt) {
                const charge = clamp(age / 650, 0, 1);
                context.strokeStyle = color;
                context.shadowColor = color;
                context.shadowBlur = 18 + charge * 20;
                context.lineWidth = 3 + charge * 2;
                context.globalAlpha = 0.3 + charge * 0.55;
                context.beginPath();
                context.ellipse(source.x, source.y - 13, 19 + charge * 20, 12 + charge * 13, age * 0.001, 0, Math.PI * 2);
                context.stroke();
                for (let i = 0; i < 6; i += 1) {
                    const angle = age * 0.0025 + i * Math.PI / 3;
                    const radius = 38 - charge * 12;
                    context.globalAlpha = 0.3 + charge * 0.45;
                    context.fillStyle = i % 2 ? "#e2ceff" : color;
                    context.beginPath();
                    context.arc(source.x + Math.cos(angle) * radius, source.y - 18 + Math.sin(angle) * radius * 0.55, 3, 0, Math.PI * 2);
                    context.fill();
                }
                if (age > 630) {
                    const release = clamp((age - 630) / (effect.impactAt - 630), 0, 1);
                    context.globalAlpha = release * 0.8;
                    context.lineWidth = 12 * (1 - release * 0.5);
                    context.beginPath();
                    context.moveTo(source.x + 10, source.y - 20);
                    context.quadraticCurveTo((source.x + target.x) / 2, (source.y + target.y) / 2 - 35, target.x, target.y - 16);
                    context.stroke();
                }
            } else {
                const hit = age - effect.impactAt;
                const radius = 16 + hit * 0.12;
                context.globalAlpha = impactFade * 0.65;
                context.strokeStyle = color;
                context.shadowColor = color;
                context.shadowBlur = 25;
                context.lineWidth = 8 * impactFade;
                context.beginPath();
                context.ellipse(center.x, center.y - 18, radius, radius * 0.55, 0, 0, Math.PI * 2);
                context.stroke();
                for (let i = 0; i < 7; i += 1) {
                    const angle = i * Math.PI * 2 / 7 - hit * 0.002;
                    const travel = 22 + Math.min(hit, 180) * 0.23;
                    context.globalAlpha = impactFade * 0.55;
                    context.beginPath();
                    context.arc(center.x + Math.cos(angle) * travel, center.y - 18 + Math.sin(angle) * travel * 0.55, 3.5, 0, Math.PI * 2);
                    context.fill();
                }
            }
        } else if (effect.skillId === "nine_sun") {
            const color = "#ffd76b";
            const charge = clamp(age / effect.impactAt, 0, 1);
            const rise = clamp((age - 300) / 650, 0, 1);
            context.strokeStyle = color;
            context.shadowColor = color;
            context.shadowBlur = 18 + charge * 26;
            context.lineWidth = 3 + charge * 3;
            context.globalAlpha = 0.22 + charge * 0.58;
            context.beginPath();
            context.ellipse(source.x, source.y - 4, 20 + charge * 36, 8 + charge * 14, 0, 0, Math.PI * 2);
            context.stroke();
            if (age > 300) {
                for (let i = 0; i < 4; i += 1) {
                    const sway = Math.sin(age * 0.006 + i * 1.7) * (8 + rise * 5);
                    const x = source.x + (i - 1.5) * 13;
                    context.globalAlpha = 0.18 + rise * 0.42;
                    context.lineWidth = 3 + rise * 2;
                    context.beginPath();
                    context.moveTo(x, source.y - 5);
                    context.bezierCurveTo(x + sway, source.y - 28, x - sway, source.y - 54, source.x + sway * 0.4, source.y - 82);
                    context.stroke();
                }
            }
            if (age > 720) {
                const core = clamp((age - 720) / 390, 0, 1);
                const coreY = source.y - 39;
                const gradient = context.createRadialGradient(source.x, coreY, 2, source.x, coreY, 28 + core * 12);
                gradient.addColorStop(0, "rgba(255,255,235,0.95)");
                gradient.addColorStop(0.35, "rgba(255,215,107,0.78)");
                gradient.addColorStop(1, "rgba(255,185,42,0)");
                context.globalAlpha = 0.4 + core * 0.6;
                context.fillStyle = gradient;
                context.beginPath();
                context.arc(source.x, coreY, 30 + core * 12, 0, Math.PI * 2);
                context.fill();
            }
            if (age >= effect.impactAt) {
                const after = age - effect.impactAt;
                context.globalAlpha = impactFade * 0.6;
                context.lineWidth = 4;
                context.beginPath();
                context.ellipse(source.x, source.y - 38, 27 + after * 0.12, 18 + after * 0.06, 0, 0, Math.PI * 2);
                context.stroke();
                for (let i = 0; i < 8; i += 1) {
                    const angle = i * Math.PI / 4 + after * 0.002;
                    const radius = 24 + Math.min(after, 200) * 0.11;
                    context.globalAlpha = impactFade * 0.65;
                    context.fillStyle = i % 2 ? "#fff5bd" : color;
                    context.beginPath();
                    context.arc(source.x + Math.cos(angle) * radius, source.y - 38 + Math.sin(angle) * radius * 0.55, 3, 0, Math.PI * 2);
                    context.fill();
                }
            }
        }
        context.restore();
    }

    function startDragonBurst(battle, sourceId, targetId, now) {
        const source = tilePoint(battle[sourceId].col, battle[sourceId].row);
        const origin = tilePoint(battle[targetId].col, battle[targetId].row);
        const dx = origin.x - source.x;
        const dy = origin.y - source.y;
        const distance = Math.hypot(dx, dy) || 1;
        const from = { x: origin.x, y: origin.y - 25 };
        const to = { x: from.x + dx / distance * 155, y: from.y + dy / distance * 155 };
        const effect = playEffect("dragon_burst", {
            from, to,
            frameDuration: EFFECT_FRAME_DURATIONS.dragon_burst,
            size: 140,
            travel: true,
            travelFrames: 6,
            flipX: dx < 0
        }, now);
        effect.kind = "dragonBurst";
        activeEffects.splice(activeEffects.indexOf(effect), 1);
        activeEffects.unshift(effect);
    }

    function drawDragonBurst(effect, now) {
        const progress = clamp((now - effect.start) / effect.duration, 0, 1);
        const travel = 155 * (1 - Math.pow(1 - progress, 3));
        const fade = progress < 0.66 ? 1 : 1 - (progress - 0.66) / 0.34;
        const expansion = 1.05 + 1.15 * clamp(progress / 0.23, 0, 1);
        const x = effect.x + effect.directionX * travel;
        const y = effect.y + effect.directionY * travel;
        const angle = Math.atan2(effect.directionY, effect.directionX);
        const jawOpen = 2 + 4 * clamp((progress - 0.18) / 0.4, 0, 1);
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.scale(expansion, expansion);
        context.globalAlpha = clamp(fade, 0, 1);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.shadowColor = "#ffbf32";
        context.shadowBlur = 30;

        // A soft, flowing qi aura frames the silhouette without filling it like a shell.
        const emergence = 1 - clamp(progress / 0.24, 0, 1);
        const aura = context.createRadialGradient(18, -5, 4, 18, -5, 72);
        aura.addColorStop(0, `rgba(255,255,220,${0.72 + emergence * 0.22})`);
        aura.addColorStop(0.3, `rgba(255,194,48,${0.38 + emergence * 0.3})`);
        aura.addColorStop(1, "rgba(255,170,24,0)");
        context.fillStyle = aura;
        context.beginPath(); context.ellipse(20, -4, 70, 43, 0, 0, Math.PI * 2); context.fill();

        // Back-swept flame mane: several tapered wisps behind the head, never a body coil.
        context.strokeStyle = "rgba(255,205,76,.82)";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(-14, -18); context.bezierCurveTo(-32, -37, -49, -30, -65, -43);
        context.moveTo(-19, -8); context.bezierCurveTo(-39, -18, -52, -11, -72, -20);
        context.moveTo(-20, 3); context.bezierCurveTo(-40, 17, -56, 11, -71, 23);
        context.stroke();
        context.strokeStyle = "rgba(255,246,186,.9)"; context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-25, -19); context.quadraticCurveTo(-47, -38, -61, -39);
        context.moveTo(-25, 5); context.quadraticCurveTo(-48, 18, -67, 21);
        context.stroke();

        // Long, narrow Chinese-dragon muzzle and arched brow; the face tapers forward.
        const face = context.createLinearGradient(0, -31, 54, 14);
        face.addColorStop(0, "rgba(255,235,132,.92)");
        face.addColorStop(0.55, "rgba(255,188,41,.88)");
        face.addColorStop(1, "rgba(255,223,105,.82)");
        context.fillStyle = face;
        context.beginPath();
        context.moveTo(-28, -5);
        context.quadraticCurveTo(-34, -19, -21, -30);
        context.quadraticCurveTo(-7, -39, 8, -29);
        context.quadraticCurveTo(20, -28, 28, -20);
        context.quadraticCurveTo(42, -18, 55, -15);
        context.lineTo(83, -11);
        context.quadraticCurveTo(94, -10, 100, -5);
        context.quadraticCurveTo(92, -1, 79, -2);
        context.quadraticCurveTo(56, -5, 37, -4);
        context.quadraticCurveTo(19, 0, 5, 8);
        context.quadraticCurveTo(-12, 14, -25, 5);
        context.quadraticCurveTo(-33, 1, -28, -5);
        context.closePath();
        context.fill();
        context.strokeStyle = "rgba(255,249,199,.95)"; context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(-22, -16); context.quadraticCurveTo(9, -32, 36, -15);
        context.quadraticCurveTo(65, -12, 94, -6);
        context.stroke();

        // Slender backward-growing antlers with coral-like branches, not blunt horns.
        context.strokeStyle = "#fff0a0"; context.lineWidth = 3.5;
        context.beginPath();
        context.moveTo(-8, -29); context.bezierCurveTo(-19, -43, -26, -54, -41, -58);
        context.moveTo(-24, -44); context.quadraticCurveTo(-31, -47, -36, -54);
        context.moveTo(-15, -39); context.quadraticCurveTo(-12, -49, -15, -55);
        context.moveTo(8, -30); context.bezierCurveTo(3, -44, -3, -52, -16, -59);
        context.moveTo(-1, -46); context.quadraticCurveTo(7, -48, 10, -55);
        context.stroke();

        // Fine open mouth line and a slim lower lip; keep the jaw light and un-clawed.
        context.strokeStyle = "rgba(104,42,9,.95)"; context.lineWidth = 3;
        context.beginPath();
        context.moveTo(38, -2); context.quadraticCurveTo(61, -1 + jawOpen * 0.15, 90, -5);
        context.stroke();
        context.strokeStyle = "#ffe89a"; context.lineWidth = 4;
        context.beginPath();
        context.moveTo(40, 2 + jawOpen); context.quadraticCurveTo(62, 8 + jawOpen, 88, -1 + jawOpen);
        context.stroke();
        context.strokeStyle = "#fff8d2"; context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(54, 0); context.lineTo(58, 4 + jawOpen * 0.35);
        context.moveTo(70, -1); context.lineTo(74, 3 + jawOpen * 0.35);
        context.stroke();

        // Paired long whiskers sweep back from the muzzle in the airstream.
        context.strokeStyle = "rgba(255,244,181,.96)"; context.lineWidth = 3.2;
        context.beginPath();
        context.moveTo(60, -8); context.bezierCurveTo(35, -23, 14, -28, -16, -35);
        context.moveTo(61, -3); context.bezierCurveTo(34, 12, 12, 18, -20, 21);
        context.stroke();
        context.strokeStyle = "rgba(255,213,89,.9)"; context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(53, -6); context.quadraticCurveTo(23, -31, -11, -39);
        context.moveTo(55, 0); context.quadraticCurveTo(20, 22, -16, 28);
        context.stroke();

        // Narrow platinum eyes, twin nose vents and just a few energy scale marks.
        context.fillStyle = "rgba(255,244,178,.98)";
        context.beginPath(); context.moveTo(8, -20); context.quadraticCurveTo(17, -25, 25, -20);
        context.quadraticCurveTo(17, -17, 8, -20); context.fill();
        context.fillStyle = "#fff";
        context.beginPath(); context.ellipse(17, -21, 4.5, 1.25, -0.08, 0, Math.PI * 2); context.fill();
        context.fillStyle = "rgba(255,247,198,.88)";
        context.beginPath(); context.arc(94, -8, 1.5, 0, Math.PI * 2); context.arc(88, -7, 1.2, 0, Math.PI * 2); context.fill();
        context.strokeStyle = "rgba(255,247,195,.78)"; context.lineWidth = 1.5;
        context.beginPath();
        context.arc(-1, -2, 7, -0.1, 0.6);
        context.arc(7, 0, 6, -0.1, 0.6);
        context.arc(-8, 2, 5, -0.1, 0.6);
        context.stroke();

        for (let i = 0; i < 7; i += 1) {
            const particleFade = Math.max(0, 1 - progress * 1.35 - i * 0.08);
            context.globalAlpha = clamp(fade * particleFade, 0, 1);
            context.fillStyle = i % 2 ? "#fff1a7" : "#ffd24b";
            context.beginPath();
            context.arc(-43 - i * 8, Math.sin(i * 2 + progress * 12) * (5 + i * 1.7), 2.4 - i * 0.17, 0, Math.PI * 2);
            context.fill();
        }
        context.restore();
    }

    function dragonEffectPoints(effect, battle) {
        const source = battle && battle[effect.sourceId]
            ? tilePoint(visualTile(battle, effect.sourceId, performance.now()).col,
                visualTile(battle, effect.sourceId, performance.now()).row)
            : effectPoint(effect.sourceId, battle);
        const target = battle && battle[effect.targetId]
            ? tilePoint(visualTile(battle, effect.targetId, performance.now()).col,
                visualTile(battle, effect.targetId, performance.now()).row)
            : effectPoint(effect.targetId, battle);
        return { source, target };
    }

    function drawDragonSequence(effect, battle, now) {
        const elapsed = Math.max(0, now - effect.start);
        const { source, target } = dragonEffectPoints(effect, battle);
        const handX = source.x + (target.x >= source.x ? 13 : -13);
        const handY = source.y - 28;
        const chargeEnd = DRAGON_SEQUENCE.charge;
        const palmEnd = chargeEnd + DRAGON_SEQUENCE.palm;
        const pauseEnd = palmEnd + DRAGON_SEQUENCE.pause;
        const beamEnd = pauseEnd + DRAGON_SEQUENCE.beam;
        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";

        if (elapsed < chargeEnd) {
            const p = elapsed / chargeEnd;
            const radius = 13 + p * 27;
            const glow = context.createRadialGradient(source.x, source.y - 30, 2, source.x, source.y - 30, radius + 12);
            glow.addColorStop(0, `rgba(255,255,224,${0.35 + p * 0.55})`);
            glow.addColorStop(0.35, `rgba(255,194,55,${0.3 + p * 0.45})`);
            glow.addColorStop(1, "rgba(255,166,25,0)");
            context.fillStyle = glow;
            context.beginPath(); context.arc(source.x, source.y - 30, radius + 12, 0, Math.PI * 2); context.fill();
            context.strokeStyle = `rgba(255,215,105,${0.35 + p * 0.55})`;
            context.lineWidth = 2 + p * 2;
            context.beginPath(); context.ellipse(source.x, source.y - 27, radius, radius * 0.55, 0, 0, Math.PI * 2); context.stroke();
            for (let i = 0; i < 7; i += 1) {
                const angle = i * Math.PI * 2 / 7 + p * 5;
                const orbit = radius * (0.72 + 0.1 * Math.sin(p * 9 + i));
                const x = source.x + Math.cos(angle) * orbit;
                const y = source.y - 30 + Math.sin(angle) * orbit * 0.55;
                context.globalAlpha = 0.35 + p * 0.65;
                context.fillStyle = "#fff2b0";
                context.shadowColor = "#ffc33d"; context.shadowBlur = 12;
                context.beginPath(); context.arc(x, y, 1.5 + p * 2, 0, Math.PI * 2); context.fill();
            }
        } else if (elapsed < palmEnd) {
            const p = (elapsed - chargeEnd) / DRAGON_SEQUENCE.palm;
            const dx = target.x - handX;
            const dy = target.y - 20 - handY;
            const reach = 0.18 + p * 0.82;
            const endX = handX + dx * reach;
            const endY = handY + dy * reach;
            context.globalAlpha = 1 - p * 0.22;
            context.shadowColor = "#ffe071"; context.shadowBlur = 25;
            context.strokeStyle = "rgba(255,239,169,.95)"; context.lineWidth = 27 * (1 - p * 0.4);
            context.beginPath(); context.moveTo(handX, handY); context.lineTo(endX, endY); context.stroke();
            context.strokeStyle = "#fffdf0"; context.lineWidth = 7 * (1 - p * 0.3);
            context.beginPath(); context.moveTo(handX, handY); context.lineTo(endX, endY); context.stroke();
            for (let i = 0; i < 3; i += 1) {
                context.globalAlpha = 0.75;
                context.lineWidth = 3;
                context.beginPath(); context.moveTo(handX - 5, handY + (i - 1) * 9);
                context.lineTo(endX, endY + (i - 1) * 13); context.stroke();
            }
        } else if (elapsed < pauseEnd) {
            const fade = 1 - (elapsed - palmEnd) / DRAGON_SEQUENCE.pause;
            context.globalAlpha = fade * 0.8;
            context.fillStyle = "#fff5c6"; context.shadowColor = "#ffc941"; context.shadowBlur = 18;
            context.beginPath(); context.arc(handX, handY, 7 + fade * 5, 0, Math.PI * 2); context.fill();
        } else if (elapsed < beamEnd) {
            const p = (elapsed - pauseEnd) / DRAGON_SEQUENCE.beam;
            const top = 46;
            const bottom = top + (target.y - 12 - top) * p;
            const width = 54 + Math.sin(p * Math.PI) * 28;
            const beam = context.createLinearGradient(target.x - width, 0, target.x + width, 0);
            beam.addColorStop(0, "rgba(255,184,36,0)");
            beam.addColorStop(0.28, "rgba(255,200,61,.34)");
            beam.addColorStop(0.5, "rgba(255,252,218,.98)");
            beam.addColorStop(0.72, "rgba(255,200,61,.34)");
            beam.addColorStop(1, "rgba(255,184,36,0)");
            context.globalAlpha = 0.45 + p * 0.55;
            context.fillStyle = beam; context.shadowColor = "#ffd24c"; context.shadowBlur = 38;
            context.fillRect(target.x - width, top, width * 2, Math.max(0, bottom - top));
            context.globalAlpha = 0.6 + p * 0.4;
            context.fillStyle = "rgba(255,255,234,.96)";
            context.fillRect(target.x - 8, top, 16, Math.max(0, bottom - top));
            const impactGlow = context.createRadialGradient(target.x, bottom, 1, target.x, bottom, 58);
            impactGlow.addColorStop(0, `rgba(255,255,235,${0.25 + p * 0.7})`);
            impactGlow.addColorStop(1, "rgba(255,186,35,0)");
            context.fillStyle = impactGlow;
            context.beginPath(); context.arc(target.x, bottom, 58, 0, Math.PI * 2); context.fill();
        } else {
            const age = elapsed - beamEnd;
            const p = clamp(age / DRAGON_SEQUENCE.afterglow, 0, 1);
            const radius = 12 + p * 156;
            const alpha = 1 - p;
            if (age < DRAGON_SEQUENCE.shake) {
                const flash = 1 - age / DRAGON_SEQUENCE.shake;
                const flare = context.createRadialGradient(target.x, target.y - 10, 2, target.x, target.y - 10, 96);
                flare.addColorStop(0, `rgba(255,255,243,${flash})`);
                flare.addColorStop(0.25, `rgba(255,221,105,${flash * 0.88})`);
                flare.addColorStop(1, "rgba(255,196,60,0)");
                context.fillStyle = flare;
                context.beginPath(); context.arc(target.x, target.y - 10, 96, 0, Math.PI * 2); context.fill();
            }
            context.globalAlpha = alpha * 0.9;
            context.strokeStyle = "#ffe27c"; context.shadowColor = "#ffbd32"; context.shadowBlur = 19;
            context.lineWidth = Math.max(1.5, 5 * alpha);
            context.beginPath(); context.ellipse(target.x, target.y + 5, radius, radius * 0.36, 0, 0, Math.PI * 2); context.stroke();
            context.globalAlpha = alpha * 0.35;
            context.fillStyle = "#e6ad54";
            context.beginPath(); context.ellipse(target.x, target.y + 5, radius * 0.72, radius * 0.24, 0, 0, Math.PI * 2); context.fill();
            for (let i = 0; i < 12; i += 1) {
                const angle = i * Math.PI * 2 / 12;
                const travel = Math.min(1, p * 1.25);
                const distance = (24 + (i % 4) * 8) * travel;
                context.globalAlpha = alpha * (0.35 + (i % 3) * 0.18);
                context.fillStyle = i % 2 ? "#ffd76b" : "#fff3bd";
                context.shadowBlur = 10;
                context.beginPath();
                context.arc(target.x + Math.cos(angle) * distance,
                    target.y - 8 + Math.sin(angle) * distance * 0.48 - travel * (i % 3) * 7,
                    Math.max(0.8, 2.6 * alpha), 0, Math.PI * 2);
                context.fill();
            }
        }
        context.restore();
    }

    function dragonScreenShake(now) {
        const effect = activeEffects.find((entry) => entry.kind === "dragonSequence");
        if (!effect) return null;
        const age = now - effect.start - effect.impactAt;
        if (age < 0 || age >= DRAGON_SEQUENCE.shake) return null;
        const fade = 1 - age / DRAGON_SEQUENCE.shake;
        const step = Math.floor(age / 24);
        const direction = step % 2 ? 1 : -1;
        return { x: direction * 4.2 * fade, y: (step % 3 - 1) * 2.6 * fade };
    }

    function castSkill(skillId) {
        const b = state.battle;
        if (!b || b.phase !== "player") return;
        const skill = martialArts.find((entry) => entry.id === skillId && entry.unlocked);
        if (!skill || skill.requiredLevel > state.player.level) return;
        if (b.playerMp < skill.mpCost) {
            b.message = `內力不足，${skill.name}需要 ${skill.mpCost} 點內力。`;
            updateBattleLabels();
            return;
        }
        const cooldown = b.skillCooldowns[skill.id] || 0;
        if (cooldown > 0) {
            b.message = `${skill.name}還需冷卻 ${cooldown} 回合。`;
            updateBattleLabels();
            return;
        }
        const targetType = skill.targetType;
        const enemiesInRange = b.units.filter((unit) => unit.id !== "player"
            && manhattan(b.player, b[unit.id]) <= skill.range).map((unit) => unit.id);
        const targets = targetType === "自己" ? ["player"]
            : targetType === "範圍" ? enemiesInRange
                : enemiesInRange.slice(0, 1);
        if (targetType !== "自己" && !targets.length) {
            b.message = `${skill.name}距離不足，請先移動到 ${skill.range} 格內。`;
            updateBattleLabels();
            return;
        }
        b.playerMp -= skill.mpCost;
        if (skill.cooldown > 0) b.skillCooldowns[skill.id] = skill.cooldown;
        b.lastSkillId = skill.id;
        b.pendingKnockback = null;
        const targetId = targets[0];
        const now = performance.now();
        b.animation = {
            type: "playerSkill", skillId: skill.id, start: now,
            duration: SKILL_VFX_PROFILES[skill.id]?.duration
                ?? (skill.animation === "dragon" ? DRAGON_SEQUENCE.impactAt : SKILL_ANIMATION_DURATION),
            damageApplied: false, targetIds: targets
        };
        b.phase = "playerSkill";
        b.message = `少俠施展${skill.name}！`;
        skillPanel.classList.add("hidden");
        playSkillAnimation(skill.animation, "player", targetId, now, skill.id);
        updateBattleLabels();
    }

    function setDialoguePortrait(portraitKey, expression = "calm") {
        const portraitAssetKey = portraitAssetKeys[portraitKey];
        const portrait = portraitAssetKey && assets[portraitAssetKey];
        if (!portrait) {
            dialoguePortraitFrame.classList.add("hidden");
            dialoguePortraitFrame.style.backgroundImage = "none";
            return;
        }
        const cell = portraitExpressions[expression] || portraitExpressions.calm;
        dialoguePortraitFrame.style.backgroundImage = `url("${portrait.src}")`;
        dialoguePortraitFrame.style.backgroundSize = "480% 320%";
        dialoguePortraitFrame.style.backgroundRepeat = "no-repeat";
        dialoguePortraitFrame.style.backgroundPosition =
            `${portraitPositionX[cell.column]}% ${cell.row ? "72.7273%" : "0%"}`;
        dialoguePortrait.alt = `${portraitKey}肖像，${expression}`;
        dialoguePortraitFrame.classList.remove("hidden");
    }

    function renderDialogueLine() {
        const dialogue = state.dialogue;
        if (!dialogue) return;
        const line = dialogue.lines[dialogue.index];
        const entry = typeof line === "string" ? { text: line } : line;
        dialogueText.textContent = entry.text;
        setDialoguePortrait(dialogue.portraitKey, entry.expression || "calm");
        dialogueNext.textContent = dialogue.index < dialogue.lines.length - 1 ? "繼續" : "結束";
    }

    function beginDialogue(name, lines, portraitKey = null) {
        state.keys.clear();
        state.dialogue = { name, lines, index: 0, portraitKey };
        dialogueName.textContent = name;
        renderDialogueLine();
        dialoguePanel.classList.remove("hidden");
        showHint("");
    }

    function advanceDialogue() {
        if (!state.dialogue) return;
        const dialogue = state.dialogue;
        if (dialogue.index < dialogue.lines.length - 1) {
            dialogue.index += 1;
            renderDialogueLine();
            return;
        }
        state.dialogue = null;
        dialoguePanel.classList.add("hidden");
        dialoguePortraitFrame.classList.add("hidden");
        showHint("");
    }

    function updateBattleLabels() {
        if (!state.battle) return;
        playerHpLabel.textContent = String(state.battle.playerHp);
        banditHpLabel.textContent = String(state.battle.banditHp);
        playerMpLabel.textContent = String(state.battle.playerMp);
        banditMpLabel.textContent = String(state.battle.banditMp);
        const statusNames = { player: "少俠", bandit: "山賊" };
        battleEffectsLabel.textContent = Object.entries(state.battle.statuses)
            .flatMap(([actor, effects]) => effects.map((effect) =>
                `${statusNames[actor]}${effect.id}${effect.remaining}回合`))
            .join("　");
        battleMessage.textContent = state.battle.message;
        const canAct = state.battle.phase === "player";
        attackButton.disabled = !canAct;
        moveButton.disabled = !canAct;
        defendButton.disabled = !canAct;
        skillButton.disabled = !canAct;
        runButton.disabled = !canAct;
        if (!canAct) skillPanel.classList.add("hidden");
    }

    function enterBattle() {
        if (!assets.playerBattle || !assets.banditBattle) {
            showHint("戰鬥圖集尚未載入，請確認圖片檔案後重新整理。 ");
            return;
        }
        state.keys.clear();
        state.battle = {
            playerHp: state.player.hp,
            playerMp: state.player.mp,
            banditHp: 100,
            banditMp: 60,
            phase: "setup",
            phaseUntil: 0,
            message: "棋盤戰開始，依輕功高低安排行動順序。",
            origin: { x: state.player.x, y: state.player.y },
            player: { col: 1, row: 4 },
            bandit: { col: 6, row: 1 },
            units: [
                { id: "player", name: "少俠", agility: 80 },
                { id: "bandit", name: "山賊", agility: 50 }
            ],
            round: 0,
            turnQueue: [],
            action: null,
            animation: null,
            motion: null,
            defending: false,
            statuses: { player: [], bandit: [] },
            skillCooldowns: {},
            skillEffect: null,
            pendingKnockback: null
        };
        startRound(state.battle);
        updateBattleLabels();
        setMode("battle");
    }

    function finishBattle(result) {
        const battle = state.battle;
        if (!battle) return;
        state.player.hp = result === "defeat" ? 100 : battle.playerHp;
        state.player.mp = battle.playerMp;
        if (result === "defeat") {
            state.player.x = 320;
            state.player.y = 540;
        }
        state.battle = null;
        setMode("map");

        if (result === "victory") {
            state.banditDefeated = true;
            beginDialogue("戰鬥結果", [
                { text: "你擊退了山賊，村道暫時恢復平靜。第一場戰鬥告一段落。", expression: "happy" }
            ], "player");
        } else {
            beginDialogue("戰鬥結果", [
                { text: "你已無力再戰，被村民救回村中，氣血恢復。山賊仍在村道上。", expression: "sad" }
            ], "player");
        }
    }

    function tilePoint(col, row) {
        return { x: BOARD.centerX + (col - row) * BOARD.tileW / 2,
            y: BOARD.top + (col + row) * BOARD.tileH / 2 };
    }

    function manhattan(a, b) { return Math.abs(a.col - b.col) + Math.abs(a.row - b.row); }

    function incomingDamage(b, actor, rawDamage) {
        const guard = findStatus(b, actor, "護體");
        const reduction = guard ? clamp(guard.potency || 0, 0, 0.8) : 0;
        const defenseReduction = actor === "player" && b.defending ? 0.55 : 0;
        return Math.max(1, Math.floor(rawDamage * (1 - reduction) * (1 - defenseReduction)));
    }

    function beginBattleResult(b, result, now = performance.now()) {
        b.phase = result;
        b.animation = null;
        b.skillEffect = null;
        b.message = result === "victory" ? "山賊倒地，你勝出了！" : "你已無力再戰。";
        startActionAnimation(b, result, now);
    }

    function processTurnStart(b, actor) {
        const ticking = getStatuses(b, actor).filter((effect) =>
            statusEffectDefinitions[effect.id]?.damagePerTurn);
        for (const effect of ticking) {
            const damage = incomingDamage(b, actor, effect.potency || 4);
            setActorHp(b, actor, Math.max(0, actorHp(b, actor) - damage));
            b.message = `${actor === "player" ? "少俠" : "山賊"}受到${effect.id}影響，損失 ${damage} 點氣血。`;
            if (actorHp(b, actor) <= 0) {
                beginBattleResult(b, actor === "player" ? "defeat" : "victory");
                updateBattleLabels();
                return false;
            }
        }
        return true;
    }

    function endActorStatuses(b, actor) {
        for (const effect of getStatuses(b, actor)) {
            if (effect.fresh) effect.fresh = false;
            else effect.remaining -= 1;
        }
        b.statuses[actor] = getStatuses(b, actor).filter((effect) => effect.remaining > 0);
    }

    function startRound(b) {
        b.round += 1;
        b.turnQueue = b.units.slice().sort((a, c) => c.agility - a.agility).map((unit) => unit.id);
        beginNextTurn(b);
    }

    function beginNextTurn(b) {
        if (!b.turnQueue.length) { startRound(b); return; }
        const actor = b.turnQueue.shift();
        if (actor === "player") b.lastSkillId = null;
        b.phase = actor;
        b.action = null;
        b.message = `第 ${b.round} 回合：輪到${actor === "player" ? "少俠" : "山賊"}行動（輕功 ${b.units.find((unit) => unit.id === actor).agility}）。`;
        if (!processTurnStart(b, actor)) return;
        if (actor === "bandit") {
            b.phase = "enemyPrepare";
            b.phaseUntil = performance.now() + 280;
        }
        updateBattleLabels();
    }

    function completeActorTurn(b, actor = "player") {
        endActorStatuses(b, actor);
        if (actor === "player") {
            for (const skillId of Object.keys(b.skillCooldowns)) {
                if (skillId !== b.lastSkillId) b.skillCooldowns[skillId] = Math.max(0, b.skillCooldowns[skillId] - 1);
            }
            b.lastSkillId = null;
        }
        b.animation = null;
        b.skillEffect = null;
        b.motion = null;
        b.phase = "turnPause";
        b.phaseUntil = performance.now() + 260;
        b.action = null;
        updateBattleLabels();
    }

    const ACTION_FRAMES = {
        walk: [0, 1, 0, 1, 0],
        playerAttack: [0, 0, 3, 4, 5, 0],
        playerSkill: [0, 0, 3, 4, 5, 0],
        enemyAttack: [0, 0, 3, 4, 5, 0],
        hurt: [0, 6, 6, 0],
        victory: [0, 7, 7, 7]
    };

    function animationDuration(type) {
        return type === "playerAttack" || type === "enemyAttack" ? 1120
            : type === "hurt" ? 460 : type === "walk" ? MOVE_DURATION : 900;
    }

    function startActionAnimation(b, type, now) {
        b.animation = { type, start: now, duration: animationDuration(type) };
    }

    function frameAt(type, elapsed, duration) {
        const frames = ACTION_FRAMES[type] || [0];
        const frameDuration = duration / frames.length;
        return frames[Math.min(frames.length - 1, Math.floor(elapsed / frameDuration))];
    }

    function actorFrame(b, actor, now) {
        if (!b.animation) return 0;
        const elapsed = Math.max(0, now - b.animation.start);
        const duration = b.animation.duration;
        const type = b.animation.type;
        if (type === "playerAttack") {
            if (actor === "player") return frameAt("playerAttack", elapsed, duration);
            return elapsed > 440 && elapsed < 830 ? frameAt("hurt", elapsed - 440, 390) : 0;
        }
        if (type === "playerSkill") {
            if (actor === "player") return frameAt("playerSkill", elapsed, duration);
            return elapsed > 400 && elapsed < 780 ? frameAt("hurt", elapsed - 400, 380) : 0;
        }
        if (type === "enemyAttack") {
            if (actor === "bandit") return frameAt("enemyAttack", elapsed, duration);
            return elapsed > 440 && elapsed < 830 ? frameAt("hurt", elapsed - 440, 390) : 0;
        }
        if (type === "walk" && b.motion && actor === b.motion.actor) {
            return frameAt("walk", elapsed, duration);
        }
        if (type === "victory" && actor === "bandit") return 7;
        if (type === "defeat" && actor === "player") return 7;
        return 0;
    }

    function visualTile(b, actor, now) {
        const unit = b[actor];
        const motion = b.motion;
        if (!motion || motion.actor !== actor) return { col: unit.col, row: unit.row };
        const progress = clamp((now - motion.start) / motion.duration, 0, 1);
        // Knockback jumps forward immediately, then eases gently into its destination.
        const eased = motion.turnOwner
            ? 1 - Math.pow(1 - progress, 3)
            : progress * progress * (3 - 2 * progress);
        return {
            col: motion.from.col + (motion.to.col - motion.from.col) * eased,
            row: motion.from.row + (motion.to.row - motion.from.row) * eased
        };
    }

    function updateBattle(now) {
        const b = state.battle;
        if (!b) return;

        if (b.motion) {
            const elapsed = now - b.motion.start;
            if (elapsed >= b.motion.duration) {
                const motion = b.motion;
                b[motion.actor] = { ...motion.to };
                b.motion = null;
                b.animation = null;
                if (motion.turnOwner) completeActorTurn(b, motion.turnOwner);
                else if (motion.actor === "player") completeActorTurn(b, "player");
                else if (manhattan(b.bandit, b.player) <= 1) startEnemyAttack(b, now);
                else completeActorTurn(b, "bandit");
            }
        }

        if ((b.phase === "playerAttack" || b.phase === "enemyAttack") && b.animation) {
            const elapsed = now - b.animation.start;
            if (elapsed >= 520 && !b.animation.damageApplied) {
                b.animation.damageApplied = true;
                if (b.phase === "playerAttack") {
                    const damage = incomingDamage(b, "bandit", b.animation.damage);
                    b.banditHp = Math.max(0, b.banditHp - damage);
                    b.message = `少俠命中山賊，造成 ${damage} 點傷害。`;
                } else {
                    const damage = incomingDamage(b, "player", b.animation.damage);
                    b.playerHp = Math.max(0, b.playerHp - damage);
                    b.defending = false;
                    b.message = `山賊命中少俠，造成 ${damage} 點傷害。`;
                }
                updateBattleLabels();
            }
            if (elapsed >= b.animation.duration) {
                b.animation = null;
                if (b.banditHp <= 0) {
                    beginBattleResult(b, "victory", now);
                } else if (b.playerHp <= 0) {
                    beginBattleResult(b, "defeat", now);
                } else completeActorTurn(b, b.phase === "enemyAttack" ? "bandit" : "player");
            }
        }

        if (b.phase === "playerSkill" && b.animation) {
            const elapsed = now - b.animation.start;
            const skill = martialArts.find((entry) => entry.id === b.animation.skillId);
            const profile = skill && SKILL_VFX_PROFILES[skill.id];
            const dragonImpact = skill?.animation === "dragon";
            const impactTime = profile?.impactAt ?? (dragonImpact
                ? DRAGON_SEQUENCE.impactAt
                : b.animation.duration * 0.48);
            if (elapsed >= impactTime && !b.animation.damageApplied) {
                b.animation.damageApplied = true;
                if (skill) applySkillImpact(b, skill);
                // Keep damage and the visible impact response on this RAF tick.
                if (dragonImpact && b.pendingKnockback) {
                    const pending = b.pendingKnockback;
                    b.pendingKnockback = null;
                    startDragonBurst(b, "player", pending.actor, now);
                    if (b.banditHp > 0) {
                        startMotion(b, pending.actor, pending.destination, now, "player");
                        b.message = "金光轟然落下，掌勁震退山賊！";
                        updateBattleLabels();
                        return;
                    }
                }
            }
            if (elapsed >= b.animation.duration) {
                b.animation = null;
                b.skillEffect = null;
                if (b.banditHp <= 0) beginBattleResult(b, "victory", now);
                else if (b.playerHp <= 0) beginBattleResult(b, "defeat", now);
                else if (b.pendingKnockback) {
                    const pending = b.pendingKnockback;
                    b.pendingKnockback = null;
                    startMotion(b, pending.actor, pending.destination, now, "player");
                    b.message = "掌勁震退敵人！";
                } else completeActorTurn(b, "player");
            }
        }

        if (b.phase === "enemyPrepare" && now >= b.phaseUntil) {
            b.phaseUntil = 0;
            if (manhattan(b.bandit, b.player) <= 1) startEnemyAttack(b, now);
            else {
                let destination = { ...b.bandit };
                const slowed = findStatus(b, "bandit", "滯");
                const maxSteps = slowed ? 1 : 2;
                for (let step = 0; step < maxSteps && manhattan(destination, b.player) > 1; step += 1) {
                    const options = [[1,0],[-1,0],[0,1],[0,-1]]
                        .map(([dc, dr]) => ({ col: destination.col + dc, row: destination.row + dr }))
                        .filter((tile) => tile.col >= 0 && tile.col < BOARD.cols && tile.row >= 0 && tile.row < BOARD.rows
                            && !(tile.col === b.player.col && tile.row === b.player.row));
                    options.sort((a, c) => manhattan(a, b.player) - manhattan(c, b.player));
                    if (!options.length) break;
                    destination = options[0];
                }
                startMotion(b, "bandit", destination, now);
                b.message = "山賊踏步逼近！";
            }
        }

        if (b.phase === "turnPause" && now >= b.phaseUntil) {
            b.phaseUntil = 0;
            beginNextTurn(b);
        } else if ((b.phase === "victory" || b.phase === "defeat") && b.animation
            && now - b.animation.start >= b.animation.duration) {
            finishBattle(b.phase);
        }
        updateBattleLabels();
    }

    function startMotion(b, actor, target, now, turnOwner = null) {
        const from = { ...b[actor] };
        b.motion = { actor, from, to: target, start: now, duration: MOVE_DURATION, turnOwner };
        b.phase = turnOwner ? "skillKnockback" : actor === "player" ? "playerMove" : "enemyMove";
        startActionAnimation(b, "walk", now);
        b.animation.duration = b.motion.duration;
    }

    function startEnemyAttack(b, now) {
        const attackDown = findStatus(b, "bandit", "攻弱");
        const baseDamage = 16 + Math.floor(Math.random() * 9);
        const damage = Math.max(1, Math.floor(baseDamage * (1 - (attackDown?.potency || 0))));
        b.animation = { type: "enemyAttack", start: now, duration: 1120, damage, damageApplied: false };
        b.phase = "enemyAttack";
        b.message = b.defending ? "山賊攻來，少俠以守勢迎敵！" : "山賊舉刀，準備反擊！";
        updateBattleLabels();
    }

    function applySkillImpact(b, skill) {
        const targetIds = b.animation.targetIds || (skill.targetType === "自己" ? ["player"] : ["bandit"]);
        for (const targetId of targetIds) {
            let damageDone = 0;
            if (skill.damage > 0) {
                const baseDamage = skill.damage + Math.floor(Math.random() * 5);
                damageDone = incomingDamage(b, targetId, baseDamage);
                setActorHp(b, targetId, Math.max(0, actorHp(b, targetId) - damageDone));
                b.message = `少俠的${skill.name}命中，造成 ${damageDone} 點傷害。`;
            }
            applySkillEffect(skill.effect, b, "player", targetId, skill.effectDuration, damageDone, skill);
        }
        updateBattleLabels();
    }

    function chooseAction(action) {
        const b = state.battle;
        if (!b || b.phase !== "player") return;
        if (action === "move") {
            b.action = "move";
            b.message = "選擇亮起的格子移動（最多兩格）。";
        } else if (action === "attack") {
            if (manhattan(b.player, b.bandit) > 1) {
                b.message = "山賊不在攻擊範圍內，請先移動。";
            } else {
                const damage = 25 + Math.floor(Math.random() * 9);
                b.animation = { type: "playerAttack", start: performance.now(), duration: 1120, damage, damageApplied: false };
                b.phase = "playerAttack";
                b.message = "少俠蓄勢出招！";
            }
        }
        updateBattleLabels();
    }

    function playerAttack() { chooseAction("attack"); }

    function defend() {
        const b = state.battle;
        if (!b || b.phase !== "player") return;
        b.defending = true;
        completeActorTurn(b);
        b.message = "少俠擺好架勢，防禦山賊下一次攻擊。";
        updateBattleLabels();
    }

    function battleTileClick(col, row) {
        const b = state.battle;
        if (!b || b.phase !== "player" || b.action !== "move") return;
        const target = { col, row };
        if (manhattan(target, b.player) > 2 || (col === b.bandit.col && row === b.bandit.row)) return;
        b.action = null;
        startMotion(b, "player", target, performance.now());
        b.message = "少俠移步換位！";
        updateBattleLabels();
    }

    function handleBattleCanvasClick(event) {
        if (state.mode !== "battle" || !state.battle) return;
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * WIDTH / rect.width;
        const y = (event.clientY - rect.top) * HEIGHT / rect.height;
        for (let row = 0; row < BOARD.rows; row += 1) for (let col = 0; col < BOARD.cols; col += 1) {
            const p = tilePoint(col, row);
            if (Math.abs(x - p.x) / (BOARD.tileW / 2) + Math.abs(y - p.y) / (BOARD.tileH / 2) <= 1) {
                battleTileClick(col, row); return;
            }
        }
    }

    function runFromBattle() {
        const b = state.battle;
        if (!b || b.phase !== "player") return;
        const dx = b.origin.x - state.bandit.x;
        const dy = b.origin.y - state.bandit.y;
        const length = Math.hypot(dx, dy) || 1;
        state.player.x = clamp(b.origin.x + (dx / length) * 120, 48, WIDTH - 48);
        state.player.y = clamp(b.origin.y + (dy / length) * 120, 115, HEIGHT - 30);
        state.player.hp = b.playerHp; state.player.mp = b.playerMp; state.battle = null; setMode("map");
        beginDialogue("脫離戰鬥", [
            { text: "你趁山賊收招時退回村道，暫時脫離了戰鬥。", expression: "scared" }
        ], "player");
    }

    function closestNpc() {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const npc of state.npcList) {
            const distance = distanceBetween(state.player, npc);
            if (distance < nearestDistance) {
                nearest = npc;
                nearestDistance = distance;
            }
        }
        return nearest ? { npc: nearest, distance: nearestDistance } : null;
    }

    function interactWithNearbyNpc() {
        const nearby = closestNpc();
        if (nearby && nearby.distance <= NPC_INTERACT_DISTANCE) {
        beginDialogue(nearby.npc.name, nearby.npc.lines, nearby.npc.portrait);
        }
    }

    function handleKeyDown(event) {
        const key = event.key.toLowerCase();
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
            event.preventDefault();
        }
        if (event.repeat) return;

        if (state.dialogue) {
            if (["e", "enter", " "].includes(key)) {
                event.preventDefault();
                advanceDialogue();
            }
            return;
        }

        if (state.mode === "battle") {
            if (key === "escape" && !skillPanel.classList.contains("hidden")) {
                skillPanel.classList.add("hidden");
                return;
            }
            if (key === "a" || key === "enter") playerAttack();
            if (key === "m") chooseAction("move");
            if (key === "d") defend();
            if (key === "k") openSkillPanel();
            if (key === "r" || key === "escape") runFromBattle();
            if (state.battle?.action === "move") {
                const direction = {
                    arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0],
                    arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1]
                }[key];
                if (direction) battleTileClick(
                    state.battle.player.col + direction[0],
                    state.battle.player.row + direction[1]
                );
            }
            return;
        }

        if (key === "e") {
            interactWithNearbyNpc();
            return;
        }

        state.keys.add(key);
        // A brief tap still gives visible movement; holding a key continues at PLAYER_SPEED.
        const tapDirections = {
            arrowleft: [-1, 0],
            a: [-1, 0],
            arrowright: [1, 0],
            d: [1, 0],
            arrowup: [0, -1],
            w: [0, -1],
            arrowdown: [0, 1],
            s: [0, 1]
        };
        const direction = tapDirections[key];
        if (direction) {
            if (direction[0]) state.facing = direction[0] > 0 ? 1 : -1;
            state.player.x = clamp(state.player.x + direction[0] * 18, 48, WIDTH - 48);
            state.player.y = clamp(state.player.y + direction[1] * 18, 115, HEIGHT - 30);
        }
    }

    function handleKeyUp(event) {
        state.keys.delete(event.key.toLowerCase());
    }

    function movePlayer(deltaTime) {
        if (!state.ready || state.mode !== "map" || state.dialogue) {
            state.moving = false;
            return;
        }

        let dx = 0;
        let dy = 0;
        if (state.keys.has("arrowleft") || state.keys.has("a")) dx -= 1;
        if (state.keys.has("arrowright") || state.keys.has("d")) dx += 1;
        if (state.keys.has("arrowup") || state.keys.has("w")) dy -= 1;
        if (state.keys.has("arrowdown") || state.keys.has("s")) dy += 1;

        state.moving = dx !== 0 || dy !== 0;
        if (!state.moving) return;
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;
        if (dx) state.facing = dx > 0 ? 1 : -1;
        state.player.x = clamp(state.player.x + dx * PLAYER_SPEED * deltaTime, 48, WIDTH - 48);
        state.player.y = clamp(state.player.y + dy * PLAYER_SPEED * deltaTime, 115, HEIGHT - 30);
    }

    function updateMapInteractions() {
        if (!state.ready || state.mode !== "map" || state.dialogue) return;

        if (!state.banditDefeated && state.bandit.image) {
            const banditDistance = distanceBetween(state.player, state.bandit);
            if (banditDistance <= BANDIT_CONTACT_DISTANCE) {
                enterBattle();
                return;
            }
            if (banditDistance <= 145) {
                showHint("山賊就在前方，靠近便會進入戰鬥。");
                return;
            }
        }

        const nearby = closestNpc();
        if (nearby && nearby.distance <= 148) {
            showHint(nearby.distance <= NPC_INTERACT_DISTANCE
                ? `按 E 與${nearby.npc.name}交談。`
                : `靠近${nearby.npc.name}後按 E 交談。`);
            return;
        }

        showHint(state.assetFailures.length
            ? `部分素材載入失敗：${state.assetFailures[0]}`
            : "WASD／方向鍵移動；靠近人物後按 E 對話。");
    }

    function drawMapBackground() {
        if (!context) return;
        context.fillStyle = "#263b2b";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        const image = assets.map;
        if (!image || !image.naturalWidth || !image.naturalHeight) return;

        const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
        const sourceWidth = WIDTH / scale;
        const sourceHeight = HEIGHT / scale;
        const sourceX = (image.naturalWidth - sourceWidth) / 2;
        const sourceY = (image.naturalHeight - sourceHeight) / 2;
        try {
            context.drawImage(
                image,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                WIDTH,
                HEIGHT
            );
        } catch (error) {
            console.error("村莊地圖繪製失敗", error);
        }
        context.fillStyle = "rgba(8, 15, 12, 0.56)";
        context.fillRect(14, HEIGHT - 47, 235, 32);
        context.fillStyle = "#fff1c0";
        context.font = "bold 17px Microsoft JhengHei, sans-serif";
        context.textAlign = "left";
        context.fillText("新手村・村道", 27, HEIGHT - 25);
    }

    function drawNameTag(name, x, y, color) {
        context.save();
        context.font = "bold 15px Microsoft JhengHei, sans-serif";
        context.textAlign = "center";
        context.lineWidth = 4;
        context.strokeStyle = "rgba(0, 0, 0, 0.82)";
        context.strokeText(name, x, y);
        context.fillStyle = color;
        context.fillText(name, x, y);
        context.restore();
    }

    function drawMapActor(actor, image, label, color, now, isPlayer, facing = 1) {
        if (!image || !image.naturalWidth) return;
        const bob = isPlayer && state.moving ? Math.sin(now / 70) * 2 : 0;
        const width = isPlayer ? 72 : 64;
        const height = isPlayer ? 108 : 96;
        context.save();
        context.globalAlpha = 0.3;
        context.fillStyle = "#17150f";
        context.beginPath();
        context.ellipse(actor.x, actor.y - 3, width * 0.27, 9, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();

        context.save();
        if (facing < 0) {
            context.translate(actor.x * 2, 0);
            context.scale(-1, 1);
            try {
                context.drawImage(image, actor.x - width / 2, actor.y - height + bob, width, height);
            } catch (error) {
                console.error("角色圖片繪製失敗", error);
            }
        } else {
            try {
                context.drawImage(image, actor.x - width / 2, actor.y - height + bob, width, height);
            } catch (error) {
                console.error(`${label}圖片繪製失敗`, error);
            }
        }
        context.restore();
        drawNameTag(label, actor.x, actor.y - height - 4 + bob, color);
    }

    function drawMap(now) {
        drawMapBackground();
        const actors = state.npcList.map((npc) => ({
                actor: npc,
            image: npc.image,
            label: npc.name,
            color: "#fff0b2",
            isPlayer: false,
            facing: state.player.x < npc.x ? -1 : 1
        }));
        if (!state.banditDefeated && state.bandit.image) {
            actors.push({
                actor: state.bandit,
                image: state.bandit.image,
                label: "山賊",
                color: "#ffc0a7",
                isPlayer: false
                , facing: state.player.x < state.bandit.x ? -1 : 1
            });
        }
        actors.push({
            actor: state.player,
            image: assets.player,
            label: "少俠",
            color: "#d7e8ff",
            isPlayer: true
        });
        actors.sort((a, b) => a.actor.y - b.actor.y);
        for (const entry of actors) {
            drawMapActor(entry.actor, entry.image, entry.label, entry.color, now, entry.isPlayer, entry.facing ?? state.facing);
        }
    }

    function drawBattleBackground() {
        const bg=context.createLinearGradient(0,0,0,HEIGHT);
        bg.addColorStop(0,"#24313a"); bg.addColorStop(1,"#121a19");
        context.fillStyle=bg; context.fillRect(0,0,WIDTH,HEIGHT);
        context.fillStyle="rgba(205,180,128,.08)"; context.fillRect(0,110,WIDTH,HEIGHT-110);
    }

    function drawBattleSheet(image, frameIndex, centerX, bottomY, scale) {
        if (!image || !image.naturalWidth || !image.naturalHeight) return;
        const frameWidth = image.naturalWidth / SPRITE_COLUMNS;
        const frameHeight = image.naturalHeight / SPRITE_ROWS;
        const column = frameIndex % SPRITE_COLUMNS;
        const row = Math.floor(frameIndex / SPRITE_COLUMNS);
        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        try {
            context.drawImage(
                image,
                column * frameWidth,
                row * frameHeight,
                frameWidth,
                frameHeight,
                centerX - drawWidth / 2,
                bottomY - drawHeight,
                drawWidth,
                drawHeight
            );
        } catch (error) {
            console.error("戰鬥影格繪製失敗", error);
        }
    }

    function drawSkillAnimation(b, now) {
        const effect = b.skillEffect;
        if (!effect || effect.cinematic) return;
        const progress = clamp((now - effect.start) / effect.duration, 0, 1);
        const sourceTile = visualTile(b, effect.sourceId, now);
        const targetTile = visualTile(b, effect.targetId, now);
        const source = tilePoint(sourceTile.col, sourceTile.row);
        const target = tilePoint(targetTile.col, targetTile.row);
        const pulse = Math.sin(progress * Math.PI);
        const hasSpriteSheet = effect.sheetEffect?.sheet?.ready;
        if (hasSpriteSheet) {
            drawEffectSprite(effect.sheetEffect, b, now);
        } else {
            const palettes = {
                dragon: "#ffd47a", palm: "#fff0c0", ice_palm: "#9cecff",
                blade: "#eaf2ff", hidden_weapon: "#d9e5f4",
                absorb: "#87e8c1", dark_absorb: "#c394ff"
            };
            const color = palettes[effect.id] || "#f4dfa6";
            context.save();
            context.globalAlpha = 0.25 + pulse * 0.75;
            context.strokeStyle = color;
            context.fillStyle = color;
            context.lineWidth = effect.id === "dragon" ? 7 : 4;
            context.shadowColor = color;
            context.shadowBlur = 18;

            if (effect.id === "hidden_weapon") {
                const x = source.x + (target.x - source.x) * progress;
                const y = source.y + (target.y - source.y) * progress;
                for (let dart = 0; dart < 3; dart += 1) {
                    context.beginPath();
                    context.moveTo(x - 15, y - 9 + dart * 9);
                    context.lineTo(x + 13, y + dart * 9);
                    context.stroke();
                }
            } else if (effect.id === "blade" || effect.id === "sword") {
                context.beginPath();
                context.arc(target.x, target.y, 24 + pulse * 28, -Math.PI * 0.8, Math.PI * (0.15 + progress * 0.9));
                context.stroke();
            } else if (effect.id === "absorb" || effect.id === "dark_absorb") {
                const centerX = progress < 0.5 ? target.x : source.x;
                const centerY = progress < 0.5 ? target.y : source.y;
                for (let particle = 0; particle < 9; particle += 1) {
                    const angle = particle * (Math.PI * 2 / 9) + progress * 8;
                    const radius = 12 + (1 - progress) * 34;
                    context.beginPath();
                    context.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * 0.55, 3 + pulse * 2, 0, Math.PI * 2);
                    context.fill();
                }
            } else {
                const radius = 18 + pulse * (effect.id === "dragon" ? 50 : 34);
                context.beginPath();
                context.ellipse(target.x, target.y - 12, radius, radius * 0.48, 0, 0, Math.PI * 2);
                context.stroke();
                if (effect.id === "dragon" || effect.id === "ice_palm") {
                    context.beginPath();
                    context.moveTo(source.x, source.y - 15);
                    context.quadraticCurveTo((source.x + target.x) / 2, source.y - 55 * pulse, target.x, target.y - 15);
                    context.stroke();
                }
            }
            context.restore();
        }

        const skill = b.animation && martialArts.find((entry) => entry.id === b.animation.skillId);
        if (skill) {
            context.save();
            context.shadowBlur = 5;
            context.font = "bold 16px Microsoft JhengHei, sans-serif";
            context.textAlign = "center";
            context.fillText(skill.name, target.x, target.y - 58 - pulse * 10);
            context.restore();
        }
    }

    function attackOffset(b, actor, now) {
        const animation = b.animation;
        if (!animation || (!animation.type.endsWith("Attack") && animation.type !== "playerSkill")) return { x: 0, y: 0 };
        const progress = clamp((now - animation.start) / animation.duration, 0, 1);
        const thrust = Math.max(0, Math.sin(Math.PI * clamp((progress - 0.16) / 0.68, 0, 1)));
        const attacker = animation.type === "enemyAttack" ? "bandit" : "player";
        const source = tilePoint(b[attacker].col, b[attacker].row);
        const targetId = attacker === "player" ? "bandit" : "player";
        const target = tilePoint(b[targetId].col, b[targetId].row);
        const dx = target.x - source.x, dy = target.y - source.y;
        const length = Math.hypot(dx, dy) || 1;
        const sign = actor === attacker ? 1 : actor === targetId ? -0.22 : 0;
        const amount = actor === attacker ? 12 : 5;
        return { x: dx / length * amount * thrust * sign, y: dy / length * amount * thrust * sign };
    }

    function drawBattle() {
        drawBattleBackground(); const b=state.battle; if(!b)return;
        context.save();
        context.fillStyle="rgba(0,0,0,.62)"; context.fillRect(205,118,790,430);
        context.strokeStyle="rgba(218,190,132,.65)"; context.lineWidth=2; context.strokeRect(205,118,790,430);
        for(let row=0;row<BOARD.rows;row++) for(let col=0;col<BOARD.cols;col++) {
            const p=tilePoint(col,row), d=manhattan({col,row},b.player);
            let fill=(col+row)%2?"#48594b":"#3d5146";
            if(b.action==="move"&&d>0&&d<=2&&!(col===b.bandit.col&&row===b.bandit.row)) fill="rgba(197,181,92,.65)";
            context.beginPath(); context.moveTo(p.x,p.y-BOARD.tileH/2); context.lineTo(p.x+BOARD.tileW/2,p.y); context.lineTo(p.x,p.y+BOARD.tileH/2); context.lineTo(p.x-BOARD.tileW/2,p.y); context.closePath();
            context.fillStyle=fill; context.fill(); context.strokeStyle="rgba(226,214,168,.75)"; context.lineWidth=1.5; context.stroke();
        }
        const pieces=[
            {id:"player",image:assets.playerBattle,label:"少俠",color:"#fff0b2"},
            {id:"bandit",image:assets.banditBattle,label:"山賊",color:"#ffd0b8"}
        ].map((piece)=>({ ...piece, unit:visualTile(b,piece.id,performance.now()), frame:b.banditHp<=0&&piece.id==="bandit"?7:actorFrame(b,piece.id,performance.now()) }))
            .sort((a,c)=>(a.unit.col+a.unit.row)-(c.unit.col+c.unit.row));
        for(const piece of pieces){
            const p=tilePoint(piece.unit.col,piece.unit.row);
            const offset=b.animation?attackOffset(b,piece.id,performance.now()):{x:0,y:0};
            context.fillStyle="rgba(0,0,0,.35)"; context.beginPath();context.ellipse(p.x,p.y+1,19,8,0,0,Math.PI*2);context.fill();
            drawBattleSheet(piece.image,piece.frame,p.x+offset.x,p.y+12+offset.y,0.19);
            context.fillStyle=piece.color;context.font="bold 15px Microsoft JhengHei,sans-serif";context.textAlign="center";context.shadowColor="#000";context.shadowBlur=4;context.fillText(piece.label,p.x+offset.x,p.y-47+offset.y);
        }
        drawSkillAnimation(b, performance.now());
        if(b.phase==="victory"||b.phase==="defeat"){context.fillStyle="rgba(0,0,0,.72)";context.fillRect(390,285,420,80);context.strokeStyle="#d6bd79";context.strokeRect(390,285,420,80);context.fillStyle="#fff0c0";context.font="bold 30px Microsoft JhengHei,sans-serif";context.textAlign="center";context.fillText(b.phase==="victory"?"勝負已分":"力竭倒下",600,336);}
        context.restore();
    }

    function frame(now) {
        if (!context) return;
        const deltaTime = state.lastTime ? Math.min((now - state.lastTime) / 1000, 0.05) : 0;
        state.lastTime = now;

        movePlayer(deltaTime);
        updateMapInteractions();
        updateBattle(now);

        if (state.mode === "battle") {
            const shake = dragonScreenShake(now);
            if (shake) {
                context.save();
                context.translate(shake.x, shake.y);
                drawBattle();
                drawActiveEffects(now);
                context.restore();
            } else {
                drawBattle();
                drawActiveEffects(now);
            }
        } else {
            drawMap(now);
            drawActiveEffects(now);
        }

        window.requestAnimationFrame(frame);
    }

    function initialize() {
        if (!canvas || !context) {
            setOverlay("瀏覽器無法建立 Canvas 畫面，請改用較新的瀏覽器。", true);
            return;
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", () => state.keys.clear());
        dialogueNext.addEventListener("click", advanceDialogue);
        attackButton.addEventListener("click", playerAttack);
        skillButton.addEventListener("click", openSkillPanel);
        skillPanelClose.addEventListener("click", () => skillPanel.classList.add("hidden"));
        moveButton.addEventListener("click", () => chooseAction("move"));
        defendButton.addEventListener("click", defend);
        runButton.addEventListener("click", runFromBattle);
        canvas.addEventListener("click", handleBattleCanvasClick);

        loadEffectSheet("dragon_burst");
        loadAssets();
        window.requestAnimationFrame(frame);
    }

    initialize();
})();
