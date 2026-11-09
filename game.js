// ============================================
// SPELLCRAFT CHESS
// 3D Fantasy Chess
// Elfenreich gegen Schattenhorde
// Babylon.js + chess.js
// ============================================

"use strict";

// ============================================
// ENGINE
// ============================================

const canvas = document.getElementById("gameCanvas");

const engine = new BABYLON.Engine(canvas, true, {
    antialias: true,
    stencil: true
});

const scene = new BABYLON.Scene(engine);

scene.clearColor = new BABYLON.Color4(0.025, 0.04, 0.055, 1);
scene.imageProcessingConfiguration.toneMappingEnabled = true;
scene.imageProcessingConfiguration.exposure = 1.15;
scene.imageProcessingConfiguration.contrast = 1.15;

// ============================================
// KAMERA
// ============================================

const camera = new BABYLON.ArcRotateCamera(
    "Kamera",
    -Math.PI / 2,
    0.85,
    17,
    new BABYLON.Vector3(0, 0.5, 0),
    scene
);

camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 11;
camera.upperRadiusLimit = 24;
camera.lowerBetaLimit = 0.4;
camera.upperBetaLimit = 1.35;
camera.wheelPrecision = 40;
camera.panningSensibility = 0;

// ============================================
// LICHT
// ============================================

const hemi = new BABYLON.HemisphericLight(
    "Umgebungslicht",
    new BABYLON.Vector3(0, 1, 0),
    scene
);
hemi.intensity = 0.85;

const sun = new BABYLON.DirectionalLight(
    "Sonnenlicht",
    new BABYLON.Vector3(-0.5, -1, 0.5),
    scene
);
sun.position = new BABYLON.Vector3(-12, 20, -15);
sun.intensity = 1.5;

const elfLight = new BABYLON.PointLight(
    "Elfenlicht",
    new BABYLON.Vector3(-6, 4, -5),
    scene
);
elfLight.diffuse = new BABYLON.Color3(0.2, 1, 0.55);
elfLight.intensity = 0.7;
elfLight.range = 20;

const shadowLight = new BABYLON.PointLight(
    "Schattenlicht",
    new BABYLON.Vector3(6, 4, 5),
    scene
);
shadowLight.diffuse = new BABYLON.Color3(0.65, 0.25, 1);
shadowLight.intensity = 0.7;
shadowLight.range = 20;

// ============================================
// SCHATTEN
// ============================================

const shadowGenerator = new BABYLON.ShadowGenerator(2048, sun);
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.blurKernel = 24;
shadowGenerator.setDarkness(0.3);

// ============================================
// MATERIALIEN
// ============================================

function material(name, color, metallic = 0, roughness = 0.6) {
    const m = new BABYLON.PBRMaterial(name, scene);
    m.albedoColor = BABYLON.Color3.FromHexString(color);
    m.metallic = metallic;
    m.roughness = roughness;
    return m;
}

const M = {
    ground: material("Waldgrund", "#24392B"),
    grass: material("Moos", "#354D35"),

    lightTile: material("Heller Marmor", "#C8B88F", 0.2, 0.4),
    darkTile: material("Dunkler Marmor", "#34443E", 0.3, 0.35),

    gold: material("Gold", "#D9B45E", 0.85, 0.23),
    silver: material("Silber", "#BFCBD5", 0.85, 0.22),

    base: material("Figurensockel", "#40352C", 0.5, 0.35),

    elfArmor: material("Elfenrüstung", "#28724D", 0.65, 0.3),
    elfCloth: material("Elfenstoff", "#173C2B"),
    elfSkin: material("Elfenhaut", "#D6B99D"),
    elfHair: material("Elfenhaar", "#D2BD76"),

    darkArmor: material("Schattenrüstung", "#39294D", 0.7, 0.3),
    darkCloth: material("Schattenstoff", "#191321"),
    orcSkin: material("Orkhaut", "#718B49"),
    darkHair: material("Dunkles Haar", "#24192D"),

    wood: material("Holz", "#704A2C"),
    crystal: material("Magischer Kristall", "#A77BFF", 0.35, 0.15),
    redCrystal: material("Roter Kristall", "#E44F6C", 0.35, 0.15),

    selection: material("Auswahl", "#E9D35D", 0.2, 0.3),
    possible: material("Möglicher Zug", "#52DDA0", 0.1, 0.3)
};

