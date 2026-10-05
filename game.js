const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

// =====================================================
// 圖片
// =====================================================

function loadImage(path) {
    const img = new Image();
    img.src = path;
    return img;
}

const mapImage = loadImage("assets/maps/village.png");

const playerImage = loadImage(
    "assets/characters/player.png"
);

const heroineImage = loadImage(
    "assets/characters/heroine.png"
);

const oldManImage = loadImage(
    "assets/characters/old_man.png"
);

const banditImage = loadImage(
    "assets/characters/bandit.png"
);

// 主角戰鬥動畫
const playerBattleImage = loadImage(
    "assets/animations/player/battle.png"
);

// 山賊戰鬥動畫
const banditBattleImage = loadImage(
    "assets/animations/bandit/battle.png"
);


// =====================================================
// 遊戲設定
// =====================================================

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

let gameMode = "map";
let dialogueCooldown = 0;

const keys = {};


// =====================================================
// 主角
// =====================================================

const player = {
    x: 780,
    y: 520,
    speed: 3,
    width: 30,
    height: 44
};


// =====================================================
// NPC
// =====================================================

const npcs = [

    {
        name: "老人",
        x: 1060,
        y: 500,
        image: oldManImage,
        text: "年輕人，江湖路遠，凡事小心。"
    },

    {
        name: "少女",
        x: 1260,
        y: 430,
        image: heroineImage,
        text: "前方山路似乎有山賊出沒……"
    }

];


// =====================================================
// 山賊
// =====================================================

const bandit = {
    x: 560,
    y: 310,
    width: 90,
    height: 130
};


// =====================================================
// 戰鬥資料
// =====================================================

let playerHP = 100;
let banditHP = 100;

const BATTLE_COLUMNS = 4;
const BATTLE_ROWS = 2;
const BATTLE_FRAMES = 7;

let battleFrame = 0;
let battleFrameTimer = 0;

// 戰鬥演出
let battleBusy = false;
let battleAction = "idle";
let battleEffectTimer = 0;
let battleEffectType = "";
let battleShake = 0;


// =====================================================
// 鍵盤
// =====================================================

window.addEventListener("keydown", function(event) {

    keys[event.key.toLowerCase()] = true;

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {

        event.preventDefault();

    }

});


window.addEventListener("keyup", function(event) {

    keys[event.key.toLowerCase()] = false;

});


// =====================================================
// 距離
// =====================================================

function distance(a, b) {

    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
    );

}


// =====================================================
// 地圖尺寸
// =====================================================

function getMapWidth() {

    if (mapImage.naturalWidth) {
        return mapImage.naturalWidth;
    }

    return 1536;

}


function getMapHeight() {

    if (mapImage.naturalHeight) {
        return mapImage.naturalHeight;
    }

    return 1024;

}


// =====================================================
// 相機
// =====================================================

function getCamera() {

    const mapWidth = getMapWidth();
    const mapHeight = getMapHeight();

    let cameraX =
        player.x - GAME_WIDTH / 2;

    let cameraY =
        player.y - GAME_HEIGHT / 2;

    cameraX = Math.max(
        0,
        Math.min(
            mapWidth - GAME_WIDTH,
            cameraX
        )
    );

    cameraY = Math.max(
        0,
        Math.min(
            mapHeight - GAME_HEIGHT,
            cameraY
        )
    );

    return {
        x: cameraX,
        y: cameraY
    };

}


// =====================================================
// 更新遊戲
// =====================================================

