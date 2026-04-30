import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface RecipeSubmissionPayload {
  title: string;
  description: string;
  name: string;
  email: string;
  recipeUrl: string;
  socialUrl: string;
  permissionToCredit: boolean;
  website: string;
}

@Component({
  selector: 'app-recipe-submission',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './recipe-submission.component.html',
  styleUrls: ['./recipe-submission.component.css'],
})
export class RecipeSubmissionComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private simulatedRequest: ReturnType<typeof setTimeout> | undefined;

  readonly status = signal<SubmissionStatus>('idle');
  readonly statusMessage = signal('');
  readonly isSubmitting = computed(() => this.status() === 'submitting');

  readonly submissionForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(3000)]],
    name: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    recipeUrl: ['', [Validators.maxLength(500)]],
    socialUrl: ['', [Validators.maxLength(500)]],
    permissionToCredit: [false],
    website: [''],
  });

  onSubmit(): void {
    if (this.simulatedRequest) {
      clearTimeout(this.simulatedRequest);
    }

    const payload = this.buildPayload();

    // Keep honeypot handling generic so automated submissions do not get useful feedback.
    if (payload.website) {
      this.status.set('success');
      this.statusMessage.set('Thanks! Your idea was sent to Drake.');
      return;
    }

    if (this.submissionForm.invalid) {
      this.submissionForm.markAllAsTouched();
      this.status.set('error');
      this.statusMessage.set('Please include a recipe title and description.');
      return;
    }

    this.status.set('submitting');
    this.statusMessage.set('Checking the recipe idea...');

    this.simulatedRequest = setTimeout(() => {
      this.status.set('error');
      this.statusMessage.set(
        `This form is ready, but online recipe submissions are not connected yet. Your idea for "${payload.title}" has not been sent.`,
      );
      this.simulatedRequest = undefined;
    }, 400);
  }

  hasFieldError(fieldName: keyof RecipeSubmissionPayload, errorName: string): boolean {
    const field = this.submissionForm.controls[fieldName];

    return field.hasError(errorName) && (field.dirty || field.touched);
  }

  private buildPayload(): RecipeSubmissionPayload {
    const rawValue = this.submissionForm.getRawValue();

    return {
      title: rawValue.title.trim(),
      description: rawValue.description.trim(),
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      recipeUrl: rawValue.recipeUrl.trim(),
      socialUrl: rawValue.socialUrl.trim(),
      permissionToCredit: rawValue.permissionToCredit,
      website: rawValue.website.trim(),
    };
  }
}
