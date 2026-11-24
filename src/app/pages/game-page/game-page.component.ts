import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injectable,
  NgZone,
  ViewChild,
  inject,
} from '@angular/core';

import { KitchenLeaderboardComponent } from './kitchen-leaderboard.component';
import { Food, makeSprites, paintKitchen, paintPan } from './diner-art';

type GameStatus = 'ready' | 'playing' | 'gameOver';
type FallingItemKind = 'good' | 'rotten';

interface FallingItem {
  x: number;
  y: number;
  size: number;
  speed: number;
  kind: FallingItemKind;
  food: Food;
  caught: boolean;
}

interface GameSnapshot {
  status: GameStatus;
  score: number;
  lives: number;
  elapsedSeconds: number;
  endReason: string;
}

const DIFFICULTY_RAMP_SECONDS = 180;
const STARTING_LIVES = 3;
const GOOD_FOOD_POINTS = 10;
const ITEM_SPAWN_INTERVAL_MS = 760;
const PAN_WIDTH = 112;
const PAN_HEIGHT = 28;
const PAN_Y_OFFSET = 54;
const GOOD_FOODS: Food[] = ['pizza', 'taco', 'burger', 'strawberry', 'egg'];
const ROTTEN_FOODS: Food[] = ['moldy', 'burnt'];

const BEST_KEY = 'drakesfood.tiny-kitchen-rush.survival.best';

@Injectable({ providedIn: 'root' })
class KitchenBest {
  private visitBest: number | null = null;

  read(): number | null {
    try {
      const saved = localStorage.getItem(BEST_KEY);
      if (saved !== null && /^\d+$/.test(saved) && Number.isSafeInteger(Number(saved))) {
        this.visitBest = Math.max(this.visitBest ?? 0, Number(saved));
      }
    } catch {
      // Browsers with storage disabled can still keep a best for this visit.
    }
    return this.visitBest;
  }