function updateGame() {

    if (gameMode !== "map") {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (
        keys["arrowleft"] ||
        keys["a"]
    ) {
        dx -= 1;
    }

    if (
        keys["arrowright"] ||
        keys["d"]
    ) {
        dx += 1;
    }

    if (
        keys["arrowup"] ||
        keys["w"]
    ) {
        dy -= 1;
    }

    if (
        keys["arrowdown"] ||
        keys["s"]
    ) {
        dy += 1;
    }

    if (dx !== 0 || dy !== 0) {

        const length =
            Math.sqrt(dx * dx + dy * dy);

        const nextX =
            player.x +
            (dx / length) *
            player.speed;

        const nextY =
            player.y +
            (dy / length) *
            player.speed;

        let blocked = false;

        // NPC 碰撞
        for (const npc of npcs) {

            if (
                distance(
                    {
                        x: nextX,
                        y: nextY
                    },
                    npc
                ) < 35
            ) {

                blocked = true;
                break;

            }

        }

        if (!blocked) {

            player.x = nextX;
            player.y = nextY;

        }

    }


    // 限制主角不要走出地圖

    const mapWidth = getMapWidth();
    const mapHeight = getMapHeight();

    player.x = Math.max(
        50,
        Math.min(
            mapWidth - 50,
            player.x
        )
    );

    player.y = Math.max(
        80,
        Math.min(
            mapHeight - 50,
            player.y
        )
    );


    // =================================================
    // NPC 對話
    // =================================================

    for (const npc of npcs) {

        if (
            dialogueCooldown === 0 &&
            distance(player, npc) < 75
        ) {

            openDialogue(
                npc.name,
                npc.text
            );

            return;

        }

    }


    // 對話結束後必須離開 NPC

    if (dialogueCooldown === 1) {

        let nearNpc = false;

        for (const npc of npcs) {

            if (
                distance(player, npc) < 100
            ) {

                nearNpc = true;
                break;

            }

        }

        if (!nearNpc) {
            dialogueCooldown = 0;
        }

    }


    // =================================================
    // 山賊戰鬥
    // =================================================

    if (
        distance(player, bandit) < 85
    ) {

        startBattle();

    }

}


// =====================================================
// 畫人物
// =====================================================

function drawCharacter(
    image,
    x,
    y,
    width,
    height
) {

    if (
        !image.complete ||
        !image.naturalWidth
    ) {

        return;

    }

    ctx.drawImage(
        image,
        x - width / 2,
        y - height,
        width,
        height
    );

}


// =====================================================
// 地圖
// =====================================================

function drawMap() {

    const camera =
        getCamera();


    if (
        mapImage.complete &&
        mapImage.naturalWidth
    ) {

        ctx.drawImage(
            mapImage,
            -camera.x,
            -camera.y,
            getMapWidth(),
            getMapHeight()
        );

    }

    else {

        ctx.fillStyle = "#527744";

        ctx.fillRect(
            0,
            0,
            GAME_WIDTH,
            GAME_HEIGHT
        );

    }


    // NPC

    for (const npc of npcs) {

        drawCharacter(
            npc.image,
            npc.x - camera.x,
            npc.y - camera.y,
            28,
            41
        );

    }


    // 山賊

    drawCharacter(
        banditImage,
        bandit.x - camera.x,
        bandit.y - camera.y,
        28,
        41
    );


    // 主角

    drawCharacter(
        playerImage,
        player.x - camera.x,
        player.y - camera.y,
        player.width,
        player.height
    );


    // 標題

    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    ctx.fillRect(
        15,
        15,
        240,
        38
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "18px Microsoft JhengHei";

    ctx.fillText(
        "江湖 RPG · 村莊",
        28,
        41
    );

}


// =====================================================
// 戰鬥 Sprite Sheet
// =====================================================

function drawBattleFrame(
    image,
    frame,
    x,
    y,
    width,
    height,
    flip = false
) {

    // 如果圖片沒載入
    // 就畫一個簡易人物，避免只剩血條

    if (
        !image.complete ||
        !image.naturalWidth
    ) {

        drawBattleFallback(
            x,
            y,
            width,
            height,
            flip
        );

        return;

    }


    const frameWidth =
        image.naturalWidth /
        BATTLE_COLUMNS;

    const frameHeight =
        image.naturalHeight /
        BATTLE_ROWS;


    let sourceX;
    let sourceY;


    if (frame < 4) {

        sourceX =
            frame * frameWidth;

        sourceY = 0;

    }

    else {

        sourceX =
            (frame - 4) *
            frameWidth;

        sourceY =
            frameHeight;

    }


    ctx.save();


    if (flip) {

        ctx.translate(
            x + width,
            y
        );

        ctx.scale(
            -1,
            1
        );

        x = 0;

    }


    ctx.drawImage(

        image,

        sourceX,
        sourceY,

        frameWidth,
        frameHeight,

        flip ? 0 : x,
        y,

        width,
        height

    );


    ctx.restore();

}


// =====================================================
// 戰鬥圖片載入失敗時的備用人物
// =====================================================

function drawBattleFallback(
    x,
    y,
    width,
    height,
    flip
) {

    ctx.save();

    const cx =
        x + width / 2;

    const headY =
        y + 70;


    // 頭

    ctx.fillStyle =
        flip
            ? "#6d342d"
            : "#304e70";

    ctx.beginPath();

    ctx.arc(
        cx,
        headY,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // 身體

    ctx.fillRect(
        cx - 45,
        headY + 35,
        90,
        150
    );


    // 手

    ctx.strokeStyle =
        "#e6c6a0";

    ctx.lineWidth = 16;

    ctx.beginPath();

    ctx.moveTo(
        cx - 25,
        headY + 60
    );

    ctx.lineTo(
        cx - 70,
        headY + 125
    );

    ctx.moveTo(
        cx + 25,
        headY + 60
    );

    ctx.lineTo(
        cx + 70,
        headY + 125
    );

    ctx.stroke();


    ctx.restore();

}


// =====================================================
// 戰鬥特效
// =====================================================

function startBattleEffect(
    action,
    effectType
) {

    battleAction =
        action;

    battleEffectType =
        effectType;

    // 420ms，比原本更長
    battleEffectTimer =
        420;

}


function drawSlash(
    x1,
    y1,
    x2,
    y2,
    outerWidth,
    innerWidth
) {

    ctx.lineCap =
        "round";


    // 外層藍光

    ctx.strokeStyle =
        "rgba(120,220,255,0.95)";

    ctx.lineWidth =
        outerWidth;

    ctx.beginPath();

    ctx.moveTo(
        x1,
        y1
    );

    ctx.lineTo(
        x2,
        y2
    );

    ctx.stroke();


    // 中心白光

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth =
        innerWidth;

    ctx.beginPath();

    ctx.moveTo(
        x1,
        y1
    );

    ctx.lineTo(
        x2,
        y2
    );

    ctx.stroke();

}


// =====================================================
// 命中爆閃
// =====================================================

function drawHitBurst(
    x,
    y,
    color
) {

    const progress =
        1 -
        battleEffectTimer / 420;

    const radius =
        18 +
        progress * 65;

    const alpha =
        Math.max(
            0,
            1 - progress
        );


    ctx.save();

    ctx.globalAlpha =
        alpha;


    // 大爆閃

    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // 八方向光芒

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 5;


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const angle =
            i * Math.PI / 4;

        ctx.beginPath();

        ctx.moveTo(
            x +
            Math.cos(angle) * 20,

            y +
            Math.sin(angle) * 20
        );

        ctx.lineTo(
            x +
            Math.cos(angle) *
            (radius + 25),

            y +
            Math.sin(angle) *
            (radius + 25)
        );

        ctx.stroke();

    }


    ctx.restore();

}


// =====================================================
// 戰鬥特效
// =====================================================

function drawBattleEffect() {

    if (
        battleEffectTimer <= 0
    ) {

        return;

    }


    const progress =
        1 -
        battleEffectTimer / 420;

    const ease =
        Math.sin(
            progress * Math.PI
        );


    ctx.save();


    // =================================================
    // 主角攻擊
    // =================================================

    if (
        battleAction ===
        "playerAttack"
    ) {

        const startX =
            330 +
            ease * 45;

        const endX =
            670 +
            ease * 45;


        // 第一道劍氣

        drawSlash(
            startX,
            310,
            endX,
            250,
            18,
            6
        );


        // 第二道劍氣

        drawSlash(
            startX + 15,
            330,
            endX - 10,
            285,
            8,
            3
        );


        // 劍氣弧光

        ctx.strokeStyle =
            "rgba(150,235,255,0.9)";

        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.arc(
            500,
            315,
            115,
            -0.75,
            0.25
        );

        ctx.stroke();

    }


    // =================================================
    // 山賊反擊
    // =================================================

    if (
        battleAction ===
        "banditAttack"
    ) {

        const startX =
            870 -
            ease * 45;

        const endX =
            530 -
            ease * 45;


        ctx.lineCap =
            "round";


        // 紅色攻擊光

        ctx.strokeStyle =
            "rgba(255,90,70,0.95)";

        ctx.lineWidth = 20;

        ctx.beginPath();

        ctx.moveTo(
            startX,
            300
        );

        ctx.lineTo(
            endX,
            255
        );

        ctx.stroke();


        // 中心亮光

        ctx.strokeStyle =
            "#fff1d0";

        ctx.lineWidth = 6;

        ctx.beginPath();

        ctx.moveTo(
            startX - 10,
            320
        );

        ctx.lineTo(
            endX + 10,
            275
        );

        ctx.stroke();

    }


    // =================================================
    // 山賊被打
    // =================================================

    if (
        battleEffectType ===
        "banditHit"
    ) {

        drawHitBurst(
            720,
            320,
            "rgba(255,210,80,0.85)"
        );

    }


    // =================================================
    // 主角被打
    // =================================================

    if (
        battleEffectType ===
        "playerHit"
    ) {

        drawHitBurst(
            230,
            320,
            "rgba(255,90,70,0.85)"
        );

    }


    ctx.restore();

}


// =====================================================
// 戰鬥畫面
// =====================================================

function drawBattle() {

    // 畫面震動

    const shakeX =
        battleShake > 0
            ? (Math.random() - 0.5) *
              battleShake
            : 0;

    const shakeY =
        battleShake > 0
            ? (Math.random() - 0.5) *
              battleShake
            : 0;


    ctx.save();

    ctx.translate(
        shakeX,
        shakeY
    );


    // 背景

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            GAME_HEIGHT
        );


    gradient.addColorStop(
        0,
        "#252019"
    );

    gradient.addColorStop(
        1,
        "#111820"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );


    // =================================================
    // 地面
    // =================================================

    ctx.fillStyle =
        "#3b3328";

    ctx.fillRect(
        0,
        370,
        GAME_WIDTH,
        170
    );


    ctx.strokeStyle =
        "rgba(255,255,255,0.05)";


    for (
        let y = 390;
        y < 540;
        y += 35
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            GAME_WIDTH,
            y
        );

        ctx.stroke();

    }


    // =================================================
    // 人物攻擊位移
    // =================================================

    let playerX = 80;
    let banditX = 520;


    if (
        battleAction ===
        "playerAttack"
    ) {

        playerX +=
            Math.sin(
                (
                    1 -
                    battleEffectTimer /
                    420
                ) *
                Math.PI
            ) *
            55;

    }


    if (
        battleAction ===
        "banditAttack"
    ) {

        banditX -=
            Math.sin(
                (
                    1 -
                    battleEffectTimer /
                    420
                ) *
                Math.PI
            ) *
            55;

    }


    // =================================================
    // 主角
    // =================================================

    drawBattleFrame(

        playerBattleImage,

        battleFrame,

        playerX,
        150,

        360,
        360,

        false

    );


    // =================================================
    // 山賊
    // =================================================

    drawBattleFrame(

        banditBattleImage,

        battleFrame,

        banditX,
        150,

        360,
        360,

        true

    );


    // =================================================
    // 特效
    // =================================================

    drawBattleEffect();


    // =================================================
    // 名稱
    // =================================================

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "24px Microsoft JhengHei";


    ctx.fillText(
        "主角",
        220,
        135
    );


    ctx.fillText(
        "山賊",
        690,
        135
    );


    // =================================================
    // HP
    // =================================================

    drawHPBar(
        120,
        105,
        250,
        playerHP,
        "#4caf50"
    );


    drawHPBar(
        590,
        105,
        250,
        banditHP,
        "#c94b4b"
    );


    ctx.restore();

}


