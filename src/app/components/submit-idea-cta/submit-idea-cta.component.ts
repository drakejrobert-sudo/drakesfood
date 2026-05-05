import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-submit-idea-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './submit-idea-cta.component.html',
  styleUrls: ['./submit-idea-cta.component.css'],
})
export class SubmitIdeaCtaComponent {}
