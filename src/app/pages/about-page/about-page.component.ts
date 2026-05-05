import { Component } from '@angular/core';
import { AboutComponent } from '../../components/about/about.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [AboutComponent],
  templateUrl: './about-page.component.html',
})
export class AboutPageComponent {}