// =====================================================
// HP
// =====================================================

function drawHPBar(
    x,
    y,
    width,
    hp,
    color
) {

    ctx.fillStyle =
        "#171717";

    ctx.fillRect(
        x,
        y,
        width,
        18
    );


    ctx.fillStyle =
        color;

    ctx.fillRect(
        x,
        y,
        width *
        (hp / 100),
        18
    );


    ctx.strokeStyle =
        "#d5c08a";

    ctx.strokeRect(
        x,
        y,
        width,
        18
    );

}


// =====================================================
// 對話
// =====================================================

function openDialogue(
    name,
    text
) {

    if (
        gameMode !== "map"
    ) {

        return;

    }


    gameMode =
        "dialogue";


    document
        .getElementById(
            "dialogueName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "dialogueText"
        )
        .textContent =
        text;


    document
        .getElementById(
            "dialogue"
        )
        .classList.remove(
            "hidden"
        );

}


document
    .getElementById(
        "dialogueNext"
    )
    .addEventListener(
        "click",
        function() {

            gameMode =
                "map";

            dialogueCooldown =
                1;


            document
                .getElementById(
                    "dialogue"
                )
                .classList.add(
                    "hidden"
                );

        }
    );


// =====================================================
// 開始戰鬥
// =====================================================

function startBattle() {

    if (
        gameMode !== "map"
    ) {

        return;

    }


    gameMode =
        "battle";


    playerHP =
        100;

    banditHP =
        100;


    battleFrame =
        0;

    battleFrameTimer =
        0;


    battleBusy =
        false;

    battleAction =
        "idle";

    battleEffectTimer =
        0;

    battleEffectType =
        "";

    battleShake =
        0;


    updateBattleUI();


    document
        .getElementById(
            "battleUI"
        )
        .classList.remove(
            "hidden"
        );

}


