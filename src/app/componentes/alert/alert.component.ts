import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AlertComponent implements OnInit {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' = 'success'; 

  isVisible: boolean = true;

  ngOnInit(): void {
    setTimeout(() => {
      this.isVisible = false;
    }, 3000);
  }
}

