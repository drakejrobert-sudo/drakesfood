import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  ViewChild,
  inject,
} from '@angular/core';

type GameStatus = 'ready' | 'playing' | 'gameOver';
type FallingItemKind = 'good' | 'rotten';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  kind: FallingItemKind;
  food: string;
  caught: boolean;
}

interface GameSnapshot {
  status: GameStatus;
  score: number;
  lives: number;
  remainingTime: number;
  message: string;
}

const ROUND_SECONDS = 60;
const STARTING_LIVES = 3;
const GOOD_FOOD_POINTS = 10;
const ITEM_SPAWN_INTERVAL_MS = 760;
const PAN_WIDTH = 112;
const PAN_HEIGHT = 28;
const PAN_Y_OFFSET = 54;
const GOOD_FOODS = ['pizza', 'taco', 'burger', 'strawberry', 'egg'];
const ROTTEN_FOODS = ['moldy', 'burnt'];

@Component({
  selector: 'app-game-page',
  standalone: true,
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.css'],
})
export class GamePageComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true })
  private readonly gameCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  protected snapshot: GameSnapshot = {
    status: 'ready',
    score: 0,
    lives: STARTING_LIVES,
    remainingTime: ROUND_SECONDS,
    message: 'Catch the good stuff. Dodge the rotten stuff.',
  };

  private animationFrameId = 0;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private gameStartedAt = 0;
  private itemSequence = 0;
  private items: FallingItem[] = [];
  private lastFrameAt = 0;
  private lastHudUpdateAt = 0;
  private lastSpawnAt = 0;
  private panX = 0;
  private readonly pressedKeys = new Set<string>();
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.gameCanvas?.nativeElement;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    this.canvas = canvas;
    this.context = context;
    this.resizeCanvas();
    this.resetRound();
    this.draw();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
      this.draw();
    });
    this.resizeObserver.observe(canvas);

    this.destroyRef.onDestroy(() => {
      this.stopLoop();
      this.resizeObserver?.disconnect();
    });
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeyDown(event: KeyboardEvent): void {
    if (this.isControlKey(event.key)) {
      event.preventDefault();
      this.pressedKeys.add(event.key.toLowerCase());
    }

    if ((event.key === 'Enter' || event.key === ' ') && !this.isInteractiveTarget(event.target)) {
      event.preventDefault();
      this.startRound();
    }
  }

  @HostListener('window:keyup', ['$event'])
  protected handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key.toLowerCase());
  }

  protected startRound(): void {
    if (this.snapshot.status === 'playing') {
      return;
    }

    this.resetRound();
    this.snapshot = {
      status: 'playing',
      score: 0,
      lives: STARTING_LIVES,
      remainingTime: ROUND_SECONDS,
      message: 'Kitchen rush is on.',
    };
    this.changeDetectorRef.markForCheck();

    this.ngZone.runOutsideAngular(() => {
      this.lastFrameAt = performance.now();
      this.gameStartedAt = this.lastFrameAt;
      this.lastHudUpdateAt = this.lastFrameAt;
      this.lastSpawnAt = this.lastFrameAt - ITEM_SPAWN_INTERVAL_MS;
      this.animationFrameId = requestAnimationFrame(this.tick);
    });
  }

  protected handlePointerMove(event: PointerEvent): void {
    if (!this.canvas || this.snapshot.status !== 'playing') {
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    this.panX = this.clamp(x, PAN_WIDTH / 2, bounds.width - PAN_WIDTH / 2);
  }

  private readonly tick = (now: number): void => {
    const elapsed = Math.min((now - this.lastFrameAt) / 1000, 0.04);
    this.lastFrameAt = now;

    this.update(elapsed, now);
    this.draw();

    if (this.snapshot.status === 'playing') {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  private update(elapsedSeconds: number, now: number): void {
    const canvas = this.canvas;

    if (!canvas || this.snapshot.status !== 'playing') {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const moveDirection =
      Number(this.pressedKeys.has('arrowright') || this.pressedKeys.has('d')) -
      Number(this.pressedKeys.has('arrowleft') || this.pressedKeys.has('a'));
    this.panX = this.clamp(this.panX + moveDirection * 420 * elapsedSeconds, PAN_WIDTH / 2, bounds.width - PAN_WIDTH / 2);

    if (now - this.lastSpawnAt >= ITEM_SPAWN_INTERVAL_MS) {
      this.spawnItem(bounds.width);
      this.lastSpawnAt = now;
    }

    const panTop = bounds.height - PAN_Y_OFFSET - PAN_HEIGHT / 2;
    const panLeft = this.panX - PAN_WIDTH / 2;
    const panRight = this.panX + PAN_WIDTH / 2;

    for (const item of this.items) {
      item.y += item.speed * elapsedSeconds;

      const itemBottom = item.y + item.size / 2;
      const itemLeft = item.x - item.size / 2;
      const itemRight = item.x + item.size / 2;
      const overlapsPan =
        itemBottom >= panTop &&
        item.y <= panTop + PAN_HEIGHT &&
        itemRight >= panLeft &&
        itemLeft <= panRight;

      if (overlapsPan && !item.caught) {
        item.caught = true;

        if (item.kind === 'good') {
          this.snapshot.score += GOOD_FOOD_POINTS;
          this.snapshot.message = `${this.capitalize(item.food)} saved.`;
        } else {
          this.snapshot.lives -= 1;
          this.snapshot.message = 'Rotten bite. One pan life gone.';
        }
      }
    }

    this.items = this.items.filter((item) => !item.caught && item.y - item.size / 2 <= bounds.height + 24);

    const remainingTime = Math.max(0, ROUND_SECONDS - Math.floor((now - this.gameStartedAt) / 1000));

    if (remainingTime !== this.snapshot.remainingTime || now - this.lastHudUpdateAt > 250) {
      this.snapshot.remainingTime = remainingTime;
      this.lastHudUpdateAt = now;
      this.ngZone.run(() => this.changeDetectorRef.markForCheck());
    }

    if (this.snapshot.lives <= 0) {
      this.endRound('The pan tapped out. Give it one more run?');
      return;
    }

    if (remainingTime <= 0) {
      this.endRound(`Time. Final score: ${this.snapshot.score}.`);
    }
  }

  private endRound(message: string): void {
    this.snapshot = {
      ...this.snapshot,
      status: 'gameOver',
      remainingTime: Math.max(0, this.snapshot.remainingTime),
      message,
    };
    this.stopLoop();
    this.ngZone.run(() => this.changeDetectorRef.markForCheck());
  }

  private resetRound(): void {
    const width = this.canvas?.getBoundingClientRect().width ?? 720;

    this.items = [];
    this.itemSequence = 0;
    this.panX = width / 2;
    this.pressedKeys.clear();
  }

  private spawnItem(width: number): void {
    const isRotten = Math.random() < 0.22;
    const foods = isRotten ? ROTTEN_FOODS : GOOD_FOODS;
    const size = isRotten ? 32 : 34 + Math.random() * 8;

    this.items.push({
      id: this.itemSequence,
      x: 32 + Math.random() * Math.max(width - 64, 1),
      y: -size,
      size,
      speed: 132 + Math.random() * 88 + Math.min(this.snapshot.score * 0.8, 90),
      kind: isRotten ? 'rotten' : 'good',
      food: foods[this.itemSequence % foods.length],
      caught: false,
    });
    this.itemSequence += 1;
  }

  private resizeCanvas(): void {
    const canvas = this.canvas;

    if (!canvas) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.max(Math.floor(bounds.width * pixelRatio), 1);
    canvas.height = Math.max(Math.floor(bounds.height * pixelRatio), 1);
    this.context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.panX = this.clamp(this.panX || bounds.width / 2, PAN_WIDTH / 2, bounds.width - PAN_WIDTH / 2);
  }

  private draw(): void {
    const canvas = this.canvas;
    const context = this.context;

    if (!canvas || !context) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    context.clearRect(0, 0, bounds.width, bounds.height);
    this.drawKitchen(context, bounds.width, bounds.height);

    for (const item of this.items) {
      this.drawFood(context, item);
    }

    this.drawPan(context, this.panX, bounds.height - PAN_Y_OFFSET);

    if (this.snapshot.status !== 'playing') {
      this.drawIdleSparkle(context, bounds.width, bounds.height);
    }
  }

  private drawKitchen(context: CanvasRenderingContext2D, width: number, height: number): void {
    const tileSize = 24;

    context.fillStyle = '#fffaf5';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#f1dfd0';

    for (let y = 0; y < height; y += tileSize) {
      for (let x = (y / tileSize) % 2 === 0 ? 0 : tileSize / 2; x < width; x += tileSize) {
        context.fillRect(x, y, tileSize / 2, tileSize / 2);
      }
    }

    context.fillStyle = 'rgba(109, 74, 163, 0.1)';
    context.fillRect(0, height - 84, width, 84);
    context.fillStyle = 'rgba(140, 90, 64, 0.14)';
    context.fillRect(0, height - 78, width, 8);
  }

  private drawPan(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.save();
    context.translate(Math.round(x), Math.round(y));
    context.fillStyle = '#302520';
    context.fillRect(-PAN_WIDTH / 2, -PAN_HEIGHT / 2, PAN_WIDTH, PAN_HEIGHT);
    context.fillStyle = '#4a3930';
    context.fillRect(-PAN_WIDTH / 2 + 8, -PAN_HEIGHT / 2 + 5, PAN_WIDTH - 16, PAN_HEIGHT - 10);
    context.fillStyle = '#8c5a40';
    context.fillRect(PAN_WIDTH / 2 - 2, -6, 58, 12);
    context.fillStyle = '#f7efe7';
    context.fillRect(-24, -5, 48, 10);
    context.restore();
  }

  private drawFood(context: CanvasRenderingContext2D, item: FallingItem): void {
    context.save();
    context.translate(Math.round(item.x), Math.round(item.y));

    if (item.food === 'pizza') {
      context.fillStyle = '#c36b2f';
      this.pixelTriangle(context, item.size);
      context.fillStyle = '#f6d86b';
      context.fillRect(-item.size / 2 + 8, -item.size / 2 + 8, item.size - 18, 7);
      context.fillRect(-item.size / 2 + 10, -item.size / 2 + 15, item.size - 24, 7);
      context.fillStyle = '#b83e35';
      context.fillRect(-10, -7, 6, 6);
      context.fillRect(2, -1, 6, 6);
      context.fillRect(-14, 7, 5, 5);
    } else if (item.food === 'taco') {
      context.fillStyle = '#f0b95f';
      context.fillRect(-item.size / 2, -2, item.size, item.size / 2);
      context.fillStyle = '#3f7d3c';
      context.fillRect(-item.size / 3, -10, item.size / 1.5, 10);
      context.fillStyle = '#7d4c35';
      context.fillRect(-10, -4, 20, 7);
    } else if (item.food === 'burger') {
      context.fillStyle = '#d9984d';
      context.fillRect(-item.size / 2, -12, item.size, 10);
      context.fillStyle = '#7d4c35';
      context.fillRect(-item.size / 2, -1, item.size, 8);
      context.fillStyle = '#3f7d3c';
      context.fillRect(-item.size / 2, 8, item.size, 5);
      context.fillStyle = '#e1b85a';
      context.fillRect(-item.size / 2, 14, item.size, 8);
    } else if (item.food === 'strawberry') {
      context.fillStyle = '#c83f46';
      context.fillRect(-12, -10, 24, 24);
      context.fillStyle = '#3f7d3c';
      context.fillRect(-6, -16, 12, 8);
      context.fillStyle = '#fff3a3';
      context.fillRect(-5, -1, 3, 3);
      context.fillRect(5, 7, 3, 3);
    } else if (item.food === 'egg') {
      context.fillStyle = '#fff8df';
      context.fillRect(-15, -12, 30, 24);
      context.fillStyle = '#efb246';
      context.fillRect(-6, -5, 12, 12);
    } else {
      this.drawRottenFood(context, item);
    }

    context.restore();
  }

  private drawIdleSparkle(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.fillStyle = 'rgba(61, 37, 111, 0.18)';
    context.fillRect(width * 0.2, height * 0.2, 8, 8);
    context.fillRect(width * 0.74, height * 0.34, 10, 10);
    context.fillRect(width * 0.38, height * 0.56, 6, 6);
  }

  private drawRottenFood(context: CanvasRenderingContext2D, item: FallingItem): void {
    if (item.food === 'burnt') {
      context.fillStyle = '#201815';
      context.fillRect(-15, -12, 28, 24);
      context.fillRect(-10, -18, 18, 8);
      context.fillRect(-19, -4, 8, 14);
      context.fillStyle = '#5a3224';
      context.fillRect(-9, -8, 17, 7);
      context.fillRect(-1, 4, 13, 6);
      context.fillStyle = '#f08b3e';
      context.fillRect(-13, -13, 5, 5);
      context.fillRect(8, -2, 4, 4);
      context.fillStyle = '#16100e';
      context.fillRect(-4, -18, 5, 36);
      return;
    }

    context.fillStyle = '#556533';
    context.fillRect(-14, -14, 24, 10);
    context.fillRect(-18, -6, 34, 18);
    context.fillRect(-10, 10, 20, 8);
    context.fillStyle = '#9fb554';
    context.fillRect(-8, -10, 9, 7);
    context.fillRect(5, 1, 8, 8);
    context.fillRect(-15, 5, 6, 6);
    context.fillStyle = '#2f3b22';
    context.fillRect(-4, -1, 5, 5);
    context.fillRect(8, -8, 5, 5);
    context.fillRect(-12, 12, 4, 4);
    context.fillStyle = 'rgba(85, 101, 51, 0.45)';
    context.fillRect(-24, -24, 5, 5);
    context.fillRect(18, -19, 4, 4);
    context.fillRect(22, 6, 5, 5);
  }

  private pixelTriangle(context: CanvasRenderingContext2D, size: number): void {
    context.beginPath();
    context.moveTo(-size / 2, -size / 2);
    context.lineTo(size / 2, -size / 4);
    context.lineTo(-size / 3, size / 2);
    context.closePath();
    context.fill();
  }

  private stopLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private isControlKey(key: string): boolean {
    return ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(key);
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest(
        'a, button, input, select, textarea, summary, [contenteditable="true"], [role="button"], [role="link"], [role="menuitem"], [role="tab"]',
      ),
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private capitalize(value: string): string {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }
}
