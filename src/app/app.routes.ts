import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { RecipeSenseiPrivacyPageComponent } from './pages/recipesensei-privacy-page/recipesensei-privacy-page.component';
import { RecipeSenseiSupportPageComponent } from './pages/recipesensei-support-page/recipesensei-support-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'recipesensei/support', component: RecipeSenseiSupportPageComponent },
  { path: 'recipesensei/privacy', component: RecipeSenseiPrivacyPageComponent },
];
