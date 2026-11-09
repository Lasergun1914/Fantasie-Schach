// ==========================================
// SPELLCRAFT CHESS
// Elfenreich gegen Schattenhorde
// Babylon.js + Chess.js
// ==========================================

"use strict";

const canvas = document.getElementById("gameCanvas");

const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

scene.clearColor = new BABYLON.Color4(0.035, 0.065, 0.07, 1);

// LICHT

const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
);

light.intensity = 0.9;

const sun = new BABYLON.DirectionalLight(
    "sun",
    new BABYLON.Vector3(-1, -2, 1),
    scene
);

sun.position = new BABYLON.Vector3(10, 20, -10);
sun.intensity = 1.2;

// KAMERA

const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    0.85,
    15,
    new BABYLON.Vector3(0, 0, 0),
    scene
);

camera.attachControl(canvas, true);

camera.lowerRadiusLimit = 11;
camera.upperRadiusLimit = 22;
camera.lowerBetaLimit = 0.45;
camera.upperBetaLimit = 1.25;
camera.wheelPrecision = 50;
camera.panningSensibility = 0;

// MATERIALIEN

function makeMaterial(name, color, emissive = "#000000") {
    const mat = new BABYLON.StandardMaterial(name, scene);

    mat.diffuseColor = BABYLON.Color3.FromHexString(color);
    mat.emissiveColor = BABYLON.Color3.FromHexString(emissive);
    mat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    return mat;
}

const materials = {
    boardLight: makeMaterial("Helles Feld", "#B8A47A"),
    boardDark: makeMaterial("Dunkles Feld", "#405B4B"),

    elf: makeMaterial("Elfenrüstung", "#397D55"),
    elfGold: makeMaterial("Elfisches Gold", "#D8B65C"),
    elfSkin: makeMaterial("Elfenhaut", "#D7B99A"),

    shadow: makeMaterial("Schattenrüstung", "#49345D"),
    shadowGold: makeMaterial("Schattenmetall", "#A77BCE"),
    shadowSkin: makeMaterial("Orkhaut", "#657B45"),

    base: makeMaterial("Sockel", "#24262A"),
    selected: makeMaterial("Auswahl", "#E7D35B", "#6B5810"),
    possible: makeMaterial("Möglicher Zug", "#69DDA0", "#205D36"),

    ground: makeMaterial("Boden", "#263C32"),
    decoration: makeMaterial("Dekoration", "#5E755C")
};

// BODEN

const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 40, height: 40 },
    scene
);

ground.position.y = -0.65;
ground.material = materials.ground;

// SCHACHBRETT

const board = [];

const squareSize = 1.2;
const boardStart = -4.2;

function squarePosition(row, col) {
    return new BABYLON.Vector3(
        boardStart + col * squareSize + squareSize / 2,
        0,
        boardStart + row * squareSize + squareSize / 2
    );
}

for (let row = 0; row < 8; row++) {
    board[row] = [];

    for (let col = 0; col < 8; col++) {
        const tile = BABYLON.MeshBuilder.CreateBox(
            "square_" + row + "_" + col,
            {
                width: squareSize,
                height: 0.22,
                depth: squareSize
            },
            scene
        );

        tile.position = squarePosition(row, col);
        tile.position.y = -0.12;

        tile.material =
            (row + col) % 2 === 0
                ? materials.boardLight
                : materials.boardDark;

        tile.isPickable = true;

        tile.metadata = {
            row,
            col,
            square: "abcdefgh"[col] + (8 - row)
        };

        board[row][col] = tile;
    }
}

// BRETT-RAND

function createBorder(x, z, width, depth) {
    const border = BABYLON.MeshBuilder.CreateBox(
        "border",
        {
            width,
            height: 0.35,
            depth
        },
        scene
    );

    border.position.set(x, -0.12, z);
    border.material = materials.elfGold;
}

createBorder(0, -5.1, 10.3, 0.3);
createBorder(0, 5.1, 10.3, 0.3);
createBorder(-5.1, 0, 0.3, 10.3);
createBorder(5.1, 0, 0.3, 10.3);

// DEKORATION

for (let i = 0; i < 12; i++) {
    const crystal = BABYLON.MeshBuilder.CreatePolyhedron(
        "crystal",
        { type: 1, size: 0.35 },
        scene
    );

    const side = i % 2 === 0 ? -1 : 1;

    crystal.position.set(
        side * (6 + Math.random() * 2),
        -0.1,
        (Math.random() - 0.5) * 9
    );

    crystal.material = i % 2 === 0
        ? materials.elfGold
        : materials.shadowGold;
}

