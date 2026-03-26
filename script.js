const S = 6, SP = 8 * S, SUB_W = 16, SUB_H = 8, SUB_PW = SUB_W * S, SUB_PH = SUB_H * S;
const VIEW_W = 128 * S, VIEW_H = 72 * S;
const WORLD_W = VIEW_W * 4, WORLD_H = VIEW_H * 3, FLOOR_Y = WORLD_H - 24;
const DANGER_DEPTH = WORLD_H * .75, SAFE_DEPTH = WORLD_H * .60;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
if (canvas) { canvas.width = VIEW_W; canvas.height = VIEW_H; }

const mmCanvas = document.getElementById('minimap');
const mm = mmCanvas ? mmCanvas.getContext('2d') : null;

let gameState = 'start', score = 0, seaweedTick = 0, deathFadeAlpha = 0, startPulse = 0;

const PAL = [null, '#000000', '#FFFFFF', '#880000', '#AAFFEE', '#CC44CC', '#00CC55', '#0000AA', '#EEEE77', '#DD8855', '#664400', '#FF7777', '#333333', '#777777', '#AAFF66', '#0088FF', '#222222', '#444444', '#FF0000', '#FF88CC', '#FF44AA'];
const FISH_COLORS = [['#FF88CC', '#FF44AA'], ['#FF4444', '#BB1111'], ['#4499FF', '#1155CC']];
const SUB_DATA = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const RAW = {
    hook: [0, 0, 13, 13, 13, 13, 0, 0, 0, 13, 13, 0, 0, 13, 13, 0, 13, 13, 0, 0, 0, 0, 13, 13, 13, 13, 0, 0, 0, 0, 13, 13, 13, 13, 0, 0, 0, 0, 13, 13, 0, 13, 0, 0, 0, 0, 13, 13, 0, 13, 13, 0, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bottle: [0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0, 8, 8, 8, 8, 0, 0, 0, 0, 8, 8, 8, 8, 0, 0, 0, 0, 8, 8, 8, 8, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0],
    coke: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 18, 18, 18, 0, 0, 0, 0, 11, 11, 11, 11, 0, 0, 0, 0, 11, 11, 11, 11, 0, 0, 0, 0, 11, 11, 11, 11, 0, 0, 0, 0, 18, 18, 18, 18, 0, 0, 0, 0, 18, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bag: [0, 2, 2, 0, 0, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    tire: [0, 0, 12, 12, 12, 12, 0, 0, 0, 12, 12, 13, 13, 12, 12, 0, 12, 12, 13, 0, 0, 13, 12, 12, 12, 12, 13, 0, 0, 13, 12, 12, 12, 12, 13, 0, 0, 13, 12, 12, 12, 12, 13, 0, 0, 13, 12, 12, 0, 12, 12, 13, 13, 12, 12, 0, 0, 0, 12, 12, 12, 12, 0, 0],
    bubble: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 4, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    seaweedA: [0, 0, 6, 0, 0, 6, 0, 0, 0, 6, 6, 0, 6, 6, 0, 0, 6, 6, 0, 0, 0, 6, 6, 0, 0, 6, 6, 0, 6, 6, 0, 0, 0, 0, 6, 6, 6, 0, 0, 0, 0, 6, 6, 0, 6, 6, 0, 0, 6, 6, 0, 0, 0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6],
    seaweedB: [0, 14, 14, 0, 14, 14, 0, 0, 14, 14, 14, 14, 14, 14, 14, 0, 14, 14, 0, 14, 14, 0, 14, 0, 0, 14, 14, 14, 14, 14, 0, 0, 0, 0, 14, 14, 14, 0, 0, 0, 0, 14, 14, 0, 14, 14, 0, 0, 14, 14, 0, 0, 0, 14, 14, 0, 14, 14, 14, 14, 14, 14, 14, 14],
    seaweedC: [0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6],
    fish: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 0, 19, 19, 20, 20, 19, 2, 19, 19, 19, 19, 20, 20, 19, 19, 19, 19, 0, 19, 19, 19, 19, 19, 19, 0, 0, 0, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const cache = {};
function buildSprite(key, data, w, h, flip) {
    if (!document) return;
    const oc = document.createElement('canvas');
    oc.width = w * S; oc.height = h * S;
    const c = oc.getContext('2d');
    for (let i = 0; i < w * h; i++) { const ci = data[i]; if (!ci) continue; c.fillStyle = PAL[ci]; c.fillRect((flip ? w - 1 - (i % w) : i % w) * S, Math.floor(i / w) * S, S, S); }
    cache[key] = oc;
}
if (canvas) {
    buildSprite('sub', SUB_DATA, SUB_W, SUB_H, false);
    buildSprite('sub_f', SUB_DATA, SUB_W, SUB_H, true);
    for (const [name, data] of Object.entries(RAW)) {
        if (name === 'fish') continue;
        buildSprite(name, data, 8, 8, false); buildSprite(name + '_f', data, 8, 8, true);
    }
    FISH_COLORS.forEach(([body, fin], vi) => {
        for (const flip of [false, true]) {
            const key = `fish${vi}` + (flip ? '_f' : '');
            const oc = document.createElement('canvas'); oc.width = 8 * S; oc.height = 8 * S;
            const c = oc.getContext('2d');
            for (let i = 0; i < 64; i++) { const ci = RAW.fish[i]; if (!ci) continue; c.fillStyle = ci === 19 ? body : ci === 20 ? fin : PAL[ci]; c.fillRect((flip ? 7 - (i % 8) : i % 8) * S, Math.floor(i / 8) * S, S, S); }
            cache[key] = oc;
        }
    });
}
function blit(name, wx, wy, flip = false) { if (ctx) ctx.drawImage(cache[flip ? name + '_f' : name], wx - cam.x, wy - cam.y); }

const TRASH_T = ['bottle', 'bag', 'tire', 'coke'], WEED_T = ['seaweedA', 'seaweedB', 'seaweedC'];
let worldTrash = [], worldSeaweeds = [], worldBubbles = [], worldFish = [], worldVortices = [], particles = [];
const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => a + Math.floor(Math.random() * (b - a));
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

function spreadItems(count, minD, xR, yR) {
    const items = []; let tries = 0;
    while (items.length < count && tries < count * 30) {
        tries++;
        const nx = rnd(xR[0], xR[1]), ny = rnd(yR[0], yR[1]);
        if (items.every(p => (nx - p.x) ** 2 + (ny - p.y) ** 2 >= minD * minD)) items.push({ x: nx, y: ny });
    }
    return items;
}
function generateWorld() {
    worldTrash = []; worldSeaweeds = []; worldBubbles = []; worldFish = []; worldVortices = []; particles = [];
    spreadItems(80, SP * 2.5, [0, WORLD_W - SP], [SP * 2, FLOOR_Y - SP]).forEach(p => worldTrash.push({ x: p.x, y: p.y, type: TRASH_T[rndInt(0, 4)] }));
    for (let x = 0; x < WORLD_W;) { x += rnd(SP * .4, SP * 2.5); if (x < WORLD_W) worldSeaweeds.push({ x, y: FLOOR_Y - SP + rndInt(0, 3) * S, type: WEED_T[rndInt(0, 3)], phase: rnd(0, Math.PI * 2), speed: rnd(.02, .05) }); x += SP; }
    for (let i = 0; i < 47; i++)worldBubbles.push({ x: rnd(0, WORLD_W), y: rnd(0, WORLD_H), vy: rnd(.5, 2.5) });
    for (let i = 0; i < 40; i++) { const sp = rnd(.6, 2.2); worldFish.push({ x: rnd(0, WORLD_W - SP), y: rnd(SP * 2, FLOOR_Y - SP * 3), vx: (Math.random() < .5 ? 1 : -1) * sp, vy: rnd(-.3, .3), variant: rndInt(0, 3), wobble: rnd(0, Math.PI * 2), wobbleSpeed: rnd(.03, .07), swimTimer: rnd(0, 200) }); }
    for (let i = 0; i < 5; i++)spawnVortex();
}
function spawnVortex() {
    const nearBottom = Math.random() < .6;
    const y = nearBottom ? rnd(DANGER_DEPTH, FLOOR_Y - SP * 4) : rnd(SP * 4, DANGER_DEPTH);
    const depthFactor = Math.max(0, (y - SAFE_DEPTH) / (FLOOR_Y - SAFE_DEPTH));
    const radius = rnd(SP * 2.5, SP * 4) + depthFactor * SP * 5.5;
    const angSpeed = (rnd(.03, .08) + depthFactor * .07) * (Math.random() < .5 ? 1 : -1);
    worldVortices.push({
        x: rnd(SP * 4, WORLD_W - SP * 4), y,
        vx: (Math.random() < .5 ? 1 : -1) * rnd(.3, 1.0), vy: rnd(-.2, .2),
        radius, angle: rnd(0, Math.PI * 2), angSpeed,
        life: 1, maxLife: rnd(700, 1800) + depthFactor * 900, age: 0, depthFactor
    });
}
function spawnTrash() {
    let best = { x: rnd(0, WORLD_W - SP), y: rnd(SP * 2, FLOOR_Y - SP) }, bestD = 0;
    for (let i = 0; i < 12; i++) { const cx = rnd(0, WORLD_W - SP), cy = rnd(SP * 2, FLOOR_Y - SP); const mD = worldTrash.reduce((m, t) => Math.min(m, (cx - t.x) ** 2 + (cy - t.y) ** 2), Infinity); if (mD > bestD) { bestD = mD; best = { x: cx, y: cy }; } }
    worldTrash.push({ x: best.x, y: best.y, type: TRASH_T[rndInt(0, 4)] });
}

const cam = { x: 0, y: 0 };
function updateCam() {
    cam.x += (player.x + SUB_PW / 2 - VIEW_W / 2 - cam.x) * .10;
    cam.y += (player.y + SUB_PH / 2 - VIEW_H / 2 - cam.y) * .10;
    cam.x = Math.max(0, Math.min(WORLD_W - VIEW_W, cam.x));
    cam.y = Math.max(0, Math.min(WORLD_H - VIEW_H, cam.y));
}
function inView(wx, wy, pw = SP, ph = SP) { return wx + pw > cam.x - 4 && wx < cam.x + VIEW_W + 4 && wy + ph > cam.y - 4 && wy < cam.y + VIEW_H + 4; }

const player = { x: WORLD_W / 2 - SUB_PW / 2, y: WORLD_H / 2, vx: 0, vy: 0, facingLeft: false, hp: 100, maxHp: 100, flashTimer: 0, dead: false };
const current = { vx: 0, vy: 0, targetVx: 0, targetVy: 0, changeTimer: 0, changeInterval: 420, stormActive: false, stormTimer: 0, stormDuration: 0, stormCooldown: 0 };
const hook = { active: false, length: 0, maxLength: 280, speed: 10, state: 'idle', cargo: null };
const keys = {};

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        const frame = document.getElementById('ecosub-frame');
        if (frame) {
            const rect = frame.getBoundingClientRect();
            if (rect.top <= window.innerHeight && rect.bottom >= 0) e.preventDefault();
        }
    }
    if ((e.code === 'Space' || e.code === 'Enter') && gameState === 'start') startGame();
    if ((e.code === 'Space' || e.code === 'Enter') && gameState === 'dead') startGame();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function startGame() {
    score = 0; seaweedTick = 0; deathFadeAlpha = 0;
    player.x = WORLD_W / 2 - SUB_PW / 2; player.y = WORLD_H / 2;
    player.vx = 0; player.vy = 0; player.facingLeft = false; player.hp = 100; player.flashTimer = 0; player.dead = false;
    hook.active = false; hook.state = 'idle'; hook.cargo = null;
    cam.x = player.x + SUB_PW / 2 - VIEW_W / 2; cam.y = player.y + SUB_PH / 2 - VIEW_H / 2;
    current.stormActive = false; current.stormCooldown = rndInt(900, 1800);
    current.vx = 0; current.vy = 0; current.targetVx = 0; current.targetVy = 0;
    generateWorld(); gameState = 'playing'; cachedBg = null; cachedBgCamY = -999;
}

function updateCurrent() {
    current.changeTimer++;
    if (current.changeTimer >= current.changeInterval) { current.changeTimer = 0; current.changeInterval = rndInt(300, 700); const a = rnd(0, Math.PI * 2), s = rnd(.3, 1.4); current.targetVx = Math.cos(a) * s; current.targetVy = Math.sin(a) * s * .4; }
    current.vx += (current.targetVx - current.vx) * .01; current.vy += (current.targetVy - current.vy) * .01;
    if (!current.stormActive) { current.stormCooldown--; if (current.stormCooldown <= 0) { current.stormActive = true; current.stormDuration = rndInt(280, 560); current.stormTimer = 0; current.stormCooldown = rndInt(600, 1400); } }
    else { current.stormTimer++; if (current.stormTimer >= current.stormDuration) current.stormActive = false; }
}

function hookAnchorW() { return { x: player.x + SUB_PW / 2 - SP / 2, y: player.y + SUB_PH }; }

function spawnParticles(wx, wy, colors, n = 8, spd = 3) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; particles.push({ x: wx, y: wy, vx: Math.cos(a) * rnd(1.5, spd), vy: Math.sin(a) * rnd(1.5, spd), life: 1, color: colors[rndInt(0, colors.length)] }); }
}

