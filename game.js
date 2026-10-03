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

        text:
            "年輕人，江湖路遠，凡事小心。"
    },

    {
        name: "少女",
        x: 1260,
        y: 430,

        image: heroineImage,

        text:
            "前方山路似乎有山賊出沒……"
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

let battleFrame = 0;

let battleFrameTimer = 0;


// 你的圖片是：
// 第一排 4 格
// 第二排 3 格
//
// 所以使用這 7 個 frame
//
// 0 1 2 3
// 4 5 6

const BATTLE_COLUMNS = 4;
const BATTLE_ROWS = 2;
const BATTLE_FRAMES = 7;


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


        player.x +=
            (dx / length) *
            player.speed;


        player.y +=
            (dy / length) *
            player.speed;

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


    // -------------------------------------------------
    // NPC 對話
    // -------------------------------------------------

    for (const npc of npcs) {

        if (
            distance(player, npc) < 75
        ) {

            openDialogue(
                npc.name,
                npc.text
            );

            return;

        }

    }


    // -------------------------------------------------
    // 山賊戰鬥
    // -------------------------------------------------

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


    // -------------------------------------------------
    // 地圖
    // -------------------------------------------------

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


    // -------------------------------------------------
    // NPC
    // -------------------------------------------------

    for (const npc of npcs) {

        drawCharacter(

            npc.image,

            npc.x - camera.x,

            npc.y - camera.y,

            28,
            41

        );

    }


    // -------------------------------------------------
    // 山賊
    // -------------------------------------------------

    drawCharacter(

        banditImage,

        bandit.x - camera.x,

        bandit.y - camera.y,

        28,
        41

    );


    // -------------------------------------------------
    // 主角
    // -------------------------------------------------

    drawCharacter(

        playerImage,

        player.x - camera.x,

        player.y - camera.y,

        player.width,

        player.height

    );


    // -------------------------------------------------
    // 遊戲標題
    // -------------------------------------------------

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
// 取得 Sprite Sheet 的第 N 格
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

    if (
        !image.complete ||
        !image.naturalWidth
    ) {

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
// 戰鬥畫面
// =====================================================

function drawBattle() {

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


    // 戰場地面

    ctx.fillStyle =
        "#3b3328";


    ctx.fillRect(
        0,
        370,
        GAME_WIDTH,
        170
    );


    // 地面紋理

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


    // -------------------------------------------------
    // 主角
    // -------------------------------------------------

    drawBattleFrame(

        playerBattleImage,

        battleFrame,

        80,
        150,
        360,
        360,

        false

    );


    // -------------------------------------------------
    // 山賊
    // -------------------------------------------------

    drawBattleFrame(

        banditBattleImage,

        battleFrame,

        520,
        150,
        360,
        360,

        true

    );


    // -------------------------------------------------
    // 名稱
    // -------------------------------------------------

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


    // -------------------------------------------------
    // HP
    // -------------------------------------------------

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

}


// =====================================================
// HP BAR
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


    document.getElementById(
        "dialogueName"
    ).textContent = name;


    document.getElementById(
        "dialogueText"
    ).textContent = text;


    document.getElementById(
        "dialogue"
    ).classList.remove(
        "hidden"
    );

}


document
    .getElementById("dialogueNext")
    .addEventListener(
        "click",
        function() {

            gameMode =
                "map";


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


    playerHP = 100;

    banditHP = 100;


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

    document.getElementById(
        "playerHp"
    ).textContent =
        playerHP;


    document.getElementById(
        "banditHp"
    ).textContent =
        banditHP;

}


// =====================================================
// 攻擊
// =====================================================

document
    .getElementById("attackBtn")
    .addEventListener(
        "click",
        function() {

            if (
                gameMode !== "battle"
            ) {

                return;

            }


            // 山賊受到傷害

            banditHP -= 20;


            if (
                banditHP < 0
            ) {

                banditHP = 0;

            }


            updateBattleUI();


            // 山賊死亡

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
                    150
                );


                return;

            }


            // 山賊反擊

            setTimeout(
                function() {

                    playerHP -= 15;


                    if (
                        playerHP < 0
                    ) {

                        playerHP = 0;

                    }


                    updateBattleUI();


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
                            150
                        );

                    }

                },
                350
            );

        }
    );


// =====================================================
// 離開戰鬥
// =====================================================

document
    .getElementById("runBtn")
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


    // 戰鬥結束後讓主角離開山賊一點

    player.x += 120;

}


// =====================================================
// 遊戲主循環
// =====================================================

function gameLoop(time) {

    if (!gameLoop.lastTime) {

        gameLoop.lastTime =
            time;

    }


    const delta =
        time -
        gameLoop.lastTime;


    gameLoop.lastTime =
        time;


    // 戰鬥動畫速度

    battleFrameTimer += delta;


    if (
        battleFrameTimer > 140
    ) {

        battleFrame++;

        if (
            battleFrame >=
            BATTLE_FRAMES
        ) {

            battleFrame = 0;

        }


        battleFrameTimer = 0;

    }


    updateGame();


    // 畫面

    ctx.clearRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );


    if (
        gameMode === "battle"
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