// FIGUREN

const pieces = [];

function createPieceMesh(type, side, row, col) {
    const root = new BABYLON.TransformNode(
        "piece_" + type + "_" + side,
        scene
    );

    const isElf = side === "w";

    const armor = isElf ? materials.elf : materials.shadow;
    const metal = isElf ? materials.elfGold : materials.shadowGold;
    const skin = isElf ? materials.elfSkin : materials.shadowSkin;

    const pos = squarePosition(row, col);

    root.position.set(pos.x, 0, pos.z);

    function cylinder(name, height, top, bottom, y, mat) {
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            name,
            {
                height,
                diameterTop: top,
                diameterBottom: bottom,
                tessellation: 12
            },
            scene
        );

        mesh.parent = root;
        mesh.position.y = y;
        mesh.material = mat;

        return mesh;
    }

    function sphere(name, diameter, x, y, z, mat) {
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            name,
            { diameter, segments: 12 },
            scene
        );

        mesh.parent = root;
        mesh.position.set(x, y, z);
        mesh.material = mat;

        return mesh;
    }

    function box(name, width, height, depth, x, y, z, mat) {
        const mesh = BABYLON.MeshBuilder.CreateBox(
            name,
            { width, height, depth },
            scene
        );

        mesh.parent = root;
        mesh.position.set(x, y, z);
        mesh.material = mat;

        return mesh;
    }

    // SOCKEL
    cylinder("Sockel", 0.18, 0.85, 0.95, 0.09, materials.base);
    cylinder("SockelGold", 0.08, 0.76, 0.85, 0.22, metal);

    // KÖRPER
    const bodyHeight = type === "k" ? 1.5 : 1.05;

    cylinder(
        "Körper",
        bodyHeight,
        0.35,
        0.68,
        0.22 + bodyHeight / 2,
        armor
    );

    // KOPF
    const headY = 0.22 + bodyHeight + 0.3;

    sphere("Kopf", 0.48, 0, headY, 0, skin);

    // FIGURENSPEZIFISCHE DETAILS

    if (type === "p") {
        // BAUER: ELFENKRIEGER / GOBLIN
        sphere("Helm", 0.5, 0, headY + 0.18, 0, armor);

        const spear = box(
            "Speer",
            0.08, 1.25, 0.08,
            0.42, 0.95, 0,
            metal
        );

        spear.rotation.z = -0.15;
    }

    if (type === "n") {
        // SPRINGER: GREIFENREITER / WOLFSREITER
        sphere("Tierkörper", 0.8, 0, 0.85, 0, metal);

        sphere("Tierkopf", 0.45, 0.1, 1.2, 0.28, armor);

        const ear1 = box(
            "Ohr1", 0.12, 0.35, 0.12,
            -0.13, 1.55, 0.3, metal
        );

        const ear2 = box(
            "Ohr2", 0.12, 0.35, 0.12,
            0.25, 1.55, 0.3, metal
        );

        ear1.rotation.z = -0.2;
        ear2.rotation.z = 0.2;
    }

    if (type === "b") {
        // LÄUFER: ZAUBERER / SCHATTENSCHAMANE
        cylinder(
            "Zauberhut",
            0.8,
            0,
            0.7,
            headY + 0.5,
            armor
        );

        sphere(
            "Kristall",
            0.22,
            0,
            headY + 0.95,
            0,
            metal
        );

        cylinder(
            "Magierstab",
            1.5,
            0.07,
            0.07,
            0.9,
            metal
        ).position.x = 0.48;
    }

    if (type === "r") {
        // TURM: TROLL / OGRE
        sphere("LinkeSchulter", 0.45, -0.35, 1.15, 0, metal);
        sphere("RechteSchulter", 0.45, 0.35, 1.15, 0, metal);

        cylinder(
            "Helm",
            0.5,
            0.5,
            0.7,
            headY + 0.25,
            armor
        );

        box(
            "Schild",
            0.65, 0.9, 0.16,
            0.48, 0.9, 0.35,
            metal
        );
    }

    if (type === "q") {
        // DAME: HOCHELFEN-ZAUBERIN / DUNKLE HEXE
        cylinder(
            "Krone",
            0.5,
            0.15,
            0.7,
            headY + 0.38,
            metal
        );

        for (let i = 0; i < 3; i++) {
            const spike = BABYLON.MeshBuilder.CreateCylinder(
                "Kronenspitze",
                {
                    height: 0.55,
                    diameterTop: 0,
                    diameterBottom: 0.18,
                    tessellation: 6
                },
                scene
            );

            spike.parent = root;
            spike.position.set(
                (i - 1) * 0.22,
                headY + 0.85,
                0
            );

            spike.material = metal;
        }

        sphere("MagischerKristall", 0.3, 0, headY + 1.15, 0, metal);
    }

    if (type === "k") {
        // KÖNIG: ELFENKÖNIG / ORKKÖNIG
        cylinder(
            "Krone",
            0.55,
            0.2,
            0.75,
            headY + 0.35,
            metal
        );

        box(
            "Kreuz",
            0.15, 0.65, 0.15,
            0, headY + 0.95, 0,
            metal
        );

        box(
            "KreuzQuer",
            0.55, 0.14, 0.15,
            0, headY + 1.05, 0,
            metal
        );

        sphere("Augenlicht", 0.1, -0.12, headY, 0.22, metal);
        sphere("Augenlicht2", 0.1, 0.12, headY, 0.22, metal);
    }

    // FIGUR AUSWÄHLBAR MACHEN
    root.getChildMeshes().forEach(mesh => {
        mesh.isPickable = true;
        mesh.metadata = {
            pieceRoot: root
        };
    });

    root.metadata = {
        row,
        col,
        side,
        type
    };

    return root;
}