// ============================================
// MAGISCHES LEUCHTEN
// ============================================

const glow = new BABYLON.GlowLayer("MagischesLeuchten", scene);
glow.intensity = 0.5;
glow.blurKernelSize = 32;

// ============================================
// BODEN
// ============================================

const ground = BABYLON.MeshBuilder.CreateGround(
    "Weltboden",
    { width: 40, height: 40 },
    scene
);

ground.position.y = -0.5;
ground.material = M.ground;
ground.receiveShadows = true;

// ============================================
// SCHACHBRETT
// ============================================

const SIZE = 1.2;
const START = -4.2;

const board = [];

function squarePosition(row, col) {
    return new BABYLON.Vector3(
        START + col * SIZE + SIZE / 2,
        0,
        START + row * SIZE + SIZE / 2
    );
}

function makeBox(name, w, h, d, x, y, z, mat) {
    const mesh = BABYLON.MeshBuilder.CreateBox(
        name,
        { width: w, height: h, depth: d },
        scene
    );

    mesh.position.set(x, y, z);
    mesh.material = mat;
    return mesh;
}

for (let row = 0; row < 8; row++) {
    board[row] = [];

    for (let col = 0; col < 8; col++) {
        const tile = BABYLON.MeshBuilder.CreateBox(
            "Feld_" + row + "_" + col,
            {
                width: SIZE,
                height: 0.22,
                depth: SIZE
            },
            scene
        );

        tile.position = squarePosition(row, col);
        tile.position.y = -0.12;

        tile.material =
            (row + col) % 2 === 0
                ? M.lightTile
                : M.darkTile;

        tile.metadata = { row, col };
        board[row][col] = tile;
    }
}

// Brett-Rahmen

makeBox("RahmenOben", 10.5, 0.35, 0.35, 0, -0.1, -5.1, M.gold);
makeBox("RahmenUnten", 10.5, 0.35, 0.35, 0, -0.1, 5.1, M.gold);
makeBox("RahmenLinks", 0.35, 0.35, 10.5, -5.1, -0.1, 0, M.gold);
makeBox("RahmenRechts", 0.35, 0.35, 10.5, 5.1, -0.1, 0, M.gold);

// ============================================
// DEKORATION
// ============================================

function createCrystal(x, z, mat) {
    const crystal = BABYLON.MeshBuilder.CreatePolyhedron(
        "Kristall",
        { type: 1, size: 0.55 },
        scene
    );

    crystal.position.set(x, 0.15, z);
    crystal.scaling.y = 1.8;
    crystal.material = mat;
    crystal.isPickable = false;

    return crystal;
}

for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;

    createCrystal(
        Math.cos(angle) * 7,
        Math.sin(angle) * 7,
        i % 2 === 0 ? M.crystal : M.redCrystal
    );
}

// ============================================
// FIGUREN
// ============================================

let pieces = [];

