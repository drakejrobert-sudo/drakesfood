import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecipeSubmissionApiService, type RecipeSubmissionPayload } from '../../services/recipe-submission-api.service';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-recipe-submission',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './recipe-submission.component.html',
  styleUrls: ['./recipe-submission.component.css'],
})
export class RecipeSubmissionComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly recipeSubmissionApi = inject(RecipeSubmissionApiService);

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

  async onSubmit(): Promise<void> {
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
    this.statusMessage.set('Sending your recipe idea...');

    if (!(await this.recipeSubmissionApi.isConfigured())) {
      this.status.set('error');
      this.statusMessage.set(
        `This form is ready, but online recipe submissions are not connected yet. Your idea for "${payload.title}" has not been sent.`,
      );
      return;
    }

    try {
      const message = await this.recipeSubmissionApi.submitRecipeIdea(payload);
      this.submissionForm.reset({
        title: '',
        description: '',
        name: '',
        email: '',
        recipeUrl: '',
        socialUrl: '',
        permissionToCredit: false,
        website: '',
      });
      this.status.set('success');
      this.statusMessage.set(message);
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Recipe submissions are temporarily unavailable. Please try again later.');
    }
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
