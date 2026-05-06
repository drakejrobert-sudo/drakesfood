import { Routes } from '@angular/router';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { RecipeSenseiPageComponent } from './pages/recipesensei-page/recipesensei-page.component';
import { RecipeSenseiPrivacyPageComponent } from './pages/recipesensei-privacy-page/recipesensei-privacy-page.component';
import { RecipeSenseiSupportPageComponent } from './pages/recipesensei-support-page/recipesensei-support-page.component';
import { RecipesPageComponent } from './pages/recipes-page/recipes-page.component';
import { SubmitPageComponent } from './pages/submit-page/submit-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'gallery', component: GalleryPageComponent },
  { path: 'recipes', component: RecipesPageComponent },
  { path: 'submit', component: SubmitPageComponent },
  { path: 'submit-idea', redirectTo: 'submit', pathMatch: 'full' },
  { path: 'recipesensei', component: RecipeSenseiPageComponent },
  { path: 'recipesensei/support', component: RecipeSenseiSupportPageComponent },
  { path: 'recipesensei/privacy', component: RecipeSenseiPrivacyPageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: '**', redirectTo: '' },
];
