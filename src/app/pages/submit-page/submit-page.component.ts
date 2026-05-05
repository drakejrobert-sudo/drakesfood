import { Component } from '@angular/core';
import { RecipeSubmissionComponent } from '../../components/recipe-submission/recipe-submission.component';

@Component({
  selector: 'app-submit-page',
  standalone: true,
  imports: [RecipeSubmissionComponent],
  templateUrl: './submit-page.component.html',
})
export class SubmitPageComponent {}
