import { Component, ElementRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { AppConfigService } from '../../services/app-config.service';

interface Entry {
  alias: string;
  score: number;
}

interface BoardResponse {
  entries: Entry[];
  outcome?: 'placed' | 'kept' | 'missed';
}

const PLAYER_KEY = 'drakesfood.tiny-kitchen-rush.player';
const ALIAS_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,15}$/;

@Component({
  selector: 'app-kitchen-leaderboard',
  standalone: true,
  templateUrl: './kitchen-leaderboard.component.html',
  styleUrl: './kitchen-leaderboard.component.css',
})
export class KitchenLeaderboardComponent implements OnInit {
  readonly result = input<{ score: number } | null>(null);
  private readonly config = inject(AppConfigService);
  protected readonly endpoint = signal('');
  protected readonly entries = signal<Entry[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly posting = signal(false);
  protected readonly canPost = signal(false);
  protected readonly notice = signal<{
    result: { score: number };
    message: string;
    done: boolean;
  } | null>(null);
  private readonly submissionStatus =
    viewChild<ElementRef<HTMLParagraphElement>>('submissionStatus');
  private token = '';

  async ngOnInit(): Promise<void> {
    const url = await this.config.getKitchenLeaderboardApiBaseUrl();
    if (!url) return;

    try {
      this.token = localStorage.getItem(PLAYER_KEY) || crypto.randomUUID();
      localStorage.setItem(PLAYER_KEY, this.token);
      this.canPost.set(true);
    } catch {
      // A persistent profile is required for posting. The board can still be read.
    }

    this.loading.set(true);
    this.endpoint.set(url + '/kitchen-leaderboard');
    try {
      this.entries.set((await this.request()).entries);
    } catch {
      // The board can recover with a later submission.
    } finally {
      this.loading.set(false);
    }
  }

  protected async post(event: Event, alias: string): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const result = this.result();
    if (!result || !this.canPost() || this.posting() || this.loading()) return;

    alias = alias.trim();
    if (!ALIAS_PATTERN.test(alias)) {
      this.notice.set({
        result,
        message:
          'Use 1–16 letters, numbers, spaces, underscores, or hyphens. Start with a letter or number.',
        done: false,
      });
      return;
    }

    this.posting.set(true);
    this.notice.set(null);
    try {
      const response = await this.request({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, score: result.score, token: this.token }),
      });
      this.entries.set(response.entries);
      const messages = {
        placed: 'You made the Top 3!',
        kept: 'Your higher or earlier score is already on the board.',
        missed: 'This score fell short of the Top 3.',
      };
      if (!response.outcome) throw new Error('Missing submission outcome');
      if (this.result() === result && form.contains(document.activeElement)) {
        this.submissionStatus()?.nativeElement.focus({ preventScroll: true });
      }
      this.notice.set({ result, message: messages[response.outcome], done: true });
    } catch {
      this.notice.set({ result, message: 'Couldn’t post your score. Try again.', done: false });
    } finally {
      this.posting.set(false);
    }
  }

  private async request(init?: RequestInit): Promise<BoardResponse> {
    const response = await fetch(this.endpoint(), {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Leaderboard request failed');
    return response.json();
  }
}