  finish(score: number): void {
    this.visitBest = Math.max(this.read() ?? 0, score);
    try {
      localStorage.setItem(BEST_KEY, String(this.visitBest));
    } catch {
      // The visit best is already updated.
    }
  }
}

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [KitchenLeaderboardComponent],
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.css'],
})
export class GamePageComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true })
  private readonly gameCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('legendGood', { static: true }) private legendGood!: ElementRef<HTMLCanvasElement>;
  @ViewChild('legendBad', { static: true }) private legendBad!: ElementRef<HTMLCanvasElement>;
  @ViewChild('roundButton', { static: true }) private roundButton!: ElementRef<HTMLButtonElement>;

  private readonly records = inject(KitchenBest);
  protected best = this.records.read();
  protected newRecord = false;
  private sprites?: ReturnType<typeof makeSprites>;
  private backdrop?: HTMLCanvasElement;
  private feedback?: { x: number; at: number; good: boolean };
  private reducedMotion?: MediaQueryList;

  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  protected snapshot: GameSnapshot = {
    status: 'ready',
    score: 0,
    lives: STARTING_LIVES,
    elapsedSeconds: 0,
    endReason: '',
  };

  private animationFrameId = 0;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private activeMs = 0;
  private itemSequence = 0;
  private items: FallingItem[] = [];
  private lastFrameAt = 0;
  private nextSpawnAt = 0;
  private panX = 0;
  private readonly pressedKeys = new Set<string>();
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.gameCanvas?.nativeElement;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    this.sprites = makeSprites();
    this.legendGood.nativeElement.getContext('2d')?.drawImage(this.sprites.burger, 0, 0);
    this.legendBad.nativeElement.getContext('2d')?.drawImage(this.sprites.moldy, 0, 0);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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

  protected handleKeyDown(event: KeyboardEvent): void {
    if (this.snapshot.status === 'playing' && this.isControlKey(event.key)) {
      event.preventDefault();
      this.pressedKeys.add(event.key.toLowerCase());
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key.toLowerCase());
  }

  @HostListener('window:blur')
  protected clearKeys(): void {
    this.pressedKeys.clear();
  }

  @HostListener('document:visibilitychange')
  protected handleVisibilityChange(): void {
    this.clearKeys();
    this.lastFrameAt = performance.now();
  }

  protected handlePointerDown(event: PointerEvent): void {
    if (!this.canvas || this.snapshot.status !== 'playing') return;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus({ preventScroll: true });
    this.handlePointerMove(event);
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
      elapsedSeconds: 0,
      endReason: '',
    };
    this.changeDetectorRef.detectChanges();
    this.canvas?.focus({ preventScroll: true });
    this.canvas?.closest('.cabinet')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });

    this.ngZone.runOutsideAngular(() => {
      this.lastFrameAt = performance.now();
      this.activeMs = 0;
      this.nextSpawnAt = 0;
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
    const frameMs = Math.max(0, now - this.lastFrameAt);
    this.lastFrameAt = now;

    if (!document.hidden) {
      this.activeMs += frameMs;
      this.update(Math.min(frameMs / 1000, 0.04), now);
      this.draw();
    }

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
    this.panX = this.clamp(
      this.panX + moveDirection * 420 * elapsedSeconds,
      PAN_WIDTH / 2,
      bounds.width - PAN_WIDTH / 2,
    );

    const progress = Math.min(this.activeMs / (DIFFICULTY_RAMP_SECONDS * 1000), 1);
    if (this.activeMs >= this.nextSpawnAt) {
      this.spawnItem(bounds.width, progress);
      this.nextSpawnAt = this.activeMs + ITEM_SPAWN_INTERVAL_MS - 340 * progress;
    }

    const previousFeedback = this.feedback;
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
        this.feedback = { x: this.panX, at: now, good: item.kind === 'good' };

        if (item.kind === 'good') {
          this.snapshot.score += GOOD_FOOD_POINTS;
        } else {
          this.snapshot.lives -= 1;
          if (this.snapshot.lives === 0) break;
        }
      }
    }

    this.items = this.items.filter(
      (item) => !item.caught && item.y - item.size / 2 <= bounds.height + 24,
    );

    const elapsed = Math.floor(this.activeMs / 1000);
    const hudChanged =
      elapsed !== this.snapshot.elapsedSeconds || this.feedback !== previousFeedback;
    this.snapshot.elapsedSeconds = elapsed;

    if (this.snapshot.lives === 0) {
      this.endRound('Out of lives');
      return;
    }

    if (hudChanged) {
      this.ngZone.run(() => this.changeDetectorRef.markForCheck());
    }
  }

  private endRound(endReason: string): void {
    this.snapshot = {
      ...this.snapshot,
      status: 'gameOver',
      endReason,
    };
    this.stopLoop();
    const previous = this.records.read();
    this.newRecord = previous !== null && this.snapshot.score > previous;
    this.records.finish(this.snapshot.score);
    this.best = this.records.read();
    this.ngZone.run(() => {
      this.changeDetectorRef.detectChanges();
      if (document.activeElement === this.canvas) this.roundButton.nativeElement.focus();
    });
  }

  private resetRound(): void {
    const width = this.canvas?.getBoundingClientRect().width ?? 720;

    this.feedback = undefined;
    this.newRecord = false;
    this.items = [];
    this.itemSequence = 0;
    this.panX = width / 2;
    this.pressedKeys.clear();
  }

  private spawnItem(width: number, progress: number): void {
    const isRotten = Math.random() < 0.22 + 0.08 * progress;
    const foods = isRotten ? ROTTEN_FOODS : GOOD_FOODS;
    const size = isRotten ? 32 : 34 + Math.random() * 8;

    this.items.push({
      x: 32 + Math.random() * Math.max(width - 64, 1),
      y: -size,
      size,
      speed: 132 + Math.random() * 88 + 90 * progress,
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
    this.backdrop = document.createElement('canvas');
    this.backdrop.width = canvas.width;
    this.backdrop.height = canvas.height;
    const background = this.backdrop.getContext('2d')!;
    background.scale(pixelRatio, pixelRatio);
    paintKitchen(background, bounds.width, bounds.height);
    this.context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.panX = this.clamp(
      this.panX || bounds.width / 2,
      PAN_WIDTH / 2,
      bounds.width - PAN_WIDTH / 2,
    );
  }

  private draw(): void {
    const canvas = this.canvas;
    const context = this.context;

    if (!canvas || !context) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    if (this.backdrop) context.drawImage(this.backdrop, 0, 0, bounds.width, bounds.height);
    context.imageSmoothingEnabled = false;
    for (const item of this.items) {
      const sprite = this.sprites?.[item.food];
      if (sprite)
        context.drawImage(
          sprite,
          Math.round(item.x - item.size / 2),
          Math.round(item.y - item.size / 2),
          item.size,
          item.size,
        );
    }

    paintPan(context, this.panX, bounds.height - PAN_Y_OFFSET, PAN_WIDTH);
    const hit = this.feedback;
    if (hit && this.snapshot.status === 'playing') {
      const age = performance.now() - hit.at;
      if (age < 550) {
        const rise = this.reducedMotion?.matches ? 0 : Math.round(age / 42);
        const x = this.clamp(hit.x, 39, bounds.width - 39);
        const y = bounds.height - PAN_Y_OFFSET - 27 - rise;
        context.fillStyle = hit.good ? '#285847' : '#872e35';
        context.fillRect(x - 35, y - 14, 70, 19);
        context.font = 'bold 14px monospace';
        context.textAlign = 'center';
        context.fillStyle = '#fff5da';
        context.fillText(hit.good ? '+10' : '−1 life', x, y);
      }
    }
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

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
