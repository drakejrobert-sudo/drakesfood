import { Injectable } from '@angular/core';

interface AppConfig {
  recipeSubmissionsApiBaseUrl: string;
}

const defaultConfig: AppConfig = {
  recipeSubmissionsApiBaseUrl: '',
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private configPromise: Promise<AppConfig> | undefined;

  async getRecipeSubmissionsApiBaseUrl(): Promise<string> {
    const config = await this.loadConfig();

    return config.recipeSubmissionsApiBaseUrl;
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

      return {
        recipeSubmissionsApiBaseUrl,
      };
    } catch {
      return defaultConfig;
    }
  }
}
