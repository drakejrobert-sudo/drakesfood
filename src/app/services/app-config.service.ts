import { Injectable } from '@angular/core';

interface AppConfig {
  recipeSubmissionsApiBaseUrl: string;
  blogSubscriptionsApiBaseUrl: string;
}

const defaultConfig: AppConfig = {
  recipeSubmissionsApiBaseUrl: '',
  blogSubscriptionsApiBaseUrl: '',
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private configPromise: Promise<AppConfig> | undefined;

  async getRecipeSubmissionsApiBaseUrl(): Promise<string> {
    const config = await this.loadConfig();

    return config.recipeSubmissionsApiBaseUrl;
  }

  async getBlogSubscriptionsApiBaseUrl(): Promise<string> {
    const config = await this.loadConfig();

    return config.blogSubscriptionsApiBaseUrl;
  }

  private async loadConfig(): Promise<AppConfig> {
    this.configPromise ??= this.fetchConfig();

    return this.configPromise;
  }

  private async fetchConfig(): Promise<AppConfig> {
    try {
      const response = await fetch('/app-config.json', { cache: 'no-store' });

      if (!response.ok) {
        return defaultConfig;
      }

      const config = (await response.json()) as Partial<AppConfig>;
      const recipeSubmissionsApiBaseUrl =
        typeof config.recipeSubmissionsApiBaseUrl === 'string' ? config.recipeSubmissionsApiBaseUrl.trim().replace(/\/+$/, '') : '';
      const blogSubscriptionsApiBaseUrl =
        typeof config.blogSubscriptionsApiBaseUrl === 'string' ? config.blogSubscriptionsApiBaseUrl.trim().replace(/\/+$/, '') : '';

      return {
        recipeSubmissionsApiBaseUrl,
        blogSubscriptionsApiBaseUrl,
      };
    } catch {
      return defaultConfig;
    }
  }
}
