import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BlogSubscriptionApiService,
  type BlogSubscriptionPayload,
} from '../../services/blog-subscription-api.service';

type SubscriptionStatus = 'idle' | 'submitting' | 'success' | 'error';

const SIGNUP_SUCCESS_MESSAGE =
  'If that email can be subscribed, a confirmation link is on the way. Check your junk or spam folder if you do not see it soon.';

@Component({
  selector: 'app-blog-subscription',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './blog-subscription.component.html',
  styleUrls: ['./blog-subscription.component.css'],
})
export class BlogSubscriptionComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly blogSubscriptionApi = inject(BlogSubscriptionApiService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly status = signal<SubscriptionStatus>('idle');
  readonly statusMessage = signal('');
  readonly isSubmitting = computed(() => this.status() === 'submitting');

  readonly subscriptionForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    website: [''],
  });

  async onSubmit(): Promise<void> {
    const payload = this.buildPayload();

    if (payload.website) {
      this.status.set('success');
      this.statusMessage.set(SIGNUP_SUCCESS_MESSAGE);
      return;
    }

    if (this.subscriptionForm.invalid) {
      this.subscriptionForm.markAllAsTouched();
      this.status.set('error');
      this.statusMessage.set('Please enter a valid email address.');
      this.focusFirstInvalidControl();
      return;
    }

    this.status.set('submitting');
    this.statusMessage.set('Sending a confirmation link...');

    if (!(await this.blogSubscriptionApi.isConfigured())) {
      this.status.set('error');
      this.statusMessage.set(
        'Email updates are ready on the site, but the subscription API is not connected yet.',
      );
      return;
    }

    try {
      const message = await this.blogSubscriptionApi.subscribe(payload);
      this.subscriptionForm.reset({
        email: '',
        website: '',
      });
      this.status.set('success');
      this.statusMessage.set(message);
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(
        error instanceof Error
          ? error.message
          : 'Blog subscriptions are temporarily unavailable. Please try again later.',
      );
    }
  }

  hasFieldError(fieldName: keyof BlogSubscriptionPayload, errorName: string): boolean {
    const field = this.subscriptionForm.controls[fieldName];

    return field.hasError(errorName) && (field.dirty || field.touched);
  }

  protected emailHasVisibleError(): boolean {
    return ['required', 'email', 'maxlength'].some((errorName) =>
      this.hasFieldError('email', errorName),
    );
  }

  protected emailDescribedBy(): string {
    return this.emailHasVisibleError()
      ? 'blog-subscription-help blog-subscription-error'
      : 'blog-subscription-help';
  }

  private buildPayload(): BlogSubscriptionPayload {
    const rawValue = this.subscriptionForm.getRawValue();

    return {
      email: rawValue.email.trim(),
      website: rawValue.website.trim(),
    };
  }

  private focusFirstInvalidControl(): void {
    const window = this.host.nativeElement.ownerDocument.defaultView;

    window?.requestAnimationFrame(() => {
      const firstInvalidControl = this.host.nativeElement.querySelector('[aria-invalid="true"]');

      if (firstInvalidControl instanceof HTMLElement) {
        firstInvalidControl.focus();
      }
    });
  }
}