const ACCEL = .55, FRIC = .87, MAXSPD = 5.5;
function update() {
    startPulse += .04;
    if (gameState !== 'playing') return;
    updateCurrent();
    let ax = 0, ay = 0;
    if (keys['ArrowLeft']) ax -= ACCEL; if (keys['ArrowRight']) ax += ACCEL;
    if (keys['ArrowUp']) ay -= ACCEL; if (keys['ArrowDown']) ay += ACCEL;
    const sm = current.stormActive ? 2.5 : 1;
    player.vx += ax + current.vx * .18 * sm; player.vy += ay + current.vy * .18 * sm;
    if (current.stormActive) { player.vx += (Math.random() - .5) * .8; player.vy += (Math.random() - .5) * .4; }
    player.vx = Math.max(-MAXSPD, Math.min(MAXSPD, player.vx)) * FRIC;
    player.vy = Math.max(-MAXSPD, Math.min(MAXSPD, player.vy)) * FRIC;
    if (Math.abs(player.vx) > .08) player.facingLeft = player.vx < 0;
    player.x = Math.max(0, Math.min(WORLD_W - SUB_PW, player.x + player.vx));
    player.y = Math.max(0, Math.min(FLOOR_Y - SUB_PH, player.y + player.vy));
    if (player.flashTimer > 0) player.flashTimer--;
    if (player.y > DANGER_DEPTH) {
        const df = (player.y - DANGER_DEPTH) / (FLOOR_Y - DANGER_DEPTH);
        player.hp = Math.max(0, player.hp - lerp(.08, .35, df)); player.flashTimer = 8;
        if (Math.random() < .07) spawnParticles(player.x + rnd(0, SUB_PW), player.y + rnd(0, SUB_PH), ['#FF4444', '#FF8800', '#FFFF44', '#FF2200'], 12, 4);
        if (player.hp <= 0) { player.dead = true; gameState = 'dead'; }
    }
    if (player.y < SAFE_DEPTH && player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + .03);
    if (keys['Space'] && hook.state === 'idle') { hook.active = true; hook.state = 'out'; hook.length = 0; hook.cargo = null; }
    if (hook.active) {
        const anch = hookAnchorW(); const tipX = anch.x + SP / 2, tipY = anch.y + hook.length;
        if (hook.state === 'out') {
            hook.length += hook.speed;
            for (let i = worldTrash.length - 1; i >= 0; i--) { const t = worldTrash[i]; if (tipX < t.x + SP && tipX + SP > t.x && tipY < t.y + SP && tipY + SP > t.y) { hook.cargo = { type: t.type, x: t.x, y: t.y }; worldTrash.splice(i, 1); hook.state = 'in'; break; } }
            if (hook.length >= hook.maxLength) hook.state = 'in';
        } else {
            hook.length -= hook.speed;
            if (hook.cargo) { const a2 = hookAnchorW(); hook.cargo.x = a2.x; hook.cargo.y = a2.y + hook.length - SP / 2; }
            if (hook.length <= 0) { hook.length = 0; if (hook.cargo) { spawnParticles(player.x + SUB_PW / 2 - SP / 2, player.y, ['#AAFF66', '#44FFCC', '#FFFFFF', '#FFFF44']); score += 10; hook.cargo = null; spawnTrash(); } hook.state = 'idle'; hook.active = false; }
        }
    }
    for (let vi = worldVortices.length - 1; vi >= 0; vi--) {
        const v = worldVortices[vi]; v.age++; v.life = 1 - v.age / v.maxLife; v.angle += v.angSpeed; v.x += v.vx; v.y += v.vy;
        if (v.x < SP * 2 || v.x > WORLD_W - SP * 2) v.vx *= -1; if (v.y < SP * 2 || v.y > FLOOR_Y - SP * 2) v.vy *= -1;
        if (v.life <= 0) { worldVortices.splice(vi, 1); spawnVortex(); continue; }
        const pr = v.radius * v.life;
        for (const t of worldTrash) { const dx = v.x - t.x, dy = v.y - t.y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < pr && dist > 2) { const f = (1 - dist / pr) * 1.2; t.x += (-dy / dist) * f * Math.sign(v.angSpeed); t.y += (dx / dist) * f * Math.sign(v.angSpeed); t.x += (dx / dist) * f * .3; t.y += (dy / dist) * f * .3; t.x = Math.max(0, Math.min(WORLD_W - SP, t.x)); t.y = Math.max(SP, Math.min(FLOOR_Y - SP, t.y)); } }
        const pdx = v.x - player.x, pdy = v.y - player.y, pd = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pd < pr && pd > 2) {
            const prox = 1 - pd / pr, proxSq = prox * prox;
            const df = v.depthFactor || 0, depthMult = 1 + df * 4.5;
            const tang = proxSq * 2.4 * depthMult;
            player.vx += (-pdy / pd) * tang * Math.sign(v.angSpeed);
            player.vy += (pdx / pd) * tang * Math.sign(v.angSpeed);
            const suck = proxSq * 2.0 * depthMult;
            player.vx += (pdx / pd) * suck;
            player.vy += (pdy / pd) * suck;
            const outSpeed = (player.vx * (pdx / pd)) + (player.vy * (pdy / pd));
            if (outSpeed > 0) { const brake = prox * outSpeed * depthMult * 0.60; player.vx -= (pdx / pd) * brake; player.vy -= (pdy / pd) * brake; }
        }
    }
    for (const b of worldBubbles) { b.y -= b.vy; if (b.y < -SP) { b.y = WORLD_H + SP; b.x = rnd(0, WORLD_W); } }
    for (const f of worldFish) { f.wobble += f.wobbleSpeed; f.swimTimer++; if (f.swimTimer > rnd(120, 300)) { f.swimTimer = 0; f.vx = (Math.random() < .5 ? 1 : -1) * rnd(.6, 2.2); f.vy = rnd(-.4, .4); } f.x += f.vx; f.y += f.vy + Math.sin(f.wobble) * .4; if (f.x < -SP) f.x = WORLD_W; if (f.x > WORLD_W) f.x = -SP; if (f.y < SP) { f.y = SP; f.vy = Math.abs(f.vy); } if (f.y > FLOOR_Y - SP * 2) { f.y = FLOOR_Y - SP * 2; f.vy = -Math.abs(f.vy); } }
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += .1; p.life -= .04; if (p.life <= 0) particles.splice(i, 1); }
    seaweedTick += .04; updateCam();
}

