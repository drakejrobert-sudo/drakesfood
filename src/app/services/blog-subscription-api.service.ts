import { inject, Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';

export interface BlogSubscriptionPayload {
  email: string;
  website: string;
}

interface BlogSubscriptionApiResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class BlogSubscriptionApiService {
  private readonly appConfig = inject(AppConfigService);

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.appConfig.getBlogSubscriptionsApiBaseUrl());
  }

  async subscribe(payload: BlogSubscriptionPayload): Promise<string> {
    const apiBaseUrl = await this.appConfig.getBlogSubscriptionsApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('Blog subscription API is not configured.');
    }

    let response: Response;

    try {
      response = await fetch(`${apiBaseUrl}/blog-subscriptions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Blog subscriptions are temporarily unavailable. Please try again later.');
    }

    const body = await this.parseResponse(response);

    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Blog subscriptions are temporarily unavailable. Please try again later.');
    }

    return body.message;
  }

  private async parseResponse(response: Response): Promise<BlogSubscriptionApiResponse> {
    try {
      const body = (await response.json()) as Partial<BlogSubscriptionApiResponse>;

      return {
        success: body.success === true,
        message: typeof body.message === 'string' ? body.message : '',
      };
    } catch {
      return {
        success: false,
        message: 'Blog subscriptions are temporarily unavailable. Please try again later.',
      };
    }
  }
}
