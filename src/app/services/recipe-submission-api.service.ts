import { inject, Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';

export interface RecipeSubmissionPayload {
  title: string;
  description: string;
  name: string;
  email: string;
  recipeUrl: string;
  socialUrl: string;
  permissionToCredit: boolean;
  website: string;
}

interface RecipeSubmissionApiResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class RecipeSubmissionApiService {
  private readonly appConfig = inject(AppConfigService);

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.appConfig.getRecipeSubmissionsApiBaseUrl());
  }

  async submitRecipeIdea(payload: RecipeSubmissionPayload): Promise<string> {
    const apiBaseUrl = await this.appConfig.getRecipeSubmissionsApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('Recipe submission API is not configured.');
    }

    let response: Response;

    try {
      response = await fetch(`${apiBaseUrl}/recipe-submissions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Recipe submissions are temporarily unavailable. Please try again later.');
    }

    const body = await this.parseResponse(response);

    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Recipe submissions are temporarily unavailable. Please try again later.');
    }

    return body.message;
  }

  private async parseResponse(response: Response): Promise<RecipeSubmissionApiResponse> {
    try {
      const body = (await response.json()) as Partial<RecipeSubmissionApiResponse>;

      return {
        success: body.success === true,
        message: typeof body.message === 'string' ? body.message : '',
      };
    } catch {
      return {
        success: false,
        message: 'Recipe submissions are temporarily unavailable. Please try again later.',
      };
    }
  }
}