let cachedBg = null, cachedBgCamY = -999;
function lerpHex(a, b, t) { const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16); const r = Math.round(lerp(ah >> 16, bh >> 16, t)), g = Math.round(lerp((ah >> 8) & 255, (bh >> 8) & 255, t)), bl = Math.round(lerp(ah & 255, bh & 255, t)); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`; }
function getBg() {
    if (Math.abs(cam.y - cachedBgCamY) > 50 || !cachedBg) { const t0 = cam.y / WORLD_H, t1 = (cam.y + VIEW_H) / WORLD_H; cachedBg = ctx.createLinearGradient(0, 0, 0, VIEW_H); cachedBg.addColorStop(0, lerpHex('#44AAFF', '#006699', t0)); cachedBg.addColorStop(1, lerpHex('#2288DD', '#003355', t1)); cachedBgCamY = cam.y; }
    return cachedBg;
}

function ctext(text, x, y, size, color, align, bold, shadow, sblur, alpha = 1) {
    if(!ctx) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = (bold ? 'bold ' : '') + size + 'px "Courier New",monospace';
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = sblur || size; }
    ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}

function drawStartScreen() {
    if(!ctx) return;
    const t = Date.now() * .001;
    const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    bg.addColorStop(0, '#061525'); bg.addColorStop(1, '#001020');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 10; i++) { const wy = VIEW_H * .25 + Math.sin(t + i * 1.2) * VIEW_H * .06 + i * VIEW_H * .05; ctx.strokeStyle = `rgba(0,120,220,${.04 + .02 * Math.sin(t * 1.5 + i)})`; ctx.lineWidth = VIEW_H * .12; ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(VIEW_W, wy); ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const bx = ((i * 137 + t * 28) % VIEW_W), by = VIEW_H - ((t * 35 + i * 55) % VIEW_H); ctx.beginPath(); ctx.arc(bx, by, 1.5 + i % 3, 0, Math.PI * 2); ctx.strokeStyle = `rgba(80,180,255,${.15 + .1 * Math.sin(t + i)})`; ctx.lineWidth = 1; ctx.stroke(); }
    ctext('ECOSUB', VIEW_W / 2, VIEW_H * .18, S * 13, '#ffffff', 'center', true, '#00aaff', S * 10);
    ctext('OCEAN CLEANUP', VIEW_W / 2, VIEW_H * .30, S * 4, '#66ccff', 'center', false, '#0055aa', S * 5);
    ctx.strokeStyle = 'rgba(0,150,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(VIEW_W * .15, VIEW_H * .40); ctx.lineTo(VIEW_W * .85, VIEW_H * .40); ctx.stroke(); ctx.setLineDash([]);
    const lines = ['⚡  Течения и штормы — сносят субмарину', '🌊  Глубинное давление — разрушает корпус', '🌀  Мусорные вихри — блуждают по океану'];
    lines.forEach((l, i) => ctext(l, VIEW_W / 2, VIEW_H * .50 + i * S * 6.5, S * 2.5, '#99bbdd', 'center'));
    ctx.strokeStyle = 'rgba(0,120,200,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(VIEW_W * .15, VIEW_H * .72); ctx.lineTo(VIEW_W * .85, VIEW_H * .72); ctx.stroke(); ctx.setLineDash([]);
    ctext('СТРЕЛКИ — движение  |  ПРОБЕЛ — крюк', VIEW_W / 2, VIEW_H * .79, S * 2, '#556677', 'center');
    const bp = .65 + .35 * Math.sin(startPulse * 2);
    ctext('[ ПРОБЕЛ  или  ENTER ]', VIEW_W / 2, VIEW_H * .89, S * 3.8, `rgba(255,238,100,${bp})`, 'center', true, '#cc9900', S * 6);
    ctext('— НАЧАТЬ ИГРУ —', VIEW_W / 2, VIEW_H * .95, S * 2, `rgba(180,160,60,${bp * .7})`, 'center');
    const sx = (t * 55) % (VIEW_W + SUB_PW) - SUB_PW;
    const sy = VIEW_H * .64 + Math.sin(t * 1.5) * S * 2;
    ctx.drawImage(cache['sub'], sx, sy);
}

function drawHUD() {
    if(!ctx) return;
    ctx.fillStyle = 'rgba(0,5,20,0.60)'; ctx.fillRect(0, 0, VIEW_W, S * 7.5);
    ctext('SCORE: ' + score, 14, S * 3.5, S * 2.8, '#eee777', 'left', false, '#888800', 5);
    const depth = Math.round((player.y / WORLD_H) * 4000);
    ctext(depth + 'м', VIEW_W / 2, S * 3.5, S * 2.8, '#44ccff', 'center', false, '#006699', 5);
    const zx = String.fromCharCode(65 + Math.floor(player.x / (WORLD_W / 8)));
    const zy = Math.floor(player.y / (WORLD_H / 6)) + 1;
    ctext('ЗОНА ' + zx + zy, VIEW_W - 14, S * 3.5, S * 2.8, '#88ffaa', 'right');
    const bw = 130, bh = 8, bx = 12, by = VIEW_H - 14 - bh;
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = player.hp > 60 ? '#44ff44' : player.hp > 30 ? '#ffaa00' : '#ff3333';
    ctx.fillRect(bx, by, bw * (player.hp / 100), bh);
    ctx.strokeStyle = '#335'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    ctext('КОРПУС', bx + bw / 2, by - S * 1.8, S * 1.8, '#ff9999', 'center');
    const mag = Math.sqrt(current.vx ** 2 + current.vy ** 2);
    const dir = mag < .1 ? '—' : current.vx > .3 ? '→' : current.vx < -.3 ? '←' : current.vy > .1 ? '↓' : '↑';
    ctext('ТЕЧЕНИЕ: ' + dir + ' ' + mag.toFixed(1) + 'кт', VIEW_W - 14, VIEW_H - 14, S * 2, '#88aacc', 'right');
    if (current.stormActive) { const sp = .6 + .4 * Math.sin(Date.now() * .006); ctext('⚡ ШТОРМ! ⚡', VIEW_W / 2, VIEW_H - 14 - S * 4.5, S * 3, `rgba(180,230,255,${sp})`, 'center', true, '#0088ff', S * 6); }
    if (player.y > DANGER_DEPTH) { const pp = .7 + .3 * Math.sin(Date.now() * .007); ctext('⚠ КРИТИЧЕСКОЕ ДАВЛЕНИЕ ⚠', VIEW_W / 2, VIEW_H - 14 - (current.stormActive ? S * 10 : S * 4.5), S * 2.5, `rgba(255,100,100,${pp})`, 'center', true, '#ff0000', S * 4); }
}

function drawDeathScreen() {
    if(!ctx) return;
    deathFadeAlpha = Math.min(1, deathFadeAlpha + .016);
    ctx.fillStyle = `rgba(50,0,0,${deathFadeAlpha * .82})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (deathFadeAlpha < .28) return;
    const a = Math.min(1, (deathFadeAlpha - .28) / .72);
    const pw = 340, ph = 210, px = (VIEW_W - pw) / 2, py = (VIEW_H - ph) / 2;
    ctx.fillStyle = `rgba(8,0,0,${a * .92})`; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = `rgba(200,40,40,${a * .85})`; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
    ctx.strokeStyle = `rgba(120,20,20,${a * .5})`; ctx.lineWidth = 1; ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
    ctext('СУБМАРИНА РАЗРУШЕНА', VIEW_W / 2, py + 52, S * 4.5, `rgba(255,70,70,${a})`, 'center', true, '#ff0000', S * 6, a);
    ctext('СЧЁТ: ' + score, VIEW_W / 2, py + 108, S * 5.5, `rgba(238,238,100,${a})`, 'center', true, '#aaaa00', S * 5, a);
    if (deathFadeAlpha > .75) { const bp = .45 + .55 * Math.sin(Date.now() * .004); ctext('[ ПРОБЕЛ / ENTER — ЗАНОВО ]', VIEW_W / 2, py + 168, S * 2.8, `rgba(200,200,200,${bp})`, 'center', false, null, 0, bp); }
}

