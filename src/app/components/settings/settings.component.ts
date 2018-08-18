import { Component, OnInit, OnDestroy } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { GraphService } from '../../graph.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  hmForm: FormGroup;
  generalForm: FormGroup;

  submitHMForm(): void {
    // tslint:disable-next-line:forin
    for (const i in this.hmForm.controls) {
      this.hmForm.controls[i].markAsDirty();
      this.hmForm.controls[i].updateValueAndValidity();
    }
    this.graphService.hms = this.generalForm.value.hms;
    this.graphService.maxIteration = this.generalForm.value.maxIteration;
    this.graphService.hmcr = this.generalForm.value.hmcr;
    this.graphService.par = this.generalForm.value.par;
    this.router.navigate(['']);
  }

  submitGeneralForm(): void {
    this.graphService.physics = this.generalForm.value.physics;
    this.graphService.stepByStepAlgorithm = this.generalForm.value.stepByStepAlgorithm;
    this.graphService.numOfTurnPerStep = this.generalForm.value.numOfTurnPerStep;
    this.graphService.timePerStep = this.generalForm.value.timePerStep;
    this.router.navigate(['']);
  }

  constructor(private graphService: GraphService, private fb: FormBuilder, private router: Router) {
  }

  ngOnInit(): void {
    this.hmForm = this.fb.group({
      hms: [this.graphService.hms, [Validators.required]],
      maxIteration: [this.graphService.maxIteration, [Validators.required]],
      hmcr: [this.graphService.hmcr, [Validators.required]],
      par: [this.graphService.par, [Validators.required]],
      parMin: [this.graphService.par_min, [Validators.required]],
      parMax: [this.graphService.par_max, [Validators.required]],
    });
    this.generalForm = this.fb.group({
      physics : [this.graphService.physics, [Validators.required]],
      stepByStepAlgorithm: [this.graphService.stepByStepAlgorithm, [Validators.required]],
      timePerStep: [this.graphService.timePerStep, [Validators.required]],
      numOfTurnPerStep: [this.graphService.numOfTurnPerStep, [Validators.required]]
    });
  }

  ngOnDestroy() {

  }
}