// SCHACH-ENGINE

if (typeof Chess === "undefined") {
    document.getElementById("message").textContent =
        "Fehler: Schachregeln konnten nicht geladen werden.";
    throw new Error("Chess.js konnte nicht geladen werden.");
}

const chess = new Chess();

let selectedSquare = null;
let selectedPiece = null;
let possibleMoves = [];
let animations = [];

const pieceNames = {
    k: "König",
    q: "Dame",
    r: "Turm",
    b: "Läufer",
    n: "Springer",
    p: "Bauer"
};

// FIGUREN AUFSTELLEN

function createAllPieces() {
    pieces.forEach(piece => piece.mesh.dispose());
    pieces.length = 0;

    const position = chess.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const data = position[row][col];

            if (!data) continue;

            const mesh = createPieceMesh(
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

// ZUGFELDER MARKIEREN

let highlights = [];

function clearHighlights() {
    highlights.forEach(mesh => mesh.dispose());
    highlights = [];
}

function highlightSquare(row, col, mat, height = 0.04) {
    const marker = BABYLON.MeshBuilder.CreateBox(
        "highlight",
        {
            width: squareSize * 0.75,
            height,
            depth: squareSize * 0.75
        },
        scene
    );

    const pos = squarePosition(row, col);

    marker.position.set(pos.x, 0.06, pos.z);
    marker.material = mat;
    marker.isPickable = false;

    highlights.push(marker);
}

function showPossibleMoves(square) {
    clearHighlights();

    const moves = chess.moves({
        square,
        verbose: true
    });

    possibleMoves = moves;

    for (const move of moves) {
        const row = 8 - Number(move.to[1]);
        const col = "abcdefgh".indexOf(move.to[0]);

        highlightSquare(row, col, materials.possible);
    }

    const selectedRow = 8 - Number(square[1]);
    const selectedCol = "abcdefgh".indexOf(square[0]);

    highlightSquare(
        selectedRow,
        selectedCol,
        materials.selected,
        0.06
    );
}

// FIGUREN BEWEGEN

function movePiece(from, to) {
    const oldPiece = chess.get(to);

    if (oldPiece) {
        const captured = pieces.find(p =>
            p.row === 8 - Number(to[1]) &&
            p.col === "abcdefgh".indexOf(to[0])
        );

        if (captured) {
            captured.mesh.dispose();

            const index = pieces.indexOf(captured);
            if (index !== -1) pieces.splice(index, 1);
        }
    }

    const result = chess.move({
        from,
        to,
        promotion: "q"
    });

    if (!result) return;

    const fromRow = 8 - Number(from[1]);
    const fromCol = "abcdefgh".indexOf(from[0]);

    const toRow = 8 - Number(to[1]);
    const toCol = "abcdefgh".indexOf(to[0]);

    const movingPiece = pieces.find(p =>
        p.row === fromRow &&
        p.col === fromCol
    );

    if (movingPiece) {
        const target = squarePosition(toRow, toCol);

        animations.push({
            mesh: movingPiece.mesh,
            start: movingPiece.mesh.position.clone(),
            end: new BABYLON.Vector3(target.x, 0, target.z),
            time: 0
        });

        movingPiece.row = toRow;
        movingPiece.col = toCol;
    }

    // Bei Rochade und Umwandlung die Figuren neu aufbauen
    if (result.flags.includes("k") ||
        result.flags.includes("q") ||
        result.flags.includes("p")) {
        setTimeout(createAllPieces, 500);
    }

    selectedSquare = null;
    selectedPiece = null;
    possibleMoves = [];

    clearHighlights();
    updateHUD();

    if (chess.isCheckmate()) {
        document.getElementById("message").textContent =
            "🏆 SCHACHMATT! " +
            (chess.turn() === "w"
                ? "Die Schattenhorde gewinnt!"
                : "Das Elfenreich gewinnt!");
    } else if (chess.isDraw()) {
        document.getElementById("message").textContent =
            "Unentschieden!";
    } else if (chess.in_check()) {
        document.getElementById("message").textContent =
            "⚡ SCHACH! Der König ist bedroht!";
    } else {
        document.getElementById("message").textContent =
            "Zug: " + pieceNames[result.piece];
    }
}

// SPIELFELD KLICKEN

canvas.addEventListener("pointerdown", event => {
    const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        mesh => mesh.metadata &&
            mesh.metadata.square !== undefined
    );

    if (!pick || !pick.hit || !pick.pickedMesh) {
        const piecePick = scene.pick(
            scene.pointerX,
            scene.pointerY,
            mesh => mesh.metadata &&
                mesh.metadata.pieceRoot
        );

        if (piecePick && piecePick.hit) {
            const root = piecePick.pickedMesh.metadata.pieceRoot;
            const data = root.metadata;

            handleSquare(data.row, data.col);
        }

        return;
    }

    const data = pick.pickedMesh.metadata;
    handleSquare(data.row, data.col);
});

function handleSquare(row, col) {
    const square = "abcdefgh"[col] + (8 - row);
    const piece = chess.get(square);

    // Wenn bereits eine Figur ausgewählt ist
    if (selectedSquare) {
        const valid = possibleMoves.find(m => m.to === square);

        if (valid) {
            movePiece(selectedSquare, square);
            return;
        }
    }

    // Neue Figur auswählen
    if (piece && piece.color === chess.turn()) {
        selectedSquare = square;
        selectedPiece = piece;

        showPossibleMoves(square);

        document.getElementById("message").textContent =
            pieceNames[piece.type] + " ausgewählt – wähle ein Zielfeld.";

        return;
    }

    selectedSquare = null;
    selectedPiece = null;
    possibleMoves = [];

    clearHighlights();

    document.getElementById("message").textContent =
        "Wähle eine eigene Figur aus.";
}

// HUD

function updateHUD() {
    const turn = document.getElementById("turn");

    if (chess.turn() === "w") {
        turn.textContent = "🌿 Das Elfenreich ist am Zug";
    } else {
        turn.textContent = "🔥 Die Schattenhorde ist am Zug";
    }
}

// NEUES SPIEL

document.getElementById("restart").addEventListener("click", () => {
    chess.reset();

    selectedSquare = null;
    selectedPiece = null;
    possibleMoves = [];

    clearHighlights();

    animations = [];

    createAllPieces();
    updateHUD();

    document.getElementById("message").textContent =
        "Ein neues Spiel beginnt!";
});

// ANIMATIONEN

scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;

    for (let i = animations.length - 1; i >= 0; i--) {
        const animation = animations[i];

        animation.time += dt;

        const t = Math.min(animation.time / 0.3, 1);
        const smooth = t * t * (3 - 2 * t);

        animation.mesh.position.x = BABYLON.Scalar.Lerp(
            animation.start.x,
            animation.end.x,
            smooth
        );

        animation.mesh.position.z = BABYLON.Scalar.Lerp(
            animation.start.z,
            animation.end.z,
            smooth
        );

        animation.mesh.position.y =
            Math.sin(t * Math.PI) * 0.35;

        if (t >= 1) {
            animation.mesh.position.copyFrom(animation.end);
            animations.splice(i, 1);
        }
    }
});

// START

createAllPieces();
updateHUD();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});
