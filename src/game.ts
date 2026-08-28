import type { ActionId } from './engine';

interface Gate { x: number; y: number; label: string; }

export class FerryGame {
  private context: CanvasRenderingContext2D;
  private x = 55;
  private y = 180;
  private gateIndex = 0;
  private attempts = 0;
  private running = false;
  private complete = false;
  private actions = new Set<ActionId>();
  private keys = new Set<string>();
  private lastTime = 0;
  private animationFrame = 0;
  private readonly gates: Gate[] = [
    { x: 205, y: 272, label: 'LOW' },
    { x: 385, y: 92, label: 'HIGH' },
    { x: 565, y: 182, label: 'HOLD' },
  ];

  constructor(
    private canvas: HTMLCanvasElement,
    private status: HTMLElement,
    private progress: HTMLElement,
    private live: HTMLElement,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available.');
    this.context = context;
    this.resize();
    this.draw();
  }

  start(): void {
    if (this.complete) this.reset();
    this.running = true;
    this.lastTime = performance.now();
    this.status.textContent = 'Ferry moving. Sing or use ↑, ↓, and Space.';
    this.live.textContent = 'Game running';
    this.loop(this.lastTime);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.status.textContent = 'Game paused. Your place is saved.';
    this.live.textContent = 'Game paused';
    this.draw();
  }

  reset(): void {
    this.pause();
    this.x = 55;
    this.y = 180;
    this.gateIndex = 0;
    this.attempts = 0;
    this.complete = false;
    this.progress.textContent = '0 of 3 gates';
    this.status.textContent = 'Ready at the first gate.';
    this.draw();
  }

  setActions(actions: ActionId[]): void {
    this.actions = new Set(actions);
  }

  keyDown(code: string): void { this.keys.add(code); }
  keyUp(code: string): void { this.keys.delete(code); }
  get isRunning(): boolean { return this.running; }

  private loop = (time: number): void => {
    if (!this.running) return;
    const delta = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    const up = this.actions.has('MOVE_UP') || this.keys.has('ArrowUp');
    const down = this.actions.has('MOVE_DOWN') || this.keys.has('ArrowDown');
    const boost = this.actions.has('BOOST') || this.keys.has('Space');
    if (up) this.y -= 88 * delta;
    if (down) this.y += 88 * delta;
    this.y = Math.max(32, Math.min(328, this.y));
    this.x += (boost ? 82 : 24) * delta;
    this.checkGate();
    this.draw();
    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private checkGate(): void {
    const gate = this.gates[this.gateIndex];
    if (!gate || this.x < gate.x) return;
    this.attempts += 1;
    if (Math.abs(this.y - gate.y) <= 55) {
      this.gateIndex += 1;
      this.progress.textContent = `${this.gateIndex} of 3 gates`;
      if (this.gateIndex === this.gates.length) {
        this.complete = true;
        this.running = false;
        this.status.textContent = `Route complete in ${this.attempts} gate attempts. Your controls are ready to export.`;
        this.live.textContent = 'Route complete';
        this.canvas.dispatchEvent(new CustomEvent('gamecomplete'));
      } else {
        this.status.textContent = `Gate ${this.gateIndex} cleared. Aim for ${this.gates[this.gateIndex].label.toLowerCase()}.`;
      }
    } else {
      const previousX = this.gateIndex === 0 ? 55 : this.gates[this.gateIndex - 1].x + 20;
      this.x = previousX;
      this.status.textContent = `Missed the ${gate.label.toLowerCase()} gate. Adjust your height and try again.`;
    }
  }

  private resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = 640 * ratio;
    this.canvas.height = 360 * ratio;
    this.context.scale(ratio, ratio);
  }

  private draw(): void {
    const ctx = this.context;
    ctx.clearRect(0, 0, 640, 360);
    const background = ctx.createLinearGradient(0, 0, 640, 360);
    background.addColorStop(0, '#0b1b18');
    background.addColorStop(1, '#101229');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 640, 360);

    ctx.strokeStyle = 'rgba(127, 255, 196, .12)';
    ctx.lineWidth = 1;
    for (let y = 36; y < 360; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
    }

    this.gates.forEach((gate, index) => {
      const cleared = index < this.gateIndex;
      ctx.strokeStyle = cleared ? '#7fffc4' : index === this.gateIndex ? '#c7a8ff' : '#54746c';
      ctx.lineWidth = index === this.gateIndex ? 6 : 3;
      ctx.beginPath();
      ctx.arc(gate.x, gate.y, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = cleared ? '#7fffc4' : '#b8cdc5';
      ctx.font = '600 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(cleared ? 'CLEARED' : gate.label, gate.x, gate.y + 4);
    });

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 22;
    ctx.shadowColor = '#7fffc4';
    ctx.fillStyle = '#7fffc4';
    ctx.beginPath();
    ctx.moveTo(16, 0); ctx.lineTo(-10, -10); ctx.lineTo(-5, 0); ctx.lineTo(-10, 10); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