// =====================================================
// 更新戰鬥 UI
// =====================================================

function updateBattleUI() {

    document
        .getElementById(
            "playerHp"
        )
        .textContent =
        playerHP;


    document
        .getElementById(
            "banditHp"
        )
        .textContent =
        banditHP;

}


// =====================================================
// 攻擊
// =====================================================

document
    .getElementById(
        "attackBtn"
    )
    .addEventListener(
        "click",
        function() {

            if (
                gameMode !== "battle" ||
                battleBusy
            ) {

                return;

            }


            battleBusy =
                true;


            // =================================================
            // 主角攻擊
            // =================================================

            startBattleEffect(
                "playerAttack",
                "banditHit"
            );


            // 劍氣飛出去

            setTimeout(
                function() {

                    banditHP -=
                        20;


                    if (
                        banditHP < 0
                    ) {

                        banditHP =
                            0;

                    }


                    battleShake =
                        10;


                    updateBattleUI();


                    setTimeout(
                        function() {

                            battleShake =
                                0;

                        },
                        120
                    );


                    // =================================================
                    // 山賊死亡
                    // =================================================

                    if (
                        banditHP === 0
                    ) {

                        setTimeout(
                            function() {

                                alert(
                                    "山賊倒下了！"
                                );


                                endBattle();

                            },
                            300
                        );


                        return;

                    }


                    // =================================================
                    // 山賊反擊
                    // =================================================

                    setTimeout(
                        function() {

                            startBattleEffect(
                                "banditAttack",
                                "playerHit"
                            );


                            battleShake =
                                6;


                            setTimeout(
                                function() {

                                    battleShake =
                                        0;

                                },
                                150
                            );

                        },
                        220
                    );


                    // =================================================
                    // 山賊造成傷害
                    // =================================================

                    setTimeout(
                        function() {

                            playerHP -=
                                15;


                            if (
                                playerHP < 0
                            ) {

                                playerHP =
                                    0;

                            }


                            updateBattleUI();


                            // =================================================
                            // 主角死亡
                            // =================================================

                            if (
                                playerHP === 0
                            ) {

                                setTimeout(
                                    function() {

                                        alert(
                                            "主角倒下了！"
                                        );


                                        endBattle();

                                    },
                                    300
                                );

                            }

                            else {

                                setTimeout(
                                    function() {

                                        battleBusy =
                                            false;

                                    },
                                    250
                                );

                            }

                        },
                        600
                    );

                },
                300
            );

        }
    );