function createPiece(type, side, row, col) {
    const root = new BABYLON.TransformNode(
        "Figur_" + type + "_" + side,
        scene
    );

    const elf = side === "w";

    const armor = elf ? M.elfArmor : M.darkArmor;
    const cloth = elf ? M.elfCloth : M.darkCloth;
    const skin = elf ? M.elfSkin : M.orcSkin;
    const metal = elf ? M.gold : M.silver;
    const hair = elf ? M.elfHair : M.darkHair;

    const pos = squarePosition(row, col);
    root.position.set(pos.x, 0, pos.z);

    function cylinder(name, h, top, bottom, y, mat, sides = 16) {
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            name,
            {
                height: h,
                diameterTop: top,
                diameterBottom: bottom,
                tessellation: sides
            },
            scene
        );

        mesh.parent = root;
        mesh.position.y = y;
        mesh.material = mat;
        return mesh;
    }

    function sphere(name, size, x, y, z, mat) {
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            name,
            { diameter: size, segments: 16 },
            scene
        );

        mesh.parent = root;
        mesh.position.set(x, y, z);
        mesh.material = mat;
        return mesh;
    }

    function box(name, w, h, d, x, y, z, mat) {
        const mesh = BABYLON.MeshBuilder.CreateBox(
            name,
            { width: w, height: h, depth: d },
            scene
        );

        mesh.parent = root;
        mesh.position.set(x, y, z);
        mesh.material = mat;
        return mesh;
    }

    function cone(name, h, diameter, x, y, z, mat) {
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            name,
            {
                height: h,
                diameterTop: 0,
                diameterBottom: diameter,
                tessellation: 8
            },
            scene
        );

        mesh.parent = root;
        mesh.position.set(x, y, z);
        mesh.material = mat;
        return mesh;
    }

    // Sockel
    cylinder("Sockel", 0.15, 0.85, 0.95, 0.08, M.base);
    cylinder("SockelGold", 0.08, 0.85, 0.88, 0.18, metal);

    // Beine
    for (const x of [-0.2, 0.2]) {
        const leg = cylinder("Bein", 0.48, 0.18, 0.22, 0.45, cloth);
        leg.position.x = x;
    }

    // Körper und Rüstung
    cylinder("Körper", 0.8, 0.42, 0.65, 1.0, armor);

    const chest = sphere("Brustplatte", 0.58, 0, 1.12, 0.18, metal);
    chest.scaling.set(0.8, 0.65, 0.3);

    cylinder("Gürtel", 0.12, 0.52, 0.52, 0.7, metal);

    // Schultern
    for (const x of [-0.35, 0.35]) {
        const shoulder = sphere("Schulter", 0.36, x, 1.3, 0, metal);
        shoulder.scaling.y = 0.8;
    }

    // Kopf
    const headY = 1.7;
    sphere("Kopf", 0.42, 0, headY, 0, skin);

    // Augen
    for (const x of [-0.1, 0.1]) {
        sphere(
            "Auge",
            0.06,
            x,
            headY + 0.04,
            0.19,
            elf ? M.elfCloth : M.redCrystal
        );
    }

    sphere("Haare", 0.46, 0, headY + 0.14, -0.04, hair);

    // Waldelfen-Krieger / Goblin
    if (type === "p") {
        cone("Helm", 0.5, 0.55, 0, 2.05, 0, armor);

        const spear = cylinder("Speer", 1.45, 0.045, 0.045, 1.0, metal);
        spear.position.x = 0.46;

        cone("Speerspitze", 0.35, 0.18, 0.46, 1.75, 0, metal);
    }

    // Greifenreiter / Wolfsreiter
    if (type === "n") {
        sphere("Reittier", 0.82, 0, 0.88, 0, skin);
        sphere("ReittierKopf", 0.48, 0, 1.2, 0.3, skin);

        for (const x of [-0.18, 0.18]) {
            const ear = cone("Ohr", 0.4, 0.2, x, 1.58, 0.3, skin);
            ear.rotation.z = x * 1.5;
        }

        for (const sideWing of [-1, 1]) {
            const wing = BABYLON.MeshBuilder.CreateSphere(
                "Fluegel",
                { diameter: 0.8, segments: 10 },
                scene
            );

            wing.parent = root;
            wing.position.set(sideWing * 0.5, 1.05, -0.1);
            wing.scaling.set(1.2, 0.15, 0.6);
            wing.material = armor;
        }
    }

    // Magier / Schamane
    if (type === "b") {
        cone("Zauberhut", 0.85, 0.8, 0, 2.2, 0, cloth);
        sphere("Hutkristall", 0.22, 0, 2.65, 0, M.crystal);

        const staff = cylinder("Zauberstab", 1.65, 0.05, 0.05, 0.95, M.wood);
        staff.position.x = 0.48;

        sphere("Stabkristall", 0.32, 0.48, 1.8, 0, M.crystal);
    }

    // Troll / Oger
    if (type === "r") {
        sphere("TrollSchulter1", 0.48, -0.38, 1.3, 0, skin);
        sphere("TrollSchulter2", 0.48, 0.38, 1.3, 0, skin);

        const shield = box("Schild", 0.7, 0.9, 0.14, 0.48, 0.9, 0.35, metal);
        shield.rotation.z = -0.1;

        cone("Zahn1", 0.35, 0.15, -0.15, 1.48, 0.22, M.silver);
        cone("Zahn2", 0.35, 0.15, 0.15, 1.48, 0.22, M.silver);
    }

    // Zauberin / Dunkle Hexe
    if (type === "q") {
        cylinder("Krone", 0.3, 0.4, 0.65, 2.1, metal);

        for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5;

            cone(
                "Kronenspitze",
                0.42,
                0.13,
                Math.cos(angle) * 0.23,
                2.42,
                Math.sin(angle) * 0.23,
                metal
            );
        }

        sphere("Kronenkristall", 0.28, 0, 2.6, 0, M.crystal);
        cylinder("Mantel", 0.8, 0.4, 0.95, 0.72, cloth);
    }

    // König / Orkkönig
    if (type === "k") {
        cylinder("Krone", 0.4, 0.35, 0.7, 2.15, metal);

        box("Kronenkreuz", 0.13, 0.6, 0.13, 0, 2.62, 0, metal);
        box("KronenkreuzQuer", 0.45, 0.13, 0.13, 0, 2.72, 0, metal);

        sphere("Königskristall", 0.28, 0, 2.95, 0, M.crystal);

        cylinder("Umhang", 1.0, 0.35, 0.85, 0.75, cloth);
    }

    root.getChildMeshes().forEach(mesh => {
        mesh.isPickable = true;
        mesh.metadata = { pieceRoot: root };
        mesh.receiveShadows = true;
        shadowGenerator.addShadowCaster(mesh);
    });

    root.metadata = { row, col, side, type };

    return root;
}