function draw() {
    if(!ctx) return;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (gameState === 'start') { drawStartScreen(); return; }

    ctx.fillStyle = getBg(); ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (current.stormActive) { const p = .04 + .04 * Math.sin(Date.now() * .03); ctx.fillStyle = `rgba(100,180,255,${p})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }

    const floorSY = Math.round(FLOOR_Y - cam.y);
    if (floorSY < VIEW_H) { ctx.fillStyle = '#4a2d0a'; ctx.fillRect(0, floorSY, VIEW_W, VIEW_H - floorSY); ctx.fillStyle = '#6b3d0e'; ctx.fillRect(0, floorSY, VIEW_W, 10); }

    const dsY = DANGER_DEPTH - cam.y;
    if (dsY < VIEW_H) {
        const dT = Math.max(0, Math.min(1, (player.y - DANGER_DEPTH) / (FLOOR_Y - DANGER_DEPTH)));
        const al = lerp(.06, .28, dT) * (.7 + .3 * Math.sin(Date.now() * .004));
        const gr = ctx.createLinearGradient(0, Math.max(0, dsY - 40), 0, VIEW_H);
        gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(180,0,0,${al})`);
        ctx.fillStyle = gr; ctx.fillRect(0, Math.max(0, dsY - 40), VIEW_W, VIEW_H);
        if (dsY > 0 && dsY < VIEW_H) { const p2 = .5 + .4 * Math.sin(Date.now() * .006); ctx.strokeStyle = `rgba(255,60,60,${p2})`; ctx.lineWidth = 2; ctx.setLineDash([12, 8]); ctx.beginPath(); ctx.moveTo(0, dsY); ctx.lineTo(VIEW_W, dsY); ctx.stroke(); ctx.setLineDash([]); }
    }

    for (const b of worldBubbles) if (inView(b.x, b.y)) blit('bubble', b.x, b.y);
    for (const sw of worldSeaweeds) { if (!inView(sw.x, sw.y)) continue; const sway = Math.sin(seaweedTick * sw.speed * 25 + sw.phase) * 2.5 * S; ctx.save(); ctx.translate(Math.round(sw.x - cam.x) + SP / 2, Math.round(sw.y - cam.y) + SP); ctx.transform(1, 0, sway / SP, 1, 0, 0); ctx.drawImage(cache[sw.type], -SP / 2, -SP); ctx.restore(); }
    for (const t of worldTrash) if (inView(t.x, t.y)) blit(t.type, t.x, t.y);

    for (const v of worldVortices) {
        const sx = v.x - cam.x, sy = v.y - cam.y;
        if (sx < -v.radius || sx > VIEW_W + v.radius || sy < -v.radius || sy > VIEW_H + v.radius) continue;
        const r = v.radius * v.life;
        const df = v.depthFactor || 0;
        const t2 = Date.now() * .001;
        const cr = Math.round(lerp(120, 220, df)), cg = Math.round(lerp(200, 60, df)), cb = Math.round(lerp(255, 180, df));
        const al = (.07 + .14 * v.life) * (1 + df * .6);
        const arms = 3 + Math.round(df * 2); 
        for (let arm = 0; arm < arms; arm++) {
            const ao = (arm / arms) * Math.PI * 2;
            ctx.beginPath();
            for (let i = 0; i <= 80; i++) { const fr = i / 80, ang = v.angle + ao + fr * Math.PI * 5, d = fr * r, px2 = sx + Math.cos(ang) * d, py2 = sy + Math.sin(ang) * d; i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2); }
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${al})`;
            ctx.lineWidth = df > 0.5 ? 3.5 : 2.5; ctx.stroke();
        }
        const pulse = 1 + .25 * Math.sin(t2 * 4 + v.angle);
        const coreR = r * .38 * pulse;
        const gd = ctx.createRadialGradient(sx, sy, 0, sx, sy, coreR);
        gd.addColorStop(0, `rgba(${cr},${cg},${cb},${(.28 + df * .35) * v.life})`);
        gd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = gd; ctx.beginPath(); ctx.arc(sx, sy, coreR, 0, Math.PI * 2); ctx.fill();
        const ringAlpha = (.06 + df * .18) * (0.7 + .3 * Math.sin(t2 * 2 + v.angle));
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${ringAlpha})`; ctx.lineWidth = df > .4 ? 2 : 1; ctx.stroke();
        if (df > .55 && sy > 0 && sy < VIEW_H) {
            const warn = .5 + .5 * Math.sin(t2 * 5);
            ctx.save(); ctx.globalAlpha = warn * v.life;
            ctx.font = `bold ${S * 2}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(255,100,60,${warn})`; ctx.shadowColor = '#ff2200'; ctx.shadowBlur = S * 3;
            ctx.fillText('⚠', sx, sy - r - S * 2);
            ctx.restore();
        }
    }

    for (const f of worldFish) { if (!inView(f.x, f.y)) continue; ctx.drawImage(cache[`fish${f.variant}` + (f.vx < 0 ? '_f' : '')], Math.round(f.x - cam.x), Math.round(f.y - cam.y)); }

    if (hook.active) {
        const anch = hookAnchorW(); const sx = Math.round(anch.x - cam.x + SP / 2), sy = Math.round(anch.y - cam.y);
        if (hook.cargo) {
            ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + hook.length); ctx.stroke(); ctx.setLineDash([]);
            const sw2 = Math.sin(Date.now() * .008) * 3; ctx.save(); ctx.translate(Math.round(hook.cargo.x - cam.x) + SP / 2 + sw2, Math.round(hook.cargo.y - cam.y) + SP / 2); ctx.rotate(sw2 * .05); ctx.drawImage(cache[hook.cargo.type], -SP / 2, -SP / 2); ctx.restore();
            blit('hook', hook.cargo.x, hook.cargo.y + SP - 4);
        } else { ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + hook.length); ctx.stroke(); blit('hook', anch.x, anch.y + hook.length); }
    }

    for (const p of particles) { const sx = Math.round(p.x - cam.x), sy = Math.round(p.y - cam.y); if (sx < -8 || sx > VIEW_W + 8 || sy < -8 || sy > VIEW_H + 8) continue; ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(sx - 3, sy - 3, 6, 6); ctx.globalAlpha = 1; }

    if (player.flashTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) ctx.drawImage(cache[player.facingLeft ? 'sub_f' : 'sub'], Math.round(player.x - cam.x), Math.round(player.y - cam.y));

    const dT = player.y / WORLD_H;
    if (dT > .05) { const cx = player.x - cam.x + SUB_PW / 2, cy = player.y - cam.y + SUB_PH / 2, vr = lerp(360, 110, dT), va = lerp(0, .7, dT); const vg = ctx.createRadialGradient(cx, cy, 8, cx, cy, vr); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.6, `rgba(0,0,0,${va * .25})`); vg.addColorStop(1, `rgba(0,0,0,${va})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }

    drawHUD();
    if (gameState === 'dead') drawDeathScreen();
    drawMinimap();
}

function drawMinimap() {
    if(!mm) return;
    const mw = 120, mh = 80, sx = mw / WORLD_W, sy = mh / WORLD_H;
    mm.fillStyle = 'rgba(0,0,20,0.92)'; mm.fillRect(0, 0, mw, mh);
    mm.fillStyle = '#5a3008'; mm.fillRect(0, Math.round(FLOOR_Y * sy), mw, mh);
    mm.fillStyle = 'rgba(180,0,0,0.25)'; mm.fillRect(0, Math.round(DANGER_DEPTH * sy), mw, mh - Math.round(DANGER_DEPTH * sy));
    for (const v of worldVortices) { mm.beginPath(); mm.arc(Math.round(v.x * sx), Math.round(v.y * sy), Math.max(2, v.radius * sx * v.life), 0, Math.PI * 2); mm.strokeStyle = `rgba(100,200,255,${.5 * v.life})`; mm.lineWidth = 1; mm.stroke(); }
    mm.fillStyle = '#dd4'; for (const t of worldTrash) mm.fillRect(Math.round(t.x * sx), Math.round(t.y * sy), 2, 2);
    const fc = ['#FF88CC', '#FF4444', '#4499FF']; for (const f of worldFish) { mm.fillStyle = fc[f.variant]; mm.fillRect(Math.round(f.x * sx), Math.round(f.y * sy), 2, 2); }
    mm.strokeStyle = '#4488ff'; mm.lineWidth = 1; mm.strokeRect(Math.round(cam.x * sx), Math.round(cam.y * sy), Math.round(VIEW_W * sx), Math.round(VIEW_H * sy));
    mm.fillStyle = '#0ff'; mm.fillRect(Math.round(player.x * sx) - 2, Math.round(player.y * sy) - 2, 4, 3);
}

let lastTs = 0;
const TARGET = 1000 / 60;
function loop(ts) {
    if (ts - lastTs >= TARGET - 1) { lastTs = ts; update(); draw(); }
    requestAnimationFrame(loop);
}
if(canvas) requestAnimationFrame(loop);

function toggleFullscreen() {
    const frame = document.getElementById('ecosub-frame');
    if (!document.fullscreenElement) {
        frame.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const scrollBtn = document.getElementById('scrollTopBtn');
    if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    if(scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 500);
});

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
});

// ============================
// PHOTO SLIDER
// ============================
let currentSlide = 0;
let sliderInterval;

function initSlider() {
    const track = document.getElementById('photoSlider');
    if (!track) return;
    
    const slides = track.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('sliderDots');
    
    // Create dots
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    });
    
    // Auto advance
    startSliderAutoPlay();
    
    // Pause on hover
    const container = document.querySelector('.slider-container');
    container.addEventListener('mouseenter', () => clearInterval(sliderInterval));
    container.addEventListener('mouseleave', startSliderAutoPlay);
}

function startSliderAutoPlay() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        moveSlider(1);
    }, 5000); // Change slide every 5 seconds
}

function moveSlider(dir) {
    const track = document.getElementById('photoSlider');
    if (!track) return;
    const slidesCount = track.querySelectorAll('.slide').length;
    
    currentSlide = (currentSlide + dir + slidesCount) % slidesCount;
    updateSlider();
}

function goToSlide(index) {
    currentSlide = index;
    updateSlider();
}

function updateSlider() {
    const track = document.getElementById('photoSlider');
    const dots = document.querySelectorAll('.dot');
    
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

document.addEventListener('DOMContentLoaded', initSlider);

// ============================
// EXHIBIT MODAL
// ============================
const EXHIBITS = {
    1: {
        image: 'ex_bottle.png',
        badge: '#1',
        title: 'Пластиковые бутылки',
        tags: ['Пластик', 'ПЭТ', 'Берег'],
        material: 'ПЭТ — Полиэтилентерефталат. Прозрачный, лёгкий и прочный пластик первого класса переработки.',
        reason: 'Выброшены на берег отдыхающими или принесены рекой Северная Двина из населённых пунктов. Этот тип мусора составляет до 35% от всего загрязнения прибрежной полосы.',
        danger: 4,
        dangerLabel: 'Высокая'
    },
    2: {
        image: 'ex_net.png',
        badge: '#2',
        title: 'Рыболовные снасти',
        tags: ['Нейлон', 'Капрон', 'Морской'],
        material: 'Нейлон и капрон — синтетические полиамидные волокна. Не поддаются биологическому разложению сотни лет.',
        reason: 'Утеряны рыбаками во время промысла. Брошенные сети продолжают «призрачный» лов: ловушки для морских млекопитающих, рыб и птиц. Гибель животных в таких сетях может продолжаться десятилетиями.',
        danger: 5,
        dangerLabel: 'Критическая'
    },
    3: {
        image: 'ex_boot.png',
        badge: '#3',
        title: 'Резиновая обувь',
        tags: ['Резина', 'Полиуретан', 'Берег'],
        material: 'Натуральная и синтетическая резина, вспененный полиуретан. Разлагается 50–80 лет.',
        reason: 'Оставлена на берегу во время купания или смыта приливом с берега рыбацких посёлков. В процессе распада выделяет токсичные соединения, которые накапливаются в почве и воде.',
        danger: 2,
        dangerLabel: 'Умеренная'
    },
    4: {
        image: 'ex_probe.png',
        badge: '#4',
        title: 'Метеорологический зонд',
        tags: ['Пластик', 'Латекс', 'Техника'],
        material: 'Пластиковый корпус, латексная оболочка, электронные микросхемы с припоем, батарейки. До 500 лет разложения.',
        reason: 'Запускается в атмосферу для климатических исследований. После сбора данных зонд падает и нередко попадает в море. Содержит токсичные металлы (свинец, кадмий) в микросхемах.',
        danger: 3,
        dangerLabel: 'Средняя'
    },
    5: {
        image: 'ex_buoy.png',
        badge: '#5',
        title: 'Пенопластовый буй',
        tags: ['EPS', 'Пенопласт', 'Рыболовство'],
        material: 'Вспененный полистирол (EPS) — лёгкий пористый пластик. Разлагается 500+ лет, при этом распадается на микрогранулы.',
        reason: 'Использовался рыбаками для разметки снастей. При механическом воздействии (волн, льда) распадается на тысячи микрогранул полистирола, которые морские организмы принимают за пищу.',
        danger: 4,
        dangerLabel: 'Высокая'
    },
    6: {
        image: 'ex_canister.png',
        badge: '#6',
        title: 'Канистра горючего',
        tags: ['HDPE', 'Нефтепродукты', 'Токсик'],
        material: 'Полиэтилен высокой плотности (HDPE) с остатками бензина или дизельного топлива.',
        reason: 'По всей видимости, оставлена рыбаками или туристами и смыта в море в ходе прилива. Остатки нефтепродуктов загрязняют воду плёнкой, лишающей кислорода водную поверхность и губящей морских птиц.',
        danger: 5,
        dangerLabel: 'Критическая'
    }
};

let currentExhibitId = null;

function openExhibitModal(id) {
    currentExhibitId = id;
    const data = EXHIBITS[id];
    if (!data) return;

    // Hero image
    const hero = document.getElementById('exhibitModalHero');
    hero.style.backgroundImage = `url('${data.image}')`;

    // Badge
    document.getElementById('exhibitModalBadge').textContent = data.badge;

    // Title
    document.getElementById('exhibitModalTitle').textContent = data.title;

    // Tags
    const tagsEl = document.getElementById('exhibitModalTags');
    tagsEl.innerHTML = data.tags.map(t => `<span class="exhibit-tag">${t}</span>`).join('');

    // Material
    document.getElementById('exhibitModalMaterial').textContent = data.material;

    // Reason
    document.getElementById('exhibitModalReason').textContent = data.reason;

    // Danger bar
    const bar = document.getElementById('exhibitDangerBar');
    bar.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const dot = document.createElement('div');
        dot.className = 'danger-dot' + (i <= data.danger ? ' filled' : '');
        bar.appendChild(dot);
    }
    const label = document.createElement('span');
    label.className = 'exhibit-danger-label';
    label.textContent = data.dangerLabel;
    bar.appendChild(label);

    // Nav buttons
    document.getElementById('exhibitPrev').disabled = id <= 1;
    document.getElementById('exhibitNext').disabled = id >= Object.keys(EXHIBITS).length;

    // Open
    const overlay = document.getElementById('exhibitOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeExhibitModal(event) {
    if (event && event.target !== document.getElementById('exhibitOverlay')) return;
    document.getElementById('exhibitOverlay').classList.remove('active');
    document.body.style.overflow = '';
    currentExhibitId = null;
}

function navigateExhibit(dir) {
    if (!currentExhibitId) return;
    const next = currentExhibitId + dir;
    if (EXHIBITS[next]) openExhibitModal(next);
}

// Keyboard navigation for exhibit modal
document.addEventListener('keydown', e => {
    const overlay = document.getElementById('exhibitOverlay');
    if (!overlay || !overlay.classList.contains('active')) return;
    if (e.key === 'Escape') { closeExhibitModal(); }
    if (e.key === 'ArrowLeft') navigateExhibit(-1);
    if (e.key === 'ArrowRight') navigateExhibit(1);
});

// Keyboard activation for exhibit cards (accessibility)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.exhibit-card[tabindex]').forEach(card => {
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
        });
    });
});