// =====================================================
// 離開戰鬥
// =====================================================

document
    .getElementById(
        "runBtn"
    )
    .addEventListener(
        "click",
        endBattle
    );


function endBattle() {

    gameMode =
        "map";


    document
        .getElementById(
            "battleUI"
        )
        .classList.add(
            "hidden"
        );


    battleBusy =
        false;

    battleAction =
        "idle";

    battleEffectTimer =
        0;

    battleEffectType =
        "";

    battleShake =
        0;


    // 戰鬥結束後讓主角離開山賊

    player.x +=
        120;

}


// =====================================================
// 遊戲主循環
// =====================================================

function gameLoop(time) {

    if (
        !gameLoop.lastTime
    ) {

        gameLoop.lastTime =
            time;

    }


    const delta =
        time -
        gameLoop.lastTime;


    gameLoop.lastTime =
        time;


    // =================================================
    // 戰鬥人物動畫
    // =================================================

    battleFrameTimer +=
        delta;


    if (
        battleFrameTimer > 140
    ) {

        battleFrame++;


        if (
            battleFrame >=
            BATTLE_FRAMES
        ) {

            battleFrame =
                0;

        }


        battleFrameTimer =
            0;

    }


    // =================================================
    // 戰鬥特效倒數
    // =================================================

    if (
        battleEffectTimer > 0
    ) {

        battleEffectTimer -=
            delta;


        if (
            battleEffectTimer <= 0
        ) {

            battleEffectTimer =
                0;

            battleAction =
                "idle";

            battleEffectType =
                "";

        }

    }


    updateGame();


    // 清除畫面

    ctx.clearRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );


    // 畫面

    if (
        gameMode ===
        "battle"
    ) {

        drawBattle();

    }

    else {

        drawMap();

    }


    requestAnimationFrame(
        gameLoop
    );

}


requestAnimationFrame(
    gameLoop
);