// ============================================
// SCHACH-ENGINE
// ============================================

if (typeof Chess === "undefined") {
    document.getElementById("message").textContent =
        "Fehler: Die Schachbibliothek wurde nicht geladen!";
    throw new Error("Chess.js wurde nicht gefunden.");
}

const chess = new Chess();

let selectedSquare = null;
let possibleMoves = [];
let highlights = [];
let movingPieces = [];

// ============================================
// FIGUREN AUFSTELLEN
// ============================================

function createAllPieces() {
    pieces.forEach(piece => {
        piece.mesh.dispose();
    });

    pieces = [];

    const position = chess.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const data = position[row][col];

            if (!data) continue;

            const mesh = createPiece(
                data.type,
                data.color,
                row,
                col
            );

            pieces.push({
                mesh,
                type: data.type,
                side: data.color,
                row,
                col
            });
        }
    }
}

// ============================================
// MARKIERUNGEN
// ============================================

function clearHighlights() {
    highlights.forEach(mesh => mesh.dispose());
    highlights = [];
}

function highlightSquare(row, col, mat) {
    const marker = BABYLON.MeshBuilder.CreateBox(
        "Markierung",
        {
            width: 0.85,
            height: 0.035,
            depth: 0.85
        },
        scene
    );

    const pos = squarePosition(row, col);

    marker.position.set(pos.x, 0.045, pos.z);
    marker.material = mat;
    marker.isPickable = false;

    highlights.push(marker);
}

function showPossibleMoves(square) {
    clearHighlights();

    possibleMoves = chess.moves({
        square,
        verbose: true
    });

    for (const move of possibleMoves) {
        const row = 8 - Number(move.to[1]);
        const col = "abcdefgh".indexOf(move.to[0]);

        highlightSquare(row, col, M.possible);
    }

    const row = 8 - Number(square[1]);
    const col = "abcdefgh".indexOf(square[0]);

    highlightSquare(row, col, M.selection);
}

// ============================================
// FIGUREN BEWEGEN
// ============================================

function movePiece(from, to) {
    const fromRow = 8 - Number(from[1]);
    const fromCol = "abcdefgh".indexOf(from[0]);

    const toRow = 8 - Number(to[1]);
    const toCol = "abcdefgh".indexOf(to[0]);

    const movingPiece = pieces.find(piece =>
        piece.row === fromRow &&
        piece.col === fromCol
    );

    const result = chess.move({
        from,
        to,
        promotion: "q"
    });

    if (!result) return false;

    // Bei Rochade oder Umwandlung Figuren neu aufbauen.
    if (
        result.flags.includes("k") ||
        result.flags.includes("q") ||
        result.flags.includes("p")
    ) {
        clearHighlights();
        selectedSquare = null;
        updateHUD();

        setTimeout(createAllPieces, 350);
        return true;
    }

    // Geschlagene Figur entfernen.
    const captured = pieces.find(piece =>
        piece.row === toRow &&
        piece.col === toCol
    );

    if (captured) {
        captured.mesh.dispose();
        pieces = pieces.filter(piece => piece !== captured);
    }

    if (movingPiece) {
        const target = squarePosition(toRow, toCol);

        movingPieces.push({
            mesh: movingPiece.mesh,
            start: movingPiece.mesh.position.clone(),
            target: new BABYLON.Vector3(target.x, 0, target.z),
            progress: 0
        });

        movingPiece.row = toRow;
        movingPiece.col = toCol;
        movingPiece.mesh.metadata.row = toRow;
        movingPiece.mesh.metadata.col = toCol;
    }

    clearHighlights();
    selectedSquare = null;

    updateHUD();
    return true;
}

// ============================================
// SPIELSTEUERUNG
// ============================================

function squareName(row, col) {
    return "abcdefgh"[col] + (8 - row);
}

function handleSquare(row, col) {
    if (chess.isGameOver()) return;

    const square = squareName(row, col);
    const piece = chess.get(square);

    if (selectedSquare) {
        const validMove = possibleMoves.find(
            move => move.to === square
        );

        if (validMove) {
            movePiece(selectedSquare, square);
            return;
        }
    }

    if (piece && piece.color === chess.turn()) {
        selectedSquare = square;
        showPossibleMoves(square);
        return;
    }

    selectedSquare = null;
    possibleMoves = [];
    clearHighlights();
}

// ============================================
// MAUS / TOUCH
// ============================================

scene.onPointerObservable.add(pointerInfo => {
    if (
        pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN
    ) {
        return;
    }

    const pick = scene.pick(
        scene.pointerX,
        scene.pointerY
    );

    if (!pick || !pick.hit || !pick.pickedMesh) return;

    let mesh = pick.pickedMesh;

    // Wurde eine Figur getroffen?
    let root = null;

    while (mesh) {
        if (mesh.metadata && mesh.metadata.pieceRoot) {
            root = mesh.metadata.pieceRoot;
            break;
        }

        mesh = mesh.parent;
    }

    if (root && root.metadata) {
        handleSquare(
            root.metadata.row,
            root.metadata.col
        );
        return;
    }

    // Wurde ein Schachfeld getroffen?
    const metadata = pick.pickedMesh.metadata;

    if (
        metadata &&
        Number.isInteger(metadata.row) &&
        Number.isInteger(metadata.col)
    ) {
        handleSquare(metadata.row, metadata.col);
    }
});

// ============================================
// HUD
// ============================================

function updateHUD() {
    const turn = document.getElementById("turn");
    const message = document.getElementById("message");

    if (chess.isCheckmate()) {
        const winner = chess.turn() === "w"
            ? "Schattenhorde"
            : "Elfenreich";

        turn.textContent = "🏆 " + winner + " gewinnt!";
        message.textContent = "Schachmatt!";
        return;
    }

    if (chess.isDraw()) {
        turn.textContent = "🤝 Unentschieden";
        message.textContent = "Das Spiel ist beendet.";
        return;
    }

    if (chess.turn() === "w") {
        turn.textContent = "🌿 Das Elfenreich ist am Zug";
    } else {
        turn.textContent = "🔥 Die Schattenhorde ist am Zug";
    }

    if (chess.isCheck()) {
        message.textContent = "⚠️ SCHACH! Der König ist bedroht!";
    } else {
        message.textContent = "Wähle eine Figur aus.";
    }
}

// ============================================
// NEUES SPIEL
// ============================================

document.getElementById("restart").addEventListener("click", () => {
    chess.reset();

    selectedSquare = null;
    possibleMoves = [];
    movingPieces = [];

    clearHighlights();
    createAllPieces();
    updateHUD();
});

// ============================================
// BEWEGUNGSANIMATION
// ============================================

scene.onBeforeRenderObservable.add(() => {
    for (let i = movingPieces.length - 1; i >= 0; i--) {
        const move = movingPieces[i];

        move.progress += engine.getDeltaTime() / 250;

        const t = Math.min(move.progress, 1);
        const smooth = t * t * (3 - 2 * t);

        move.mesh.position.x =
            move.start.x + (move.target.x - move.start.x) * smooth;

        move.mesh.position.z =
            move.start.z + (move.target.z - move.start.z) * smooth;

        move.mesh.position.y = Math.sin(t * Math.PI) * 0.35;

        if (t >= 1) {
            move.mesh.position.copyFrom(move.target);
            movingPieces.splice(i, 1);
        }
    }
});

// ============================================
// SPIEL STARTEN
// ============================================

createAllPieces();
updateHUD();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});
